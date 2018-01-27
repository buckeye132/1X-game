var SPEED = 200;
var JUMP_FORCE = 400;
var SERVER_UPDATE_TIC = 100; // 30 Hz
var SMOOTH_FACTOR = 3;

function Character(id, game) {
  this.id = id;
  this.game = game;
}

/* SETUP AND TEARDOWN */
Character.prototype.initializeSprite = function(x, y, withGravity) {
  this.sprite = this.game.add.sprite(x, y, 'dino_sprite');
  game.physics.enable( [ this.sprite ], Phaser.Physics.ARCADE);
  this.sprite.body.collideWorldBounds = true;
  this.sprite.anchor.setTo(0.5, 0.5);
  this.sprite.body.allowGravity = withGravity;

  this.sprite.animations.add('walk',[3,4,5,6,7]);
  this.sprite.animations.add('stand',[0]);
  this.sprite.animations.add('jump',[7]);
  this.sprite.animations.add('hurt',[14,15,16]);
  this.sprite.animations.add('shoot',[17,18,17]);



  this.sprite.scale.x = 2;
  this.sprite.scale.y = 2;

}

Character.prototype.destroySprite = function() {
  this.sprite.destroy();
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
  this.sprite.animations.play('walk', 15, true);
  this.sprite.scale.x = -2;
}

Character.prototype.moveRight = function() {
  this.sprite.body.velocity.x = SPEED;
  this.sprite.animations.play('walk', 15, true);
  this.sprite.scale.x = 2;
}

Character.prototype.stopMove = function() {
  this.sprite.body.velocity.x = 0;
  this.sprite.animations.play('stand', 15, true);
}

Character.prototype.jump = function() {
  if (!this.isFalling()) {
    this.sprite.body.velocity.y = -JUMP_FORCE;
    this.sprite.animations.play('jump', 15, true);
  }
}

/* SERVER MOVEMENT INPUT */
Character.prototype.moveTo = function(x, y) {
  if (this.tween) {
    this.tween.stop();
    delete this.tween;
  }

  var targetX = ((x - this.x()) * SMOOTH_FACTOR) + this.x();
  var targetY = ((y - this.y()) * SMOOTH_FACTOR) + this.y();

  this.tween = this.game.add.tween(this.sprite);
  this.tween.to({x: targetX, y: targetY}, SERVER_UPDATE_TIC * SMOOTH_FACTOR);
  this.tween.start();
}
