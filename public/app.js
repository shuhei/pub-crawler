(function() {
  var w = 1200;
  var h = 1000;

  var vis = d3.select('#vis')
    .attr('width', w)
    .attr('height', h);

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
      .charge(-2000)
      .linkStrength(10);
    force.start();

    var link = vis.selectAll('line.link')
      .data(links)
    .enter()
      .append('svg:line');
    link.call(updateLinkClass);

    function nodeClass(d) {
      if (!d.isDepended) { return 'top-level'; }
      if (!d.isDepending) { return 'independent'; }
      return 'normal';
    }

    function findRelated(startNode) {
      // TODO: Use non-recursive way.
      function find(result, node) {
        links.forEach(function(link) {
          // Search downstream.
          if (link.source.index === node.index && result.indexOf(link.target.index) < 0) {
            result.push(link.target.index);
            find(result, link.target);
          }
          // TODO: Search upstream too.
        });
      }
      var result = [startNode.index];
      find(result, startNode);
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
    });
    node.on('mouseup', function(d) {
      selectedNodes = null;
      node.call(updateNodeClass);
      link.call(updateLinkClass);
    });
    node.on('mouseout', function(d) {
      selectedNodes = null;
      node.call(updateNodeClass);
      link.call(updateLinkClass);
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
    anchorNode.append('svg:text')
      .text(function(d, i) {
        return i % 2 === 0 ? '' : d.node.label;
      })
      .style('font-size', 10);

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

    function translate(x, y) {
      return 'translate(' + x + ',' + y + ')';
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
