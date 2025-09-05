define(['character', 'lib/underscore'], function(Character, _) {

    var EnhancedMob = Character.extend({
        init: function(id, kind) {
            this._super(id, kind);
        
            this.aggroRange = 1;
            this.isAggressive = true;
            this.target = null;
            this.hatelist = [];
            this.lastAttackTime = 0;
            this.attackCooldown = 1000; // 1 second between attacks
            this.speed = 0.5; // Movement speed
            this.spawningX = 0;
            this.spawningY = 0;
            this.armorLevel = this.getArmorLevel();
            this.weaponLevel = this.getWeaponLevel();
            this.isDead = false;
            this.respawnTimeout = null;
            this.returnTimeout = null;
        },

        getArmorLevel: function() {
            var armorLevels = {
                [Types.Entities.RAT]: 0,
                [Types.Entities.SKELETON]: 1,
                [Types.Entities.GOBLIN]: 1,
                [Types.Entities.OGRE]: 2,
                [Types.Entities.SPECTRE]: 1,
                [Types.Entities.CRAB]: 1,
                [Types.Entities.BAT]: 0,
                [Types.Entities.WIZARD]: 1,
                [Types.Entities.EYE]: 1,
                [Types.Entities.SNAKE]: 1,
                [Types.Entities.SKELETON2]: 2,
                [Types.Entities.BOSS]: 3,
                [Types.Entities.DEATHKNIGHT]: 3
            };
            return armorLevels[this.kind] || 0;
        },

        getWeaponLevel: function() {
            var weaponLevels = {
                [Types.Entities.RAT]: 1,
                [Types.Entities.SKELETON]: 2,
                [Types.Entities.GOBLIN]: 2,
                [Types.Entities.OGRE]: 3,
                [Types.Entities.SPECTRE]: 2,
                [Types.Entities.CRAB]: 1,
                [Types.Entities.BAT]: 1,
                [Types.Entities.WIZARD]: 3,
                [Types.Entities.EYE]: 2,
                [Types.Entities.SNAKE]: 2,
                [Types.Entities.SKELETON2]: 3,
                [Types.Entities.BOSS]: 4,
                [Types.Entities.DEATHKNIGHT]: 4
            };
            return weaponLevels[this.kind] || 1;
        },

        hasTarget: function() {
            return this.target !== null;
        },

        setTarget: function(target) {
            this.target = target.id;
            this.increaseHateFor(target.id, 100);
        },

        clearTarget: function() {
            this.target = null;
        },

        increaseHateFor: function(playerId, points) {
            if (this.hates(playerId)) {
                var hateEntry = _.find(this.hatelist, function(obj) {
                    return obj.id === playerId;
                });
                if (hateEntry) {
                    hateEntry.hate += points;
                }
            } else {
                this.hatelist.push({ id: playerId, hate: points });
            }

            if (this.returnTimeout) {
                clearTimeout(this.returnTimeout);
                this.returnTimeout = null;
            }
        },

        hates: function(playerId) {
            return _.any(this.hatelist, function(obj) { 
                return obj.id === playerId; 
            });
        },

        getHatedPlayerId: function(hateRank) {
            var i, playerId,
                sorted = _.sortBy(this.hatelist, function(obj) { return obj.hate; }),
                size = _.size(this.hatelist);
            
            if (hateRank && hateRank <= size) {
                i = size - hateRank;
            } else {
                i = size - 1;
            }
            if (sorted && sorted[i]) {
                playerId = sorted[i].id;
            }
            
            return playerId;
        },

        forgetPlayer: function(playerId, duration) {
            this.hatelist = _.reject(this.hatelist, function(obj) { 
                return obj.id === playerId; 
            });
            
            if (this.hatelist.length === 0) {
                this.returnToSpawningPosition(duration);
            }
        },

        forgetEveryone: function() {
            this.hatelist = [];
            this.returnToSpawningPosition(1);
        },

        returnToSpawningPosition: function(duration) {
            var self = this;
            this.returnTimeout = setTimeout(function() {
                self.clearTarget();
            }, duration * 1000);
        },

        canAttack: function() {
            return Date.now() - this.lastAttackTime >= this.attackCooldown;
        },

        destroy: function() {
            this.isDead = true;
            this.hatelist = [];
            this.clearTarget();
            this.updateHitPoints();
            this.resetPosition();
            
            this.handleRespawn();
        },

        handleRespawn: function() {
            var self = this;
            this.respawnTimeout = setTimeout(function() {
                self.respawn();
            }, 30000); // 30 second respawn
        },

        respawn: function() {
            this.isDead = false;
            this.hitPoints = this.maxHitPoints;
            this.setGridPosition(this.spawningX, this.spawningY);
            this.clearTarget();
            this.forgetEveryone();
        },

        resetPosition: function() {
            this.setGridPosition(this.spawningX, this.spawningY);
        },

        receiveDamage: function(points, playerId) {
            this.hitPoints -= points;
            this.increaseHateFor(playerId, points);
        }
    });

    return EnhancedMob;
});