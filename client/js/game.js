var ALLOW_CONTROL_IN_AIR = true;
var WORLD_WIDTH = 800
var WORLD_HEIGHT = 5000;

var GameState = {};

GameState.init = function() {
  game.stage.disableVisibilityChange = true;
};

GameState.preload = function() {
  game.load.image('simple_character', 'assets/sprites/simple_character.png');
  game.load.spritesheet('platform_sprite', 'assets/sprites/platform_tilesheet.png', 32, 32);

  game.load.spritesheet('dino_sprite0', 'assets/sprites/DinoSprites - vita.png', 24, 18, 28);
  game.load.spritesheet('dino_sprite1', 'assets/sprites/DinoSprites - tard.png', 24, 18, 28);
  game.load.spritesheet('dino_sprite2', 'assets/sprites/DinoSprites - mort.png', 24, 18, 28);
  game.load.spritesheet('dino_sprite3', 'assets/sprites/DinoSprites - doux.png', 24, 18, 28);

  game.load.image('fireball_dino0', 'assets/sprites/fireball_doux.png')
  game.load.image('fireball_dino1', 'assets/sprites/fireball_mort.png')
  game.load.image('fireball_dino2', 'assets/sprites/fireball_tard.png')
  game.load.image('fireball_dino3', 'assets/sprites/fireball_vita.png')
};

GameState.create = function() {
  // setup world
  game.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  game.stage.backgroundColor = '#cccccc';
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.arcade.gravity.y = 2250;

  // keyboard input
  game.input.keyboard.addKeyCapture(Phaser.KeyCode.SPACEBAR);
  GameState.inputKeys = {
    left: game.input.keyboard.addKey(Phaser.KeyCode.A),
    right: game.input.keyboard.addKey(Phaser.KeyCode.D),
    attack: game.input.keyboard.addKey(Phaser.KeyCode.E),
    damage: game.input.keyboard.addKey(Phaser.KeyCode.Q),
    jump: game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR),
  };

  // setup platforms
  SetupPlatforms();

  // create a map of other players
  GameState.remotePlayers = {};

  // register with server
  Client.requestId();
};

GameState.update = function() {
  // short circuit if we're not registered yet
  if (!GameState.playerId) return;

  // perform collisions with platforms
  GameState.platforms.forEach(function(platform) {
    platform.sprites.forEach(function(platformSprite) {
      game.physics.arcade.collide(GameState.player.sprite, platformSprite);
    });
  });

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

  if (GameState.inputKeys.attack.isDown) {
    GameState.player.attack();
  }

  if (GameState.inputKeys.damage.isDown) {
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

GameState.registerPlayerId = function(id, spriteIndex) {
  setupPlayerCharacter(id, spriteIndex);
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
        false,
        playerMap[id].spriteIndex);
    } else {
      // update player position
      GameState.remotePlayers[id].moveTo(
        playerMap[id].x,
        playerMap[id].y,
        playerMap[id].animation,
        playerMap[id].scaleX);
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
setupPlayerCharacter = function(id, spriteIndex) {
  if (!GameState.playerId) {
    GameState.playerId = id;
    GameState.player = new Character(id, game);
    GameState.player.initializeSprite(Math.random()*WORLD_WIDTH, WORLD_HEIGHT - 48, true, spriteIndex);

    game.camera.follow(GameState.player.sprite, Phaser.Camera.FOLLOW_PLATFORMER);
  } else {
    console.log("Duplicate setup player request");
  }
}

SetupPlatforms = function(){
  GameState.platforms = [];

  var platform = new Platform(game);
  platform.initializeSprite(75, 100, 5, 1); //x pos, y pos, w & h of platform - Starts at world top left
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(550, 100, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(300, 175, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(175, 275, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(500, 275, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(0, 350, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(700, 350, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(300, 475, 6, 1);
  GameState.platforms.push(platform);


}
