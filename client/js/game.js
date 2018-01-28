var ALLOW_CONTROL_IN_AIR = false;

var GameState = {};

GameState.init = function() {
  game.stage.disableVisibilityChange = true;
};

GameState.preload = function() {
  game.load.image('simple_character', 'assets/sprites/simple_character.png');
  game.load.spritesheet('dino_sprite', 'assets/sprites/DinoSprites - vita.png', 24, 24, 24);
};

GameState.create = function() {
  // setup world
  game.stage.backgroundColor = '#000000';
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.arcade.gravity.y = 800;

  // keyboard input
  game.input.keyboard.addKeyCapture(Phaser.KeyCode.SPACEBAR);
  GameState.inputKeys = {
    left: game.input.keyboard.addKey(Phaser.KeyCode.A),
    right: game.input.keyboard.addKey(Phaser.KeyCode.D),
    attack: game.input.keyboard.addKey(Phaser.KeyCode.E),
    damage: game.input.keyboard.addKey(Phaser.KeyCode.Q),
    jump: game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR),
  };

  // create a map of other players
  GameState.remotePlayers = {};

  // register with server
  Client.requestId();
};

GameState.update = function() {
  // short circuit if we're not registered yet
  if (!GameState.playerId) return;

  //  movement input
  if (!GameState.player.isFalling() || ALLOW_CONTROL_IN_AIR) {
    if (GameState.inputKeys.left.isDown && !GameState.inputKeys.right.isDown) {
      GameState.player.moveLeft();
    } else if (!GameState.inputKeys.left.isDown && GameState.inputKeys.right.isDown) {
      GameState.player.moveRight();
    } else {
      GameState.player.stopMove();
    }
  }

  if (!GameState.inputKeys.left.isDown && GameState.inputKeys.attack.isDown) {
    GameState.player.attack();
  }

  if (!GameState.inputKeys.left.isDown && GameState.inputKeys.damage.isDown) {
    GameState.player.damage();
  }

  if (!GameState.player.isFalling()) {
    if(GameState.inputKeys.jump.isDown) {
      GameState.player.jump();
    }
  }

  // send position to server
  Client.sendPosition(GameState.player);
};

GameState.render = function() {
  if (!GameState.playerId) {
    game.debug.text('Waiting for server.');
  } else {
    game.debug.text('Pos: ' + GameState.player.x() + " " + GameState.player.y(), 50, 50);
    game.debug.text('ID: ' + GameState.playerId, 50, 75);
  }
};

GameState.registerPlayerId = function(id) {
  setupPlayerCharacter(id);
};

GameState.updateAllPlayers = function(playerMap) {
  if (!GameState.playerId) return;

  // remove the local player
  delete playerMap[GameState.playerId];

  // update position of players based on data from server
  Object.keys(playerMap).forEach(function(id) {
    // ignore players that haven't reported a position yet
    if (!playerMap[id].hasReported) return;

    // check if we're tracking this player
    if (!GameState.remotePlayers[id]) {
      // we don't know about this player yet, initialize it
      GameState.remotePlayers[id] = new Character(id, game);
      GameState.remotePlayers[id].initializeSprite(
        playerMap[id].x,
        playerMap[id].y,
        false);
    } else {
      // update player position
      GameState.remotePlayers[id].moveTo(playerMap[id].x, playerMap[id].y);
    }
  });

  // remove any players that are no longer in the game
  Object.keys(GameState.remotePlayers).forEach(function(id) {
    if (!playerMap[id]) {
      GameState.remotePlayers[id].destroySprite();
      delete GameState.remotePlayers[id];
    }
  });
};

/* Private Helpers */
setupPlayerCharacter = function(id) {
  if (!GameState.playerId) {
    GameState.playerId = id;
    GameState.player = new Character(id, game);
    GameState.player.initializeSprite(100, 100, true);
  } else {
    console.log("Duplicate setup player request");
  }
}
