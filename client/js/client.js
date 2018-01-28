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

Client.shootProjectile = function(id, x, y, direction, spriteIndex) {
  Client.socket.emit('report_projectile',
    {
      id: id,
      x: x,
      y: y,
      direction: direction,
      spriteIndex: spriteIndex
    });
}

Client.projectileHit = function(id) {
  Client.socket.emit('report_projectile_hit', {id: id});
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
  GameState.spawnProjectile(data.id, data.x, data.y, data.direction, data.spriteIndex);
});

Client.socket.on('destroy_projectile', function(data) {
  GameState.destroyProjectile(data.id, false);
});
