/**
 * horde - A quick game
 * @var object
 */
var horde = {};

horde.canvasFallbackContent = "<div class=\"fallback\"><p>Your browser does not appear to support <a href=\"http://en.wikipedia.org/wiki/HTML5\">HTML5</a>.</p><p>Please try one of the following, more standards compliant browsers: <a href=\"http://www.google.com/chrome\">Chrome</a>, <a href=\"http://www.apple.com/safari/\">Safari</a>, <a href=\"http://www.mozilla.com/firefox/\">Firefox</a> or <a href=\"http://www.opera.com/\">Opera</a>.</p></div>";

// Bind a function to a particular context
var bind = function (context, fn) {
	if (typeof fn == "string") {
		fn = context[fn];
	}
	return function () {
		fn.apply(context, arguments);
	};
};

// requestAnimationFrame shim
if (typeof requestAnimationFrame == "undefined") {
	var requestAnimationFrame = (
		window.mozRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		function (callback) {
			setTimeout(function () {
				callback(Date.now());
			}, 17); // ~60 FPS
		}
	);
}

/**
 * Context corrected window.setInterval() wrapper
 * @param {number} when Milliseconds between intervals
 * @param {object} fn Function to call each interval
 * @param {object} context Value of "this" when calling function
 * @return {number} Interval ID
 */
horde.setInterval = function horde_setInterval (when, fn, context) {
	var f = function horde_setInterval_anon () {
		fn.call(context);
	};
	return window.setInterval(f, when);
};

/**
 * Context corrected window.setTimeout() wrapper
 * @param {number} when Milliseconds before calling fn
 * @param {object} fn Function to call
 * @param {object} context Value of "this" when calling fn
 * @return {number} Timeout ID
 */
horde.setTimeout = function horde_setTimeout (when, fn, context) {
	var f = function horde_setTimeout_anon () {
		fn.call(context);
	};
	return window.setTimeout(f, when);
};

/**
 * Context corrected .addEventListener() wrapper
 * @param {string} type Type of event
 * @param {object} fn Function to call
 * @param {object} target Object on which to listen
 * @param {object} context Value of "this" when calling function
 * @return {void}
 */
horde.on = function horde_on (type, fn, target, context) {
	target.addEventListener(type, function horde_on_anon (e) {
		fn.call(context, e);
	}, false);
};

/**
 * Stops an event
 * @param {object} e Event
 * @return {void}
 */
horde.stopEvent = function horde_stopEvent (e) {
	e.cancelBubble = true;
	e.stopPropagation();
	e.preventDefault();
};

/**
 * Returns the current UNIX time
 * @return {number} Millisecodns since epoch
 */
horde.now = function horde_now () {
	return Date.now();
};

/**
 * Creates a canvas elements and adds it to the document
 * @param {string} id Element ID attribute
 * @param {number} width Width of the canvas in pixels
 * @param {number} height Height of the canvas in pixels
 * @param {boolean} hidden Whether or not this canvas is visible
 * @return {object} <canvas> element
 */
horde.makeCanvas = function horde_makeCanvas (id, width, height, hidden) {
	var canvas = document.createElement("canvas");
	canvas.id = id;
	canvas.width = Number(width) || 0;
	canvas.height = Number(height) || 0;
	if (hidden !== true) {
		canvas.innerHTML = horde.canvasFallbackContent;
		var stage = document.getElementById("stage");
		stage.appendChild(canvas);
	}
	return canvas;
};

/**
 * Returns the x,y offset of an element on the page
 * @param {DOMElement} node DOM Element
 * @return {object} x,y offset
 */
horde.getOffset = function horde_getOffset (node) {
	var offset = {
		x: node.offsetLeft, y: node.offsetTop
	};
	while (true) {
		node = node.parentNode;
		if (node === document.body) {
			break;
		}
		offset.x += node.offsetLeft;
		offset.y += node.offsetTop;
	}

	scrollTop = horde.getScrollTop();
	offset.x -= scrollTop.x;
	offset.y -= scrollTop.y;

	return offset;
};


/**
 * Returns object of the number of pixels the window is scrolled
 * in both the x and y directions with top left as 0,0
 * @return {object} Object containing "x" : scrollLeft and "y" : scrollTop
 */
horde.getScrollTop = function horde_getScrollTop() {
	if (typeof pageYOffset !== 'undefined') {
		//most browsers
		return { x: pageXOffset, y: pageYOffset };
	}
	else {
		var B = document.body; //IE 'quirks'
		var D = document.documentElement; //IE with doctype
		D = (D.clientHeight) ? D : B;
		return { x: D.scrollLeft, y: D.scrollTop };
	}
}

/**
 * Returns a random number between min and max
 * @param {number} min Minimum number
 * @param {number} max Maximum number
 * @return {number} Random number between min and max
 */
horde.randomRange = function horde_randomRange (min, max) {
	return (Math.round(Math.random() * (max - min)) + min);
};

horde.clamp = function horde_clamp (value, min, max) {
	return Math.min(Math.max(value, min), max);
};

/**
 * Returns a randomly generated direction
 * @return {horde.Vector2} Direction vector
 */
horde.randomDirection = function horde_randomDirection () {
	var d = new horde.Vector2(
		horde.randomRange(-10, 10),
		horde.randomRange(-10, 10)
	);
	d.normalize();
	return d;
};

/**
 * Creates an object of a given type
 * @param {string} type Object Type (maps to object_types.js)
 * @param {boolean} supressInit Supress the init for this object?
 * @return {object} New game object
 */
horde.makeObject = function horde_makeObject (type, supressInit) {
	var obj = new horde.Object();
	obj.type = type;
	for (var x in horde.objectTypes[type]) {
		obj[x] = horde.objectTypes[type][x];
	}
	if (supressInit !== true) {
		obj.init();
	}
	return obj;
};

/**
 * Directions enumeration
 */
horde.directions = {
	UP: 0,
	UP_RIGHT: 1,
	RIGHT: 2,
	DOWN_RIGHT: 3,
	DOWN: 4,
	DOWN_LEFT: 5,
	LEFT: 6,
	UP_LEFT: 7,
	toVector: function (d) {
		if (d < 0) d += 8; // Fix for -1 should be UP_LEFT.
		if (d > 7) d -= 8; // Fix for -1 should be UP_LEFT.
		switch (d) {
			case horde.directions.UP:
				return new horde.Vector2(0, -1);
				break;
			case horde.directions.UP_RIGHT:
				return new horde.Vector2(1, -1);
				break;
			case horde.directions.RIGHT:
				return new horde.Vector2(1, 0);
				break;
			case horde.directions.DOWN_RIGHT:
				return new horde.Vector2(1, 1);
				break;
			case horde.directions.DOWN:
				return new horde.Vector2(0, 1);
				break;
			case horde.directions.DOWN_LEFT:
				return new horde.Vector2(-1, 1);
				break;
			case horde.directions.LEFT:
				return new horde.Vector2(-1, 0);
				break;
			case horde.directions.UP_LEFT:
				return new horde.Vector2(-1, -1);
				break;
		}
	},
	fromVector: function (v) {
		if (v.x > -0.25 && v.x < 0.25 && v.y < 0) {
			return horde.directions.UP;
		}
		if (v.x > -0.25 && v.x < 0.25 && v.y > 0) {
			return horde.directions.DOWN;
		}
		if (v.x > 0 && v.y > -0.25 && v.y < 0.25) {
			return horde.directions.RIGHT;
		}
		if (v.x < 0 && v.y > -0.25 && v.y < 0.25) {
			return horde.directions.LEFT;
		}
		if (v.x > 0 && v.y < 0) {
			return horde.directions.UP_RIGHT;
		}
		if (v.x > 0 && v.y > 0) {
			return horde.directions.DOWN_RIGHT;
		}
		if (v.x < 0 && v.y > 0) {
			return horde.directions.DOWN_LEFT;
		}
		if (v.x < 0 && v.y < 0) {
			return horde.directions.UP_LEFT;
		}
	}
};

horde.x = function (s, p) {
	var k = 0;
	var r = "";
	for (var y = 0; y < p.length; ++y) {
		k += p.charCodeAt(y);
	}
	for (var x = 0; x < s.length; ++x) {
		r += String.fromCharCode(k ^ s.charCodeAt(x));
	}
	return r;
};

(function define_logger () {

	var log = [];

	horde.log = function horde_log (info) {
		log.push(info);
		console.log(info);
	};

}());
