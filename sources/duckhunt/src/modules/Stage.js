import {Point, Graphics, Container, loader, extras} from 'pixi.js';
import BPromise from 'bluebird';
import {some as _some} from 'lodash/collection';
import {delay as _delay} from 'lodash/function';
import Utils from '../libs/utils';
import Duck from './Duck';
import Dog from './Dog';
import Hud from './Hud';

const MAX_X = 800;
const MAX_Y = 600;

const DUCK_POINTS = {
  ORIGIN: new Point(MAX_X / 2, MAX_Y)
};
const DOG_POINTS = {
  DOWN: new Point(MAX_X / 2, MAX_Y),
  UP: new Point(MAX_X / 2, MAX_Y - 230),
  SNIFF_START: new Point(0, MAX_Y - 130),
  SNIFF_END: new Point(MAX_X / 2, MAX_Y - 130)
};
const HUD_LOCATIONS = {
  SCORE: new Point(MAX_X - 10, 10),
  WAVE_STATUS: new Point(MAX_X - 10, MAX_Y - 20),
  GAME_STATUS: new Point(MAX_X / 2, MAX_Y * 0.45),
  REPLAY_BUTTON: new Point(MAX_X / 2, MAX_Y * 0.56),
  BULLET_STATUS: new Point(10, 10),
  DEAD_DUCK_STATUS: new Point(10, MAX_Y * 0.91),
  MISSED_DUCK_STATUS: new Point(10, MAX_Y * 0.95)
};

const FLASH_MS = 60;
const FLASH_SCREEN = new Graphics();
FLASH_SCREEN.beginFill(0xFFFFFF);
FLASH_SCREEN.drawRect(0, 0, MAX_X, MAX_Y);
FLASH_SCREEN.endFill();
FLASH_SCREEN.position.x = 0;
FLASH_SCREEN.position.y = 0;

class Stage extends Container {

  /**
   * Stage Constructor
   * Container for the game
   * @param opts
   * @param opts.spritesheet - String representing the path to the spritesheet file
   */
  constructor(opts) {
    super();
    this.spritesheet = opts.spritesheet;
    this.interactive = true;
    this.ducks = [];
    this.dog = new Dog({
      spritesheet: opts.spritesheet,
      downPoint: DOG_POINTS.DOWN,
      upPoint: DOG_POINTS.UP
    });
    this.dog.visible = false;
    this.flashScreen = FLASH_SCREEN;
    this.flashScreen.visible = false;
    this.hud = new Hud();

    this._setStage();
    this.scaleToWindow();
  }

  static scoreBoxLocation() {
    return HUD_LOCATIONS.SCORE;
  }

  static waveStatusBoxLocation() {
    return HUD_LOCATIONS.WAVE_STATUS;
  }

  static gameStatusBoxLocation() {
    return HUD_LOCATIONS.GAME_STATUS;
  }

  static replayButtonLocation() {
    return HUD_LOCATIONS.REPLAY_BUTTON;
  }

  static bulletStatusBoxLocation() {
    return HUD_LOCATIONS.BULLET_STATUS;
  }

  static deadDuckStatusBoxLocation() {
    return HUD_LOCATIONS.DEAD_DUCK_STATUS;
  }

  static missedDuckStatusBoxLocation() {
    return HUD_LOCATIONS.MISSED_DUCK_STATUS;
  }
  /**
   * scaleToWindow
   * Helper method that scales the stage container to the window size
   */
  scaleToWindow() {
    this.scale.set(window.innerWidth / MAX_X, window.innerHeight / MAX_Y);
  }

  /**
   * _setStage
   * Private method that adds all of the main pieces to the scene
   * @returns {Stage}
   * @private
   */
  _setStage() {
    const background = new extras.AnimatedSprite([
      loader.resources[this.spritesheet].textures['scene/back/0.png']
    ]);
    background.position.set(0, 0);

    const tree = new extras.AnimatedSprite([loader.resources[this.spritesheet].textures['scene/tree/0.png']]);
    tree.position.set(100, 237);

    this.addChild(tree);
    this.addChild(background);
    this.addChild(this.dog);
    this.addChild(this.flashScreen);
    this.addChild(this.hud);

    return this;
  }

  /**
   * preLevelAnimation
   * Helper method that runs the level intro animation with the dog and returns a promise that resolves
   * when it's complete.
   * @returns {Promise}
   */
  preLevelAnimation() {
    return new BPromise((resolve) => {
      this.cleanUpDucks();

      const sniffOpts = {
        startPoint: DOG_POINTS.SNIFF_START,
        endPoint: DOG_POINTS.SNIFF_END
      };

      const findOpts = {
        onComplete: () => {
          this.setChildIndex(this.dog, 0);
          resolve();
        }
      };

      this.dog.sniff(sniffOpts).find(findOpts);
    });
  }

  /**
   * addDucks
   * Helper method that adds ducks to the container and causes them to fly around randomly.
   * @param {Number} numDucks - How many ducks to add to the stage
   * @param {Number} speed - Value from 0 (slow) to 10 (fast) that determines how fast the ducks will fly
   */
  addDucks(numDucks, speed) {
    for (let i = 0; i < numDucks; i++) {
      const duckColor = i % 2 === 0 ? 'red' : 'black';

      // Al was here.
      const newDuck = new Duck({
        spritesheet: this.spritesheet,
        colorProfile: duckColor,
        maxX: MAX_X,
        maxY: MAX_Y
      });
      newDuck.position.set(DUCK_POINTS.ORIGIN.x, DUCK_POINTS.ORIGIN.y);
      this.addChildAt(newDuck, 0);
      newDuck.randomFlight({
        speed
      });

      this.ducks.push(newDuck);
    }
  }

  /**
   * shotsFired
   * Click handler for the stage, scale's the location of the click to ensure coordinate system
   * alignment and then calculates if any of the ducks were hit and should be shot.
   * @param {{x:Number, y:Number}} clickPoint - Point where the container was clicked in real coordinates
   * @returns {Number} - The number of ducks hit with the shot
   */
  shotsFired(clickPoint) {
    // flash the screen
    this.flashScreen.visible = true;
    _delay(() => {
      this.flashScreen.visible = false;
    }, FLASH_MS);

    let ducksShot = 0;
    for (let i = 0; i < this.ducks.length; i++) {
      const duck = this.ducks[i];
      if (duck.alive && Utils.pointDistance(duck.position, this.getScaledClickLocation(clickPoint)) < 60) {
        ducksShot++;
        duck.shot();
        duck.timeline.add(() => {
          this.dog.retrieve();
        });
      }
    }
    return ducksShot;
  }

  clickedReplay(clickPoint) {
    return Utils.pointDistance(this.getScaledClickLocation(clickPoint), HUD_LOCATIONS.REPLAY_BUTTON) < 200;
  }

  getScaledClickLocation(clickPoint) {
    return {
      x: clickPoint.x / this.scale.x,
      y: clickPoint.y / this.scale.y
    };
  }
  /**
   * flyAway
   * Helper method that causes the sky to change color and the ducks to fly away
   * @returns {Promise} - This promise is resolved when all the ducks have flown away
   */
  flyAway() {
    this.dog.laugh();

    const duckPromises = [];

    for (let i = 0; i < this.ducks.length; i++) {
      const duck = this.ducks[i];
      if (duck.alive) {
        duckPromises.push(new BPromise((resolve) => {
          duck.stopAndClearTimeline();
          duck.flyTo({
            point: new Point(MAX_X / 2, -500),
            onComplete: resolve
          });
        }));
      }
    }

    return BPromise.all(duckPromises).then(this.cleanUpDucks.bind(this));
  }

  /**
   * cleanUpDucks
   * Helper that removes all ducks from the container and object
   */
  cleanUpDucks() {
    for (let i = 0; i < this.ducks.length; i++) {
      this.removeChild(this.ducks[i]);
    }
    this.ducks = [];
  }

  /**
   * ducksAlive
   * Helper that returns a boolean value depending on whether or not ducks are alive. The distinction
   * is that even dead ducks may be animating and still "active"
   * @returns {Boolean}
   */
  ducksAlive() {
    return _some(this.ducks, (duck) => {
      return duck.alive;
    });
  }

  /**
   * ducksActive
   * Helper that returns a boolean value depending on whether or not ducks are animating. Both live
   * and dead ducks may be animating.
   * @returns {Boolean}
   */
  ducksActive() {
    return _some(this.ducks, (duck) => {
      return duck.isActive();
    });
  }

  /**
   * dogActive
   * Helper proxy method that returns a boolean depending on whether the dog is animating
   * @returns {boolean}
   */
  dogActive() {
    return this.dog.isActive();
  }

  /**
   * isActive
   * High level helper to determine if things are animating on the stage
   * @returns {boolean|Boolean}
   */
  isActive() {
    return this.dogActive() || this.ducksAlive() || this.ducksActive();
  }
}

export default Stage;
