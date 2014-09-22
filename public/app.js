(function() {
  var w = 960;
  var h = 600;

  var vis = d3.select('#vis')
    .attr('width', w)
    .attr('height', h);

  d3.json('/graph', function(graph) {
    var nodes = graph.nodes.map(function(name) {
      return { label: name };
    });
    var links = graph.links.map(function(link) {
      return {
        source: link[0],
        target: link[1],
        weight: 1
      };
    });
    draw(nodes, links);
  });

  function draw(nodes, links) {
    console.log(nodes);
    var force = d3.layout.force()
      .size([w, h])
      .nodes(nodes)
      .links(links)
      .gravity(1)
      .linkDistance(50)
      .charge(-500)
      .linkStrength(10);
    force.start();

    var link = vis.selectAll('line.link')
      .data(links)
    .enter()
      .append('svg:line')
      .attr('class', 'link')
      .attr('stroke', '#ccc');

    var node = vis.selectAll('g.node')
      .data(nodes)
    .enter()
      .append('svg:g')
      .attr('class', 'node');
    node.append('svg:circle')
      .attr('r', 5)
      .style('fill', '#555')
      .style('stroke', '#fff')
      .style('stroke-width', 3);
    node.call(force.drag);

    function updateNode() {
      this.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
      });
    }

    function updateLink() {
      this.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });
    }

    force.on('tick', function() {
      console.log('tick');
      node.call(updateNode);
      link.call(updateLink);
    });
  }
})();
