var ALLOW_CONTROL_IN_AIR = true;
var WORLD_WIDTH = 1000
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

  game.load.image('fireball_dino0', 'assets/sprites/fireball_vita.png')
  game.load.image('fireball_dino1', 'assets/sprites/fireball_tard.png')
  game.load.image('fireball_dino2', 'assets/sprites/fireball_mort.png')
  game.load.image('fireball_dino3', 'assets/sprites/fireball_doux.png')

  game.load.image('background', 'assets/sprites/background.png')
};

GameState.create = function() {
  // setup world
  var background = game.add.tileSprite(0,0,1000,5000,'background');

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

  // create a map of projectiles
  GameState.projectiles = {};

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

  // check for projectile hits
  Object.keys(GameState.projectiles).forEach(function(projectileId) {
      var projectile = GameState.projectiles[projectileId];
      if(!projectile.id.startsWith(GameState.playerId) &&
        game.physics.arcade.overlap(GameState.player.sprite, projectile.sprite)) {
        // hit
        console.log('hit');
        GameState.player.damage();
        GameState.destroyProjectile(projectile.id, true);
      }
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

GameState.spawnProjectile = function(id, x, y, direction, spriteIndex) {
  var projectile = new Projectile(id);
  projectile.initializeSprite(x, y, direction, spriteIndex);
  GameState.projectiles[id] = projectile;
}

GameState.destroyProjectile = function(id, shouldReport) {
  if (GameState.projectiles[id]) {
    GameState.projectiles[id].destroy();
    delete GameState.projectiles[id];
  }

  if (shouldReport) {
    Client.projectileHit(id);
  }
}

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

//---------------------------------------------------------------------------------//

  var platform = new Platform(game);
  platform.initializeSprite(175, 100, 5, 1); //x pos, y pos, w & h of platform - Starts at world top left
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(650, 100, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 200, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(275, 300, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 300, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(105, 400, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(805, 400, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 520, 6, 1);
  GameState.platforms.push(platform);

//---------------------------------------------------------------------------------//

  var platform = new Platform(game);
  platform.initializeSprite(175, 600, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(650, 600, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 700, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(275, 800, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 800, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(105, 900, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(805, 900, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 1020, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(175, 1100, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(650, 1100, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 1200, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(275, 1300, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 1300, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(105, 1400, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(805, 1400, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 1520, 6, 1);
  GameState.platforms.push(platform);

//------------ Beginning of the tower ------------------//

  var platform = new Platform(game);
  platform.initializeSprite(175, 1600, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(650, 1600, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 1700, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(275, 1800, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 1800, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 2020, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(305, 1900, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(605, 1900, 3, 1);
  GameState.platforms.push(platform);

  //--------//

 platform = new Platform(game);
  platform.initializeSprite(175, 2100, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(650, 2100, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 2200, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(275, 2300, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 2300, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(305, 2400, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(605, 2400, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 2520, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(175, 2600, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(650, 2600, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 2700, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(275, 2800, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 2800, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(305, 2900, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(605, 2900, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 3020, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(175, 3100, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(650, 3100, 5, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 3200, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(275, 3300, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 3300, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(305, 3400, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(605, 3400, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 3520, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(350, 3600, 2, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 3600, 2, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 3700, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(275, 3800, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 3800, 4, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(350, 3900, 2, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(600, 3900, 2, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 4020, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(350, 4150, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(550, 4150, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 4275, 6, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(105, 4325, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(805, 4325, 3, 1);
  GameState.platforms.push(platform);

  var platform = new Platform(game);
  platform.initializeSprite(400, 4446, 6, 1);
  GameState.platforms.push(platform);

}
