(function define_horde_Timer () {

/**
 * General purpose timer
 * @constructor
 */
horde.Timer = function horde_Timer () {
	this.elapsed_ms = 0;
	this.ttl = 0;
};

var Timer = horde.Timer;
var proto = Timer.prototype;

/**
 * Returns the current time
 * @return {number} Milliseconds since epoch
 */
Timer.now = function horde_Timer_now () {
	return Date.now();
};

/**
 * Starts the timer
 * @param {number} ttl Time to live
 * @return {void}
 */
proto.start = function horde_Timer_proto_start (ttl) {
	if (ttl) {
		this.ttl = Number(ttl);
	}
	this.elapsed_ms = 0;
};

/**
 * Updates the elapsed time of this timer
 * @param {number} elapsed Elapsed milliseconds
 * @return {void}
 */
proto.update = function horde_Timer_proto_update (elapsed) {
	this.elapsed_ms += elapsed;
};

/**
 * Resets the timer's start time to now (same as calling start())
 * @return {void}
 */
proto.reset = function horde_Timer_proto_reset () {
	this.start();
};

/**
 * Returns the elapsed time since start (in milliseconds)
 * @return {number} Elapsed time since start (in milliseconds)
 */
proto.elapsed = function horde_Timer_proto_elapsed () {
	return this.elapsed_ms;
};

/**
 * Returns if this timer is expired or not based on it's TTL
 * @return {boolean} True if elapsed > ttl otherwise false
 */
proto.expired = function horde_Timer_proto_expired () {
	if (this.ttl > 0) {
		return this.elapsed_ms > this.ttl;
	}
	return false;
};

}());
