var express = require('express');
var formulae = require('./formulae.js');

var app = express();
app.use(express.static(__dirname + '/public'));
app.get('/graph', function(req, res) {
  formulae.getGraph().then(function(graph) {
    res.send(JSON.stringify(graph));
  }, function(err) {
    res.status(500);
    res.send(err);
  });
});

var server = app.listen(5959, function() {
  console.log('Listening on port %d', server.address().port);
});
