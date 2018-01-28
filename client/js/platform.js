var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

function Platform(game) {
  this.game = game;
}

Platform.prototype.initializeSprite = function(x, y, w, h) {
  this.sprites = [];

  var relY = WORLD_HEIGHT - (TILE_HEIGHT * h) - y;

  for (var row = 0; row < h; row++) {
    for (var col = 0; col < w; col++) {
      var offset = 3;
      if (row == 0) offset = 0;
      else if (row == h-1) offset = 6;

      var frame = 1 + offset;
      if (w == 1) frame = 1 + offset;
      else if (col == 0) frame = 0 + offset;
      else if (col == w-1) frame = 2 + offset;

      var posX = x + (col*TILE_WIDTH);
      var posY = relY + (row*TILE_HEIGHT)

      this.sprites.push(createSprite(this.game, posX, posY, 'platform_sprite', frame));
    }
  }
}

createSprite = function(game, x, y, key, frame) {
  var sprite = game.add.sprite(x, y, key, frame);
  game.physics.enable( [ sprite ], Phaser.Physics.ARCADE);
  sprite.body.checkCollision.down = false;
  sprite.body.checkCollision.left = false;
  sprite.body.checkCollision.right = false;
  sprite.body.immovable = true;
  sprite.body.allowGravity = false;
  return sprite;
}
