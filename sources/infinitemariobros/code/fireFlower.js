/**
	Represents a fire powerup.
	Code by Rob Kleffner, 2011
*/

Mario.FireFlower = function(world, x, y) {
	this.Width = 4;
	this.Height = 24;
	
	this.World = world;
	this.X = x;
	this.Y = y;
	this.Image = Enjine.Resources.Images["items"];
	
	this.XPicO = 8;
	this.YPicO = 15;
	this.XPic = 1;
	this.YPic = 0;
	this.Height = 12;
	this.Facing = 1;
	this.PicWidth = this.PicHeight = 16;
	
	this.Life = 0;
};

Mario.FireFlower.prototype = new Mario.NotchSprite();

Mario.FireFlower.prototype.CollideCheck = function() {
	var xMarioD = Mario.MarioCharacter.X - this.X, yMarioD = Mario.MarioCharacter.Y - this.Y;
	if (xMarioD > -16 && xMarioD < 16) {
		if (yMarioD > -this.Height && yMarioD < Mario.MarioCharacter.Height) {
			Mario.MarioCharacter.GetFlower();
			this.World.RemoveSprite(this);
		}
	}
};

Mario.FireFlower.prototype.Move = function() {
	if (this.Life < 9) {
		this.Layer = 0;
		this.Y--;
		this.Life++;
		return;
	}
};