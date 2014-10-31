var heroGame = heroGame || {};

heroGame.utilities = (function () {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomPercent () {
        return Math.floor(Math.random() * 100);
    }

    function getHitDetails (entity) {
        var hero = $.data(window, 'hero'),
            hitType = 'hit',
            DMG = parseInt(heroGame.utilities.getRandomInt(entity.battleStats.minDMG, entity.battleStats.maxDMG));

        // Check if critical hit && possibly an eviscerate
        if (entity.type != 'monster' && Math.floor(Math.random()*100) <= entity.battleStats.crit) {
            hitType = '<span class="hit-type--crit">crits!</span> ';

            if (entity.gear.weapon.type == 'sword') hitType = '<span class="hit-type--crit">slice!</span> ';

            DMG = parseInt(heroGame.utilities.getRandomInt(entity.battleStats.minDMG, entity.battleStats.maxDMG) * 4, 10);

            // Shake effect
            $('body').addClass('shake');
            setTimeout(function () {
                $('body').removeClass();
            }, 175);

            // 10% of time, when user does DMG == to at least half of monster's max HP, do an eviscerate
            // Or, eviscerate at 1/4 crit chance
            if ((Math.floor(Math.random()*100) <= entity.battleStats.crit / 4)) {
                hitType = '<span class="hit-type--eviscerate">eviscerate!!</span> ';
                DMG = parseInt(heroGame.utilities.getRandomInt(entity.battleStats.minDMG, entity.battleStats.maxDMG) * 10, 10);

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
        var speed = animSpeed ? animSpeed : 50;
        var progressBarWidth = percent * $element.width() / 100;
        $element.find('div').animate({ width: progressBarWidth }, speed).html(percent + "%&nbsp;");
    };

    return {
        getRandomInt : getRandomInt,
        getRandomPercent : getRandomPercent,
        progress : progress,
        getHitDetails : getHitDetails
    }
})();

heroGame.fight = (function () {

    function appendMonsterInfo (hero, monster) {
        var monsterInfo =
                '<div class="monster__name">A ' + monster.name + '</div>' +
                '<span id="monster-info__HP" class="badge badge-red">' + monster.currentHP + '</span>';

        $('#fight-info').empty();
        $('#monster-info').empty().append(monsterInfo);

        $('#monster-info__hp').show();
        heroGame.utilities.progress(100, $('.progress-bar--monster')); 
    }

    function doHeroHit () {
        var hero = $.data(window, 'hero'),
            hit = heroGame.utilities.getHitDetails($.data(window, 'hero')),
            $fightInfo = $('#fight-info');

        $fightInfo.append('<div class="hit--player">' + hero.name + ' ' + hit.hitType + ' ' + $.data(window, 'monster').name + ' for <b>' + hit.DMG + ' damage</b></div>');
        monster.updateHP(hit.DMG);
        $('#monster-info__HP').text(monster.currentHP);
    }

    function doMonsterHit () {
        var monster = $.data(window, 'monster'),
            hit = heroGame.utilities.getHitDetails($.data(window, 'monster')),
            $fightInfo = $('#fight-info');

        $fightInfo.append('<div class="hit--monster">' + monster.name + ' ' + 'hit' + ' ' + $.data(window, 'hero').name + ' for <b>' + hit.DMG + ' damage</b></div>');
        hero.updateHP(hit.DMG);
    }

    function doHeroHeal () {
        var hero = $.data(window, 'hero');
            healAmount = heroGame.utilities.getRandomInt(hero.maxHP * .3, hero.maxHP * .5),
            $fightInfo = $('#fight-info');

        hero.currentHP += healAmount;
        hero.fatigue -= 10;

        // Update fatigue counter
        $('.player-info__fatigue-count').text(hero.fatigue + '/100');

        if (hero.currentHP > hero.maxHP) hero.currentHP = hero.maxHP;
        heroGame.utilities.progress((hero.currentHP / hero.maxHP) * 100, $('.progress-bar--player'), 600);
        heroGame.utilities.progress(hero.fatigue, $('.progress-bar--player-fatigue'));

        $fightInfo.append('<div class="heal">You heal yourself for ' + healAmount + ' </div>');

        if (typeof $.data(window, 'monster') !== 'undefined') {
            var monsterTimeout = setTimeout(function () {
                doMonsterHit();
                clearTimeout(monsterTimeout);
            }, 650);
        }

        $('.player-info__hp-count').text(hero.currentHP + '/' + hero.maxHP);

        if (hero.fatigue < 10) {
            $('#heal').prop('disabled', true);
        }
    }

    function fightAction() {
        var hero = $.data(window, 'hero'),
            monster = $.data(window, 'monster'),
            EXPEarned = heroGame.utilities.getRandomInt(parseInt(monster.maxHP * .5), 10),
            $fightInfo = $('#fight-info');

        if (hero.battleStats.speed > monster.battleStats.speed) {
            
            // Double strike!
            if (heroGame.utilities.getRandomPercent() > 95) {
                $fightInfo.append('<div class="hit-type--double-strike">You perform a double-strike!</div>')
                doHeroHit();
            }

            doHeroHit();

            if (monster.currentHP > 0 && hero.currentHP > 0) {
                doMonsterHit();
            }
        } else {
            doMonsterHit();
            if (hero.currentHP > 0) {
                doHeroHit();
            }
        }

        if (hero.currentHP <= 0) {
            hero.currentHP = 0;
            heroGame.utilities.progress(0, $('.progress-bar--player'));

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
            heroGame.utilities.progress(0, $('.progress-bar--monster'));

            // Append defeated and EXP messaging
            $fightInfo
                .append('<p class="msg--monster-defeated" style="color: #2c9f42;">You killed the ' + monster.name + '!</p>')
                .append('<p>EXP earned: ' + EXPEarned);

            // Give monster the 'dead' bage
            $('#monster-info__HP').text('Dead');

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
        var hero = $.data(this, 'hero');

        // hero.updateHero(loot);
        hero.updateEXP(loot.EXPEarned);
    }

    return {
        appendMonsterInfo : appendMonsterInfo,
        doHeroHeal : doHeroHeal,
        fightAction : fightAction
    }

})();

// Events
heroGame.events = (function () {

    function Hero () {
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

    Hero.prototype = {
        updateHero : function (loot) {
        },
        updateHP : function (monsterDMG) {
            var HPRemaining = this.currentHP -= monsterDMG,
                percentHPRemaining = parseInt((this.currentHP / this.maxHP) * 100, 10);

            percentHPRemaining < 0 ? 0 : percentHPRemaining;
            heroGame.utilities.progress(parseInt(((this.currentHP / this.maxHP) * 100), 10) , $('.progress-bar--player'));
            $('.player-info__hp-count').text(this.currentHP + '/' + this.maxHP);
        },
        updateEXP : function (lootEXP) {
            this.EXP += lootEXP;

            if (this.EXP >= this.EXPCap) {
                this.gainLevel();
                $('#exp-gauge').find('.exp-gauge__level').text('Level: ' + this.level);

                heroGame.utilities.progress(100, $('.progress-bar--exp'), 600);
            } else {
                heroGame.utilities.progress(Math.round((this.EXP / this.EXPCap) * 100), $('.progress-bar--exp'), 600);
            }
        },
        gainLevel : function (int) {
            var levelUpText = $('<span color="green; font-weight: bold">Level Up!</span>').delay(5000);
            this.level += 1;
            this.currentHP = this.maxHP;
            this.EXPCap = this.level * 100;

            $('#fight-info').append('<h5>You gained a level!</h5><p>Health restored!</p>');

            // Update bar to full
            heroGame.utilities.progress(100 , $('.progress-bar--player'), 600);
            
            // Update HP text to full
            $('.player-info__hp-count').text(hero.currentHP + '/' + hero.maxHP);

            // Update fatigue
            this.fatigue = 100;
            heroGame.utilities.progress(100, $('.progress-bar--player-fatigue'));
            $('.player-info__hp-fatigue').text(hero.fatigue + '/100');

            // Update EXP bar to 0
            setTimeout(function () {
                heroGame.utilities.progress(0, $('.progress-bar--exp'), 600);
            }, 1000);
            
        }
    }

    function Monster () {
        this.name = 'Green Slime';
        this.type = 'monster';
        this.level = 5;
        this.battleStats = {
            minDMG : 6,
            maxDMG : 12,
            speed: 10
        },
        this.maxHP = heroGame.utilities.getRandomInt(this.level * 20, this.level * 40);
        this.currentHP = this.maxHP;
        this.abilities = [];
    }

    Monster.prototype = {
        updateHP : function (heroDMG) {
            var HPRemaining = this.currentHP -= heroDMG,
                percentHPRemaining = parseInt((this.currentHP / this.maxHP) * 100, 10);

            if (HPRemaining < 0) HPRemaining = 0;

            percentHPRemaining < 0 ? 0 : percentHPRemaining;
            heroGame.utilities.progress(parseInt(((this.currentHP / this.maxHP) * 100), 10) , $('.progress-bar--monster'));
            $('.monster-info__hp-count').text(HPRemaining+ '/' + this.maxHP);
        }
    }

    function addUIEvents () {
        $('#fight--monster').on('click', function () {
            $(this).hide();

            monster = $.data(window, 'monster', new Monster());

            heroGame.fight.appendMonsterInfo(hero, monster);
            $('.monster-info__hp-count').text(monster.currentHP + '/' + monster.maxHP);

            $('#fight--attack, #fight--cast').fadeIn(100);
        });

        $('#fight--attack').on('click', function () {
            heroGame.fight.fightAction();
        });

        $('#resurrect').on('click', function () {
            var hero = $.data(window, 'hero').currentHP = $.data(window, 'hero');
            
            hero.currentHP = hero.maxHP;
            hero.EXP -= parseInt(hero.EXP * .3, 10);
            heroGame.utilities.progress(100, $('.progress-bar--player'));
            heroGame.utilities.progress((hero.EXP / hero.EXPCap) * 100, $('.progress-bar--exp'));

            $('#resurrect').fadeOut();
            $('#heal').show();
            $('#fight--monster').trigger('click');
        });

        $('#heal').on('click', function () {
            heroGame.fight.doHeroHeal();
        })
    }

    function setEXP () {
        var hero = $.data(window, 'hero');

        $('#exp-gauge').attr('data-exp', hero.EXP);
        heroGame.utilities.progress((hero.EXP / hero.EXPCap) * 100, $('.progress-bar--exp'));
    }

    function createhero () {
        hero = $.data(window, 'hero', new Hero());

        heroGame.utilities.progress(100, $('.progress-bar--player'));
        heroGame.utilities.progress(100, $('.progress-bar--player-fatigue'));
        $('.player-info__hp-count').text(hero.currentHP + '/' + hero.maxHP);
        $('.player-info__fatigue-count').text(hero.fatigue + '/' + 100);

        setInterval(function () {
            hero.fatigue += 10;

            if (hero.fatigue >=  10) $('#heal').prop('disabled', false);
            if (hero.fatigue > 100) hero.fatigue = 100;

            heroGame.utilities.progress(hero.fatigue, $('.progress-bar--player-fatigue'), 500);
            $('.player-info__fatigue-count').text(hero.fatigue + '/100');
        }, 10000);
    }

    return {
        createhero : createhero,
        addUIEvents : addUIEvents,
        setEXP : setEXP
    }

})();

$(document).ready(function(){
    heroGame.events.addUIEvents();
    heroGame.events.createhero();
    heroGame.events.setEXP();
});