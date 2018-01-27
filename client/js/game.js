var GameState = {};

GameState.init = function() {
  game.stage.disableVisibilityChange = true;
};

GameState.preload = function() {
  game.load.image('simple_character', 'assets/sprites/simple_character.png');
};

GameState.create = function() {
  // setup world
  game.stage.backgroundColor = '#000000';
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.arcade.gravity.y = 800;

  // setup character
  GameState.playerSprite = game.add.sprite(100, 96, 'simple_character');
  game.physics.enable( [ GameState.playerSprite ], Phaser.Physics.ARCADE);
  GameState.playerSprite.body.collideWorldBounds = true;

  // keyboard input
  game.input.keyboard.addKeyCapture(Phaser.KeyCode.SPACEBAR);
  GameState.inputKeys = {
    left: game.input.keyboard.addKey(Phaser.KeyCode.A),
    right: game.input.keyboard.addKey(Phaser.KeyCode.D),
    jump: game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR),
  };
};

GameState.update = function() {
  // left / right input
  if (GameState.playerSprite.body.velocity.y == 0) {
    if (GameState.inputKeys.left.isDown && !GameState.inputKeys.right.isDown) {
      GameState.playerSprite.body.velocity.x = -200;
      Client.sendInput('left');
    } else if (!GameState.inputKeys.left.isDown && GameState.inputKeys.right.isDown) {
      GameState.playerSprite.body.velocity.x = 200;
      Client.sendInput('right');
    } else {
      GameState.playerSprite.body.velocity.x = 0;
      Client.sendInput('stop');
    }
  }

  // jump input
  if (GameState.inputKeys.jump.isDown && GameState.playerSprite.body.velocity.y == 0) {
    GameState.playerSprite.body.velocity.y = -400;
    Client.sendInput('jump');
  }
};

GameState.render = function() {
  game.debug.text('Player At: ' + GameState.playerSprite.x + " " + GameState.playerSprite.y, 50, 50);
};
