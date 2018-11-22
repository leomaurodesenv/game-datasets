(function defne_horde_objectTypes () {

horde.objectTypes = {};

var o = horde.objectTypes;

o.hero = {
	role: "hero",
	team: 0,
	speed: 150,
	hitPoints: 100,
	damage: 0,
	damageType: null,
	spriteSheet: "characters",
	spriteY: 992,
	animated: true,
	soundAttacks: "hero_attacks",
	soundDamage: "hero_damage",
	soundDies: "hero_dies",
	weapons: [
		{type: "h_sword", count: null}
	],
	isMeatboy: false,
	bloodTimer: null,

	onInit: function () {
		if (this.isMeatboy) {
			this.initMeatBoy();
		}
	},

	initMeatBoy: function () {
		this.hitPoints = 1;
		this.spriteY = 1024;
		this.bloodTimer = new horde.Timer();
		this.bloodTimer.start(100);
	},

	onUpdate: function (elapsed, engine) {
		if (this.isMeatboy) {
			this.bloodTimer.update(elapsed);
			if (this.bloodTimer.expired() && this.isMoving()) {
				var id = engine.spawnObject(this, "blood_pool");
				var o = engine.objects[id];
				o.position.x += horde.randomRange(-8, 8);
				o.position.y += horde.randomRange(-8, 8);
				o.angle = horde.randomRange(0, Math.PI * 1.5);
				this.bloodTimer.start(horde.randomRange(75, 150));
			}
		}
	},

	onKilled: function (attacker, engine) {
		var num = 10;
		for (var i = 0; i < num; ++i) {
			var skull = horde.makeObject("mini_skull");
			skull.position.x = (this.position.x + (i * (this.size.width / num)));
			skull.position.y = (this.position.y + this.size.height - horde.randomRange(0, this.size.height));
			engine.addObject(skull);
		}
	}

};

o.blood_pool = {
	role: "fluff",
	size: new horde.Size(32, 32),
	speed: 0,
	ttl: 1250,
	collidable: false,
	spriteSheet: "objects",
	spriteX: 128,
	spriteY: 32,
	drawIndex: 0
};

// HERO WEAPONS

o.h_sword = {
	role: "projectile",
	cooldown: 300,
	speed: 250,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 0,
	spriteAlign: true,
	priority: 0,
	bounce: false,
	
	// Clay.io
	achievementId: "masterswords",
	deathsForAchievement: 1000
};

o.h_knife = {
	role: "projectile",
	size: new horde.Size(32, 30),
	cooldown: 200,
	speed: 350,
	hitPoints: 1,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 0,
	spriteAlign: true,
	priority: 1,
	bounce: false
};

o.h_spear = {
	role: "projectile",
	cooldown: 350,
	speed: 500,
	hitPoints: 1,
	damage: 15,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 0,
	spriteAlign: true,
	priority: 2,
	bounce: false,
	piercing: true
};

o.h_fireball = {
	role: "projectile",
	cooldown: 300,
	speed: 400,
	rotateSpeed: 500,
	hitPoints: 1,
	damage: 3,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	rotate: true,
	ttl: 450,
	soundAttacks: "fire_attack",
	priority: 3,
	bounce: false,
	damageType: "magic",

	onInit: function () {
		this.trailTimer = new horde.Timer();
		this.trailTimer.start(75);
	},

	onUpdate: function (elapsed, engine) {
		this.trailTimer.update(elapsed);
		if (this.trailTimer.expired()) {
			engine.spawnObject(this, "h_fireball_trail");
			this.trailTimer.reset();
		}
	},
	
	// Clay.io
	achievementId: "masterfire",
	deathsForAchievement: 1000

};

o.h_fireball_trail = {
	role: "projectile",
	speed: 0,
	rotateSpeed: 150,
	hitPoints: 1,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	rotate: true,
	ttl: 500,
	alpha: 0.5,
	priority: 3,
	bounce: false,
	damageType: "magic",
	drawIndex: 0,
	// Clay.io
	ignoreLogDeath: true
};

/*
o.h_bomb = {
	role: "projectile",
	cooldown: 750,
	speed: 200,
	hitPoints: 1,
	damage: 0,
	spriteSheet: "objects",
	spriteX: 128,
	spriteY: 0,
	rotate: true,
	rotateSpeed: 150,
	priority: 4,
	bounce: true,
	
	onDelete: function (engine) {
		engine.spawnObject(this, "bomb_smoke");
	}
	
};

o.bomb_smoke = {
	role: "trap",
	size: new horde.Size(64, 64),
	cooldown: 0,
	speed: 0,
	hitPoints: 9999,
	damage: 0,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 544,
	bounce: false,
	ttl: 3000,
	
	onDamage: function (defender, engine) {
		if (defender.team !== this.team && defender.role === "monster") {
			defender.addState(horde.Object.states.STUNNED, 5000);
		}
	}
	
};
*/

o.h_axe = {
	role: "projectile",
	cooldown: 500,
	speed: 225,
	hitPoints: 1,
	damage: 20,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 32,
	rotate: true,
	rotateSpeed: 700,
	priority: 5,
	ttl: 4000,
	piercing: true,
	
	// Clay.io
	achievementId: "masteraxes",
	deathsForAchievement: 1000
};

o.h_fire_sword = {
	role: "projectile",
	cooldown: 450,
	speed: 350,
	hitPoints: 1,
	damage: 25,
	spriteSheet: "objects",
	spriteX: 384,
	spriteY: 0,
	priority: 6,
	bounce: false,
	spriteAlign: true,
	piercing: true,
	soundAttacks: "fire_attack",
	damageType: "magic",
	
	onInit: function () {
		this.spawnTimer = new horde.Timer();
		this.spawnTimer.start(50);
	},
	
	onUpdate: function (elapsed, engine) {
		this.spawnTimer.update(elapsed);
		if (this.spawnTimer.expired()) {
			engine.spawnObject(this, "fire_sword_trail");
			this.spawnTimer.reset();
		}
	},
	
	// Clay.io
	achievementId: "masterfireswords",
	deathsForAchievement: 1000
	
};

o.fire_sword_trail = {
	role: "projectile",
	speed: 0,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	rotate: true,
	soundAttacks: "fire_attack",
	ttl: 500,
	bounce: false,
	drawIndex: 0,
	damageType: "magic",
	// Clay.io
	ignoreLogDeath: true
};

o.h_fire_knife = {
	role: "projectile",
	size: new horde.Size(32, 30),
	cooldown: 200,
	speed: 350,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 128,
	spriteY: 0,
	priority: 6,
	bounce: false,
	spriteAlign: true,
	piercing: true,
	soundAttacks: "fire_attack",
	damageType: "magic",
	
	onInit: function () {
		this.spawnTimer = new horde.Timer();
		this.spawnTimer.start(50);
	},
	
	onUpdate: function (elapsed, engine) {
		this.spawnTimer.update(elapsed);
		if (this.spawnTimer.expired()) {
			engine.spawnObject(this, "fire_sword_trail");
			this.spawnTimer.reset();
		}
	}
	
};

o.h_firebomb = {
	role: "projectile",
	cooldown: 500,
	speed: 150,
	rotateSpeed: 300,
	hitPoints: 1,
	damage: 2,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	rotate: true,
	ttl: 550,
	soundAttacks: "fire_attack",
	priority: 3,
	bounce: false,
	damageType: "magic"
};

/*
o.h_fireburst = {
	role: "projectile",
	size: new horde.Size(32, 32),
	cooldown: 350,
	speed: 250,
	hitPoints: 1,
	damage: 3,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 64,
	ttl: 350,
	soundAttacks: "fire_attack",
	spriteAlign: true,
	damageType: "magic",
	priority: 1,
	bounce: false
};
*/

// ENEMIES

var movementTypes = {
	chase: function (elapsed, engine) {

		if (this.moveChangeDelay > 0) {
			this.moveChangeElapsed += elapsed;
			if (this.moveChangeElapsed < this.moveChangeDelay) {
				return;
			}
			this.moveChangeElapsed = 0;
		}

		var p = engine.getPlayerObject();
		this.chase(p);
		
		return "shoot";

	},
	getNear: function (elapsed, engine) {

		this.speed = this.defaultSpeed;

		var p = engine.getPlayerObject();

		// Get the distance from the player
		var distance = p.position.clone().subtract(this.position).magnitude();
		
		if (distance < 100) {
			// too close! run away
			this.chase(p);
			this.setDirection(this.direction.invert());
		} else if (distance > 150) {
			// too far, chase him down!
			this.chase(p);
		} else if (!this.cooldown) {
			// shoot the fucker in the FACE
			this.chase(p);
			this.speed = 0;
			return "shoot";
		} else {
			movementTypes.wander.apply(this, arguments);
		}

	},
	wander: function (elapsed, engine) {
		this.moveChangeElapsed += elapsed;
		if (this.moveChangeElapsed >= this.moveChangeDelay) {
			this.moveChangeElapsed = 0;
			var d = horde.randomDirection();
			if (d.x === 0 && d.y === 0) { return; }
			this.setDirection(d);
		}
	},
	wanderShoot: function (elapsed, engine) {
		
		var p = engine.getPlayerObject();
		
		var diff = p.position.clone().subtract(this.position).abs();
		
		if (!this.cooldown && (diff.x < (p.size.width / 2) || diff.y < (p.size.height / 2))) {
			this.chase(p);
			return "shoot";
		} else {
			movementTypes.wander.apply(this, arguments);
		}
		
	},
	wanderThenChase: function (elapsed, engine) {

		var p = engine.getPlayerObject();
		var hero = {
			x : p.position.x,
			y : p.position.y
		};
		var x = this.position.x;
		var y = this.position.y;

		if (this.seenHero) {
			movementTypes.chase.apply(this, arguments);
		} else {

			movementTypes.wander.apply(this, arguments);

			var nearX = Math.abs(x - hero.x);
			var nearY = Math.abs(y - hero.y);

			if ((nearX < 64) && (nearY < 64)) {
				horde.sound.play(this.soundAttacks);
				this.seenHero = true;
				return "shoot";
			}

		}

	}
};

o.bat = {
	role: "monster",
	team: 1,
	speed: 100,
	hitPoints: 5,
	damage: 2,
	worth: 0,
	spriteSheet: "characters",
	spriteY: 96,
	animated: true,
	animDelay: 150,
	moveChangeElapsed: 0,
	moveChangeDelay: 500,
	soundDamage: "bat_damage",
	soundDies: "bat_dies",
	
	// Clay.io
	achievementId: "killbats",
	deathsForAchievement: 1000,
	
	lootTable: [
		{type: null, weight: 9},
		{type: "item_coin", weight: 1}
	],
	
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function () {
		if (this.position.y >= 50) this.onUpdate = movementTypes.wander;
	}
};

o.dire_bat = {
	role: "monster",
	team: 1,
	speed: 150,
	hitPoints: 10,
	damage: 5,
	worth: 0,
	spriteSheet: "characters",
	spriteY: 128,
	animated: true,
	animDelay: 150,
	moveChangeElapsed: 0,
	moveChangeDelay: 500,
	soundDamage: "bat_damage",
	soundDies: "bat_dies",
	
	lootTable: [
		{type: null, weight: 7},
		{type: "item_coin", weight: 3}
	],
	
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function () {
		if (this.position.y >= 50) this.onUpdate = movementTypes.wander;
	}
};

o.goblin = {
	role: "monster",
	team: 1,
	speed: 75,
	hitPoints: 10,
	damage: 10,
	worth: 0,
	spriteSheet: "characters",
	spriteY: 160,
	animated: true,
	gibletSize: "medium",
	moveChangeElapsed: 0,
	moveChangeDelay: 3000,
	weapons: [
		{type: "e_arrow", count: null}
	],
	soundAttacks: "goblin_attacks",
	soundDamage: "goblin_damage",
	soundDies: "goblin_dies",
	
	lootTable: [
		{type: null, weight: 6},
		{type: "item_coin", weight: 1},
		{type: "WEAPON_DROP", weight: 2},
		{type: "item_food", weight: 1}
	],
	
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function () {
		if (this.position.y >= 50) this.onUpdate = movementTypes.wanderShoot;
	}
};

o.hunter_goblin = {
	role: "monster",
	team: 1,
	speed: 75,
	hitPoints: 10,
	damage: 10,
	worth: 0,
	spriteSheet: "characters",
	spriteY: 160,
	animated: true,
	gibletSize: "medium",
	moveChangeElapsed: 0,
	moveChangeDelay: 3000,
	weapons: [
		{type: "e_arrow", count: null}
	],
	soundAttacks: "goblin_attacks",
	soundDamage: "goblin_damage",
	soundDies: "goblin_dies",
	
	lootTable: [
		{type: null, weight: 2},
		{type: "item_coin", weight: 4},
		{type: "WEAPON_DROP", weight: 2},
		{type: "item_food", weight: 2}
	],
	
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},
	onUpdate: function (elapsed, engine) {
		if (this.position.y >= 50) {
			if (!this.cooldown) {
				this.chase(engine.getPlayerObject());
				return "shoot";
			}
			movementTypes.wander.apply(this, arguments);
		}
	}
};

o.demoblin = {
	role: "monster",
	team: 1,
	speed: 75,
	defaultSpeed: 75,
	hitPoints: 30,
	damage: 15,
	worth: 0,
	spriteSheet: "characters",
	spriteY: 192,
	animated: true,
	gibletSize: "medium",
	moveChangeElapsed: 0,
	moveChangeDelay: 3000,
	weapons: [
		{type: "e_trident", count: null}
	],
	
	lootTable: [
		{type: null, weight: 6},
		{type: "WEAPON_DROP", weight: 2},
		{type: "item_chest", weight: 1},
		{type: "item_food", weight: 1}
	],
	
	soundAttacks: "demoblin_attacks",
	soundDamage: "goblin_damage",
	soundDies: "goblin_dies",
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.cooldown = true;
		this.cooldownElapsed = horde.randomRange(0, 5000);
	},
	onUpdate: function () {
		if (this.position.y >= 50) this.onUpdate = movementTypes.getNear;
	}
};

o.flaming_skull = {
	
	role: "monster",
	team: 1,
	
	speed: 200,
	hitPoints: 50,
	damage: 10,
	worth: 0,
	
	spriteSheet: "characters",
	spriteY: 32,
	animated: true,
	
	setDir: false,

	soundDamage: "skull_damage",
	soundDies: "skull_dies",
	
	weapons: [
		{type: "e_static_blue_fire", count: null}
	],
	
	lootTable: [
		{type: null, weight: 6},
		{type: "WEAPON_DROP", weight: 2},
		{type: "item_chest", weight: 2}
	],
	
	onInit: function () {
		switch (horde.randomRange(1, 2)) {
			case 1:
				this.speed *= 0.5;
				this.animDelay *= 0.5;
				break;
			case 2:
				this.speed *= 0.75;
				this.animDelay *= 0.75;
				break;
		}
	},
	
	onUpdate: function (elapsed, engine) {
		if (!this.setDir && this.position.y >= 50) {
			var d = this.direction.clone();
			d.x = Math.random();
			if (Math.random() >= 0.5) {
				d.x *= -1;
			}
			this.setDirection(d);
			this.setDir = true;
		}
		return "shoot";
	}
	
};

o.huge_skull = {
	
	role: "monster",
	team: 1,
	badass: true,
	
	speed: 150,
	hitPoints: 200,
	damage: 20,
	worth: 0,
	
	spriteSheet: "characters",
	spriteY: 864,
	animated: true,
	size: new horde.Size(64, 64),
	
	setDir: false,

	soundDamage: "skull_damage",
	soundDies: "skull_dies",
	
	// Clay.io
	achievementId: "killskulls",
	deathsForAchievement: 100,
	
	weapons: [
		{type: "e_static_green_fire", count: null}
	],
	
	lootTable: [
		{type: null, weight: 4},
		{type: "WEAPON_DROP", weight: 3},
		{type: "item_chest", weight: 3}
	],
	
	onInit: function () {
		this.phaseTimer = new horde.Timer();
		switch (horde.randomRange(1, 2)) {
			case 1:
				this.speed *= 0.5;
				this.animDelay *= 0.5;
				break;
			case 2:
				this.speed *= 0.75;
				this.animDelay *= 0.75;
				break;
		}
	},
	
	onUpdate: function (elapsed, engine) {
		switch (this.phase) {
			
			// Come out of the gates
			case 0:
				if (!this.phaseInit) {
					this.phaseInit = true;
				}
				if (this.position.y >= 50) {
					this.nextPhase();
				}
				break;
			
			// Choose a random direction
			case 1:
				if (!this.phaseInit) {
					var d = this.direction.clone();
					d.x = Math.random();
					if (Math.random() >= 0.5) {
						d.x *= -1;
					}
					this.setDirection(d);
					this.phaseTimer.start(horde.randomRange(2000, 4000));
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;
			
			// Charge the player just for a half second
			case 2:
				if (!this.phaseInit) {
					this.speed *= 2;
					this.animDelay *= 2;
					this.phaseTimer.start(horde.randomRange(250, 500));
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.speed /= 2;
					this.animDelay /= 2;
					this.setPhase(1);
				}
				this.chase(engine.getPlayerObject());
				break;
			
		}
		
		return "shoot";

	}
	
};

o.spike_wall = {
	
	role: "trap",
	team: 1,
	
	speed: 150,
	hitPoints: Infinity,
	damage: 20,

	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 256,
	drawIndex: 0,
	
	animated: true,
	animNumFrames: 1,
	
	spawnFramesX: 96,
	spawnFramesY: 576,
	spawnFrameCount: 2,
	
	rotate: true,
	rotateSpeed: 0,
	
	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.spinUpTime = 7500;
		this.wallDirection = new horde.Vector2(0, 1);
		this.addState(horde.Object.states.SPAWNING);
	},
	
	onDamage: function (defender, engine) {
		this.spriteX = 128;
	},
	
	onUpdate: function (elapsed, engine) {
		
		switch (this.phase) {
			
			case 0:
				if (!this.phaseInit) {
					this.phaseTimer.start(this.spinUpTime);
					this.phaseInit = true;
				}
				var step = (this.spinUpTime / 200);
				this.rotateSpeed += ((step / 1000) * elapsed);
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;
			
			case 1:
				if (!this.phaseInit) {
					horde.sound.play("spike_attack");
					this.setDirection(this.wallDirection);
					this.phaseInit = true;
				}
				break;
			
		}
		
	},
	
	onWallCollide: function () {
		this.stopMoving();
		this.ttl = 1500;
	}
	
};

o.spike_sentry = {
	
	role: "trap",
	team: 1,
	
	speed: 100,
	hitPoints: Infinity,
	damage: 10,
	worth: 0,
	
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 256,
	
	animated: true,
	animNumFrames: 1,
	
	spawnFramesX: 0,
	spawnFramesY: 576,
	spawnFrameCount: 2,
	
	rotate: true,
	rotateSpeed: 100,

	phase: 0,
	phaseInit: false,
	
	onInit: function () {
		this.addState(horde.Object.states.SPAWNING);
	},
	
	onDamage: function (defender, engine) {

		if (defender.role === "hero") {
			this.spriteX = 160;
		}
		
	},
	
	onUpdate: function (elapsed, engine) {
		
		if (this.hasState(horde.Object.states.SPAWNING)) {
			return;
		}
		
		switch (this.phase) {
			
			// Wait for player to get near X or Y axis
			case 0:
				if (!this.phaseInit) {
					this.stopMoving();
					this.phaseInit = true;
				}
				var p = engine.getPlayerObject();
				var diff = p.position.clone().subtract(this.position);
				if (Math.abs(diff.y) < 32) {
					// charge the player along the left/right axis
					this.originalPos = this.position.clone();
					var d = new horde.Vector2();
					d.x = (diff.x < 0) ? -1: 1;
					this.setDirection(d);
					this.phase++;
					this.phaseInit = false;
					horde.sound.play("spike_attack");
				} else if (Math.abs(diff.x) < 32) {
					this.originalPos = this.position.clone();
					var d = new horde.Vector2();
					d.y = (diff.y < 0) ? -1: 1;
					this.setDirection(d);
					this.phase++;
					this.phaseInit = false;
					horde.sound.play("spike_attack");
				}
				break;
				
			// Charging the player
			case 1:
				if (!this.phaseInit) {
					this.speed = 300;
					this.rotateSpeed = 300;
					this.phaseInit = true;
				}
				var diff = this.position.clone().subtract(this.originalPos).abs();
				if (diff.x > 320 - 64) {
					var d = this.direction.clone();
					d.x *= -1;
					this.setDirection(d);
					this.phase++;
					this.phaseInit = false;
				} else if (diff.y > 240 - (4 *32) + 16) {
					var d = this.direction.clone();
					d.y *= -1;
					this.setDirection(d);
					this.phase++;
					this.phaseInit = false;
				}
				break;
			
			// Reseting
			case 2:
			 	if (!this.phaseInit) {
					this.speed = 50;
					this.rotateSpeed = 100;
					this.phaseInit = true;
				}
				var diff = this.position.clone().subtract(this.originalPos).abs();
				if (diff.x < 5 && diff.y < 5) {
					this.stopMoving();
					this.position = this.originalPos.clone();
					this.phase = 0;
					this.phaseInit = false;
				}
				break;

		}

	}

};

o.spikes = {

	role: "trap",
	team: 1,

	speed: 0,
	hitPoints: Infinity,
	damage: 10,
	worth: 0,

	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 256,

	animated: true,
	animNumFrames: 1,

	spawnFramesX: 224,
	spawnFramesY: 256,
	spawnFrameCount: 3,

	collidable: false,

	onInit: function () {
		this.addState(horde.Object.states.SPAWNING);
	},

	onDamage: function (defender, engine) {
		if (defender.role === "hero") {
			this.spriteX = 96;
		}
	}

};

o.owlbear = {
	role: "monster",
	team: 1,
	badass: true,
	
	animated: true,
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 800,
	
	damage: 15,
	hitPoints: 250,
	speed: 75,

	soundAlarm: "owlbear_alarm",
	soundAttacks: "owlbear_attacks",
	soundDamage: "owlbear_damage",
	soundDies: "owlbear_dies",
	
	// Clay.io
	achievementId: "killowlbears",
	deathsForAchievement: 100,
	
	lootTable: [
		{type: "item_food", weight: 1}
	],
	
	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.phaseTimer = new horde.Timer();
	},
	
	onUpdate: function (elapsed, engine) {
		switch (this.phase) {
		
			// Charge out of the gates
			case 0:
				if (!this.phaseInit) {
					this.speed = 150;
					this.animDelay = 150;
					this.phaseInit = true;
				}
				if (this.position.y >= 60) {
					this.nextPhase();
				}
				break;
			
			// Wander around, slowly
			case 1:
				if (!this.phaseInit) {
					this.speed = 75;
					this.animDelay = 300;
					this.phaseInit = true;
				}
				movementTypes.wander.apply(this, arguments);
				var player = engine.getPlayerObject();
				var diff = player.position.clone().subtract(this.position).abs();
				if (diff.x < (this.size.width / 2) || diff.y < (this.size.height / 2)) {
					this.chase(player);
					this.nextPhase();
				}
				break;
			
			// Spotted the player, prepare to charge	
			case 2:
				if (!this.phaseInit) {
					horde.sound.play(this.soundAlarm);
					this.speed = 0;
					this.animDelay = 150;
					this.phaseTimer.start(500);
					this.phaseInit = true;
				}
				this.position.x += horde.randomRange(-1, 1);
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;
				
			// Charge!
			case 3:
				if (!this.phaseInit) {
					horde.sound.play(this.soundAttacks);
					this.speed = 350;
					this.animDelay = 75;
					this.phaseTimer.start(2000);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;
			
			// Stunned for bit
			case 4:
				if (!this.phaseInit) {
					this.stopMoving();
					this.animDelay = 400;
					this.phaseTimer.start(1250);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.setPhase(1);
				}
				break;
			
		}
	}
	
};

o.cyclops = {
	role: "monster",
	team: 1,
	badass: true,

	animated: true,
	gibletSize: "large",
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 224,

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 20,
	hitPoints: 200,
	speed: 100,
	animDelay: 100,
	worth: 0,

	soundAttacks: "cyclops_attacks",
	soundDamage: "cyclops_damage",
	soundDies: "cyclops_dies",

	weapons: [{type: "e_boulder", count: null}],

	lootTable: [
		{type: "item_food", weight: 7},
		{type: "WEAPON_DROP", weight: 3}
	],

	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
	},
	onUpdate: function (elapsed, engine) {
		if (this.position.y >= 50) {
			this.speed = 25;
			this.animDelay = 200;
			this.onUpdate = movementTypes.chase;
		}
	}
};

// Beholder eyelets
o.eyelet = {
	role: "monster",
	team: 1,
	
	animated: true,
	spriteSheet: "characters",
	spriteY: 512,
	
	damage: 10,
	hitPoints: 40,
	speed: 100,

	soundDamage: "eyelet_damage",
	soundDies: "eyelet_dies",
	
	collidable: false,

	lootTable: [
		{type: null, weight: 9},
		{type: "item_food", weight: 1},
		{type: "WEAPON_DROP", weight: 8},
		{type: "item_weapon_fireball", weight: 2}
	],
	
	makeBadass: function () {
		this.spriteY = 960;
		this.hitPoints = 50;
		this.speed = 150;
		this.damage = 20;
	},
	
	onInit: function () {
		if (horde.randomRange(1, 10) > 5) {
			this.spriteY += 32;
		}
		this.ownerAngle = 0;
		this.phaseTimer = new horde.Timer();
		this.addState(horde.Object.states.INVINCIBLE, 1000);
	},
	
	onUpdate: function (elapsed, engine) {

		if (!engine.objects[this.ownerId]) {
			this.wound(this.hitPoints);
			return;
		}

		switch (this.phase) {
			
			// Snap to the north of the owner
			case 0:
				if (!this.phaseInit) {
					this.phaseTimer.start(10000);
					this.phaseInit = true;
				}
				var owner = engine.objects[this.ownerId];
				var ownerCenter = owner.position.clone().add(
					horde.Vector2.fromSize(owner.size).scale(0.5)
				).subtract(new horde.Vector2(10, 10));
				var d = horde.Vector2.fromHeading(this.ownerAngle);
				this.position = ownerCenter.add(d.scale(owner.eyeletOffset));
				this.ownerAngle += ((1.05 / 1000) * elapsed);
				if (this.ownerAngle > (Math.PI * 2)) {
					this.ownerAngle = 0;
				}
				if (
					this.phaseTimer.expired() 
					&& engine.checkTileCollision(this) === false
				) {
					this.nextPhase();
				}
				break;
				
			case 1:
				if (!this.phaseInit) {
					this.collidable = true;
					this.speed = 175;
					this.phaseInit = true;
				}
				movementTypes.wander.apply(this, arguments);
				break;
			
		}
	}
	
};

o.cube = {
	role: "monster",
	team: 1,
	badass: true,

	animated: true,
	animDelay: 400,
	gibletSize: "large",
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 576,

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 35,
	hitPoints: 750,
	speed: 15,
	worth: 0,
	
	soundAttacks: "cube_attacks",
	soundDamage: "cube_damage",
	soundDies: "cube_dies",
	
	// Clay.io
	achievementId: "defeatgel",
	deathsForAchievement: 1,

/*
	lootTable: [
		{type: "item_chest", weight: 1},
		{type: "WEAPON_DROP", weight: 6},
		{type: "item_food", weight: 3}
	],
	*/
	lootTable: [
		{type: "item_gold_chest", weight: 1}
	],

	onInit: function () {
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
		this.phaseTimer = new horde.Timer();
		this.gelTimer = new horde.Timer();
	},
	
	onThreat: function (attacker, engine) {
		if (attacker.damageType !== "magic") {
			return true;
		}
	},
	
	onUpdate: function (elapsed, engine) {
		
		this.gelTimer.update(elapsed);
		
		switch (this.phase) {
			
			// "Charge" out of gate
			case 0:
				if (!this.phaseInit) {
					this.speed = 100;
					this.animDelay = 200;
					this.phaseInit = true;
				}
				if (this.position.y >= 150) {
					this.nextPhase();
				}
				break;
			
			// Spawn a bunch of gels!
			case 1:
				if (!this.phaseInit) {
					this.stopMoving();
					this.speed = 15;
					this.animDelay = 400;
					this.phaseTimer.start(6000);
					this.gelTimer.start(300);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.nextPhase();
					break;
				}
				movementTypes.wander.apply(this, arguments);
				//this.chase(engine.getPlayerObject());
				this.position.x += horde.randomRange(-1, 1);
				if (this.gelTimer.expired()) {
					engine.spawnObject(this, "gel");
					horde.sound.play(this.soundAttacks);
					this.gelTimer.reset();
				}
				break;
			
			case 2:
				if (!this.phaseInit) {
					this.speed = 30;
					this.animDelay = 150;
					this.phaseTimer.start(7500);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.setPhase(1);
					break;
				}
				movementTypes.chase.apply(this, arguments);
				break;
			
		}
		
	}
};

o.gel = {
	role: "monster",
	team: 1,

	animated: true,
	animDelay: 400,
	
	spriteSheet: "characters",
	spriteY: 640,

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 5,
	hitPoints: 10,
	speed: 150,
	worth: 0,

	soundDamage: "gel_damage",
	soundDies: "gel_dies",

	onInit: function () {
		this.setDirection(horde.randomDirection());
		this.moveChangeDelay = horde.randomRange(500, 1000);
		// Randomize sprite
		switch (horde.randomRange(1, 4)) {
			case 1: this.spriteY = 640; break;
			case 2: this.spriteY = 672; break;
			case 3: this.spriteY = 704; break;
			case 4: this.spriteY = 736; break;
		}
	},
	
	onUpdate: function (elapsed, engine) {
		movementTypes.wander.apply(this, arguments);
	},
	
	onKilled: function (attacker, engine) {
		var player = engine.getPlayerObject();
		// Spawn a fireball scroll if the player is out
		// AND there aren't any on the screen
		if (
			!player.hasWeapon("h_fireball")
			&& !player.hasWeapon("h_fire_sword")
			&& engine.getObjectCountByType("item_weapon_fireball") === 0
		) {
			engine.dropObject(this, "item_weapon_fireball");
		}
	}
	
};

o.superclops = {
	role: "monster",
	team: 1,
	badass: true,

	animated: true,
	gibletSize: "large",
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 288,

	moveChangeElapsed: 0,
	moveChangeDelay: 1000,

	damage: 20,
	hitPoints: 750,
	speed: 25,
	worth: 0,

	soundAttacks: "minotaur_attacks",
	soundDamage: "minotaur_damage",
	soundDies: "minotaur_dies",
	
	// Clay.io
	achievementId: "defeatminotaur",
	deathsForAchievement: 1,

	weapons: [{type: "e_minotaur_trident", count: null}],

	lootTable: [
		{type: "item_gold_chest", weight: 1}
	],

	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
	},
	onUpdate: function (elapsed, engine) {
		
		switch (this.phase) {
			
			// Charge out of the gates
			case 0:
				if (!this.phaseInit) {
					this.speed = 200;
					this.animDelay = 100;
					this.phaseInit = true;
				}
				if (this.position.y >= 80) {
					this.nextPhase();
				}
				break;
			
			// Shoot two boulders
			case 1:
				if (!this.phaseInit) {
					this.animDelay = 250;
					var p = engine.getPlayerObject();
					this.chase(p);
					this.stopMoving();
					var h = this.facing.heading();
					engine.spawnObject(this, "e_bouncing_boulder", horde.Vector2.fromHeading(
						h - 0.3
					));
					engine.spawnObject(this, "e_bouncing_boulder", horde.Vector2.fromHeading(
						h + 0.3
					));
					this.phaseTimer.start(1500);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;
				
			// Charge down the middle
			case 2:
				if (!this.phaseInit) {
					this.speed = 300;
					this.animDelay = 100;
					this.setDirection(this.facing);
					this.phaseTimer.start(2000);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;
			
			// Wander a bit as if stunned by the charge
			case 3:
				if (!this.phaseInit) {
					this.speed = 15;
					this.animDelay = 400;
					this.phaseTimer.start(2000);
					this.phaseInit = true;
				}
				movementTypes.wander.apply(this, arguments);
				if (this.phaseTimer.expired()) {
					if (this.wounds > (this.hitPoints / 2)) {
						this.nextPhase();
					} else {
						this.setPhase(1);
					}
				}
				break;
			
			// Wiggle!
			case 4:
				if (!this.phaseInit) {
					this.stopMoving();
					this.animDelay = 300;
					this.phaseTimer.start(1500);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.nextPhase();
					break;
				}
				this.position.x += horde.randomRange(-1, 1);
				break;
			
			// Shoot bouncing boulders
			case 5:
				if (!this.phaseInit) {
					this.cooldown = false;
					this.weapons = [{type: "e_bouncing_boulder", count: null}];
					this.phaseInit = true;
				}
				engine.objectAttack(this);
				this.position.x += horde.randomRange(-1, 1);
				this.nextPhase();
				break;
			
			// Chase and shoot tridents
			case 6:
				if (!this.phaseInit) {
					this.speed = 50;
					this.weapons = [{type: "e_minotaur_trident", count: null}];
					this.cooldown = true;
					this.phaseTimer.start(6000)
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					this.setPhase(4);
				}
				engine.objectAttack(this);
				movementTypes.chase.apply(this, arguments);
				break;

		}
		
	},
	
	onWallCollide: function () {
		if (this.phase === 2) {
			this.nextPhase();
		}
	}

};

o.imp = {

	role: "monster",
	team: 1,

	speed: 100,

	hitPoints: 20,
	damage: 15,

	worth: 0,

	spriteSheet: "characters",
	spriteY: 64,
	animated: true,

	gibletSize: "medium",

	moveChangeElapsed: 0,
	moveChangeDelay: 3000,

	soundDamage: "imp_damage",
	soundDies: "imp_dies",

	phase: 0,
	phaseInit: false,

	lootTable: [
		{type: null, weight: 7},
		{type: "item_food", weight: 1},
		{type: "WEAPON_DROP", weight: 2}
	],

	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.moveChangeDelay = horde.randomRange(500, 1000);
	},

	onKilled: function (attacker, engine) {
		if (attacker.role === "projectile") {
			attacker.die();
		}
		for (var x = 0; x < 2; ++x) {
			engine.spawnObject(
				this,
				"dire_bat",
				horde.randomDirection(),
				false
			);
		}
	},

	onUpdate: function (elapsed, engine) {

		switch (this.phase) {

			// Move past the gates
			case 0:
				if (!this.phaseInit) {
					this.phaseInit = true;
				}
				if (this.position.y >= 50) {
					this.phase++;
					this.phaseInit = false;
				}
				break;

			// Wander slowly
			case 1:
				if (!this.phaseInit) {
					this.speed = 50;
					this.animDelay = 400;
					this.phaseTimer.start(2500, 7500);
					this.phaseInit = true;
				}
				movementTypes.wander.apply(this, arguments);
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;

			// Wander fast!
			case 2:
				if (!this.phaseInit) {
					this.speed = 150;
					this.animDelay = 150;
					this.phaseTimer.start(2500, 7500);
					this.phaseInit = true;
				}
				movementTypes.wander.apply(this. arguments);
				if (this.phaseTimer.expired()) {
					this.phase = 1;
					this.phaseInit = false;
				}
				break;

		}

	}
};

o.wizard = {
	role: "monster",
	team: 1,
	speed: 100,
	hitPoints: 20,
	damage: 10,
	worth: 0,
	spriteSheet: "characters",
	spriteY: 416,
	animated: true,
	gibletSize: "medium",
	moveChangeElapsed: 0,
	moveChangeDelay: 3000,

	weapons: [
		{type: "e_shock_wave", count: null}
	],

	soundAttacks: "wizard_attacks",
	soundDisappear: "wizard_disappear",
	soundReappear: "wizard_reappear",
	soundDamage: "goblin_damage",
	soundDies: "goblin_dies",

	lootTable: [
		{type: null, weight: 6},
		{type: "item_chest", weight: 2},
		{type: "WEAPON_DROP", weight: 2}
	],

	phase: 0,
	phaseInit: false,

	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.moveToY = horde.randomRange(50, 75);
	},
	onUpdate: function (elapsed, engine) {

		switch (this.phase) {

			// Move out of the gates
			case 0:
				if (!this.phaseInit) {
					this.phaseInit = true;
				}
				if (this.position.y >= this.moveToY) {
					this.phase++;
					this.phaseInit = false;
				}
				break;

			// Phase out
			case 1:
				if (!this.phaseInit) {
					this.animated = false;
					this.stopMoving();
					this.addState(horde.Object.states.INVINCIBLE);
					this.phaseTimer.start(1000);
					this.phaseInit = true;
					horde.sound.play(this.soundDisappear);
				}
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;

			// Turn invisible and move around!
			case 2:
				if (!this.phaseInit) {
					this.speed = 500;
					this.addState(horde.Object.states.INVISIBLE);
					this.phaseTimer.start(horde.randomRange(1000, 2000));
					this.phaseInit = true;
				}
				// Don't trigger phase in if wizard is too close to the player
				var myCenter = this.boundingBox().center();
				var playerCenter = engine.getPlayerObject().boundingBox().center();
				var diff = playerCenter.clone().subtract(myCenter).abs();
				movementTypes.wander.apply(this, arguments);
				if (this.phaseTimer.expired() && diff.magnitude() > 90) {
					this.phase++;
					this.phaseInit = false;
				}
				break;

			// Phase in
			case 3:
				if (!this.phaseInit) {
					this.stopMoving();
					this.removeState(horde.Object.states.INVISIBLE);
					this.phaseTimer.start(1000);
					this.phaseInit = true;
					horde.sound.play(this.soundReappear);
				}
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;

			// Shoot the player!
			case 4:
				if (!this.phaseInit) {
					this.speed = 0;
					this.animated = true;
					this.removeState(horde.Object.states.INVINCIBLE);
					this.phaseTimer.start(horde.randomRange(2000, 3000));
					this.phaseInit = true;
					this.shotOnce = false;
				}
				var p = engine.getPlayerObject();
				this.chase(p);
				if (this.phaseTimer.expired()) {
					this.phase = 1;
					this.phaseInit = false;
				}
				if (!this.shotOnce) {
					this.shotOnce = true;
					return "shoot";
				}
				break;

		}

	}
};

o.sandworm = {

	role: "monster",
	team: 1,

	animated: true,
	animDelay: 200,
	spriteSheet: "characters",
	spriteY: 480,
	
	spawnFramesX: 544,
	spawnFramesY: 448,
	spawnFrameCount: 2,
	
	damage: 25,
	hitPoints: 50,
	speed: 50,
	worth: 0,
	
	phase: 0,
	phaseInit: false,
	
	moveChangeElapsed: 0,
	moveChangeDelay: 2000,

	soundAttacks: "sandworm_attacks",
	soundDamage: "goblin_damage",
	soundDies: "sandworm_dies",

	lootTable: [
		{type: null, weight: 4},
		{type: "item_chest", weight: 2},
		{type: "WEAPON_DROP", weight: 2},
		{type: "item_food", weight: 2}
	],
	
	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.dirtTimer = new horde.Timer();
		this.attackTimer = new horde.Timer();
	},
	
	onUpdate: function (elapsed, engine) {
		switch (this.phase) {
							
			case 0:
				if (!this.phaseInit) {
					this.speed = 50;
					this.addState(horde.Object.states.INVISIBLE);
					this.phaseTimer.start(horde.randomRange(5000, 10000));
					this.dirtTimer.start(150);
					this.phaseInit = true;
				}
				this.dirtTimer.update(elapsed);
				if (this.position.y <= 50) {
					this.setDirection(horde.directions.toVector(horde.directions.DOWN));
				} else {
					movementTypes.wander.apply(this, arguments);
				}
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				if (this.dirtTimer.expired()) {
					engine.spawnObject(this, "e_dirt_pile");
					this.dirtTimer.reset();
				}
				break;
				
			case 1:
				// spawn!
				if (!this.phaseInit) {
					this.stopMoving();
					this.speed = 0;
					this.removeState(horde.Object.states.INVISIBLE);
					this.addState(horde.Object.states.SPAWNING);
					this.spawnFrameIndex = 0;
					this.phaseInit = true;
				}
				if (!this.hasState(horde.Object.states.SPAWNING)) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
				
			case 2:
				// fire globs of shit
				if (!this.phaseInit) {
					this.phaseAttacks = 0;
					this.phaseInit = true;
					this.attackTimer.start(200);
				}
				this.attackTimer.update(elapsed);
				if (this.phaseAttacks < 1 && this.attackTimer.expired()) {
					this.phaseAttacks++;
					//this.chase(engine.getPlayerObject());
					this.setDirection(horde.randomDirection());
					engine.spawnObject(this, "e_worm_spit");
					horde.sound.play(this.soundAttacks);
					this.attackTimer.reset();
					if (this.phaseAttacks === 1) {
						this.phaseTimer.start(2000);
					}
				}
				if (this.phaseAttacks >= 1 && this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
				
			case 3:
				// burrow!
				if (!this.phaseInit) {
					this.addState(horde.Object.states.DESPAWNING);
					this.spawnFrameIndex = 2;
					this.phaseInit = true;
				}
				if (!this.hasState(horde.Object.states.DESPAWNING)) {
					this.addState(horde.Object.states.INVISIBLE);
					this.phase = 0;
					this.phaseInit = false;
				}
				break;

		}
	}
	
};

o.doppelganger = {
	role: "monster",
	team: 1,
	badass: true,

	animated: true,
	spriteSheet: "characters",
	spriteY: 0,
	spriteY: 768,
	spriteYOverlay: 928,

	damage: 20,
	hitPoints: 5000,
	speed: 200,

	soundAttacks: "dopp_attacks",
	soundDamage: "dopp_damage",
	soundDies: "dopp_dies",
	
	// Clay.io
	achievementId: "defeatdoppelganger",
	deathsForAchievement: 1,

	onInit: function () {
		this.phaseTimer = new horde.Timer();
	},

	onKilled: function (attacker, engine) {
		for (var id in engine.objects) {
			var obj = engine.objects[id];
			if (obj.role === "monster" && obj.id !== this.id) {
				obj.wound(obj.hitPoints);
			} else if (obj.role === "trap") {
				obj.ttl = 1500;
			}
		}
	},

	onUpdate: function (elapsed, engine) {

		switch (this.phase) {

			// Charge out of the gates
			case 0:
				if (!this.phaseInit) {
					this.speed = 300;
					this.animDelay = 100;
					this.phaseInit = true;
				}
				if (this.position.y > 100) {
					this.nextPhase();
				}
				break;

			// Dash to first waypoint
			case 1:
				if (!this.phaseInit) {
					this.speed = 200;
					this.animDelay = 200;
					this.waypoints = this.getPattern();
					this.currentWaypoint = this.waypoints.shift();
					this.phaseInit = true;
				}
				this.moveToward(this.currentWaypoint);
				var diff = this.currentWaypoint.clone().subtract(this.position).abs().magnitude();
				if (diff < 10) {
					this.position = this.currentWaypoint.clone();
					this.nextPhase();
				}
				break;

			// Shake
			case 2:
				if (!this.phaseInit) {
					this.setDirection(new horde.Vector2(0, 1));
					this.stopMoving();
					this.phaseTimer.start(500);
					this.phaseInit = true;
				}
				this.position.x += horde.randomRange(-1, 1);
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;

			// Follow waypoints dropping spikes
			case 3:
				if (!this.phaseInit) {
					this.currentWaypoint = this.waypoints.shift();
					this.speed = 400;
					this.animDelay = 100;
					this.phaseInit = true;
					this.spikeTimer = new horde.Timer();
					this.spikeTimer.start(200);
				}
				this.spikeTimer.update(elapsed);
				if (this.spikeTimer.expired()) {
					horde.sound.play("spike_attack");
					var id = engine.spawnObject(this, "spikes");
					var o = engine.objects[id];
					if (o) {
						o.ttl = 10000;
					}
					this.spikeTimer.reset();
				}
				this.moveToward(this.currentWaypoint);
				var diff = this.currentWaypoint.clone().subtract(this.position).abs().magnitude();
				if (diff < 10) {
					this.position = this.currentWaypoint.clone();
					if (this.waypoints.length > 0) {
						this.currentWaypoint = this.waypoints.shift();
					} else {
						this.nextPhase();
					}
				}
				break;

			// Chase hero slowly
			case 4:
				if (!this.phaseInit) {
					this.speed = 100;
					this.animDelay = 200;
					this.phaseTimer.start(7500);
					this.phaseInit = true;
				}
				var player = engine.getPlayerObject();
				if (player.wounds < player.hitPoints) {
					this.chase(player);
				}
				// TODO: Shoot swords
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;

			// Dash to upper left
			case 5:
				if (!this.phaseInit) {
					this.speed = 200;
					this.animDelay = 200;
					this.phaseInit = true;
					this.targetPos = new horde.Vector2(32, 66);
				}
				this.moveToward(this.targetPos);
				var diff = this.targetPos.clone().subtract(this.position).abs().magnitude();
				if (diff < 10) {
					this.position = this.targetPos.clone();
					this.nextPhase();
				}
				break;

			// Summon spike walls and shoot spears
			case 6:
				if (!this.phaseInit) {
					this.setDirection(new horde.Vector2(0, 1));
					this.stopMoving();
					this.phaseInit = true;
					this.makeSpikeWalls(engine);
					this.weapons = [{type: "e_dopp_sword", count: null}];
				}
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				this.chase(engine.getPlayerObject());
				this.stopMoving();
				if (this.wounds > (this.hitPoints * 0.33)) {
					// 2/3 HP (or lower)
					return "shoot";
				}
				break;

			// Chill out for a bit
			case 7:
				if (!this.phaseInit) {
					this.stopMoving();
					this.phaseTimer.start(4000);
					this.phaseInit = true;
				}
				if (this.phaseTimer.expired()) {
					// Poop out a meat...
					var meat = horde.makeObject("item_food");
					meat.position.x = 32;
					meat.position.y = 64;
					engine.addObject(meat);
					this.nextPhase();
				}
				break;

			// Wander throwing battle axes
			case 8:
				if (!this.phaseInit) {
					this.speed = 200;
					this.animDelay = 200;
					this.weapons = [{type: "e_dopp_axe", count: null}];
					this.cooldown = false;
					this.waypoints = this.getPattern();
					this.currentWaypoint = this.waypoints.shift();
					this.axeTimer = new horde.Timer();
					this.axeTimer.start(3000);
					this.axeTimer.update(3000);
					this.phaseInit = true;
				}
				this.axeTimer.update(elapsed);
				if (this.axeTimer.expired()) {
					this.chase(engine.getPlayerObject());
					engine.spawnObject(this, "e_dopp_axe");
					this.axeTimer.reset();
				}
				this.moveToward(this.currentWaypoint);
				var diff = this.currentWaypoint.clone().subtract(this.position).abs().magnitude();
				if (diff < 10) {
					this.position = this.currentWaypoint.clone();
					if (this.waypoints.length > 0) {
						this.currentWaypoint = this.waypoints.shift();
					} else {
						this.nextPhase();
					}
				}
				break;

			// Dash to center
			case 9:
				if (!this.phaseInit) {
					this.speed = 200;
					this.animDelay = 200;
					this.phaseInit = true;
					this.targetPos = new horde.Vector2((640 / 2) - 16, (480 / 2) - 16);
				}
				this.moveToward(this.targetPos);
				var diff = this.targetPos.clone().subtract(this.position).abs().magnitude();
				if (diff < 10) {
					this.position = this.targetPos.clone();
					this.nextPhase();
				}
				break;

			// Spawn some shit...
			case 10:
				if (!this.phaseInit) {
					horde.sound.play("minotaur_dies");
					this.setDirection(new horde.Vector2(0, 1));
					this.stopMoving();
					this.phaseInit = true;
					for (var b = 0; b < 60; ++b) {
						var id = engine.spawnObject(this, "dire_bat");
						var o = engine.objects[id];
						o.setDirection(horde.randomDirection());
						o.addState(horde.Object.states.INVINCIBLE, 250);
					}
					this.phaseTimer.start(8000);
				}
				if (this.phaseTimer.expired()) {
					this.setPhase(1);
				}
				break;

		}

	},

	getPattern: function () {
		switch (horde.randomRange(1, 3)) {

			// Spiral
			case 1:
				return [
					new horde.Vector2(64, 320),
					new horde.Vector2(64, 96),
					new horde.Vector2(544, 96),
					new horde.Vector2(544, 320),
					new horde.Vector2(128, 320),
					new horde.Vector2(128, 160),
					new horde.Vector2(480, 160),
					new horde.Vector2(480, 256),
					new horde.Vector2(192, 256)
				];
				break;
			
			// Snake
			case 2:
				return [
					new horde.Vector2(576, 352),
					new horde.Vector2(32, 352),
					new horde.Vector2(32, 288),
					new horde.Vector2(576, 288),
					new horde.Vector2(576, 224),
					new horde.Vector2(32, 224),
					new horde.Vector2(32, 160),
					new horde.Vector2(576, 160),
					new horde.Vector2(576, 96),
					new horde.Vector2(32, 96)
				];
				break;

			// Hourglass
			case 3:
				return [
					new horde.Vector2(576, 64),
					new horde.Vector2(32, 64),
					new horde.Vector2(288, 192),
					new horde.Vector2(32, 352),
					new horde.Vector2(576, 352),
					new horde.Vector2(352, 224),
					new horde.Vector2(576, 64)
				];
				break;

		}
	},

	makeSpikeWalls: function (engine) {

		horde.sound.play("wizard_reappear");

		var safeSpots = 3;
		var spinUpTime = 5000;
		var wallSpeedMod = 2;

		if (this.wounds > (this.hitPoints * 0.66)) {
			// 1/3 HP (or lower)
			safeSpots = 1;
			spinUpTime = 5000;
			wallSpeedMod = 2;
		} else if (this.wounds > (this.hitPoints * 0.33)) {
			// 2/3 HP (or lower)
			safeSpots = 2;
			spinUpTime = 7500;
			wallSpeedMod = 1.5;
		}

		this.phaseTimer.start(spinUpTime - 1500);

		// Make top wall
		var spike = [];
		for (var a = 0; a < 18; ++a) {
			spike.push(true);
		}

		for (var j = 0; j < safeSpots; ++j) {
			var c = 0;
			var found = false;
			while (found === false) {
				c = horde.randomRange(3, (spike.length - 1));
				found = (spike[c] === true);
			}
			spike[c] = false;
		}

		for (var x = 0; x < spike.length; ++x) {
			if (spike[x] === true) {
				var obj = horde.makeObject("spike_wall");
				obj.position = new horde.Vector2(32 + (x * 32), 64);
				obj.spinUpTime = spinUpTime;
				obj.speed *= wallSpeedMod;
				engine.addObject(obj);
			}
		}

		// Make left wall
		var spike = [];
		for (var a = 0; a < 10; ++a) {
			spike.push(true);
		}

		for (var j = 0; j < safeSpots; ++j) {
			var c = 0;
			var found = false;
			while (found === false) {
				c = horde.randomRange(3, (spike.length - 1));
				found = (spike[c] === true);
			}
			spike[c] = false;
		}

		for (var x = 0; x < spike.length; ++x) {
			if (spike[x] === true) {
				var obj = horde.makeObject("spike_wall");
				obj.position = new horde.Vector2(32, 64 + (x * 32));
				obj.wallDirection = new horde.Vector2(1, 0);
				obj.spinUpTime = spinUpTime;
				obj.speed = 275; // More ground to cover
				obj.speed *= wallSpeedMod;
				engine.addObject(obj);
			}
		}	

	}

};

o.e_dopp_axe = {
	role: "projectile",
	cooldown: 2500,
	speed: 250,
	hitPoints: Infinity,
	damage: 15,
	spriteSheet: "objects",
	spriteX: 160,
	spriteY: 32,
	rotate: true,
	rotateSpeed: 700,
	priority: 5,
	ttl: 10000,
	soundAttacks: "dopp_attacks",

	onInit: function () {
		this.spawnTimer = new horde.Timer();
		this.spawnTimer.start(50);
	},

	onUpdate: function (elapsed, engine) {
		if (!engine.objectExists(this.ownerId)) {
			this.die();
		}
		this.spawnTimer.update(elapsed);
		if (this.spawnTimer.expired()) {
			engine.spawnObject(this, "e_dopp_fire");
			this.spawnTimer.reset();
		}
	},
	// Clay.io
	ignoreLogDeath: true
};

o.e_dopp_sword = {
	role: "projectile",
	cooldown: 750,
	speed: 350,
	hitPoints: Infinity,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 384,
	spriteY: 544,
	spriteAlign: true,
	priority: 2,
	bounce: false,
	piercing: true,
	soundAttacks: "dopp_attacks",

	onInit: function () {
		this.spawnTimer = new horde.Timer();
		this.spawnTimer.start(50);
	},
	
	onUpdate: function (elapsed, engine) {
		this.spawnTimer.update(elapsed);
		if (this.spawnTimer.expired()) {
			engine.spawnObject(this, "e_dopp_fire");
			this.spawnTimer.reset();
		}
	},
	// Clay.io
	ignoreLogDeath: true
};

o.beholder = {
	role: "monster",
	team: 1,
	badass: true,

	size: new horde.Size(128, 128),
	spriteSheet: "beholder",
	animated: true,
	animDelay: 350,
	drawIndex: 3,

	damage: 30,
	hitPoints: 3000,
	speed: 50,

	//soundAttacks: "_attacks",
	soundDamage: "beholder_damage",
	soundDies: "beholder_dies",
	
	// Clay.io
	achievementId: "defeatbeholder",
	deathsForAchievement: 1,

	collidable: false,

	lootTable: [
		{type: "item_weapon_fire_sword", weight: 1}
	],

	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.attackTimer = new horde.Timer();
		this.eyeletOffset = 100;
		this.eyeletOffsetMod = 1;
		this.enraged = false;
	},

	onUpdate: function (elapsed, engine) {

		this.attackTimer.update(elapsed);
		if (this.attackTimer.expired()) {
			horde.sound.play("wizard_attacks");

			var id = engine.spawnObject(this, "e_energy_ball");
			var o = engine.objects[id];
			o.chase(engine.getPlayerObject());
			this.attackTimer.reset();
		}

		this.eyeletOffset += (((20 / 1000) * elapsed) * this.eyeletOffsetMod);
		if (this.eyeletOffset > 120) {
			this.eyeletOffsetMod = -1;
		}
		if (this.eyeletOffset < 100) {
			this.eyeletOffsetMod = 1;
		}

		if (this.wounds > (this.hitPoints / 2) && !this.enraged) {
			this.enraged = true;
			this.speed *= 1.5;
			this.animDelay /= 2;
			this.attackTimer.start(2000);
		}

		switch (this.phase) {

			// Charge out of the gates (invisible)
			case 0:
				if (!this.phaseInit) {
					this.speed = 200;
					this.addState(horde.Object.states.INVISIBLE);
					this.phaseInit = true;
				}
				if (this.position.y >= 70) {
					this.nextPhase();
				}
				break;

			// Phase in
			case 1:
				if (!this.phaseInit) {
					horde.sound.play("wizard_reappear");
					this.speed = 50;
					this.removeState(horde.Object.states.INVISIBLE);
					this.addState(horde.Object.states.INVINCIBLE);
					this.phaseTimer.start(2000);
					this.phaseInit = true;
				}
				movementTypes.wander.apply(this, arguments);
				if (this.phaseTimer.expired()) {
					this.attackTimer.start(4000);
					this.nextPhase();
				}
				break;

			// Wander and spawn X eyelets (now attackable)
			case 2:
				if (!this.phaseInit) {
					this.removeState(horde.Object.states.INVINCIBLE);
					this.collidable = true;
					this.eyeletTimer = new horde.Timer();
					this.eyeletTimer.start(500);
					this.eyeletsSpawned = 0;
					this.phaseInit = true;
				}
				this.eyeletTimer.update(elapsed);
				movementTypes.wander.apply(this, arguments);
				if (this.eyeletTimer.expired()) {
					horde.sound.play("wizard_reappear");

					this.eyeletTimer.reset();
					var id = engine.spawnObject(this, "eyelet");
					if (this.wounds > (this.hitPoints / 2)) {
						var o = engine.objects[id];
						o.makeBadass();
					}
					++this.eyeletsSpawned;
					if (this.eyeletsSpawned >= 12) {
						this.nextPhase();
					}
				}
				break;

			case 3:
				if (!this.phaseInit) {
					this.phaseTimer.start(20000);
					this.phaseInit = true;
				}
				var hasEyelets = false;
				for (var id in engine.objects) {
					if (engine.objects[id].ownerId === this.id) {
						hasEyelets = true;
						break;
					}
				}
				if (this.phaseTimer.expired() || !hasEyelets) {
					this.nextPhase();
				}
				movementTypes.wander.apply(this, arguments);
				break;

			// Shake
			case 4:
				if (!this.phaseInit) {
					this.stopMoving();
					this.phaseTimer.start(2000);
					this.phaseInit = true;
				}
				this.position.x += horde.randomRange(-2, 2);
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;
			
			// Shit some gas clouds
			case 5:
				for (var n = 0; n < 2; ++n) {
					engine.spawnObject(this, "gas_cloud");
				}
				this.nextPhase();
				break;

			case 6:
				if (!this.phaseInit) {
					this.oldSpeed = this.speed;
					this.speed = 250;
					this.oldAnimDelay = this.animDelay;
					this.animDelay = 100;
					this.chase(engine.getPlayerObject());
					this.phaseTimer.start(1000); // Must charge for at least 1s
					this.phaseInit = true;
				}
				break;

		}	
	},

	onWallCollide: function () {
		if (this.phase === 6 && this.phaseTimer.expired()) {
			this.speed = this.oldSpeed;
			this.animDelay = this.oldAnimDelay;
			this.setPhase(2);
		}
	}

};

o.gas_cloud = {
	role: "trap",
	team: 1,

	animated: true,
	size: new horde.Size(128, 128),
	spriteSheet: "characters",
	spriteX: 640,
	spriteY: 416,
	drawIndex: 2,
	animDelay: 400,

	damage: 20,
	hitPoints: 9999,
	speed: 10,
	ttl: 90000,
	
	damageType: "magic",

	onInit: function () {
		this.setDirection(horde.randomDirection());
		this.moveChangeDelay = horde.randomRange(5000, 10000);
	},

	onUpdate: function (elasped, engine) {
		if (this.animFrameIndex === 2) {
			this.animated = false;
			this.spriteX = 896;
		}
		if (
			this.team === 1
			&& !engine.objects[this.ownerId]
			&& (this.ttl - this.ttlElapsed > 2000)
		) {
			this.ttlElapsed = (this.ttl - 2000);
		}
		movementTypes.wander.apply(this, arguments);
	},

	onObjectCollide: function (object, engine) {
		if (object.team !== this.team && object.role !== "projectile") {
			object.addState(horde.Object.states.SLOWED, 300);
		}
		if (this.team !== 3 && object.damageType == "magic") {
			horde.sound.play("fire_attack");
			this.ownerId = null;
			this.team = 3;
			this.damage = 5;
			this.ttl = 2000;
			this.ttlElapsed = 0;
			this.spriteY += 224;
			this.animDelay = 500;
			this.animFrameIndex = 0;
			this.animNumFrames = 3;
		}
	}

};

o.dragon = {
	role: "monster",
	team: 1,
	badass: true,

	animated: true,
	gibletSize: "large",
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteY: 352,

	moveChangeElapsed: 0,
	moveChangeDelay: 0,

	damage: 20,
	hitPoints: 1000,
	speed: 20,
	worth: 0,

	soundAttacks: "dragon_attacks",
	soundDamage: "dragon_damage",
	soundDies: "dragon_dies",
	
	// Clay.io
	achievementId: "defeatdragon",
	deathsForAchievement: 1,

	weapons: [{type: "e_fireball", count: null}],

	lootTable: [
		{type: "item_gold_chest", weight: 1}
	],

	phase: 0,
	phaseInit: false,

	onInit: function () {
		this.phaseTimer = new horde.Timer();
		this.moveChangeDelay = horde.randomRange(500, 1000);
		this.setDirection(horde.directions.toVector(horde.directions.DOWN));
		this.altTimer = new horde.Timer();
	},
	onUpdate: function (elapsed, engine) {
		
		this.altTimer.update(elapsed);

		switch (this.phase) {
			
			// Charge out of the gates
			case 0:
				if (!this.phaseInit) {
					this.speed = 200;
					this.animDelay = 50;
					this.phaseInit = true;
				}
				if (this.position.y >= 200) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
			
			case 1:
				if (!this.phaseInit) {
					this.stopMoving();
					this.animDelay = 300;
					this.phaseTimer.start(1000);
					this.phaseInit = true;
				}
				this.position.x += horde.randomRange(-1, 1);
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;
			
			case 2:
				if (!this.phaseInit) {
					this.cooldown = false;
					this.stopMoving();
					this.weapons = [{type: "e_ring_fire", count: null}];
					this.phaseInit = false;
				}
				engine.objectAttack(this);
				this.nextPhase();
				break;
			
			// Wiggle it!
			case 3:
				if (!this.phaseInit) {
					this.speed = 0;
					this.animDelay = 100;
					this.phaseTimer.start(2000);
					this.phaseInit = true;
					this.altTimer.start(350);
					this.followUpShot = false;
				}
				if (!this.followUpShot && this.altTimer.expired()) {
					if (this.wounds > (this.hitPoints / 2)) {
						this.cooldown = false;
						this.weapons = [{type: "e_ring_fire_dopp", count: null}];
						engine.objectAttack(this);
						this.followUpShot = true;
					}
				}
 				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				this.position.x += horde.randomRange(-1, 1);
				break;

			// Charge player
			case 4:
				if (!this.phaseInit) {
					this.speed = 350;
					this.animDelay = 100;
					this.phaseTimer.start(500);
					this.phaseInit = true;
					var p = engine.getPlayerObject();
					this.chase(p);
				}
				if (this.phaseTimer.expired()) {
					this.phase++;
					this.phaseInit = false;
				}
				break;
			
			// Stand still and spew flames!
			case 5:
				if (!this.phaseInit) {
					this.speed = 0;
					this.animDelay = 400;
					this.weapons = [{type: "e_fireball_green", count: null}];
					this.cooldown = false;
					this.cooldownElapsed = 0;
					this.phaseTimer.start(2500);
					this.phaseInit = true;
					this.altTimer.start(750);
				}
				if (this.phaseTimer.expired()) {
					this.phase = 2;
					this.phaseInit = false;
				}
				var p = engine.getPlayerObject();
				this.chase(p);
				if (this.altTimer.expired() && this.wounds > (this.hitPoints / 2)) {
					engine.spawnObject(this, "e_fireball");
					this.altTimer.reset();
					// I don't know why this sound won't play. I give up.
					//horde.sound.play(this.soundAttacks);
				}

				return "shoot";
		}

	}

};

// ENEMY WEAPONS

o.e_arrow = {
	role: "projectile",
	cooldown: 4000,
	speed: 200,
	hitPoints: 1,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 256,
	spriteY: 0,
	spriteAlign: true,
	bounce: false,
	// Clay.io
	ignoreLogDeath: true
};

o.e_trident = {
	role: "projectile",
	cooldown: 5000,
	speed: 200,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 160,
	spriteY: 0,
	spriteAlign: true,
	bounce: false,
	// Clay.io
	ignoreLogDeath: true
};

o.e_boulder = {
	role: "projectile",
	cooldown: 2000,
	speed: 150,
	hitPoints: Infinity,
	damage: 15,
	spriteSheet: "objects",
	spriteX: 224,
	spriteY: 0,
	rotate: true,
	bounce: false,
	// Clay.io
	ignoreLogDeath: true
};

o.e_bouncing_boulder = {
	role: "projectile",
	cooldown: 1500,
	speed: 150,
	hitPoints: Infinity,
	damage: 15,
	spriteSheet: "objects",
	spriteX: 224,
	spriteY: 0,
	rotate: true,
	bounce: true,
	ttl: 5000,
	// Clay.io
	ignoreLogDeath: true
};

o.e_minotaur_trident = {
	role: "projectile",
	cooldown: 2000,
	speed: 200,
	hitPoints: Infinity,
	damage: 20,
	spriteAlign: true,
	spriteSheet: "objects",
	spriteX: 160,
	spriteY: 0,
	bounce: false,
	// Clay.io
	ignoreLogDeath: true
};

o.e_energy_ball = {
	role: "projectile",
	cooldown: 2000,
	speed: 200,
	hitPoints: Infinity,
	damage: 25,
	spriteSheet: "objects",
	spriteX: 320,
	spriteY: 0,
	rotate: true,
	bounce: false,
	// Clay.io
	ignoreLogDeath: true
};

o.e_ring_fire = {
	role: "projectile",
	cooldown: 2000,
	speed: 200,
	hitPoints: Infinity,
	damage: 20,
	spriteSheet: "objects",
	spriteX: 352,
	spriteY: 0,
	rotate: true,
	bounce: false,
	damageType: "magic",
	// Clay.io
	ignoreLogDeath: true
};

o.e_ring_fire_dopp = {
	role: "projectile",
	cooldown: 2000,
	speed: 150,
	hitPoints: Infinity,
	damage: 25,
	spriteSheet: "objects",
	spriteX: 352,
	spriteY: 544,
	rotate: true,
	bounce: false,
	damageType: "magic",
	// Clay.io
	ignoreLogDeath: true
};

o.e_fireball = {
	role: "projectile",
	cooldown: 2000,
	speed: 350,
	hitPoints: Infinity,
	damage: 20,
	spriteSheet: "objects",
	spriteX: 352,
	spriteY: 544,
	rotate: true,
	bounce: false,
	damageType: "magic",
	// Clay.io
	ignoreLogDeath: true
};

o.e_fireball_green = {
	role: "projectile",
	cooldown: 75,
	speed: 350,
	hitPoints: Infinity,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 352,
	spriteY: 0,
	rotate: true,
	ttl: 400,
	bounce: false,
	damageType: "magic",
	// Clay.io
	ignoreLogDeath: true
};

o.e_static_blue_fire = {
	role: "projectile",
	cooldown: 100,
	speed: 0,
	hitPoints: Infinity,
	damage: 5,
	spriteSheet: "objects",
	spriteX: 288,
	spriteY: 32,
	rotate: true,
	rotateSpeed: 100,
	ttl: 1000,
	bounce: false,
	drawIndex: 0,
	damageType: "magic",
	// Clay.io
	ignoreLogDeath: true
};

o.e_dopp_fire = {
	role: "projectile",
	cooldown: 200,
	speed: 0,
	hitPoints: Infinity,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 288,
	spriteY: 32,
	rotate: true,
	rotateSpeed: 200,
	ttl: 250,
	bounce: false,
	drawIndex: 0,
	damageType: "magic",
	// Clay.io
	ignoreLogDeath: true
};

o.e_static_green_fire = {
	role: "projectile",
	cooldown: 200,
	speed: 0,
	hitPoints: Infinity,
	damage: 10,
	size: new horde.Size(64, 64),
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 192,
	rotate: true,
	rotateSpeed: 150,
	ttl: 2000,
	bounce: false,
	drawIndex: 0,
	damageType: "magic",
	// Clay.io
	ignoreLogDeath: true
};

o.e_dirt_pile = {
	role: "trap",
	cooldown: 100,
	speed: 0,
	hitPoints: Infinity,
	damage: 0,
	spriteSheet: "characters",
	spriteX: 0,
	spriteY: 448,
	//animated: true,
	ttl: 3000,
	bounce: false,
	drawIndex: -2,
	
	onInit: function () {
		if (horde.randomRange(1, 10) > 5) {
			this.spriteX += 32;
		}
	},
	
	onObjectCollide: function (object, engine) {
		if (object.team !== this.team && object.role !== "projectile") {
			object.addState(horde.Object.states.SLOWED, 300);
		}
	},
	// Clay.io
	ignoreLogDeath: true
	
};

o.e_spit_pool = {
	role: "trap",
	cooldown: 100,
	speed: 0,
	hitPoints: 9999,
	damage: 5,
	size: new horde.Size(64, 64),
	spriteSheet: "characters",
	spriteX: 896,
	spriteY: 416,
	animated: true,
	ttl: 7500,
	bounce: false,
	drawIndex: -1,
	collidable: false,
	
	onObjectCollide: function (object, engine) {
		if (object.team !== this.team && object.role !== "projectile") {
			object.addState(horde.Object.states.SLOWED, 300);
		}
	},
	// Clay.io
	ignoreLogDeath: true
	
};

o.e_shock_wave = {
	role: "projectile",
	cooldown: 1000,
	speed: 200,
	hitPoints: Infinity,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 224,
	spriteY: 32,
	spriteAlign: true,
	bounce: false,
	animated: true,
	damageType: "magic",
	// Clay.io
	ignoreLogDeath: true
};

o.e_worm_spit = {
	role: "projectile",
	cooldown: 1000,
	speed: 200,
	hitPoints: 1,
	damage: 10,
	spriteSheet: "objects",
	spriteX: 128,
	spriteY: 64,
	spriteAlign: true,
	bounce: false,
	animated: true,
	damageType: "magic",

	onInit: function () {
		this.dieTimer = new horde.Timer();
		this.dieTimer.start(1000);
	},
	
	onUpdate: function (elapsed, engine) {
		this.dieTimer.update(elapsed);
		if (this.dieTimer.expired()) {
			this.die();
		}
	},
	
	onDelete: function (engine) {
		engine.spawnObject(this, "e_spit_pool");
	},
	// Clay.io
	ignoreLogDeath: true
	
};

// OTHER SHIT

o.mini_heart = {
	role: "fluff",
	spriteSheet: "objects",
	spriteX: 288,
	spriteY: 128,
	size: new horde.Size(10, 10),
	ttl: 600,
	speed: 75,
	collidable: false,
	drawIndex: 5,
	onInit: function () {
		this.setDirection(new horde.Vector2(0, -1));
		this.speed = horde.randomRange(55, 85);
	}
};

o.mini_skull = {
	role: "fluff",
	spriteSheet: "objects",
	spriteX: 288 + 32,
	spriteY: 128,
	size: new horde.Size(10, 10),
	ttl: 1300,
	collidable: false,
	drawIndex: 5,
	onInit: function () {
		this.setDirection(new horde.Vector2(0, -1));
		this.speed = horde.randomRange(25, 60);
	}
};

o.rose = {
	
	role: "fluff",
	spriteSheet: "objects",
	collidable: false,
	rotate: true,
	
	spriteX: 192,
	spriteY: 256,
	
	drawIndex: -1,
	
	onInit: function () {
		this.speed = horde.randomRange(150, 200);
		this.rotateSpeed = horde.randomRange(75, 100);
		this.phaseTimer = new horde.Timer();
	},
	
	onUpdate: function (elapsed, engine) {
		
		switch (this.phase) {
			
			case 0:
				if (!this.phaseInit) {
					this.phaseInit = true;
					var rnd = horde.randomRange(0, 5);
					this.direction.y = -(rnd / 10);
					this.phaseTimer.start(horde.randomRange(500, 1750));
				}
				this.direction.y += 0.01;
				if (this.phaseTimer.expired()) {
					this.nextPhase();
				}
				break;
			
			case 1:
				if (!this.phaseInit) {
					this.stopMoving();
					this.rotate = false;
					this.phaseInit = true;
				}
				break;
			
		}
		
	}
	
};

o.cloud = {
	
	role: "fluff",
	spriteSheet: "objects",
	collidable: false,
	
	drawIndex: 10,
	
	onInit: function () {
		
		this.alpha = 0.25;
		this.speed = horde.randomRange(5, 25);
		this.size = new horde.Size(192, 128);
		
		switch (horde.randomRange(1, 4)) {
			
			case 1:
				this.spriteX = 0;
				this.spriteY = 288;
				break;

			case 2:
				this.size = new horde.Size(128, 96);
				this.spriteX = 192;
				this.spriteY = 288;
				break;

			case 3:
				this.spriteX = 0;
				this.spriteY = 416;
				break;
				
			case 4:
				this.size = new horde.Size(160, 128);
				this.spriteX = 192;
				this.spriteY = 416;
				break;
		}
		
	}
	
};

// GATE

o.gate = {
	role: "fluff",
	speed: 25,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 192,
	size: new horde.Size(64, 64)
};

o.pickup_arrow = {
	role: "fluff",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 608,
	size: new horde.Size(118, 52),
	drawIndex: 9,
	animated: true
};

// FOOD (Eat Meat!)

o.item_food = {
	role: "powerup_food",
	healAmount: 10,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 32,
	ttl: 8000
};

// GOLD (Collect Gold!)

o.item_coin = {
	role: "powerup_coin",
	coinAmount: 100,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 64,
	spriteY: 32,
	ttl: 5000
};

o.item_chest = {
	role: "powerup_coin",
	coinAmount: 500,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 32,
	ttl: 5000
};

o.item_gold_chest = {
	role: "powerup_coin",
	coinAmount: 5000,
	speed: 0,
	spriteSheet: "objects",
	spriteX: 0,
	spriteY: 32
};

// WEAPON POWERUPS

o.item_weapon_knife = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 32,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_knife",
	wepCount: 125
};

o.item_weapon_spear = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 96,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_spear",
	wepCount: 100
};

o.item_weapon_fireball = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_fireball",
	wepCount: 100
};

/*
o.item_weapon_bomb = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 128,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_bomb",
	wepCount: 10
};
*/

o.item_weapon_axe = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 192,
	spriteY: 32,
	ttl: 5000,
	wepType: "h_axe",
	wepCount: 75
};

o.item_weapon_fire_sword = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 384,
	spriteY: 0,
	wepType: "h_fire_sword",
	wepCount: 5000
};

/*
o.item_weapon_fire_knife = {
	role: "powerup_weapon",
	speed: 0,
	spriteSheet: "objects",
	spriteX: 384,
	spriteY: 0,
	ttl: 5000,
	wepType: "h_fire_knife",
	wepCount: 1000
};
*/

}());
