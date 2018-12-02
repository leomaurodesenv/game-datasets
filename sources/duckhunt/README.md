# DUCK HUNT JS v3.0

[Play the game](http://duckhuntjs.com)

This is an implementation of DuckHunt in Javascript and HTML5. It uses the PixiJS rendering engine, Green Sock Animations, Howler, and Bluebird Promises.

## Rendering
This game supports WebGL and Canvas rendering via the PixiJS rendering engine.

## Audio
This game will attempt to use the WebAudioAPI and fallback to HTML5 Audio if necessary. Audio is loaded and controlled via HowlerJS.

## Tweening
The animations in this game are a combination of PixiJS MovieClips built from sprite images and tweens. Since PixiJS doesn't provide a tweening API, Green Sock was used.

## Game Logic
The flow of this game is managed using Javascript. The main chunks of business logic are implemented as ES6 classes which are transpiled to ES5 using Babel.

## Working With This Repo

 - You must have [nodejs](https://nodejs.org/) installed.
 - Clone the repo into a directory of your choice
 - `cd` into that directory and run `npm install`
 - Use `npm start` to start a local webserver which will make the site available at http://localhost:8080/. Cross origin errors prevent this project from being accessed in the browser with the `file://` protocol. This will also trigger automatic builds and reloads of the page when changes are detected in the `src` directory.
 - If you want to manually cut a build of the application code run `npm run build`
 - If you want to rebuild audio assets use `npm run audio`
 - If you want to rebuild image assets use `npm run images`

## Bugs
Please report bugs as [issues](https://github.com/MattSurabian/DuckHunt-JS/issues).

## Contributing
Pull requests are welcome! Please ensure code style and quality compliance with `npm run lint` and include any built files.