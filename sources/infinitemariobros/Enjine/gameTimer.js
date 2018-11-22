/**
	Represents a very basic game timer.
	Code by Rob Kleffner, 2011
*/

Enjine.GameTimer = function() {
    this.FramesPerSecond = 1000 / 30;
	this.LastTime = 0;
    this.IntervalFunc = null;
    this.UpdateObject = null;
};

Enjine.GameTimer.prototype = {
    Start: function() {
        this.LastTime = new Date().getTime();
        var self = this;
        this.IntervalFunc = setInterval(function() { self.Tick() }, this.FramesPerSecond);
    },
    
    Tick: function() {
        if (this.UpdateObject != null) {
            var newTime = new Date().getTime();
    		var delta = (newTime - this.LastTime) / 1000;
    		this.LastTime = newTime;
            
            this.UpdateObject.Update(delta);
        }
    },
    
    Stop: function() {
        clearInterval(this.IntervalFunc);
    }
};