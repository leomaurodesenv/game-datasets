/**
	Creates a specific type of sprite based on the information given.
	Code by Rob Kleffner, 2011
*/

Mario.SpriteTemplate = function(type, winged) {
    this.Type = type;
    this.Winged = winged;
    this.LastVisibleTick = -1;
    this.IsDead = false;
    this.Sprite = null;
};

Mario.SpriteTemplate.prototype = {
    Spawn: function(world, x, y, dir) {
        if (this.IsDead) {
            return;
        }
        
        if (this.Type === Mario.Enemy.Flower) {
            this.Sprite = new Mario.FlowerEnemy(world, x * 16 + 15, y * 16 + 24);
        } else {
            this.Sprite = new Mario.Enemy(world, x * 16 + 8, y * 16 + 15, dir, this.Type, this.Winged);
        }
        this.Sprite.SpriteTemplate = this;
        world.AddSprite(this.Sprite);
    }
};