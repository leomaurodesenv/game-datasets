import {Container, Point, Text, loader, extras} from 'pixi.js';
import {assign as _extend} from 'lodash/object';

/**
 * Hud
 * The heads up display class, or Hud is an abstraction that aids in the creation
 * and visual updating of text boxes that display useful information to the
 * user as they play the game.
 *
 * The instantiator of this class is responsible for displaying it at the proper
 * depth in it's parent container.
 */
class Hud extends Container {
  constructor() {
    super();
  }

  /**
   * createTextBox
   * This method defines a property key on the Hud object that when modified
   * ensures the text box is visually updated. This is accomplished using ES6 getters
   * and setters.
   * @param name string - This name becomes a property key on the Hud object,
   *   modifying it will update the textBox automatically.
   * @param opts object - Object to convey style, location, anchor point, etc of the text box
   */
  createTextBox(name, opts) {
    // set defaults, and allow them to be overwritten
    const options = _extend({
      style: {
        fontFamily: 'Arial',
        fontSize: '18px',
        align: 'left',
        fill: 'white'
      },
      location: new Point(0, 0),
      anchor: {
        x: 0.5,
        y: 0.5
      }
    }, opts);

    this[name + 'TextBox'] = new Text('', options.style);
    const textBox = this[name + 'TextBox'];
    textBox.position.set(options.location.x, options.location.y);
    textBox.anchor.set(options.anchor.x, options.anchor.y);
    this.addChild(textBox);

    Object.defineProperty(this, name, {
      set: (val) => {
        textBox.text = val;
      },
      get: () => {
        return textBox.text;
      }
    });
  }

  createTextureBasedCounter(name, opts) {
    const options = _extend({
      texture: '',
      spritesheet: '',
      location: new Point(0, 0)
    }, opts);

    this[name + 'Container'] = new Container();
    const container = this[name + 'Container'];
    container.position.set(options.location.x, options.location.y);
    this.addChild(container);

    Object.defineProperty(this, name, {
      set: (val) => {
        const gameTextures = loader.resources[options.spritesheet].textures;
        const texture = gameTextures[options.texture];
        const childCount = container.children.length;
        if (childCount < val) {
          for (let i = childCount; i < val; i++) {
            const item = new extras.AnimatedSprite([texture]);
            item.position.set(item.width * i, 0);
            container.addChild(item);
          }
        } else if (val != childCount) {
          container.removeChildren(val, childCount);
        }
      }
    });
  }
}

export default Hud;
