import {extras, loader} from 'pixi.js';
import {TimelineLite} from 'gsap';
import {find as _find} from 'lodash/collection';

class Character extends extras.AnimatedSprite {
  /**
   * Character Constructor
   * @param {String} spriteId The leading id of this Character's resources in the spritesheet
   * @param {String} spritesheet The object property to ask PIXI's resource loader for
   * @param {{name:String, animationSpeed:Number}[]} states The states that can be found in the spritesheet for the
   *   given sprite id.
   */
  constructor(spriteId, spritesheet, states) {
    const gameTextures = loader.resources[spritesheet].textures;
    for (const textureKey in gameTextures) {
      if (!gameTextures.hasOwnProperty(textureKey) || textureKey.indexOf(spriteId) === -1) {
        continue;
      }

      const parts = textureKey.split('/');
      parts.length -= 1; //truncate to remove media file

      const state = parts.join('/').replace(spriteId + '/', '');

      // Only add textures if the state is supported by the class
      const stateObj = _find(states, {name: state});
      if (!stateObj) {
        continue;
      }

      if (stateObj.hasOwnProperty('textures')) {
        stateObj.textures.push(gameTextures[textureKey]);
      } else {
        Object.defineProperty(stateObj, 'textures', {
          value: [gameTextures[textureKey]],
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }

    super(states[0].textures);
    this.states = states;
    this.animationSpeed = this.states[0].animationSpeed;
    this.timeline = new TimelineLite({
      autoRemoveChildren:true
    });
    return this;
  }

  /**
   * stopAndClearTimeline
   * Helper method that stops any existing animation where it is, and removes all other animations
   * that are scheduled to run in the Character's timeline.
   * @returns {Character}
   */
  stopAndClearTimeline() {
    this.timeline.pause();
    const timelineItem = this.timeline.getChildren();
    for (let i = 0; i < timelineItem.length; i++) {
      timelineItem[i].kill();
    }
    this.timeline.play();
    return this;
  }

  /**
   * isActive
   * Helper method that determines whether the Character's timeline is active
   * @returns {Boolean}
   */
  isActive() {
    return this.timeline.isActive();
  }

  /**
   * addToTimeline
   * Adds any valid item to the timeline, typically this will be a function or a tween
   * @param {Function|PIXI.Tween} item
   * @returns {Character}
   */
  addToTimeline(item) {
    this.timeline.add(item);
    return this;
  }

  /**
   * state - setter
   * Helper method that sets the state on the character and adjusts the object's texture if possible
   * @param {String} value Name of the state to set on the character which should match a texture
   *   specified in the spritesheet
   * @throws {Error} In order for a state to be set, a texture must be specified in the spritesheet
   */
  set state(value) {
    const stateObj = _find(this.states, {name: value});
    if (!stateObj) {
      throw new Error('The requested state (' + value + ') is not availble for this Character.');
    }
    this.stateVal = value;
    // animation is jacked when there's only one texture in latest pixi
    // this hack is gross, prolly better to render two identical frames
    // or fix general jank
    if (stateObj.textures.length === 1) {
      stateObj.textures = stateObj.textures.concat(stateObj.textures);
    }
    this.textures = stateObj.textures;
    this.animationSpeed = stateObj.animationSpeed;
    this.loop = stateObj.hasOwnProperty('loop') ? stateObj.loop : true;
    this.play();
  }

  /**
   * state - get
   * Helper methods that returns the existin
   * @returns {String}
   */
  get state() {
    return this.stateVal ? this.stateVal : '';
  }

}

export default Character;
