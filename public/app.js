(function() {
  var w = 1200;
  var h = 1000;

  var vis = d3.select('#vis')
    .attr('width', w)
    .attr('height', h);

  // Build the arrow.
  vis.append('svg:defs').selectAll('marker')
    .data(['end'])
  .enter().append('marker')
    .attr('id', String)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

  var legend = d3.select('body').insert('ul', 'svg').attr('class', 'legend').selectAll('li')
    .data([
      { name: 'top-level', class: 'top-level' },
      { name: 'intermediate', class: 'normal' },
      { name: 'independent', class: 'independent' }
    ])
  .enter().append('li')
    .attr('class', function(d) { return 'legend-' + d.class });
  legend.append('svg')
    .attr('width', 14)
    .attr('height', 14)
  .append('svg:circle')
    .attr('cx', 7)
    .attr('cy', 7)
    .attr('r', 5);
  legend.append('span')
    .text(function(d) { return d.name; });

  function translate(x, y) {
    return 'translate(' + x + ',' + y + ')';
  }

  d3.json('/graph', function(graph) {
    var nodes = graph.nodes.map(function(name, i) {
      var isDepended = graph.links.filter(function(link) {
        return link[1] === i;
      }).length > 0;
      var isDepending = graph.links.filter(function(link) {
        return link[0] === i;
      }).length > 0;
      return {
        isDepended: isDepended,
        isDepending: isDepending,
        label: name
      };
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
    var selectedNodes = null;

    // Nodes
    var force = d3.layout.force()
      .size([w, h])
      .nodes(nodes)
      .links(links)
      .gravity(1)
      .linkDistance(70)
      .charge(-1700)
      .linkStrength(10);
    force.start();

    // Links
    var link = vis.selectAll('line.link')
      .data(links)
    .enter()
      .append('svg:line')
      .attr('marker-end', 'url(#end)');
    link.call(updateLinkClass);

    function nodeClass(d) {
      if (!d.isDepended) { return 'top-level'; }
      if (!d.isDepending) { return 'independent'; }
      return 'normal';
    }

    function findRelated(startNode) {
      var result = [startNode.index];

      // TODO: Use non-recursive way.
      function searchDownstream(node) {
        links.forEach(function(link) {
          if (link.source.index === node.index && result.indexOf(link.target.index) < 0) {
            result.push(link.target.index);
            searchDownstream(link.target);
          }
        });
      }
      function searchUpstream(node) {
        links.forEach(function(link) {
          if (link.target.index == node.index && result.indexOf(link.source.index) < 0) {
            result.push(link.source.index);
            searchUpstream(link.source);
          }
        });
      }

      searchDownstream(startNode);
      searchUpstream(startNode);

      return result;
    }

    var node = vis.selectAll('g.node')
      .data(nodes)
    .enter()
      .append('svg:g')
      .attr('class', 'node');
    node.append('svg:circle')
      .attr('r', 5);
    node.on('mousedown', function(d) {
      selectedNodes = findRelated(d);
      node.call(updateNodeClass);
      link.call(updateLinkClass);
      anchorText.call(updateTextClass);
    });
    d3.select(window).on('mouseup.drag-force', function(d) {
      selectedNodes = null;
      node.call(updateNodeClass);
      link.call(updateLinkClass);
      anchorText.call(updateTextClass);
    });
    node.call(force.drag);
    node.call(updateNodeClass);

    function updateSelected(index) {
      selectedNodes = [index];
    }

    // Anchors
    var anchors = nodes.reduce(function(acc, node) {
      acc.push({ node: node });
      acc.push({ node: node });
      return acc;
    }, []);

    var anchorLinks = nodes.map(function(node, i) {
      return {
        source: i * 2,
        target: i * 2 + 1,
        weight: 1
      };
    });

    var anchorForce = d3.layout.force()
      .nodes(anchors)
      .links(anchorLinks)
      .gravity(0)
      .linkDistance(0)
      .linkStrength(10)
      .charge(-10)
      .size([w, h]);
    anchorForce.start();

    var anchorNode = vis.selectAll('g.anchor-node')
      .data(anchors)
    .enter()
      .append('svg:g')
      .attr('class', 'anchor-node');
    anchorNode.append('svg:circle')
      .attr('r', 0)
      .style('fill', '#fff');
    var anchorText = anchorNode.append('svg:text')
      .text(function(d, i) {
        return i % 2 === 0 ? '' : d.node.label;
      })
      .style('font-size', 10);
    anchorText.call(updateTextClass);

    var anchorLink = vis.selectAll('line.anchor-link')
      .data(anchorLinks);

    function updateNodePosition() {
      this.attr('transform', function(d) {
        return translate(d.x, d.y);
      });
    }

    function updateLinkPosition() {
      this.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });
    }

    function layoutAnchorNodes() {
      anchorNode.each(function(d, i) {
        if (i % 2 === 0) {
          d.x = d.node.x;
          d.y = d.node.y;
        } else {
          var b = this.childNodes[1].getBBox();
          var diffX = d.x - d.node.x;
          var diffY = d.y - d.node.y;
          var dist = Math.sqrt(diffX * diffX + diffY *diffY);
          var shiftX = b.width * (diffX - dist) / (dist * 2);
          shiftX = Math.max(-b.width, Math.min(0, shiftX));
          var shiftY = 8;
          this.childNodes[1].setAttribute('transform', translate(shiftX, shiftY));
        }
      });
    }

    function updateNodeClass() {
      this.attr('class', function(d) {
        var isActive = !selectedNodes || selectedNodes.indexOf(d.index) >= 0;
        var result = isActive ? 'active ' : 'inactive ';
        return result + nodeClass(d);
      });
    }

    function updateLinkClass() {
      this.attr('class', function(d) {
        var isActive = !selectedNodes || (
          selectedNodes.indexOf(d.source.index) >= 0 &&
          selectedNodes.indexOf(d.target.index) >= 0
        );
        return 'link ' + (isActive ? 'active' : 'inactive');
      });
    }

    function updateTextClass() {
      this.attr('class', function(d) {
        var isActive = !selectedNodes || selectedNodes.indexOf(d.node.index) >= 0;
        var result = isActive ? 'active ' : 'inactive ';
        return result + nodeClass(d.node);
      });
    }

    force.on('tick', function() {
      anchorForce.start();

      node.call(updateNodePosition);
      anchorNode.call(updateNodePosition);

      layoutAnchorNodes();

      link.call(updateLinkPosition);
      anchorLink.call(updateLinkPosition);
    });
  }
})();
