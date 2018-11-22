/**
	Basic bounding box collision object.
	Code by Rob Kleffner, 2011
*/

Enjine.Collideable = function(obj, width, height, collisionEvent) {
    this.Base = obj;
    this.X = obj.X;
    this.Y = obj.Y;
    this.Width = width;
    this.Height = height;
    
    if (collisionEvent != null) {
        this.CollisionEvent = collisionEvent;
    } else {
        this.CollisionEvent = function() {}
    }
};

Enjine.Collideable.prototype = {
    Update: function() {
        this.X = this.Base.X;
        this.Y = this.Base.Y;
    },
    
    CheckCollision: function(other) {
        var left1 = this.X, left2 = other.X;
        var right1 = (this.X + this.Width), right2 = (other.X + other.Width);
        var top1 = this.Y, top2 = other.Y;
        var bottom1 = (this.Y + this.Height), bottom2 = other.Y + other.Height;
        
        if (bottom1 < top2) {
            return;
        }
        if (top1 > bottom2) {
            return;
        }
        if (right1 < left2) {
            return;
        }
        if (left1 > right2) {
            return;
        }
        
        //collision, fire the events!
        this.CollisionEvent(other);
        other.CollisionEvent(this);
    }
};