/**
 * Encapsulates the main logic of the Coil game.
 * Available under MIT license.
 * 
 * @author Hakim El Hattab (http://hakim.se)
 */
var Coil = (function(){
	
	// Target framerate 
	var FRAMERATE = 60;
		
	// Default dimensions of the world
	var DEFAULT_WIDTH = 900,
		DEFAULT_HEIGHT = 510;
	
	// Flags if the game should output debug information
	var DEBUG = URLUtil.queryValue('debug') == '1';

	var TOUCH_INPUT = navigator.userAgent.match( /(iPhone|iPad|iPod|Android)/i );
	
	// The number of enemies that may exist at the same time,
	// this scales depending on difficulty
	var ENEMY_COUNT = 2;
		ENEMY_SIZE = 10;
	
	// The height of the header / status bar
	var HEADER_HEIGHT = 30;
	
	var MENU_FADE_IN_DURATION = 600,
		MENU_FADE_OUT_DURATION = 600;
	
	var ENEMY_TYPE_NORMAL = 1,
		ENEMY_TYPE_BOMB = 2,
		ENEMY_TYPE_NORMAL_MOVER = 3,
		ENEMY_TYPE_BOMB_MOVER = 4;
	
	var ENEMY_MOVER_START_FRAME = FRAMERATE * 2;
	
	// Game states applied to the body so that elements can be 
	// toggled as needed in CSS
	var STATE_WELCOME = 'start',
		STATE_PLAYING = 'playing',
		STATE_LOSER = 'loser';
		STATE_WINNER = 'winner';
	
	// Scoring defaults (these may scale depending on difficulty)
	var SCORE_PER_ENEMY = 30,
		SCORE_PER_TICK = 0.01;
	
	var ENERGY_PER_ENEMY_DEATH = -30,
		ENERGY_PER_ENEMY_ENCLOSED = 1,
		ENERGY_PER_BOMB_ENCLOSED = -30;
	
	// The maximum score multiplier that may be reached
	var MULTIPLIER_LIMIT = 4;
	
	// The maximum number of simultaneous effects to run
	var NUMBER_OF_EFFECTS = 10;
	
	// The world dimensions
	var world = { 
		width: DEFAULT_WIDTH, 
		height: DEFAULT_HEIGHT 
	};
		
	// Mouse input tracking
	var mouse = {
		// The current position
		x: 0,
		y: 0,
		
		// The position previous to the current
		previousX: 0,
		previousY: 0,
		
		// The velocity, based on the difference between
		// the current and next positions
		velocityX: 0,
		velocityY: 0,
		
		// Flags if the mouse is currently pressed down
		down: false
	};
	
	var sprites = {
		bomb: null,
		enemy: null,
		enemyDyingA: null,
		enemyDyingB: null
	}
	
	var canvas,
		context,
		
		// WebGL canvas and context
		canvas3d,
		context3d,
		
		dirtyRegions = [],
		
		effectsEnabled = false,
		effectsShaderProgram,
		effectsVertices,
		effectsBuffer,
		effectsTexture,
		effectsTime = 0,
		
		// DOM elements
		container,
		menu,
		startButton,
		scorePanel,
		lagWarning,
		
		// The stack index for the current effect
		effectIndex = 0,
		
		// Game state
		playing = false,
		score = 0,
		duration = 0,
		difficulty = 1,
		multiplier = new Multiplier( 0.2, MULTIPLIER_LIMIT ),	
		
		// Scoring meta
		frameScore = 0,
		frameCount = 0,
		
		// Time tracking
		timeStart = Date.now(),
		timeLastFrame = Date.now(),
		timeLastSecond = Date.now(),
		timeGameStart = Date.now(),
		
		// Time values used to track performance on every frame
		timeDelta = 0,
		timeFactor = 0,
		
		// Performance (FPS) tracking
		fps = 0,
		fpsMin = 1000,
		fpsMax = 0,
		framesThisSecond = 0,
		
		// Game elements
		notifications = [],
		intersections = [],
		particles = [],
		enemies = [],
		effects = [],
		player;
	
	/**
	 * 
	 */
	function initialize() {
		// Run selectors and cache element references
		container = $( '#game' );
		menu = $( '#menu');
		canvas = document.querySelector( '#world' );
		canvas3d = document.querySelector( '#effects' );
		scorePanel = document.querySelector( '#score' );
		startButton = document.querySelector( '#start-button' );
		lagWarning = document.querySelector( '#lag-warning' );
		lagWarningAction = lagWarning.querySelector( 'a' );
		
		try {
			context3d = canvas3d.getContext("webgl") || canvas3d.getContext("experimental-webgl");
	    } catch(e) {}
		
		// Is WebGL supported?
	    if( !!context3d ) {
			activate3dEffects();
	    }
		
		if ( canvas && canvas.getContext ) {
			context = canvas.getContext('2d');
			
			// Bind event listeners
			startButton.addEventListener('click', onStartButtonClick, false);
			lagWarningAction.addEventListener('click', onLagWarningButtonClick, false);
			document.addEventListener('mousedown', onDocumentMouseDownHandler, false);
			document.addEventListener('mousemove', onDocumentMouseMoveHandler, false);
			document.addEventListener('mouseup', onDocumentMouseUpHandler, false);
			canvas.addEventListener('touchstart', onCanvasTouchStartHandler, false);
			canvas.addEventListener('touchmove', onCanvasTouchMoveHandler, false);
			canvas.addEventListener('touchend', onCanvasTouchEndHandler, false);
			window.addEventListener('resize', onWindowResizeHandler, false);
			
			// Force an initial layout
			onWindowResizeHandler();
			
			createSprites();
			createEffects();
			
			// Now that everything is laid out we can show the canvas & UI
			container.fadeIn( MENU_FADE_IN_DURATION );
			menu.hide().delay( MENU_FADE_IN_DURATION ).fadeIn( MENU_FADE_IN_DURATION );
			
			// Update the game state
			document.body.setAttribute( 'class', STATE_WELCOME );
			
			reset();
			update();
		}
		else {
			alert( 'Doesn\'t seem like your browser supports the HTML5 canvas element :(' );
		}
	   
	}
	
	function activate3dEffects() {
		context3d.clearColor(0.0, 0.0, 0.0, 0.0);
	    
		// Compile our shader program
		var vertexShader = $( '#vertexShader' ).text();
		var fragmentShader = $( '#fragmentShader' ).text();
		effectsShaderProgram = WebGLUtil.createShaderProgram( context3d, vertexShader, fragmentShader );
		
		// Define the plane vertices
		effectsVertices = new Float32Array([ -1.0, -1.0,   1.0, -1.0,    -1.0,  1.0,     1.0, -1.0,    1.0,  1.0,    -1.0,  1.0]);
		
		// Buffer our vertices
		effectsBuffer = context3d.createBuffer();
		context3d.bindBuffer( context3d.ARRAY_BUFFER, effectsBuffer );
		context3d.bufferData( context3d.ARRAY_BUFFER, effectsVertices, context3d.STATIC_DRAW );
		
		// Load the shader texture
		effectsTexture = WebGLUtil.loadTexture( context3d, 'images/texture.png', $.proxy( function() {
			
			// Bind the shader texture
			WebGLUtil.bindTexture( context3d, effectsTexture );
			
			// If the shader was linked successfully, we're all set to
			// render 3d effects
			if (context3d.getProgramParameter(effectsShaderProgram, context3d.LINK_STATUS)) {
				effectsEnabled = true;
				
				context3d.viewport( 0, 0, 1024, 1024 );
				context3d.useProgram( effectsShaderProgram );
				
				var t0 = context3d.getUniformLocation( effectsShaderProgram, "texture" );
				context3d.uniform1i( t0, 0 ); 
				context3d.activeTexture( context3d.TEXTURE0 ); 
				context3d.bindTexture( context3d.TEXTURE_2D, effectsTexture );
				
				canvas3d.style.display = 'block';
				
				// Forces the 3D canvas to resize
				onWindowResizeHandler();
			}
			else {
				effectsEnabled = false;
			}
		}, this ) );
		
	}
	
	function disable3dEffects() {
		lagWarning.style.display = 'none';
		
		effectsEnabled = false;
		effects = [];
		effectIndex = 0;
		
		canvas3d.style.display = 'none';
	}
	
	function showLagWarning() {
		if (effectsEnabled) {
			lagWarning.style.display = 'block';
		}
	}
	
	function createSprites() {
		var canvasWidth = 64,
			canvasHeight = 64,
			cvs,
			ctx;
		
		// Enemy Sprite
		cvs = document.createElement( 'canvas' );
		cvs.setAttribute( 'width', canvasWidth );
		cvs.setAttribute( 'height', canvasHeight );
		ctx = cvs.getContext('2d');
		ctx.beginPath();
		ctx.arc( canvasWidth * 0.5, canvasHeight * 0.5, ENEMY_SIZE, 0, Math.PI*2, true );
		ctx.lineWidth = 2;
		ctx.fillStyle = 'rgba(0,200,220, 0.9)';
		ctx.strokeStyle = 'rgba(255,255,255,0.4)'
		ctx.shadowColor = 'rgba(0,240,255,0.9)';
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 20;
		ctx.stroke();
		ctx.fill();
		
		sprites.enemy = cvs;
		
		
		// Enemy Dying (state A) Sprite
		cvs = document.createElement( 'canvas' );
		cvs.setAttribute( 'width', canvasWidth );
		cvs.setAttribute( 'height', canvasHeight );
		ctx = cvs.getContext('2d');
		ctx.beginPath();
		ctx.arc( canvasWidth * 0.5, canvasHeight * 0.5, ENEMY_SIZE * 1.4, 0, Math.PI*2, true );
		ctx.lineWidth = 2;
		ctx.fillStyle = 'rgba(190,220,90, 0.9)';
		ctx.strokeStyle = 'rgba(255,255,255,0.4)'
		ctx.shadowColor = 'rgba(220,240,150,0.9)';
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 20;
		ctx.stroke();
		ctx.fill();
		
		sprites.enemyDyingA = cvs;
		
		
		// Enemy Dying (state B) Sprite
		cvs = document.createElement( 'canvas' );
		cvs.setAttribute( 'width', canvasWidth );
		cvs.setAttribute( 'height', canvasHeight );
		ctx = cvs.getContext('2d');
		ctx.beginPath();
		ctx.arc( canvasWidth * 0.5, canvasHeight * 0.5, ENEMY_SIZE * 1.4, 0, Math.PI*2, true );
		ctx.lineWidth = 2;
		ctx.fillStyle = 'rgba(190,220,90, 0.9)';
		ctx.strokeStyle = 'rgba(255,255,255,0.4)'
		ctx.shadowColor = 'rgba(220,240,150,0.9)';
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 10;
		ctx.stroke();
		ctx.fill();
		
		sprites.enemyDyingB = cvs;
		
		
		// Bomb Sprite
		cvs = document.createElement( 'canvas' );
		cvs.setAttribute( 'width', canvasWidth );
		cvs.setAttribute( 'height', canvasHeight );
		ctx = cvs.getContext('2d');
		ctx.beginPath();
		ctx.arc( canvasWidth * 0.5, canvasHeight * 0.5, ENEMY_SIZE, 0, Math.PI*2, true );
		ctx.lineWidth = 2;
		ctx.fillStyle = 'rgba(220,50,50, 0.9)';
		ctx.strokeStyle = 'rgba(255,255,255,0.4)'
		ctx.shadowColor = "rgba(255,100,100,0.9)";
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 10;
		ctx.stroke();
		ctx.fill();
		
		sprites.bomb = cvs;
	}
	
	function createEffects() {
		while( effects.length < NUMBER_OF_EFFECTS ) {
			effects.push( new Effect( 0, 0, 0 ) );
		}
	}
	
	function start() {
		reset();
		
		timeStart = Date.now();
		timeLastFrame = timeStart;
		
		playing = true;
		
		menu.fadeOut( MENU_FADE_OUT_DURATION, function() {
			// Remove the header after the menu has appeared since
			// it will no longer be used
			$( 'h1', this ).remove();
		} );
		
		// Update the game state
		document.body.setAttribute( 'class', STATE_PLAYING );
		
	}
	
	function stop() {
		scorePanel.style.display = 'block';
		scorePanel.querySelector( 'p' ).innerHTML = Math.floor( score );
		
		playing = false;
		menu.fadeIn( MENU_FADE_IN_DURATION );
	}
	
	function reset() {
		player = new Player();
		player.x = mouse.x;
		player.y = mouse.y;
		
		notifications = [];
		intersections = [];
		particles = [];
		enemies = [];
		effects = [];
		
		score = 0;
		duration = 0;
		playing = false;
		difficulty = 1;
		effectIndex = 0;
		
		createEffects();
		
		multiplier.reset();
		
		frameCount = 0;
		frameScore = 0;
		
		timeStart = 0;
		timeLastFrame = 0;
	}
	
	function emitParticles( color, x, y, speed, quantity ) {
		while( quantity-- ) {
			particles.push( new Particle( x, y, speed, color ) );
		}
	}
	
	function emitEffect( x, y ) {
		if (effectsEnabled) {
			effectIndex++;
			
			if (effectIndex >= NUMBER_OF_EFFECTS) {
				effectIndex = 0;
			}
			
			effects[effectIndex].x = x;
			effects[effectIndex].y = y;
			effects[effectIndex].time = 0;
			effects[effectIndex].alive = true;
		}
	}
	
	function notify( text, x, y, scale, rgb ) {
		notifications.push( new Notification( text, x, y, scale, rgb ) );
	}
	
	function invalidate( x, y, width, height ) {
		dirtyRegions.push( {
			x: x,
			y: y,
			width: width,
			height: height
		} );
	}
	
	function adjustScore( offset ) {
		var multipliedOffset = 0;
		
		if( playing ) {
			multipliedOffset = offset * multiplier.major;
			
			// Adjust the score, but scale the adjustment by a factor
			// of the framerate. This is done to avoid giving people
			// with low FPS an advantage.
			score += multipliedOffset * ( fps / FRAMERATE );
		}
		
		return multipliedOffset;
	}
	
	function update() {
		
		clear();
		
		// There are quite the few updates and renders that only need
		// to be carried out while the game is active
		if (playing) {
			context.save();
			context.globalCompositeOperation = 'lighter';
			
			updateMeta();
			updatePlayer();
			updateParticles();
			
			findIntersections();
			solveIntersections();
			
			renderPlayer();
			
			updateEnemies();
			renderEnemies();
			renderParticles();
			
			context.restore();
			
			renderNotifications();
		}
		
		if( effectsEnabled ) {
			updateEffects();
			
			if (frameCount % 2 == 0) {
				renderEffects();
			}
		}
		
		// After the user has started his first game, this will never
		// go back to being 0
		if( score !== 0 ) {
			renderHeader();
		}
		
		if( DEBUG ) {
			debug();
		}
		
		requestAnimFrame( update );
	}
	
	function clear() {
		var i = dirtyRegions.length;
		
		while( i-- ) {
			var r = dirtyRegions[i];
			context.clearRect( Math.floor( r.x ), Math.floor( r.y ), Math.ceil( r.width ), Math.ceil( r.height ) );
		}
		
		dirtyRegions = [];
	}
	
	function debug() {
		var i = dirtyRegions.length;
		
		while( i-- ) {
			var r = dirtyRegions[i];
			context.fillStyle = 'rgba(0,255,0,0.2)';
			context.fillRect( Math.floor( r.x ), Math.floor( r.y ), Math.ceil( r.width ), Math.ceil( r.height ) );
		}
	}
	
	function findIntersections() {
		var i = player.trail.length;
		
		var candidates = [];
		
		while( i-- ) {
			var j = player.trail.length;
			
			var p1 = player.trail[i];
			var p2 = player.trail[i+1];
			
			while( j-- ) {
				
				if ( Math.abs(i-j) > 1 ) {
					var p3 = player.trail[j];
					var p4 = player.trail[j + 1];
					
					if (p1 && p2 && p3 && p4) {
						var intersection = findLineIntersection(p1, p2, p3, p4);
						if ( intersection ) {
							candidates.push( [ Math.min(i,j), Math.max(i,j), intersection ] );
						}
					}
				}
				
			}
		}
		
		intersections = [];
		
		// Remove duplicates
		while( candidates.length ) {
			var i = intersections.length;
			
			var candidate = candidates.pop();
			
			while( i-- ) {
				if( candidate && intersections[i] && candidate[0] === intersections[i][0] && candidate[1] === intersections[i][1] ) {
					candidate = null;
				}
			}
			
			if( candidate ) {
				intersections.push(candidate);
			}
		}
	}
	
	function solveIntersections() {
		
		while( intersections.length ) {
			var ix = intersections.pop();
			
			// Begin the trail path
			context.beginPath();
			
			var points = player.trail.slice( ix[0], ix[1] );
			points[0] = ix[2];
			points.push( ix[2] );
			
			var bounds = new Region();
			
			for( var i = 0, len = points.length; i < len; i++ ) {
				var p1 = points[i];
				var p2 = points[i+1];
				
				if( i === 0 ) {
					// This is the first loop, so we need to start by moving into position
					context.moveTo( p1.x, p1.y );
				}
				else if( p1 && p2 ) {
					// Draw a curve between the current and next trail point
					context.quadraticCurveTo( p1.x, p1.y, p1.x + ( p2.x - p1.x ) / 2, p1.y + ( p2.y - p1.y ) / 2 );
				}
				
				bounds.inflate( p1.x, p1.y );
			}
			
			var center = bounds.center();
			
			// Solid fill, faster
			// context.fillStyle = 'rgba(0,255,255,0.2)';
			// context.closePath();
			
			// Gradient fill, prettier
			var gradient = context.createRadialGradient( center.x, center.y, 0, center.x, center.y, bounds.size() );
			gradient.addColorStop(1,'rgba(0, 255, 255, 0.0)');
			gradient.addColorStop(0,'rgba(0, 255, 255, 0.2)');
			context.fillStyle = gradient;
			context.closePath();
			
			context.fill();
			
		}
		
		// Only check for collisions every third frame to reduce lag
		if ( frameCount % 2 == 1 ) {
			
			var bmp = context.getImageData(0, 0, world.width, world.height);
			var bmpw = bmp.width;
			var pixels = bmp.data;
			
			var casualties = [];
			
			var i = enemies.length;
			
			while (i--) {
				var enemy = enemies[i];
				
				var ex = Math.round( enemy.x );
				var ey = Math.round( enemy.y );
				
				var indices = [	
					((ey * bmpw) + Math.round(ex - ENEMY_SIZE)) * 4, 
					((ey * bmpw) + Math.round(ex + ENEMY_SIZE)) * 4, 
					((Math.round(ey - ENEMY_SIZE) * bmpw) + ex) * 4, 
					((Math.round(ey + ENEMY_SIZE) * bmpw) + ex) * 4
				];
				
				var j = indices.length;
				
				while (j--) {
					var index = indices[j];
					
					if (pixels[index + 1] === 255 && pixels[index + 2] === 255) {
					
						if (enemy.type === ENEMY_TYPE_BOMB || enemy.type === ENEMY_TYPE_BOMB_MOVER) {
							handleBombInClosure(enemy);
						}
						else {
							handleEnemyInClosure(enemy);
							
							casualties.push(enemy);
						}
						
						enemies.splice(i, 1);
						
						break;
					}
				}
			}
			
			// If more than one enemy was killed, show the multiplier
			if (casualties.length > 1) {
				// Increase the score exponential depending on the number of
				// casualties
				var scoreChange = adjustScore(casualties.length * SCORE_PER_ENEMY);
				
				notify(scoreChange, player.x, player.y - 10, casualties.length / 1.5, [250, 250, 100]);
			}
			
		}
	}
	
	function updateMeta() {
		// Fetch the current time for this frame
		var timeThisFrame = Date.now();
		
		// Increase the frame count
		framesThisSecond ++;
		
		// Check if a second has passed since the last time we updated the FPS
		if( timeThisFrame > timeLastSecond + 1000 ) {
			// Establish the current, minimum and maximum FPS
			fps = Math.min( Math.round( ( framesThisSecond * 1000 ) / ( timeThisFrame - timeLastSecond ) ), FRAMERATE );
			fpsMin = Math.min( fpsMin, fps );
			fpsMax = Math.max( fpsMax, fps );
			
			timeLastSecond = timeThisFrame;
			framesThisSecond = 0;
		}
		
		timeDelta = timeThisFrame - timeLastFrame;
		timeFactor = timeDelta / ( 1000 / FRAMERATE );
		
		// Increment the difficulty by a factor of the time
		// passed since the last rendered frame to ensure that
		// difficulty progresses at the same speed no matter what
		// FPS the game runs at
		difficulty += 0.002 * Math.max( timeFactor, 1 );
		adjustScore( 1 );
		
		frameCount ++;
		frameScore ++;
		
		duration = timeThisFrame - timeStart;
		
		timeLastFrame = timeThisFrame;
		
		if( frameCount > FRAMERATE * 6 && Math.round( ( fpsMin + fpsMax + fps ) / 3 ) < 30 ) {
			showLagWarning();
		}
	}
	
	function updatePlayer() {
		
		// Interpolate towards the mouse, results in smooth
		// movement
		player.interpolate( mouse.x, mouse.y, 0.4 );
		
		// Add points to the trail, if needed
		while( player.trail.length < player.length ) {
			player.trail.push( new Point( player.x, player.y ) );
		}
		
		// Remove the oldest point in the trail
		player.trail.shift();
		
		// No energy – no game
		if( player.energy === 0 ) {
			stop();
		}
		
	}
	
	function updateEnemies() {
		
		var enemy; 
		var padding = 60;
		
		var i = enemies.length;
		
		var numberOfBombs = 0;
		var numberOfMovers = 0;
		
		while (i--) {
			if( enemies[i].type === ENEMY_TYPE_BOMB ) {
				numberOfBombs++;
			}
		}
		
		var canAddBombs = numberOfBombs / enemies.length < 0.4;
		var canAddMovers = numberOfMovers / enemies.length < 0.3 && frameCount > ENEMY_MOVER_START_FRAME;
		
		i = Math.floor( ENEMY_COUNT + difficulty ) - enemies.length;
		
		while( i-- && Math.random() > 0.85 ) {
			
			var type = ENEMY_TYPE_NORMAL;

			if( canAddBombs ) {
				type = Math.random() > 0.5 ? ENEMY_TYPE_NORMAL : ENEMY_TYPE_BOMB;
			}
			
			enemy = new Enemy();
			enemy.x = padding + Math.round( Math.random() * ( world.width - padding - padding ) );
			enemy.y = padding + Math.round( Math.random() * ( world.height - padding - padding ) );
			enemy.type = type;
			
			enemies.push(enemy);
		}
		
		i = enemies.length;
		
		while( i-- ) {
			enemy = enemies[i];
			
			enemy.time = Math.min( enemy.time + ( 0.2 * timeFactor ), 100 );
			enemy.scale += ( ( enemy.scaleTarget - enemy.scale ) + 0.01 ) * 0.3;
			enemy.alpha += ( enemy.alphaTarget - enemy.alpha ) * 0.1;
			
			if( enemy.type === ENEMY_TYPE_BOMB_MOVER ||enemy.type === ENEMY_TYPE_NORMAL_MOVER ) {
				enemy.x += enemy.velocity.x;
				enemy.y += enemy.velocity.y;
				
				if( enemy.x < 0 || enemy.x > world.width - ENEMY_SIZE ) {
					enemy.velocity.x = -enemy.velocity.x;
				}
				else if( enemy.y < 0 || enemy.y > world.height - ENEMY_SIZE ) {
					enemy.velocity.y = -enemy.velocity.y;
				}
			}
			
			// If this enemy is alive but has reached the end of its life span
			if( enemy.alive && enemy.time === 100 ) {
				
				// Fade out bombs
				if ( enemy.type === ENEMY_TYPE_BOMB || enemy.type === ENEMY_TYPE_BOMB_MOVER ) {
					handleBombDeath( enemy );
				}
				else {
					handleEnemyDeath( enemy );
					enemies.splice(i,1);
				}
				
				enemy.alive = false;
				
			}
			
			// Remove any faded out bombs
			if( enemy.alive === false && enemy.alphaTarget === 0 && enemy.alpha < 0.05 ) {
				enemies.splice(i,1);
			}
			
		}
		
	}
	
	function updateParticles() {
		
		var i = particles.length;
		
		while( i-- ) {
			var particle = particles[i];
			
			particle.x += particle.velocity.x;
			particle.y += particle.velocity.y;
			
			particle.velocity.x *= 0.98;
			particle.velocity.y *= 0.98;
			
			if ( particle.fading === true ) {
				particle.alpha *= 0.92;
			}
			else if( Math.random() > 0.92 ) {
				particle.fading = true;
			}
			
			if( particle.alpha < 0.05 ) {
				particles.splice(i,1);
			}
		}
		
	}
	
	function updateEffects() {
		var i = effects.length;
		
		while( i-- ) {
			var effect = effects[i];
			
			if (effect.alive) {
				effect.time = Math.min( ( effect.time + 0.01 ) * ( 1 + ( 1 - effect.time ) ), 1 );
			}
			else {
				effect.time = Math.max( ( effect.time - 0.01 ) * 0.99, 0 );
			}
			
			if( effect.time === 1 ) {
				effect.alive = false;
			}
		}
	}
	
	function renderPlayer() {
		// Begin the trail path
		context.beginPath();
		
		var bounds = new Region();
		var i = player.trail.length;
		
		// Draw a curve through the tail
		for( var i = 0, len = player.trail.length; i < len; i++ ) {
			var p1 = player.trail[i];
			var p2 = player.trail[i+1];
			
			if( i === 0 ) {
				// This is the first loop, so we need to start by moving into position
				context.moveTo( p1.x + ( p2.x - p1.x ) / 2, p1.y + ( p2.y - p1.y ) / 2 );
			}
			else if( p2 ) {
				// Draw a curve between the current and next trail point
				context.quadraticCurveTo( p1.x, p1.y, p1.x + ( p2.x - p1.x ) / 2, p1.y + ( p2.y - p1.y ) / 2 );
			}
			
			bounds.inflate( p1.x, p1.y );
		}
		
		// Draw the trail stroke
		context.strokeStyle = '#648d93';
		context.lineWidth = 2;
		context.stroke();
		
		bounds.expand( 4, 4 );
		
		var boundsRect = bounds.toRectangle();
		
		invalidate( boundsRect.x, boundsRect.y, boundsRect.width, boundsRect.height );
	}
	
	function renderEnemies() {
		
		var i = enemies.length;
		
		while (i--) {
			var enemy = enemies[i];
			
			var sprite = null;
			
			// The if statements here determine which sprite that
			// will be used to represent this entity
			if (enemy.type === ENEMY_TYPE_BOMB || enemy.type === ENEMY_TYPE_BOMB_MOVER) {
				sprite = sprites.bomb;
			}
			else {
				sprite = sprites.enemy;
				
				// Are we in the dying phase?
				if (enemy.time > 65) {
					sprite = sprites.enemyDyingA;
					
					if (Math.round(enemy.time) % 2 == 0) {
						sprite = sprites.enemyDyingB;
					}
				}
			}
			
			context.save();
			context.globalAlpha = enemy.alpha;
			
			context.translate( Math.round( enemy.x ), Math.round( enemy.y ) );
			context.scale( enemy.scale, enemy.scale );
			context.drawImage( sprite, -Math.round( sprite.width/2 ), -Math.round( sprite.height/2 ) );
			
			context.restore();
			
			var sw = ( sprite.width * enemy.scale ) + 4;
			var sh = ( sprite.height * enemy.scale ) + 4;
			
			invalidate( enemy.x-(sw/2), enemy.y-(sw/2), sw, sh );
		}
	}
	
	function renderParticles() {
		
		var i = particles.length;
		
		while( i-- ) {
			var particle = particles[i];
			
			context.save();
			context.globalAlpha = particle.alpha;
			context.fillStyle = particle.color;
			context.fillRect( particle.x, particle.y, 1, 1 );
			context.restore();
			
			invalidate( particle.x - 2, particle.y - 2, 4, 4 );
		}
		
	}
	
	function renderNotifications() {
		var i = notifications.length;
		
		// Go through and draw all notification texts
		while( i-- ) {
			var p = notifications[i];
			
			// Make the text float upwards
			p.y -= 0.4;
			
			var r = 14 * p.scale;
			
			// Draw the notification
			context.save();
			context.font = 'bold ' + Math.round(12 * p.scale) + "px Arial";
			
			context.beginPath();
			context.fillStyle = 'rgba(0,0,0,'+(0.7 * p.alpha)+')';
			context.arc( p.x, p.y, r, 0, Math.PI*2, true );
			context.fill();
			
			context.fillStyle = "rgba( "+p.rgb[0]+", "+p.rgb[1]+", "+p.rgb[2]+", " + p.alpha + " )";
			context.fillText( p.text, p.x - ( context.measureText( p.text ).width * 0.5 ), p.y + (4 * p.scale) );
			context.restore();
			
			// Fade out
			p.alpha *= 1 - ( 0.08 * (1-((p.alpha-0.08)/1)) );
			
			// If the notifaction is faded out, remove it
			if( p.alpha < 0.05 ) {
				notifications.splice( i, 1 );
			}
			
			r += 2;
			
			invalidate( p.x - r, p.y - r, r*2, r*2 );
		}
	}
	
	function renderEffects() {
		effectsTime += 0.01;
		
		var l1 = context3d.getAttribLocation( effectsShaderProgram, "position" );
	    var l2 = context3d.getUniformLocation( effectsShaderProgram, "time" );
	    var l3 = context3d.getUniformLocation( effectsShaderProgram, "resolution" );
	    var l4 = context3d.getUniformLocation( effectsShaderProgram, "mouse" );
	    
		context3d.bindBuffer( context3d.ARRAY_BUFFER, effectsBuffer );
		
		context3d.uniform1f( l2, effectsTime );
	    context3d.uniform2f( l3, world.width, world.height );
	    context3d.uniform2f( l4, mouse.x, mouse.y );
		
		var i = NUMBER_OF_EFFECTS;
		
		while( i-- ) {
			var effect = effects[i];
			
			var pointer = context3d.getUniformLocation( effectsShaderProgram, "e" + i );
			context3d.uniform3f( pointer, effect.x, effect.y, effect.time );
		}
		
		context3d.vertexAttribPointer( l1, 2, context3d.FLOAT, false, 0, 0 );
	    context3d.enableVertexAttribArray( l1 );
		
		context3d.drawArrays(context3d.TRIANGLES, 0, 6);
    	context3d.disableVertexAttribArray(l1);
	}
	
	function renderHeader() {
		
		var padding = 10,
			energyBarHeight = 4,
			energyBarWidth = 100,
			ENERGY_LABEL = 'ENERGY:',
			MULTIPLIER_LABEL = 'MULTIPLIER:',
			TIME_LABEL = 'TIME:',
			SCORE_LABEL = 'SCORE:';
		
		player.animatedEnergy += ( player.energy - player.animatedEnergy ) * 0.2;
		
		context.fillStyle = 'rgba(0,0,0,0.5)';
		context.fillRect( 0, 0, world.width, HEADER_HEIGHT );
		
		context.save();
		context.translate( padding, padding );
		
			// Energy label
			context.font = "10px Arial";
			context.fillStyle = "#ffffff";
			context.fillText( ENERGY_LABEL, 0, 8 );
			context.translate( 56, 0 );
			
			// Energy bar 
			context.save();
			context.fillStyle = 'rgba(40,40,40,0.8)';
			context.fillRect( 0, 2, energyBarWidth, energyBarHeight );
			context.shadowOffsetX = 0;
			context.shadowOffsetY = 0;
			context.shadowBlur = 14;
			context.shadowColor = "rgba(0,240,255,0.9)";
			context.fillStyle = 'rgba(0,200,220, 0.8)';
			context.fillRect( 0, 2, ( player.animatedEnergy / 100 ) * energyBarWidth, energyBarHeight );
			context.restore();
			
			context.translate( 122, 0 );
			
			// Multiplier label
			context.font = "10px Arial";
			context.fillStyle = "#ffffff";
			context.fillText( MULTIPLIER_LABEL, 0, 8 );
			context.translate( 73, 0 );
			
			// Multiplier
			var i = MULTIPLIER_LIMIT - 1;
			
			while( i-- ) {
				context.save();
				context.beginPath();
				
				var x = 6 + ( i / MULTIPLIER_LIMIT ) * 80;
				var y = 5;
				var s = 6;
				
				context.fillStyle = 'rgba(40,40,40,0.8)';
				context.arc( x, y, s, 0, Math.PI*2, true );
				context.fill();
				
				if( i < multiplier.major ) {
					context.beginPath();
					context.shadowOffsetX = 0;
					context.shadowOffsetY = 0;
					context.shadowBlur = 14;
					context.shadowColor = "rgba(0,240,255,0.9)";
					context.fillStyle = 'rgba(0,200,220,0.8)';
					
					if (i < multiplier.major - 1) {
						// We're drawing a major (entirely filled) step
						context.arc( x, y, s, 0, Math.PI*2, true );
					}
					else {
						// We're drawing a minor (partly filled) step
						context.fillStyle = 'rgba(0,200,220,' + (0.8 * multiplier.minor) + ')';
						context.arc( x, y, s * multiplier.minor, 0, Math.PI*2, false );
					}
					
					context.fill();
				}
				
				context.restore();
			}
			
			context.translate( 73, 0 );
			
			// Time label
			context.font = "10px Arial";
			context.fillStyle = "#ffffff";
			context.fillText( TIME_LABEL, 0, 8 );
			
			// Time
			context.font = "bold 10px Arial";
			context.fillStyle = 'rgba(0,200,220, 0.8)';
			context.fillText( Math.round( duration / 1000 ) + 's', 35, 8 );
			
			context.translate( 65, 0 );
			
			// Score label
			context.font = "10px Arial";
			context.fillStyle = "#ffffff";
			context.fillText( SCORE_LABEL, 0, 8 );
			
			// Score
			context.font = "bold 10px Arial";
			context.fillStyle = 'rgba(0,200,220, 0.8)';
			context.fillText( Math.floor(score), 47, 8 );
			
		context.restore();
		
		invalidate( 0, 0, world.width, HEADER_HEIGHT + 5 );
	}
	
	/**
	 * Invoked when an enemy dies of age.
	 */
	function handleEnemyDeath( entity ) {
		player.adjustEnergy( ENERGY_PER_ENEMY_DEATH );
		multiplier.reset();
		
		emitParticles( '#eeeeee', entity.x, entity.y, 3, 15 );
		
		notify( ENERGY_PER_ENEMY_DEATH+'♥', entity.x, entity.y, 1.2, [230,90,90] );
		
		emitEffect( entity.x, entity.y );
	}
	
	/**
	 * Invoked when a bomb dies of age.
	 */
	function handleBombDeath( entity ) {
		entity.alphaTarget = 0;
		entity.scaleTarget = 0.01;
	}
	
	/**
	 * Invoked when an enemy has been enclosed.
	 */
	function handleEnemyInClosure( entity ) {
		player.adjustEnergy( ENERGY_PER_ENEMY_ENCLOSED );
		
		var mb = multiplier.major;
		multiplier.increase();
		
		// If the multiplier increased by one major point,
		// highlight this to the user
		if( multiplier.major > mb ) {
			notify( 'X' + multiplier.major, world.width/2, world.height/2, multiplier.major, [60,250,130] );
			emitEffect( world.width/2, world.height/2 );
		}
		
		emitParticles( '#eeeeee', entity.x, entity.y, 3, 6 );
		
		var scoreChange = adjustScore( SCORE_PER_ENEMY );
		
		notify( '' + Math.floor( scoreChange ), entity.x, entity.y );
		
		emitEffect( entity.x, entity.y );
	}
	
	/**
	 * Invoked when a bomb has been enclosed.
	 */
	function handleBombInClosure( entity ) {
		player.adjustEnergy( ENERGY_PER_BOMB_ENCLOSED );
		multiplier.reset();
		
		notify( ENERGY_PER_BOMB_ENCLOSED+'♥', entity.x, entity.y, 1.2, [230,90,90] );
		
		emitEffect( entity.x, entity.y );
	}
	
	function findLineIntersection( p1, p2, p3, p4 ) {
		var s1 = {
			x: p2.x - p1.x,
			y: p2.y - p1.y
		}
		
		var s2 = {
			x: p4.x - p3.x,
			y: p4.y - p3.y
		}
		
		var s = (-s1.y * (p1.x - p3.x) + s1.x * (p1.y - p3.y)) / (-s2.x * s1.y + s1.x * s2.y);
    	var t = ( s2.x * (p1.y - p3.y) - s2.y * (p1.x - p3.x)) / (-s2.x * s1.y + s1.x * s2.y);
		
		if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
			return {
				x: p1.x + ( t * s1.x ),
				y: p1.y + ( t * s1.y )
			};
		}
		
		return null;
	}
	
	function onStartButtonClick(event){
		start();
		event.preventDefault();
	}
	
	function onLagWarningButtonClick(event){
		disable3dEffects();
		event.preventDefault();
	}
	
	function onDocumentMouseDownHandler(event){
		mouse.down = true;
	}
	
	function onDocumentMouseMoveHandler(event){
		mouse.previousX = mouse.x;
		mouse.previousY = mouse.y;
		
		mouse.x = event.clientX - (window.innerWidth - world.width) * 0.5;
		mouse.y = event.clientY - (window.innerHeight - world.height) * 0.5;
		
		mouse.velocityX = Math.abs( mouse.x - mouse.previousX ) / world.width;
		mouse.velocityY = Math.abs( mouse.y - mouse.previousY ) / world.height;
	}
	
	function onDocumentMouseUpHandler(event) {
		mouse.down = false;
	}
	
	function onCanvasTouchStartHandler(event) {
		if(event.touches.length == 1) {
			event.preventDefault();
			
			mouse.x = event.touches[0].pageX - (window.innerWidth - world.width) * 0.5;
			mouse.y = event.touches[0].pageY - (window.innerHeight - world.height) * 0.5;
			
			mouse.down = true;
		}
	}
	
	function onCanvasTouchMoveHandler(event) {
		if(event.touches.length == 1) {
			event.preventDefault();

			mouse.x = event.touches[0].pageX - (window.innerWidth - world.width) * 0.5;
			mouse.y = event.touches[0].pageY - (window.innerHeight - world.height) * 0.5 - 20;
		}
	}
	
	function onCanvasTouchEndHandler(event) {
		mouse.down = false;
	}
	
	function onWindowResizeHandler() {
		// Update the game size
		world.width = TOUCH_INPUT ? window.innerWidth : DEFAULT_WIDTH;
		world.height = TOUCH_INPUT ? window.innerHeight : DEFAULT_HEIGHT;
		
		// Resize the container
		container.width( world.width );
		container.height( world.height );
		
		// Resize the canvas
		canvas.width = world.width;
		canvas.height = world.height;
		
		// Determine the x/y position of the canvas
		var cx = Math.max( (window.innerWidth - world.width) * 0.5, 1 );
		var cy = Math.max( (window.innerHeight - world.height) * 0.5, 1 );
		
		// Update the position of the canvas
		container.css( {
			left: cx,
			top: cy
		} );
		
		// Center the menu
		menu.css( {
			left: ( world.width - menu.width() ) / 2,
			top: ( world.height - menu.height() ) / 2
		} );
		
		// Update the WebGL canvas if it exists
		if( effectsEnabled ) {
			// Resize the canvas
			canvas3d.width = world.width;
			canvas3d.height = world.height;
			
			// Resize the GL viewport
			context3d.viewportWidth = world.width;
			context3d.viewportHeight = world.height;
		}
	}
	
	initialize();
	
})();


/**
 * Base class for all game entities.
 */
function Entity( x, y ) {
	this.alive = false;
}
Entity.prototype = new Point();

/**
 * Player entity.
 */
function Player() {
	this.trail = [];
	this.size = 8;
	this.length = 45;
	this.energy = 100;
	this.animatedEnergy = 0;
	
	this.adjustEnergy = function( offset ) {
		this.energy = Math.min( Math.max( this.energy + offset, 0 ), 100 );
	}
}
Player.prototype = new Entity();

/**
 * Player entity.
 */
function Enemy() {
	this.scale = 0.01;
	this.scaleTarget = 1;
	
	this.alpha = 0;
	this.alphaTarget = 1;
	
	this.time = 0;
	this.type = 1;
	
	this.velocity = { x: 0, y: 0 };
	
	this.alive = true;
}
Enemy.prototype = new Entity();

/**
 * Particle entity.
 */
function Particle( x, y, speed, color ) {
	this.x = x;
	this.y = y;
	
	this.velocity = {
		x: -speed+(Math.random()*speed*2),
		y: -speed+(Math.random()*speed*2)
	};
	
	this.color = color;
	this.alpha = 1;
	this.fading = false;
}
Particle.prototype = new Entity();

/**
 * Notification entity used for score, health and 
 * multiplier changes.
 */
function Notification( text, x, y, scale, rgb ) {
	this.text = text || '';
	this.x = x || 0;
	this.y = y || 0;
	this.scale = scale || 1;
	this.rgb = rgb || [255,255,255];
	this.alpha = 1;
}
Notification.prototype = new Entity();

/**
 * Represents an effect space in the game field, 
 * renders as an explosion wave in the WebGL background.
 */
function Effect( time, x, y ) {
	this.x = x || 0;
	this.y = y || 0;
	this.time = time || 0;
	this.alive = false;
}

/**
 * Used to keep track of and update the score 
 * multiplier.
 */
function Multiplier( step, max ) {
	this.major = 1;
	this.minor = 0;
	
	this.max = max;
	this.step = step;
	
	this.reset = function() {
		this.major = 1;
		this.minor = 0;
	}
	
	this.increase = function() {
		this.minor += this.step;
		
		// Do we need to increment the major value?
		while( this.minor >= 1 ) {
			if (this.major < this.max) {
				this.major++;
			}
			
			this.minor = 1 - this.minor;
		}
	}
}

