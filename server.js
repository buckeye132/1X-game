var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var uuid = require('uuid/v4');

/*
 * Express server
 */
app.get('/js/phaser.min.js', function(req, res) {
  res.sendFile(__dirname + '/node_modules/phaser/build/phaser.min.js')
});

// serve static content out of client directory
app.use('/', express.static(__dirname + '/client'));

// start listening, default port 2000
server.listen(process.env.PORT || 2000);
console.log("Server Started.");

/*
 * Game Server
 */
var playerMap = {};

io.on('connection',function(socket) {
  // initialze player with UUID
  socket.player = {
    id: uuid(),
    x: 0,
    y: 0,
    hasReported: false,
  };
  playerMap[socket.player.id] = socket.player;
  console.log("Player Joined: " + socket.player.id);
  console.log("Player Count: " + Object.keys(playerMap).length);

  socket.on('disconnect',function(){
    console.log("Player Left: " + socket.player.id);
    delete playerMap[socket.player.id];
    console.log("Player Count: " + Object.keys(playerMap).length);
  });

  socket.on('get_id', function() {
    // give the client its ID
    socket.emit('id', {id: socket.player.id});
  });

  socket.on('move', function(data) {
    socket.player.hasReported = true;
    socket.player.x = data.x;
    socket.player.y = data.y;
  });
});

// update at 10 Hz
setInterval(function() {
  // broadcast
  io.sockets.emit("all_players", playerMap);
}, 100);
