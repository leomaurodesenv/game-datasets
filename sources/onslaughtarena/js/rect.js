(function define_horde_Rect () {

/**
 * Object for dealing with rectangles
 * @param {number} left Left coordinate of the rectangle
 * @param {number} top Top coordinate of the rectangle
 * @param {number} width Width of the rectangle
 * @param {number} height Height of the rectangle
 * @constructor
 */
horde.Rect = function horde_Rect (left, top, width, height) {
	this.left = Number(left) || 0;
	this.top = Number(top) || 0;
	this.width = Number(width) || 0;
	this.height = Number(height) || 0;
};

var Rect = horde.Rect;
var proto = Rect.prototype;

/**
 * Checks for intersection of two rectangles
 * @param {horde.Rect} a First rectangle
 * @param {horde.Rect} b Second rectangle
 * @return {boolean} True if a and b intersect otherwise false
 */
Rect.intersects = function horde_Rect_intersects (a, b) {
	return (
		a.left <= (b.left + b.width) && 
		b.left <= (a.left + a.width) &&
		a.top <= (b.top + b.height) &&
		b.top <= (a.top + a.height)
	);
};

/**
 * Returns the center of the rectangle as a vector
 * @return {horde.Vector2} Vector representing the center point of this rectangle
 */
proto.center = function horde_Rect_proto_center () {
	var sizev = new horde.Vector2(this.width, this.height);
	return new horde.Vector2(this.left, this.top).add(sizev.scale(0.5));
};

/**
 * Checks for intersection of this rectangle and another
 * @param {horde.Rect} rect Rectangle to check
 * @return {boolean} True if rect intersects with this rectangle otherwise false
 */
proto.intersects = function horde_Rect_proto_intersects (rect) {
	return Rect.intersects(this, rect);
};

/**
 * Reduces the size of this rect by a given amount
 * @param {number} amount Amount to reduce on each side
 * @return {void}
 */
proto.reduce = function horde_Rect_proto_reduce (amount) {
	this.left += amount;
	this.top += amount;
	this.width -= amount * 2;
	this.height -= amount * 2;
	return this;
};

}());
