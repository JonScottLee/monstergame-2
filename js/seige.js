game = {};

utilities = (function () {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomPercent () {
        return Math.floor(Math.random() * 100);
    }

    function getHitFlavor (weaponType) {
        var flavorText;

        if (weaponType == 'sword') {
            flavorText = 'Your energy surges, and you flash forwards with a blindingly fast strike';
        }

        return flavorText;
    }

    function getHitDetails (entity) {
        var player = $.data(window, 'player'),
            weapon = entity.gear.weapon,
            weaponType = weapon.type,
            clumsy = utilities.searchForTrait(monster, 'clumsy') === true,
            blind = utilities.searchForTrait(monster, 'blind') === true,
            poisoned = utilities.searchForTrait(monster, 'poison') === true,
            mute = utilities.searchForTrait(monster, 'mute') === true,
            paralyzed = utilities.searchForTrait(monster, 'paralyzed') === true,
            hitType = 'hit, hit',
            effect = 'normal',
            DMG = parseInt(utilities.getRandomInt(entity.stats.minDMG, entity.stats.maxDMG));

        // Check if critical hit && possibly an eviscerate
        if (entity.type != 'monster' && (clumsy || Math.floor(Math.random()*100) <= entity.stats.crit)) {
            
            // Append clumsy message
            if (clumsy) $('.fight-info').append('<span class="entity-stats--clumsy">Monster is off-balance and clumsy!</span>');

            // Determine hit type and name
            if (weaponType == 'sword') hitType = 'crit, slice';
            if (weaponType == 'spear') hitType = 'crit, impale';
            if (weaponType == 'mace' || entity.gear.weapon.type == 'hammer' ) hitType = 'crit, crush';
            if (weaponType == 'axe') hitType = 'crit, gut';

            // Get Hit damage
            DMG = parseInt(utilities.getRandomInt(entity.stats.minDMG, entity.stats.maxDMG) * 4, 10);

            // Do Shake effect on crit
            $('body').addClass('shake');
            setTimeout(function () {
                $('body').removeClass();
            }, 175);

            // 10% of time, when user does DMG == to at least half of monster's max HP, do an eviscerate
            // Or, eviscerate at 1/4 crit chance
            if ((Math.floor(Math.random()*100) <= entity.stats.crit / 4)) {
                hitType = 'eviscerate, eviscerate';
                DMG = parseInt(utilities.getRandomInt(entity.stats.minDMG, entity.stats.maxDMG) * 10, 10);

                // Shake effect
                $('body').addClass('shake shake-hard');
                setTimeout(function () {
                    $('body').removeClass();
                }, 300);
            }
        }

        if (weapon.effect === 'poison' && utilities.getRandomPercent() < weapon.effectChance && monster.ailments.indexOf('poison') === -1) {
            effect = 'poison';
        }

        return {
            hitType : hitType,
            effect : effect,
            DMG : DMG
        }
    }

    function progress(percent, $element, animSpeed) {
        var speed = animSpeed ? animSpeed : 50,
            progressBarWidth = percent * $element.width() / 100;

        $element.find('div').animate({ width: progressBarWidth }, speed).html(percent + "%&nbsp;");
    };

    function searchForTrait (entity, trait) {
        if (entity.traits.indexOf(trait) > -1) {
            return true;
        }
    }

    function searchForAilment (entity, ailment) {
        if (entity.ailments.indexOf(ailment) > -1) {
            return true;
        }
    }

    function generateMonsterName () {
        var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'black', 'white'],
            types = ['slime', 'hawk', 'dragon', 'beholder', 'griffin', 'wolf', 'hydra', 'medusa', 'boar'],
            prefix = ['mangy', 'rabid', 'swift', 'giant', 'small', 'tiny'],
            name = {};

        if (getRandomPercent() > 90) {
            name.prefix = prefix[utilities.getRandomInt(0, prefix.length - 1)];
        }

        name.color = colors[utilities.getRandomInt(0, colors.length - 1)];
        name.type = types[utilities.getRandomInt(0, types.length - 1)];

        return name;
    }

    function generateMonsterTraits () {
        var traits = ['strong', 'fast', 'control', 'berserk', 'unstable', 'wealthy', 'hoarder', 'veteran', 'commander'];

        return traits[utilities.getRandomInt(0, traits.length - 1)];
    }

    function generateRandomItems () {

    }

    return {
        getRandomInt : getRandomInt,
        getRandomPercent : getRandomPercent,
        getHitFlavor : getHitFlavor,
        progress : progress,
        getHitDetails : getHitDetails,
        searchForTrait : searchForTrait,
        searchForAilment : searchForAilment,
        generateMonsterName : generateMonsterName,
        generateMonsterTraits : generateMonsterTraits
    }
})();

game.fight = (function () {

    function appendMonsterInfo () {
        var monsterInfo = '<span id="monster-info__HP" class="badge badge-red">' + monster.currentHP + '</span>';

        $('.fight-info, .monster-info__ailments').empty();
        $('.monster-info').empty().append(monsterInfo);
        $('.monster-info__name').text(monster.name);
        $('#monster-info__hp').show();
        $('.monster-info__hp-count').text(monster.currentHP + '/' + monster.maxHP);
        $('.monster-info__name').css('display', 'inline-block');
        /*$('.monster-info__stats-toggle').add('.monster-info__name').css('display', 'inline-block');

        var stats = '<li class="stats-view__HP"><h6>HP</h6>: ' + monster.currentHP + '/' + monster.maxHP +'</li>' +
                '<li class="stats-view__damage"><h6>Damage</h6>: ' + monster.stats.minDMG + ' - ' + player.stats.maxDMG + '</li>' +
                '<li class="stats-view__weapon"><h6>Weapon</h6>: ' + monster.gear.weapon.name + '</li>' +
                '<li class="stats-view__traits"><h6>Traits</h6>: </li>';

        $('.monster-info__stats-view').empty().append(stats);

        for (i = 0; i < monster.traits.length; i++) {
            $('.monster-info__stats-view .stats-view__traits').append(monster.traits[i] + ' ');
        } */

        utilities.progress(100, $('.progress-bar--monster'), 600); 
    }

    function doPlayerTurn () {
        var hit = utilities.getHitDetails($.data(window, 'player')),
            hitType = hit.hitType.split(',')[0],
            hitName = hit.hitType.split(',')[1],
            hitFlavor = utilities.getHitFlavor(player.gear.weapon.type),
            isDoubleStrike = utilities.getRandomPercent() > 95,
            $fightInfo = $('.fight-info');

        // What type of hit?
        if (hitType == 'crit') {
            $fightInfo.append('<div class="hit--flavor">' + hitFlavor + ', dealing ' + hit.DMG + ' damage!</div>');
        } else {
            $fightInfo.append('<div class="hit--player">' + player.name + '<span class=" ' + hitType + '"> ' + hitName + ' </span>' + $.data(window, 'monster').name + ' for <b>' + hit.DMG + ' damage</b></div>');
        }
        
        // Show floating damage number next to monster name
        $('#monster-info__hp').append('<div class="monster-info__dmg-taken">-' + hit.DMG + '</div>');
        $('.monster-info__dmg-taken').addClass(hitType).slideFade(2000, 250);

        // Apply ailments
        if (hit.effect === 'poison') {
            monster.ailments.push('poison');
            $fightInfo.append(monster.name + ' is poisoned!');
        }

        // Update monster HP
        monster.updateHP(hit.DMG);
    }

    function doMonsterTurn () {
        var hit = utilities.getHitDetails($.data(window, 'monster')),
            poisoned = utilities.searchForAilment(monster, 'poison') === true,
            paralyzed = utilities.searchForAilment(monster, 'paralyzed') === true,            
            $monsterAilments = $('.monster-info__ailments'),
            $monsterName = $('.monster-info__name'),
            $fightInfo = $('.fight-info');

        // Monster is paralyzed
        if (paralyzed) {
            $monsterAilments.empty().append('<span class="entity-ailment__icon entity-ailment__icon--paralyzed">\u2607</span>');
             $fightInfo.append('<div class="entity-ailment entity-ailment--paralyzed">' + monster.name + ' is paralyzed and can\'t attack!</div>');

            return;
        }
        
        // Monster is poisoned
        if (poisoned) {
            $monsterAilments.empty().append('<span class="entity-ailment__icon entity-ailment__icon--poisoned">\u2620</span>');
            $fightInfo.append('<div class="entity-ailment entity-ailment--poison">' + monster.name + ' takes ' + Math.floor(monster.maxHP * .05) + ' damage from poison!</div>');
            
            dmgOffset = parseInt(-(utilities.getRandomInt(0, 45) + 35), 10);
            $('#monster-info__hp').append('<div class="monster-info__dmg-taken poison">-' + Math.floor(monster.maxHP * .05)+ '</div>');
            $('.monster-info__dmg-taken').css('right', dmgOffset).slideFade(1200, 80);

            monster.updateHP(Math.floor(monster.maxHP * .05));
        }

        // Shake off an ailment. This uses this turn's attack
        var shakeOffAilment = utilities.getRandomPercent() > 85;
        if (monster.ailments.length > 0 && shakeOffAilment) {
            var ailIndex = Math.floor(Math.random() * monster.ailments.length),
                ailName = monster.ailments[ailIndex];

            $fightInfo.append('<b>' + monster.name + ' shook off ' + ailName + '</b>');
            $('.entity-ailment__icon--poisoned').fadeOut('fast').fadeIn('fast').fadeOut('fast').fadeIn('fast').fadeOut('fast').fadeIn('fast').fadeOut('fast').fadeIn('fast').fadeOut(400)
            monster.ailments.splice(ailIndex, 1);

            return;
        }

        $fightInfo.append('<div class="hit--monster">' + monster.name + ' ' + 'hit' + ' ' + $.data(window, 'player').name + ' for <b>' + hit.DMG + ' damage</b></div>');
        player.updateHP(hit.DMG);
    }

    function doplayerHeal () {
        var healAmount = utilities.getRandomInt(player.maxHP * .3, player.maxHP * .5),
            $fightInfo = $('.fight-info');

        player.currentHP += healAmount;
        player.tp -= 30;

        // Update tp counter
        $('.player-info__tp-count').text(player.tp + '/100');

        if (player.currentHP > player.maxHP) player.currentHP = player.maxHP;
        utilities.progress((player.currentHP / player.maxHP) * 100, $('.progress-bar--player-hp'), 600);
        utilities.progress(player.tp, $('.progress-bar--player-hp-tp'));

        $fightInfo.append('<div class="heal">You heal yourself for ' + healAmount + ' </div>');

        if (typeof $.data(window, 'monster') !== 'undefined') {
            var monsterTimeout = setTimeout(function () {
                doMonsterTurn();
                clearTimeout(monsterTimeout);
            }, 650);
        }

        $('.player-hp--current').text(player.currentHP);
        $('.player-hp--total').text(player.maxHP);

        if (player.tp < 10) {
            $('#heal').prop('disabled', true);
        }
    }

    function fightAction() {
        var EXPEarned = 14, // utilities.getRandomInt(parseInt(monster.maxHP * .5), 10),
            $fightInfo = $('.fight-info');

        // Stop regenerating tp automatically
        if (typeof tpInterval == 'number') {
            clearInterval(tpInterval);
        }

        // Clear any training going on
        if (typeof trainingInterval == 'number') {
            clearInterval(trainingInterval);
        }

        // Check who attacks first, and do their turns
        if (player.stats.speed > monster.stats.speed) {
            doPlayerTurn();
            if (monster.currentHP > 0 && player.currentHP > 0) doMonsterTurn();
        } else {
            doMonsterTurn();
            if (player.currentHP > 0)  doPlayerTurn();
        }

        if (monster.currentHP <= 0) {
            var EXPEarned = 14; // utilities.getRandomInt(parseInt(monster.maxHP * .5), 10);

            // Set monster HP gauge to 0
            monster.currentHP = 0;
            utilities.progress(0, $('.progress-bar--monster'));

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

            // Empty ailments
            $('.monster-info__ailments').empty();

            // Begin restoring tp
            tpInterval = setInterval(function () {
                player.tp += 1;

                if (player.tp >=  10) $('#heal').prop('disabled', false);
                if (player.tp > 100) player.tp = 100;

                utilities.progress(player.tp, $('.progress-bar--player-hp-tp'), 500);
                $('.player-info__tp-count').text(player.tp + '/100');
            }, 1000);

            // Post-battle work
            postBattleActions({
                EXPEarned : EXPEarned,
                loot : ['Sword', 'Ring']
            });

            $.removeData(window, 'monster');

            $('#train').show();

            var loot = {
                gold: utilities.getRandomInt(monster.level * 10, monster.level * 100),
                EXP: monster.level * 10,
                items: ['Killer Edge', 'Amber Ring']
            }

            showLoot(loot);

            return;
        }

        if (player.currentHP <= 0) {
            player.currentHP = 0;
            utilities.progress(0, $('.progress-bar--player-hp'));

            $fightInfo.append('<h4>You died!</h4');

            // Show Resurrection Button
            $('#resurrect').fadeIn();
            $('#heal').hide();

            // Hide battle options
            $('#fight--attack, #fight--cast').hide();

        }

        $('.fight-info__toggle').css('display', 'inline-block');
    }

    function showLoot(earnedLoot) {
        var $lootContainer = $('.loot'),
            loot = 
                '<h2>Battle Rewards</h2>' +
                '<ul>' +
                    '<li class="loot__gold">Gold: ' + earnedLoot.gold + '</li>' +
                    '<li class="loot__exp">EXP: ' + earnedLoot.EXP + '</li>' +
                '</ul>';

        $lootContainer.append(loot)
        for (var i = 0; i < earnedLoot.items.length; i++) {
            $lootContainer.find('ul').append('<li class="loot__item">' + earnedLoot.items[i] + '</li>');
        }

        $.modal($lootContainer, {
            opacity: 80,
            overlayClose: true,
            onClose: function (dialog) {
                $('.simplemodal-container').fadeOut();
                $('.simplemodal-overlay').animate({height: 0}, function () {
                   $.modal.close();
                   $('.loot').empty();
                });
            }
        })
    }

    function doTraining () {
        trainingInterval = setInterval(function () {
            player.EXP += Math.abs(player.EXPCap * .001);
            utilities.progress((player.EXP / player.EXPCap) * 100, $('.progress-bar--exp'), 0);

            $('.training__percentage').text('(' + ((player.EXP / player.EXPCap) * 100).toFixed(2) + '%)');
            if (player.EXP > player.EXPCap) {
                player.gainLevel();
                utilities.progress(0, $('.progress-bar--exp'));
            }
        }, 100);
    }

    function postBattleActions (loot) {
        // player.updateplayer(loot);
        player.updateEXP(loot.EXPEarned);
    }

    return {
        appendMonsterInfo : appendMonsterInfo,
        doplayerHeal : doplayerHeal,
        fightAction : fightAction,
        doTraining : doTraining
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
        this.EXPCap = 15; //this.level * (100 + this.level * 2);
        this.maxHP = 50;
        this.tp = 100;
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
                effect : 'poison',
                effectChance : 10,
                dmg : 12,
                description : 'A simple -- yet sturdy -- copper blade. Centuries of warriors have swung the sharp end at myriad foes. It\'s edge is quenched in poison.'
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
        this.stats = {
            minDMG : (this.level * 4) + this.gear.weapon.dmg,
            maxDMG : (this.level * 8) + this.gear.weapon.dmg,
            crit : 30 + this.gear.gloves.critBonus,
            speed: 20
        },
        this.traits = ['Strength', 'Speed', 'Control', 'Berserker', 'Unstable', 'Quick-Swap'];
    };

    player.prototype = {
        updateplayer : function (loot) {
        },
        updateHP : function (monsterDMG) {
            var HPRemaining = this.currentHP -= monsterDMG,
                percentHPRemaining = parseInt((this.currentHP / this.maxHP) * 100, 10);

            percentHPRemaining < 0 ? 0 : percentHPRemaining;
            utilities.progress(parseInt(((this.currentHP / this.maxHP) * 100), 10) , $('.progress-bar--player-hp'));
            
            $('.player-hp--current').text(player.currentHP);
            $('.player-hp--total').text(player.maxHP);
        },
        updateEXP : function (lootEXP) {
            this.EXP += lootEXP;

            if (this.EXP >= this.EXPCap) {
                this.gainLevel();
                $('#exp-gauge').find('.exp-gauge__level').text('Level: ' + this.level);
            } else {
                utilities.progress(Math.round((this.EXP / this.EXPCap) * 100), $('.progress-bar--exp'), 600);
            }
        },
        gainLevel : function (int) {
            var levelUpText = $('<span color="green; font-weight: bold">Level Up!</span>').delay(5000),
                player = this;

            player.level += 1;
            player.currentHP = this.maxHP;
            player.EXPCap = this.level * 100;

            $('.fight-info').append('<h5>You gained a level!</h5><p>Health restored!</p>');

            // Update XP (might have rolled over into this new level, so doesn't start back at 0);
            utilities.progress(100, $('.progress-bar--exp'), 800);
            setTimeout(function () {
                utilities.progress(0, $('.progress-bar--exp'), 0);
                utilities.progress(Math.round((player.EXP / player.EXPCap) * 100), $('.progress-bar--exp'), 600);
            }, 850);
            
            // Update HP text to full
            console.info(player.EXP, player.EXPCap);
            $('.player-hp--current').text(player.currentHP);
            $('.player-hp--total').text(player.maxHP);

            // Update tp
            this.tp = 100;
            utilities.progress(100, $('.progress-bar--player-hp-tp'));
            $('.player-info__hp-tp').text(player.tp + '/100');
            $('.player-info__name').text(player.name + ' (lvl.' + player.level + ')');            
        }
    }

    function Monster () {
        var nameObj = utilities.generateMonsterName(),
            name = '';

        for (var key in nameObj) {
            if (nameObj.hasOwnProperty(key)) {
                name += ' ' + nameObj[key];
            }
        }

        this.name = name;
        this.type = utilities.generateMonsterName().type;
        this.level = player.level;
        this.traits = utilities.generateMonsterTraits();
        this.ailments = [];
        this.level = utilities.getRandomInt(player.level, player.level + 2);
        this.stats = {
            minDMG : 6,
            maxDMG : 12,
            speed: 10
        },
        this.gear = {
            weapon: {
                name: 'claws',
                type: 'monster attack'
            }
        }
        this.maxHP = 100; // utilities.getRandomInt(this.level *15, this.level * 20);
        this.currentHP = this.maxHP;
    }

    Monster.prototype = {
        updateHP : function (DMG) {
            this.currentHP -= DMG;

            if (this.currentHP < 0) {
                this.currentHP = 0;
            }
            
            var percentHPRemaining = parseInt((this.currentHP / this.maxHP) * 100, 10);
            percentHPRemaining < 0 ? 0 : percentHPRemaining;

            utilities.progress(percentHPRemaining , $('.progress-bar--monster'));
            $('.monster-info__hp-count').text(this.currentHP + '/' + this.maxHP);
        }
    }

    function addUIEvents () {
        $('#fight--monster').on('click', function () {
            $(this).hide();

            monster = $.data(window, 'monster', new Monster());
            game.fight.appendMonsterInfo();

            $('.fight-info__toggle').hide().text('See Fight Details');
            $('#train').hide();
            $('#fight--attack, #fight--cast').fadeIn(100);
        });

        $('#fight--attack').on('click', function () {
            game.fight.fightAction();

        });

        $('#resurrect').on('click', function () {            
            player.currentHP = player.maxHP;
            player.EXP -= parseInt(player.EXP * .3, 10);
            player.tp = 100;
            utilities.progress(100, $('.progress-bar--player-hp-tp'), 600);
            utilities.progress(100, $('.progress-bar--player-hp'), 600);
            utilities.progress((player.EXP / player.EXPCap) * 100, $('.progress-bar--exp'), 600);

            $('.player-hp--current').text(player.currentHP);
            $('.player-hp--total').text(player.maxHP);
            $('#resurrect').fadeOut();
            $('#heal').show();
            $('#fight--monster').trigger('click');
        });

        $('#heal').on('click', function () {
            game.fight.doplayerHeal();
        })

        $('.stats-toggle').on('click', function (e) {
            var $this = $(e.currentTarget),
                $statWrap = $this.next('.stats-wrap'),
                statHeight = $statWrap.children('.stats-view').outerHeight();

            if ($statWrap.hasClass('open')) {
                $statWrap.height(0).removeClass('open');
                $this.removeClass('open');
            } else {
                $statWrap.height(statHeight).addClass('open');
                $this.addClass('open');
            }
        });

        $('#train').on('click', function () {
            var $this = $(this);

            if ($this.hasClass('training--no')) {
                $this.removeClass('training--no');
                $(this).text('Stop Training').addClass('training--yes');
                $('.monster-info, .fight-info').empty();
                $('.fight-info').append('<div>Like a boss, you begin training on your own. <span class="training__percentage"></span></div>');
                $('#fight--monster, #heal').hide();
                $('.fight-info__toggle').text('See Training Details');
                $('.fight-info__toggle').css('display', 'inline-block').trigger('click');

                game.fight.doTraining();
            } else {
                $this.addClass('training--no');
                clearInterval(trainingInterval);
                $('#fight--monster, #heal').show();
                $('.fight-info').append('<div>You stop training.</div>');
                $this.text('Train');
            }
        });

        $('.fight-info__toggle').on('click', function () {
            var $this = $(this),
                $fightInfo = $('.fight-info');

            if ($this.hasClass('open')) {
                $this.removeClass('open');
                $fightInfo.slideUp();
            } else {
                $this.addClass('open');
                $fightInfo.slideDown();
            }            
        })
    }

    function setEXP () {
        $('#exp-gauge').attr('data-exp', player.EXP);
        utilities.progress((player.EXP / player.EXPCap) * 100, $('.progress-bar--exp'));
    }

    function createplayer () {        
        player = $.data(window, 'player', new player());

        var $tpCount =  $('.player-info__tp-count'),
            stats = '<li class="stats-view__HP"><h6>HP</h6>: ' + player.currentHP + '/' + player.maxHP +'</li>' +
                '<li class="stats-view__damage"><h6>Damage</h6>: ' + player.stats.minDMG + ' - ' + player.stats.maxDMG + '</li>' +
                '<li class="stats-view__weapon"><h6>Weapon</h6>: ' + player.gear.weapon.name + '</li>' +
                '<li class="stats-view__traits"><h6>Traits</h6>: </li>';

        // Fill player HP and tp bars
        utilities.progress(100, $('.progress-bar--player-hp'), 600);
        utilities.progress(100, $('.progress-bar--player-hp-tp'), 600);

        // Set up various labels
        $('.player-hp--current').text(player.currentHP);
        $('.player-hp--total').text(player.maxHP);
        $('.player-info__name').text(player.name + ' (lvl.' + player.level + ')');

        // Append stats element
        $('.player-info__stats-view').append(stats);

        // Iterate over traits and add to stats (todo: make this happen before appending, less DOM interaction)
        for (i = 0; i < player.traits.length; i++) {
            $('.player-info__stats-view .stats-view__traits').append(player.traits[i] + ' ');
        }

        // Fill tp bar
        $tpCount.text(player.tp + '/' + 100);
    }

    return {
        createplayer : createplayer,
        addUIEvents : addUIEvents,
        setEXP : setEXP
    }

})();

$(document).ready(function() {
    game.events.addUIEvents();
    game.events.createplayer();
    game.events.setEXP();

    player = $.data(window, 'player'),
    monster = {};

    (function($) {
        $.fn.slideFade = function(speed, distance) {
            var that = this,
                slideSpeed = speed || 400,
                slideDistance = distance || 80;

            setTimeout(function () {
                that.animate({
                    'right': '-' + distance + 'px',
                    'opacity' : 0
                }, slideSpeed, 'linear', function () {
                    this.remove();
                });
            }, 50);
            
     
            return this;
        };
     
    }(jQuery));
});