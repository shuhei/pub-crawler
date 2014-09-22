var exec = require('child_process').exec;
var util = require('util');
var Promise = require('es6-promise').Promise;
var Graph = require('./graph');

function execCommand(command, transform) {
  return new Promise(function(resolve, reject) {
    exec(command, function(err, stdout, stderr) {
      if (err) {
        var errorMessage = util.format('Failed to exec `%s`: %s', command, err.toString());
        reject(Error(errorMessage));
        return;
      }

      resolve(transform(stdout));
    });
  });
}

function getFormulae() {
  function parseOutput(output) {
    var lines = output.split(/\r?\n/).filter(Boolean);
    return lines.reduce(function(acc, line) {
      var fields = line.split(': ');
      var dependent = fields[0];
      var dependencies = (fields[1] || '').split(/\s+/).filter(Boolean);
      acc[dependent] = dependencies;
      return acc;
    }, {});
  }

  return execCommand('brew deps --installed', parseOutput);
}

function makeGraph(formulae) {
  return Object.keys(formulae).reduce(function(graph, dependent) {
    var dependencies = formulae[dependent];
    dependencies.forEach(function(dependency) {
      graph.addLink(dependent, dependency);
    });
    return graph;
  }, new Graph());
}

function getGraph() {
  return getFormulae().then(makeGraph);
}

module.exports = {
  getGraph: getGraph
};
