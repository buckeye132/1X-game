var Client = {};
Client.socket = io.connect();

/* Outbound */
Client.requestId = function() {
  Client.socket.emit('get_id');
};

Client.sendPosition = function(character) {
  Client.socket.emit('move',
    {
       position: character.position(),
       animation: character.currentAnimation,
       scaleX: character.sprite.scale.x
     });
};

Client.shootProjectile = function(x, y, direction) {
  Client.socket.emit('report_projectile',
    {
    });
}

/* Inbound */
Client.socket.on('id', function(data) {
  console.log("Received ID from server: " + data.id);
  GameState.registerPlayerId(data.id, data.spriteIndex);
});

Client.socket.on('all_players', function(data) {
  GameState.updateAllPlayers(data);
});

Client.socket.on('new_projectile', function(data) {

});
