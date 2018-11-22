/**
	Represents a shell that once belonged to a now expired koopa.
	Code by Rob Kleffner, 2011
*/

Mario.Shell = function(world, x, y, type) {
	this.World = world;
	this.X = x;
	this.Y = y;
	
	this.YPic = type;
	this.Image = Enjine.Resources.Images["enemies"];
	
	this.XPicO = 8;
	this.YPicO = 31;
	this.Width = 4;
	this.Height = 12;
	this.Facing = 0;
	this.PicWidth = 16;
	this.XPic = 4;
	this.Ya = -5;
	
	this.Dead = false;
	this.DeadTime = 0;
	this.Carried = false;
	
	this.GroundInertia = 0.89;
	this.AirInertia = 0.89;
	this.OnGround = false;
	this.Anim = 0;
};

Mario.Shell.prototype = new Mario.NotchSprite();

Mario.Shell.prototype.FireballCollideCheck = function(fireball) {
	if (this.DeadTime !== 0) {
        return false;
    }
    
    var xD = fireball.X - this.X, yD = fireball.Y - this.Y;
    if (xD > -16 && xD < 16) {
        if (yD > -this.Height && yD < fireball.Height) {
			if (this.Facing !== 0) {
				return true;
			}
			
			Enjine.Resources.PlaySound("kick");
			
			this.Xa = fireball.Facing * 2;
			this.Ya = -5;
			if (this.SpriteTemplate !== null) {
				this.SpriteTemplate.IsDead = true;
			}
			this.DeadTime = 100;
			this.YFlip = true;
			
            return true;
        }
    }
    return false;
};

Mario.Shell.prototype.CollideCheck = function() {
	if (this.Carried || this.Dead || this.DeadTime > 0) {
		return;
	}
	
	var xMarioD = Mario.MarioCharacter.X - this.X, yMarioD = Mario.MarioCharacter.Y - this.Y;
	if (xMarioD > -16 && xMarioD < 16) {
        if (yMarioD > -this.Height && yMarioD < Mario.MarioCharacter.Height) {
			if (Mario.MarioCharacter.Ya > 0 && yMarioD <= 0 && (!Mario.MarioCharacter.OnGround || !Mario.MarioCharacter.WasOnGround)) {
				Mario.MarioCharacter.Stomp(this);
				if (this.Facing !== 0) {
					this.Xa = 0;
					this.Facing = 0;
				} else {
					this.Facing = Mario.MarioCharacter.Facing;
				}
			} else {
				if (this.Facing !== 0) {
					Mario.MarioCharacter.GetHurt();
				} else {
					Mario.MarioCharacter.Kick(this);
					this.Facing = Mario.MarioCharacter.Facing;
				}
			}
		}
	}
};

Mario.Shell.prototype.Move = function() {
	var sideWaysSpeed = 11, i = 0;
	if (this.Carried) {
		this.World.CheckShellCollide(this);
		return;
	}
	
	if (this.DeadTime > 0) {
		this.DeadTime--;
		
		if (this.DeadTime === 0) {
			this.DeadTime = 1;
			for (i = 0; i < 8; i++) {
                this.World.AddSprite(new Mario.Sparkle(((this.X + Math.random() * 16 - 8) | 0) + 4, ((this.Y + Math.random() * 8) | 0) + 4, Math.random() * 2 - 1, Math.random() * -1, 0, 1, 5));
            }
			this.World.RemoveSprite(this);
		}
		
		this.X += this.Xa;
		this.Y += this.Ya;
		this.Ya *= 0.95;
		this.Ya += 1;
		return;
	}
	
	if (this.Facing !== 0) {
		this.Anim++;
	}
	
	if (this.Xa > 2) {
		this.Facing = 1;
	}
	if (this.Xa < -2) {
		this.Facing = -1;
	}
	
	this.Xa = this.Facing * sideWaysSpeed;
	
	if (this.Facing !== 0) {
		this.World.CheckShellCollide(this);
	}
	
	this.XFlip = this.Facing === -1;
	
	this.XPic = ((this.Anim / 2) | 0) % 4 + 3;
    
    if (!this.SubMove(this.Xa, 0)) {
        Enjine.Resources.PlaySound("bump");
        this.Facing = -this.Facing;
    }
    this.OnGround = false;
    this.SubMove(0, this.Ya);
    
    this.Ya *= 0.85;
    if (this.OnGround) {
        this.Xa *= this.GroundInertia;
    } else {
        this.Xa *= this.AirInertia;
    }
    
    if (!this.OnGround) {
        this.Ya += 2;
    }
};

Mario.Shell.prototype.SubMove = function(xa, ya) {
    var collide = false;
    
    while (xa > 8) {
        if (!this.SubMove(8, 0)) {
            return false;
        }
        xa -= 8;
    }
    while (xa < -8) {
        if (!this.SubMove(-8, 0)) {
            return false;
        }
        xa += 8;
    }
    while (ya > 8) {
        if (!this.SubMove(0, 8)) {
            return false;
        }
        ya -= 8;
    }
    while (ya < -8) {
        if (!this.SubMove(0, -8)) {
            return false;
        }
        ya += 8;
    }
    
    if (ya > 0) {
        if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya, xa, 0)) {
            collide = true;
        } else if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya, xa, 0)) {
            collide = true;
        } else if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya + 1, xa, ya)) {
            collide = true;
        } else if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya + 1, xa, ya)) {
            collide = true;
        }
    }
    if (ya < 0) {
        if (this.IsBlocking(this.X + xa, this.Y + ya - this.Height, xa, ya)) {
            collide = true;
        } else if (collide || this.IsBlocking(this.X + xa - this.Width, this.Y + ya - this.Height, xa, ya)) {
            collide = true;
        } else if (collide || this.IsBlocking(this.X + xa + this.Width, this.Y + ya - this.Height, xa, ya)) {
            collide = true;
        }
    }
    
    if (xa > 0) {
        if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya - this.Height, xa, ya)) {
            collide = true;
        }
        if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya - ((this.Height / 2) | 0), xa, ya)) {
            collide = true;
        }
        if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya, xa, ya)) {
            collide = true;
        }
    }
    if (xa < 0) {
        if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya - this.Height, xa, ya)) {
            collide = true;
        }
        if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya - ((this.Height / 2) | 0), xa, ya)) {
            collide = true;
        }
        if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya, xa, ya)) {
            collide = true;
        }
    }
    
    if (collide) {
        if (xa < 0) {
            this.X = (((this.X - this.Width) / 16) | 0) * 16 + this.Width;
            this.Xa = 0;
        }
        if (xa > 0) {
            this.X = (((this.X + this.Width) / 16 + 1) | 0) * 16 - this.Width - 1;
            this.Xa = 0;
        }
        if (ya < 0) {
            this.Y = (((this.Y - this.Height) / 16) | 0) * 16 + this.Height;
            this.Ya = 0;
        }
        if (ya > 0) {
            this.Y = (((this.Y - 1) / 16 + 1) | 0) * 16 - 1;
            this.OnGround = true;
        }
        
        return false;
    } else {
        this.X += xa;
        this.Y += ya;
        return true;
    }
};

Mario.Shell.prototype.IsBlocking = function(x, y, xa, ya) {
    x = (x / 16) | 0;
    y = (y / 16) | 0;
    
    if (x === ((this.X / 16) | 0) && y === ((this.Y / 16) | 0)) {
        return false;
    }
    
    var blocking = this.World.Level.IsBlocking(x, y, xa, ya);
    
    if (blocking && ya === 0 && xa !== 0) {
        this.World.Bump(x, y, true);
    }
    return blocking;
};

Mario.Shell.prototype.BumpCheck = function(x, y) {
    if (this.X + this.Width > x * 16 && this.X - this.Width < x * 16 + 16 && y === (((this.Y - 1) / 16) | 0)) {
        this.Facing = -Mario.MarioCharacter.Facing;
        this.Ya = -10;
    }
};

Mario.Shell.prototype.Die = function() {
    this.Dead = true;
    this.Carried = false;
    this.Xa = -this.Facing * 2;
    this.Ya = -5;
    this.DeadTime = 100;
};

Mario.Shell.prototype.ShellCollideCheck = function(shell) {
    if (this.DeadTime !== 0) {
        return false;
    }
    
    var xD = shell.X - this.X, yD = shell.Y - this.Y;
    if (xD > -16 && xD < 16) {
        if (yD > -this.Height && yD < shell.Height) {
            Enjine.Resources.PlaySound("kick");
            if (Mario.MarioCharacter.Carried === shell || Mario.MarioCharacter.Carried === this) {
                Mario.MarioCharacter.Carried = null;
            }
            this.Die();
            shell.Die();
            return true;
        }
    }
    return false;
};

Mario.Shell.prototype.Release = function(mario) {
    this.Carried = false;
    this.Facing = Mario.MarioCharacter.Facing;
    this.X += this.Facing * 8;
};