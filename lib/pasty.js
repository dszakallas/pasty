(function() {
  var config, contentDir, createPasty, documents, express, http, path, port, run, sjcl, socketio, unique, vendorDir;

  express = require('express');

  socketio = require('socket.io');

  http = require('http');

  path = require('path');

  config = require('config');

  sjcl = require('sjcl');

  documents = {};

  contentDir = path.join(__dirname, config.get('contentDir'));

  vendorDir = path.join(__dirname, config.get('vendorDir'));

  port = config.get('port');

  unique = function() {
    return sjcl.codec.base64url.fromBits(sjcl.random.randomWords(2));
  };

  createPasty = function(id, io) {
    var nsp;
    documents[id] = {};
    nsp = io.of("/" + id);
    nsp.on('connection', function(socket) {
      console.log("Client connected to /" + id);
      socket.on('disconnect', function() {
        return "Client disconnected from /" + id;
      });
      return socket.on('change', function(message) {
        console.log(message);
        return socket.broadcast.emit('change', message);
      });
    });
    return console.log("Created new document " + id);
  };

  run = function() {
    var app, io, server;
    app = express();
    server = http.Server(app);
    io = socketio(server);
    app.post('/new/:id', function(q, s) {
      var id;
      id = q.params.id;
      if (!documents[id]) {
        createPasty(id, io);
        return s.send({
          id: id
        });
      } else {
        return s.status(400).send();
      }
    });
    app.post('/new', function(q, s) {
      var id;
      id = unique();
      createPasty(id, io);
      return s.send({
        id: id
      });
    });
    app.head('/:id', function(q, s) {
      if (documents[q.params.id] != null) {
        return s.status(200).send();
      } else {
        return s.status(404).send();
      }
    });
    app.use('/', express["static"](vendorDir), express["static"](contentDir));
    return server.listen(port, function() {
      return console.log("listening on *:" + port);
    });
  };

  module.exports = {
    run: run
  };

}).call(this);
