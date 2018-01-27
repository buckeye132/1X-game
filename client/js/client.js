var Client = {};
Client.socket = io.connect();

/* Outbound */
Client.requestId = function() {
  Client.socket.emit('get_id');
};

Client.sendPosition = function(character) {
  Client.socket.emit('move', character.position());
};

/* Inbound */
Client.socket.on('id', function(data) {
  console.log("Received ID from server: " + data.id);
  GameState.registerPlayerId(data.id);
});

Client.socket.on('all_players', function(data) {
  GameState.updateAllPlayers(data);
});
