(function define_horde_Object () {

/**
 * Horde Game Object
 * @constructor
 */
horde.Object = function () {
	this.id = ""; // Object ID
	this.ownerId = null; // Owner object ID
	this.position = new horde.Vector2(); // Object's position on the map
	this.size = new horde.Size(32, 32); // Size of the object
	this.direction = new horde.Vector2(); // Direction the object is moving
	this.facing = new horde.Vector2(0, 1); // Direction the object is facing
	this.speed = 100; // The speed at which the object moves
	this.team = null; // Which "team" the object is on (null = neutral)
	this.hitPoints = 1; // Hit points
	this.damage = 1; // Amount of damage object deals when colliding with enemies
	this.spriteSheet = ""; // Sprite sheet where this object's graphics are found
	this.spriteX = 0; // X location of spirte
	this.spriteY = 0; // Y location of sprite
	this.spriteAlign = false; // Align sprite with facing
	this.animated = false; // Animated or not
	this.animFrameIndex = 0; // Current animation frame to display
	this.animNumFrames = 2;
	this.animDelay = 200; // Delay (in milliseconds) between animation frames
	this.animElapsed = 0; // Elapsed time (in milliseconds) since last animation frame increment
	this.spawnFrameIndex = 0;
	this.spawnFrameCount = 2;
	this.spawnFramesX = 0;
	this.spawnFramesY = 0;
	this.angle = 0; // Angle to draw this object
	this.rotateSpeed = 400; // Speed at which to rotate the object
	this.rotate = false; // Enable/disable rotation of object
	this.worth = 0; // Amount of gold this object is worth when killed
	this.ttl = 0; // How long (in milliseconds) this object *should* exist (0 = no TTL)
	this.ttlElapsed = 0; // How long (in milliseconds) this object *has* existed
	this.alpha = 1; // Alpha value for drawing this object
	this.alphaMod = 1; // Alpha modifier (fadin [1] vs fadeout [-1])
	this.gibletSize = "small"; // Size of giblets to spawn when this objects "dies"
	this.cooldown = false; // Whether or not the object's attack is on cooldown
	this.cooldownElapsed = 0; // How long the object's attack has been on cooldown
	this.autoFire = false; // Enable/disable auto fire
	this.soundAttacks = null; // Sound to play when object attacks
	this.soundDamage = null; // Sound to play when object takes damage
	this.soundDies = null; // Sound to play when object dies
	this.alive = true;
	this.states = [];
	this.addState(horde.Object.states.IDLE);
	this.currentWeaponIndex = 0;
	this.collidable = true;
	this.bounce = true;
	this.piercing = false;

	// Clay.io
	this.achievementId = null; // Related Clay.io Achievement ID
	this.deathsForAchievement = Infinity; // # of kills necessary necessary to earn achievement
	this.ignoreLogDeath = false; // If set to true, the # of deaths isn't logged (in Clay.io data-storage)

	// Default sounds
	this.soundDamage = null;
	this.soundDies = null;

	this.damageType = "physical";

	this.drawIndex = 1; // Controls what order objects are drawn, lower is first

	// AI stuff
	this.moveChangeElapsed = 0;
	this.moveChangeDelay = 500;

	this.wounds = 0; // Amount of damage object has sustained
	this.weapons = [];
	this.gold = 0; // Amount of gold this object has earned

	// Stats!
	this.kills = 0;
	this.timesWounded = 0;
	this.totalDamageTaken = 0;
	this.shotsFired = 0;
	this.shotsLanded = 0;
	this.shotsPerWeapon = {};
	this.meatEaten = 0;
	this.cheater = false;

	// Behavior phase stuff
	this.phase = 0;
	this.phaseInit = false;

	// Loot tables for enemies
	this.lootTable = [];

	this.killSwitch = false;
};

horde.Object.states = {
	IDLE: 0,
	MOVING: 1,
	ATTACKING: 2,
	HURTING: 3,
	DYING: 4,
	INVINCIBLE: 5,
	INVISIBLE: 6,
	SPAWNING: 7,
	DESPAWNING: 8,
	STUNNED: 9,
	VICTORIOUS: 10
};

var proto = horde.Object.prototype;

/**
 * Populates this object's key stats from a JSON dump
 * @param {string} json JSON dump of an object
 * @return {void}
 */
proto.load = function horde_Object_load (json) {
	var data = JSON.parse(json);
	this.wounds = data.wounds;
	this.weapons = data.weapons;
	this.currentWeaponIndex = data.currentWeaponIndex;
	this.gold = data.gold;
	this.kills = data.kills;
	this.timesWounded = data.timesWounded;
	this.totalDamageTaken = data.totalDamageTaken;
	this.shotsFired = data.shotsFired;
	this.shotsLanded = data.shotsLanded;
	this.shotsPerWeapon = data.shotsPerWeapon;
	this.meatEaten = data.meatEaten;
	this.cheater = data.cheater;
};

proto.setPhase = function (phase) {
	this.phase = phase;
	this.phaseInit = false;
}

proto.nextPhase = function () {
	this.setPhase(this.phase + 1);
};

proto.updateStates = function (elapsed) {
	for (var x in this.states) {
		var s = this.states[x];
		s.timer.update(elapsed);
		if (s.timer.expired()) {
			this.removeStateById(x);
			continue;
		}
	}
};

proto.hasState = function (state) {
	for (var x in this.states) {
		if (this.states[x].type === state) {
			return true;
		}
	}
	return false;
};

proto.addState = function (state, ttl) {
	if (this.hasState(state)) {
		return false;
	}
	var t = new horde.Timer();
	t.start(ttl);
	this.states.push({
		type: state,
		timer: t
	});
	switch (state) {
		case horde.Object.states.SLOWED:
			this.oldAnimDelay = this.animDelay;
			this.animDelay *= 2;
			break;
	}
};

proto.removeStateById = function (id) {
	var s = this.states[id];
	switch (s.type) {
		case horde.Object.states.INVINCIBLE:
			this.alpha = 1;
			this.alphaMod = -1;
			break;
		case horde.Object.states.SLOWED:
			this.animDelay = this.oldAnimDelay;
			break;
	}
	delete(this.states[id]);
};

proto.removeState = function (state) {
	for (var x in this.states) {
		if (this.states[x].type === state) {
			this.removeStateById(x);
		}
	}
};

/**
 * Runs any initialization
 * @return {void}
 */
proto.init = function horde_Object_proto_init () {
	this.execute("onInit");
	if (this.rotate) {
		this.angle = horde.randomRange(0, 359);
	}
	if (this.animated) {
		this.animElapsed = horde.randomRange(0, this.animDelay);
	}
};

/**
 * Causes this object to die. Do not pass go, do not collect $200.
 * @return {void}
 */
proto.die = function horde_Object_proto_die () {
	this.alive = false;

	// Clay.io: Log the death for things like achievements
	if((this.role == "monster" || this.role == "projectile") && !this.ignoreLogDeath) // Certain projectiles are ignored (ex. fire_sword_trail)
		this.logDeath();
};

/**
 * Logs when a monster or projectile "dies". This is later used for Clay.io achievements (ex. kill 1000 bats)
 * @return {void}
 */
proto.logDeath = function horde_Object_proto_logDeath () {
	// Clay.io: Update number of enemies killed
	var deaths = 0;
	var key = this.type + "_killed";
	var _this = this;

	if (this.achievementId !== null) {
		horde.Engine.prototype.getData(key, function(response) {
			deaths = (response.data ? response.data : 0) + 1;
			horde.Engine.prototype.putData(key, deaths);

			// Clay.io: check if there's an achievement for killing this specific thing x times
			if(_this.achievementId && deaths >= _this.deathsForAchievement && !horde.achievementsGranted[_this.achievementId])
			{
				horde.achievementsGranted[_this.achievementId] = true; // so we don't keep sending to Clay.io
				(new Clay.Achievement({ id: _this.achievementId })).award();
			}
		});
	}

	if(this.role == "monster") {
		// Update overall kills
		var key = "overall_killed";
		horde.Engine.prototype.getData(key, function(response) {
			deaths = (response.data ? response.data : 0) + 1;
			horde.Engine.prototype.putData(key, deaths);

			// See if they're at achievement for overall kills
			achievementId = "killenemies";
			// 10,000 kills for the achievement
			if(deaths >= 10000 && !horde.achievementsGranted[achievementId]) {
				horde.achievementsGranted[achievementId] = true; // so we don't keep sending to Clay.io
				(new Clay.Achievement({ id: achievementId })).award();
			}
		});
	}
}

/**
 * Returns whether or not this object is "dead" (this.alive === false)
 * @return {boolean} True if the object is dead; otherwise false
 */
proto.isDead = function horde_Object_proto_isDead () {
	return !this.alive;
}

/**
 * Update this object
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {void}
 */
proto.update = function horde_Object_proto_update (elapsed, engine) {

	// If the owner has died, kill off this object
	if (
		this.killSwitch === false
		&& this.ownerId !== null
		&& !engine.isAlive(this.ownerId)
	) {
		switch (this.role) {
			case "projectile":
			case "trap":
				this.ttl = 1000;
				this.ttlElapsed = 0;
				break;
			case "monster":
				this.wound(this.hitPoints);
				break;
		}
		this.killSwitch = true;
	}

	this.updateStates(elapsed);

	if (this.deathTimer) {
		this.deathTimer.update(elapsed);
	}

	if (this.hasState(horde.Object.states.DYING)) {
		if (this.deathTimer.expired()) {
			this.deathFrameIndex++;
			this.deathTimer.reset();
			if (this.deathFrameIndex > 2) {
				this.deathFrameIndex = 2;
				this.ttl = 750;
			}
		}
	}

	if (this.hasState(horde.Object.states.INVINCIBLE)) {
		this.alpha += ((10 / 1000) * elapsed) * this.alphaMod;
		if (this.alpha >= 1) {
			this.alpha = 1;
			this.alphaMod = -1;
		}
		if (this.alpha <= 0) {
			this.alpha = 0;
			this.alphaMod = 1;
		}
	}

	if (this.hasState(horde.Object.states.STUNNED)) {
		return;
	}

	if (this.animated) {
		this.animElapsed += elapsed;
		if (this.animElapsed >= this.animDelay) {
			this.animElapsed = 0;
			this.animFrameIndex++;
			if (this.animFrameIndex > (this.animNumFrames - 1)) {
				this.animFrameIndex = 0;
			}
			if (this.hasState(horde.Object.states.SPAWNING)) {
				this.spawnFrameIndex++;
				if (this.spawnFrameIndex > this.spawnFrameCount) {
					this.removeState(horde.Object.states.SPAWNING);
				}
			}
			if (this.hasState(horde.Object.states.DESPAWNING)) {
				this.spawnFrameIndex--;
				if (this.spawnFrameIndex < 0) {
					this.removeState(horde.Object.states.DESPAWNING);
				}
			}
		}
	}

	if (this.spriteAlign) {
		this.angle = this.facing.angle();
	}

	if (this.rotate) {
		this.angle += ((this.rotateSpeed / 1000) * elapsed);
	}
	if (this.ttl > 0) {
		this.ttlElapsed += elapsed;
		if (this.ttl - this.ttlElapsed <= 1000) {
			this.alpha -= ((1 / 1000) * elapsed);
		}
		if (this.ttlElapsed >= this.ttl) {
			this.die();
		}
	}
	if (this.cooldown === true) {
		this.cooldownElapsed += elapsed;
		var wepInfo = this.getWeaponInfo();
		var wep = horde.objectTypes[wepInfo.type];
		if (this.cooldownElapsed >= wep.cooldown) {
			this.cooldown = false;
			this.cooldownElapsed = 0;
		}
	}

	if (this.phaseTimer) {
		this.phaseTimer.update(elapsed);
	}

	if (this.hasState(horde.Object.states.DYING)) {
		// Don't proceed with calling any AI behavior if this thing is dying...
		return;
	}

	return this.execute("onUpdate", arguments);
};

/**
 * Returns the XY coordinates of this objects sprite
 * @return {horde.Vector2} XY coordinates of sprite to draw
 */
proto.getSpriteXY = function horde_Object_proto_getSpriteXY (facingOverride) {
	if (this.animated) {
		switch (this.role) {

			case "hero":
			case "monster":
				if (this.hasState(horde.Object.states.DYING)) {
					return new horde.Vector2(
						(17 + this.deathFrameIndex) * this.size.width, this.spriteY
					);
				}
				if (
					this.hasState(horde.Object.states.SPAWNING)
					|| this.hasState(horde.Object.states.DESPAWNING)
				) {
					return new horde.Vector2(
						this.spawnFramesX + (this.spawnFrameIndex * this.size.width),
						this.spawnFramesY
					);
				}
				if (this.hasState(horde.Object.states.HURTING) && this.size.width <= 32) {
					return new horde.Vector2(
						16 * this.size.width, this.spriteY
					);
				}
				if (this.hasState(horde.Object.states.VICTORIOUS)) {
					return new horde.Vector2(
						20 * this.size.width, this.spriteY
					);
				}
				if (facingOverride) {
					var f = facingOverride;
				} else {
					var f = this.facing.clone();
				}
				var offset = horde.directions.fromVector(f);
				return new horde.Vector2(
					((offset * 2) + this.animFrameIndex) * this.size.width,
					this.spriteY
				);
				break;

			default:
				if (
					this.hasState(horde.Object.states.SPAWNING)
					|| this.hasState(horde.Object.states.DESPAWNING)
				) {
					return new horde.Vector2(
						this.spawnFramesX + (this.spawnFrameIndex * this.size.width),
						this.spawnFramesY
					);
				}
				return new horde.Vector2(
					this.spriteX + (this.animFrameIndex * this.size.width),
					this.spriteY
				);
				break;

		}

	} else {
		return new horde.Vector2(this.spriteX, this.spriteY);
	}
};

/**
 * Returns the bounding box for this object
 * @return {horde.Rect} Rectangle representing the bounding box
 */
proto.boundingBox = function horde_Object_proto_boundingBox () {
	var rect = new horde.Rect(
		this.position.x, this.position.y,
		this.size.width - 1, this.size.height - 1
	);
	if (this.role === "projectile") {
		rect.reduce(1);
	}
	if (this.type === "e_spit_pool") {
		// Kind of a hack...
		rect.y += (this.size.height / 4);
		rect.x += 5;
		rect.height -= (this.size.height / 2);
		rect.width -= 10;
	}
	if (this.type === "gas_cloud") {
		rect.y += 32;
		rect.x += 32;
		rect.height -= 32;
		rect.width -= 32;
	}
	return rect;
};

/**
 * Centers this object on a point
 * @param {horde.Vector2} v Vector to center on
 * @return {void}
 */
proto.centerOn = function horde_Object_proto_centerOn (v) {
	this.position = v.subtract(horde.Vector2.fromSize(this.size).scale(0.5));
};

/**
 * Deal some damage (or wound) this object
 * @param {number} damage The amount of damage to deal
 * @return {boolean} True if the object has died; otherwise false
 */
proto.wound = function horde_Object_proto_wound (damage) {
	if (
		(damage < 1)
		|| this.hasState(horde.Object.states.DYING)
		|| this.isDead()
	) {
		return false;
	}
	this.removeState(horde.Object.states.STUNNED);
	this.wounds += damage;
	this.totalDamageTaken += damage;
	this.timesWounded++;
	if (this.role === "monster" || this.role === "hero") {
		this.addState(horde.Object.states.HURTING, 300);
	}
	if (this.wounds >= this.hitPoints) {
		this.wounds = this.hitPoints;
		if (this.role === "monster" || this.role === "hero") {
			this.addState(horde.Object.states.DYING);
			this.deathFrameIndex = 0;
			this.deathTimer = new horde.Timer();
			this.deathTimer.start(200);
		} else {
			this.die();
		}
		if (this.role === "hero") {
			horde.sound.stopAll();
		}
		if (this.soundDies) {
			horde.sound.play(this.soundDies);
		}
		return true;
	}
	if (this.soundDamage) {
		horde.sound.play(this.soundDamage);
	}
	return false;
};

/**
 * Handles when this object collides with a wall
 * @param {array} axis Array of axes where collision occurred (x, y)
 * @return {void}
 */
proto.wallCollide = function horde_Object_proto_wallCollide (axis) {
	if (this.role === "hero") {
		return;
	}
 	if (this.bounce) {
		// reverse direction(s)
		var d = this.direction.clone();
		for (var i in axis) {
			d[axis[i]] *= -1;
		}
		this.setDirection(d);
		if (this.role === "projectile") {
			horde.sound.play("weapon_wall");
		}
	} else {
		if (this.damageType === "physical") {
			this.deflect();
		} else {
			this.die();
		}
	}
	this.execute("onWallCollide", [axis]);
};

proto.deflect = function horde_Object_proto_deflect () {
	this.role = "fluff";
	this.rotateSpeed = this.speed * 5;
	this.speed *= 0.50;
	this.spriteAlign = false;
	this.rotate = true;
	this.ttl = 100;
	this.alpha = 0.5;
	this.bounce = true;
};

/**
 * Sets the direction (and facing) for this object
 * @param {horde.Vector2} v Vector representing the direction
 * @return {void}
 */
proto.setDirection = function horde_Object_proto_setDirection (v) {
	if (v.x === 0 && v.y === 0) {
		this.stopMoving();
	} else {
		this.direction = v;
		this.facing = this.direction.clone();
	}
};

proto.reverseDirection = function () {
	var d = this.direction.clone();
	d.scale(-1);
	this.setDirection(d);
};

/**
 * "Chases" another object by setting this objects direction toward another
 * @return {void}
 */
proto.chase = function horde_Object_proto_chase (object) {
	this.moveToward(object.position.clone());
};

proto.moveToward = function horde_Object_proto_moveToward (vector) {
	var direction = vector.clone().subtract(this.position).normalize();
	this.setDirection(direction);
};

/**
 * Returns if this object is moving or not
 * @return {boolean} True if the object is moving, otherwise false
 */
proto.isMoving = function horde_Object_proto_isMoving () {
	if (this.hasState(horde.Object.states.DYING)) {
		return false;
	}
	return (this.direction.x !== 0 || this.direction.y !== 0);
};

/**
 * Stops this object from moving (resets direction vector to zero)
 * @return {void}
 */
proto.stopMoving = function horde_Object_proto_stopMoving () {
	this.direction.zero();
};

/**
 * Executes a method that may or may not exist
 * @param {string} method Method to call
 * @param {array} args Array of arguments
 * @return {void}
 */
proto.execute = function horde_Object_proto_execute (method, args) {
	if (this[method]) {
		return this[method].apply(this, args);
	}
};

/**
 * Returns the weapon info for this object's current weapon
 * @return {object} Weapon info (type & count)
 */
proto.getWeaponInfo = function horde_Object_proto_getWeaponInfo () {
	var len = this.weapons.length;
	if (len >= 1) {
		// Object has at least one weapon
		if (this.currentWeaponIndex < 0) {
			this.currentWeaponIndex = 0;
		}
		if (this.currentWeaponIndex > len - 1) {
			this.currentWeaponIndex = len - 1;
		}
		return this.weapons[this.currentWeaponIndex];
	}
	return false;
};

proto.addWeapon = function horde_Object_proto_addWeapon (type, count) {

	var remIndices = [];

	// Adjust count if player already has some of this weapon type
	// Also, store non-infite weapons for later removal
	for (var x in this.weapons) {
		var w = this.weapons[x]; // Haha, Weapon X
		if (typeof(w) !== "undefined" && w.type === type) {
			if (w.count !== null) {
				count += w.count;
			} else {
				count = null;
			}
		}
		if (w.count !== null) {
			remIndices.push(x);
		}
	}

	// Remove specified weapons
	for (var index in remIndices) {
		this.weapons = this.weapons.splice(index, 1);
	}

	var len = this.weapons.push({
		type: type,
		count: count
	});

	this.currentWeaponIndex = (len - 1);

};

proto.cycleWeapon = function horde_Object_proto_cycleWeapon (reverse) {
	var len = this.weapons.length;
	if (reverse === true) {
		this.currentWeaponIndex--;
		if (this.currentWeaponIndex < 0) {
			this.currentWeaponIndex = len - 1;
		}
	} else {
		this.currentWeaponIndex++;
		if (this.currentWeaponIndex > len - 1) {
			this.currentWeaponIndex = 0;
		}
	}
};

/**
 * "Fires" the current weapon by reducing the weapon count and returning the type
 * @return {string} Weapon type to spawn
 */
proto.fireWeapon = function horde_Object_proto_fireWeapon () {
	var len = this.weapons.length;
	if (this.cooldown === true || len < 1) {
		return false;
	}
	var currentWeapon = this.getWeaponInfo();
	if (currentWeapon.count !== null) {
		currentWeapon.count -= 1;
		if (currentWeapon.count < 1) {
			this.weapons.splice(this.currentWeaponIndex, 1);
		}
	}
	this.cooldown = true;
	return currentWeapon.type;
};

/**
 * Returns whether or not this object has a given weapon type
 * @param {string} type Weapon type
 * @return {boolean}
 */
proto.hasWeapon = function horde_Object_proto_hasWeapon (type) {
	var len = this.weapons.length;
	for (var x = 0; x < len; ++x) {
		var weapon = this.weapons[x];
		if (weapon.type === type) {
			return true;
		}
	}
	return false;
};

}());
