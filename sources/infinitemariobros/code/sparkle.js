/**
	Represents a little sparkle object in the game.
	Code by Rob Kleffner, 2011
*/

Mario.Sparkle = function(world, x, y, xa, ya) {
    this.World = world;
    this.X = x;
    this.Y = y;
    this.Xa = xa;
    this.Ya = ya;
    this.XPic = (Math.random() * 2) | 0;
    this.YPic = 0;
    
    this.Life = 10 + ((Math.random() * 5) | 0);
    this.XPicStart = this.XPic;
    this.XPicO = 4;
    this.YPicO = 4;
    
    this.PicWidth = 8;
    this.PicHeight = 8;
    this.Image = Enjine.Resources.Images["particles"];
};

Mario.Sparkle.prototype = new Mario.NotchSprite();

Mario.Sparkle.prototype.Move = function() {
    if (this.Life > 10) {
        this.XPic = 7;
    } else {
        this.XPic = (this.XPicStart + (10 - this.Life) * 0.4) | 0;
    }
    
    if (this.Life-- < 0) {
        this.World.RemoveSprite(this);
    }
    
    this.X += this.Xa;
    this.Y += this.Ya;
};