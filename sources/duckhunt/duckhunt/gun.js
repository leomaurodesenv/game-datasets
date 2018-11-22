function Gun(weapon, game){
    this.name = weapon.name; // name of this weapon
    this.spread = weapon.spread; // the diameter of the weapons hit area
    this.reloadTime = weapon.reloadTime; // time between shots
    this.audio1 = $(weapon.audio1); // the ID of the weapon's HTML5 audio element
    this.audio2 = $(weapon.audio2); // the ID of the weapon's other HTML audio element
    this.game = game; // game DOM object to trigger events on

    this.ammo = 0; // how much ammo the weapon has at any given time
    this.lastAudio = null; // convenience variable for concurrent sound play
    this.magazine = $("#ammo"); // DOM element to display bullets left to user
}

Gun.prototype.updateMagazine = function(){
    var bulletsText = "";
    var shotsToDraw = (this.ammo>15) ? 15 : this.ammo;  // don't draw more than 15 bullets

    for(var i=0; i<shotsToDraw; i++){
        bulletsText += '<img src="images/bullet.png" align="absmiddle"/>';
    }
    this.magazine.html("<strong>Shots: </strong>"+bulletsText);
};

Gun.prototype.shoot = function(){
    if(this.ammo > 0){
        this.ammo -= 1;
        this.sound();
        this.game.trigger('gun:fire');
        this.updateMagazine();
    }

    if(this.ammo === 0){
        this.outOfAmmo();
    }
};


Gun.prototype.sound = function(){
    if(this.lastAudio === this.audio1){
        this.audio2.get(0).play();
        this.lastAudio = this.audio2;
    }else{
        this.audio1.get(0).play();
        this.lastAudio = this.audio1;
    }
};

Gun.prototype.outOfAmmo = function(){
    this.game.trigger('gun:out_of_ammo');
};

Gun.prototype.getAmmo = function(){
    return this.ammo;
};

Gun.prototype.setAmmo = function(ammoCount){
    this.ammo = ammoCount;
    this.updateMagazine();
};

Gun.prototype.reload = function(){
    this.game.trigger('gun:reloaded');
};

Gun.prototype.getSpread = function(){
    return this.spread;
};

Gun.prototype.getReloadTime = function(){
    return this.reloadTime;
};