import {loader, autoDetectRenderer} from 'pixi.js';
import {noop as _noop} from 'lodash/util';
import levels from '../data/levels.json';
import Stage from './Stage';
import sound from'./Sound';

const BLUE_SKY_COLOR = 0x64b0ff;
const PINK_SKY_COLOR = 0xfbb4d4;
const SUCCESS_RATIO = 0.6;

class Game {
  /**
   * Game Constructor
   * @param opts
   * @param {String} opts.spritesheet Path to the spritesheet file that PIXI's loader should load
   * @returns {Game}
   */
  constructor(opts) {
    this.spritesheet = opts.spritesheet;
    this.loader = loader;
    this.renderer =  autoDetectRenderer(window.innerWidth, window.innerHeight, {
      backgroundColor: BLUE_SKY_COLOR
    });
    this.levelIndex = 0;

    this.waveEnding = false;
    this.quackingSoundId = null;
    this.levels = levels.normal;
    return this;
  }

  get ducksMissed() {
    return this.ducksMissedVal ? this.ducksMissedVal : 0;
  }

  set ducksMissed(val) {
    this.ducksMissedVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('ducksMissed')) {
        this.stage.hud.createTextureBasedCounter('ducksMissed', {
          texture: 'hud/score-live/0.png',
          spritesheet: this.spritesheet,
          location: Stage.missedDuckStatusBoxLocation()
        });
      }

      this.stage.hud.ducksMissed = val;
    }
  }

  get ducksShot() {
    return this.ducksShotVal ? this.ducksShotVal : 0;
  }

  set ducksShot(val) {
    this.ducksShotVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('ducksShot')) {
        this.stage.hud.createTextureBasedCounter('ducksShot', {
          texture: 'hud/score-dead/0.png',
          spritesheet: this.spritesheet,
          location: Stage.deadDuckStatusBoxLocation()
        });
      }

      this.stage.hud.ducksShot = val;
    }
  }
  /**
   * bullets - getter
   * @returns {Number}
   */
  get bullets() {
    return this.bulletVal ? this.bulletVal : 0;
  }

  /**
   * bullets - setter
   * Setter for the bullets property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying bullets, the property and a corresponding texture container
   * will be created in HUD.
   * @param {Number} val Number of bullets
   */
  set bullets(val) {
    this.bulletVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('bullets')) {
        this.stage.hud.createTextureBasedCounter('bullets', {
          texture: 'hud/bullet/0.png',
          spritesheet: this.spritesheet,
          location: Stage.bulletStatusBoxLocation()
        });
      }

      this.stage.hud.bullets = val;
    }

  }

  /**
   * score - getter
   * @returns {Number}
   */
  get score() {
    return this.scoreVal ? this.scoreVal : 0;
  }

  /**
   * score - setter
   * Setter for the score property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the score, the property and a corresponding text box
   * will be created in HUD.
   * @param {Number} val Score value to set
   */
  set score(val) {
    this.scoreVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('score')) {
        this.stage.hud.createTextBox('score', {
          style: {
            fontFamily: 'Arial',
            fontSize: '18px',
            align: 'left',
            fill: 'white'
          },
          location: Stage.scoreBoxLocation(),
          anchor: {
            x: 1,
            y: 0
          }
        });
      }

      this.stage.hud.score = val;
    }

  }

  /**
   * wave - get
   * @returns {Number}
   */
  get wave() {
    return this.waveVal ? this.waveVal : 0;
  }

  /**
   * wave - set
   * Setter for the wave property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the wave, the property and a corresponding text box
   * will be created in the HUD.
   * @param {Number} val
   */
  set wave(val) {
    this.waveVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('waveStatus')) {
        this.stage.hud.createTextBox('waveStatus', {
          style: {
            fontFamily: 'Arial',
            fontSize: '18px',
            align: 'left',
            fill: 'white'
          },
          location: Stage.waveStatusBoxLocation(),
          anchor: {
            x: 1,
            y: 1
          }
        });
      }

      if (!isNaN(val) && val > 0) {
        this.stage.hud.waveStatus = 'Wave ' + val + ' of ' + this.level.waves;
      } else {
        this.stage.hud.waveStatus = '';
      }
    }
  }

  /**
   * gameStatus - get
   * @returns {String}
   */
  get gameStatus() {
    return this.gameStatusVal ? this.gameStatusVal : '';
  }

  /**
   * gameStatus - set
   * @param {String} val
   */
  set gameStatus(val) {
    this.gameStatusVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('gameStatus')) {
        this.stage.hud.createTextBox('gameStatus', {
          style: {
            fontFamily: 'Arial',
            fontSize: '40px',
            align: 'left',
            fill: 'white'
          },
          location: Stage.gameStatusBoxLocation()
        });
      }

      this.stage.hud.gameStatus = val;
    }
  }

  load() {
    this.loader
      .add(this.spritesheet)
      .load(this.onLoad.bind(this));
  }

  onLoad() {
    document.body.appendChild(this.renderer.view);

    this.stage = new Stage({
      spritesheet: this.spritesheet
    });

    this.scaleToWindow();
    this.bindEvents();
    this.startLevel();
    this.animate();

  }

  bindEvents() {
    window.addEventListener('resize', this.scaleToWindow.bind(this));
  }

  scaleToWindow() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.stage.scaleToWindow();
  }

  startLevel() {
    this.level = this.levels[this.levelIndex];
    this.ducksShot = 0;
    this.ducksMissed = 0;
    this.wave = 0;

    this.gameStatus = this.level.title;
    this.stage.preLevelAnimation().then(() => {
      this.gameStatus = '';
      this.bindInteractions();
      this.startWave();
    });
  }

  startWave() {
    this.quackingSoundId = sound.play('quacking');
    this.wave += 1;
    this.waveStartTime = Date.now();
    this.bullets = this.level.bullets;
    this.ducksShotThisWave = 0;
    this.waveEnding = false;

    this.stage.addDucks(this.level.ducks, this.level.speed);
    this.bindInteractions();
  }

  endWave() {
    this.waveEnding = true;
    this.bullets = 0;
    sound.stop(this.quackingSoundId);
    if (this.stage.ducksAlive()) {
      this.ducksMissed += this.level.ducks - this.ducksShotThisWave;
      this.renderer.backgroundColor = PINK_SKY_COLOR;
      this.stage.flyAway().then(this.goToNextWave.bind(this));
    } else {
      this.stage.cleanUpDucks();
      this.goToNextWave();
    }
  }

  goToNextWave() {
    this.renderer.backgroundColor = BLUE_SKY_COLOR;
    if (this.level.waves === this.wave) {
      this.endLevel();
    } else {
      this.startWave();
    }
  }

  shouldWaveEnd() {
    // evaluate pre-requisites for a wave to end
    if (this.wave === 0 || this.waveEnding || this.stage.dogActive()) {
      return false;
    }

    return this.isWaveTimeUp() || (this.outOfAmmo() && this.stage.ducksAlive()) || !this.stage.ducksActive();
  }

  isWaveTimeUp() {
    return this.level ? this.waveElapsedTime() >= this.level.time : false;
  }

  waveElapsedTime() {
    return (Date.now() - this.waveStartTime) / 1000;
  }

  outOfAmmo() {
    return this.level && this.bullets === 0;
  }

  endLevel() {
    this.wave = 0;
    this.goToNextLevel();
  }

  goToNextLevel() {
    this.levelIndex++;
    if (!this.levelWon()) {
      this.loss();
    } else if (this.levelIndex < this.levels.length) {
      this.startLevel();
    } else {
      this.win();
    }
  }

  levelWon() {
    return this.ducksShot > SUCCESS_RATIO * this.level.ducks * this.level.waves;
  }

  win() {
    sound.play('champ');
    this.gameStatus = 'You Win!';
    this.showReplay(this.getScoreMessage());
  }

  loss() {
    sound.play('loserSound');
    this.gameStatus = 'You Lose!';
    this.showReplay(this.getScoreMessage());
  }

  getScoreMessage() {
      let scoreMessage;

      if (this.score === 9400) {
        scoreMessage = 'Flawless victory.';
      }

      if (this.score < 9400) {
        scoreMessage = 'Close to perfection.';
      }

      if (this.score <= 9000) {
        scoreMessage = 'Truly impressive score.';
      }

      if (this.score <= 8000) {
        scoreMessage = 'Solid score.'
      }

      if (this.score <= 6000) {
        scoreMessage = 'Yikes.';
      }

      return scoreMessage;
  }

  showReplay(replayText) {
      this.stage.hud.createTextBox('replayButton', {
          location: Stage.replayButtonLocation()
      });
    this.stage.hud.replayButton = replayText + ' Play Again?';
    this.bindInteractions();

  }

  handleClick(event) {
    let clickPoint = {
        x: event.data.global.x,
        y: event.data.global.y
    };

    if (!this.stage.hud.replayButton && !this.outOfAmmo()) {
      sound.play('gunSound');
      this.bullets -= 1;
      this.updateScore(this.stage.shotsFired(clickPoint));
    }

    if (this.stage.hud.replayButton && this.stage.clickedReplay(clickPoint)) {
      window.location.reload();
    }
  }

  updateScore(ducksShot) {
    this.ducksShot += ducksShot;
    this.ducksShotThisWave += ducksShot;
    this.score += ducksShot * this.level.pointsPerDuck;
  }

  bindInteractions() {
    this.stage.mousedown = this.stage.touchstart = this.handleClick.bind(this);
  }

  unbindInteractions() {
    this.stage.mousedown = this.stage.touchstart = _noop;
  }

  animate() {
    this.renderer.render(this.stage);

    if (this.shouldWaveEnd()) {
      this.unbindInteractions();
      this.endWave();
    }

    requestAnimationFrame(this.animate.bind(this));
  }
}

export default Game;
