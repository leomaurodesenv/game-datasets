/**
	Simple demo of the engine.
	Code by Rob Kleffner, 2011
*/

Enjine.Application = function() {
    this.canvas = null;
    this.timer = null;
    this.stateContext = null;
};

Enjine.Application.prototype = {
    Update: function(delta) {
        
        this.stateContext.Update(delta);
        
        this.canvas.BeginDraw();
        
        this.stateContext.Draw(this.canvas.BackBufferContext2D);
        
        this.canvas.EndDraw();
    },
    
    Initialize: function(defaultState, resWidth, resHeight) {
        this.canvas = new Enjine.GameCanvas();
        this.timer = new Enjine.GameTimer();
        Enjine.KeyboardInput.Initialize();      
        this.canvas.Initialize("canvas", resWidth, resHeight);
        this.timer.UpdateObject = this;
        
        this.stateContext = new Enjine.GameStateContext(defaultState);
        
        this.timer.Start();
    }
};