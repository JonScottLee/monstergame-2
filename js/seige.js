var heroGame = heroGame || {};

heroGame.utilities = (function () {
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function progress(percent, $element) {
        var progressBarWidth = percent * $element.width() / 100;
        $element.find('div').animate({ width: progressBarWidth }, 50).html(percent + "%&nbsp;");
    };

    return {
        getRandomInt : getRandomInt,
        progress : progress
    }
})();

heroGame.fight = (function () {
    var updateFrequencey =400;

    function appendMonsterInfo (monster) {
        var monsterInfo =
                '<div class="monster__name">' + monster.name + '</div>' +
                '<span id="monster-info__HP" class="badge badge-red">' + monster.currentHP + '</span>';

        $('#monster-info')
            .empty()
            .append(monsterInfo);

        $('#monster-info--hp').show();
        heroGame.utilities.progress(100, $('.progress-bar--monster'));
    }

    function monsterFight (hero, monster) {
        var $fightInfo = $('#fight-info'),
            heroDMG = heroGame.utilities.getRandomInt(hero.battleStats.minDMG, hero.battleStats.maxDMG),
            EXPEarned = heroGame.utilities.getRandomInt(parseInt(monster.maxHP * .5), 10),
            hitType = 'hits ';

        appendMonsterInfo(monster);

        // Append fight info for initial click (instant feedback)
        $fightInfo
            .empty()
            .append('<div>' + hero.name + ' ' + hitType + monster.name+' for <b>' + heroDMG + ' damage</b></div>')
       
        var fightInterval = setInterval(function () {
            heroDMG = heroGame.utilities.getRandomInt(hero.battleStats.minDMG, hero.battleStats.maxDMG),
            monsterDMG = heroGame.utilities.getRandomInt(monster.battleStats.minDMG, monster.battleStats.maxDMG),
            hitType = 'hits';

            // Check if critical hit
            if (Math.floor(Math.random()*100) <= hero.battleStats.crit) {
                hitType = '<span class="hit-type--crit">crits!</span> ';

                if (hero.gear.weapon.type == 'sword') hitType = '<span class="hit-type--crit">slices!</span> ';

                heroDMG = parseInt(heroGame.utilities.getRandomInt(hero.battleStats.minDMG, hero.battleStats.maxDMG) * 4, 10);
            }

            // Update hero and monster hitpoints
            hero.updateHP();
            monster.updateHP();

            if (monster.currentHP > 0) {
                monster.currentHP -= heroDMG;

                if (monster.currentHP < 0) monster.currentHP = 0;

                $fightInfo
                    .append('<div>' + hero.name + ' ' + hitType + ' ' + monster.name + ' for <b>' + heroDMG + ' damage</b></div>')
                    .append('<div style="color: red;">' + monster.name + ' ' + 'hits' + ' ' + hero.name + ' for <b>' + monsterDMG + ' damage</b></div>')
                
                $('#monster-info__HP').text(monster.currentHP);
            } else {
                // Set monster HP gauge to 0
                heroGame.utilities.progress(0, $('.progress-bar--monster'));

                // Append defeated and EXP messaging
                $fightInfo
                    .append('<p class="msg--monster-defeated" style="color: #2c9f42;">' + monster.name + ' is defeated!</p>')
                    .append('<p>EXP earned: ' + EXPEarned);

                // Give monster the 'dead' bage
                $('#monster-info__HP').text('Dead');

                // End interval
                clearInterval(fightInterval);

                // Post-battle work
                postBattleActions({
                    EXP : EXPEarned,
                    items : ['Sword', 'Ring']
                });
            }
        
        }, updateFrequencey);
    }

    function postBattleActions (loot) {
        var hero = $.data(this, 'hero');

        hero.updateHero(loot);
    }

    return {
        monsterFight : monsterFight
    }

})();

// Events
heroGame.events = (function () {

    function Hero () {
        this.name = 'Player';
        this.age = '15';
        this.level = 1;
        this.EXP = 0;
        this.EXPCap = this.level * (1);
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
            this.EXP += loot.EXP;

            if (hero.EXP >= hero.EXPCap) this.gainLevel();
        },
        updateHP : function () {
            var monster = $.data(window, 'monster'),
                monsterDMG = heroGame.utilities.getRandomInt(monster.battleStats.minDMG, monster.battleStats.maxDMG);

            this.currentHP -= monsterDMG;
            heroGame.utilities.progress(parseInt((this.currentHP / this.maxHP) * 100, 10) , $('.progress-bar--player'));
        },
        gainLevel : function (int) {
            this.level += 1;

            //$('body').prepend('<div class="tools-alert tools-alert-green"><h2>Congratulations!</h2><p>Your level increased to ' + this.level + '!</p></div>');
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
        updateHP : function (hero) {
            var hero = $.data(window, 'hero'),
                heroDMG = heroGame.utilities.getRandomInt(hero.battleStats.minDMG, hero.battleStats.maxDMG);

            this.currentHP -= heroDMG;
            heroGame.utilities.progress(parseInt((this.currentHP / this.maxHP) * 100, 10) , $('.progress-bar--monster'));
        }
    }

    function addUIEvents () {
        $('#fight--monster').on('click', function () {
            monster = $.data(window, 'monster', new Monster());

            heroGame.fight.monsterFight(hero, monster);
        });
    }

    function createhero () {
        hero = $.data(window, 'hero', new Hero());

        heroGame.utilities.progress(100, $('.progress-bar--player'));
    }

    return {
        createhero : createhero,
        addUIEvents : addUIEvents
    }

})();

$(document).ready(function(){
    heroGame.events.addUIEvents();
    heroGame.events.createhero();
});