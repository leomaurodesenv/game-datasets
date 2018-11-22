(function define_horde_Size () {

/**
 * Object for dealing with sizes
 * @param {number} width Width
 * @param {number} height Height
 * @constructor
 */
horde.Size = function horde_Size (width, height) {
	this.width = Number(width) || 0;
	this.height = Number(height) || 0;
};
	
}());
