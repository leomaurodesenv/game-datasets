(function define_horde_Mouse () {

horde.Mouse = function (canvas) {
	this.buttonStates = {};
	this.mouseX = 0;
	this.mouseY = 0;
	this.canvas = canvas;
	this.lastButtonStates = {};
	horde.on("mousemove", this.handleMouseMove, canvas, this);
	horde.on("mousedown", this.handleMouseDown, canvas, this);
	horde.on("mouseup", this.handleMouseUp, window, this);

	/*
	// iOS
	horde.on("touchmove", this.handleMouseMove, window, this);
	horde.on("touchstart", this.handleMouseDown, window, this);
	horde.on("touchend", this.handleMouseUp, window, this);	
	*/
};

var Mouse = horde.Mouse;
var proto = Mouse.prototype;

Mouse.Buttons = {
	LEFT: 0,
	RIGHT: 2
};

proto.handleMouseMove = function (e) {
	/*
	// iOS
	var touch = e.touches[0];
	e = {
		clientX: touch.pageX,
		clientY: touch.pageY
	};
	*/

	var offset = horde.getOffset(this.canvas);
	this.mouseX = (((e.clientX - offset.x) * 640) / this.canvas.offsetWidth);
	this.mouseY = (((e.clientY - offset.y) * 480) / this.canvas.offsetHeight);
	this.hasMoved = true;
};

proto.handleMouseDown = function (e) {
	// iOS
	/*
	this.buttonStates[Mouse.Buttons.LEFT] = true;
	or e.button = Mouse.Buttons.LEFT;
	*/
	this.buttonStates[e.button] = true;
	horde.stopEvent(e);
	if (window.focus) window.focus();
};

proto.handleMouseUp = function (e) {
	// iOS
	/*
	this.buttonStates[Mouse.Buttons.LEFT] = true;
	or e.button = Mouse.Buttons.LEFT;
	*/
	this.buttonStates[e.button] = false;
};

proto.isButtonDown = function (button) {
	return this.buttonStates[button];
};

proto.isAnyButtonDown = function () {
	for (var key in this.buttonStates) {
		if (this.buttonStates[key]) {
			return true;
		}
	}

	return false;
};

proto.clearButtons = function () {
	this.buttonStates = {};
};

proto.wasButtonClicked = function (button) {
	return (this.buttonStates[button] && !this.lastButtonStates[button]);
};

proto.storeButtonStates = function () {
	for (var key in this.buttonStates) {
		this.lastButtonStates[key] = this.buttonStates[key];
	}
};

}());
