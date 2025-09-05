define(['infomanager', 'bubble', 'renderer', 'map', 'animation', 'sprite', 'tile',
        'warrior', 'singleplayer-client', 'singleplayer-engine', 'enhanced-mob', 'audio', 'updater', 'transition', 'pathfinder',
        'item', 'mob', 'npc', 'player', 'character', 'chest', 'mobs', 'exceptions', 'config', '../../shared/js/gametypes'],
function(InfoManager, BubbleManager, Renderer, Map, Animation, Sprite, AnimatedTile,
         Warrior, SinglePlayerClient, SinglePlayerEngine, EnhancedMob, AudioManager, Updater, Transition, Pathfinder,
         Item, Mob, Npc, Player, Character, Chest, Mobs, Exceptions, config) {
    
    var SinglePlayerGame = Class.extend({
        init: function(app) {
            this.app = app;
            this.app.config = config;
            this.ready = false;
            this.started = false;
            this.hasNeverStarted = true;
        
            this.renderer = null;
            this.updater = null;
            this.pathfinder = null;
            this.chatinput = null;
            this.bubbleManager = null;
            this.audioManager = null;
        
            // Player
            this.player = new Warrior("player", "");
    
            // Game state
            this.entities = {};
            this.deathpositions = {};
            this.entityGrid = null;
            this.pathingGrid = null;
            this.renderingGrid = null;
            this.itemGrid = null;
            this.currentCursor = null;
            this.mouse = { x: 0, y: 0 };
            this.zoningQueue = [];
            this.previousClickPosition = {};
    
            this.selectedX = 0;
            this.selectedY = 0;
            this.selectedCellVisible = false;
            this.targetColor = "rgba(255, 255, 255, 0.5)";
            this.targetCellVisible = true;
            this.hoveringTarget = false;
            this.hoveringMob = false;
            this.hoveringItem = false;
            this.hoveringCollidingTile = false;
        
            // combat
            this.infoManager = new InfoManager(this);
        
            // zoning
            this.currentZoning = null;
        
            this.cursors = {};
            this.sprites = {};
        
            // tile animation
            this.animatedTiles = null;
        
            // debug
            this.debugPathing = false;
        
            // Single-player specific
            this.engine = null;
            this.client = null;
            this.isSinglePlayer = true;
        
            // sprites
            this.spriteNames = ["hand", "sword", "loot", "target", "talk", "sparks", "shadow16", "rat", "skeleton", "skeleton2", "spectre", "boss", "deathknight", 
                                "ogre", "crab", "snake", "eye", "bat", "goblin", "wizard", "guard", "king", "villagegirl", "villager", "coder", "agent", "rick", "scientist", "nyan", "priest", 
                                "sorcerer", "octocat", "beachnpc", "forestnpc", "desertnpc", "lavanpc", "clotharmor", "leatherarmor", "mailarmor", 
                                "platearmor", "redarmor", "goldenarmor", "firefox", "death", "sword1", "axe", "chest",
                                "sword2", "redsword", "bluesword", "goldensword", "item-sword2", "item-axe", "item-redsword", "item-bluesword", "item-goldensword", "item-leatherarmor", "item-mailarmor", 
                                "item-platearmor", "item-redarmor", "item-goldenarmor", "item-flask", "item-cake", "item-burger", "morningstar", "item-morningstar", "item-firepotion"];
        },
    
        setup: function($bubbleContainer, canvas, background, foreground, input) {
    		this.setBubbleManager(new BubbleManager($bubbleContainer));
    		this.setRenderer(new Renderer(this, canvas, background, foreground));
    		this.setChatInput(input);
        },
        
        setStorage: function(storage) {
            this.storage = storage;
        },
    
        setRenderer: function(renderer) {
            this.renderer = renderer;
        },

        setUpdater: function(updater) {
            this.updater = updater;
        },
    
        setPathfinder: function(pathfinder) {
            this.pathfinder = pathfinder;
        },
    
        setChatInput: function(element) {
            this.chatinput = element;
        },
    
        setBubbleManager: function(bubbleManager) {
            this.bubbleManager = bubbleManager;
        },

        loadMap: function() {
            var self = this;
    
            this.map = new Map(!this.renderer.upscaledRendering, this);
    
        	this.map.ready(function() {
                log.info("Map loaded.");
                var tilesetIndex = self.renderer.upscaledRendering ? 0 : self.renderer.scale - 1;
                self.renderer.setTileset(self.map.tilesets[tilesetIndex]);
                
                // Initialize single-player engine after map is loaded
                self.initSinglePlayerEngine();
        	});
        },

        initSinglePlayerEngine: function() {
            // Initialize the single-player engine
            this.engine = new SinglePlayerEngine(this);
            
            // Initialize the single-player client
            this.client = new SinglePlayerClient(this.engine);
            
            // Set up client callbacks
            this.setupClientCallbacks();
            
            log.info("Single-player engine initialized");
        },

        setupClientCallbacks: function() {
            var self = this;
            
            this.client.onSpawn(function(entity) {
                self.addEntity(entity);
            });
            
            this.client.onDespawn(function(id) {
                self.removeEntity(id);
            });
            
            this.client.onMove(function(entity) {
                self.moveEntity(entity);
            });
            
            this.client.onAttack(function(attackerId, targetId) {
                self.handleAttackAnimation(attackerId, targetId);
            });
            
            this.client.onHealth(function(entity) {
                self.updateEntityHealth(entity);
            });
            
            this.client.onChat(function(id, message) {
                self.handleChatMessage(id, message);
            });
            
            this.client.onDamage(function(entity, damage) {
                self.handleDamageEffect(entity, damage);
            });
            
            this.client.onKill(function(mobKind) {
                self.handleMobKill(mobKind);
            });
            
            this.client.onPopulation(function(count) {
                self.updatePopulationDisplay(count);
            });
        },
    
        initPlayer: function() {
            if(this.storage.hasAlreadyPlayed()) {
                this.player.setSpriteName(this.storage.data.player.armor);
                this.player.setWeaponName(this.storage.data.player.weapon);
                
                // Restore player position
                var savedPos = this.storage.getPlayerPosition();
                if (savedPos) {
                    this.player.setGridPosition(savedPos.x, savedPos.y);
                }
                
                // Restore player health
                var health = this.storage.getPlayerHealth();
                if (health) {
                    this.player.hitPoints = health.hitPoints;
                    this.player.maxHitPoints = health.maxHitPoints;
                }
            }
        
        	this.player.setSprite(this.sprites[this.player.getSpriteName()]);
        	this.player.idle();
        
    	    log.debug("Finished initPlayer");
        },

        initShadows: function() {
            this.shadows = {};
            this.shadows["small"] = this.sprites["shadow16"];
        },

        initCursors: function() {
            this.cursors["hand"] = this.sprites["hand"];
            this.cursors["sword"] = this.sprites["sword"];
            this.cursors["loot"] = this.sprites["loot"];
            this.cursors["target"] = this.sprites["target"];
            this.cursors["arrow"] = this.sprites["arrow"];
            this.cursors["talk"] = this.sprites["talk"];
        },
    
        initAnimations: function() {
            this.targetAnimation = new Animation("idle_down", 4, 0, 16, 16);
            this.targetAnimation.setSpeed(50);
        
            this.sparksAnimation = new Animation("idle_down", 6, 0, 16, 16);
            this.sparksAnimation.setSpeed(120);
        },
    
        initHurtSprites: function() {
            var self = this;
        
            Types.forEachArmorKind(function(kind, kindName) {
                self.sprites[kindName].createHurtSprite();
            });
        },
    
        initSilhouettes: function() {
            var self = this;

            Types.forEachMobOrNpcKind(function(kind, kindName) {
                self.sprites[kindName].createSilhouette();
            });
            this.sprites["chest"].createSilhouette();
            this.sprites["item-cake"].createSilhouette();
        },
    
        initAchievements: function() {
            var self = this;
        
            this.achievements = {
                A_TRUE_WARRIOR: {
                    id: 1,
                    name: "A True Warrior",
                    desc: "Find a new weapon"
                },
                INTO_THE_WILD: {
                    id: 2,
                    name: "Into the Wild",
                    desc: "Venture outside the village"
                },
                ANGRY_RATS: {
                    id: 3,
                    name: "Angry Rats",
                    desc: "Kill 10 rats",
                    isCompleted: function() {
                        return self.storage.getRatCount() >= 10;
                    }
                },
                SMALL_TALK: {
                    id: 4,
                    name: "Small Talk",
                    desc: "Talk to a non-player character"
                },
                FAT_LOOT: {
                    id: 5,
                    name: "Fat Loot",
                    desc: "Get a new armor set"
                },
                UNDERGROUND: {
                    id: 6,
                    name: "Underground",
                    desc: "Find the entrance to the cave"
                },
                SKULL_COLLECTOR: {
                    id: 7,
                    name: "Skull Collector",
                    desc: "Kill 10 skeletons",
                    isCompleted: function() {
                        return self.storage.getSkeletonCount() >= 10;
                    }
                },
                MEATSHIELD: {
                    id: 8,
                    name: "Meatshield",
                    desc: "Take 5000 damage",
                    isCompleted: function() {
                        return self.storage.getTotalDamageTaken() >= 5000;
                    }
                },
                HUNTER: {
                    id: 9,
                    name: "Hunter",
                    desc: "Kill 50 monsters",
                    isCompleted: function() {
                        return self.storage.getTotalKills() >= 50;
                    }
                },
                STILL_ALIVE: {
                    id: 10,
                    name: "Still Alive",
                    desc: "Die 5 times",
                    isCompleted: function() {
                        return self.storage.getTotalRevives() >= 5;
                    }
                }
            };
        },

        // Single-player specific methods
        setServerOptions: function(host, port, username) {
            // In single-player mode, we don't need server options
            // but we keep this method for compatibility
            log.info("Single-player mode: ignoring server options");
        },

        connect: function() {
            if (this.client) {
                this.client.connect(false);
            }
        },

        sendMessage: function(message) {
            if (this.client) {
                this.client.send(message);
            }
        },

        // Entity management
        addEntity: function(entity) {
            this.entities[entity.id] = entity;
            
            if (entity.setSprite && this.sprites[entity.getSpriteName()]) {
                entity.setSprite(this.sprites[entity.getSpriteName()]);
            }
            
            if (this.renderer) {
                this.renderer.addEntity(entity);
            }
        },

        removeEntity: function(entityOrId) {
            var id = typeof entityOrId === 'string' ? entityOrId : entityOrId.id;
            var entity = this.entities[id];
            
            if (entity) {
                delete this.entities[id];
                
                if (this.renderer) {
                    this.renderer.removeEntity(entity);
                }
            }
        },

        moveEntity: function(entity) {
            if (this.renderer) {
                this.renderer.moveEntity(entity);
            }
        },

        // Game event handlers
        handleAttack: function(attacker, target, damage) {
            // Handle attack effects, animations, etc.
            if (this.renderer) {
                this.renderer.showAttackEffect(attacker, target);
            }
            
            // Update damage display
            if (target === this.player) {
                this.updatePlayerHealth();
            }
        },

        handleDamage: function(entity, damage) {
            if (entity === this.player) {
                this.storage.addDamage(damage);
                this.updatePlayerHealth();
            }
        },

        handlePlayerDeath: function() {
            this.storage.recordDeath();
            this.storage.recordRespawn();
            
            // Show death screen
            this.showDeathScreen();
        },

        handleLoot: function(player, item) {
            // Add item to inventory
            this.storage.addToInventory(item);
            
            // Update achievements
            this.checkLootAchievements(item);
            
            // Show loot notification
            this.showLootNotification(item);
        },

        handleLootError: function(message) {
            // Show error message to player
            this.showNotification(message, 'error');
        },

        handleChat: function(player, message) {
            // Handle chat messages (in single-player, just log them)
            log.info("Player chat: " + message);
        },

        handleAttackAnimation: function(attackerId, targetId) {
            var attacker = this.entities[attackerId];
            var target = this.entities[targetId];
            
            if (attacker && target && this.renderer) {
                this.renderer.showAttackEffect(attacker, target);
            }
        },

        handleDamageEffect: function(entity, damage) {
            if (this.renderer) {
                this.renderer.showDamageEffect(entity, damage);
            }
        },

        handleMobKill: function(mobKind) {
            var mobName = Types.getKindAsString(mobKind);
            this.storage.recordMobKill(mobKind);
            
            // Update specific mob counters
            if (mobKind === Types.Entities.RAT) {
                this.storage.incrementRatCount();
            } else if (mobKind === Types.Entities.SKELETON || mobKind === Types.Entities.SKELETON2) {
                this.storage.incrementSkeletonCount();
            }
            
            // Check achievements
            this.checkKillAchievements();
        },

        handleChatMessage: function(id, message) {
            // Handle chat messages
            if (this.bubbleManager) {
                var entity = this.entities[id];
                if (entity) {
                    this.bubbleManager.createBubble(entity, message);
                }
            }
        },

        updateEntityHealth: function(entity) {
            if (entity === this.player) {
                this.updatePlayerHealth();
            }
        },

        updatePlayerHealth: function() {
            if (this.renderer) {
                this.renderer.updateHealthBar(this.player.hitPoints, this.player.maxHitPoints);
            }
        },

        updatePopulationDisplay: function(count) {
            // In single-player, population is always 1
            if (this.renderer) {
                this.renderer.updatePopulationDisplay(1);
            }
        },

        // Achievement checking
        checkLootAchievements: function(item) {
            if (Types.isWeapon(item.kind)) {
                this.checkAchievement('A_TRUE_WARRIOR');
            } else if (Types.isArmor(item.kind)) {
                this.checkAchievement('FAT_LOOT');
            }
        },

        checkKillAchievements: function() {
            this.checkAchievement('ANGRY_RATS');
            this.checkAchievement('SKULL_COLLECTOR');
            this.checkAchievement('HUNTER');
        },

        checkAchievement: function(achievementId) {
            var achievement = this.achievements[achievementId];
            if (achievement && !this.storage.hasUnlockedAchievement(achievement.id)) {
                if (!achievement.isCompleted || achievement.isCompleted()) {
                    this.storage.unlockAchievement(achievement.id);
                    this.showAchievementNotification(achievement);
                }
            }
        },

        showAchievementNotification: function(achievement) {
            if (this.renderer) {
                this.renderer.showAchievementNotification(achievement);
            }
        },

        showLootNotification: function(item) {
            if (this.renderer) {
                this.renderer.showLootNotification(item);
            }
        },

        showNotification: function(message, type) {
            if (this.renderer) {
                this.renderer.showNotification(message, type);
            }
        },

        showDeathScreen: function() {
            // Show death/respawn screen
            $('#parchment').removeClass().addClass('death');
        },

        // Save game state
        saveGameState: function() {
            if (this.player) {
                this.storage.setPlayerPosition(this.player.gridX, this.player.gridY);
                this.storage.setPlayerHealth(this.player.hitPoints, this.player.maxHitPoints);
                this.storage.save();
            }
        },

        // Auto-save functionality
        startAutoSave: function() {
            var self = this;
            this.autoSaveInterval = setInterval(function() {
                self.saveGameState();
            }, 30000); // Save every 30 seconds
        },

        stopAutoSave: function() {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
        }
    });

    return SinglePlayerGame;
});