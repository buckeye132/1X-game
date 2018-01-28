var PROJECTILE_SPEED = 800;
var PROJECTILE_SCALE = 1;

function Projectile(id) {
  this.id = id;
}

Projectile.prototype.initializeSprite = function(x, y, direction, spriteIndex) {
  this.sprite = game.add.sprite(x, y, 'fireball_dino' + spriteIndex);

  game.physics.enable( [ this.sprite ], Phaser.Physics.ARCADE);
  this.sprite.body.collideWorldBounds = false;
  this.sprite.anchor.setTo(0.5, 0.5);
  this.sprite.body.allowGravity = false;

  this.sprite.scale.x = direction * PROJECTILE_SCALE;
  this.sprite.scale.y = PROJECTILE_SCALE;
  this.sprite.body.velocity.x = PROJECTILE_SPEED * direction;

  this.sprite.body.collideWorldBounds = true;
  this.sprite.body.onWorldBounds = new Phaser.Signal();
  this.sprite.body.onWorldBounds.add(function() {
    GameState.destroyProjectile(this.id, false);
  }, this);
}

Projectile.prototype.destroy = function() {
  this.sprite.destroy();
}
