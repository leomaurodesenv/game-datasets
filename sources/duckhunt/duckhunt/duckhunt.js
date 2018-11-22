/************************************************
 DUCK HUNT JS v2
 by Matt Surabian - MattSurabian.com
 MIT License
 **************************************************/

var duckhunt = {
    playfield: '#game', // jquery selector, will change to jquery object on init
    level:null, // current level object passed in via loadLevel
    curLevel:0, // current level
    curWave:0, // current wave
    duckMax: 0, // incremented and used as an id when new ducks are created
    waveEnding: false, // semaphore style flag to prevent race conditions
    liveDucks: [], // array of duck objects
    levelStats: {}, // initialized in load level
    player: null, // assigned in init
    dog: null, // assigned in init
    gameTimers: {
        waveTimer: null
    },
    sounds: {},
    gameInfoPanels: {},
    init: function(){
        this.playfield = $(this.playfield); // make jquery object from selector
        this.gameInfoPanels = {
            ammo: $('#ammo'),
            duckBoard: $('#duckBoard'),
            waves: $('#waves')
        };
        this.sounds = {
            quacking: $('#quacking'),
            win: $('#victory'),
            lose: $('#defeat')
        };
        this.player = new Player('1', 'Player 1');
        this.player.setWeapon(new Gun(weapons.rifle,this.playfield)); // assign default weapon
        this.dog = new Dog('theDog',this.playfield);

        // bind to wave events
        this.playfield.on('wave:time_up', _.bind(function(e,wave){this.endWave(wave);},this));
        this.playfield.on('wave:end',_.bind(function(e,wave){this.endWave(wave);},this));
        this.playfield.on('wave:missedDucks', _.bind(function(){
            this.flyAway();
            this.dog.laugh();
        },this));

        // bind to game events
        this.playfield.on('game:next_level',_.bind(function(){this.nextLevel();},this));
        this.playfield.on('game:defeat',_.bind(function(){this.defeat();},this));
        this.playfield.on('game:victory',_.bind(function(){this.victory();},this));

        // bind to duck events
        this.playfield.on('duck:died', _.bind(function(e,duck){
            this.killDuck(duck);
            this.player.updateScore(this.level.pointsPerDuck);
        },this));
        this.playfield.on('duck:down', _.bind(function(){
            this.dog.fetch();
        },this));

        //bind to gun events
        this.playfield.on('gun:out_of_ammo',_.bind(function(){this.outOfAmmo();},this));
        this.playfield.on('gun:fire',_.bind(function(){
            this.flashScreen();
        },this));

    },
    bindInteractions: function(){
        // bind interactions used during live play
        this.playfield.on('mousedown', _.bind(function(){
            this.fireGun();
        },this));
        this.showLevelInfo();
    },
    unbindInteractions: function(){
        // unbind interactions that should not be available during transitions and other non live play states
        this.playfield.off('mousedown');
        this.liveDucks.map(function(duck){
            duck.unbindEvents();
        });
    },
    loadLevel: function(level){
        this.clearTimers(); // wipe out current level timers
        this.unbindInteractions();
        this.hideLevelInfo();

        this.level = level;

        $('#level').html(level.title).fadeIn();
        this.curWave = 0; // reset curWave

        // initialize level stats
        this.levelStats = {
            levelID: this.level.id,
            totalDucks: this.level.ducks*this.level.waves,
            ducksKilled: 0,
            shotsFired: 0
        };

        // id's equal to zero are from the level creator,
        // progress doesn't count toward beating the game
        // avoid dog animation issues by not running dog intro
        // for custom levels

        if(level.id !== 0){
            var dogIntroDef = $.Deferred();
            this.dog.intro(dogIntroDef);
            dogIntroDef.always(_.bind(function(){
                $('#level').fadeOut();
                this.doWave();
            },this)
            );
        }else{
            this.curLevel--;
            $('#level').fadeOut();
            this.doWave();
        }
    },
    doWave: function(){
        // ensure background color is set correctly
        this.playfield.animate({
            backgroundColor: '#64b0ff'
        },900);

        this.curWave++;
        if(this.curWave > this.level.waves){
            this.hideLevelInfo();
            this.playfield.trigger('game:next_level');
            return;
        }

        this.gameInfoPanels.waves.html("WAVE "+(this.curWave)+" of "+this.level.waves);

        this.bindInteractions();
        this.player.getWeapon().setAmmo(this.level.bullets); // reload the weapon for this wave
        this.releaseDucks();
        this.sounds.quacking[0].play();

        // set wave timer
        this.gameTimers.waveTimer = setTimeout(_.bind(function(curWave){
            this.playfield.trigger('wave:time_up',this.curWave);
        },this),(this.level.time*1000));
    },
    endWave: function(wave){
        if(this.curWave == wave && !this.waveEnding){
            clearTimeout(this.gameTimers.waveTimer);

            this.waveEnding = true;

            if(this.liveDucks.length > 0){
                this.playfield.trigger('wave:missedDucks');
            }
            this.sounds.quacking[0].pause();
            this.drawDucks();

            // allow animations to complete before launching next wave
            setTimeout(_.bind(function(){
                this.waveEnding = false;
                this.unbindInteractions();
                this.doWave();
            },this),4000);
        }
    },
    hideLevelInfo: function(){
        var uiToHide = [this.gameInfoPanels.ammo,this.gameInfoPanels.waves,this.gameInfoPanels.duckBoard];

        _.each(uiToHide,function(ui){
            ui.fadeOut();
        });
    },
    showLevelInfo: function(){
        var uiToHide = [this.gameInfoPanels.ammo,this.gameInfoPanels.waves,this.gameInfoPanels.duckBoard];

        _.each(uiToHide,function(ui){
            ui.fadeIn();
        });
    },
    nextLevel : function(){
        // calculate skill level to determine whether player advances
        var skills = (this.levelStats.ducksKilled/this.levelStats.totalDucks)*100;
        if(skills < 70){
            this.playfield.trigger('game:defeat');
            return;
        }
        this.player.pushLevelStats(this.levelStats);

        this.curLevel+=1;
        if(this.curLevel === levels.length){
            this.playfield.trigger('game:victory');
        }else{
            this.gameInfoPanels.duckBoard.html('');
            this.loadLevel(levels[this.curLevel]);
        }
    },
    releaseDucks : function(){
        for(var i=0;i<this.level.ducks;i++){
            var duckClass = (i%2 === 0) ? 'duckA' : 'duckB';
            this.duckMax++;
            this.liveDucks.push(new Duck(this.duckMax.toString(),duckClass,this.level.speed,this.playfield).fly());
        }
    },
    killDuck: function(deadDuck){
        this.levelStats.ducksKilled+=1;
        this.liveDucks = _(this.liveDucks).reject(function(duck){
            return duck.id === deadDuck.id;
        });

        if(this.liveDucks.length === 0){
            this.playfield.trigger('wave:end',this.curWave);
        }

    },
    drawDucks: function(){
        var ducksScore = "";
        var missedDucks = (this.level.ducks*this.curWave) - this.levelStats.ducksKilled;
        missedDucks = ( missedDucks > 25) ? 25 : missedDucks;
		var deadDucks = (this.levelStats.ducksKilled > 25) ? 25 : this.levelStats.ducksKilled;

		for(var i=0;i<missedDucks;i++){
			ducksScore += "<img src='images/duckLive.png'/>";
		}
		for(i=0;i<deadDucks;i++){
			ducksScore += "<img src='images/duckDead.png'/>";
		}

        this.gameInfoPanels.duckBoard.html(ducksScore);
    },
    fireGun : function(){
        this.levelStats.shotsFired+=1;
        this.player.getWeapon().shoot();
    },
    outOfAmmo: function(){
        this.unbindInteractions();
        this.playfield.trigger('wave:end',this.curWave);
    },
    flyAway: function(){
        this.liveDucks.map(function(duck){
            duck.escape();
        });
        this.liveDucks = [];
    },
    victory: function(){
        this.unbindInteractions();
        this.sounds.win[0].play();
        $(".winner").css("display","block");
    },
    defeat: function(){
        this.unbindInteractions();
        this.showLevelInfo();
        this.sounds.lose[0].play();
        $(".loser").css("display","block");
    },
    retry: function(){
        $('.messages').css('display','none');
        this.loadLevel(levels[this.curLevel]);
    },
    clearTimers: function(){
        _.map(this.gameTimers,function(timer,timerName){
            clearTimeout(timer);
        });
    },
    clearField: function(){
        this.clearTimers();
        this.dog.inTheCrate();
        this.playfield.trigger('wave:missedDucks');

        $('.messages').css('display','none');
    },
    flashScreen : function(){
        $(".theFlash").css("display","block");
        setTimeout(function(){
            $('.theFlash').css("display","none");
        },70);
    }
};