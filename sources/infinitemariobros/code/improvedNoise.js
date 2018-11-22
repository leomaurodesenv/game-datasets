/**
	Noise function to generate the world maps.
	Code by Rob Kleffner, 2011
*/

Mario.ImprovedNoise = function(seed) {
    this.P = [];
    this.Shuffle(seed);
};

Mario.ImprovedNoise.prototype = {
    Shuffle: function(seed) {
        var permutation = [];
        var i = 0, j = 0, tmp = 0;
        
        for (i = 0; i < 256; i++) {
            permutation[i] = i;
        }
        
        for (i = 0; i < 256; i++) {
            j = ((Math.random() * (256 - 1)) | 0) + i;
            tmp = permutation[i];
            permutation[i] = permutation[j];
            permutation[j] = tmp;
            this.P[i + 256] = this.P[i] = permutation[i];
        }
    },
    
    PerlinNoise: function(x, y) {
        var i = 0, n = 0, stepSize = 0;
        
        for (i = 0; i < 8; i++) {
            stepSize = 64 / (1 << i);
            n += this.Noise(x / stepSize, y / stepSize, 128) / (1 << i);
        }
        
        return n;
    },
    
    Noise: function(x, y, z) {
        var nx = (x | 0) & 255, ny = (y | 0) & 255, nz = (z | 0) & 255;
        x -= (x | 0);
        y -= (y | 0);
        z -= (z | 0);
        
        var u = this.Fade(x), v = this.Fade(y), w = this.Fade(z);
        var A = this.P[nx] + ny, AA = this.P[A] + nz, AB = this.P[A + 1] + nz,
        B = this.P[nx + 1] + ny, BA = this.P[B] + nz, BB = this.P[B + 1] + nz;
        
        return this.Lerp(w, this.Lerp(v, this.Lerp(u, this.Grad(this.P[AA], x, y, z),
            this.Grad(this.P[BA], x - 1, y, z)),
            this.Lerp(u, this.Grad(this.P[AB], x, y - 1, z),
                this.Grad(this.P[BB], x - 1, y - 1, z))),
            this.Lerp(v, this.Lerp(u, this.Grad(this.P[AA + 1], x, y, z - 1),
                this.Grad(this.P[BA + 1], x - 1, y, z - 1)),
                this.Lerp(u, this.Grad(this.P[AB + 1], x, y - 1, z - 1), this.Grad(this.P[BB + 1], x - 1, y - 1, z - 1))));
    },
    
    Fade: function(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    },
    
    Lerp: function(t, x, y) {
        return x + t * (y - x);
    },
    
    Grad: function(hash, x, y, z) {
        var h = hash & 15;
        var u = h < 8 ? x : y;
        var v = h < 4 ? y : (h === 12 || h === 14) ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
};