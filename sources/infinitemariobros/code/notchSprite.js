/**
	Notch made his own sprite class for this game. Rather than hack around my own,
    I directly ported his to JavaScript and used that where needed.
	Code by Rob Kleffner, 2011
*/

Mario.NotchSprite = function(image) {
    this.XOld = 0; this.YOld = 0;
    this.X = 0; this.Y = 0;
    this.Xa = 0; this.Ya = 0;
    this.XPic = 0; this.YPic = 0;
    this.XPicO = 0; this.YPicO = 0;
    this.PicWidth = 32; this.PicHeight = 32;
    this.XFlip = false; this.YFlip = false;
    this.Visible = true;
    this.Image = image;
    this.Delta = 0;
    this.SpriteTemplate = null;
    this.Layer = 1;
};

Mario.NotchSprite.prototype = new Enjine.Drawable();

Mario.NotchSprite.prototype.Draw = function(context, camera) {
    var xPixel = 0, yPixel = 0;
    if (!this.Visible) {
        return;
    }
    
    xPixel = ((this.XOld + (this.X - this.XOld) * this.Delta) | 0) - this.XPicO;
    yPixel = ((this.YOld + (this.Y - this.YOld) * this.Delta) | 0) - this.YPicO;
    
    context.save();
    context.scale(this.XFlip ? -1 : 1, this.YFlip ? -1 : 1);
    context.translate(this.XFlip ? -320 : 0, this.YFlip ? -240 : 0);
    context.drawImage(this.Image, this.XPic * this.PicWidth, this.YPic * this.PicHeight, this.PicWidth, this.PicHeight,
        this.XFlip ? (320 - xPixel - this.PicWidth) : xPixel, this.YFlip ? (240 - yPixel - this.PicHeight) : yPixel, this.PicWidth, this.PicHeight);
    context.restore();
};

Mario.NotchSprite.prototype.Update = function(delta) {
    this.XOld = this.X;
    this.YOld = this.Y;
    this.Move();
    this.Delta = delta;
};

Mario.NotchSprite.prototype.UpdateNoMove = function(delta) {
    this.XOld = this.X;
    this.YOld = this.Y;
    this.Delta = 0;
};

Mario.NotchSprite.prototype.Move = function() {
    this.X += this.Xa;
    this.Y += this.Ya;
};

Mario.NotchSprite.prototype.GetX = function(delta) {
    return ((this.XOld + (this.X - this.XOld) * delta) | 0) - this.XPicO;
};

Mario.NotchSprite.prototype.GetY = function(delta) {
    return ((this.YOld + (this.Y - this.YOld) * delta) | 0) - this.YPicO;
};

Mario.NotchSprite.prototype.CollideCheck = function() { };

Mario.NotchSprite.prototype.BumpCheck = function(xTile, yTile) { };

Mario.NotchSprite.prototype.Release = function(mario) { };

Mario.NotchSprite.prototype.ShellCollideCheck = function(shell) {
    return false;
};

Mario.NotchSprite.prototype.FireballCollideCheck = function(fireball) {
    return false;
};