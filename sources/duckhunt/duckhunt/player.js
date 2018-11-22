/**
 * Player
 *
 * @param id
 * @param name
 * @constructor
 */
function Player(id,name){
    this.id = id;
    this.name = name;
    this.score = 0;
    this.totalKills = 0;
    this.totalMisses = 0;
    this.shotsTaken = 0;
    this.levelStats = [];
    this.weapon = null;
}

Player.prototype.getScore = function(){
    return this._formatScore(this.score.toString());
};

Player.prototype.updateScore = function(delta){
    this.score+=delta;
    $("#scoreboard").html(this.getScore());
};

Player.prototype.setWeapon = function(weapon){
    this.weapon = weapon;
};

Player.prototype.getWeapon = function(){
    return this.weapon;
};

Player.prototype.pushLevelStats = function(stats){
    this.levelStats.push(stats);
};

Player.prototype._formatScore = function(nStr){
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
};