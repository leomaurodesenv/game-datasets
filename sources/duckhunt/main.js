$(function() {

    $(document).on("click",'.mute',function(){
        $(".sounds").each(function(index,audio){
             audio.volume=0;
        })

        $('.mute').addClass('unmute').removeClass('mute').html('unmute');
    });

    $(document).on('click','.unmute',function(){
        $(".sounds").each(function(index,audio){
            audio.volume=1;
        })

        $('.unmute').addClass('mute').removeClass('unmute').html('mute');
    });

    $(document).on('click','.tryAgain',function(){
       duckhunt.retry();
    });

    $(document).on('click','.doit',function(){
        var LCwaves = parseInt($("#LCwaves").val());
        var LCducks = parseInt($("#LCducks").val());
        var LCbullets = parseInt($("#LCbullets").val());
        var LCwavetime = parseInt($("#LCwavetime").val());
        var LCdif = parseInt($("#LCdif").val());

        duckhunt.clearField();

        duckhunt.loadLevel({
            id: 0,
            title: 'Custom Level',
            waves: LCwaves,
            ducks: LCducks,
            pointsPerDuck: 100,
            speed: LCdif,
            bullets: LCbullets,
            time: LCwavetime
        })
    });

    $(document).ready(function(){
        //mute the sounds for debuging
        //$('.mute').trigger('click');
        duckhunt.init();
        duckhunt.loadLevel(levels[0]);
    });

});

function addCommas(nStr)
{
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

