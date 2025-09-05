define(['jquery', 'lib/underscore', 'lib/bison'], function($, _, BISON) {

    var SinglePlayerEngine = Class.extend({
        init: function(game) {
            this.game = game;
            this.entities = {};
            this.mobs = {};
            this.npcs = {};
            this.items = {};
            this.chests = {};
            this.mobAreas = [];
            this.chestAreas = [];
            this.player = null;
            this.gameLoop = null;
            this.lastUpdate = Date.now();
            this.ups = 50; // Updates per second
            this.updateInterval = 1000 / this.ups;
            
            // Game state
            this.isRunning = false;
            this.entityIdCounter = 1;
            this.itemIdCounter = 1;
            
            // Initialize mob areas and chest areas from map data
            this.initializeAreas();
            
            // Start the game loop
            this.start();
        },

        initializeAreas: function() {
            // Initialize mob spawning areas based on the map
            this.mobAreas = [
                { x: 50, y: 50, width: 20, height: 20, kind: Types.Entities.RAT, nb: 5, respawnDelay: 30000 },
                { x: 100, y: 100, width: 30, height: 30, kind: Types.Entities.SKELETON, nb: 3, respawnDelay: 45000 },
                { x: 200, y: 150, width: 25, height: 25, kind: Types.Entities.GOBLIN, nb: 4, respawnDelay: 40000 },
                { x: 300, y: 200, width: 35, height: 35, kind: Types.Entities.OGRE, nb: 2, respawnDelay: 60000 },
                { x: 150, y: 300, width: 20, height: 20, kind: Types.Entities.SPECTRE, nb: 3, respawnDelay: 50000 },
                { x: 400, y: 100, width: 30, height: 30, kind: Types.Entities.CRAB, nb: 4, respawnDelay: 35000 },
                { x: 500, y: 300, width: 25, height: 25, kind: Types.Entities.BAT, nb: 6, respawnDelay: 25000 },
                { x: 600, y: 200, width: 40, height: 40, kind: Types.Entities.WIZARD, nb: 2, respawnDelay: 70000 },
                { x: 700, y: 150, width: 30, height: 30, kind: Types.Entities.EYE, nb: 3, respawnDelay: 55000 },
                { x: 800, y: 250, width: 35, height: 35, kind: Types.Entities.SNAKE, nb: 3, respawnDelay: 45000 },
                { x: 900, y: 100, width: 30, height: 30, kind: Types.Entities.SKELETON2, nb: 2, respawnDelay: 50000 },
                { x: 1000, y: 200, width: 50, height: 50, kind: Types.Entities.BOSS, nb: 1, respawnDelay: 120000 },
                { x: 1100, y: 300, width: 40, height: 40, kind: Types.Entities.DEATHKNIGHT, nb: 1, respawnDelay: 90000 }
            ];

            // Initialize chest areas
            this.chestAreas = [
                { x: 80, y: 80, width: 10, height: 10, nb: 2, respawnDelay: 60000 },
                { x: 180, y: 180, width: 15, height: 15, nb: 3, respawnDelay: 80000 },
                { x: 350, y: 250, width: 12, height: 12, nb: 2, respawnDelay: 70000 },
                { x: 550, y: 350, width: 18, height: 18, nb: 4, respawnDelay: 90000 },
                { x: 750, y: 200, width: 14, height: 14, nb: 3, respawnDelay: 75000 },
                { x: 950, y: 150, width: 16, height: 16, nb: 3, respawnDelay: 85000 }
            ];

            // Initialize NPCs at fixed positions
            this.initializeNPCs();
        },

        initializeNPCs: function() {
            var npcs = [
                { x: 25, y: 25, kind: Types.Entities.GUARD },
                { x: 75, y: 75, kind: Types.Entities.VILLAGER },
                { x: 125, y: 125, kind: Types.Entities.VILLAGEGIRL },
                { x: 175, y: 175, kind: Types.Entities.PRIEST },
                { x: 225, y: 225, kind: Types.Entities.KING },
                { x: 275, y: 275, kind: Types.Entities.SCIENTIST },
                { x: 325, y: 325, kind: Types.Entities.AGENT },
                { x: 375, y: 375, kind: Types.Entities.RICK },
                { x: 425, y: 425, kind: Types.Entities.NYAN },
                { x: 475, y: 475, kind: Types.Entities.SORCERER },
                { x: 525, y: 525, kind: Types.Entities.OCTOCAT },
                { x: 575, y: 575, kind: Types.Entities.CODER },
                { x: 625, y: 625, kind: Types.Entities.BEACHNPC },
                { x: 675, y: 675, kind: Types.Entities.FORESTNPC },
                { x: 725, y: 725, kind: Types.Entities.DESERTNPC },
                { x: 775, y: 775, kind: Types.Entities.LAVANPC }
            ];

            _.each(npcs, function(npcData) {
                this.spawnNPC(npcData.x, npcData.y, npcData.kind);
            }, this);
        },

        start: function() {
            this.isRunning = true;
            this.lastUpdate = Date.now();
            this.gameLoop = setInterval(this.update.bind(this), this.updateInterval);
        },

        stop: function() {
            this.isRunning = false;
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
        },

        update: function() {
            var now = Date.now();
            var deltaTime = now - this.lastUpdate;
            this.lastUpdate = now;

            // Update all entities
            this.updateMobs(deltaTime);
            this.updateNPCs(deltaTime);
            this.updateItems(deltaTime);
            this.updateChests(deltaTime);
            
            // Handle mob spawning
            this.updateMobSpawning();
            
            // Handle chest spawning
            this.updateChestSpawning();
        },

        updateMobs: function(deltaTime) {
            _.each(this.mobs, function(mob) {
                if (mob && !mob.isDead) {
                    this.updateMobAI(mob, deltaTime);
                }
            }, this);
        },

        updateMobAI: function(mob, deltaTime) {
            if (!this.player || this.player.isDead) return;

            var distanceToPlayer = this.getDistance(mob, this.player);
            
            // Aggro logic
            if (distanceToPlayer <= mob.aggroRange * 32 && !mob.hasTarget()) {
                mob.setTarget(this.player);
                mob.increaseHateFor(this.player.id, 100);
            }

            // Combat logic
            if (mob.hasTarget() && mob.target === this.player.id) {
                var target = this.player;
                
                if (distanceToPlayer <= 32) {
                    // Attack if in range
                    if (mob.canAttack()) {
                        this.handleMobAttack(mob, target);
                    }
                } else {
                    // Move towards target
                    this.moveMobTowardsTarget(mob, target);
                }
            } else if (mob.hasTarget()) {
                // Return to spawn if no target
                this.returnMobToSpawn(mob);
            }
        },

        updateNPCs: function(deltaTime) {
            // NPCs are mostly static, but we can add some basic behavior here
            _.each(this.npcs, function(npc) {
                if (npc && npc.isLoaded) {
                    // Simple idle animations or behaviors can be added here
                }
            }, this);
        },

        updateItems: function(deltaTime) {
            // Items don't need much updating, but we can add expiration logic here
        },

        updateChests: function(deltaTime) {
            // Chests are mostly static
        },

        updateMobSpawning: function() {
            _.each(this.mobAreas, function(area) {
                var currentMobs = this.getMobsInArea(area);
                if (currentMobs.length < area.nb) {
                    this.spawnMobInArea(area);
                }
            }, this);
        },

        updateChestSpawning: function() {
            _.each(this.chestAreas, function(area) {
                var currentChests = this.getChestsInArea(area);
                if (currentChests.length < area.nb) {
                    this.spawnChestInArea(area);
                }
            }, this);
        },

        spawnMobInArea: function(area) {
            var x = area.x + Math.random() * area.width;
            var y = area.y + Math.random() * area.height;
            this.spawnMob(x, y, area.kind);
        },

        spawnChestInArea: function(area) {
            var x = area.x + Math.random() * area.width;
            var y = area.y + Math.random() * area.height;
            this.spawnChest(x, y);
        },

        spawnMob: function(x, y, kind) {
            var id = 'mob_' + this.entityIdCounter++;
            var mob = new Mob(id, kind);
            mob.setGridPosition(Math.floor(x), Math.floor(y));
            mob.spawningX = x;
            mob.spawningY = y;
            mob.aggroRange = this.getMobAggroRange(kind);
            mob.isAggressive = this.isMobAggressive(kind);
            
            this.mobs[id] = mob;
            this.entities[id] = mob;
            
            // Notify the game client
            this.game.addEntity(mob);
            
            return mob;
        },

        spawnNPC: function(x, y, kind) {
            var id = 'npc_' + this.entityIdCounter++;
            var npc = new Npc(id, kind);
            npc.setGridPosition(Math.floor(x), Math.floor(y));
            
            this.npcs[id] = npc;
            this.entities[id] = npc;
            
            // Notify the game client
            this.game.addEntity(npc);
            
            return npc;
        },

        spawnChest: function(x, y) {
            var id = 'chest_' + this.entityIdCounter++;
            var chest = new Chest(id);
            chest.setGridPosition(Math.floor(x), Math.floor(y));
            
            this.chests[id] = chest;
            this.entities[id] = chest;
            
            // Notify the game client
            this.game.addEntity(chest);
            
            return chest;
        },

        spawnItem: function(x, y, kind) {
            var id = 'item_' + this.itemIdCounter++;
            var item = new Item(id, kind);
            item.setGridPosition(Math.floor(x), Math.floor(y));
            
            this.items[id] = item;
            this.entities[id] = item;
            
            // Notify the game client
            this.game.addEntity(item);
            
            return item;
        },

        getMobsInArea: function(area) {
            return _.filter(this.mobs, function(mob) {
                return mob && !mob.isDead && 
                       mob.gridX >= area.x && mob.gridX < area.x + area.width &&
                       mob.gridY >= area.y && mob.gridY < area.y + area.height;
            });
        },

        getChestsInArea: function(area) {
            return _.filter(this.chests, function(chest) {
                return chest && 
                       chest.gridX >= area.x && chest.gridX < area.x + area.width &&
                       chest.gridY >= area.y && chest.gridY < area.y + area.height;
            });
        },

        getMobAggroRange: function(kind) {
            var ranges = {
                [Types.Entities.RAT]: 1,
                [Types.Entities.SKELETON]: 2,
                [Types.Entities.GOBLIN]: 2,
                [Types.Entities.OGRE]: 3,
                [Types.Entities.SPECTRE]: 2,
                [Types.Entities.CRAB]: 1,
                [Types.Entities.BAT]: 2,
                [Types.Entities.WIZARD]: 3,
                [Types.Entities.EYE]: 2,
                [Types.Entities.SNAKE]: 2,
                [Types.Entities.SKELETON2]: 2,
                [Types.Entities.BOSS]: 4,
                [Types.Entities.DEATHKNIGHT]: 3
            };
            return ranges[kind] || 2;
        },

        isMobAggressive: function(kind) {
            return true; // All mobs are aggressive in this implementation
        },

        getDistance: function(entity1, entity2) {
            var dx = entity1.x - entity2.x;
            var dy = entity1.y - entity2.y;
            return Math.sqrt(dx * dx + dy * dy);
        },

        moveMobTowardsTarget: function(mob, target) {
            var dx = target.x - mob.x;
            var dy = target.y - mob.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                var moveX = (dx / distance) * mob.speed;
                var moveY = (dy / distance) * mob.speed;
                
                var newX = mob.x + moveX;
                var newY = mob.y + moveY;
                
                if (this.isValidPosition(newX, newY)) {
                    mob.setPosition(newX, newY);
                    this.game.moveEntity(mob);
                }
            }
        },

        returnMobToSpawn: function(mob) {
            var dx = mob.spawningX * 16 - mob.x;
            var dy = mob.spawningY * 16 - mob.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 16) {
                var moveX = (dx / distance) * mob.speed;
                var moveY = (dy / distance) * mob.speed;
                
                var newX = mob.x + moveX;
                var newY = mob.y + moveY;
                
                if (this.isValidPosition(newX, newY)) {
                    mob.setPosition(newX, newY);
                    this.game.moveEntity(mob);
                }
            } else {
                mob.clearTarget();
                mob.forgetEveryone();
            }
        },

        handleMobAttack: function(mob, target) {
            if (!mob.canAttack()) return;
            
            var damage = this.calculateDamage(mob, target);
            this.damageEntity(target, damage, mob);
            
            mob.lastAttackTime = Date.now();
            
            // Notify the game client
            this.game.handleAttack(mob, target, damage);
        },

        calculateDamage: function(attacker, target) {
            var baseDamage = this.getEntityDamage(attacker);
            var armor = this.getEntityArmor(target);
            var damage = Math.max(1, baseDamage - armor);
            return damage;
        },

        getEntityDamage: function(entity) {
            if (entity.weaponLevel) {
                return entity.weaponLevel * 10;
            }
            return 10; // Default damage
        },

        getEntityArmor: function(entity) {
            if (entity.armorLevel) {
                return entity.armorLevel * 5;
            }
            return 0; // No armor
        },

        damageEntity: function(entity, damage, attacker) {
            entity.hitPoints -= damage;
            
            if (entity.hitPoints <= 0) {
                entity.hitPoints = 0;
                this.killEntity(entity, attacker);
            } else {
                // Notify the game client
                this.game.handleDamage(entity, damage);
            }
        },

        killEntity: function(entity, killer) {
            entity.isDead = true;
            
            if (entity === this.player) {
                this.handlePlayerDeath();
            } else if (Types.isMob(entity.kind)) {
                this.handleMobDeath(entity, killer);
            }
        },

        handlePlayerDeath: function() {
            this.game.handlePlayerDeath();
        },

        handleMobDeath: function(mob, killer) {
            // Drop items
            this.dropMobLoot(mob);
            
            // Remove from game
            this.removeEntity(mob);
            
            // Schedule respawn
            setTimeout(function() {
                this.spawnMob(mob.spawningX, mob.spawningY, mob.kind);
            }.bind(this), 30000); // 30 second respawn
        },

        dropMobLoot: function(mob) {
            var dropChance = 0.3; // 30% chance to drop something
            
            if (Math.random() < dropChance) {
                var itemKind = this.getRandomLootItem(mob.kind);
                if (itemKind) {
                    this.spawnItem(mob.x, mob.y, itemKind);
                }
            }
        },

        getRandomLootItem: function(mobKind) {
            var lootTables = {
                [Types.Entities.RAT]: [Types.Entities.FLASK, Types.Entities.CAKE],
                [Types.Entities.SKELETON]: [Types.Entities.SWORD1, Types.Entities.LEATHERARMOR, Types.Entities.FLASK],
                [Types.Entities.GOBLIN]: [Types.Entities.SWORD2, Types.Entities.MAILARMOR, Types.Entities.BURGER],
                [Types.Entities.OGRE]: [Types.Entities.AXE, Types.Entities.PLATEARMOR, Types.Entities.FIREPOTION],
                [Types.Entities.SPECTRE]: [Types.Entities.REDSWORD, Types.Entities.REDARMOR, Types.Entities.FLASK],
                [Types.Entities.CRAB]: [Types.Entities.SWORD1, Types.Entities.LEATHERARMOR],
                [Types.Entities.BAT]: [Types.Entities.FLASK, Types.Entities.CAKE],
                [Types.Entities.WIZARD]: [Types.Entities.BLUESWORD, Types.Entities.MAILARMOR, Types.Entities.FIREPOTION],
                [Types.Entities.EYE]: [Types.Entities.SWORD2, Types.Entities.LEATHERARMOR],
                [Types.Entities.SNAKE]: [Types.Entities.AXE, Types.Entities.MAILARMOR, Types.Entities.BURGER],
                [Types.Entities.SKELETON2]: [Types.Entities.REDSWORD, Types.Entities.PLATEARMOR, Types.Entities.FIREPOTION],
                [Types.Entities.BOSS]: [Types.Entities.GOLDENSWORD, Types.Entities.GOLDENARMOR, Types.Entities.FIREPOTION],
                [Types.Entities.DEATHKNIGHT]: [Types.Entities.MORNINGSTAR, Types.Entities.REDARMOR, Types.Entities.FIREPOTION]
            };
            
            var possibleLoot = lootTables[mobKind] || [Types.Entities.FLASK];
            return possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
        },

        removeEntity: function(entity) {
            delete this.entities[entity.id];
            
            if (Types.isMob(entity.kind)) {
                delete this.mobs[entity.id];
            } else if (Types.isNpc(entity.kind)) {
                delete this.npcs[entity.id];
            } else if (Types.isChest(entity.kind)) {
                delete this.chests[entity.id];
            } else if (Types.isItem(entity.kind)) {
                delete this.items[entity.id];
            }
            
            this.game.removeEntity(entity);
        },

        isValidPosition: function(x, y) {
            if (!this.game.map) return false;
            
            var gridX = Math.floor(x / 16);
            var gridY = Math.floor(y / 16);
            
            return this.game.map.isOutOfBounds(gridX, gridY) === false &&
                   !this.game.map.isColliding(gridX, gridY);
        },

        setPlayer: function(player) {
            this.player = player;
        },

        // Methods to handle player actions
        handlePlayerMove: function(x, y) {
            if (this.player && this.isValidPosition(x, y)) {
                this.player.setPosition(x, y);
                this.game.moveEntity(this.player);
            }
        },

        handlePlayerAttack: function(target) {
            if (!this.player || this.player.isDead) return;
            
            var damage = this.calculateDamage(this.player, target);
            this.damageEntity(target, damage, this.player);
            
            this.player.lastAttackTime = Date.now();
            
            // Notify the game client
            this.game.handleAttack(this.player, target, damage);
        },

        handlePlayerLoot: function(item) {
            if (!this.player || this.player.isDead) return;
            
            try {
                this.player.loot(item);
                this.removeEntity(item);
                this.game.handleLoot(this.player, item);
            } catch (e) {
                // Handle loot exceptions (already have better item, etc.)
                this.game.handleLootError(e.message);
            }
        },

        handlePlayerChat: function(message) {
            // In single player, we can just log the message or show it in a chat log
            this.game.handleChat(this.player, message);
        }
    });

    return SinglePlayerEngine;
});