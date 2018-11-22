/**
	Helper to cut up the sprites.
	Code by Rob Kleffner, 2011
*/

Mario.SpriteCuts = {
    
    /*********************
     * Font related
     ********************/         
    CreateBlackFont: function() {
        return new Enjine.SpriteFont([], Enjine.Resources.Images["font"], 8, 8, this.GetCharArray(0));
    },
    
    CreateRedFont: function() {
        return new Enjine.SpriteFont([], Enjine.Resources.Images["font"], 8, 8, this.GetCharArray(8));
    },
    
    CreateGreenFont: function() {
        return new Enjine.SpriteFont([], Enjine.Resources.Images["font"], 8, 8, this.GetCharArray(16));
    },
    
    CreateBlueFont: function() {
        return new Enjine.SpriteFont([], Enjine.Resources.Images["font"], 8, 8, this.GetCharArray(24));
    },
    
    CreateYellowFont: function() {
        return new Enjine.SpriteFont([], Enjine.Resources.Images["font"], 8, 8, this.GetCharArray(32));
    },
    
    CreatePinkFont: function() {
        return new Enjine.SpriteFont([], Enjine.Resources.Images["font"], 8, 8, this.GetCharArray(40));
    },
    
    CreateCyanFont: function() {
        return new Enjine.SpriteFont([], Enjine.Resources.Images["font"], 8, 8, this.GetCharArray(48));
    },
    
    CreateWhiteFont: function() {
        return new Enjine.SpriteFont([], Enjine.Resources.Images["font"], 8, 8, this.GetCharArray(56));
    },
    
    GetCharArray: function(y) {
        var letters = [];
        var i = 0;
        for (i = 32; i < 127; i++) {
            letters[i] = { X: (i - 32) * 8, Y: y };
        }
        return letters;
    },
    
    /*********************
     * Spritesheet related
     ********************/
    GetBackgroundSheet: function() {
        var sheet = [];
        var x = 0, y = 0, width = Enjine.Resources.Images["background"].width / 32, height = Enjine.Resources.Images["background"].height / 32;
        
        for (x = 0; x < width; x++) {
            sheet[x] = [];
        
            for (y = 0; y < height; y++) {
                sheet[x][y] = { X: x * 32, Y: y * 32, Width: 32, Height: 32 };
            }
        }
        return sheet;
    },
    
    GetLevelSheet: function() {
        var sheet = [], x = 0, y = 0, width = Enjine.Resources.Images["map"].width / 16, height = Enjine.Resources.Images["map"].height / 16;
        
        for (x = 0; x < width; x++) {
            sheet[x] = [];
            
            for (y = 0; y < height; y++) {
                sheet[x][y] = { X: x * 16, Y: y * 16, Width: 16, Height: 16 };
            }
        }
        return sheet;
    }
};