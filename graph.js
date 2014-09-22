function Graph() {
  this.nodes = [];
  this.links = [];
}

Graph.prototype.addNode = function(node) {
  var index = this.nodes.indexOf(node);
  if (index === -1) {
    index = this.nodes.length;
    this.nodes.push(node);
  }
  return index;
};

Graph.prototype.addLink = function(source, destination) {
  var sourceIndex = this.addNode(source);
  var destinationIndex = this.addNode(destination);
  this.links.push([sourceIndex, destinationIndex]);
};

module.exports = Graph;
