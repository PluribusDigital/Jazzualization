(function (angular) {
    'use strict';

    angular.module('jazzualization', [])
      .controller('UseCaseForceController', ['$scope', '$http', '$location',
          function ($scope, $http, $location) {
              /************************************************************************************************
               * Properties
               */
              $scope.artifactTypes = ['Use Case Diagram', 'Use Case', 'Actor', 'Role', 'Navigation', 'Key Screen', 'Control', 'UI Pattern', 'System Interface', 'Entity', 'Requirement']
              $scope.tags = ['Application', 'Completion', 'Enumeration', 'Firefly', 'Global', 'Inspect', 'Schedule', 'HFIS', 'Oversight', 'OLTS', 'Partially Complete', 'Plan', 'Reference Data', 'ROE', 'ROP', 'Setup']
              $scope.legend = []

              $scope.width = window.layout.viewWidth();
              $scope.height = window.layout.viewHeight();

              $scope.radius = Math.sqrt($scope.width * $scope.height) / 20;
              $scope.charge = -1 * $scope.radius;

              $scope.nodes = [];
              $scope.links = [];

              $scope.filterArtifactTypes = [];
              $scope.filterTags = [];

              $scope.availableBooleanOperations = ['AND', 'OR'];
              $scope.artifactsTagsOperation = 'OR';

              $scope.highlight = 0;
              $scope.neighbors = {};

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

              /************************************************************************************************
              * Data Model Methods
              */
              $scope.loadData = function(url) {
                  $http.get(url).success($scope.onModelLoaded);
                  $scope.resetFilters();
              }

              $scope.neighboring = function(a, b) {
                  return $scope.neighbors[a.id + "," + b.id];
              }

              /************************************************************************************************
              * Commands
              */
              $scope.viewUseCases = function () {
                  $scope.loadData('data/uc1.json');
              }

              $scope.viewUserInterface = function () {
                  $scope.loadData('data/ui1.json');
              }

              $scope.viewDataModel = function () {
                  $scope.loadData('data/dm1.json');
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

              $scope.nodeOffset = function (d) {
                  var x0 = $scope.radius * -0.65;
                  var y0 = $scope.radius * -0.4;
                  return "translate(" + x0 + "," + y0 + ")";
              }

              $scope.nodeColor = function (d) {
                  var index = $scope.artifactTypes.indexOf(d.type)
                  return $scope.colors(index);
              }

              $scope.nodeKey = function (d) {
                  return d.id;
              }

              /************************************************************************************************
              * Layout Methods
              */
              $scope.getNode = function (id) {
                  // TODO: Improve on O(N)
                  for (var i = 0; i < $scope.nodes.length; i++) {
                      if ($scope.nodes[i].id == id)
                          return $scope.nodes[i];
                  }

                  return {};
              }

              $scope.resetFilters = function () {
                  $scope.filterArtifactTypes.splice(0, $scope.filterArtifactTypes.length);
                  $scope.filterTags.splice(0, $scope.filterTags.length);
              }

              $scope.onModelLoaded = function (data) {
                  $scope.nodes = data.nodes.slice();
                  $scope.links = data.links.slice();

                  // Rebuild neighbor array
                  $scope.neighbors = {};
                  $scope.nodes.forEach(function (d) {
                      $scope.neighbors[d.id + "," + d.id] = 1;
                  });
                  $scope.links.forEach(function (d) {
                      $scope.neighbors[d.source + "," + d.target] = 1;
                  });

                  // TODO: Dynamically build list of tags

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

                  // Prepare the filtering information
                  var filtersExist = $scope.filterArtifactTypes.length > 0 ||
                                     $scope.filterTags.length > 0;

                  // Add the filtered nodes
                  for (var n = 0; n < $scope.nodes.length; n++) {
                      var node = $scope.nodes[n];

                      if (filtersExist) {
                          var typeIndex = $scope.filterArtifactTypes.indexOf(node.type);

                          var tagIndex = -1;
                          for (var nt = 0; nt < node.tags.length && tagIndex < 0; nt++) {
                              tagIndex = $scope.filterTags.indexOf(node.tags[nt])
                          }

                          if( $scope.artifactsTagsOperation == 'OR' )
                              node.show = (typeIndex >= 0 || tagIndex >= 0);
                          else
                              node.show = (typeIndex >= 0 && tagIndex >= 0);
                      }
                      else {
                          node.show = true;
                      }

                      if (node.show) {
                          n0.push(node);
                      }
                  }

                  for (var i = 0; i < $scope.links.length; i++) {
                      var link = $scope.links[i];
                      var s = $scope.getNode(link.source),
                          t = $scope.getNode(link.target)

                      if (s.show && t.show) {
                          l0.push({ source: s, target: t });
                      }
                  }

                  $scope.updateGraph();
              }

              $scope.updateGraph = function () {
                  // Clear all nodes and links
                  $scope.graphLayer.selectAll("*").remove();

                  // Update links.
                  var lEnum = $scope.graphLayer.selectAll(".link").data($scope.force.links());
                  var lInserts = lEnum.enter();

                  // Update nodes.
                  var nEnum = $scope.graphLayer.selectAll(".node").data($scope.force.nodes(), $scope.nodeKey);
                  var nInserts = nEnum.enter();

                  lInserts.insert("line", ".node").attr("class", "link");

                  var nodeEnter = nInserts.append("g")
                      .attr("class", "node")
                      .on("click", $scope.onClick)
                      .on("dblclick", $scope.onDblClick)
                      .call($scope.force.drag);

                  //nodeEnter.append("rect")
                  //    .attr("width", $scope.nodeRX)
                  //    .attr("height", $scope.nodeRY)
                  //    .attr("transform", $scope.nodeOffset)
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

              /************************************************************************************************
              * Event Handlers
              */

              $scope.onTick = function () {
                  d3.selectAll(".link")
                      .attr("x1", function (d) { return d.source.x; })
                      .attr("y1", function (d) { return d.source.y; })
                      .attr("x2", function (d) { return d.target.x; })
                      .attr("y2", function (d) { return d.target.y; });

                  d3.selectAll("ellipse")
                      .attr("cx", function (d) { return d.x; })
                      .attr("cy", function (d) { return d.y; });

                  d3.selectAll(".node rect")
                      .attr("x", function (d) { return d.x; })
                      .attr("y", function (d) { return d.y; })

                  d3.selectAll("text")
                      .attr("x", function (d) { return d.x; })
                      .attr("y", function (d) { return d.y; })
              }

              $scope.onZoom = function () {
                  $scope.graphLayer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
              }

              $scope.onClick = function(d) {
                  if (d3.event.defaultPrevented) return; // ignore drag

                  $scope.onHighlightNeighbors(d);
              }

              $scope.onDblClick = function(d) {
                  d3.select(this).classed("fixed", d.fixed = false);
              }

              $scope.onDragStart = function(d) {
                  d3.select(this).classed("fixed", d.fixed = true);
              }

              $scope.onHighlightNeighbors = function (d) {
                  // Get the selecting enumerators
                  var node = d3.selectAll(".node");
                  var link = d3.selectAll(".link");

                  if ($scope.highlight == 0) {
                      //Reduce the opacity of all but the neighbouring nodes
                      node.style("opacity", function (o) {
                          return $scope.neighboring(d, o) | $scope.neighboring(o, d) ? 1 : 0.1;
                      });
                      link.style("opacity", function (o) {
                          return d.id == o.source.id | d.id == o.target.id ? 1 : 0.1;
                      });

                      // Flip the switch
                      $scope.highlight = 1;

                  } else {
                      //Put back to opacity=1
                      node.style("opacity", 1);
                      link.style("opacity", 1);
                      $scope.highlight = 0;
                  }
              }

              /************************************************************************************************
              * Initialize
              */
              // Register event handlers
              $scope.d3zoom.on("zoom", $scope.onZoom);
              $scope.force.drag().on("dragstart", $scope.onDragStart);
              $scope.force.on("tick", $scope.onTick);

              // Start listening for zoom events
              $scope.background.call($scope.d3zoom);

              // Initialize the color/legend
              for (var i = 0; i < $scope.artifactTypes.length; i++) {
                  $scope.legend.push({ 'name': $scope.artifactTypes[i], 'color': $scope.colors(i) });
              }
              $scope.legend.push({ 'name': '--unknown--', 'color': $scope.colors(-1) });

              // Load the first file
              $scope.loadData('data/les_miz.json');
          }]);
})(window.angular);