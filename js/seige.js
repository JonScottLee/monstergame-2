var heroGame = heroGame || {};

heroGame.utilities = (function () {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function progress(percent, $element, animSpeed) {
        var speed = animSpeed ? animSpeed : 50;
        var progressBarWidth = percent * $element.width() / 100;
        $element.find('div').animate({ width: progressBarWidth }, speed).html(percent + "%&nbsp;");
    };

    return {
        getRandomInt : getRandomInt,
        progress : progress
    }
})();

heroGame.fight = (function () {
    var updateFrequencey = 400;

    function appendMonsterInfo (monster) {
        var monsterInfo =
                '<div class="monster__name">' + monster.name + '</div>' +
                '<span id="monster-info__HP" class="badge badge-red">' + monster.currentHP + '</span>';

        $('#fight-info').empty();
        $('#monster-info').empty().append(monsterInfo);

        $('#monster-info--hp').show();
        heroGame.utilities.progress(100, $('.progress-bar--monster'));
    }

    function monsterFight (hero, monster) {
        var $fightInfo = $('#fight-info'),
            heroDMG = heroGame.utilities.getRandomInt(hero.battleStats.minDMG, hero.battleStats.maxDMG),
            monsterDMG = heroGame.utilities.getRandomInt(monster.battleStats.minDMG, monster.battleStats.maxDMG),
            EXPEarned = heroGame.utilities.getRandomInt(parseInt(monster.maxHP * .5), 10),
            hitType = 'hits ';

        appendMonsterInfo(monster);        
    }

    function fightAction() {
        var hero = $.data(window, 'hero'),
            monster = $.data(window, 'monster'),
            $fightInfo = $('#fight-info'),
            heroDMG = heroGame.utilities.getRandomInt(hero.battleStats.minDMG, hero.battleStats.maxDMG),
            monsterDMG = heroGame.utilities.getRandomInt(monster.battleStats.minDMG, monster.battleStats.maxDMG),
            EXPEarned = heroGame.utilities.getRandomInt(parseInt(monster.maxHP * .5), 10),
            hitType = 'hits ';

        // Check if critical hit && possibly an eviscerate
        if (Math.floor(Math.random()*100) <= hero.battleStats.crit) {
            hitType = '<span class="hit-type--crit">crits!</span> ';

            if (hero.gear.weapon.type == 'sword') hitType = '<span class="hit-type--crit">slices!</span> ';

            heroDMG = parseInt(heroGame.utilities.getRandomInt(hero.battleStats.minDMG, hero.battleStats.maxDMG) * 4, 10);

            // Shake effect
                $('body').addClass('shake');
                setTimeout(function () {
                    $('body').removeClass();
                }, 175);

            // 10% of time, when user does DMG == to at least half of monster's max HP, do an eviscerate
            // Or, eviscerate at 1/4 crit chance
            if ((Math.floor(Math.random()*100) <= hero.battleStats.crit / 4) || heroDMG > monster.maxHP * .5 && Math.floor(Math.random()*100) >= 90) {
                hitType = '<span class="hit-type--eviscerate">eviscerates!</span> ';
                heroDMG = parseInt(heroGame.utilities.getRandomInt(hero.battleStats.minDMG, hero.battleStats.maxDMG) * 10, 10);

                // Shake effect
                $('body').addClass('shake shake-hard');
                setTimeout(function () {
                    $('body').removeClass();
                }, 300);
            }
        }

        $fightInfo
            .append('<div>' + hero.name + ' ' + hitType + ' ' + monster.name + ' for <b>' + heroDMG + ' damage</b></div>')
            .append('<div style="color: red;">' + monster.name + ' ' + 'hits' + ' ' + hero.name + ' for <b>' + monsterDMG + ' damage</b></div>')

        monster.updateHP(heroDMG);

        if (monster.currentHP - heroDMG > 0) {
            monster.currentHP -= heroDMG;

            if (monster.currentHP < 0) monster.currentHP = 0;

            $('#monster-info__HP').text(monster.currentHP);

            hero.updateHP(monsterDMG);
        } else {
            // Set monster HP gauge to 0
            heroGame.utilities.progress(0, $('.progress-bar--monster'));

            // Append defeated and EXP messaging
            $fightInfo
                .append('<p class="msg--monster-defeated" style="color: #2c9f42;">' + monster.name + ' is defeated!</p>')
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
        }        
    }

    function postBattleActions (loot) {
        var hero = $.data(this, 'hero');

        // hero.updateHero(loot);
        hero.updateEXP(loot.EXPEarned);
    }

    return {
        monsterFight : monsterFight,
        fightAction : fightAction
    }

})();

// Events
heroGame.events = (function () {

    function Hero () {
        this.name = 'Player';
        this.age = '15';
        this.level = 1;
        this.EXP = 0;
        this.EXPCap = this.level * (1000);
        this.maxHP = 500;
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
            crit : 30 + this.gear.gloves.critBonus
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
        },
        updateEXP : function (lootEXP) {
            this.EXP += lootEXP;

            console.info(this.EXP, this.EXPCap);

            if (this.EXP >= this.EXPCap) {
                this.level += 1;
                $('#exp-gauge').find('.exp-gauge__level').text('Level: ' + this.level);

                setTimeout(function () {
                    heroGame.utilities.progress(100, $('.progress-bar--exp'), 600);
                }, 10);
            } else {
                heroGame.utilities.progress(Math.round((this.EXP / this.EXPCap) * 100), $('.progress-bar--exp'), 600);
            }
        },
        gainLevel : function (int) {
            this.level += 1;
            this.currentHP = this.maxHP;
            this.EXPCap = this.level * 100;

            heroGame.utilities.progress(100 , $('.progress-bar--player'), 600);
        }
    }

    function Monster () {
        this.name = 'Green Slime';
        this.level = 15;
        this.battleStats = {
            minDMG : 10,
            maxDMG : 23
        },
        this.maxHP = heroGame.utilities.getRandomInt(this.level * 20, this.level * 40);
        this.currentHP = this.maxHP;
        this.abilities = [];
    }

    Monster.prototype = {
        updateHP : function (heroDMG) {
            var HPRemaining = this.currentHP -= heroDMG,
                percentHPRemaining = parseInt((this.currentHP / this.maxHP) * 100, 10);

            percentHPRemaining < 0 ? 0 : percentHPRemaining;
            heroGame.utilities.progress(parseInt(((this.currentHP / this.maxHP) * 100), 10) , $('.progress-bar--monster'));
        }
    }

    function addUIEvents () {
        $('#fight--monster').on('click', function () {
            $(this).hide();

            monster = $.data(window, 'monster', new Monster());

            heroGame.fight.monsterFight(hero, monster);

            $('#fight--attack, #fight--cast').fadeIn(100);
        });

        $('#fight--attack').on('click', function () {
            heroGame.fight.fightAction();
        });
    }

    function setEXP () {
        var hero = $.data(window, 'hero');

        $('#exp-gauge').attr('data-exp', hero.EXP);
        heroGame.utilities.progress(hero.EXP, $('.progress-bar--exp'));
    }

    function createhero () {
        hero = $.data(window, 'hero', new Hero());

        heroGame.utilities.progress(100, $('.progress-bar--player'));
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