define(['lib/underscore'], function(_) {

    var EnhancedStorage = Class.extend({
        init: function() {
            if (this.hasLocalStorage() && localStorage.gameData) {
                this.data = JSON.parse(localStorage.gameData);
            } else {
                this.resetData();
            }
        },
    
        resetData: function() {
            this.data = {
                hasAlreadyPlayed: false,
                player: {
                    name: "",
                    weapon: "",
                    armor: "",
                    image: "",
                    x: 0,
                    y: 0,
                    hitPoints: 100,
                    maxHitPoints: 100,
                    level: 1,
                    experience: 0,
                    gold: 0
                },
                achievements: {
                    unlocked: [],
                    ratCount: 0,
                    skeletonCount: 0,
                    totalKills: 0,
                    totalDmg: 0,
                    totalRevives: 0,
                    totalGold: 0,
                    totalExperience: 0,
                    itemsLooted: 0,
                    chestsOpened: 0,
                    distanceTraveled: 0,
                    timePlayed: 0
                },
                gameState: {
                    currentMap: "world",
                    lastPlayTime: Date.now(),
                    totalPlayTime: 0,
                    gameStarted: false,
                    playerPosition: { x: 25, y: 25 },
                    inventory: [],
                    equippedItems: {
                        weapon: null,
                        armor: null
                    }
                },
                statistics: {
                    mobsKilled: {},
                    itemsFound: {},
                    areasExplored: [],
                    questsCompleted: [],
                    deaths: 0,
                    respawns: 0
                }
            };
        },
    
        hasLocalStorage: function() {
            return Modernizr.localstorage;
        },
    
        save: function() {
            if (this.hasLocalStorage()) {
                localStorage.gameData = JSON.stringify(this.data);
            }
        },
    
        clear: function() {
            if (this.hasLocalStorage()) {
                localStorage.gameData = "";
                this.resetData();
            }
        },

        // Player data management
    
        hasAlreadyPlayed: function() {
            return this.data.hasAlreadyPlayed;
        },
    
        initPlayer: function(name) {
            this.data.hasAlreadyPlayed = true;
            this.setPlayerName(name);
            this.data.gameState.gameStarted = true;
            this.data.gameState.lastPlayTime = Date.now();
        },
        
        setPlayerName: function(name) {
            this.data.player.name = name;
            this.save();
        },

        setPlayerImage: function(img) {
            this.data.player.image = img;
            this.save();
        },

        setPlayerArmor: function(armor) {
            this.data.player.armor = armor;
            this.data.gameState.equippedItems.armor = armor;
            this.save();
        },
    
        setPlayerWeapon: function(weapon) {
            this.data.player.weapon = weapon;
            this.data.gameState.equippedItems.weapon = weapon;
            this.save();
        },

        savePlayer: function(img, armor, weapon) {
            this.setPlayerImage(img);
            this.setPlayerArmor(armor);
            this.setPlayerWeapon(weapon);
        },

        setPlayerPosition: function(x, y) {
            this.data.gameState.playerPosition.x = x;
            this.data.gameState.playerPosition.y = y;
            this.save();
        },

        getPlayerPosition: function() {
            return this.data.gameState.playerPosition;
        },

        setPlayerHealth: function(hitPoints, maxHitPoints) {
            this.data.player.hitPoints = hitPoints;
            this.data.player.maxHitPoints = maxHitPoints;
            this.save();
        },

        getPlayerHealth: function() {
            return {
                hitPoints: this.data.player.hitPoints,
                maxHitPoints: this.data.player.maxHitPoints
            };
        },

        addExperience: function(amount) {
            this.data.player.experience += amount;
            this.data.achievements.totalExperience += amount;
            
            // Simple leveling system
            var newLevel = Math.floor(this.data.player.experience / 100) + 1;
            if (newLevel > this.data.player.level) {
                this.data.player.level = newLevel;
                this.data.player.maxHitPoints += 10; // Increase max HP on level up
                this.data.player.hitPoints = this.data.player.maxHitPoints; // Full heal on level up
            }
            
            this.save();
        },

        addGold: function(amount) {
            this.data.player.gold += amount;
            this.data.achievements.totalGold += amount;
            this.save();
        },

        spendGold: function(amount) {
            if (this.data.player.gold >= amount) {
                this.data.player.gold -= amount;
                this.save();
                return true;
            }
            return false;
        },

        // Inventory management

        addToInventory: function(item) {
            this.data.gameState.inventory.push({
                id: item.id,
                kind: item.kind,
                name: item.name || Types.getKindAsString(item.kind),
                timestamp: Date.now()
            });
            this.data.achievements.itemsLooted++;
            this.save();
        },

        removeFromInventory: function(itemId) {
            this.data.gameState.inventory = _.reject(this.data.gameState.inventory, function(item) {
                return item.id === itemId;
            });
            this.save();
        },

        getInventory: function() {
            return this.data.gameState.inventory;
        },

        // Achievement system
    
        hasUnlockedAchievement: function(id) {
            return _.include(this.data.achievements.unlocked, id);
        },
    
        unlockAchievement: function(id) {
            if (!this.hasUnlockedAchievement(id)) {
                this.data.achievements.unlocked.push(id);
                this.save();
                return true;
            }
            return false;
        },
    
        getAchievementCount: function() {
            return _.size(this.data.achievements.unlocked);
        },

        // Mob kill tracking
        getRatCount: function() {
            return this.data.achievements.ratCount;
        },
    
        incrementRatCount: function() {
            if (this.data.achievements.ratCount < 10) {
                this.data.achievements.ratCount++;
                this.save();
            }
        },
        
        getSkeletonCount: function() {
            return this.data.achievements.skeletonCount;
        },

        incrementSkeletonCount: function() {
            if (this.data.achievements.skeletonCount < 10) {
                this.data.achievements.skeletonCount++;
                this.save();
            }
        },

        getTotalKills: function() {
            return this.data.achievements.totalKills;
        },

        incrementTotalKills: function() {
            this.data.achievements.totalKills++;
            this.save();
        },

        recordMobKill: function(mobKind) {
            var mobName = Types.getKindAsString(mobKind);
            if (!this.data.statistics.mobsKilled[mobName]) {
                this.data.statistics.mobsKilled[mobName] = 0;
            }
            this.data.statistics.mobsKilled[mobName]++;
            this.incrementTotalKills();
        },

        // Damage tracking
        getTotalDamageTaken: function() {
            return this.data.achievements.totalDmg;
        },
    
        addDamage: function(damage) {
            this.data.achievements.totalDmg += damage;
            this.save();
        },

        // Revive tracking
        getTotalRevives: function() {
            return this.data.achievements.totalRevives;
        },
    
        incrementRevives: function() {
            this.data.achievements.totalRevives++;
            this.save();
        },

        // Death tracking
        recordDeath: function() {
            this.data.statistics.deaths++;
            this.save();
        },

        recordRespawn: function() {
            this.data.statistics.respawns++;
            this.incrementRevives();
        },

        // Distance tracking
        addDistanceTraveled: function(distance) {
            this.data.achievements.distanceTraveled += distance;
            this.save();
        },

        // Time tracking
        updatePlayTime: function() {
            var now = Date.now();
            if (this.data.gameState.lastPlayTime) {
                var sessionTime = now - this.data.gameState.lastPlayTime;
                this.data.achievements.timePlayed += sessionTime;
                this.data.gameState.totalPlayTime += sessionTime;
            }
            this.data.gameState.lastPlayTime = now;
            this.save();
        },

        // Area exploration
        exploreArea: function(areaName) {
            if (!_.include(this.data.statistics.areasExplored, areaName)) {
                this.data.statistics.areasExplored.push(areaName);
                this.save();
            }
        },

        // Chest opening
        openChest: function() {
            this.data.achievements.chestsOpened++;
            this.save();
        },

        // Game state management
        getGameState: function() {
            return this.data.gameState;
        },

        setGameState: function(state) {
            this.data.gameState = _.extend(this.data.gameState, state);
            this.save();
        },

        // Statistics
        getStatistics: function() {
            return this.data.statistics;
        },

        // Auto-save functionality
        startAutoSave: function(interval) {
            var self = this;
            interval = interval || 30000; // Default 30 seconds
            
            this.autoSaveInterval = setInterval(function() {
                self.updatePlayTime();
                self.save();
            }, interval);
        },

        stopAutoSave: function() {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
        },

        // Export/Import functionality for backup
        exportSave: function() {
            return JSON.stringify(this.data);
        },

        importSave: function(saveData) {
            try {
                var importedData = JSON.parse(saveData);
                this.data = importedData;
                this.save();
                return true;
            } catch (e) {
                return false;
            }
        }
    });
    
    return EnhancedStorage;
});