(function define_horde_Engine () {

var VERSION = "{{VERSION}}";
var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 480;
var URL_STORE = "https://chrome.google.com/extensions/detail/khodnfbkbanejphecblcofbghjdgfaih";

var DEFAULT_HIGH_SCORE = 1000;
var HIGH_SCORE_KEY = "high_score";

var COLOR_BLACK = "rgb(0, 0, 0)";
var COLOR_WHITE = "rgb(241, 241, 242)";
var TEXT_HEIGHT = 20; // Ehh, kind of a hack, because stupid ctx.measureText only gives width (why??).
var WAVE_TEXT_HEIGHT = 40;

var OVERLAY_ALPHA = 0.7;
var POINTER_HEIGHT = 24;
var POINTER_X = 270;

var TUTORIAL_HEIGHT = 70;
var TUTORIAL_NUM_TIPS = 4;

var GLOW_INCREMENT = 0.2;
var GATE_CUTOFF_Y = 64;
var NUM_GATES = 3;
var SCORE_COUNT = 10;

/**
 * Creates a new Engine object
 * @constructor
 */
horde.Engine = function horde_Engine () {
	this.lastUpdate = 0;
	this.canvases = {};
	this.map = null;
	this.spawnPoints = [];
	this.objects = {};
	this.objectIdSeed = 0;
	this.playerObjectId = null;
	this.keyboard = new horde.Keyboard();
	this.view = new horde.Size(SCREEN_WIDTH, SCREEN_HEIGHT);
	this.images = null;
	this.debug = false; // Debugging toggle
	this.konamiEntered = false;

	// Clay.io: Load in the API
	this.Clay = Clay = window.Clay = {};
	Clay.gameKey = "onslaughtarena";
	Clay.readyFunctions = [];
	Clay.options = {
		//debug: true
	};
	Clay.ready = function( fn ) {
		Clay.readyFunctions.push( fn );
	};
	( function() {
  	var clay = document.createElement("script");
	  clay.src = ( "https:" == document.location.protocol ? "https://" : "http://" ) + "clay.io/api/api-src.js";
	  var tag = document.getElementsByTagName("script")[0]; tag.parentNode.insertBefore(clay, tag);
	} )();

	this.clayLeaderboard = { show: function() { console.log( "Clay.io leaderboard not ready yet!" ) } };

	var _this = this;
	Clay.ready( function() {
		_this.loggedIn = Clay.Player.loggedIn;
		_this.clayLeaderboard = new Clay.Leaderboard({ id: 385, filters: ['day', 'month', 'all'],
								tabs: [
									{ title: 'Cumulative', id: 385, cumulative: true, limit: 20, filters: ['day', 'month', 'all'] },
									{ title: 'My Best', id: 385, self: true, limit: 10 }
								]  });
	} );

	// Storage for each time putData is called - periodically that info is stored to Clay.io as well
	horde.localData = {};
	// Log which achievements have been granted so we don't keep trying to grant them
	horde.achievementsGranted = {};

	this.running = false;

	this.gateDirection = ""; // Set to "up" or "down"
	this.gateState = "down"; // "up" or "down"
	this.gatesX = 0;
	this.gatesY = 0;

	// Sword pointer
	this.pointerY = 0;
	this.pointerYStart = 0;
	this.maxPointerY = 0;
	this.pointerOptionsStart = 0;

	this.targetReticle = {
		position: new horde.Vector2(),
		angle: 0,
		moving: false
	};

	this.enableFullscreen = false;
	this.enableClouds = false;
	this.cloudTimer = null;
	this.woundsToSpeed = 10;

	this.introTimer = new horde.Timer();
	this.introPhase = 0;
	this.introPhaseInit = false;

	this.wonGame = false;
	this.wonGamePhase = 0;

	this.weaponPickup = {
		type: null,
		state: "off",
		alpha: 1,
		scale: 1,
		position: new horde.Vector2()
	};

	this.coinPickup = {
		amount: 0,
		state: "off",
		alpha: 1,
		position: new horde.Vector2()
	};

	// Flag enabling/disabling touch device mode
	this.touchMove = false;

	this.canMute = true;
	this.canFullscreen = false;
	this.wasdMovesArrowsAttack = true;

};

var proto = horde.Engine.prototype;

proto.cacheBust = function () {
	if (VERSION.indexOf("VERSION") !== -1) {
		return "?cachebust=" + horde.Timer.now();
	} else {
		return "?cachebust=" + VERSION;
	}
};

proto.resize = function horde_Engine_proto_resize () {
	var windowWidth = window.innerWidth;
	var windowHeight = window.innerHeight;
	var stage = document.getElementById("stage");
	var stageHeight = (windowHeight - stage.offsetTop);
	stage.style.height = stageHeight + "px";
	if (this.enableFullscreen) {
		height = (stageHeight - 50);
		if (height < 480) {
			height = 480;
		}
		if (height > 768) {
			height = 768;
		}
		var width = Math.round(height * 1.333);
	} else {
		width = 640;
		height = 480;
	}
	var c = this.canvases["display"];
	// iOS
	/*
	Basically width/height on the canvas needs to be the entire resolution of the viewport.
	So like on iPad that's 1024x768. Just remove all chrome (like the nav) from the page and resize the canvas to 100%.
	*/
	c.style.width = width + "px";
	c.style.height = height + "px";
	var gameLeft = Math.max((windowWidth / 2) - (width / 2), 0);
	var gameTop = Math.max((stageHeight / 2) - (height / 2), 30);
	c.style.left = gameLeft + "px";
	c.style.top = gameTop + "px";
	var tip = document.getElementById("tip");
	if (tip) {
		tip.style.top = (gameTop - 30) + "px";
		tip.style.left = gameLeft + "px";
		tip.style.width = width + "px";
	}
};

/**
 * Runs the engine
 * @return {void}
 */
proto.run = function horde_Engine_proto_run () {
	this.init();
	this.lastUpdate = horde.now();
	this.start();
};

/**
 * Starts the engine
 * @return {void}
 */
proto.start = function horde_Engine_proto_start () {
	if (!this.running) {
		this.running = true;
		this.requestFrame();
	}
};

/**
 * Stops the engine
 * @return {void}
 */
proto.stop = function horde_Engine_proto_stop () {
	if (this.running) {
		this.running = false;
	}
};

/**
 * Toggles pausing the engine
 * Note: isMuted would be used by every instance since it's within its own closure. Ew!
 * @return {void}
 */
proto.togglePause = (function horde_Engine_proto_togglePause () {

	var isMuted = false;

	return function horde_Engine_proto_togglePause () {

		if (this.getPlayerObject().hasState(horde.Object.states.DYING)) {
			return;
		}

		if (this.paused) {
			this.paused = false;
			horde.sound.setMuted(isMuted);
			horde.sound.play("unpause");
			horde.sound.play(this.currentMusic);
		} else {
			this.paused = true;
			this.initOptions();
			isMuted = horde.sound.isMuted();
			horde.sound.play("pause");
			horde.sound.stop(this.currentMusic);
		}

	};

})();

/**
 * Adds an object to the engine's collection
 * @param {horde.Object} Object to add
 * @return {number} ID of the newly added object
 */
proto.addObject = function horde_Engine_proto_addObject (object) {
	this.objectIdSeed++;
	var id = "o" + this.objectIdSeed;
	object.id = id;
	this.objects[id] = object;
	return id;
};

/**
 * Returns the RGB for either red, orange or green depending on the percentage.
 * @param {Number} max The max number, eg 100.
 * @param {Number} current The current number, eg 50 (which would be 50%).
 * @return {String} The RGB value based on the percentage.
 */
proto.getBarColor = function (max, current) {

	var percentage = ((current / max) * 100);

	if (percentage > 50) {
		return "rgb(98, 187, 70)";
	} else if (percentage > 25) {
		return "rgb(246, 139, 31)";
	} else {
		return "rgb(238, 28, 36)";
	}

};

/**
 * Spawns an object from a parent object
 * @param {horde.Object} parent Parent object
 * @param {string} type Type of object to spawn
 * @return {void}
 */
proto.spawnObject = function horde_Engine_proto_spawnObject (
	parent,
	type,
	facing,
	takeOwnership
) {
	var f = facing || parent.facing;
	var o = horde.makeObject(type, true);
	var owner = parent;
	while (owner.ownerId !== null) {
		if (this.objects[owner.ownerId]) {
			owner = this.objects[owner.ownerId];
		} else {
			break;
		}
	}
	if (takeOwnership !== false) {
		o.ownerId = owner.id;
		o.team = parent.team;
	}
	o.centerOn(parent.boundingBox().center());
	o.setDirection(f);
	o.init();
	return this.addObject(o);
};

proto.objectExists = function (objectId) {
	return (this.objects[objectId]);
};

/**
 * Returns the currently "active" object
 * In our case this is the player avatar
 * @return {horde.Object} Player object
 */
proto.getPlayerObject = function horde_Engine_proto_getPlayerObject () {
	return this.objects[this.playerObjectId];
};

proto.getObjectCountByType = function horde_Engine_proto_getObjectCountByType (type) {
	var count = 0;
	for (var id in this.objects) {
		var obj = this.objects[id];
		if (obj.type === type) {
			count++;
		}
	}
	return count;
};

proto.isAlive = function horde_Engine_proto_isAlive (objectId) {
	if (this.objects[objectId]) {
		var o = this.objects[objectId];
		return (o.alive && o.wounds < o.hitPoints);
	}
	return false;
};

proto.preloadComplete = function () {
	this.state = "intro";
	this.logoAlpha = 0;
	this.logoFade = "in";
	this.logoFadeSpeed = 0.5;
};

/**
 * Initializes the engine
 * @return {void}
 */
proto.init = function horde_Engine_proto_init () {

	this.state = "intro";

	this.canvases["display"] = horde.makeCanvas("display", this.view.width, this.view.height);
	this.canvases["buffer"] = horde.makeCanvas("buffer", this.view.width, this.view.height, true);
	this.canvases["waveText"] = horde.makeCanvas("waveText", this.view.width, this.view.height, true);

	this.resize();
	horde.on("resize", this.resize, window, this);

	this.mouse = new horde.Mouse(this.canvases["display"]);

	horde.on("contextmenu", function (e) {
		horde.stopEvent(e);
	}, document.body, this);

	horde.on("blur", function () {
		if (this.state != "running" || this.wonGame) return;
		this.keyboard.keyStates = {};
		if (!this.paused) {
			this.togglePause();
		}
		this.stop();
	}, window, this);

	horde.on("focus", function () {
		this.start();
	}, window, this);

	// Load just the logo
	this.preloader = new horde.ImageLoader();
	this.preloader.load({
		"ui": "img/sheet_ui.png" + this.cacheBust()
	}, this.preloadComplete, this);

	// Load the rest of the image assets
	this.images = new horde.ImageLoader();
	this.images.load({
		"arena": "img/sheet_arena.png" + this.cacheBust(),
		"characters": "img/sheet_characters.png" + this.cacheBust(),
		"objects": "img/sheet_objects.png" + this.cacheBust(),
		"beholder": "img/sheet_beholder.png" + this.cacheBust()
	}, this.handleImagesLoaded, this);

	var highScore = this.getData(HIGH_SCORE_KEY);
	if (highScore === null) {
		this.putData(HIGH_SCORE_KEY, DEFAULT_HIGH_SCORE);
	}

	this.initSound();

};

/**
 * Initializes music and sound effects
 * @return {void}
 */
proto.initSound = function horde_Engine_proto_initSound () {

	horde.sound.init(function () {

		// Create all sound files
		var musicDir = "sound/music/";
		var sfxDir = "sound/effects/";
		var s = horde.sound;

		// Music
		s.create("normal_battle_music", musicDir + "normal_battle", true, 20);
		s.create("final_battle_music", musicDir + "final_battle", true, 20);
		s.create("victory", musicDir + "victory", true, 20);

		// UI
		s.create("move_pointer", sfxDir + "move_pointer", false, 50);
		s.create("select_pointer", sfxDir + "select_pointer", false, 50);
		s.create("pause", sfxDir + "pause");
		s.create("unpause", sfxDir + "unpause");

		// Environment
		s.create("code_entered", sfxDir + "code_entered");
		s.create("gate_opens", sfxDir + "gate_opens");
		s.create("gate_closes", sfxDir + "gate_closes");
		s.create("spike_attack", sfxDir + "spike_attacks");

		// Misc
		s.create("immunity", sfxDir + "immunity", false, 25);
		s.create("coins", sfxDir + "coins", false, 10);
		s.create("eat_food", sfxDir + "eat_food", false, 30);
		s.create("pickup_weapon", sfxDir + "pickup_weapon");
		s.create("weapon_wall", sfxDir + "weapon_wall", false, 25);

		// Hero
		s.create("fire_attack", sfxDir + "char_attacks_fire");
		s.create("hero_attacks", sfxDir + "char_attacks");
		s.create("hero_damage", sfxDir + "char_damage_3");
		s.create("hero_dies", sfxDir + "char_dies");

		// Bat
		// Attack: not needed
		s.create("bat_damage", sfxDir + "bat_damage");
		s.create("bat_dies", sfxDir + "bat_dies");

		// Goblin
		s.create("goblin_attacks", sfxDir + "goblin_attacks");
		s.create("goblin_damage", sfxDir + "goblin_damage");
		s.create("goblin_dies", sfxDir + "goblin_dies");

		// Demoblin
		s.create("demoblin_attacks", sfxDir + "demoblin_attacks", false, 80);
		// Damage: goblin_damage
		// Dies: goblin_dies

		// Imp
		// Attack: not needed
		s.create("imp_damage", sfxDir + "imp_damage", false, 30);
		s.create("imp_dies", sfxDir + "imp_dies", false, 30);

		// Gel
		// Attack: not needed
		s.create("gel_damage", sfxDir + "gel_damage", false, 20);
		s.create("gel_dies", sfxDir + "gel_dies", false, 20);

		// Flaming Skull
		// Attack: not needed
		s.create("skull_damage", sfxDir + "skull_damage", false, 25);
		s.create("skull_dies", sfxDir + "skull_dies", false, 5);

		// Wizard
		s.create("wizard_attacks", sfxDir + "wizard_attacks", false, 25);
		// Damage: goblin_damage
		// Dies: goblin_dies
		s.create("wizard_disappear", sfxDir + "wizard_disappear", false, 50);
		s.create("wizard_reappear", sfxDir + "wizard_reappear", false, 50);

		// Sandworm
		s.create("sandworm_attacks", sfxDir + "sandworm_attacks", false, 75);
		// Damage: goblin_damage
		s.create("sandworm_dies", sfxDir + "sandworm_dies", false, 40);

		// Cyclops
		s.create("cyclops_attacks", sfxDir + "cyclops_attacks");
		s.create("cyclops_damage", sfxDir + "cyclops_damage");
		s.create("cyclops_dies", sfxDir + "cyclops_dies");

		// Owlbear
		s.create("owlbear_alarm", sfxDir + "owlbear_alarm", false, 20);
		s.create("owlbear_attacks", sfxDir + "owlbear_attacks", false, 15);
		s.create("owlbear_damage", sfxDir + "owlbear_damage", false, 40);
		s.create("owlbear_dies", sfxDir + "owlbear_dies", false, 50);

		// Boss 1/5: Gelatinous Cube
		s.create("cube_attacks", sfxDir + "cube_attacks");
		s.create("cube_damage", sfxDir + "cube_damage");
		s.create("cube_dies", sfxDir + "cube_dies");

		// Minotaur
		s.create("minotaur_attacks", sfxDir + "minotaur_attacks");
		s.create("minotaur_damage", sfxDir + "minotaur_damage");
		s.create("minotaur_dies", sfxDir + "minotaur_dies");

		// Boss 3/5: Green Dragon
		s.create("dragon_attacks", sfxDir + "dragon_attacks");
		s.create("dragon_damage", sfxDir + "dragon_damage");
		s.create("dragon_dies", sfxDir + "dragon_dies");

		// Boss 4/5: Beholder
		s.create("beholder_damage", sfxDir + "beholder_damage", false, 50);
		s.create("beholder_dies", sfxDir + "beholder_dies", false, 25);

		// Add: Eyelet
		s.create("eyelet_damage", sfxDir + "eyelet_damage", false, 25);
		s.create("eyelet_dies", sfxDir + "eyelet_dies", false, 25);

		// Boss 5/5: Doppelganger
		s.create("dopp_attacks", sfxDir + "dopp_attacks", false, 50);
		s.create("dopp_damage", sfxDir + "dopp_damage", false, 50);
		s.create("dopp_dies", sfxDir + "dopp_dies");

	});

};

proto.initGame = function () {

	this.konamiEntered = false;
	this.enableClouds = false;

	this.closeGates();

	this.objects = {};
	this.state = "title";
	this.initOptions();

	this.initMap();

	this.initSpawnPoints();
	this.initWaves();

	this.initPlayer();

	this.gameOverBg = null;

	this.monstersAlive = 0;

	this.gotNewHighScore = 0;
	this.scoreCount = 0;
	this.statsCount = 0;
	this.statsIncrement = 0;
	this.statsIndex = 0;
	this.statsTimer = null;
	this.highScoreSaved = false;

	this.wonGame = false;
	this.wonGamePhase = 0;

	this.showReticle = false;
	this.hideReticleTimer = null;

	this.showTutorial = false;
	this.tutorialIndex = 0;
	this.tutorialY = -TUTORIAL_HEIGHT;
	this.tutorialDirection = "down";
	this.hideTutorialTimer = null;
	this.nextTutorialTimer = null;

	this.heroFiring = false;
	this.heroFiringDirection = null;
	this.woundsTo = 0;

	this.gameStartTime = horde.now();

};

/**
 * Initializes the map
 * @return {void}
 */
proto.initMap = function horde_Engine_proto_initMap () {
	this.tileSize = new horde.Size(32, 32);
	this.map = [
		[0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0],
		[0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	];
};

/**
 * Initialize the spawn points
 * @return {void}
 */
proto.initSpawnPoints = function horde_Engine_proto_initSpawnPoints () {

	this.spawnPoints = [];

	// Left gate (index 0)
	this.spawnPoints.push(new horde.SpawnPoint(
		3 * this.tileSize.width, -2 * this.tileSize.height,
		this.tileSize.width * 2, this.tileSize.height * 2
	));

	// Center gate (index 1)
	this.spawnPoints.push(new horde.SpawnPoint(
		9 * this.tileSize.width, -2 * this.tileSize.height,
		this.tileSize.width * 2, this.tileSize.height * 2
	));

	// Right gate (index 2)
	this.spawnPoints.push(new horde.SpawnPoint(
		15 * this.tileSize.width, -2 * this.tileSize.height,
		this.tileSize.width * 2, this.tileSize.height * 2
	));

};

/**
 * Queues up a wave of spawns in the spawn points
 * @param {horde.SpawnWave} Wave to spawn
 * @return {void}
 */
proto.initSpawnWave = function horde_Engine_proto_initSpawnWave (wave) {
	var longestTTS = 0;
	for (var x in wave.points) {
		var p = wave.points[x];
		var sp = this.spawnPoints[p.spawnPointId];
		sp.delay = p.delay;
		sp.lastSpawnElapsed = sp.delay;
		for (var z in p.objects) {
			var o = p.objects[z];
			sp.queueSpawn(o.type, o.count);
		}
		var timeToSpawn = ((sp.queue.length - 1) * sp.delay);
		if (timeToSpawn > longestTTS) {
			longestTTS = timeToSpawn;
		}
	}
	var ttl = longestTTS + wave.nextWaveTime;
	this.waveTimer.start(ttl);
	this.openGates();
};

/**
 * Initializes the waves of bad guys!
 * @return {void}
 */
proto.initWaves = function horde_Engine_proto_initWaves () {

	this.waves = [];
	this.waveTimer = new horde.Timer();
	this.waveTimer.start(1);
	this.currentWaveId = -1;

	this.waveText = {
		string: "",
		size: 20,
		state: "off",
		alpha: 0
	};

	// Wave testing code...
	/*
	var testWave = 50;
	this.waveHack = true;
	this.currentWaveId = (testWave - 2);
	*/

	// Test Wave
	/*
	var w = new horde.SpawnWave();
	w.addSpawnPoint(0, 1000);
	w.addSpawnPoint(1, 1000);
	w.addSpawnPoint(2, 1000);
	w.addObjects(0, "huge_skull", 1);
	w.addObjects(1, "huge_skull", 1);
	w.addObjects(2, "huge_skull", 1);
	w.nextWaveTime = Infinity;
	this.waves.push(w);
	*/

	horde.populateWaves(this);

};

/**
 * Initializes the player
 * @return {void}
 */
proto.initPlayer = function horde_Engine_proto_initPlayer () {
	var player = horde.makeObject("hero");
	// NOTE: below line shouldn't be necessary, but it fixes the weapon retention bug for now.
	player.weapons = [
		{type: "h_sword", count: null}
	];
	player.centerOn(horde.Vector2.fromSize(this.view).scale(0.5));
	this.playerObjectId = this.addObject(player);
	if (this.touchMove) {
		this.targetReticle.position = player.boundingBox().center();
	}
};

proto.handleImagesLoaded = function horde_Engine_proto_handleImagesLoaded () {
	this.imagesLoaded = true;
};

proto.logoFadeOut = function () {
	this.logoFade = "out";
};

proto.updateLogo = function (elapsed) {

	var kb = this.keyboard;
	var keys = horde.Keyboard.Keys;

	if (this.keyboard.isAnyKeyPressed() || this.mouse.isAnyButtonDown()) {
		kb.clearKeys();
		this.mouse.clearButtons();
		this.initGame();
	}

	if (this.logoFade === "in") {
		this.logoAlpha += ((this.logoFadeSpeed / 1000) * elapsed);
		if (this.logoAlpha >= 1) {
			this.logoAlpha = 1;
			this.logoFade = "none";
			horde.setTimeout(1000, this.logoFadeOut, this);
		}
	} else if (this.logoFade === "out") {
		this.logoAlpha -= ((this.logoFadeSpeed / 1000) * elapsed);
		if (this.logoAlpha <= 0) {
			this.logoAlpha = 0;
			this.logoFade = "none";
			this.initGame();
		}
	}
};

proto.updateIntroCinematic = function horde_Engine_proto_updateIntroCinematic (elapsed) {

	this.introTimer.update(elapsed);

	switch (this.introPhase) {

		// Fade out
		case 0:
			if (!this.introPhaseInit) {
				this.introFadeAlpha = 0;
				this.introPhaseInit = true;
			}
			this.introFadeAlpha += (1 / 1000) * elapsed;
			if (this.introFadeAlpha >= 1) {
				this.introFadeAlpha = 1;
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;

		// Fade in
		case 1:
			if (!this.introPhaseInit) {
				this.introFadeAlpha = 1;
				this.introPhaseInit = true;
			}
			this.introFadeAlpha -= (0.5 / 1000) * elapsed;
			if (this.introFadeAlpha <= 0) {
				this.introFadeAlpha = 0;
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;

		// Wait for a sec...
		case 2:
			if (!this.introPhaseInit) {
				this.introTimer.start(1000);
				this.introPhaseInit = true;
			}
			if (this.introTimer.expired()) {
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;

		// Open the gates
		case 3:
			if (!this.introPhaseInit) {
				this.openGates();
				this.introPhaseInit = true;
			}
			if (this.gateState === "up") {
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;

		// Move hero out
		case 4:
			if (!this.introPhaseInit) {
				var h = horde.makeObject("hero");
				h.position.x = 304;
				h.position.y = -64;
				h.collidable = false;
				h.setDirection(new horde.Vector2(0, 1));
				this.introHero = h;
				this.introPhaseInit = true;
			}
			this.introHero.update(elapsed);
			this.moveObject(this.introHero, elapsed);
			if (this.introHero.position.y >= 222) {
				this.introHero.centerOn(horde.Vector2.fromSize(this.view).scale(0.5));
				this.introHero.stopMoving();
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;

		case 5:
		case 6:
		case 8:
			if (!this.introPhaseInit) {
				this.introTimer.start(500);
				this.introPhaseInit = true;
			}
			if (this.introTimer.expired()) {
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;

		case 7:
			if (!this.introPhaseInit) {
				this.closeGates();
				this.introPhaseInit = true;
			}
			if (this.gateState === "down") {
				this.introPhase++;
				this.introPhaseInit = false;
			}
			break;

		case 9:
			if (!this.introPhaseInit) {
				this.introTimer.start(1000);
				this.introPhaseInit = true;
			}
			this.introHero.update(elapsed);
			if (this.introTimer.expired()) {
				this.currentMusic = "normal_battle_music";
				horde.sound.play(this.currentMusic);
				this.state = "running";
			}
			break;

	}

};

proto.update = function horde_Engine_proto_update () {

	var now = horde.now();
	var elapsed = (now - this.lastUpdate);
	this.lastUpdate = now;

	this.lastElapsed = elapsed;

	if (this.imagesLoaded !== true) {
		this.requestFrame();
		return;
	}

	switch (this.state) {

		case "intro":
			this.updateLogo(elapsed);
			this.render();
			break;

		case "title":
			this.handleInput();
			this.updateFauxGates(elapsed);
			this.render();
			break;

		case "credits":
			this.handleInput();
			this.render();
			break;

		case "intro_cinematic":
			this.handleInput();
			this.updateIntroCinematic(elapsed);
			this.updateFauxGates(elapsed);
			this.render();
			break;

		// The game!
		case "running":
			if (this.wonGame) {
				this.updateWonGame(elapsed);
			} else {
				this.handleInput();
			}
			if (!this.paused) {
				this.updateWaves(elapsed);
				this.updateSpawnPoints(elapsed);
				this.updateClouds(elapsed);
				this.updateObjects(elapsed);
				this.updateFauxGates(elapsed);
				this.updateWeaponPickup(elapsed);
				this.updateCoinPickup(elapsed);
			}
			if (this.showTutorial) {
				this.updateTutorial(elapsed);
			}
			this.render();
			break;

		case "game_over":
			this.updateGameOver(elapsed);
			this.render();
			break;

		case "buy_now":
			this.handleInput();
			this.render();
			break;

	}

	if (!this.hideReticleTimer) {
		this.hideReticleTimer = new horde.Timer();
	}
	if (this.mouse.hasMoved) {
		this.showReticle = true;
		this.hideReticleTimer.start(5000);
		this.nextTutorial(3);
	}
	this.hideReticleTimer.update(elapsed);
	if (this.hideReticleTimer.expired()) {
		this.showReticle = false;
	}

	this.mouse.hasMoved = false;

	this.requestFrame();
};

proto.requestFrame = function () {
	if (!this.running) { return; }
	requestAnimationFrame(bind(this, this.update));
};

proto.updateWeaponPickup = function horde_Engine_proto_updateWeaponPickup (elapsed) {
	var w = this.weaponPickup;
	if (w.state === "on") {
		w.scale += ((4.5 / 1000) * elapsed);
		w.alpha -= ((2.5 / 1000) * elapsed);
		if (w.alpha <= 0) {
			w.state = "off";
		}
	}
};

proto.updateCoinPickup = function horde_Engine_proto_updateCoinPickup (elapsed) {
	var w = this.coinPickup;
	if (w.state === "on") {
		w.position.y -= ((50 / 1000) * elapsed);
		w.alpha -= ((0.7 / 1000) * elapsed);
		if (w.alpha <= 0) {
			w.state = "off";
		}
	}
};

proto.updateWonGame = function horde_Engine_proto_updateWonGame (elapsed) {

	var player = this.getPlayerObject();

	if (this.roseTimer) {
		this.roseTimer.update(elapsed);
	}

	switch (this.wonGamePhase) {

		// Move Xam to the center of the room
		case 0:
			var center = new horde.Vector2(304, 192);
			player.moveToward(center);
			var diff = player.position.clone().subtract(center).abs();
			if (diff.x <= 5 && diff.y <= 5) {
				this.wonGamePhase++;
			}
			break;

		case 1:
			player.setDirection(new horde.Vector2(0, 1));
			player.stopMoving();
			player.addState(horde.Object.states.VICTORIOUS);
			this.roseTimer = new horde.Timer();
			this.roseTimer.start(100);
			this.rosesThrown = 0;
			this.wonGamePhase++;
			break;

		case 2:
			if (this.roseTimer.expired()) {
				++this.rosesThrown;
				var rose = horde.makeObject("rose");
				if (horde.randomRange(1, 2) === 2) {
					rose.position.x = -32;
					rose.position.y = horde.randomRange(100, 300);
					rose.setDirection(new horde.Vector2(1, 0));
				} else {
					rose.position.x = 682;
					rose.position.y = horde.randomRange(100, 300);
					rose.setDirection(new horde.Vector2(-1, 0));
				}
				this.addObject(rose);
				this.roseTimer.reset();
			}
			if (this.rosesThrown > 100) {
				this.endGame();
			}
			break;

	}

};

proto.updateClouds = function horde_Engine_proto_updateClouds (elapsed) {

	if (this.enableClouds !== true) {
		return;
	}

	if (this.cloudTimer === null) {
		this.cloudTimer = new horde.Timer();
		this.cloudTimer.start(2000);
	}

	this.cloudTimer.update(elapsed);

	var clouds = 0;

	// Kill off clouds that are past the screen
	for (var id in this.objects) {
		var o = this.objects[id];
		if (o.type === "cloud") {
			clouds++;
			if (o.position.x < -(o.size.width)) {
				o.die();
			}
		}
	}

	// Spawn new clouds
	if (clouds < 10 && this.cloudTimer.expired()) {
		if (horde.randomRange(1, 10) >= 1) {
			var numClouds = horde.randomRange(1, 3);
			for (var x = 0; x < numClouds; x++) {
				var cloud = horde.makeObject("cloud");
				cloud.position.x = SCREEN_WIDTH + horde.randomRange(1, 32);
				cloud.position.y = horde.randomRange(
					-(cloud.size.height / 2),
					SCREEN_HEIGHT + (cloud.size.height / 2)
				);
				cloud.setDirection(new horde.Vector2(-1, 0));
				this.addObject(cloud);
			}
		}
		this.cloudTimer.reset();
	}

};

/**
 * Updates the spawn points
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.updateSpawnPoints = function horde_Engine_proto_updateSpawnPoints (elapsed) {
	if (this.gateState !== "up") {
		return;
	}
	var closeGates = true;
	// Iterate over the spawn points and update them
	for (var x in this.spawnPoints) {
		if (this.spawnPoints[x].queue.length >= 1) {
			closeGates = false;
		}
		// Spawn points can return an object to spawn
		var o = this.spawnPoints[x].update(elapsed, (this.monstersAlive === 0));
		if (o !== false) {
			// We need to spawn an object
			this.addObject(o);
		}
	}
	if (closeGates && !this.monstersAboveGates) {
		this.closeGates();
	}
};

proto.spawnWaveExtras = function horde_Engine_proto_spawnWaveExtras (waveNumber) {
	switch (waveNumber) {

		case 1:
			// Spawn a couple weapons scrolls to give the player an early taste of the fun!
			var player = this.getPlayerObject();

			// 1. Knife
			var wep = horde.makeObject("item_weapon_knife");
			wep.position = player.position.clone();
			wep.position.x -= 96;
			wep.position.y += 64;
			this.addObject(wep);

			// 2. Spear
			var wep = horde.makeObject("item_weapon_spear");
			wep.position = player.position.clone();
			wep.position.x -= 32;
			wep.position.y += 64;
			this.addObject(wep);

			// 3. Axe
			var wep = horde.makeObject("item_weapon_axe");
			wep.position = player.position.clone();
			wep.position.x += 32;
			wep.position.y += 64;
			this.addObject(wep);

			// 4. Fire
			var wep = horde.makeObject("item_weapon_fireball");
			wep.position = player.position.clone();
			wep.position.x += 96;
			wep.position.y += 64;
			this.addObject(wep);

			break;

		case 11:
			// Two spikes in the middle to the left and right
			var locs = [
				{x: 192, y: 224},
				{x: 416, y: 224}
			];
			var len = locs.length;
			for (var x = 0; x < len; ++x) {
				var pos = locs[x];
				var s = horde.makeObject("spikes");
				s.position = new horde.Vector2(pos.x, pos.y);
				this.addObject(s);
			}
			break;

		case 21:
			// Spike sentries in each corner
			var spikeLocs = [
				{x: 32, y: 64},
				{x: 32, y: 352},
				{x: 576, y: 64},
				{x: 576, y: 352}
			];
			var len = spikeLocs.length;
			for (var x = 0; x < len; x++) {
				var pos = spikeLocs[x];
				var s = horde.makeObject("spike_sentry");
				s.position = new horde.Vector2(pos.x, pos.y);
				this.addObject(s);
			}
			break;

		case 31:
			// Two spikes in the middle above and below
			var locs = [
				{x: 304, y: 114},
				{x: 304, y: 304}
			];
			var len = locs.length;
			for (var x = 0; x < len; ++x) {
				var pos = locs[x];
				var s = horde.makeObject("spikes");
				s.position = new horde.Vector2(pos.x, pos.y);
				this.addObject(s);
			}
			break;

		case 41:
			this.enableClouds = true;
			break;

		case 50:
			// Despawn all traps; Doppelganger is hard enough!!
			for (var id in this.objects) {
				var obj = this.objects[id];
				if (obj.role === "trap") {
					obj.die();
				}
			}
			break;

	}
};

/**
 * Updates the waves
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.updateWaves = function horde_Engine_proto_updateWaves (elapsed) {
	if (this.wonGame) {
		return;
	}
	this.waveTimer.update(elapsed);
	var spawnsEmpty = true;
	for (var x in this.spawnPoints) {
		if (this.spawnPoints[x].queue.length > 0) {
			spawnsEmpty = false;
		}
	}
	// If the spawns are empty AND there are no monsters alive
	if (spawnsEmpty === true && this.monstersAlive === 0) {
		if (this.currentWaveId === (this.waves.length - 1)) {
			// Player won the game!!
			this.wonGame = true;
			horde.sound.stop("normal_battle_music");
			horde.sound.stop("final_battle_music");
			horde.sound.play("victory");
			return;
		}

		// Clay.io: Achievements
		var achievementId = false;
		switch( this.currentWaveId + 1 ) {
			case 1:
				achievementId = "wave1";
				break;
			case 5:
				achievementId = "wave5";
				break;
		}

		if(achievementId && !horde.achievementsGranted[achievementId]) {
			horde.achievementsGranted[achievementId] = true; // so we don't keep sending to Clay.io
			(new Clay.Achievement({ id: achievementId })).award();
		}

		this.currentWaveId++;
		var actualWave = (this.currentWaveId + 1);
		if (this.continuing || this.waveHack) {
			var start = (this.waveHack) ? 1 : 2;
			// Start with 2 as we don't want the bonus weapons spawning at continue
			for (var wn = start; wn <= actualWave; ++wn) {
				this.spawnWaveExtras(wn);
			}
			this.waveHack = false;
		} else {
			this.spawnWaveExtras(actualWave);
		}
		var waveTextString = "Wave " + actualWave;
		var waveMusic = "normal_battle_music";
		if (actualWave > 1) {
			this.putData("checkpoint_wave", this.currentWaveId);
			this.putData("checkpoint_hero", JSON.stringify(this.getPlayerObject()));
		}
		if (this.waves[this.currentWaveId].bossWave) {
			waveTextString = ("Boss: " + this.waves[this.currentWaveId].bossName) + "!";
			waveMusic = "final_battle_music";
		}

		if (this.currentMusic !== waveMusic) {
			horde.sound.stop(this.currentMusic);
			this.currentMusic = waveMusic;
			horde.sound.play(this.currentMusic);
		}

		this.initSpawnWave(this.waves[this.currentWaveId]);
		this.waveText.string = waveTextString;
		this.waveText.alpha = 0;
		this.waveText.size = 1;
		this.waveText.state = "init";

		// Initialize the waveText buffer
		var b = this.canvases.waveText.getContext("2d");
		var text = this.waveText.string;

		b.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

		b.save();
		b.font = ("Bold " + WAVE_TEXT_HEIGHT + "px MedievalSharp");
		b.lineWidth = 3;
		b.textBaseline = "top";
		b.strokeStyle = COLOR_BLACK;
		b.fillStyle = "rgb(230, 103, 8)";

		b.strokeText(text, 0, 0);
		b.fillText(text, 0, 0);

		var metrics = b.measureText(text);
		this.waveText.width = metrics.width;
		b.restore();

		this.continuing = false;
	}
	switch (this.waveText.state) {
		case "init":
			this.waveText.alpha += ((2 / 1000) * elapsed);
			if (this.waveText.alpha >= 1) {
				this.waveText.alpha = 1;
				this.waveText.timer = new horde.Timer();
				this.waveText.timer.start(250);
				this.waveText.state = "display";
			}
			break;
		case "display":
			this.waveText.timer.update(elapsed);
			if (this.waveText.timer.expired()) {
				this.waveText.state = "hide";
			}
			break;
		case "hide":
			// hide the text
			this.waveText.alpha -= ((1.5 / 1000) * elapsed);
			this.waveText.size += ((20 / 1000) * elapsed);
			if (this.waveText.alpha <= 0) {
				this.waveText.alpha = 0;
				this.waveText.state = "off";
			}
			break;
	}
};

proto.updateGameOver = function horde_Engine_proto_updateGameOver (elapsed) {

	if (!this.gameOverAlpha) {
		this.gameOverReady = false;
		this.gameOverAlpha = 0;
	}

	var alphaChange = ((0.2 / 1000) * elapsed);
	this.gameOverAlpha += Number(alphaChange) || 0;

	if (this.gameOverAlpha >= 0.75) {
		this.gameOverReady = true;
		this.gameOverAlpha = 0.75;
	}

	if (this.gameOverReady) {
		if (!this.statsTimer) {
			this.statsTimer = new horde.Timer();
			this.statsCount = 0;
			this.statsIndex = 0;
			// Settings for Wave reached:
			this.statsTimer.start(50);
			this.statsIncrement = 1;
		}
		this.statsTimer.update(elapsed);
		if (this.statsTimer.expired()) {
			this.statsTimer.reset();
			this.statsCount += this.statsIncrement;
		}
	}

	if ((this.statsIndex >= 4) && !this.highScoreSaved) {
		this.highScoreSaved = true;

		var highScore = Number(this.getData(HIGH_SCORE_KEY));
		var totalScore = this.getTotalScore();

		// Clay.io: Post score to clay.io
		var _this = this;
		this.clayLeaderboard.post({ score: totalScore }, function() {
			// Show the leaderboard
			_this.showLeaderboard(true);
		});

		if (totalScore > highScore) {
			this.putData(HIGH_SCORE_KEY, totalScore);
			horde.sound.play("victory");
			this.gotNewHighScore = true;
		}
	}

};

/**
 * Displays the Clay.io leaderboard
 * @param {Boolean} share If true, will give the player an option to share their score
 */
proto.showLeaderboard = function horde_Engine_proto_showLeaderboard (share) {
	var share = typeof share === 'undefined' ? false : share;

	var html = []; // Post to social HTML. Array for readability
	html.push("Share your score: " );
	html.push("<a href='#' id='facebook-button'>Facebook</a>" );
	html.push(" or <a href='#' id='twitter-button'>Twitter</a>" );
	var _this = this;
	if( share ) {
		this.clayLeaderboard.show({ html: html.join("") }, function() {
			document.getElementById('facebook-button').onclick = function() {
				_this.postSocial('facebook');
			}
			document.getElementById('twitter-button').onclick = function() {
				_this.postSocial('twitter');
			}
		});
	}
	else {
		this.clayLeaderboard.show();
	}
}

/**
 * Takes a screenshot and posts it to the specified site through Clay.io
 * @param {String} site facebook or twitter
 */
proto.postSocial = function horde_Engine_proto_postSocial (site) {
	var screenshot = new Clay.Screenshot({ prompt: false, id: 'display' });
	var _this = this;
	screenshot.save(function( response ) {
		if(site == 'facebook')
			(new Clay.Facebook()).post({ message: "I just scored " + _this.getTotalScore() + " in Onslaught! Arena - (screenshot: " + response.url + ")", link: "http://onslaughtarena.clay.io" });
		else if(site == 'twitter')
			(new Clay.Twitter()).post({ message: "I just scored " + _this.getTotalScore() + " in Onslaught! Arena - (sreenshot: " + response.url + ")! Play me: http://onslaughtarena.clay.io" });
	} );

}

proto.openGates = function horde_Engine_proto_openGates () {
	if (this.gateState !== "up") {
		this.gateDirection = "up";
		horde.sound.play("gate_opens");
	}
};

proto.closeGates = function horde_Engine_proto_closeGates () {
	if (this.gateState !== "down") {
		this.gateDirection = "down";
		horde.sound.play("gate_closes");
	}
};

proto.updateFauxGates = function horde_Engine_proto_updateFauxGates (elapsed) {

	if (this.gateDirection === "down") {
		this.gatesX = 0;
		this.gatesY += ((200 / 1000) * elapsed);
		if (this.gatesY >= 0) {
			this.gatesX = 0;
			this.gatesY = 0;
			this.gateDirection = "";
			this.gateState = "down";
		}
	}

	if (this.gateDirection === "up") {
		this.gatesX = horde.randomRange(-1, 1);
		this.gatesY -= ((50 / 1000) * elapsed);
		if (this.gatesY <= -54) {
			this.gatesX = 0;
			this.gatesY = -54;
			this.gateDirection = "";
			this.gateState = "up";
		}
	}

};

proto.updateTutorial = function horde_Engine_proto_updateTutorial (elapsed) {

	var speed = 0.1;

	if (this.tutorialDirection === "down") {
		this.tutorialY += (speed * elapsed);
		if (this.tutorialY >= 0) {
			this.tutorialY = 0;
			this.tutorialDirection = null;

			if (this.tutorialIndex >= TUTORIAL_NUM_TIPS) {
				this.hideTutorialTimer.start(5000);
			}
		}
	}

	if (this.tutorialDirection === "up") {
		this.tutorialY -= (speed * elapsed);
		if (this.tutorialY < -TUTORIAL_HEIGHT) {
			this.tutorialY = -TUTORIAL_HEIGHT;
			this.tutorialDirection = "down";
			this.tutorialIndex += 1;
			if (this.tutorialIndex > TUTORIAL_NUM_TIPS) {
				this.showTutorial = false;
			}
		}
	}

	if (!this.hideTutorialTimer) {
		this.hideTutorialTimer = new horde.Timer();
	}

	if (!this.nextTutorialTimer) {
		this.nextTutorialTimer = new horde.Timer();
		this.nextTutorialTimer.start(10000);
	}

	this.hideTutorialTimer.update(elapsed);
	this.nextTutorialTimer.update(elapsed);

	if (this.hideTutorialTimer.expired()) {
		this.tutorialDirection = "up";
	}

	if (this.nextTutorialTimer.expired()) {
		this.nextTutorial(this.tutorialIndex + 1);
		this.nextTutorialTimer.reset();
	}

};

proto.nextTutorial = function horde_Engine_proto_nextTutorial (index) {

	if (!this.showTutorial || (this.tutorialDirection !== null)) {
		return;
	}

	// Move the tutorial up if we want to see the next one
	if (this.tutorialIndex === (index - 1)) {
		this.tutorialDirection = "up";
	}

};

/**
 * Returns an array of tiles which intersect a given rectangle
 * @param {horde.Rect} rect Rectangle
 * @return {array} Array of tiles
 */
proto.getTilesByRect = function horde_Engine_proto_getTilesByRect (rect) {

	var tiles = [];

	var origin = new horde.Vector2(rect.left, rect.top);
	var size = new horde.Vector2(rect.width, rect.height);

	var begin = origin.clone().scale(1 / this.tileSize.width).floor();
	var end = origin.clone().add(size).scale(1 / this.tileSize.width).floor();

	for (var tx = begin.x; tx <= end.x; tx++) {
		for (var ty = begin.y; ty <= end.y; ty++) {
			tiles.push({
				x: tx,
				y: ty
			});
		}
	}

	return tiles;

};

/**
 * Checks if a given object is colliding with any tiles
 * @param {horde.Object} object Object to check
 * @return {boolean} True if object is colliding with tiles, otherwise false
 */
proto.checkTileCollision = function horde_Engine_proto_checkTileCollision (object) {

	var tilesToCheck = this.getTilesByRect(object.boundingBox());

	for (var i = 0, len = tilesToCheck.length; i < len; i++) {
		var t = tilesToCheck[i];
		if (this.map[t.y] && this.map[t.y][t.x] === 0) {
			// COLLISION!
			return t;
		}
	}

	// No tile collision
	return false;

};

proto.moveObject = function horde_Engine_proto_moveObject (object, elapsed) {

	if (!object.badass && object.hasState(horde.Object.states.HURTING)) {
		return false;
	}

	var speed = object.speed;
	if (object.hasState(horde.Object.states.SLOWED)) {
		speed *= 0.20;
	}

	var px = ((speed / 1000) * elapsed);

	var axis = [];
	var collisionX = false;
	var collisionY = false;

	// Check tile collision for X axis
	if (object.direction.x !== 0) {
		// the object is moving along the "x" axis
		object.position.x += (object.direction.x * px);
		if (object.collidable) {
			if (object.position.x < 16) {
				object.position.x = 16;
			}
			if ((object.position.x + object.size.width) > 624) {
				object.position.x = (624 - object.size.width);
			}
			var tile = this.checkTileCollision(object);
			if (tile !== false) {
				axis.push("x");
				collisionX = true;
				var objCenterX = (object.position.x + (object.size.width / 2));
				var tileCenterX = ((tile.x * this.tileSize.width) + (this.tileSize.width / 2));
				if (objCenterX < tileCenterX) {
					object.position.x = tile.x * this.tileSize.width - object.size.width;
				} else {
					object.position.x = tile.x * this.tileSize.width + this.tileSize.width;
				}
			}
		}
	}

	// Check tile collision for Y axis
	if (object.direction.y !== 0) {
		// the object is moving along the "y" axis
		object.position.y += (object.direction.y * px);
		if (object.collidable) {
			if ((object.position.y + object.size.height) > 400) {
				object.position.y = (400 - object.size.height);
			}
			var tile = this.checkTileCollision(object);
			if (tile !== false) {
				axis.push("y");
				collisionY = true;
				var objCenterY = (object.position.y + (object.size.height / 2));
				var tileCenterY = ((tile.y * this.tileSize.height) + (this.tileSize.height / 2));
				if (objCenterY < tileCenterY) {
					object.position.y = tile.y * this.tileSize.height - object.size.height;
				} else {
					object.position.y = tile.y * this.tileSize.height + this.tileSize.height;
				}
			}
		}
	}

	if (object.collidable) {

		var yStop = 0;
		if (
			this.gateState === "down"
			|| object.role === "monster"
			|| object.role === "hero"
		) {
			yStop = GATE_CUTOFF_Y;
		}

		if (object.direction.y < 0 && object.position.y < yStop) {
			object.position.y = yStop;
			axis.push("y");
		}

		if (axis.length > 0) {
			object.wallCollide(axis);
		}

	}

};

proto.dropObject = function horde_Engine_proto_dropObject (object, type) {
	var drop = horde.makeObject(type);
	drop.position = object.position.clone();
	drop.position.y -= 1;
	if (this.isSpecialLoot(type)) {
		drop.position = new horde.Vector2(304, 226);
	}
	this.addObject(drop);
	if (this.isSpecialLoot(type)) {
		// Also spawn the pointer
		var ptr = horde.makeObject("pickup_arrow");
		ptr.position = drop.position.clone();
		ptr.position.x = (320 - (ptr.size.width / 2));
		ptr.position.y -= (ptr.size.height + 10);
		this.addObject(ptr);
	}
};

proto.isSpecialLoot = function horde_Engine_proto_isSpecialLoot (type) {
	return (
		(type === "item_weapon_fire_sword")
		|| (type === "item_gold_chest")
	);
};

proto.spawnLoot = function horde_Engine_proto_spawnLoot (object) {

	// Don't spawn stuff out of reach
	if (object.position.y < 44) return;

	var table = object.lootTable;
	var len = table.length;

	var weightedTable = [];
	for (var x = 0; x < len; x++) {
		var entry = table[x];
		for (var j = 0; j < entry.weight; j++) {
			weightedTable.push(entry.type);
		}
	}

	var rand = horde.randomRange(0, weightedTable.length - 1);
	var type = weightedTable[rand];

	if (type !== null) {
		var player = this.getPlayerObject();
		if (type === "item_food" && player.wounds === 0) {
			type = "item_chest";
		}
		if (type === "WEAPON_DROP") {
			switch (horde.randomRange(1, 4)) {
				case 1: type = "item_weapon_knife"; break;
				case 2: type = "item_weapon_spear"; break;
				case 3: type = "item_weapon_fireball"; break;
				case 4: type = "item_weapon_axe"; break;
			}
		}
		if (
			type.indexOf("item_weapon") >= 0
			&& player.hasWeapon("h_fire_sword")
		) {
			type = "item_chest";
		}
		this.dropObject(object, type);
	}

};

proto.updateObjects = function (elapsed) {

	var numMonsters = 0;
	var numMonstersAboveGate = 0;

	for (var id in this.objects) {

		var o = this.objects[id];

		if (o.isDead()) {
			if (o.role === "hero") {
				this.endGame();
				return;
			}
			o.execute("onDelete", [this]);
			delete(this.objects[o.id]);
			continue;
		}

		if (o.role === "monster" || o.type === "pickup_arrow") {
			numMonsters++;
			if (o.position.y <= GATE_CUTOFF_Y) {
				numMonstersAboveGate++;
			}
		}

		var action = o.update(elapsed, this);
		switch (action) {
			case "shoot":
				this.objectAttack(o);
				break;
		}

		if (o.isMoving() && !o.hasState(horde.Object.states.STUNNED)) {
			this.moveObject(o, elapsed);
		}

		if (
			o.role === "fluff"
			|| o.role === "powerup_food"
			|| o.hasState(horde.Object.states.DYING)
			|| o.hasState(horde.Object.states.INVISIBLE)
		) {
			continue;
		}

		for (var x in this.objects) {
			var o2 = this.objects[x];
			if (
				o2.isDead()
				|| o2.team === o.team
				|| o2.role === "fluff"
				|| o2.hasState(horde.Object.states.DYING)
				|| o2.hasState(horde.Object.states.INVISIBLE)
			) {
				continue;
			}
			// Reduce the size of the bounding boxes a tad when evaluating object => object collision
			if (o.boundingBox().reduce(5).intersects(o2.boundingBox().reduce(5))) {
				if (o.role == "hero") {
					if (o2.role == "powerup_food") {
						o2.die();
						o.wounds -= o2.healAmount;
						if (o.wounds < 0) o.wounds = 0;
						o.meatEaten++;
						horde.sound.play("eat_food");
						for (var j = 0; j < 5; ++j) {
							var heart = horde.makeObject("mini_heart");
							heart.position.x = (o.position.x + (j * (o.size.width / 5)));
							heart.position.y = (o.position.y + o.size.height - horde.randomRange(0, o.size.height));
							this.addObject(heart);
						}
					} else if (o2.role == "powerup_coin") {
						o2.die();
						o.gold += o2.coinAmount;
						horde.sound.play("coins");

						var c = this.coinPickup;
						c.amount = o2.coinAmount;
						c.y = 0;
						c.alpha = 1;
						c.position = o2.position.clone();
						c.state = "on";

						if (this.isSpecialLoot(o2.type)) {
							for (var j in this.objects) {
								if (this.objects[j].type === "pickup_arrow") {
									this.objects[j].die();
								}
							}
						}
					} else if (o2.role == "powerup_weapon") {
						o2.die();
						o.addWeapon(o2.wepType, o2.wepCount);
						horde.sound.play("pickup_weapon");

						var w = this.weaponPickup;
						w.type = o2.type;
						w.scale = 1;
						w.alpha = 0.9;
						w.position = o2.position.clone();
						w.state = "on";

						if (this.isSpecialLoot(o2.type)) {
							for (var j in this.objects) {
								if (this.objects[j].type === "pickup_arrow") {
									this.objects[j].die();
								}
							}
						}
					}
				}
				if (
					o.team !== null
					&& o2.team !== null
					&& o.team !== o2.team
				) {
					this.dealDamage(o2, o);
					this.dealDamage(o, o2);
				}
			}

		}

		// Update glowing weapons
		if (this.isBadassWeapon(o)) {
			if (o.glow === undefined) {
				o.glow = {
					alpha: 0,
					increment: GLOW_INCREMENT,
					timer: new horde.Timer()
				};
				o.glow.timer.start(50);
			}

			o.glow.timer.update(elapsed);

			if (o.glow.timer.expired()) {
				o.glow.timer.reset();
				o.glow.alpha += o.glow.increment;

				var max = (1 - GLOW_INCREMENT);
				if (o.glow.alpha >= max) {
					o.glow.alpha = max;
					o.glow.increment = -GLOW_INCREMENT;
				}

				var min = GLOW_INCREMENT;
				if (o.glow.alpha <= min) {
					o.glow.alpha = min;
					o.glow.increment = GLOW_INCREMENT;
				}
			}
		}

	}

	this.monstersAlive = numMonsters;
	this.monstersAboveGates = (numMonstersAboveGate > 0);

	var player = this.getPlayerObject();
	if (this.woundsTo < player.wounds) {
		this.woundsTo += ((this.woundsToSpeed / 1000) * elapsed);
	} else if (this.woundsTo > player.wounds) {
		this.woundsTo -= ((this.woundsToSpeed / 1000) * elapsed);
	} else {
		this.woundsTo = player.wounds;
	}

	var totalScore = this.getTotalScore();
	var diff = Math.abs(this.scoreCount - totalScore);
	var speed = horde.clamp(diff, 1000, 10000);
	var amount = Math.floor((speed / 1000) * elapsed);
	if (this.scoreCount < totalScore) {
		this.scoreCount += amount;
		if (this.scoreCount > totalScore) this.scoreCount = totalScore;
	} else if (this.scoreCount > totalScore) {
		this.scoreCount -= amount;
		if (this.scoreCount < totalScore) this.scoreCount = totalScore;
	}

	// Snap to grid to prevent vibrating bars
	if (Math.abs(player.wounds - this.woundsTo) <= 1) {
		this.woundsTo = player.wounds
	}

};

// Deals damage from object "attacker" to "defender"
proto.dealDamage = function (attacker, defender) {

	// Monsters don't damage projectiles
	if (attacker.role === "monster" && defender.role === "projectile") {
		return false;
	}

	// Allow the objects to handle the collision
	attacker.execute("onObjectCollide", [defender, this]);

	// Traps & Projectiles shouldn't damage each other
	if (
		(attacker.role == "projectile" && defender.role == "trap")
		|| (attacker.role == "trap" && defender.role == "projectile")
	) {
		return false;
	}

	// Allow the defender to declare themselves immune to attacks from the attacker
	// For example: Cube is immune to non-fire attacks
	var nullify = defender.execute("onThreat", [attacker, this]);

	// Check for defender immunity
	if (
		defender.hasState(horde.Object.states.INVINCIBLE)
		|| defender.hitPoints === Infinity
		|| nullify === true
	) {
		// Defender is immune/invincible
		if (
			attacker.role === "projectile"
			&& attacker.hitPoints !== Infinity
		) {
			if (
				(
					defender.damageType === "magic"
					|| defender.damageType === "physical"
				)
				&& attacker.damageType === "physical"
			) {
				// deflect if both parties are physical
				attacker.reverseDirection();
				attacker.deflect();
				horde.sound.play("immunity");
			} else {
				// otherwise just kill the attacker
				attacker.die();
			}
		}
		return false;
	}

	// Special case for non-immune projectiles hitting each other
	if (
		attacker.hitPoints !== Infinity
		&& attacker.role === "projectile"
		&& defender.role === "projectile"
		&& attacker.damageType === "physical"
		&& defender.damageType === "physical"
	) {
		if (attacker.piercing === false) {
			attacker.reverseDirection();
			attacker.deflect();
		}
		if (defender.piercing === false) {
			defender.reverseDirection();
			defender.deflect();
		}
		return false;
	}

	// Allow attackers to do stuff when they've hurt something
	attacker.execute("onDamage", [defender, this]);

	// Track combat stats
	var scorer = attacker;
	if (scorer.ownerId !== null) {
		var owner = this.objects[scorer.ownerId];
		if (owner) {
			scorer = owner;
		}
	}
	if (attacker.role === "projectile") {
		scorer.shotsLanded++;
	}

	// Deal damage and check for death
	if (defender.wound(attacker.damage)) {
		// defender has died

		// Assign gold/kills etc
		scorer.gold += defender.worth;
		scorer.kills++;
		defender.execute("onKilled", [attacker, this]);
		if (defender.lootTable.length > 0) {
			this.spawnLoot(defender);
		}

		// Handler piercing weapons
		if (
			attacker.role === "projectile"
			&& attacker.piercing === false
			&& attacker.hitPoints !== Infinity
		) {
			attacker.die();
		}

	} else {
		// defender did NOT die

		// Make the player invincible after some damage
		if (attacker.damage > 0 && defender.role === "hero") {
			defender.addState(horde.Object.states.INVINCIBLE, 2500);
		}

		// Projectile failed to kill it's target; automatic death for projectile
		if (attacker.role === "projectile" && attacker.hitPoints !== Infinity) {
			attacker.die();
		}

	}

};

/**
 * Updates the targeting reticle position based on mouse input
 * @return {void}
 */
proto.updateTargetReticle = function horde_Engine_proto_updateTargetReticle () {

	this.targetReticle.moving = false;

	// Grab the current mouse position as a vector
	var mouseV = new horde.Vector2(this.mouse.mouseX, this.mouse.mouseY);

	// Keep the targeting reticle inside of the play area
	// NOTE: This will need to be updated if the non-blocked map area changes
	var mouseBounds = new horde.Rect(
		32, 64, SCREEN_WIDTH - 64, SCREEN_HEIGHT - 160
	);

	var trp = this.targetReticle.position;

	if (trp.x !== mouseV.x && trp.y !== mouseV.y) {
		this.targetReticle.moving = true;
		var diff = trp.clone().subtract(mouseV.clone()).abs();
		var speed = horde.clamp((diff.x + diff.y) * 2, 1, 100);
		this.targetReticle.angle += ((speed / 1000) * this.lastElapsed);
		if (this.targetReticle.angle > (Math.PI * 2)) {
			this.targetReticle.angle = 0;
		}
	}

	// Adjust the X position
	if (mouseV.x < mouseBounds.left) {
		trp.x = mouseBounds.left;
	} else if (mouseV.x > mouseBounds.left + mouseBounds.width) {
		trp.x = mouseBounds.left + mouseBounds.width;
	} else {
		trp.x = mouseV.x;
	}

	// Adjust the Y position
	if (mouseV.y < mouseBounds.top) {
		trp.y = mouseBounds.top;
	} else if (mouseV.y > mouseBounds.top + mouseBounds.height) {
		trp.y = mouseBounds.top + mouseBounds.height;
	} else {
		trp.y = mouseV.y;
	}

};

/**
 * Grabs the data for where to continue the game
 */
proto.grabContinueInfo = function horde_Engine_proto_grabContinueInfo () {
	var _this = this;
	this.getData("checkpoint_wave", function(response) {
		var checkpointWave = response.data;
		if (checkpointWave !== null && typeof checkpointWave !== 'undefined') {
			// Checkpoint data exists
			_this.currentWaveId = (checkpointWave - 1);
			_this.getData("checkpoint_hero", function(response) {
				var checkpointHero = response.data;
				if (checkpointHero !== null) {
					var player = _this.getPlayerObject();
					player.load(checkpointHero);
					// Start the player at full life but ding him for the amount of wounds he had
					player.totalDamageTaken += player.wounds;
					player.wounds = 0;
				}
				_this.continuing = true;
				_this.showTutorial = false;
				_this.state = "intro_cinematic";
			});
		}
	}, true);
}

/**
 * Handles game input
 * @return {void}
 */
proto.handleInput = function horde_Engine_proto_handleInput () {

	var kb = this.keyboard;
	var keys = horde.Keyboard.Keys;
	var buttons = horde.Mouse.Buttons;
	var mouseV = new horde.Vector2(this.mouse.mouseX, this.mouse.mouseY);
	var newPointerY;
	var usingPointerOptions = false;

	this.leaderboardHover = this.achievementsHover = this.loginHover = false;

	if (this.state == "running") {

		// ESC to skip tutorial.
		if (this.keyboard.isKeyPressed(keys.ESCAPE)) {
			if (this.showTutorial) {
				this.tutorialIndex = TUTORIAL_NUM_TIPS;
				this.nextTutorial(TUTORIAL_NUM_TIPS + 1);
				return;
			}
		}

		// Press "p" to pause.
		if (this.keyboard.isKeyPressed(keys.P) || this.keyboard.isKeyPressed(keys.ESCAPE)) {
			this.togglePause();
			this.keyboard.clearKeys();
			return;
		}

		if (this.paused) {
			usingPointerOptions = true;
		}

		// Toggle sound with "M" for "mute".
		if (this.canMute && this.keyboard.isKeyPressed(77)) {
			horde.sound.toggleMuted();
		}

		// Toggle fullscreen with "F".
		if (this.canFullscreen && this.keyboard.isKeyPressed(70)) {
			this.toggleFullscreen();
		}

		// Toggle keyboard controls with "K".
		if (this.keyboard.isKeyPressed(75)) {
			this.wasdMovesArrowsAttack = !this.wasdMovesArrowsAttack;
		}

		// Code: html5 = HTML5 shield
		/*
		if (this.keyboard.historyMatch(horde.Keyboard.html5Code)) {
			var p = this.getPlayerObject();
			p.spriteY = 992;
		}
		*/

		if (!horde.isDemo()) {

			// Code: meat = Super Meat Boy mode
			if (this.keyboard.historyMatch(horde.Keyboard.meatboyCode)) {
				var p = this.getPlayerObject();
				p.isMeatboy = true;
				p.initMeatBoy();
			}

			// Code: lddqd = god mode
			if (this.keyboard.historyMatch(horde.Keyboard.godModeCode)) {
				this.keyboard.clearHistory();
				var p = this.getPlayerObject();
				p.cheater = true;
				if (p.hasState(horde.Object.states.INVINCIBLE)) {
					p.removeState(horde.Object.states.INVINCIBLE);
				} else {
					p.addState(horde.Object.states.INVINCIBLE);
				}
				horde.sound.play("code_entered");
			}

			// Code: ldkfa = Infinite fire swords
			if (this.keyboard.historyMatch(horde.Keyboard.allWeaponsCode)) {
				this.keyboard.clearHistory();
				var p = this.getPlayerObject();
				p.cheater = true;
				p.weapons = [{
					type: "h_fire_sword",
					count: null
				}];
				horde.sound.play("code_entered");
			}

			// Code: awesm = Infinite fire knives
			if (this.keyboard.historyMatch(horde.Keyboard.awesmCode)) {
				this.keyboard.clearHistory();
				var p = this.getPlayerObject();
				p.cheater = true;
				p.weapons = [{
					type: "h_fire_knife",
					count: null
				}];
				horde.sound.play("code_entered");
			}

			// Code: ldbomb = Infinite firebombs
			if (this.keyboard.historyMatch(horde.Keyboard.bombCode)) {
				this.keyboard.clearHistory();
				var p = this.getPlayerObject();
				p.cheater = true;
				p.weapons = [{
					type: "h_firebomb",
					count: null
				}];
				horde.sound.play("code_entered");
			}

			// Code: lddebug = toggle debug
			if (this.keyboard.historyMatch(horde.Keyboard.debugCode)) {
				this.keyboard.clearHistory();
				this.debug = !this.debug;
				horde.sound.play("code_entered");
			}

			// Code: ldreset = reset save data
			if (this.keyboard.historyMatch(horde.Keyboard.resetCode)) {
				this.keyboard.clearHistory();
				this.clearData("checkpoint_wave");
				this.clearData("checkpoint_hero");
				this.putData(HIGH_SCORE_KEY, DEFAULT_HIGH_SCORE);
				horde.sound.play("code_entered");
			}

			// Code: cyclops = play as the cyclops
			if (this.keyboard.historyMatch(horde.Keyboard.cyclopsCode)) {
				var p = this.getPlayerObject();

				if (!p.cheater) {
					horde.sound.play("code_entered");
					this.keyboard.clearHistory();

					p.cheater = true;
					p.hitPoints *= 2;
					p.size = new horde.Size(64, 64);
					p.spriteY = 224;
					p.weapons = [
						{type: "e_boulder", count: null}
					];
					p.wounds *= 2;
				}
			}

		} // end isDemo

		if (this.paused) {

			var startY = (this.pointerYStart - 22);

			if (this.verifyQuit) {
				// Nevermind
				if (
					(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 192))
					&& (mouseV.y > startY && mouseV.y < (startY + (POINTER_HEIGHT - 1)))
				) {
					if (this.mouse.hasMoved && this.pointerY !== 0) newPointerY = 0;
					if (this.mouse.isButtonDown(buttons.LEFT)) {
						this.keyboard.keyStates[keys.SPACE] = true;
					}
				}

				// Quit, seriously
				if (
					(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 192))
					&& (mouseV.y > (startY + POINTER_HEIGHT) && mouseV.y < ((startY + POINTER_HEIGHT) + 36))
				) {
					if (this.mouse.hasMoved && this.pointerY !== 1) newPointerY = 1;
					if (this.mouse.isButtonDown(buttons.LEFT)) {
						this.keyboard.keyStates[keys.SPACE] = true;
					}
				}
			} else {
				// Resume
				if (
					(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 106))
					&& (mouseV.y > startY && mouseV.y < (startY + (POINTER_HEIGHT - 1)))
				) {
					if (this.mouse.hasMoved && this.pointerY !== 0) newPointerY = 0;
					if (this.mouse.isButtonDown(buttons.LEFT)) {
						this.keyboard.keyStates[keys.SPACE] = true;
					}
				}

				// Quit
				if (
					(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 106))
					&& (mouseV.y > (startY + POINTER_HEIGHT) && mouseV.y < ((startY + POINTER_HEIGHT) + 36))
				) {
					if (this.mouse.hasMoved && this.pointerY !== 1) newPointerY = 1;
					if (this.mouse.isButtonDown(buttons.LEFT)) {
						this.keyboard.keyStates[keys.SPACE] = true;
					}
				}
			}

			if (kb.isKeyPressed(keys.ENTER) || kb.isKeyPressed(keys.SPACE)) {

				kb.clearKey(keys.ENTER);
				kb.clearKey(keys.SPACE);
				this.mouse.clearButtons();

				switch (this.pointerY) {
					case 0: // Resume
						this.togglePause();
						break;
					case 1: // Quit
						horde.sound.play("select_pointer");
						if (this.verifyQuit) {
							this.verifyQuit = false;
							this.togglePause();
							var p = this.getPlayerObject();
							p.wound(100);
						} else {
							this.pointerY = 0;
							this.verifyQuit = true;
						}
						break;
				}

			}
		}

	}

	if (this.state === "title") {

		usingPointerOptions = true;

		// Konami code! Hit Points *= 3
		if (!this.konamiEntered && this.keyboard.historyMatch(horde.Keyboard.konamiCode)) {
			horde.sound.play("code_entered");
			this.konamiEntered = true;
			var p = this.getPlayerObject();
			p.cheater = true;
			p.hitPoints *= 3;
		}

		// Accept hover/click with mouse on title screen options [#102]
		var startX = (POINTER_X - 40);
		var stopX = (POINTER_X + 130);
		var startY = (this.pointerYStart - 22);

		// Buy Now! or Continue
		if (horde.isDemo() || this.canContinue()) {
			if (
				(mouseV.x >= startX && mouseV.x <= stopX)
				&& (mouseV.y >= startY && mouseV.y < (startY + 20))
			) {
				if (this.mouse.hasMoved && this.pointerY !== 0) newPointerY = 0;
				if (this.mouse.isButtonDown(buttons.LEFT)) {
					this.keyboard.keyStates[keys.SPACE] = true;
				}
			}
		}

		// New game
		startY += POINTER_HEIGHT;
		if (
			(mouseV.x >= startX && mouseV.x <= stopX)
			&& (mouseV.y >= startY && mouseV.y < (startY + 20))
		) {
			if (this.mouse.hasMoved && this.pointerY !== 1) newPointerY = 1;
			if (this.mouse.isButtonDown(buttons.LEFT)) {
				this.keyboard.keyStates[keys.SPACE] = true;
			}
		}

		// Credits
		startY += POINTER_HEIGHT;
		if (
			(mouseV.x >= startX && mouseV.x <= stopX)
			&& (mouseV.y >= startY && mouseV.y < (startY + 20))
		) {
			if (this.mouse.hasMoved && this.pointerY !== 2) newPointerY = 2;
			if (this.mouse.isButtonDown(buttons.LEFT)) {
				this.keyboard.keyStates[keys.SPACE] = true;
			}
		}

		// Clay.io: High Scores
		startY = 444; // 444px from top
		if (
			(mouseV.x >= POINTER_X - 50 && mouseV.x <= POINTER_X + 50)
			&& (mouseV.y >= startY && mouseV.y < (startY + 18)) // 18 = height of button
		) {
			this.leaderboardHover = true;
			if (this.mouse.isButtonDown(buttons.LEFT)) {
				if(!this.leaderboardShowFlag) {
					this.leaderboardShowFlag = true; // So the LB only shows once (with a 1 second 'cooldown')
					this.showLeaderboard();
					var _this = this;
					setTimeout(function() {
						_this.leaderboardShowFlag = false;
					}, 1000);
				}
			}
		}
		// Clay.io: Achievements List
		if (
			(mouseV.x >= POINTER_X + 50 && mouseV.x <= POINTER_X + 150)
			&& (mouseV.y >= startY && mouseV.y < (startY + 20)) // 20 = height of button
		) {
			this.achievementsHover = true;
			if (this.mouse.isButtonDown(buttons.LEFT)) {
				if(!this.achievementsShowFlag) {
					this.achievementsShowFlag = true; // So the LB only shows once (with a 1 second 'cooldown')
					Clay.Achievement.showAll();
					var _this = this;
					setTimeout(function() {
						_this.achievementsShowFlag = false;
					}, 1000);
				}
			}
		}
		// Clay.io: Login
		startY += 20;
		if (
			!this.loggedIn
			&& (mouseV.x >= startX && mouseV.x <= stopX)
			&& (mouseV.y >= startY && mouseV.y < (startY + 18)) // 18 = height of button
		) {
			this.loginHover = true;
			if (this.mouse.isButtonDown(buttons.LEFT)) {
				if(!this.loginShowFlag) {
					this.loginShowFlag = true; // So the LB only shows once (with a 1 second 'cooldown')
					Clay.Player.login();
					var _this = this;
					setTimeout(function() {
						_this.loginShowFlag = false;
					}, 1000);
				}
			}
		}

		if (kb.isKeyPressed(keys.ENTER) || kb.isKeyPressed(keys.SPACE)) {

			horde.sound.play("select_pointer");
			kb.clearKey(keys.ENTER);
			kb.clearKey(keys.SPACE);
			this.mouse.clearButtons();

			switch (this.pointerY) {
				case 0:
					if (horde.isDemo()) {
						// Buy Now!
						location.href = URL_STORE;
					} else {
						// Continue
						this.grabContinueInfo();
					}
					break;
				case 1: // New game
					this.continuing = false;
					this.showTutorial = !this.touchMove;
					this.state = "intro_cinematic";
					break;
				case 2: // Credits
					this.state = "credits";
					break;
			}

		}

	}

	if (this.state == "buy_now") {

		usingPointerOptions = true;

		var startY = (this.pointerYStart - 22);

		// Buy Now!!
		if (
			(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 106))
			&& (mouseV.y > startY && mouseV.y < (startY + (POINTER_HEIGHT - 1)))
		) {
			if (this.mouse.hasMoved && this.pointerY !== 0) newPointerY = 0;
			if (this.mouse.isButtonDown(buttons.LEFT)) {
				this.keyboard.keyStates[keys.SPACE] = true;
			}
		}

		// Maybe later
		if (
			(mouseV.x >= POINTER_X && mouseV.x <= (POINTER_X + 106))
			&& (mouseV.y > (startY + POINTER_HEIGHT) && mouseV.y < ((startY + POINTER_HEIGHT) + 36))
		) {
			if (this.mouse.hasMoved && this.pointerY !== 1) newPointerY = 1;
			if (this.mouse.isButtonDown(buttons.LEFT)) {
				this.keyboard.keyStates[keys.SPACE] = true;
			}
		}

		if (kb.isKeyPressed(keys.ENTER) || kb.isKeyPressed(keys.SPACE)) {

			kb.clearKey(keys.ENTER);
			kb.clearKey(keys.SPACE);
			this.mouse.clearButtons();

			horde.sound.play("select_pointer");

			switch (this.pointerY) {
				case 0: // Buy Now!!
					location.href = URL_STORE;
					break;
				case 1: // Maybe later
					horde.sound.stop("victory");
					this.initGame();
					break;
			}

		}

	}

	if (
		(this.state === "credits")
	) {
		if (this.keyboard.isAnyKeyPressed() || this.mouse.isAnyButtonDown()) {
			kb.clearKeys();
			this.mouse.clearButtons();
			this.state = "title";
		}
	}

	if (this.state === "intro_cinematic") {
		if (this.keyboard.isAnyKeyPressed() || this.mouse.isAnyButtonDown()) {
			kb.clearKeys();
			this.mouse.clearButtons();
			this.state = "running";
			var player = this.getPlayerObject();
			this.woundsTo = player.wounds;
			this.currentMusic = "normal_battle_music";
			horde.sound.play(this.currentMusic);
		}
	}

	if (usingPointerOptions) {

		if (
			this.keyboard.isKeyPressed(keys.W)
			|| this.keyboard.isKeyPressed(keys.UP)
		) {
			this.keyboard.keyStates[keys.W] = false;
			this.keyboard.keyStates[keys.UP] = false;
			this.pointerY--;
			if (this.pointerY < this.pointerOptionsStart) this.pointerY = this.maxPointerY;
			horde.sound.play("move_pointer");
		}
		if (
			this.keyboard.isKeyPressed(keys.S)
			|| this.keyboard.isKeyPressed(keys.DOWN)
		) {
			this.keyboard.keyStates[keys.S] = false;
			this.keyboard.keyStates[keys.DOWN] = false;
			this.pointerY++;
			if (this.pointerY > this.maxPointerY) this.pointerY = this.pointerOptionsStart;
			horde.sound.play("move_pointer");
		}

		this.keyboard.storeKeyStates();

		if (newPointerY !== undefined) {
			horde.sound.play("move_pointer");
			this.pointerY = newPointerY;
		}

	}

	if (this.state === "running") {
		var player = this.getPlayerObject();

		if (this.paused || player.hasState(horde.Object.states.DYING)) {
			this.keyboard.storeKeyStates();
			return;
		}

		if (!this.touchMove) {
			this.updateTargetReticle();
		} else {
			this.targetReticle.angle += (((Math.PI * 2) / 5000) * this.lastElapsed);
			if (this.targetReticle.angle > (Math.PI * 2)) {
				this.targetReticle.angle = 0;
			}
			if (
				this.mouse.wasButtonClicked(buttons.LEFT)
				|| this.mouse.isButtonDown(buttons.LEFT)
			) {
				var mouseBounds = new horde.Rect(
					48, 80, SCREEN_WIDTH - 96, SCREEN_HEIGHT - 192
				);
				var trp = this.targetReticle.position;
				// Adjust the X position
				if (mouseV.x < mouseBounds.left) {
					trp.x = mouseBounds.left;
				} else if (mouseV.x > mouseBounds.left + mouseBounds.width) {
					trp.x = mouseBounds.left + mouseBounds.width;
				} else {
					trp.x = mouseV.x;
				}
				// Adjust the Y position
				if (mouseV.y < mouseBounds.top) {
					trp.y = mouseBounds.top;
				} else if (mouseV.y > mouseBounds.top + mouseBounds.height) {
					trp.y = mouseBounds.top + mouseBounds.height;
				} else {
					trp.y = mouseV.y;
				}
			}
		}

		var move = new horde.Vector2();
		var shoot = new horde.Vector2();

		if (this.touchMove) {

			// Auto Target
			var hostile = this.getNearestHostile(player);
			if (hostile !== null) {
				shoot = hostile.boundingBox().center().subtract(
					player.boundingBox().center()
				).normalize();
			}

			// Move towards reticle
			move = this.targetReticle.position.clone().subtract(
				player.boundingBox().center()
			).normalize();
			var distance = this.targetReticle.position.clone().subtract(
				player.boundingBox().center()
			).magnitude();
			if (distance < 3) {
				move.zero();
			}

		} else {

			if (this.wasdMovesArrowsAttack) {
				var controls = {
					moveUp: keys.W,
					moveLeft: keys.A,
					moveDown: keys.S,
					moveRight: keys.D,
					attackUp: keys.UP,
					attackDown: keys.DOWN,
					attackLeft: keys.LEFT,
					attackRight: keys.RIGHT
				};
			} else {
				var controls = {
					moveUp: keys.UP,
					moveDown: keys.DOWN,
					moveLeft: keys.LEFT,
					moveRight: keys.RIGHT,
					attackUp: keys.W,
					attackLeft: keys.A,
					attackDown: keys.S,
					attackRight: keys.D
				};
			}

			// Moving
			if (kb.isKeyDown(controls.moveUp)) {
				move.y = -1;
				this.nextTutorial(1);
			}
			if (kb.isKeyDown(controls.moveLeft)) {
				move.x = -1;
				this.nextTutorial(1);
			}
			if (kb.isKeyDown(controls.moveDown)) {
				move.y = 1;
				this.nextTutorial(1);
			}
			if (kb.isKeyDown(controls.moveRight)) {
				move.x = 1;
				this.nextTutorial(1);
			}

			// Shooting
			if (kb.isKeyDown(controls.attackUp)) {
				shoot.y = -1;
				this.nextTutorial(2);
			}
			if (kb.isKeyDown(controls.attackDown)) {
				shoot.y = 1;
				this.nextTutorial(2);
			}
			if (kb.isKeyDown(controls.attackLeft)) {
				shoot.x = -1;
				this.nextTutorial(2);
			}
			if (kb.isKeyDown(controls.attackRight)) {
				shoot.x = 1;
				this.nextTutorial(2);
			}

		}

		// Move the player
		player.stopMoving();
		if ((move.x !== 0) || (move.y !== 0)) {
			player.setDirection(move);
		}

		if (this.mouse.wasButtonClicked(buttons.LEFT)) {
			if (
				this.showTutorial
				&& (mouseV.y <= (TUTORIAL_HEIGHT + this.tutorialY))
			) {
				// Dismiss tutorial
				this.tutorialIndex = TUTORIAL_NUM_TIPS;
				this.nextTutorial(TUTORIAL_NUM_TIPS + 1);
				this.mouse.clearButtons();
			} else if (
				mouseV.x >= 604
				&& mouseV.x <= 636
				&& mouseV.y >= 442
				&& mouseV.y <= 475
			) {
				if (this.canFullscreen) {
					this.toggleFullscreen();
					this.mouse.clearButtons();
				} else {
					this.togglePause();
				}
			} else if (
				this.canMute
				&& ((mouseV.x >= 570) && (mouseV.x <= 602))
				&& ((mouseV.y >= 442) && (mouseV.y <= 484))
			) {
				// Toggle mute
				horde.sound.toggleMuted();
				this.mouse.clearButtons();
			}
		}

		if (this.mouse.isButtonDown(buttons.LEFT) && !this.touchMove) {
			var v = this.targetReticle.position.clone().subtract(player.boundingBox().center()).normalize();
			this.objectAttack(player, v);
			this.heroFiring = true;
			this.heroFiringDirection = v;
			this.nextTutorial(4);
			this.showReticle = true;
		} else if (shoot.x !== 0 || shoot.y !== 0) {
			this.objectAttack(player, shoot);
			this.heroFiring = true;
			this.heroFiringDirection = shoot;
		} else {
			this.heroFiring = false;
			this.heroFiringDirection = null;
		}

		this.keyboard.storeKeyStates();
		this.mouse.storeButtonStates();
	}

};

proto.getNearestHostile = function (object) {
	var nearest = {
		obj: null,
		distance: Infinity
	};
	for (var id in this.objects) {
		var o = this.objects[id];
		if (
			o.team != object.team
			&& (o.role == "monster" || o.role == "projectile")
			&& o.hitPoints !== Infinity
			&& this.isAlive(o.id)
			&& !(o.hasState(horde.Object.states.INVINCIBLE) || o.hasState(horde.Object.states.INVISIBLE))
		) {
			var distance = object.boundingBox().center().subtract(
				o.boundingBox().center()
			).magnitude();
			if (distance < nearest.distance) {
				nearest.obj = o;
				nearest.distance = distance;
			}
		}
	}
	if (nearest.obj === null) {
		return null;
	} else {
		return nearest.obj;
	}
};

proto.objectAttack = function (object, v) {

	if (!v) {
		v = object.facing;
	}

	var weaponType = object.fireWeapon();
	if (weaponType === false) {
		return;
	}

	var weaponDef = horde.objectTypes[weaponType];

	switch (weaponType) {

		case "e_minotaur_trident":
			var h = v.heading();
			for (var x = -0.5; x <= 0.5; x += 0.5) {
				this.spawnObject(
					object,
					weaponType,
					horde.Vector2.fromHeading(h + x)
				);
			}
			object.shotsFired += 3;
			break;

		// Shoot 2 knives in a spread pattern
		case "h_knife":
		case "h_fire_knife":
			var h = v.heading();
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h - 0.1
			));
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h + 0.1
			));
			object.shotsFired += 2;
			break;

		// Spread fire shotgun style
		case "e_fireball_green":
			for (var x = -0.25; x <= 0.25; x += 0.25) {
				var h = v.heading();
				h += (x + (horde.randomRange(-1, 1) / 10));
				this.spawnObject(
					object,
					weaponType,
					horde.Vector2.fromHeading(h)
				);
			}
			object.shotsFired += 3;
			break;

		case "h_fireball":
			var h = v.heading();
			var vh = horde.Vector2.fromHeading(h);

			var id = this.spawnObject(object, weaponType, vh.clone());
			var o = this.objects[id];
			o.position.add(horde.Vector2.fromHeading(h - (Math.PI / 2)).scale(16));
			o.position.add(vh.clone().scale(16));

			var id = this.spawnObject(object, weaponType, vh.clone());
			var o = this.objects[id];
			o.position.add(vh.clone().scale(32));

			var id = this.spawnObject(object, weaponType, vh.clone());
			var o = this.objects[id];
			o.position.add(horde.Vector2.fromHeading(h + (Math.PI / 2)).scale(16));
			o.position.add(vh.clone().scale(16));
			object.shotsFired += 3;
			break;

		case "h_firebomb":
			var rv = this.targetReticle.position.clone();
			var len = (Math.PI * 2);
			var step = (len / 20);

			for (var h = 0; h < len; h += step) {
				var o = horde.makeObject("h_fireball");
				o.position.x = rv.x - 16;
				o.position.y = rv.y - 16;
				o.setDirection(horde.Vector2.fromHeading(h));
				o.ownerId = object.id;
				o.team = object.team;
				this.addObject(o);
				object.shotsFired += 1;
			}
			break;

		// Shoot 5 firebursts out in a spread pattern
		/*
		case "h_fireburst":
			var h = v.heading();
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h - 0.4
			));
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h - 0.2
			));
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h
			));
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h + 0.2
			));
			this.spawnObject(object, weaponType, horde.Vector2.fromHeading(
				h + 0.4
			));
			object.shotsFired += 5;
			break;
			*/

		case "e_ring_fire":
			var len = (Math.PI * 2);
			var step = (len / 10);
			var seed = (step / 2);
			for (var h = seed; h < len + seed; h += step) {
				this.spawnObject(
					object,
					weaponType,
					horde.Vector2.fromHeading(h)
				);
			}
			break;

			case "e_ring_fire_dopp":
				var len = (Math.PI * 2);
				var step = (len / 10);
				for (var h = 0; h < len; h += step) {
					this.spawnObject(
						object,
						weaponType,
						horde.Vector2.fromHeading(h)
					);
				}
				break;

		// Spawn in a circle around the object
		case "e_bouncing_boulder":
			var len = (Math.PI * 2);
			var step = (len / 8);
			for (var h = 0; h < len; h += step) {
				this.spawnObject(
					object,
					weaponType,
					horde.Vector2.fromHeading(h)
				);
			}
			break;

		// Shoot one instance of the weapon
		default:
			this.spawnObject(object, weaponType, v);
			object.shotsFired++;
			break;

	}

	// Increment shots per weapon counter
	if (!object.shotsPerWeapon[weaponType]) {
		object.shotsPerWeapon[weaponType] = 0;
	}
	object.shotsPerWeapon[weaponType]++;

	// Determine what sound (if any) to play
	// Attacking sound on weapon type > attacking sound on object performing attack
	var sound = null;
	if (weaponDef.soundAttacks) {
		sound = weaponDef.soundAttacks;
	} else if (object.soundAttacks) {
		sound = object.soundAttacks;
	}
	if (sound !== null) {
		horde.sound.play(sound);
	}

};

proto.render = function horde_Engine_proto_render () {

	var ctx = this.canvases["display"].getContext("2d");

	switch (this.state) {

		// Company Logo
		case "intro":
			this.drawLogo(ctx);
			break;

		// Title Screen
		case "title":
			this.drawTitle(ctx);
			this.drawPointer(ctx);
			this.drawTitlePointerOptions(ctx);
			break;

		// Credits
		case "credits":
			this.drawTitle(ctx);
			this.drawCredits(ctx);
			break;

		case "intro_cinematic":
			this.drawIntroCinematic(ctx);
			break;

		// The game!
		case "running":
			this.drawFloor(ctx);
			if (!this.wonGame) {
				this.drawTargetReticle(ctx);
			}
			this.drawObjects(ctx);
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
			this.drawWeaponPickup(ctx);
			this.drawCoinPickup(ctx);
			this.drawWaveText(ctx);
			this.drawUI(ctx);
			if (this.paused) {
				this.drawPaused(ctx);
				this.drawPointer(ctx);
				this.drawPausedPointerOptions(ctx);
			}
			if (this.showTutorial) {
				this.drawTutorial(ctx);
			}
			break;

		case "game_over":
			this.drawGameOver(ctx);
			break;

		case "buy_now":
			this.drawBuyNow(ctx);
			this.drawPointer(ctx);
			break;

	}

	if (this.debug === true) {
		this.drawDebugInfo(ctx);
	}

};

proto.drawWeaponPickup = function horde_Engine_proto_drawWeaponPickup (ctx) {
	var w = this.weaponPickup;
	if (w.state === "on") {
		var type = horde.makeObject(w.type);
		ctx.save();
		ctx.translate(
			w.position.x + (type.size.width / 2),
			w.position.y + (type.size.height / 2)
		);
		ctx.globalAlpha = w.alpha;
		// Draw scroll
		ctx.drawImage(
			this.images.getImage("objects"),
			128, 192, 48, 48,
			-22 * w.scale, -20 * w.scale, 48 * w.scale, 48 * w.scale
		);
		// Draw weapon
		ctx.drawImage(
			this.images.getImage(type.spriteSheet),
			type.spriteX, type.spriteY + 1, type.size.width - 1, type.size.height - 1,
			-((type.size.width / 2) * w.scale), -((type.size.height / 2) * w.scale),
			type.size.width * w.scale, type.size.height * w.scale
		);
		ctx.restore();
	}
};

proto.drawCoinPickup = function horde_Engine_proto_drawCoinPickup (ctx) {
	var w = this.coinPickup;
	if (w.state === "on") {
		var meta = this.getCoinFontData(w.amount);
		var text = ("+" + w.amount);

		ctx.save();
		ctx.fillStyle = meta.fillStyle;
		ctx.font = ("Bold " + meta.size + "px MedievalSharp");
		ctx.lineWidth = 2;
		ctx.strokeStyle = COLOR_BLACK;
		ctx.textAlign = "center";
		ctx.textBaseline = "top";
		ctx.translate(
			w.position.x,
			w.position.y
		);
		ctx.globalAlpha = w.alpha;
		ctx.strokeText(text, 0, 0);
		ctx.fillText(text, 0, 0);
		ctx.restore();
	}
};

proto.getCoinFontData = function horde_Engine_proto_getCoinFontData (amount) {
	if (amount == 100) {
		return {
			fillStyle: "rgb(255, 203, 5)",
			size: 24
		};
	} else if (amount == 500) {
		return {
			fillStyle: "rgb(255, 244, 96)",
			size: 36
		};
	} else {
		return {
			fillStyle: "rgb(255, 248, 160)",
			size: 50
		};
	}
};

proto.drawWaveText = function horde_Engine_proto_drawWaveText (ctx) {
	// Back out immediately if we shoudn't draw
	if (this.waveText.state == "off") {
		return;
	}

	var size = parseInt(this.waveText.size);
	var width = (this.waveText.width * size);
	var height = WAVE_TEXT_HEIGHT * size;
	var x = (SCREEN_WIDTH/2) - (width/2);
	var y = (SCREEN_HEIGHT/2) - (height/2);

	ctx.save();
	ctx.globalAlpha = this.waveText.alpha;
	ctx.drawImage(
		this.canvases.waveText,
		0, 0, this.waveText.width, WAVE_TEXT_HEIGHT,
		x, y, width, height
	);
	ctx.restore();
};

/**
 * Draws the game over screen.
 * @param {object} Canvas 2d context to draw on.
 */
proto.drawGameOver = function horde_Engine_proto_drawGameOver (ctx) {

	if (this.goAlphaStep) {
		this.goAlpha += this.goAlphaStep;
		if (this.goAlpha <= 0) {
			this.goAlpha = 0;
			this.goAlphaStep = 0.025;
		}
		if (this.goAlpha >= 1) {
			this.goAlpha = 1;
			this.goAlphaStep = -0.025;
		}
	} else {
		this.goAlphaStep = -0.025;
		this.goAlpha = 1;
	}

	if (!this.gameOverBg) {
		this.drawUI(ctx);
		this.gameOverBg = ctx.getImageData(0, 0, this.view.width, this.view.height);
	}

	ctx.putImageData(this.gameOverBg, 0, 0);

	ctx.save();
	ctx.globalAlpha = this.gameOverAlpha;
	if (this.wonGame) {
		ctx.fillStyle = COLOR_BLACK;
	} else {
		ctx.fillStyle = "rgb(215, 25, 32)"; // red
	}
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();

	if (this.gameOverReady === true) {

		if (this.keyboard.isAnyKeyPressed() || this.mouse.isAnyButtonDown()) {
			this.keyboard.clearKeys();
			this.mouse.clearButtons();
			this.statsIndex += 1;
			if (this.statsIndex >= 5) {
				if (horde.isDemo()) {
					this.state = "buy_now";
					this.initOptions();
				} else {
					horde.sound.stop("victory");
					this.initGame();
				}
				return;
			}
		}

		var headerY = 70;

		// Modal
		ctx.drawImage(
			this.preloader.getImage("ui"),
			0, 2322, 564, 404,
			38, 38, 564, 404
		);

		// Game Over
		if (this.wonGame) {
			ctx.drawImage(
				this.preloader.getImage("ui"),
				564, 2444, 256, 50,
				192, headerY, 256, 50
			);
		} else if (this.gotNewHighScore) {
			ctx.drawImage(
				this.preloader.getImage("ui"),
				564, 2374, 404, 50,
				119, headerY, 404, 50
			);
		} else {
			ctx.drawImage(
				this.preloader.getImage("ui"),
				564, 2324, 218, 50,
				211, headerY, 218, 50
			);
		}

		this.drawObjectStats(this.getPlayerObject(), ctx);

		// Press anything to continue ...
		if (this.statsIndex >= 4) {
			ctx.drawImage(
				this.preloader.getImage("ui"),
				564, 2424, 334, 20,
				153, 404, 334, 20
			);
		}

	}

};

proto.drawBuyNow = function horde_Engine_proto_drawBuyNow (ctx) {

	ctx.save();

	ctx.globalAlpha = OVERLAY_ALPHA;
	ctx.fillRect(0, 0, this.view.width, this.view.height);

	ctx.globalAlpha = 1;
	ctx.drawImage(
		this.preloader.getImage("ui"),
		370, 0, 564, 404,
		38, 38, 564, 404
	);
	ctx.restore();

	var startY = (this.pointerYStart - 22);
	var spriteX;

	// Buy Now!!
	spriteX = ((this.pointerY == 0) ? 260 : 0);
	ctx.drawImage(
		this.preloader.getImage("ui"),
		spriteX, 2122, 200, 40,
		POINTER_X, startY, 200, 40
	);

	// Maybe later
	spriteX = ((this.pointerY == 1) ? 260 : 0);
	startY += POINTER_HEIGHT;
	ctx.drawImage(
		this.preloader.getImage("ui"),
		spriteX, 2182, 200, 40,
		POINTER_X, startY, 200, 40
	);

};

proto.drawObjectStats = function horde_Engine_proto_drawObjectStats (object, ctx) {

	var textX = 350;
	var textHeight = 55;

	ctx.save();
	ctx.font = "Bold 40px MedievalSharp";

	var increment;
	var max = 0;
	var nextTimer = 0;

	var wavesComplete = this.currentWaveId;

	if (this.wonGame) {
		wavesComplete += 1;
	}

	// Waves
	var displayWave = 0;
	if (this.statsIndex === 0) {
		displayWave = this.statsCount;
		max = wavesComplete;
		// Settings for Gold earned:
		increment = 199;
		nextTimer = 10;
	} else {
		displayWave = wavesComplete;
	}
	ctx.fillStyle = "rgb(199, 234, 251)";
	ctx.fillText(displayWave + " x 1000", textX, 182);

	// Gold earned
	var displayGold = 0;
	if (this.statsIndex === 1) {
		displayGold = this.statsCount;
		max = object.gold;
		// Settings for Damage taken:
		increment = 10;
		nextTimer = 10;
	} else if (this.statsIndex > 1) {
		displayGold = object.gold;
	}
	ctx.fillStyle = "rgb(255, 245, 121)";
	ctx.fillText(displayGold, textX, (180 + textHeight));

	// Damage taken
	var displayDamage = 0;
	if (this.statsIndex === 2) {
		displayDamage = this.statsCount;
		max = object.totalDamageTaken;
		// Settings for Total score:
		increment = 299;
		nextTimer = 5;
	} else if (this.statsIndex > 2) {
		displayDamage = object.totalDamageTaken;
	}
	ctx.fillStyle = "rgb(237, 28, 36)";
	ctx.fillText("-" + displayDamage + " x 10", textX, 180 + (textHeight * 2));

	// Total score
	var displayScore = "";
	var totalScore = this.getTotalScore();
	if (this.statsIndex === 3) {
		displayScore = this.statsCount;
		max = totalScore;
	} else if (this.statsIndex > 3) {
		displayScore = totalScore;
	}
	ctx.fillStyle = "rgb(250, 166, 26)";
	ctx.fillText(displayScore, textX, (184 + (textHeight * 3)));

	if (this.statsCount >= max) {
		this.statsCount = 0;
		this.statsIncrement = increment;
		this.statsIndex += 1;
		this.statsTimer.start(nextTimer);
	}

	ctx.restore();

};

/**
 * Calculates the player's total score
 */
proto.getTotalScore = function () {

	var player = this.getPlayerObject();
	var wavesComplete = this.currentWaveId;

	if (this.wonGame) {
		wavesComplete += 1;
	}

	var score = (wavesComplete * 1000);
	score += player.gold;
	score -= (player.totalDamageTaken * 10);

	if (player.cheater === true) {
		score /= 2;
	}

	if (score < 0) {
		score = 0;
	}

	return score;
};

proto.drawLogo = function horde_Engine_proto_drawLogo (ctx) {

	// Clear the screen
	ctx.save();
	ctx.fillStyle = COLOR_BLACK;
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.restore();

	// Draw the logo
	if (this.logoAlpha > 0) {
		ctx.save();
		ctx.globalAlpha = this.logoAlpha;
		ctx.drawImage(
			this.preloader.getImage("ui"),
			0, 0, 370, 430,
			160, 0, 370, 430
		);
		ctx.restore();
	}

};

proto.drawFloor = function horde_Engine_proto_drawFloor (ctx) {
	var offset = this.getArenaOffset();
	ctx.drawImage(
		this.images.getImage("arena"),
		(offset + 32), 480, 576, 386,
		32, 0, 576, 386
	);
};

proto.drawWalls = function horde_Engine_proto_drawWalls (ctx) {
	var offset = this.getArenaOffset();
	ctx.drawImage(
		this.images.getImage("arena"),
		offset, 0, SCREEN_WIDTH, SCREEN_HEIGHT,
		0, 0, this.view.width, this.view.height
	);
};

proto.getArenaOffset = function horde_Engine_proto_getArenaOffset () {
  var waveId = ((this.currentWaveId >= 0) ? this.currentWaveId : 0);
	return (SCREEN_WIDTH * Math.floor(waveId / 10));
};

proto.drawPaused = function horde_Engine_proto_drawPaused (ctx) {

	ctx.save();

	ctx.globalAlpha = OVERLAY_ALPHA;
	ctx.fillRect(0, 0, this.view.width, this.view.height);

	ctx.globalAlpha = 1;
	ctx.drawImage(
		this.preloader.getImage("ui"),
		0, 1718, 564, 404,
		38, 38, 564, 404
	);

	var player = this.getPlayerObject();

	ctx.font = "Bold 36px MedievalSharp";
	ctx.textAlign = "left";

	ctx.fillStyle = "rgb(237, 28, 36)";
	ctx.fillText(player.kills, 390, 164);

	ctx.fillStyle = "rgb(145, 102, 0)";
	ctx.fillText(player.meatEaten, 390, 216);

	ctx.fillStyle = "rgb(199, 234, 251)";
	ctx.fillText(player.shotsFired, 390, 270);

	ctx.fillStyle = "rgb(250, 166, 26)";
	ctx.fillText(this.getAccuracy(player) + "%", 390, 324);

	ctx.restore();

};

proto.getAccuracy = function horde_Engine_proto_getAccuracy (player) {
	if (player.shotsFired === 0) return 0;

	return Math.round((player.shotsLanded / player.shotsFired) * 100);
};

proto.drawTutorial = function horde_Engine_proto_drawTutorial (ctx) {

	if (this.paused) return;

	ctx.save();
	ctx.globalAlpha = OVERLAY_ALPHA;
	ctx.fillRect(0, this.tutorialY, this.view.width, TUTORIAL_HEIGHT);

	ctx.globalAlpha = 1;
	ctx.font = "Bold 22px MedievalSharp";
	ctx.textAlign = "center";

	var tips = [
		"MOVE with the WASD keys.",
		"ATTACK with the ARROW keys.",
		"Or use the MOUSE to AIM with the target reticle.",
		"ATTACK by HOLDING DOWN the LEFT MOUSE BUTTON.",
		"KILL MONSTERS and COLLECT GOLD to raise your score!"
	];

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(tips[this.tutorialIndex], 322, (this.tutorialY + 36));

	ctx.fillStyle = "rgb(230, 230, 230)";
	ctx.fillText(tips[this.tutorialIndex], 320, (this.tutorialY + 34));

	ctx.font = "20px MedievalSharp";

	var pressHere = "Press here or ESC to skip";
	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(pressHere, 322, (this.tutorialY + 62));

	ctx.fillStyle = "rgb(118, 151, 183)";
	ctx.fillText(pressHere, 320, (this.tutorialY + 60));
	ctx.restore();

};

/**
 * Returns the draw order of objects based on their Y position + height
 * @return {array} Array of object IDs in the order that they should be drawn
 */
proto.getObjectDrawOrder = function horde_Engine_proto_getObjectDrawOrder () {
	var drawOrder = [];
	for (var id in this.objects) {
		var obj = this.objects[id];
		drawOrder.push({
			id: obj.id,
			drawIndex: obj.drawIndex,
			y: obj.position.y + obj.size.height
		});
	}
	drawOrder.sort(function (a, b) {
		if (a.drawIndex === b.drawIndex) {
			return (a.y - b.y);
		} else {
			return (a.drawIndex - b.drawIndex);
		}
	});
	return drawOrder;
};

proto.drawObject = function horde_Engine_proto_drawObject (ctx, o) {

	if (o.role === "hero" && this.heroFiring) {
		var s = o.getSpriteXY(this.heroFiringDirection);
	} else {
		var s = o.getSpriteXY();
	}

	/*
	// Invisible testing hack
	if (o.hasState(horde.Object.states.INVISIBLE)) {
		ctx.save();
		ctx.fillStyle = "rgb(0, 0, 255)";
		ctx.fillRect(
			o.position.x,
			o.position.y,
			o.size.width,
			o.size.height
		);
		ctx.restore();
		return;
	}
	*/

	if (o.alpha <= 0 || o.hasState(horde.Object.states.INVISIBLE)) {
		return;
	}

	ctx.save();

	ctx.translate(
		o.position.x + o.size.width / 2,
		o.position.y + o.size.height / 2
	);

	if (o.angle !== 0) {
		ctx.rotate(o.angle * Math.PI / 180);
	}

	if (o.alpha !== 1) {
		ctx.globalAlpha = o.alpha;
	}

	if (o.role === "powerup_weapon") {
		// Draw a scroll behind the weapon
		ctx.drawImage(
			this.images.getImage("objects"),
			128, 192, 48, 48, -22, -20, 48, 48
		);
	}

	ctx.drawImage(
		this.images.getImage(o.spriteSheet),
		s.x, s.y + 1, o.size.width - 1, o.size.height - 1,
		-(o.size.width / 2), -(o.size.height / 2), o.size.width, o.size.height
	);

	if (o.spriteYOverlay) {
		ctx.save();
		var alpha = (1 - (o.wounds / o.hitPoints)) + 0.3;
		ctx.globalAlpha = alpha;
		ctx.drawImage(
			this.images.getImage(o.spriteSheet),
			s.x, o.spriteYOverlay + 1, o.size.width - 1, o.size.height - 1,
			-(o.size.width / 2), -(o.size.height / 2), o.size.width, o.size.height
		);
		ctx.restore();
	}

	// Boss pain!
	if (
		(o.role === "monster")
		&& o.badass
		&& o.hasState(horde.Object.states.HURTING)
	) {
		this.drawImageOverlay(
			ctx, this.images.getImage(o.spriteSheet),
			s.x, s.y + 1, o.size.width - 1, o.size.height - 1,
			-(o.size.width / 2), -(o.size.height / 2), o.size.width, o.size.height,
			"rgba(186, 51, 35, 0.6)"
		);
	}

	// Message indestructible enemy projectiles
	if (this.isBadassWeapon(o) && o.glow) {
		this.drawImageOverlay(
			ctx, this.images.getImage(o.spriteSheet),
			s.x, s.y + 1, o.size.width - 1, o.size.height - 1,
			-(o.size.width / 2), -(o.size.height / 2), o.size.width, o.size.height,
			"rgba(255, 247, 143, " + o.glow.alpha + ")"
		);
	}

	// HP bar
	if (
		(this.debug && (o.role === "monster"))
		|| (o.badass && !o.hasState(horde.Object.states.DYING))
	) {
		var hpWidth = (o.size.width - 2);
		var hpHeight = 8;
		var width = (hpWidth - Math.round((hpWidth * o.wounds) / o.hitPoints));

		ctx.fillStyle = COLOR_WHITE;
		ctx.fillRect(-(o.size.width / 2), (o.size.height / 2), o.size.width, hpHeight);
		ctx.fillStyle = COLOR_BLACK;
		ctx.fillRect(-(o.size.width / 2) + 1, ((o.size.height / 2) + 1), (o.size.width - 2), (hpHeight - 2));
		ctx.fillStyle = this.getBarColor(o.hitPoints, (o.hitPoints - o.wounds));
		ctx.fillRect(-(o.size.width / 2) + 1, ((o.size.height / 2) + 1), width, (hpHeight - 2));
	}

	ctx.restore();

};

proto.isBadassWeapon = function horde_Engine_proto_isBadassWeapon (o) {
	return (
		(o.role === "projectile")
		&& (o.hitPoints === Infinity)
		&& (o.team === 1)
		&& (o.type != "e_fireball")
		&& (o.type != "e_static_blue_fire")
		&& (o.type != "e_static_green_fire")
	);
}

proto.drawObjects = function (ctx) {
	var drawOrder = this.getObjectDrawOrder();
	for (var x in drawOrder) {
		var o = this.objects[drawOrder[x].id];
		this.drawObject(ctx, o);
	}
};

/**
 * Draws the targeting reticle to the screen
 * @param {object} Canvas 2d context to draw on
 * @return {void}
 */
proto.drawTargetReticle = function horde_Engine_proto_drawTargetReticle (ctx) {

	if (!this.showReticle) return;

	ctx.save();
	ctx.globalAlpha = 0.75;
	ctx.translate(this.targetReticle.position.x, this.targetReticle.position.y);
	ctx.rotate(this.targetReticle.angle);
	ctx.drawImage(
		this.images.getImage("objects"),
		256, 192, 64, 64,
		-32, -32, 64, 64
	);
	ctx.restore();
};

/**
 * Draws an overlay over an image in its exact shape (exact pixels)
 * @param too many, shut up :(
 * @return {void}
 */
proto.drawImageOverlay = function horde_Engine_proto_drawImageOverlay (
	ctx, image,
	spriteX, spriteY,
	spriteWidth, spriteHeight,
	destX, destY,
	destWidth, destHeight,
	fillStyle
) {

	var buffer = this.canvases.buffer.getContext("2d");
	buffer.save();
	buffer.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

	buffer.drawImage(
		image,
		spriteX, spriteY, spriteWidth, spriteHeight,
		0, 0,
		destWidth, destHeight
	);
	buffer.globalCompositeOperation = "source-in";
	buffer.fillStyle = fillStyle;
	buffer.fillRect(0, 0, destWidth, destHeight);
	buffer.restore();

	ctx.drawImage(
		this.canvases.buffer,
		0, 0,
		destWidth, destHeight,
		destX, destY,
		destWidth, destHeight
	);

};

/**
 * Draws the game UI
 * @param {object} Canvas 2d context to draw on
 * @return {void}
 */
proto.drawUI = function horde_Engine_proto_drawUI (ctx) {

	var o = this.getPlayerObject();
	var weaponInfo = o.getWeaponInfo();
	var w = horde.objectTypes[weaponInfo.type];
	var wCount = (weaponInfo.count ? weaponInfo.count : "");

	// Weapon Icon
	ctx.drawImage(
		this.images.getImage("objects"),
		w.spriteX, w.spriteY, 32, 32,
		4, 412, 32, 32
	);

	// Score icon
	ctx.drawImage(
		this.images.getImage("objects"),
		32, 32, 32, 32,
		4, 442, 32, 32
	);

	// Draw gold amount and weapon count
	ctx.save();
	ctx.textAlign = "left";
	ctx.font = "Bold 32px MedievalSharp";

	ctx.globalAlpha = 0.75;
	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(wCount, 48, 444);
	ctx.fillText(this.scoreCount, 48, 474);

	ctx.globalAlpha = 1;
	ctx.fillStyle = COLOR_WHITE;
	ctx.fillText(wCount, 46, 440);
	ctx.fillText(this.scoreCount, 46, 472);
	ctx.restore();

	if (o.hitPoints > 1) {

		// Health bar
		var bar = {
			width: 280,
			height: 24,
			x: 212,
			y: 432
		};

		var width1 = (bar.width - Math.round((bar.width * o.wounds) / o.hitPoints));
		var width2 = (bar.width - Math.round((bar.width * this.woundsTo) / o.hitPoints));

		if (this.woundsTo < o.wounds) {
			var width = width1;
			var toWidth = width2;
		} else {
			var width = width2;
			var toWidth = width1;
		}

		// Outside border
		ctx.save();
		ctx.fillStyle = COLOR_WHITE;
		ctx.fillRect(bar.x - 2, bar.y - 2, bar.width + 2, bar.height + 4);
		ctx.fillRect(bar.x + bar.width, bar.y, 2, bar.height);
		ctx.fillStyle = COLOR_BLACK;
		ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

		// The bar itself
		ctx.fillStyle = this.getBarColor(o.hitPoints, (o.hitPoints - o.wounds));
		ctx.globalAlpha = 0.4;

		ctx.fillRect(bar.x, bar.y, toWidth, bar.height);

		ctx.fillRect(bar.x, bar.y, width, bar.height);
		ctx.fillRect(bar.x, bar.y + 5, width, bar.height - 10);
		ctx.fillRect(bar.x, bar.y + 10, width, bar.height - 20);
		ctx.restore();

		// Heart icon
		var percentage = (((o.hitPoints - o.wounds) / o.hitPoints) * 100);
		var spriteX = 352;
		if (percentage > 50) {
			spriteX = 224;
		} else if (percentage > 25) {
			spriteX = 288;
		}
		ctx.drawImage(
			this.images.getImage("objects"),
			spriteX, 64, 42, 42,
			(bar.x - 32), 424, 42, 42
		);

	}

	// Mute button
	if (this.canMute) {
		ctx.drawImage(
			this.preloader.getImage("ui"),
			(horde.sound.isMuted() ? 692 : 660), 910, 32, 32,
			570, 442, 32, 32
		);
	}

	// Fullscreen toggle icon
	if (this.canFullscreen) {
		var spriteX = (this.enableFullscreen ? 596 : 564);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			spriteX, 910, 32, 32,
			604, 442, 32, 32
		);
	} else {
		ctx.drawImage(
			this.preloader.getImage("ui"),
			596+32, 910, 32, 32,
			604, 442, 32, 32
		);
	}

};

/**
 * Draws the title screen.
 * @param {object} Canvas 2d context to draw on.
 * @return {void}
 */
proto.drawTitle = function horde_Engine_proto_drawTitle (ctx) {

	var grey = "rgb(230, 230, 230)";

	ctx.drawImage(
		this.preloader.getImage("ui"),
		0, 430, 640, 480,
		0, 0, 640, 480
	);

	var highScore = ("High Score: " + this.getData(HIGH_SCORE_KEY));

	ctx.save();
	ctx.font = "Bold 24px MedievalSharp";
	ctx.textAlign = "center";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(highScore, 322, 444);

	ctx.fillStyle = grey;
	ctx.fillText(highScore, 320, 442);
	ctx.restore();

	// Clay.io: High scores button
	var highScore = ("High Scores  ");

	ctx.save();
	ctx.font = "Bold 16px MedievalSharp";
	ctx.textAlign = "right";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(highScore, 322, 462);

	ctx.fillStyle = this.leaderboardHover ? "rgb(180, 180, 180)" : grey;
	ctx.fillText(highScore, 320, 460);
	ctx.restore();

	// Clay.io: Achievement list button
	var highScore = ("  Achievements");

	ctx.save();
	ctx.font = "Bold 16px MedievalSharp";
	ctx.textAlign = "left";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(highScore, 322, 462);

	ctx.fillStyle = this.achievementsHover ? "rgb(180, 180, 180)" : grey;
	ctx.fillText(highScore, 320, 460);
	ctx.restore();

	// Clay.io: Login button
	var highScore = this.loggedIn ? ("Logged In as " + Clay.Player.data.username) : ("Login with Clay.io");

	ctx.save();
	ctx.font = "Bold 12px MedievalSharp";
	ctx.textAlign = "center";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(highScore, 322, 476);

	ctx.fillStyle = this.loginHover ? "rgb(180, 180, 180)" : grey;
	ctx.fillText(highScore, 320, 474);
	ctx.restore();

	// Version
	var version = ("v" + VERSION);
	if (horde.isDemo()) version += " demo";
	ctx.save();
	ctx.font = "Bold 14px Monospace";
	ctx.textAlign = "right";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(version, 638, 480);

	ctx.fillStyle = grey;
	ctx.fillText(version, 636, 478);
	ctx.restore();

	// Copyright text
	var copyright = "Lost Decade Games";
	ctx.save();
	ctx.font = "Bold 14px Monospace";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(copyright, 6, 462);

	ctx.fillStyle = grey;
	ctx.fillText(copyright, 4, 460);
	ctx.restore();

	var copyrightDate = "\u00A9 2010";
	ctx.save();
	ctx.font = "Bold 14px Monospace";

	ctx.fillStyle = COLOR_BLACK;
	ctx.fillText(copyrightDate, 6, 478);

	ctx.fillStyle = grey;
	ctx.fillText(copyrightDate, 4, 476);
	ctx.restore();

};

proto.drawPointer = function horde_Engine_proto_drawPointer (ctx) {

	var textY = (this.pointerYStart - 18);
	var x = (POINTER_X - 42);
	var y = (this.pointerYStart + (this.pointerY * POINTER_HEIGHT) - POINTER_HEIGHT);

	ctx.save();
	ctx.drawImage(
		this.images.getImage("objects"),
		320, 192, 36, 26,
		x, y,
		36, 26
	);
	ctx.restore();

};

/**
 * @param {Boolean} checkAgain If true, will grab info from Clay again (set when logging in)
 * @return {Boolean} true if the checkpoint is stored
 */
proto.canContinue = function (checkAgain) {

	if( this.canContinueVar ) { // already grabbed from Clay.io
		var checkpointWave = this.canContinueVar;
		return checkpointWave;
	}

	if(!this.grabbingContinueVar) {
		this.grabbingContinueVar = true;
		var _this = this;
		Clay.ready(function() {
			var checkpointWave = _this.getData("checkpoint_wave", function(response) {
				_this.canContinueVar = Boolean(response.data);
			});
			Clay.Player.onUserReady( function() {
				_this.canContinue(true); // refresh w/ new data
			} );
		});
	}
	var checkpointWave = this.getData("checkpoint_wave"); // fallback to local data (while the clay data loads);
	return Boolean(checkpointWave);
};

proto.drawTitlePointerOptions = function horde_Engine_proto_drawTitlePointerOptions (ctx) {

	var startY = (this.pointerYStart - 22);
	var spriteY;

	if (horde.isDemo()) {
		// Buy now!!
		spriteY = ((this.pointerY == 0) ? 638 : 430);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			800, spriteY, 128, 26,
			POINTER_X, startY, 128, 26
		);
	} else {
		// Continue
		if (this.canContinue()) {
			spriteY = ((this.pointerY == 0) ? 638 : 430);
		} else {
			spriteY = 534;
		}
		ctx.drawImage(
			this.preloader.getImage("ui"),
			640, spriteY, 116, 20,
			POINTER_X, startY, 116, 20
		);
	}

	// New game
	spriteY = ((this.pointerY == 1) ? 664 : 456);
	ctx.drawImage(
		this.preloader.getImage("ui"),
		640, spriteY, 132, 26,
		POINTER_X, (startY + POINTER_HEIGHT), 132, 26
	);

	// Credits
	spriteY = ((this.pointerY == 2) ? 690 : 482);
	ctx.drawImage(
		this.preloader.getImage("ui"),
		640, spriteY, 90, 22,
		POINTER_X, (startY + (POINTER_HEIGHT * 2)), 90, 22
	);

};

proto.drawPausedPointerOptions = function horde_Engine_proto_drawPausedPointerOptions (ctx) {

	var startY = (this.pointerYStart - 22);
	var spriteY;

	if (this.verifyQuit) {
		// Nevermind
		spriteY = ((this.pointerY == 0) ? 1932 : 1860);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			564, spriteY, 158, 26,
			POINTER_X, startY, 158, 26
		);
	} else {
		// Resume
		spriteY = ((this.pointerY == 0) ? 1788 : 1718);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			564, spriteY, 106, 26,
			POINTER_X, startY, 106, 26
		);
	}

	if (this.verifyQuit) {
		// Quit, seriously
		spriteY = ((this.pointerY == 1) ? 1966 : 1894);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			564, spriteY, 192, 32,
			POINTER_X, (startY + POINTER_HEIGHT), 196, 32
		);
	} else {
		// Quit
		spriteY = ((this.pointerY == 1) ? 1822 : 1752);
		ctx.drawImage(
			this.preloader.getImage("ui"),
			564, spriteY, 70, 36,
			POINTER_X, (startY + POINTER_HEIGHT), 70, 36
		);
	}

};

proto.initOptions = function () {

	switch (this.state) {
		case "title":
			this.pointerYStart = 314;

			if (horde.isDemo() || this.canContinue()) {
				this.pointerY = 0;
				this.pointerOptionsStart = 0;
			} else {
				this.pointerY = 1;
				this.pointerOptionsStart = 1;
			}
			this.maxPointerY = 2;
			break;
		case "running":
			this.pointerYStart = 378;
			this.pointerY = 0;
			this.maxPointerY = 1;
			this.pointerOptionsStart = 0;
			this.verifyQuit = false;
			break;
		case "buy_now":
			this.pointerYStart = 378;
			this.pointerY = 0;
			this.maxPointerY = 1;
			this.pointerOptionsStart = 0;
			break;
	}

};

proto.drawCredits = function horde_Engine_proto_drawCredits (ctx) {
	ctx.save();
	ctx.globalAlpha = OVERLAY_ALPHA;
	ctx.fillRect(0, 0, this.view.width, this.view.height);
	ctx.globalAlpha = 1;
	ctx.drawImage(
		this.preloader.getImage("ui"),
		0, 1314, 564, 404,
		38, 38, 564, 404
	);
	ctx.restore();
};

proto.drawIntroCinematic = function horde_Engine_proto_drawIntroCinematic (ctx) {

	switch (this.introPhase) {

		case 0:
			if (!this.introFadeOutBg) {
				this.introFadeOutBg = ctx.getImageData(0, 0, this.view.width, this.view.height);
				this.introFadeAlpha = 0;
			}
			ctx.fillStyle = COLOR_BLACK;
			ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
			ctx.save();
			ctx.putImageData(this.introFadeOutBg, 0, 0);
			ctx.restore();
			if (this.introFadeAlpha > 0) {
				ctx.save();
				ctx.globalAlpha = this.introFadeAlpha;
				ctx.fillStyle = COLOR_BLACK;
				ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
				ctx.restore();
			}
			break;

		case 1:
			this.drawFloor(ctx);
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
			if (this.introFadeAlpha > 0) {
				ctx.save();
				ctx.globalAlpha = this.introFadeAlpha;
				ctx.fillStyle = COLOR_BLACK;
				ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
				ctx.restore();
			}
			break;

		case 2:
		case 3:
			this.drawFloor(ctx);
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
			break;

		case 4:
		case 5:
		case 9:
			this.drawFloor(ctx);
			if (this.introHero) {
				this.drawObject(ctx, this.introHero);
			}
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
			break;

		case 6:
		case 7:
		case 8:
			this.drawFloor(ctx);
			ctx.drawImage(this.images.getImage("characters"),
				20 * 32, 0, 32, 32,
				304, 224, 32, 32
			);
			this.drawFauxGates(ctx);
			this.drawWalls(ctx);
			break;
	}


};

/**
 * Draws fake gates for the title screen
 * @param {object} Canvas 2d context
 * @return {void}
 */
proto.drawFauxGates = function horde_Engine_proto_drawFauxGates (ctx) {
	for (var g = 0; g < NUM_GATES; g++) {
		var spriteX = 0;
		var spriteY = 192;

		if (g > 0) {
			spriteX = 320;
			spriteY = ((g == 1) ? 288 : 352);
		}

		ctx.drawImage(
			this.images.getImage("objects"),
			spriteX, spriteY, 64, 64,
			(this.gatesX + 96 + (g * 192)), this.gatesY, 64, 64
		);
	}
};

/**
 * Draws debugging information to the screen
 * @param {object} Canvas 2d context
 * @return {void}
 */
proto.drawDebugInfo = function horde_Engine_proto_drawDebugInfo (ctx) {

	// Semi-transparent bar so we can see the text
	ctx.save();
	ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
	ctx.fillRect(0, 0, this.view.width, 30);
	ctx.restore();

	// Debugging info
	ctx.save();
	ctx.fillStyle = COLOR_WHITE;
	ctx.font = "Bold 20px Monospace";
	ctx.fillText("Elapsed: " + this.lastElapsed, 10, 20);
	ctx.textAlign = "right";
	ctx.fillText(Math.round(1000 / this.lastElapsed) + " FPS", 630, 20);
	ctx.restore();

};

/**
 * Fetches some persistent data. Grabs first from Clay.io, falls back to localStorage, and local variable
 * @param {String} key The key of the data to fetch
 * @param {Function} callback Callback function if useClay is set to true (since data isn't immeditely available).
 * 							  The first parameter of this function is an object { success: boolean, data: String }
 * @param {Boolean} forceClay Forces fetch from Clay.io (instead of using local)
 * @return {String} The data (or undefined on failure)
 */
proto.getData = function horde_Engine_proto_getData (key, callback, forceClay) {
	// Load in the Clay data if it exists, otherwise fallback to localStorage
	if(callback) {
		if(Clay.isReady && Clay.Player.loggedIn && (forceClay || !horde.localData[key])) {
			var handler = function(response) {
				horde.localData[key] = { value: response.data, times: 0, timeout: null }; // save locally for future reference
				callback(response);
			}
			Clay.Player.fetchUserData(key, handler);
		}
		else if(horde.localData[key]) { // we're already storing the data locally, no need to fetch from Clay
			callback({ data: horde.localData[key].value, usingVar: true });
		}
		else { // Data not stored locally, and can't fetch from Clay
			callback({ data: window.localStorage.getItem(key), usingLocalStorage: true });
			horde.localData[key] = window.localStorage.getItem(key); // save locally for future reference
		}
		return undefined;
	}
	if (window.localStorage && window.localStorage.getItem) {
		return window.localStorage.getItem(key);
	}
	return undefined;
};

/**
 * Saves some data persistently. Saves to localStorage, a variable, and Clay.io (after 3 seconds)
 * @param {String} key The key of the data to store
 * @param {String} value The data to store
 */
proto.putData = function horde_Engine_proto_putData (key, value) {
	if (window.localStorage && window.localStorage.setItem) {
		window.localStorage.setItem(key, value);
	}
	// Clay.io: Store to Clay.io as well (as primary source of storage, localStorage as backup)
	// We store to Clay.io if new data isn't passed in 3s
	// This is in place so we're not flooding Clay.io with data stores (there is a limit...)
	if(!Clay.isReady)
		return false;

	if(horde.localData[key] && horde.localData[key].timeout) {
		clearTimeout(horde.localData[key].timeout);
		var times = horde.localData[times] + 1; // log how many times the timeout is set, so every 10th, we'll store anyways
	}
	else {
		var times = 0; // first time setting the timeout
	}

	// Store the data locally, and store to Clay after 3 seconds on non-changing data
	( function() {
		var localKey = key;
		var localValue = value;
		var localTimes = times;
		horde.localData[key] = { value: localValue, times: localTimes, timeout: setTimeout(function() {
			Clay.Player.saveUserData(localKey, localValue);
			horde.localData[localKey].timeout = null;
		}, 3000) };
	} )();
};

/**
 * Clears some persistent data by key
 * @param {String} key The key of the data to clear
 */
proto.clearData = function horde_Engine_proto_clearData (key) {
	if (window.localStorage && window.localStorage.removeItem) {
		window.localStorage.removeItem(key);
	}
};

proto.endGame = function () {
	this.gameOverReady = false;
	this.gameOverAlpha = 0;
	this.updateGameOver();
	this.state = "game_over";
	this.timePlayed = (horde.now() - this.gameStartTime);
};

proto.toggleFullscreen = function () {
	horde.sound.play("select_pointer");
	this.enableFullscreen = !this.enableFullscreen;
	var fullscreenPref = (this.enableFullscreen ? 1 : 0);
	this.putData("fullscreen", fullscreenPref);
	this.resize();
};

}());
