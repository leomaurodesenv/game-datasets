/**
	Represents a simple static sprite.
	Code by Rob Kleffner, 2011
*/

Enjine.Resources = {
    Images: {},
    Sounds: {},

    Destroy: function() {
        delete this.Images;
        delete this.Sounds;
        return this;
    },
    
    //***********************/
    //Images
    AddImage: function(name, src) {
        var tempImage = new Image();
		this.Images[name] = tempImage;
        tempImage.src = src;
        return this;
	},
	
	AddImages: function(array) {
		for (var i = 0; i < array.length; i++) {
            var tempImage = new Image();
            this.Images[array[i].name] = tempImage;
            tempImage.src = array[i].src;
        }
        return this;
	},
	
	ClearImages: function() {
		delete this.Images;
        this.Images = new Object();
        return this;
	},
	
	RemoveImage: function(name) {
		delete this.Images[name];
		return this;
	},
    
    //***********************/
    //Sounds
    AddSound: function(name, src, maxChannels) {
        this.Sounds[name] = [];
        this.Sounds[name].index = 0;
        if (!maxChannels) {
        	maxChannels = 3;
        }
        for (var i = 0; i < maxChannels; i++) {
        	this.Sounds[name][i] = new Audio(src);	
        }
        return this;
    },
    
    ClearSounds: function() {
        delete this.Sounds;
        this.Sounds = {};
        return this;
    },
    
    RemoveSound: function(name) {
        delete this.Sounds[name];
        return this;
    },
    
    PlaySound: function(name, loop) {
    	if (this.Sounds[name].index >= this.Sounds[name].length) {
    		this.Sounds[name].index = 0;	
    	}
    	if (loop) {
    		this.Sounds[name][this.Sounds[name].index].addEventListener("ended", this.LoopCallback, false);
    	}
    	this.Sounds[name][this.Sounds[name].index++].play();
    	return this.Sounds[name].index;
    },
    
    PauseChannel: function(name, index) {
    	if (!this.Sounds[name][index].paused) {
    		this.Sounds[name][index].pause();
    	}
    	return this;
    },
    
    PauseSound: function(name) {
    	for (var i = 0; i < this.Sounds[name].length; i++) {
    		if (!this.Sounds[name][i].paused) {
    			this.Sounds[name][i].pause();
    		}
    	}
    	return this;
    },
    
    ResetChannel: function(name, index) {
    	this.Sounds[name][index].currentTime = 0;
    	this.StopLoop(name, index);
    	return this;
    },
    
    ResetSound: function(name) {
    	for (var i = 0; i < this.Sounds[name].length; i++) {
    		this.Sounds[name].currentTime = 0;
    		this.StopLoop(name, i);
    	}
    	return this;
    },
    
    StopLoop: function(name, index) {
    	this.Sounds[name][index].removeEventListener("ended", this.LoopCallback, false);	
    },
    
    LoopCallback: function() {
    	this.currentTime = -1;
    	this.play();
    }
};