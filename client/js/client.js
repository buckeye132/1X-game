var Client = {};
Client.socket = io.connect();

/* Outbound */
Client.registerPlayer = function(input) {
  Client.socket.emit('input', input);
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
