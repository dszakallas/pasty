
express   = require 'express'
socketio  = require 'socket.io'
http      = require 'http'
path      = require 'path'
config    = require 'config'
sjcl      = require 'sjcl'

#TODO Persist this
documents = {}

contentDir = path.join __dirname, config.get 'contentDir'
vendorDir = path.join __dirname, config.get 'vendorDir'
port = config.get 'port'

unique = ->
  sjcl.codec.base64url.fromBits sjcl.random.randomWords(2)



createPasty = (id, io) ->
  documents[id] = {}
  nsp = io.of("/#{id}")

  nsp.on 'connection', (socket) ->

    console.log "Client connected to /#{id}"
    
    socket.on 'disconnect', ->
      "Client disconnected from /#{id}"

    socket.on 'change', (message) ->
      console.log message
      socket.broadcast.emit('change', message)

  console.log "Created new document #{id}"

run = ->

  app = express()
  server = http.Server app
  io = socketio server

  app.post '/new/:id', (q, s) ->
    id = q.params.id
    if !documents[id] 
      createPasty id, io
      s.send id: id
    else
      s.status(400).send()


  app.post '/new', (q, s) ->
    id = unique()
    createPasty id, io
    s.send id: id

  app.head '/:id', (q,s) ->
    if documents[q.params.id]?
      s.status(200).send()
    else
      s.status(404).send()

  app.use '/', express.static(vendorDir), express.static(contentDir)

  server.listen port, ->
    console.log "listening on *:#{port}"

module.exports = run: run