/**
	Represents a simple little coin animation when popping out of the box.
	Code by Rob Kleffner, 2011
*/

Mario.CoinAnim = function(world, x, y) {
    this.World = world;
    this.Life = 10;
    this.Image = Enjine.Resources.Images["map"];
    this.PicWidth = this.PicHeight = 16;
    this.X = x * 16;
    this.Y = y * 16 - 16;
    this.Xa = 0;
    this.Ya = -6;
    this.XPic = 0;
    this.YPic = 2;
};

Mario.CoinAnim.prototype = new Mario.NotchSprite();

Mario.CoinAnim.prototype.Move = function() {
    var x = 0, y = 0;
    if (this.Life-- < 0) {
        this.World.RemoveSprite(this);
        for (x = 0; x < 2; x++) {
            for (y = 0; y < 2; y++) {
                this.World.AddSprite(new Mario.Sparkle(this.World, (this.X + x * 8 + Math.random() * 8) | 0, (this.Y + y * 8 + Math.random() * 8) | 0, 0, 0, 0, 2, 5));
            }
        }
    }
    
    this.XPic = this.Life & 3;
    this.X += this.Xa;
    this.Y += this.Ya;
    this.Ya += 1;
};