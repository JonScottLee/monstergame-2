var game = game || {};

game.utilities = (function () {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomPercent () {
        return Math.floor(Math.random() * 100);
    }

    function getHitDetails (entity) {
        var player = $.data(window, 'player'),
            hitType = 'hit',
            DMG = parseInt(game.utilities.getRandomInt(entity.battleStats.minDMG, entity.battleStats.maxDMG));

        // Check if critical hit && possibly an eviscerate
        if (entity.type != 'monster' && Math.floor(Math.random()*100) <= entity.battleStats.crit) {
            hitType = '<span class="hit-type--crit">crits!</span> ';

            if (entity.gear.weapon.type == 'sword') hitType = '<span class="hit-type--crit">slice!</span> ';

            DMG = parseInt(game.utilities.getRandomInt(entity.battleStats.minDMG, entity.battleStats.maxDMG) * 4, 10);

            // Shake effect
            $('body').addClass('shake');
            setTimeout(function () {
                $('body').removeClass();
            }, 175);

            // 10% of time, when user does DMG == to at least half of monster's max HP, do an eviscerate
            // Or, eviscerate at 1/4 crit chance
            if ((Math.floor(Math.random()*100) <= entity.battleStats.crit / 4)) {
                hitType = '<span class="hit-type--eviscerate">eviscerate!!</span> ';
                DMG = parseInt(game.utilities.getRandomInt(entity.battleStats.minDMG, entity.battleStats.maxDMG) * 10, 10);

                // Shake effect
                $('body').addClass('shake shake-hard');
                setTimeout(function () {
                    $('body').removeClass();
                }, 300);
            }
        }

        return {
            hitType : hitType,
            DMG : DMG
        }
    }

    function progress(percent, $element, animSpeed) {
        var speed = animSpeed ? animSpeed : 50,
            progressBarWidth = percent * $element.width() / 100;

        $element.find('div').animate({ width: progressBarWidth }, speed).html(percent + "%&nbsp;");
    };

    function fastIncrement (sNum, eNum) {

    }

    return {
        getRandomInt : getRandomInt,
        getRandomPercent : getRandomPercent,
        progress : progress,
        getHitDetails : getHitDetails
    }
})();

game.fight = (function () {

    function appendMonsterInfo (player, monster) {
        var monsterInfo =
                '<div class="monster__name">A ' + monster.name + '</div>' +
                '<span id="monster-info__HP" class="badge badge-red">' + monster.currentHP + '</span>';

        $('.fight-info').empty();
        $('.monster-info').empty().append(monsterInfo);
        $('.monster-info__name').text(monster.name);
        $('#monster-info__hp').show();
        $('.monster-info__hp-count').text(monster.currentHP + '/' + monster.maxHP);

        game.utilities.progress(100, $('.progress-bar--monster'), 250); 
    }

    function doplayerHit () {
        var player = $.data(window, 'player'),
            hit = game.utilities.getHitDetails($.data(window, 'player')),
            $fightInfo = $('.fight-info');

        $fightInfo.append('<div class="hit--player">' + player.name + ' ' + hit.hitType + ' ' + $.data(window, 'monster').name + ' for <b>' + hit.DMG + ' damage</b></div>');
        monster.updateHP(hit.DMG);
        $('#monster-info__HP').text(monster.currentHP);
    }

    function doMonsterHit () {
        var monster = $.data(window, 'monster'),
            player = $.data(window, 'player'),
            hit = game.utilities.getHitDetails($.data(window, 'monster')),
            $fightInfo = $('.fight-info');

        $fightInfo.append('<div class="hit--monster">' + monster.name + ' ' + 'hit' + ' ' + $.data(window, 'player').name + ' for <b>' + hit.DMG + ' damage</b></div>');
        player.updateHP(hit.DMG);
    }

    function doplayerHeal () {
        var player = $.data(window, 'player');
            healAmount = game.utilities.getRandomInt(player.maxHP * .3, player.maxHP * .5),
            $fightInfo = $('.fight-info');

        player.currentHP += healAmount;
        player.fatigue -= 10;

        // Update fatigue counter
        $('.player-info__fatigue-count').text(player.fatigue + '/100');

        if (player.currentHP > player.maxHP) player.currentHP = player.maxHP;
        game.utilities.progress((player.currentHP / player.maxHP) * 100, $('.progress-bar--player'), 600);
        game.utilities.progress(player.fatigue, $('.progress-bar--player-fatigue'));

        $fightInfo.append('<div class="heal">You heal yourself for ' + healAmount + ' </div>');

        if (typeof $.data(window, 'monster') !== 'undefined') {
            var monsterTimeout = setTimeout(function () {
                doMonsterHit();
                clearTimeout(monsterTimeout);
            }, 650);
        }

        $('.player-info__hp-count').text(player.currentHP + '/' + player.maxHP);

        if (player.fatigue < 10) {
            $('#heal').prop('disabled', true);
        }
    }

    function fightAction() {
        var player = $.data(window, 'player'),
            monster = $.data(window, 'monster'),
            EXPEarned = game.utilities.getRandomInt(parseInt(monster.maxHP * .5), 10),
            $fightInfo = $('.fight-info');

        if (player.battleStats.speed > monster.battleStats.speed) {
            
            // Double strike!
            if (game.utilities.getRandomPercent() > 95) {
                $fightInfo.append('<div class="hit-type--double-strike">You perform a double-strike!</div>')
                doplayerHit();
            }

            doplayerHit();

            if (monster.currentHP > 0 && player.currentHP > 0) {
                doMonsterHit();
            }
        } else {
            doMonsterHit();
            if (player.currentHP > 0) {
                doplayerHit();
            }
        }

        if (player.currentHP <= 0) {
            player.currentHP = 0;
            game.utilities.progress(0, $('.progress-bar--player'));

            $fightInfo.append('<h4>You died!</h4');

            // Show Resurrection Button
            $('#resurrect').fadeIn();
            $('#heal').hide();

            // Hide battle options
            $('#fight--attack, #fight--cast').hide();

        }

        if (monster.currentHP <= 0) {
            // Set monster HP gauge to 0
            monster.currentHP = 0;
            game.utilities.progress(0, $('.progress-bar--monster'));

            // Append defeated and EXP messaging
            $fightInfo
                .append('<p class="msg--monster-defeated" style="color: #2c9f42;">You killed the ' + monster.name + '!</p>')
                .append('<p>EXP earned: ' + EXPEarned);

            // Give monster the 'dead' bage
            $('.monster-info__name').append('<span class="badge badge-red badge-dead">Dead</span>');

            // Re-show monster button
            $('#fight--monster').text('Fight Another Monster').fadeIn(100);

            // Hide battle options
            $('#fight--attack, #fight--cast').hide();

            // Post-battle work
            postBattleActions({
                EXPEarned : EXPEarned,
                items : ['Sword', 'Ring']
            });

            $.removeData(window, 'monster');
        }
    }

    function postBattleActions (loot) {
        var player = $.data(this, 'player');

        // player.updateplayer(loot);
        player.updateEXP(loot.EXPEarned);
    }

    return {
        appendMonsterInfo : appendMonsterInfo,
        doplayerHeal : doplayerHeal,
        fightAction : fightAction
    }

})();

// Events
game.events = (function () {

    function player () {
        this.name = 'You';
        this.type = 'player';
        this.age = '15';
        this.level = 1;
        this.EXP = 0;
        this.EXPCap = this.level * (100 + this.level * 2);
        this.maxHP = 50;
        this.fatigue = 100;
        this.currentHP = this.maxHP;
        this.esper = {
            name : 'Bahamut',
            level : 1,
            exp : 0
        },
        this.gear = {
            weapon : {
                name : 'Copper Sword',
                type : 'sword',
                dmg : 12,
                description : 'A simple -- yet sturdy -- copper blade. Centuries of warriors have swung the sharp end at myriad foes.'
            },
            armor : {
                name : 'Chainmail',
                type : 'mail',
                def: 32,
                description : 'Chainmail description.'
            },
            boots : {
                name : 'Leather Boots',
                type : 'boots',
                def : 6,
                description : 'Boots description.'
            },
            gloves : {
                name : 'Leather Gloves',
                type : 'gloves',
                def : 3,
                critBonus : 3,
                description : 'Gloves description.'
            }
        },
        this.battleStats = {
            minDMG : 10 + this.gear.weapon.dmg,
            maxDMG : 23 + this.gear.weapon.dmg,
            crit : 30 + this.gear.gloves.critBonus,
            speed: 20
        },
        this.abilities = ['Strength', 'Speed', 'Fine Control', 'Berserker', 'Unstable'];
    };

    player.prototype = {
        updateplayer : function (loot) {
        },
        updateHP : function (monsterDMG) {
            var HPRemaining = this.currentHP -= monsterDMG,
                percentHPRemaining = parseInt((this.currentHP / this.maxHP) * 100, 10);

            percentHPRemaining < 0 ? 0 : percentHPRemaining;
            game.utilities.progress(parseInt(((this.currentHP / this.maxHP) * 100), 10) , $('.progress-bar--player'));
            $('.player-info__hp-count').text(this.currentHP + '/' + this.maxHP);
        },
        updateEXP : function (lootEXP) {
            this.EXP += lootEXP;

            if (this.EXP >= this.EXPCap) {
                this.gainLevel();
                $('#exp-gauge').find('.exp-gauge__level').text('Level: ' + this.level);

                game.utilities.progress(100, $('.progress-bar--exp'), 600);
            } else {
                game.utilities.progress(Math.round((this.EXP / this.EXPCap) * 100), $('.progress-bar--exp'), 600);
            }
        },
        gainLevel : function (int) {
            var levelUpText = $('<span color="green; font-weight: bold">Level Up!</span>').delay(5000);
            this.level += 1;
            this.currentHP = this.maxHP;
            this.EXPCap = this.level * 100;

            $('.fight-info').append('<h5>You gained a level!</h5><p>Health restored!</p>');

            // Update bar to full
            game.utilities.progress(100 , $('.progress-bar--player'), 600);
            
            // Update HP text to full
            $('.player-info__hp-count').text(player.currentHP + '/' + player.maxHP);

            // Update fatigue
            this.fatigue = 100;
            game.utilities.progress(100, $('.progress-bar--player-fatigue'));
            $('.player-info__hp-fatigue').text(player.fatigue + '/100');

            // Update EXP bar to 0
            setTimeout(function () {
                game.utilities.progress(0, $('.progress-bar--exp'), 600);
            }, 1000);
            
        }
    }

    function Monster () {
        var player = $.data(window, 'player');

        this.name = 'Green Slime';
        this.type = 'monster';
        this.level = game.utilities.getRandomInt(player.level, player.level + 2);
        this.battleStats = {
            minDMG : 6,
            maxDMG : 12,
            speed: 10
        },
        this.maxHP = game.utilities.getRandomInt(this.level * 5, this.level * 8);
        this.currentHP = this.maxHP;
        this.abilities = [];
    }

    Monster.prototype = {
        updateHP : function (playerDMG) {
            var HPRemaining = this.currentHP -= playerDMG,
                percentHPRemaining = parseInt((this.currentHP / this.maxHP) * 100, 10);

            if (HPRemaining < 0) HPRemaining = 0;

            percentHPRemaining < 0 ? 0 : percentHPRemaining;
            game.utilities.progress(parseInt(((this.currentHP / this.maxHP) * 100), 10) , $('.progress-bar--monster'));
            $('.monster-info__hp-count').text(HPRemaining+ '/' + this.maxHP);
        }
    }

    function addUIEvents () {
        $('#fight--monster').on('click', function () {
            $(this).hide();

            monster = $.data(window, 'monster', new Monster());

            game.fight.appendMonsterInfo(player, monster);
            $('#fight--attack, #fight--cast').fadeIn(100);
        });

        $('#fight--attack').on('click', function () {
            game.fight.fightAction();
        });

        $('#resurrect').on('click', function () {
            var player = $.data(window, 'player').currentHP = $.data(window, 'player');
            
            player.currentHP = player.maxHP;
            player.EXP -= parseInt(player.EXP * .3, 10);
            game.utilities.progress(100, $('.progress-bar--player'));
            game.utilities.progress((player.EXP / player.EXPCap) * 100, $('.progress-bar--exp'));

            $('#resurrect').fadeOut();
            $('#heal').show();
            $('#fight--monster').trigger('click');
        });

        $('#heal').on('click', function () {
            game.fight.doplayerHeal();
        })
    }

    function setEXP () {
        var player = $.data(window, 'player');

        $('#exp-gauge').attr('data-exp', player.EXP);
        game.utilities.progress((player.EXP / player.EXPCap) * 100, $('.progress-bar--exp'));
    }

    function createplayer () {
        player = $.data(window, 'player', new player());

        game.utilities.progress(100, $('.progress-bar--player'));
        game.utilities.progress(100, $('.progress-bar--player-fatigue'));
        $('#player-hp-current').text(player.currentHP);
        $('#player-hp-total').text(player.maxHP);
        $('.player-info__fatigue-count').text(player.fatigue + '/' + 100);

        $('#player-hp-total').fastCount(player.maxHP, 0, 1);

        setInterval(function () {
            player.fatigue += 10;

            if (player.fatigue >=  10) $('#heal').prop('disabled', false);
            if (player.fatigue > 100) player.fatigue = 100;

            game.utilities.progress(player.fatigue, $('.progress-bar--player-fatigue'), 500);
            $('.player-info__fatigue-count').text(player.fatigue + '/100');
        }, 10000);
    }

    return {
        createplayer : createplayer,
        addUIEvents : addUIEvents,
        setEXP : setEXP
    }

})();

$(document).ready(function(){
    game.events.addUIEvents();
    game.events.createplayer();
    game.events.setEXP();
});


(function( $ ) {
 
    $.fn.fastCount = function(sNum, eNum, increment) {
        var counter = setInterval(function () {
            this.text(sNum += sNum);
        }, 5);

        if (sNum >= eNum) {
            clearInterval(counter);
            this.text = eNum;
        }
    };
 
}( jQuery ));