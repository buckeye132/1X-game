var PROJECTILE_SPEED = 800;

function Projectile() {

}

Projectile.prototype.initializeSprite = function(x, y, direction) {
  this.sprite = this.game.add.sprite(x, y, 'fireball');
  game.physics.enable( [ this.sprite ], Phaser.Physics.ARCADE);
  this.sprite.body.collideWorldBounds = false;
  this.sprite.anchor.setTo(0.5, 0.5);
  this.sprite.body.allowGravity = false;

  this.sprite.body.velocity = PROJECTILE_SPEED * direction;
}
