// Global variable for the main game loop
var interval;

// Initialize a single static level object
var l = {
	// Currently a lot of objects and speeds don't scale well with the size of the canvas
	WIDTH: 1024,
	HEIGHT: 768,
	// Scrolling speed for the background
	SPEED: 2,
	// Number of ticks for the screen flash effect
	MAX_BOMB: 5,
	y: 0,
	bomb: 0,
	text: {
		MAX_T: 3 * 30,
		t: 0
	},
	p: 0,
	points: {
		WIDTH: 32,
		HEIGHT: 48,
		STEP: 24,
		images: []
	}
};

// Initialize a single static object for the players ship
var ship = {
	R: Math.max(l.WIDTH, l.HEIGHT) / 16 | 0,
	ACC: 1.5,
	ACC_FACTOR: .9,
	ANGLE_FACTOR: .8,
	MAX_ANGLE: 10,
	MAX_OSD: 6 * 30,
	x: l.WIDTH / 2,
	y: l.HEIGHT * 7 / 8 | 0,
	xAcc: 0,
	yAcc: 0,
	angle: 0,
	e: 100,
	timeout: 0,
	weapon: 0,
	reload: 0,
	shield: {
		MAX_T: 5 * 30,
		t: 0
	}
};

var bullets = [];
bullets.R = 8;
bullets.MAX_T = 35;

var explosions = [];

var bonus = [];
bonus.R = 16;
bonus.images = {};

var torpedos = [];
torpedos.R = 16;
// Global sprite index for the rotation of all torpedos
torpedos.frame = 0;

var enemies = [];

function toggleFullscreen()
{
	if (document['fullscreenElement'] || document['mozFullScreen'] || document['webkitIsFullScreen'])
	{
		// Opera 12.50 is first again
		if (document['exitFullscreen'])
			document['exitFullscreen']();
		else if (document['mozCancelFullScreen'])
			document['mozCancelFullScreen']();
		else if (document['webkitCancelFullScreen'])
			document['webkitCancelFullScreen']();
	}
	else
	{
		var c = document.getElementsByTagName('canvas')[0];
		if (c['requestFullscreen'])
			c['requestFullscreen']();
		else if (c['mozRequestFullScreen'])
			c['mozRequestFullScreen']();
		else if (c['webkitRequestFullScreen'])
			c['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']);
	}
	return false;
}
// Export for the Closure Compiler
window['toggleFullscreen'] = toggleFullscreen;

// Helper function to hurt the player, or not if the shield is active
function hurt(e)
{
	if (ship.shield.t)
	{
		play(2);
		return;
	}
	// Merge multiple shots in a short time like they are a single shot
	if (ship.timeout < 0)
	{
		ship.e -= e;
		if (ship.e < 0)
			ship.e = 0;
		ship.timeout = 10;
	}
	if (!ship.e && !l.paused)
	{
		// Giant explosion
		explode(ship.x, ship.y, 512);
		explode(ship.x, ship.y, 1024);
		l.paused = true;
		spawnText("GAME OVER", -1);
		// Stop the main game loop
		if (interval)
			window.clearInterval(interval);

		var text = 'I survived ' + ((l.level || 1) - 1) + ' waves and got ' + l.p + ' points in SORADES 13K:';
		// Always use my domain as canonical link
		var url = /^\w+:\/\/maettig\.com/.test(location.href)
			? location.href
			: 'http://maettig.com/code/canvas/starship-sorades-13k/';
		tweet.getElementsByTagName('A')[0].href = 'https://twitter.com/share?text=' +
			encodeURIComponent(text) + '&url=' + encodeURIComponent(url) + '&via=maettig';
		tweet.style.display = '';
		var input = tweet.getElementsByTagName('INPUT')[0];
		input.value = text + ' ' + url;
		input.onfocus = function() { this.select(); }
		input.focus();
		play(14); // Game over
	}
	else if (ship.e < 25)
		play(17); // Low energy
	play(1);
	// Remove some weapons if the player was hurt
	if (ship.weapon > 2)
		ship.weapon--;
	ship.osd = ship.MAX_OSD;
}

function fire(xAcc, yAcc)
{
	// The acceleration of the bullets changes with the acceleration of the ship
	xAcc += ship.xAcc / 2;
	yAcc += ship.yAcc / 2;
	bullets.push({
		t: bullets.MAX_T,
		x: ship.x + Math.random() * xAcc,
		y: ship.y + Math.random() * yAcc,
		xAcc: xAcc,
		yAcc: yAcc
	});
}

function explode(x, y, size)
{
	explosions.push({
		x: x,
		y: y,
		size: size ? size : Math.random() * 64,
		angle: Math.random(),
		d: Math.random() * .4 - .2,
		alpha: 1
	});
}

function spawnBonus(o, i)
{
	if (!i)
	{
		var r = Math.random();
		// A chance of 10 percent for every bonus, everything else is just money
		i = r > .9 ? '+' : (r > .8 ? 'E' : (r > .7 ? 'S' : (r > .6 ? 'B' : '10')));
	}
	// Lazy loading, this allows me to use every character I want whenever I want it
	if (!bonus.images[i])
		bonus.images[i] = render(function(c, a)
		{
			a.shadowBlur = 6;
			a.fillStyle = i.length > 1 ? '#FEB' : '#EFF';
			a.shadowColor = a.fillStyle;
			a.arc(c.width / 2, c.height / 2, c.width / 2 - a.shadowBlur, 0, Math.PI * 2);
			a.fill();
			a.fillStyle = 'rgba(0,0,0,.5)';
			a.font = 'bold ' + (c.width / 1.8 - i.length * 7 + 7 | 0) + 'px sans-serif';
			a.textAlign = 'center';
			a.textBaseline = 'middle';
			a.fillText(i, c.width / 2, c.height / 2);
		}, bonus.R * 2);
	bonus.push({
		i: i,
		x: o.x || l.WIDTH / 2,
		y: o.y || -bonus.R,
		xAcc: o.xAcc ? o.xAcc / 2 : Math.random() * l.SPEED - l.SPEED / 2,
		yAcc: (o.yAcc ? o.yAcc / 2 : 0) + l.SPEED / 2
	});
}

function spawnTorpedo(o, angle, maxAngle)
{
	var y = o.y + (o.yOffset || 0) | 0;
	// Never spawn any torpedos if the enemy is still to far away
	if (y < -l.HEIGHT / 4)
		return false
	if (maxAngle)
	{
		if (angle > Math.PI)
			angle -= Math.PI * 2;
		if (angle > maxAngle)
			angle = maxAngle;
		if (angle < -maxAngle)
			angle = -maxAngle;
	}
	// All torpedos share the same speed, no matter which enemy fires them
	var speed = 3 + l.level / 2;
	torpedos.push({
		x: o.x | 0,
		y: y,
		xAcc: angle ? Math.sin(angle) * speed : 0,
		yAcc: angle ? Math.cos(angle) * speed : speed,
		e: 0
	});
	return true;
}

// Little helper function to spawn a new enemy, calls the spawn method from the enemy object
function spawnEnemy(i, y)
{
	// Can be used to spawn a random enemy, currently unused
	if (i < 0 || i >= enemies.TYPES.length)
		i = Math.random() * enemies.TYPES.length | 0;
	var type = enemies.TYPES[i];
	if (!type.R)
		type.R = Math.max(l.WIDTH, l.HEIGHT) / 16 | 0;
	if (!type.image)
		type.image = render(type.render, type.R * 2);
	type.spawn(y);
}

function play(i)
{
	if (sfx[i] && sfx[i][sfx[i].i])
	{
		// Maybe I should have added a stop() call here, but I'm not sure about this
		sfx[i][sfx[i].i++].play(true);
		sfx[i].i %= sfx[i].length;
	}
}

// Helper function to render all the static buffered canvas image objects
function render(f, w, h, c)
{
	if (!c)
		c = document.createElement('canvas');
	c.width = w | 0;
	c.height = (h || w) | 0;
	f(c, c.getContext('2d'));
	return c;
}

// The players ship and all enemies do have a bright diamond shape in their center
function renderHeart(a, x, y)
{
	var p = ship.R / 6 | 0;
	a.beginPath();
	a.moveTo(x - p, y);
	a.lineTo(x, y + p);
	a.lineTo(x + p, y);
	a.lineTo(x, y - p);
	a.closePath();
	a.globalCompositeOperation = 'lighter';
	a.shadowColor = '#FFF';
	a.stroke();
}

// Helper function to spawn the title, "WAVE 1", "PAUSE" and "GAME OVER" text objects
function spawnText(text, t)
{
	// Always render the buffered image first
	l.text.image = render(function(c, a)
	{
		a.shadowBlur = c.height / 10 | 0;
		a.font = 'bold ' + (c.height * .9 - a.shadowBlur * 2 | 0) + 'px Consolas,monospace';
		a.textAlign = 'center';
		a.textBaseline = 'middle';

		var maxWidth = c.width - a.shadowBlur * 2;

		a.fillStyle = '#62F';
		a.shadowColor = '#FFF';
		for (var i = 2; i--; )
			a.fillText(text, c.width / 2, c.height / 2, maxWidth);

		a.fillStyle = '#FFF';
		a.shadowBlur /= 4;
		a.shadowColor = 'rgba(0,0,0,.5)';

		a.lineWidth = a.shadowBlur;
		a.lineJoin = 'round';
		a.strokeStyle = '#FFF';
		a.shadowColor = '#000';
		a.strokeText(text, c.width / 2, c.height / 2, maxWidth);

		a.globalAlpha = .2;
		a.globalCompositeOperation = 'source-atop';
		a.fillStyle = '#62F';
		// It seems I forgot to set shadowBlur = 0 here
		for (var i = 0; i < c.height; i += 3)
			a.fillRect(0, i, c.width, 1);
	}, l.WIDTH / 1.6, l.WIDTH / 8, l.text.image);
	l.text.x = (l.WIDTH - l.text.image.width) / 2 | 0;
	l.text.y = 16;
	l.text.yAcc = l.SPEED / 2;
	l.text.t = t || l.text.MAX_T;
	// The "PAUSE" and "GAME OVER" texts need to be drawn instantly
	if (t < 0)
	{
		l.text.t = 0;
		a.globalAlpha = 1;
		a.drawImage(l.text.image, l.text.x, l.text.y);
	}
}

// Render the ten numbers for the points in the upper right corner of the screen
for (var number = 10; number--; )
	l.points.images[number] = render(function(c, a)
	{
		a.shadowBlur = 6;
		a.font = 'bold ' + (c.width * 1.3 | 0) + 'px Consolas,monospace';
		a.textAlign = 'center';
		a.textBaseline = 'middle';
		a.lineWidth = 2;
		a.lineJoin = 'round';
		a.shadowColor = '#9F0';
		a.strokeText(number, c.width / 2, c.height / 2);
		a.strokeStyle = '#9F0';
		a.strokeText(number, c.width / 2, c.height / 2);
	}, l.points.WIDTH, l.points.HEIGHT);

// Render the level background
l.background = render(function(c, a)
{
	a.fillStyle = '#000';
	a.fillRect(0, 0, c.width, c.height);
	a.globalCompositeOperation = 'lighter';
	a.beginPath();
	for (var i = 6; i--; )
	{
		a.moveTo(c.width * (i + 1) / 4, -c.height);
		a.lineTo(c.width * (i - 2) / 4, c.height * 2);

		a.moveTo(-c.width, c.height * (i - 2) / 4);
		a.lineTo(c.width * 2, c.height * (i + 1) / 4);
	}
	a.lineWidth = 3;
	a.shadowBlur = a.lineWidth * 2;
	a.strokeStyle = '#111';
	a.shadowColor = '#444';
	a.stroke();
	// Mirror the image and render it on top of itself
	a.shadowBlur = 0;
	a.globalAlpha = .25;
	a.translate(c.width, 0);
	a.scale(-1, 1);
	a.drawImage(c, 0, 0);
}, 256);

// Render the graphic for the players ship
ship.image = render(function(c, a)
{
	a.beginPath();
	for (var i = 5; i--; )
	{
		a.moveTo(c.width / 2, c.height * (1 + i) / 10);
		a.lineTo(c.width * (11 + i) / 16, c.height * (15 - i) / 16);
		a.lineTo(c.width * ( 5 - i) / 16, c.height * (15 - i) / 16);
		a.closePath();
	}
	a.lineWidth = c.width / 17 | 0;
	a.shadowBlur = a.lineWidth * 2;
	a.strokeStyle = '#9F0';
	a.shadowColor = a.strokeStyle;
	a.stroke();
	a.stroke();

	// Maybe I could have used the renderHeart() function here but it's slightly different and I was to lazy
	var p = c.width / 6 | 0;
	a.beginPath();
	a.moveTo(c.width / 2 - p, c.height / 2);
	a.lineTo(c.width / 2, c.height / 2 + p);
	a.lineTo(c.width / 2 + p, c.height / 2);
	a.lineTo(c.width / 2, c.height / 2 - p);
	a.closePath();
	a.strokeStyle = '#FFF';
	a.shadowColor = a.strokeStyle;
	a.stroke();
	a.stroke();
}, ship.R, ship.R * 2);

// Render the shield graphic for the players ship
ship.shield.image = render(function(c, a)
{
	var d = 8;
	a.lineWidth = 18;
	a.shadowBlur = a.lineWidth;
	a.strokeStyle = '#000';
	a.shadowColor = '#CF0';
	a.beginPath();
	a.arc(c.width / 2, c.height / 2, c.width / 2 + a.lineWidth / 2 - d, 0, Math.PI * 2);
	a.stroke();
	// Draw a black arc to clip the outer half of the shadow
	a.lineWidth = 26 + d;
	a.shadowBlur = 0;
	a.beginPath();
	a.arc(c.width / 2, c.height / 2, c.width / 2 + a.lineWidth / 2 - d, 0, Math.PI * 2);
	a.stroke();
}, ship.R * 2);

// A bullet is a tiny diamond shape with a bright glowing shadow
bullets.image = render(function(c, a)
{
	a.beginPath();
	var p = 6;
	a.moveTo(c.width / 2, p);
	a.lineTo(c.width - p, c.height / 2);
	a.lineTo(c.width / 2, c.height - p);
	a.lineTo(p, c.height / 2);
	a.closePath();
	a.lineWidth = 3;
	a.shadowBlur = a.lineWidth * 2;
	a.strokeStyle = '#CF0';
	a.shadowColor = a.strokeStyle;
	a.stroke();
	a.stroke();
}, bullets.R * 2);

// The explosion sprite is only 16px but is painted in all sizes up to 1000px
explosions.image = render(function(c, a)
{
	a.fillStyle = '#F63'
	a.shadowBlur = 6;
	a.shadowColor = a.fillStyle;
	var p = a.shadowBlur;
	// Overlaying multiple blured rectangles make them almost disapear
	for (var i = 5; i--; )
		a.fillRect(p, p, c.width - p * 2, c.height - p * 2);
	// Draw a tiny, tiny cross in the middle
	a.lineWidth = .3;
	a.strokeStyle = '#FC6'
	p *= .8;
	a.beginPath();
	a.moveTo(p, p);
	a.lineTo(c.width - p, c.height - p);
	a.moveTo(c.width - p, p);
	a.lineTo(p, c.height - p);
	a.stroke();
}, 16);

// Buffer a sprite sheet instead of rotating the possible many, many torpedos on screen
torpedos.images = [];
var count = 8;
for (var i = count; i--; )
	torpedos.images.push(render(function(c, a)
	{
		a.translate(c.width / 2, c.height / 2);
		a.rotate(Math.PI / -2 * i / count);
		a.translate(-c.width / 2, -c.height / 2);
		a.beginPath();
		a.lineWidth = 3;
		a.shadowBlur = a.lineWidth * 2;
		a.strokeStyle = '#62F';
		a.shadowColor = a.strokeStyle;
		var p = a.shadowBlur;
		a.moveTo(c.width / 2, p);
		a.lineTo(c.width - p, c.height / 2);
		a.lineTo(c.width / 2, c.height - p);
		a.lineTo(p, c.height / 2);
		a.closePath();
		a.stroke();
		a.stroke();
	}, torpedos.R * 2));

// I wanted to use real inheritance but this is not so easy in JavaScript, unfortunately
enemies.TYPES = [
	// Enemy number 0 is the smallest
	{
		render: function(c, a)
		{
			a.lineWidth = 3;
			a.shadowBlur = a.lineWidth * 2;
			a.strokeStyle = '#62F';
			a.shadowColor = a.strokeStyle;
			a.miterLimit = 128;
			a.beginPath();
			for (var i = 5; i--; )
			{
				var x1 = c.width * (6 - i) / 11, y1 = c.height * (6 - i) / 20;
				var x2 = c.width * (11 - i) / 26, y2 = c.height * (1 + i) / 9;
				a.moveTo(c.width / 2, c.height * (12 - i) / 12 - a.shadowBlur);
				a.lineTo(c.width - x1, y1);
				a.lineTo(c.width - x2, y2);
				a.lineTo(x2, y2);
				a.lineTo(x1, y1);
				a.closePath();
			}
			a.stroke();
			a.stroke();
			renderHeart(a, c.width / 2, c.height / 2);
		},
		spawn: function(y)
		{
			for (var i = 2 + l.level; i--; )
			{
				var yStop = l.HEIGHT / 8 + Math.random() * l.HEIGHT / 4 | 0;
				enemies.push({
					image: this.image,
					x: this.R + (l.WIDTH - this.R * 2) * Math.random() | 0,
					y: y ? yStop + y : -this.R,
					yStop: yStop,
					r: this.R,
					angle: 0,
					maxAngle: Math.PI / 32,
					e: 12 + l.level,
					t: Math.random() * 120 | 0,
					shoot: this.shoot
				});
			}
		},
		shoot: function(angle)
		{
			//this.t = 120 - l.level * 10;
			this.t = 600 / (l.level + 4) | 0;
			if (this.t < 5)
				this.t = 5;
			if (spawnTorpedo(this, angle, this.maxAngle))
				play(19);
		}
	},
	// Enemy number 1 is slightly bigger than enemy number 0, but almost the same
	{
		render: function(c, a)
		{
			a.lineWidth = 3;
			a.shadowBlur = a.lineWidth * 2;
			a.strokeStyle = '#62F';
			a.shadowColor = a.strokeStyle;
			for (var i = 5; i--; )
			{
				var x1 = c.width * (5 - i) / 14 + a.shadowBlur, y1 = c.height * (16 - i) / 17;
				var x2 = c.width * (8 - i) / 22, y2 = c.height * (1 + i) / 11;
				a.moveTo(c.width / 2, c.height * (6 - i) / 12);
				a.lineTo(c.width - x1, y1);
				a.lineTo(c.width - x2, y2);
				a.lineTo(x2, y2);
				a.lineTo(x1, y1);
				a.closePath();
			}
			a.stroke();
			a.stroke();
			renderHeart(a, c.width / 2, c.height / 2);
		},
		spawn: function(y)
		{
			for (var i = 1 + l.level; i--; )
			{
				var yStop = l.HEIGHT / 8 + Math.random() * l.HEIGHT / 4 | 0;
				enemies.push({
					image: this.image,
					x: this.R + (l.WIDTH - this.R * 2) * Math.random() | 0,
					y: y ? yStop + y : -this.R,
					yStop: yStop,
					r: this.R,
					angle: 0,
					maxAngle: Math.PI / 16,
					e: 20 + l.level * 2,
					t: Math.random() * 120 | 0,
					shoot: this.shoot
				});
			}
		},
		shoot: function(angle)
		{
			//this.t = 120 - l.level * 10;
			this.t = 600 / (l.level + 4) | 0;
			if (this.t < 5)
				this.t = 5;
			// I can't use the angle calculation from the spawnTorpedo() function because of the two directions
			if (angle > Math.PI)
				angle -= Math.PI * 2;
			if (angle > this.maxAngle)
				angle = this.maxAngle;
			if (angle < -this.maxAngle)
				angle = -this.maxAngle;
			if (spawnTorpedo(this, angle + .1) ||
			    spawnTorpedo(this, angle - .1))
				play(20);
		}
	},
	// Enemy number 2 is probably the most dangerous, fires in all directions but does not aim
	{
		render: function(c, a)
		{
			a.lineWidth = 3;
			a.shadowBlur = a.lineWidth * 2;
			a.strokeStyle = '#62F';
			a.shadowColor = a.strokeStyle;
			a.miterLimit = 32;
			a.beginPath();
			for(var i = 0; i < Math.PI * 2; i += Math.PI / 4)
			{
				var d = Math.PI / 12;
				var r = c.width / 2 - a.shadowBlur;
				var x = c.width / 2 + Math.sin(i + d) * r, y = c.width / 2 + Math.cos(i + d) * r;
				if (!i)
					a.moveTo(x, y); else a.lineTo(x, y);
				d -= Math.PI / 1.45;
				a.lineTo(c.width / 2 + Math.sin(i + d) * r, c.width / 2 + Math.cos(i + d) * r);
			}
			a.closePath();
			for(var i = 0; i < Math.PI * 2; i += Math.PI / 4)
			{
				var r = c.width * .4;
				var x = c.width / 2 + Math.sin(i) * r, y = c.width / 2 + Math.cos(i) * r;
				if (!i)
					a.moveTo(x, y); else a.lineTo(x, y);
			}
			a.closePath();
			a.stroke();
			a.stroke();
			renderHeart(a, c.width / 2, c.height / 2);
		},
		spawn: function(y)
		{
			var yStep = l.HEIGHT * -1.5 / l.level | 0;
			for (var i = l.level; i--; )
			{
				enemies.push({
					image: this.image,
					x: l.WIDTH / 4 + l.WIDTH / 2 * Math.random() | 0,
					y: i * yStep + (y || -this.R),
					yStop: l.HEIGHT / 2 | 0,
					r: this.R,
					angle: 0,
					maxAngle: Math.PI * 32,
					e: 28 + l.level * 3,
					t: Math.random() * 30 | 0,
					fireDirection: Math.random() * Math.PI,
					shoot: this.shoot
				});
			}
		},
		shoot: function(angle)
		{
			// Insert a bigger pause between every 5 shots
			if (!this.tActive)
			{
				this.tActive = 5;
				// But the pause gets shorter every level
				//this.t = 60 - l.level * 4;
				this.t = 540 / (l.level + 8) | 0;
			}
			this.tActive--;
			if (this.t < 5)
				this.t = 5;
			this.fireDirection += .2;
			var result;
			for (var i = Math.PI / 8; i < Math.PI * 2; i += Math.PI)
				result = spawnTorpedo(this, this.fireDirection + i);
			if (result)
				play(18);
		}
	},
	// Enemy number 3 was the first I created, the idea was it grows bigger and bigger like in "Warning Forever"
	{
		R: Math.max(l.WIDTH, l.HEIGHT) / 8 | 0,
		render: function(c, a)
		{
			a.lineWidth = 3;
			a.shadowBlur = a.lineWidth * 2;
			a.strokeStyle = '#62F';
			a.shadowColor = a.strokeStyle;
			a.miterLimit = 32;
			a.beginPath();
			for (var i = 7; i--; )
			{
				a.moveTo(c.width / 2, c.height * i / 12 + a.shadowBlur);
				var x1 = c.width * (11 + i) / 18 - a.shadowBlur;
				var y1 = c.height * (25 - i) / 28;
				a.lineTo(x1, y1);
				var x2 = c.width * (16 - i) / 16 - a.shadowBlur;
				var y2 = c.height * (i + 4) / 28;
				a.lineTo(x2, y2);
				a.lineTo(c.width / 2, c.height * (i + 30) / 36 - a.shadowBlur);
				a.lineTo(c.width - x2, y2);
				a.lineTo(c.width - x1, y1);
				a.closePath();
			}
			a.stroke();
			a.stroke();
			renderHeart(a, c.width / 2, c.height * .8);
		},
		spawn: function(y)
		{
			var yStart = y || -this.R * 3;
			var e = 36 + l.level * 4;
			var tStart = 2 * 30;
			enemies.push({
				image: this.image,
				x: l.WIDTH / 2,
				y: yStart,
				yOffset: this.R * .6 | 0,
				yStop: this.R + 8,
				r: this.R,
				angle: 0,
				maxAngle: Math.PI / 8,
				e: e,
				t: tStart + Math.random() * 30 | 0,
				shoot: this.shoot
			});
			var size = this.R * 1.3;
			var d = size * .4;
			var x = d;
			for (var i = 1; i < l.level; i++)
			{
				var y = this.R + 16 - size + Math.sqrt(i) * 64;
				if (i % 2)
					y += this.R * (.7 / i + .3);
				enemies.push({
					image: this.image,
					x: l.WIDTH / 2 - x | 0,
					y: yStart,
					yOffset: size / 2 * .6 | 0,
					yStop: y | 0,
					r: size / 2,
					angle: 0,
					maxAngle: Math.PI / 8,
					e: e / 2 | 0,
					t: tStart + Math.random() * 30 | 0,
					shoot: this.shoot
				});
				enemies.push({
					image: this.image,
					x: l.WIDTH / 2 + x | 0,
					y: yStart,
					yOffset: size / 2 * .6 | 0,
					yStop: y | 0,
					r: size / 2,
					angle: 0,
					maxAngle: Math.PI / 8,
					e: e / 2 | 0,
					t: tStart + Math.random() * 30 | 0,
					shoot: this.shoot
				});
				x += d;
				d *= .84;
				size *= .9;
			}
		},
		shoot: function(angle)
		{
			// Always aim at the player and fire randomly, 1 shot every 3 seconds on average
			this.t = Math.random() * 6 * 30 | 0;
			if (spawnTorpedo(this, angle))
				play(12);
		}
	}
];

// This global variable will be needed again when the game ends
var tweet = document.getElementById('tweet');
tweet.style.display = 'none';

// Initialization similar to the JS1K shim
var c = document.getElementsByTagName('canvas')[0];
c.width = l.WIDTH;
c.height = l.HEIGHT;
var a = c.getContext('2d');
a.fillStyle = '#000';
a.fillRect(0, 0, c.width, c.height);
spawnText('LOADING', -1);
spawnText('SORADES 13K', 6 * 30);

// Debug only
/*
var fps = Array(10);
fps.i = 0;
fps.t = 1;
*/

// Keyboard handling, cursor keys and X is my main control scheme but several others are provided
var keys = [], keyMap = {
	27: 80, // Esc => P
	32: 88, // Space => X
	48: 88, // 0 => X
	50: 40, // 2 => Down
	52: 37, // 4 => Left
	53: 40, // 5 => Down
	54: 39, // 6 => Right
	56: 38, // 8 => Up
	65: 37, // A => Left
	67: 88, // C => X
	68: 39, // D => Right
	73: 38, // I => Up
	74: 37, // J => Left
	75: 40, // K => Down
	76: 39, // L => Right
	83: 40, // S => Down
	87: 38, // W => Up
	89: 88, // Y => X
	90: 88  // Z => X
};

document.onkeydown = function(e)
{
	var c = (e || event).keyCode;
	keys[keyMap[c] || c] = true;
	if (keys[70])
		toggleFullscreen();
	else if (keys[77])
	{
		if (ship.originalImage)
		{
			ship.image = ship.originalImage;
			ship.originalImage = null;
		}
		else
		{
			// That's all I need for my little easter egg, the code above is to be able to switch back
			var image = new Image();
			image.onload = function()
			{
				ship.originalImage = ship.image;
				ship.image = image;
			}
			image.src = 'starship-sorades.jpg';
		}
	}
	// Cheat key skips to the next level
	/*
	else if (keys[79])
	{
		l.text.t = 0;
		ship.weapon++;
		ship.shield.t = ship.shield.MAX_T * 2;
		enemies.length = 0;
	}
	*/
	// Pause is not possible if the player is not alive
	else if (keys[80] && ship.e)
	{
		l.paused = !l.paused;
		// I'm abusing the messaging system but it's unable to handle multiple messages
		if (l.paused && !l.text.t)
			spawnText('PAUSE', -1);
	}
	// Unpause with any of the fire keys
	else if (l.paused && keys[88])
		l.paused = false;
}

document.onkeyup = function(e)
{
	var c = (e || event).keyCode;
	// Remove the key code from the key pressed map
	keys[keyMap[c] || c] = false;
}

function gameloop()
{
	if (l.paused)
		return;

	if (--ship.reload <= 0 && keys[88])
	{
		// Weapon 0 and 1 fire in the same direction, but the later is a bit faster
		ship.reload = ship.weapon ? 4 : 6;
		fire(0, -16);
		if (ship.weapon > 1)
		{
			fire(-8, -8),
			fire(8, -8);
			if (ship.weapon > 2)
			{
				fire(0, 16);
				if (ship.weapon > 3)
					fire(-16, 0),
					fire(16, 0);
			}
		}
		play(ship.weapon > 2 ? 16 : ship.weapon > 0 ? 0 : 15);
	}
	ship.angle *= ship.ANGLE_FACTOR;
	if (keys[37])
	{
		// This is required for a fast turn when stuck at the edge of the screen
		if (ship.x >= l.WIDTH && ship.xAcc > 0)
			ship.xAcc = 0;
		ship.xAcc -= ship.ACC;
		ship.angle = (ship.angle + 1) * ship.ANGLE_FACTOR - 1;
	}
	if (keys[38])
	{
		if (ship.y >= l.HEIGHT && ship.yAcc > 0)
			ship.yAcc = 0;
		ship.yAcc -= ship.ACC;
	}
	if (keys[39])
	{
		if (ship.x < 0 && ship.xAcc < 0)
			ship.xAcc = 0;
		ship.xAcc += ship.ACC;
		ship.angle = (ship.angle - 1) * ship.ANGLE_FACTOR + 1;
	}
	if (keys[40])
	{
		if (ship.y < 0 && ship.yAcc < 0)
			ship.yAcc = 0;
		ship.yAcc += ship.ACC;
	}
	// Stop the players ship at all 4 edges of the screen
	if (ship.x < 0 && ship.xAcc < 0)
		ship.x = 0;
	else if (ship.x >= l.WIDTH && ship.xAcc > 0)
		ship.x = l.WIDTH - 1;
	if (ship.y < 0 && ship.yAcc < 0)
		ship.y = 0;
	else if (ship.y >= l.HEIGHT && ship.yAcc > 0)
		ship.y = l.HEIGHT - 1;
	// Accelerate the players ship
	ship.x += ship.xAcc;
	ship.y += ship.yAcc;
	// Decrease the acceleration. I don't need to clip to a maximum, this is enough.
	ship.xAcc *= ship.ACC_FACTOR;
	ship.yAcc *= ship.ACC_FACTOR;

	// Fill the screen with the background tile
	var size = l.background.width;
	for (var y = (l.y % size - size) | 0; y < l.HEIGHT; y += size)
		for (var x = 0; x < l.WIDTH; x += size)
			a.drawImage(l.background, x, y);
	l.y += l.SPEED;

	// Show the current points of the player in the top right corner of the screen
	var p = l.p, x = l.WIDTH - l.points.WIDTH - 8;
	while (p)
	{
		a.drawImage(l.points.images[p % 10], x, 4);
		p = p / 10 | 0;
		x -= l.points.STEP;
	}

	// Show the current text in the middle of the screen
	if (l.text.t)
	{
		a.globalAlpha = l.text.t < l.text.MAX_T ? l.text.t / l.text.MAX_T : 1;
		a.drawImage(l.text.image, l.text.x, l.text.y);
		a.globalAlpha = 1;
		l.text.t--;
		l.text.y += l.text.yAcc;
	}

	// Distance between a players shot and a torpedo
	var d = 12;
	for (var i = bullets.length; i--; )
	{
		// Avoid sub-pixel rendering by trimming all coordinates to whole numbers
		a.drawImage(bullets.image, bullets[i].x - bullets.R | 0, bullets[i].y - bullets.R | 0);
		bullets[i].x += bullets[i].xAcc;
		bullets[i].y += bullets[i].yAcc;
		for (var j = torpedos.length; j--; )
		{
			if (bullets[i].y < torpedos[j].y + d && bullets[i].y > torpedos[j].y - d &&
			    bullets[i].x < torpedos[j].x + d && bullets[i].x > torpedos[j].x - d)
			{
				if (--torpedos[j].e < 0)
				{
					l.p += 5;
					if (Math.random() > .75)
						spawnBonus(torpedos[j]);
					explode(torpedos[j].x, torpedos[j].y);
					torpedos[j].y = l.HEIGHT * 2;
					play(11);
				}
				//else
				//{
				//	l.p += 1;
				//	explode(bullets[i].x, bullets[i].y);
				//	play(9);
				//}
				bullets[i].t = 0;
				break;
			}
		}
		// There was a bug, the comparison "y < ship.R" was always false because ship.R is undefined
		if (--bullets[i].t < 0 || bullets[i].x < -bullets.R ||
			bullets[i].x >= l.WIDTH + bullets.R || bullets[i].y >= l.HEIGHT + bullets.R)
			bullets.splice(i, 1);
	}

	// The whole screen flashes
	if (l.bomb)
	{
		a.fillStyle = 'rgba(255,255,255,' + l.bomb-- / l.MAX_BOMB / 2 + ')';
		a.fillRect(0, 0, l.WIDTH, l.HEIGHT);
	}

	// Enable additive blending for everything below
	a.globalCompositeOperation = 'lighter';

	var d = ship.R * .8 | 0,
	    e = ship.R * .4 | 0;
	for (var i = bonus.length; i--; )
	{
		if (ship.y < bonus[i].y + d && ship.y > bonus[i].y - d &&
		    ship.x < bonus[i].x + e && ship.x > bonus[i].x - e)
		{
			l.p += 10;
			switch (bonus[i].i)
			{
				case '+':
					if (ship.weapon < 4)
					{
						ship.weapon++;
						play(5);
					}
					else play(6);
					break;
				case 'E':
					if (ship.e < 100)
					{
						ship.osd = ship.MAX_OSD;
						play(5);
					}
					else play(6);
					ship.e += 5;
					if (ship.e > 100)
						ship.e = 100;
					break;
				case 'S':
					// Multiple shields are not set but loaded, hence the addition
					ship.shield.t += ship.shield.MAX_T * ship.shield.MAX_T *
						2 / (ship.shield.t + ship.shield.MAX_T * 2) | 0;
					play(3);
					break;
				case 'B':
					for (var j = enemies.length; j--; )
					{
						enemies[j].e--;
						//explode(enemies[j].x, enemies[j].y);
					}
					// Avoid to much explosions at the same time, only for the oldest torpedos
					for (var j = Math.min(torpedos.length, 5); j--; )
						explode(torpedos[j].x, torpedos[j].y);
					// Delete all torpedos
					torpedos.length = 0;
					l.bomb = l.MAX_BOMB;
					play(13);
					break;
				default:
					play(7);
			}
			bonus[i].y = l.HEIGHT * 2;
		}
		// Avoid sub-pixel rendering by trimming all coordinates to whole numbers
		a.drawImage(bonus.images[bonus[i].i], bonus[i].x - bonus.R | 0, bonus[i].y - bonus.R | 0);
		bonus[i].x += bonus[i].xAcc;
		bonus[i].y += bonus[i].yAcc;
		if (bonus[i].y >= l.HEIGHT + bonus.R * 2 || bonus[i].x < -bonus.R ||
			bonus[i].x >= l.WIDTH + bonus.R || bonus[i].y < -bonus.R)
			bonus.splice(i, 1);
	}

	for (var j = torpedos.length; j--; )
	{
		if (ship.y < torpedos[j].y + d && ship.y > torpedos[j].y - d &&
		    ship.x < torpedos[j].x + e && ship.x > torpedos[j].x - e)
		{
			hurt(10);
			explode(torpedos[j].x, torpedos[j].y);
			torpedos[j].y = l.HEIGHT * 2;
		}

		// Avoid sub-pixel rendering by trimming all coordinates to whole numbers
		a.drawImage(torpedos.images[torpedos.frame],
			torpedos[j].x - torpedos.R | 0, torpedos[j].y - torpedos.R | 0);
		/*
		a.save()
		a.translate(torpedos[j].x, torpedos[j].y);
		a.rotate(torpedos.angle);
		a.drawImage(torpedos.image, -torpedos.R, -torpedos.R);
		a.restore();
		*/

		torpedos[j].x += torpedos[j].xAcc;
		torpedos[j].y += torpedos[j].yAcc;
		if (torpedos[j].y >= l.HEIGHT + torpedos.R || torpedos[j].x < -torpedos.R ||
			torpedos[j].x >= l.WIDTH + torpedos.R || torpedos[j].y < -l.HEIGHT)
			torpedos.splice(j, 1);
	}
	torpedos.frame++;
	torpedos.frame %= torpedos.images.length;
	ship.timeout--;

	for (var i = explosions.length; i--; )
	{
		a.save()
		a.globalAlpha = explosions[i].alpha;
		a.translate(explosions[i].x, explosions[i].y);
		a.rotate(explosions[i].angle);
		a.drawImage(explosions.image, -explosions[i].size / 2, -explosions[i].size / 2,
			explosions[i].size, explosions[i].size);
		a.restore();
		//a.lineWidth = .2;
		//a.strokeStyle = '#FFF';
		//a.strokeRect(explosions[i].x - explosions[i].size / 2, explosions[i].y - explosions[i].size / 2,
		//	explosions[i].size, explosions[i].size);
		explosions[i].size += 16;
		explosions[i].angle += explosions[i].d;
		explosions[i].alpha -= .1;
		// Never compare floating point numbers with integer numbers, always use an epsilon
		if (explosions[i].alpha < .1)
			explosions.splice(i, 1);
	}

	a.save()
	a.translate(ship.x, ship.y);
	var angle = ship.angle * ship.MAX_ANGLE;
	a.rotate(angle / 180 * Math.PI);
	a.drawImage(ship.image, -ship.R / 2 | 0, -ship.R);
	a.restore();

	if (ship.shield.t)
	{
		if (ship.shield.t > 30 || Math.random() > .5)
			a.drawImage(ship.shield.image, ship.x - ship.R + .5 | 0, ship.y - ship.R + .5 | 0);
		if (!--ship.shield.t)
			play(4);
	}

	// Test only: l.text.t=0;
	// Spawn new enemies if they are all destroyed and the text is gone
	if (!enemies.length && !l.text.t)
	{
		l.p += (l.level || 0) * 1000;
		l.level = (l.level || 0) + 1;
		//for (var i = enemies.TYPES.length; i--; ) spawnEnemy(i);
		spawnEnemy(0, -.75 * l.HEIGHT);
		spawnEnemy(1, -1.5 * l.HEIGHT);
		spawnEnemy(2, -1 * l.HEIGHT);
		spawnEnemy(3, -2.25 * l.HEIGHT);
		spawnText('WAVE ' + l.level);
		l.bomb = l.MAX_BOMB;
		play(8);
	}

	enemyLoop:
	for (var i = enemies.length; i--; )
	{
		var y = enemies[i].y + (enemies[i].yOffset || 0);
		// Calculate the angle from the enemy to the players ship, this is used to shoot at the player
		var angle = Math.atan((enemies[i].x - ship.x) / (y - ship.y));
		if (ship.y <= y)
			angle += Math.PI;

		// Calculate the rotation of the enemy graphic
		var bossAngle = (angle + Math.PI) % (Math.PI * 2) - Math.PI;
		var maxAngle = enemies[i].maxAngle || 0;
		if (bossAngle > maxAngle)
			bossAngle = maxAngle;
		else if (bossAngle < -maxAngle)
			bossAngle = -maxAngle;
		enemies[i].angle = ((enemies[i].angle * 29 - bossAngle) / 30);
		//if (enemies[i].angle > maxAngle) enemies[i].angle = maxAngle;
		//if (enemies[i].angle < -maxAngle) enemies[i].angle = -maxAngle;

		//a.drawImage(enemies[i].image, enemies[i].x - enemies[i].r | 0, enemies[i].y - enemies[i].r | 0,
		//	enemies[i].r * 2, enemies[i].r * 2);
		a.save()
		a.translate(enemies[i].x, y);
		a.rotate(enemies[i].angle);
		a.drawImage(enemies[i].image, -enemies[i].r, enemies[i].y - y - enemies[i].r,
			enemies[i].r * 2, enemies[i].r * 2);
		a.restore();

		// All enemies share the same hit box
		var d = enemies[i].r * .6;
		// Visualize the hit box for debugging purposes
		//a.lineWidth = .2;
		//a.strokeStyle = '#FFF';
		//a.strokeRect(enemies[i].x - d, enemies[i].y - d, d * 2, d * 2);
		for (var j = bullets.length; j--; )
		{
			if (bullets[j].y < enemies[i].y + d && bullets[j].y > enemies[i].y - d &&
				bullets[j].x > enemies[i].x - d && bullets[j].x < enemies[i].x + d)
			{
				l.p += 1;
				explode(bullets[j].x, bullets[j].y);
				bullets.splice(j, 1);
				// Hurt the enemy and kill it
				if (--enemies[i].e <= 0)
				{
					l.p += 100;
					spawnBonus(enemies[i]);
					explode(enemies[i].x, enemies[i].y, enemies[i].r * 2);
					explode(enemies[i].x, enemies[i].y, enemies[i].r * 3);
					enemies.splice(i, 1);
					play(10);
					continue enemyLoop;
				}
				else
					play(9);
				break;
			}
		}

		// Move the enemy down
		if (enemies[i].y < enemies[i].yStop)
			enemies[i].y += enemies[i].yAcc || 1;
		// Test only: if (enemies[i].y < 0) enemies[i].y = enemies[i].yStop;

		// Each enemy shoots every few game ticks
		if (--enemies[i].t < 0)
			enemies[i].shoot(angle);
	}

	// Disable additive blending
	a.globalCompositeOperation = 'source-over';

	// Draw the energy bar under the players ship
	if (ship.osd)
	{
		var x = ship.x - 31.5 | 0, y = ship.y + 62.5 | 0;
		var c = ship.e * 512 / 100 | 0;
		a.globalAlpha = ship.osd / ship.MAX_OSD;
		a.fillStyle = '#000';
		a.fillRect(x, y, 64, 4);
		a.fillStyle = 'rgb(' + (c > 255 ? 512 - c : 255) + ',' + (c > 255 ? 255 : c) + ',0)';
		a.fillRect(x, y, ship.e * 64 / 100 | 0, 4);
		a.lineWidth = .5;
		a.strokeStyle = '#FFF';
		a.strokeRect(x, y, 64, 4);
		a.globalAlpha = 1;
		if (ship.e >= 25)
			ship.osd--;
	}

	// Debug only
	/*
	if (!--fps.t)
	{
		fps.t = 60;
		fps[fps.i] = new Date().getTime();
		fps.v = fps.t * 1000 / (fps[fps.i] - fps[(fps.i - 1 + fps.length) % fps.length]) + .5 | 0;
		//fps.v = fps[(fps.i - 1 + fps.length) % fps.length] +' '+fps[fps.i]+' '+((fps.i - 1 + fps.length) % fps.length);
		fps.i++;
		fps.i %= fps.length;
	}
	a.fillStyle = '#FFF';
	a.font = 'bold 14px Consolas,monospace';
	a.textAlign = 'left';
	a.textBaseline = 'top';
	a.fillText(fps.v + ' FPS', 10, 10);
	a.fillText('SHIELD: ' + ((ship.shield.t / 30 * 10) | 0) / 10 + 's', 10, 20);
	*/

	// Alternative game loop technique
	//window.setTimeout(gameloop, 33);
}

// Sound effects created with as3sfxr, see http://www.superflashbros.net/as3sfxr/
var sfx = [
	// 0 = Player shoots (Schuss_004)
	'8|0,,.167,.1637,.1361,.7212,.0399,-.363,,,,,,.1314,.0517,,.0154,-.1633,1,,,.0515,,.2',
	// 1 = Player is hurt (Treffer_002)
	'4|3,.0704,.0462,.3388,.4099,.1599,,.0109,-.3247,.0006,,-.1592,.4477,.1028,.1787,,-.0157,-.3372,.1896,.1628,,.0016,-.0003,.5',
	// 2 = Player shield is hit (Treffer_001_Schutzschild)
	'4|3,.1,.3899,.1901,.2847,.0399,,.0007,.1492,,,-.9636,,,-.3893,.1636,-.0047,.7799,.1099,-.1103,.5924,.484,.1547,1',
	// 3 = Player shield activated (Schutzschild_ein)
	'1|1,,.0398,,.4198,.3891,,.4383,,,,,,,,.616,,,1,,,,,.5',
	// 4 = Player shield deactivated (Schutzschild_aus)
	'1|1,.1299,.27,.1299,.4199,.1599,,.4383,,,,-.6399,,,-.4799,.7099,,,1,,,,,.5',
	// 5 = Player get weapon upgrade (Upgrade_001)
	'1|0,.43,.1099,.67,.4499,.6999,,-.2199,-.2,.5299,.5299,-.0399,.3,,.0799,.1899,-.1194,.2327,.8815,-.2364,.43,.2099,-.5799,.5',
	// 6 = Player collect non-applicable bonus (Einsammeln_002)
	'1|0,.2,.1099,.0733,.0854,.14,,-.1891,.36,,,.9826,,,.4642,,-.1194,.2327,.8815,-.2364,.0992,.0076,.2,.5',
	// 7 = Player collect money (Einsammeln_001)
	'2|0,.09,.1099,.0733,.0854,.1099,,-.1891,.827,,,.9826,,,.4642,,-.1194,.2327,.8815,-.2364,.0992,.0076,.8314,.5',
	// 8 = Alarm (new_wave)
	'1|1,.1,1,.1901,.2847,.3199,,.0007,.1492,,,-.9636,,,-.3893,.1636,-.0047,.6646,.9653,-.1103,.5924,.484,.1547,.6',
	// 9 = Big enemy is hurt (Treffer_001)
	'8|3,.1,.3899,.1901,.2847,.0399,,.0007,.1492,,,-.9636,,,-.3893,.1636,-.0047,.6646,.9653,-.1103,.5924,.484,.1547,.4',
	// 10 = Big enemy is destroyed (Explosion_001)
	'4|3,.2,.1899,.4799,.91,.0599,,-.2199,-.2,.5299,.5299,-.0399,.3,,.0799,.1899,-.1194,.2327,.8815,-.2364,.43,.2099,-.5799,.5',
	// 11 = Small torpedo is destroyed (Explosion_003)
	'4|3,,.3626,.5543,.191,.0731,,-.3749,,,,,,,,,,,1,,,,,.4',
	// 12 = Enemy shoots (Schuss_002)
	'4|1,.071,.3474,.0506,.1485,.5799,.2,-.2184,-.1405,.1681,,-.1426,,.9603,-.0961,,.2791,-.8322,.2832,.0009,,.0088,-.0082,.3',
	// 13 = Bomb explodes (Bombe)
	'1|3,.05,.3365,.4591,.4922,.1051,,.015,,,,-.6646,.7394,,,,,,1,,,,,.7',
	// 14 = Player died (Gameover_001)
	'1|1,1,.09,.5,.4111,.506,.0942,.1499,.0199,.8799,.1099,-.68,.0268,.1652,.62,.6999,-.0399,.4799,.5199,-.0429,.0599,.8199,-.4199,.7',
	// 15 = Player shoots with the smallest weapon (Spielerschuss_001)
	'8|2,,.1199,.15,.1361,.5,.0399,-.363,-.4799,,,,,.1314,.0517,,.0154,-.1633,1,,,.0515,,.2',
	// 16 = Player shoots with one of the more powerful weapons (Spielerschuss_002)
	'8|2,,.98,.4699,.07,.7799,.0399,-.28,-.4799,.2399,.1,,.36,.1314,.0517,,.0154,-.1633,1,,.37,.0399,.54,.1',
	// 17 = Players energy is below 25 % (Wenig_Energie)
	'1|0,.9705,.0514,.5364,.5273,.4816,.0849,.1422,.205,.7714,.1581,-.7685,.0822,.2147,.6062,.7448,-.0917,.4009,.6251,.1116,.0573,.9005,-.3763,.3',
	// 18 = The round enemy 3 shoots (Gegnerschuss_002)
	'4|0,.0399,.1362,.0331,.2597,.85,.0137,-.3976,,,,,,.2099,-.72,,,,1,,,,,.3',
	// 19 = The smallest enemy 1 shoots (Gegnerschuss_007)
	'4|0,,.2863,,.3048,.751,.2,-.316,,,,,,.4416,.1008,,,,1,,,.2962,,.3',
	// 20 = The medium enemy 2 shoots (Gegnerschuss_004)
	'4|0,,.3138,,.0117,.7877,.1583,-.3391,-.04,,.0464,.0585,,.4085,-.4195,,-.024,-.0396,1,-.0437,.0124,.02,.0216,.3',
	// 21 = Intro
	'1|0,1,.8799,.3499,.17,.61,.1899,-.3,-.18,.3,.6399,-.0279,.0071,.8,-.1599,.5099,-.46,.5199,.25,.0218,.49,.4,-.2,.3'
];

// This is required to make the "LOADING" message show up on the screen in slower web browsers
window.setTimeout(function()
{
	for (var i = sfx.length; i--; )
	{
		var params = sfx[i].split('|', 2);
		sfx[i] = [];
		sfx[i].i = 0;
		if (typeof Audio === 'function')
			try
			{
				// Export for the Closure Compiler
				var url = jsfxr(params[1]);
				//sfx[0].push(new Audio('shot.ogg'));
				for (; params[0]--; )
					sfx[i].push(new Audio(url));
			}
			catch (e)
			{
				// This happens in Internet Explorer 9, but I can live with that
				//alert(e);
			}
	}
	interval = window.setInterval(gameloop, 33);
	// Alternative game loop technique
	//gameloop();
	play(21);
}, 0);