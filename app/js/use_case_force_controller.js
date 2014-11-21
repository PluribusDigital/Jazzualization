function optimalHeight() {
    var y1 = document.getElementById('header').offsetHeight;
    var y0 = window.innerHeight;
    return Math.max(y0 - y1, 600);
}

function click(d) {
    if (d3.event.defaultPrevented) return; // ignore drag
}

function dblclick(d) {
    d3.select(this).classed("fixed", d.fixed = false);
}

function dragstart(d) {
    d3.select(this).classed("fixed", d.fixed = true);
}

(function (angular) {
    'use strict';

    angular.module('jazzualization', [])
      .controller('UseCaseForceController', ['$scope', '$http', '$location',
          function ($scope, $http, $location) {
              /************************************************************************************************
               * Properties
               */
              $scope.artifactTypes = ['', 'Use Case', 'Entity', 'Control', 'UI Pattern', 'Navigation', 'Key Screen', 'Actor', 'Role']
              $scope.keywords = ['diagram', 'report', 'user', 'package:', 'auditing']

              $scope.width = Math.max(document.getElementById('view').offsetWidth, 960);
              $scope.height = optimalHeight();

              $scope.radius = Math.sqrt($scope.width * $scope.height) / 20;
              $scope.charge = -1 * $scope.radius;

              $scope.nodes = [];
              $scope.links = [];

              /************************************************************************************************
               * d3js Properties
               */
              $scope.colors = d3.scale.category20();

              $scope.force = d3.layout.force()
                             .size([$scope.width, $scope.height])

              $scope.svg = d3.select(".view")
                           .append("g");

              $scope.background = $scope.svg
                                    .append("rect")
                                    .attr("class", "underlay")
                                    .attr("width", $scope.width)
                                    .attr("height", $scope.height);

              $scope.graphLayer = $scope.svg.append("g");

              $scope.d3zoom = d3.behavior.zoom()
                              .scaleExtent([.25, 8])

              $scope.svgLinkEnum = $scope.graphLayer.selectAll(".link"),
              $scope.svgNodeEnum = $scope.graphLayer.selectAll(".node");

              /************************************************************************************************
              * Commands
              */
              $scope.viewUseCases = function () {
                  $http.get('data/uc.json').success($scope.onModelLoaded)
              }

              $scope.viewUserInterface = function () {
                  $http.get('data/ui.json').success($scope.onModelLoaded)
              }

              $scope.viewDataModel = function () {
                  $http.get('data/dm.json').success($scope.onModelLoaded)
              }

              /************************************************************************************************
              * Node Attribute Methods
              */
              $scope.nodeRX = function (d) {
                  return $scope.radius * 1.3;
              }

              $scope.nodeRY = function (d) {
                  return $scope.radius * 0.8;
              }

              $scope.nodeColor = function (d) {
                  var index = $scope.artifactTypes.indexOf(d.type)
                  if (index < 1) {
                      var s = d.name.toLowerCase().split(" ");
                      for (var i = 0; i < s.length && index <= 0; i++) {
                          index = $scope.keywords.indexOf(s[i])
                      }

                      index + $scope.artifactTypes.length
                  }

                  return $scope.colors(index);
              }

              $scope.nodeKey = function (d) {
                  return d.id;
              }

              /************************************************************************************************
              * Layout Methods
              */
              $scope.getNode = function (id) {
                  for (var i = 0; i < $scope.nodes.length; i++) {
                      if ($scope.nodes[i].id == id)
                          return $scope.nodes[i];
                  }

                  return {};
              }

              $scope.onModelLoaded = function (data) {
                  $scope.nodes = data.nodes.slice();
                  $scope.links = data.links.slice();

                  // Update some settings based on the size of the data set
                  $scope.radius = Math.max(Math.sqrt($scope.width * $scope.height) / ($scope.nodes.length * 2), $scope.radius);
                  $scope.charge = -0.5 * $scope.nodes.length * $scope.radius

                  $scope.applyFilter();
              }

              $scope.applyFilter = function () {
                  var n0 = $scope.force.nodes();
                  var l0 = $scope.force.links();

                  // Clear the links & nodes
                  l0.splice(0, l0.length);
                  n0.splice(0, n0.length);

                  // Add the filtered nodes
                  for (var n = 0; n < $scope.nodes.length; n++) {
                      n0.push($scope.nodes[n]);
                  }

                  for (var i = 0; i < $scope.links.length; i++) {
                      var link = $scope.links[i];
                      var s = $scope.getNode(link.source),
                          t = $scope.getNode(link.target)
                      l0.push({ source: s, target: t });
                  }

                  $scope.updateGraph();
              }

              $scope.updateGraph = function () {
                  // Update links.
                  //$scope.svgLinkEnum = $scope.svgLinkEnum.data($scope.force.links(), function (d) { return d.target.id; });
                  $scope.svgLinkEnum = $scope.svgLinkEnum.data($scope.force.links());
                  var lDeletes = $scope.svgLinkEnum.exit();
                  var lInserts = $scope.svgLinkEnum.enter();

                  lDeletes.remove();
                  lInserts.insert("line", ".node").attr("class", "link");

                  // Update nodes.
                  $scope.svgNodeEnum = $scope.svgNodeEnum.data($scope.force.nodes(), $scope.nodeKey);
                  var nDeletes = $scope.svgNodeEnum.exit();
                  var nInserts = $scope.svgNodeEnum.enter();

                  nDeletes.remove();

                  var nodeEnter = nInserts.append("g")
                      .attr("class", "node")
                      .on("click", click)
                      .on("dblclick", dblclick)
                      .call($scope.force.drag);

                  nodeEnter.append("ellipse")
                      .attr("rx", $scope.nodeRX)
                      .attr("ry", $scope.nodeRY)
                      .style("fill", $scope.nodeColor)

                  nodeEnter.append("text")
                      .attr("dy", ".35em")
                      .text(function (d) { return d.name; });

                  // Update the layout engine
                  $scope.updateLayout();
              }

              $scope.updateLayout = function () {
                  // Restart the force layout.
                  $scope.force
                      .linkDistance(3 * $scope.radius)
                      .charge($scope.charge)
                      //.friction(0.99)
                      .gravity(0.25)
                      //.theta(0.1)
                      .alpha(0.2)
                      .start();
              }

              $scope.tick = function () {
                  $scope.svgLinkEnum.attr("x1", function (d) { return d.source.x; })
                       .attr("y1", function (d) { return d.source.y; })
                       .attr("x2", function (d) { return d.target.x; })
                       .attr("y2", function (d) { return d.target.y; });

                  $scope.svgNodeEnum.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
              }

              $scope.onZoom = function () {
                  //
                  $scope.graphLayer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
              }

              /************************************************************************************************
              * Initialize
              */
              // Register event handlers
              $scope.d3zoom.on("zoom", $scope.onZoom);
              $scope.force.drag().on("dragstart", dragstart);
              $scope.force.on("tick", $scope.tick);

              // Start listening for zoom events
              $scope.background.call($scope.d3zoom);

              // Load the first file
              $scope.viewUseCases()
          }]);
})(window.angular);