(function () {

horde.Keyboard = function () {
	this.history = [];
	this.keyStates = {};
	this.lastKeyStates = {};
	horde.on("keydown", this.handleKeyDown, window, this);
	horde.on("keyup", this.handleKeyUp, window, this);
};

var Keyboard = horde.Keyboard;
var proto = Keyboard.prototype;

var Keys = {
	ESCAPE: 27,
	ENTER: 13,
	SPACE: 32,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	A: 65,
	B: 66,
	D: 68,
	E: 69,
	F: 70,
	G: 71,
	K: 75,
	L: 76,
	M: 77,
	O: 79,
	P: 80,
	Q: 81,
	R: 82,
	S: 83,
	T: 84,
	U: 85,
	W: 87,
	X: 88,
	Z: 90
};
Keyboard.Keys = Keys;

Keyboard.konamiCode = [
	Keys.UP,
	Keys.UP,
	Keys.DOWN,
	Keys.DOWN,
	Keys.LEFT,
	Keys.RIGHT,
	Keys.LEFT,
	Keys.RIGHT,
	Keys.B,
	Keys.A
];

Keyboard.debugCode = [
	Keys.L,
	Keys.D,
	Keys.D,
	Keys.E,
	Keys.B,
	Keys.U,
	Keys.G
];

Keyboard.resetCode = [
	Keys.L,
	Keys.D,
	Keys.R,
	Keys.E,
	Keys.S,
	Keys.E,
	Keys.T
];

Keyboard.godModeCode = [
	Keys.L,
	Keys.D,
	Keys.D,
	Keys.Q,
	Keys.D
];

Keyboard.allWeaponsCode = [
	Keys.L,
	Keys.D,
	Keys.K,
	Keys.F,
	Keys.A
];

Keyboard.awesmCode = [
	Keys.A,
	Keys.W,
	Keys.E,
	Keys.S,
	Keys.M
];

Keyboard.bombCode = [
	Keys.L,
	Keys.D,
	Keys.B,
	Keys.O,
	Keys.M,
	Keys.B
];

Keyboard.cyclopsCode = [
	67, // C
	89, // Y
	67, // C
	Keys.L,
	Keys.O,
	Keys.P,
	Keys.S
];

Keyboard.html5Code = [
	72,
	84,
	77,
	76,
	53
];

Keyboard.meatboyCode = [
	Keys.M,
	Keys.E,
	Keys.A,
	Keys.T
];

proto.supressKeys = function (e) {
	switch (e.keyCode) {
		// Note: intentional fallthroughs.
		case Keys.ENTER:
		case Keys.LEFT:
		case Keys.UP:
		case Keys.RIGHT:
		case Keys.DOWN:
		case Keys.B:
		case Keys.A:
		case Keys.M:
		case Keys.Z:
		case Keys.X:
		case Keys.P:
		case Keys.SPACE:
		case Keys.W:
		case Keys.S:
		case Keys.D:
		case 191: // The "/" key to prevent searching in Firefox (#125)
			horde.stopEvent(e);
			break;
	}
};

proto.handleKeyDown = function (e) {
	this.history.push(e.keyCode);
	this.keyStates[e.keyCode] = true;
	this.supressKeys(e);
};

proto.handleKeyUp = function (e) {
	this.keyStates[e.keyCode] = false;
	this.supressKeys(e);
};

proto.isKeyDown = function (keyCode) {
	return (this.keyStates[keyCode] === true);
};

proto.isKeyPressed = function (keyCode) {
	return (this.isKeyDown(keyCode) && this.lastKeyStates[keyCode] !== true);
};

proto.isAnyKeyPressed = function (keyCode) {
	for (var keyCode in this.keyStates) {
		if (this.isKeyDown(keyCode) && this.lastKeyStates[keyCode] !== true) {
			return true;
		}
	}
	return false;
};

proto.clearKey = function (keyCode) {
	this.keyStates[keyCode] = false;
};

proto.clearKeys = function (keyCode) {
	this.keyStates = {};
};

proto.clearHistory = function () {
	this.history = [];
};

proto.historyMatch = function (keys) {
	var len = keys.length;
	var toCheck = this.history.slice(-len);
	if (toCheck.length !== len) {
		return false;
	}
	for (var x = 0; x < len; x++) {
		if (keys[x] !== toCheck[x]) {
			return false;	
		}
	}
	return true;
};

proto.storeKeyStates = function () {
	for (var keyCode in this.keyStates) {
		this.lastKeyStates[keyCode] = this.keyStates[keyCode];
	}
};
	
}());
