(function define_horde_SpawnPoint () {

/**
 * Spawn Point object; holds a queue of objects and spawns them at various intervals
 * @param {number} left Left coordinate of the spawn location
 * @param {number} top Top coordinate of the spawn location
 * @param {number} width Width of the spawn location
 * @param {number} height Height of the spawn location
 * @constructor
 */
horde.SpawnPoint = function horde_SpawnPoint (left, top, width, height) {
	this.delay = 500; // Default delay between spawns
	this.lastSpawnElapsed = 0; // Milliseconds since last spawn
	this.location = new horde.Rect(left, top, width, height); // Spawn point location
	this.queue = []; // Queue of things to spawn
};

var proto = horde.SpawnPoint.prototype;

/**
 * Updates this spawn point
 * @param {number} elapsed Elapsed time in milliseconds since last update
 * @return {mixed} Returns an object to spawn if necessary otherwise false
 */
proto.update = function horde_SpawnPoint_proto_update (elapsed, force) {
	this.lastSpawnElapsed += elapsed;
	if (this.lastSpawnElapsed >= this.delay || force === true) {
		this.lastSpawnElapsed = 0;
		if (this.queue.length < 1) {
			return false;
		}
		var type = this.queue.shift();
		var loc = this.location
		var o = horde.makeObject(type);
		o.position.x = horde.randomRange(loc.left, loc.left + loc.width - o.size.width);
		o.position.y = horde.randomRange(loc.top, loc.top + loc.height - o.size.height);
		var d = o.direction.clone();
		d.y = 1;
		o.setDirection(d);
		return o;
	}
	return false;
};

/**
 * Adds a number of a given type of objects to this spawn point's queue
 * @param {string} type Type of object to spawn
 * @param {number} count Number of this type to add
 * @return {void}
 */
proto.queueSpawn = function horde_SpawnPoint_proto_queueSpawn (type, count) {
	count = Number(count) || 1;
	for (var i = 0; i < count; i++) {
		this.queue.push(type);
	}
};

}());
