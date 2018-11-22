
var WebGLUtil = {
	/**
	 * 
	 */
	createShaderProgram: function( gl, vertexShader, fragmentShader ) {
	    var program = gl.createProgram();
	
	    var vs = gl.createShader(gl.VERTEX_SHADER);
	    var fs = gl.createShader(gl.FRAGMENT_SHADER);
	
	    gl.shaderSource(vs, vertexShader);
	    gl.shaderSource(fs, fragmentShader);
	
	    gl.compileShader(vs);
	    gl.compileShader(fs);
	
	    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
	    {
			var infoLog = gl.getShaderInfoLog(vs);
			gl.deleteProgram( program );
			alert( "VS ERROR: " + infoLog );
	    }
	
	    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
		{
			var infoLog = gl.getShaderInfoLog(fs);
			gl.deleteProgram( program );
			alert( "FS ERROR: " + infoLog );
	    }
	
	    gl.attachShader(program, vs);
	    gl.attachShader(program, fs);
	
	    gl.deleteShader(vs);
	    gl.deleteShader(fs);
	
	    gl.linkProgram(program);
		
		return program;
	},
	
	loadTexture: function(gl, path, callback) {
		var texture = gl.createTexture();
		
		texture.image = new Image();
		texture.image.onload = function() {
			callback.apply( null, [texture] );
		}
		
		texture.image.src = path;
		
		return texture;
	},
	
	bindTexture: function(gl, texture) {
		gl.enable(gl.TEXTURE_2D);
	    gl.bindTexture(gl.TEXTURE_2D, texture);
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	    gl.generateMipmap(gl.TEXTURE_2D)
	    gl.bindTexture(gl.TEXTURE_2D, null);
	}
}

/**
 * 
 */
var URLUtil = {
	
	queryValue: function( key ) {
		var query = window.location.search.substring(1).split("&");
		
		for ( var i = 0; i < query.length; i++ ) {
			var entity = query[i].split("=");
			
			if ( entity[0] == key ) {
				return entity[1];
			}
		}
	}
	
};

/**
 * Defines a 2D position.
 */
function Point( x, y ) {
	this.x = x || 0; 
	this.y = y || 0;
}

Point.prototype.distanceTo = function(p) {
	var dx = p.x-this.x;
	var dy = p.y-this.y;
	return Math.sqrt(dx*dx + dy*dy);
};

Point.prototype.clonePosition = function() {
	return { x: this.x, y: this.y };
};

Point.prototype.interpolate = function( x, y, amp ) {
	this.x += ( x - this.x ) * amp;
	this.y += ( y - this.y ) * amp;
};

/**
 * Defines of a rectangular region.
 */
function Region() {
	this.left = 999999; 
	this.top = 999999; 
	this.right = 0; 
	this.bottom = 0;
}

Region.prototype.reset = function() {
	this.left = 999999; 
	this.top = 999999; 
	this.right = 0; 
	this.bottom = 0; 
};

Region.prototype.inflate = function( x, y ) {
	this.left = Math.min(this.left, x);
	this.top = Math.min(this.top, y);
	this.right = Math.max(this.right, x);
	this.bottom = Math.max(this.bottom, y);
};

Region.prototype.expand = function( x, y ) {
	this.left -= x;
	this.top -= y;
	this.right += x;
	this.bottom += y;
};

Region.prototype.contains = function( x, y ) {
	return x > this.left && x < this.right && y > this.top && y < this.bottom;
};

Region.prototype.size = function() {
	return ( ( this.right - this.left ) + ( this.bottom - this.top ) ) / 2;
};

Region.prototype.center = function() {
	return new Point( this.left + (this.right - this.left) / 2, this.top + (this.bottom - this.top) / 2 );
};

Region.prototype.toRectangle = function() {
	return { x: this.left, y: this.top, width: this.right - this.left, height: this.bottom - this.top };
};



// shim layer with setTimeout fallback from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

