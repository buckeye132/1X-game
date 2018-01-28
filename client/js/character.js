var SPEED = 400;
var JUMP_FORCE = 850;
var SERVER_UPDATE_TIC = 100; // 30 Hz
var SMOOTH_FACTOR = 3;
var ATTACK_COOLDOWN = 650;

function Character(id, game) {
  this.id = id;
  this.game = game;
  this.lastAttackTime = 0;
  this.lockAnimation = false;
}

/* SETUP AND TEARDOWN */
Character.prototype.initializeSprite = function(x, y, withGravity, spriteIndex) {
  this.sprite = this.game.add.sprite(x, y, 'dino_sprite' + spriteIndex);
  game.physics.enable( [ this.sprite ], Phaser.Physics.ARCADE);
  this.sprite.body.collideWorldBounds = true;
  this.sprite.anchor.setTo(0.5, 0.5);
  this.sprite.body.allowGravity = withGravity;

  this.sprite.animations.add('walk',[3,4,5,6,7]);
  this.sprite.animations.add('stand',[0]);
  this.sprite.animations.add('jump',[7]);
  this.sprite.animations.add('damage',[14,15,16]);
  this.sprite.animations.add('attack',[24,25,26,27]);

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
  this.playAnimation('walk');
  this.sprite.scale.x = -2;
}

Character.prototype.moveRight = function() {
  this.sprite.body.velocity.x = SPEED;
  this.playAnimation('walk');
  this.sprite.scale.x = 2;
}

Character.prototype.stopMove = function() {
  this.sprite.body.velocity.x = 0;
  this.playAnimation('stand');
}

Character.prototype.attack = function() {
  var currentTime = new Date().getTime();
  if ((currentTime - this.lastAttackTime) >= ATTACK_COOLDOWN) {
    this.lastAttackTime = currentTime;
    this.playAnimation('attack');

    this.lockAnimation = true;
    setTimeout(function(self) {
      self.lockAnimation = false;
    }, 150, this);
  }
}

Character.prototype.damage = function() {
  this.playAnimation('damage');
}

Character.prototype.jump = function() {
  if (!this.isFalling()) {
    this.sprite.body.velocity.y = -JUMP_FORCE;
    this.playAnimation('jump');
  }
}

Character.prototype.playAnimation = function(name) {
  if (!this.lockAnimation) {
    this.currentAnimation = name;
    this.sprite.animations.play(name, 15, true);
  }
}

/* SERVER MOVEMENT INPUT */
Character.prototype.moveTo = function(x, y, animation, scaleX) {
  if (this.tween) {
    this.tween.stop();
    delete this.tween;
  }

  var targetX = ((x - this.x()) * SMOOTH_FACTOR) + this.x();
  var targetY = ((y - this.y()) * SMOOTH_FACTOR) + this.y();

  this.tween = this.game.add.tween(this.sprite);
  this.tween.to({x: targetX, y: targetY}, SERVER_UPDATE_TIC * SMOOTH_FACTOR);
  this.tween.start();

  this.playAnimation(animation);
  this.sprite.scale.x = scaleX;
}
