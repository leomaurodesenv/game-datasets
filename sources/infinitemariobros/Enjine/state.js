/**
	Simple State pattern implementation for game states.
	Code by Rob Kleffner, 2011
*/

Enjine.GameStateContext = function(defaultState) {
    this.State = null;
    
    if (defaultState != null) {
        this.State = defaultState;
        this.State.Enter();
    }
};

Enjine.GameStateContext.prototype = {
    ChangeState: function(newState) {
        if (this.State != null) {
            this.State.Exit();
        }
        this.State = newState;
        this.State.Enter();
    },
    
    Update: function(delta) {
        this.State.CheckForChange(this);
        this.State.Update(delta);
    },
    
    Draw: function(delta) {
        this.State.Draw(delta);
    }
};

/**
 * Base game state class to at least ensure that all the functions exist.
 */ 
Enjine.GameState = function() { }

Enjine.GameState.prototype = {
    Enter: function () {},
    Exit: function() {},
    Update: function(delta) {},
    Draw: function(context) {},
    CheckForChange: function(context) {}
};