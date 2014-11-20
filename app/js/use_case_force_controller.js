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
      .controller('UseCaseForceController', function () {
          /************************************************************************************************
           * Properties
           */
          this.artifactTypes = ['', 'Use Case', 'Entity', 'Control', 'UI Pattern', 'Navigation', 'Key Screen', 'Actor', 'Role']
          this.keywords = ['diagram', 'report', 'user', 'package:', 'auditing']

          this.width = Math.max(document.getElementById('view').offsetWidth, 960);
          this.height = optimalHeight();

          this.radius = Math.sqrt(this.width * this.height) / 20;
          this.charge = -1 * this.radius;

          this.nodes = [];
          this.links = [];

          /************************************************************************************************
           * d3js Properties
           */
          this.colors = d3.scale.category20();

          this.force = d3.layout.force()
                         .size([this.width, this.height])

          this.svg = d3.select(".view")
                       .append("g");

          this.background = this.svg
                                .append("rect")
                                .attr("class", "underlay")
                                .attr("width", this.width)
                                .attr("height", this.height);

          this.graphLayer = this.svg.append("g");

          this.d3zoom = d3.behavior.zoom()
                          .scaleExtent([.25, 8])

          this.svgLinkEnum = this.graphLayer.selectAll(".link"),
          this.svgNodeEnum = this.graphLayer.selectAll(".node");

          /************************************************************************************************
          * Methods
          */
          this.getNode = function (id) {
              return $.grep(this.nodes, function (x) { return x.id == id})[0]
          }

          this.chooseColor = function(d) {
              var index = this.artifactTypes.indexOf(d.type)
              if (index < 1) {
                  var s = d.name.toLowerCase().split(" ");
                  for (var i = 0; i < s.length && index <= 0; i++) {
                      index = this.keywords.indexOf(s[i])
                  }

                  index + this.artifactTypes.length
              }

              return this.colors(index);
          }

          this.onModelLoaded = function(data) {
              this.nodes = data.nodes.slice();
              this.links = data.links.slice();

              // Update some settings based on the size of the data set
              this.radius = Math.max(Math.sqrt(this.width * this.height) / (this.nodes.length * 2), this.radius);
              this.charge = -0.5 * this.nodes.length * this.radius

              this.applyFilter();
          }

          this.applyFilter = function () {
              var filterNodes = this.nodes;
              var filterLinks = [];

              for (var i = 0; i < this.links.length; i++) {
                  var link = this.links[i];
                  var s = this.getNode(link.source),
                      t = this.getNode(link.target)
                  filterLinks.push({ source: s, target: t });
              }

              this.updateGraph(filterNodes, filterLinks);
          }

          this.updateGraph = function (nodes, links) {
              // Restart the force layout.
              this.force
                  .nodes(nodes)
                  .links(links)
                  .linkDistance(3 * this.radius)
                  .charge(this.charge)
                  //.friction(0.99)
                  .gravity(0.25)
                  //.theta(0.1)
                  .alpha(0.2)
                  .start();

              // Update links.
              this.svgLinkEnum = this.svgLinkEnum.data(links, function (d) { return d.target.id; });

              this.svgLinkEnum.exit().remove();

              this.svgLinkEnum.enter()
                  .insert("line", ".node")
                  .attr("class", "link");

              // Update nodes.
              this.svgNodeEnum = this.svgNodeEnum.data(nodes, function (d) { return d.id; });

              this.svgNodeEnum.exit().remove();

              var nodeEnter = this.svgNodeEnum.enter().append("g")
                  .attr("class", "node")
                  .on("click", click)
                  .on("dblclick", dblclick)
                  .call(this.force.drag);

              var rx = this.radius * 1.3;
              var ry = this.radius * 0.8;

              nodeEnter.append("ellipse")
                  .attr("rx", function (d) { return rx; })
                  .attr("ry", function (d) { return ry })
                  .style("fill", this.chooseColor.bind(this))

              nodeEnter.append("text")
                  .attr("dy", ".35em")
                  .text(function (d) { return d.name; });
          }

          this.tick = function() {
              this.svgLinkEnum.attr("x1", function (d) { return d.source.x; })
                   .attr("y1", function (d) { return d.source.y; })
                   .attr("x2", function (d) { return d.target.x; })
                   .attr("y2", function (d) { return d.target.y; });

              this.svgNodeEnum.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
          }

          this.onZoom = function () {
              //
              this.graphLayer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
          }

          /************************************************************************************************
          * Initialize
          */

          this.d3zoom.on("zoom", this.onZoom.bind(this));

          this.force.drag().on("dragstart", dragstart);
          this.force.on("tick", this.tick.bind(this));

          this.background.call(this.d3zoom);


          $.ajax({
              url: 'data/uc.json'
          }).success(this.onModelLoaded.bind(this))
          .fail(function (data) {
             alert('doh');
          });
      });
})(window.angular);