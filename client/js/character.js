var SPEED = 200;
var JUMP_FORCE = 400;

function Character(id, game) {
  this.id = id;
  this.game = game;
}

Character.prototype.initializeSprite = function(x, y) {
  this.sprite = this.game.add.sprite(100, 96, 'simple_character');
  game.physics.enable( [ this.sprite ], Phaser.Physics.ARCADE);
  this.sprite.body.collideWorldBounds = true;
}

/* GETTERS */
Character.prototype.x = function() {
  return this.sprite.x;
}

Character.prototype.y = function() {
  return this.sprite.y;
}

Character.prototype.position = function() {
  return {x: this.x(), y: this.y()};
}

Character.prototype.isFalling = function() {
  return this.sprite.body.velocity.y != 0;
}

/* KEYBOARD MOVEMENT INPUT */
Character.prototype.moveLeft = function() {
  this.sprite.body.velocity.x = -SPEED;
}

Character.prototype.moveRight = function() {
  this.sprite.body.velocity.x = SPEED;
}

Character.prototype.stopMove = function() {
  this.sprite.body.velocity.x = 0;
}

Character.prototype.jump = function() {
  if (!this.isFalling()) {
    this.sprite.body.velocity.y = -JUMP_FORCE;
  }
}

/* SERVER MOVEMENT INPUT */
Character.prototype.moveTo = function(x, y) {
  this.sprite.x = x;
  this.sprite.y = y;
}
