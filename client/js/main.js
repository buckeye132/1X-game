var game = new Phaser.Game(
  800, 600,
  Phaser.AUTO,
  document.getElementById('game'));

game.state.add('Game', GameState);
game.state.start('Game');
