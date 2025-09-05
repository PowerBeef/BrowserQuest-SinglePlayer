define(['player', 'entityfactory', 'lib/bison'], function(Player, EntityFactory, BISON) {

    var SinglePlayerClient = Class.extend({
        init: function(engine) {
            this.engine = engine;
            this.connected_callback = null;
            this.spawn_callback = null;
            this.movement_callback = null;
            this.disconnected_callback = null;
            this.dispatched_callback = null;
            
            this.handlers = [];
            this.handlers[Types.Messages.WELCOME] = this.receiveWelcome;
            this.handlers[Types.Messages.MOVE] = this.receiveMove;
            this.handlers[Types.Messages.LOOTMOVE] = this.receiveLootMove;
            this.handlers[Types.Messages.ATTACK] = this.receiveAttack;
            this.handlers[Types.Messages.SPAWN] = this.receiveSpawn;
            this.handlers[Types.Messages.DESPAWN] = this.receiveDespawn;
            this.handlers[Types.Messages.SPAWN_BATCH] = this.receiveSpawnBatch;
            this.handlers[Types.Messages.HEALTH] = this.receiveHealth;
            this.handlers[Types.Messages.CHAT] = this.receiveChat;
            this.handlers[Types.Messages.EQUIP] = this.receiveEquipItem;
            this.handlers[Types.Messages.DROP] = this.receiveDrop;
            this.handlers[Types.Messages.TELEPORT] = this.receiveTeleport;
            this.handlers[Types.Messages.DAMAGE] = this.receiveDamage;
            this.handlers[Types.Messages.POPULATION] = this.receivePopulation;
            this.handlers[Types.Messages.LIST] = this.receiveList;
            this.handlers[Types.Messages.DESTROY] = this.receiveDestroy;
            this.handlers[Types.Messages.KILL] = this.receiveKill;
            this.handlers[Types.Messages.HP] = this.receiveHitPoints;
            this.handlers[Types.Messages.BLINK] = this.receiveBlink;
        
            this.useBison = false;
            this.isListening = true;
            this.isTimeout = false;
        },
    
        enable: function() {
            this.isListening = true;
        },
    
        disable: function() {
            this.isListening = false;
        },
        
        connect: function(dispatcherMode) {
            log.info("Connecting to single-player engine");
            
            if (dispatcherMode) {
                // Simulate successful connection
                setTimeout(function() {
                    this.dispatched_callback("localhost", 8080);
                }.bind(this), 100);
            } else {
                // Simulate connection success
                setTimeout(function() {
                    if (this.connected_callback) {
                        this.connected_callback();
                    }
                }.bind(this), 100);
            }
        },

        send: function(message) {
            if (!this.isListening) return;
            
            var action = parseInt(message[0]);
            log.debug("Sending message: " + message);
            
            // Handle player actions locally
            switch (action) {
                case Types.Messages.HELLO:
                    this.handleHello(message);
                    break;
                case Types.Messages.MOVE:
                    this.handleMove(message);
                    break;
                case Types.Messages.LOOTMOVE:
                    this.handleLootMove(message);
                    break;
                case Types.Messages.ATTACK:
                    this.handleAttack(message);
                    break;
                case Types.Messages.CHAT:
                    this.handleChat(message);
                    break;
                case Types.Messages.WHO:
                    this.handleWho(message);
                    break;
                case Types.Messages.ZONE:
                    this.handleZone(message);
                    break;
            }
        },

        handleHello: function(message) {
            var name = message[1];
            var armor = message[2];
            var weapon = message[3];
            
            // Create player entity
            var player = new Player("player", name, Types.Entities.WARRIOR);
            player.equipArmor(armor);
            player.equipWeapon(weapon);
            player.setGridPosition(25, 25); // Starting position
            
            this.engine.setPlayer(player);
            
            // Send welcome message
            this.receiveMessage([Types.Messages.WELCOME, player.id, player.name, player.x, player.y, player.hitPoints]);
        },

        handleMove: function(message) {
            var x = message[1];
            var y = message[2];
            this.engine.handlePlayerMove(x, y);
        },

        handleLootMove: function(message) {
            var x = message[1];
            var y = message[2];
            var itemId = message[3];
            
            this.engine.handlePlayerMove(x, y);
            
            // Handle loot
            var item = this.engine.entities[itemId];
            if (item) {
                this.engine.handlePlayerLoot(item);
            }
        },

        handleAttack: function(message) {
            var targetId = message[1];
            var target = this.engine.entities[targetId];
            
            if (target) {
                this.engine.handlePlayerAttack(target);
            }
        },

        handleChat: function(message) {
            var msg = message[1];
            this.engine.handlePlayerChat(msg);
        },

        handleWho: function(message) {
            // Send spawn messages for all entities
            _.each(this.engine.entities, function(entity) {
                if (entity && entity.id !== "player") {
                    this.receiveSpawn(entity);
                }
            }, this);
        },

        handleZone: function(message) {
            // Handle zone changes (if needed)
            if (this.zone_callback) {
                this.zone_callback();
            }
        },

        receiveMessage: function(message) {
            if (!this.isListening) return;
            
            var action = parseInt(message[0]);
            var handler = this.handlers[action];
            
            if (handler) {
                handler.call(this, message);
            } else {
                log.error("No handler for message type: " + action);
            }
        },

        // Message handlers (simplified for single-player)
        receiveWelcome: function(message) {
            log.info("Welcome to single-player mode");
        },

        receiveMove: function(message) {
            // Handle entity movement
            var id = message[1];
            var x = message[2];
            var y = message[3];
            
            var entity = this.engine.entities[id];
            if (entity) {
                entity.setPosition(x, y);
                if (this.movement_callback) {
                    this.movement_callback(entity);
                }
            }
        },

        receiveLootMove: function(message) {
            this.receiveMove(message);
        },

        receiveAttack: function(message) {
            // Handle attack animations/effects
            var attackerId = message[1];
            var targetId = message[2];
            
            if (this.attack_callback) {
                this.attack_callback(attackerId, targetId);
            }
        },

        receiveSpawn: function(message) {
            var entity;
            
            if (typeof message === 'object' && message.id) {
                // Direct entity object
                entity = message;
            } else {
                // Message array
                var id = message[1];
                var kind = message[2];
                var x = message[3];
                var y = message[4];
                
                entity = EntityFactory.createEntity(id, kind);
                if (entity) {
                    entity.setGridPosition(x, y);
                }
            }
            
            if (entity && this.spawn_callback) {
                this.spawn_callback(entity);
            }
        },

        receiveDespawn: function(message) {
            var id = message[1];
            if (this.despawn_callback) {
                this.despawn_callback(id);
            }
        },

        receiveSpawnBatch: function(message) {
            // Handle batch spawns
            var entities = message[1];
            _.each(entities, function(entityData) {
                this.receiveSpawn(entityData);
            }, this);
        },

        receiveHealth: function(message) {
            var id = message[1];
            var hitPoints = message[2];
            
            var entity = this.engine.entities[id];
            if (entity) {
                entity.hitPoints = hitPoints;
                if (this.health_callback) {
                    this.health_callback(entity);
                }
            }
        },

        receiveChat: function(message) {
            var id = message[1];
            var msg = message[2];
            
            if (this.chat_callback) {
                this.chat_callback(id, msg);
            }
        },

        receiveEquipItem: function(message) {
            var id = message[1];
            var itemKind = message[2];
            
            var entity = this.engine.entities[id];
            if (entity && entity.equip) {
                entity.equip(itemKind);
            }
        },

        receiveDrop: function(message) {
            var id = message[1];
            var itemKind = message[2];
            var x = message[3];
            var y = message[4];
            
            this.engine.spawnItem(x, y, itemKind);
        },

        receiveTeleport: function(message) {
            var id = message[1];
            var x = message[2];
            var y = message[3];
            
            var entity = this.engine.entities[id];
            if (entity) {
                entity.setGridPosition(x, y);
                if (this.teleport_callback) {
                    this.teleport_callback(entity);
                }
            }
        },

        receiveDamage: function(message) {
            var id = message[1];
            var damage = message[2];
            
            var entity = this.engine.entities[id];
            if (entity) {
                entity.hitPoints -= damage;
                if (this.damage_callback) {
                    this.damage_callback(entity, damage);
                }
            }
        },

        receivePopulation: function(message) {
            var count = message[1];
            if (this.population_callback) {
                this.population_callback(count);
            }
        },

        receiveList: function(message) {
            // Handle entity lists
            if (this.list_callback) {
                this.list_callback(message);
            }
        },

        receiveDestroy: function(message) {
            var id = message[1];
            if (this.destroy_callback) {
                this.destroy_callback(id);
            }
        },

        receiveKill: function(message) {
            var mobKind = message[1];
            if (this.kill_callback) {
                this.kill_callback(mobKind);
            }
        },

        receiveHitPoints: function(message) {
            var maxHitPoints = message[1];
            if (this.hitpoints_callback) {
                this.hitpoints_callback(maxHitPoints);
            }
        },

        receiveBlink: function(message) {
            var id = message[1];
            if (this.blink_callback) {
                this.blink_callback(id);
            }
        },

        // Callback setters
        onConnected: function(callback) {
            this.connected_callback = callback;
        },

        onDisconnected: function(callback) {
            this.disconnected_callback = callback;
        },

        onSpawn: function(callback) {
            this.spawn_callback = callback;
        },

        onDespawn: function(callback) {
            this.despawn_callback = callback;
        },

        onMove: function(callback) {
            this.movement_callback = callback;
        },

        onAttack: function(callback) {
            this.attack_callback = callback;
        },

        onHealth: function(callback) {
            this.health_callback = callback;
        },

        onChat: function(callback) {
            this.chat_callback = callback;
        },

        onTeleport: function(callback) {
            this.teleport_callback = callback;
        },

        onDamage: function(callback) {
            this.damage_callback = callback;
        },

        onPopulation: function(callback) {
            this.population_callback = callback;
        },

        onList: function(callback) {
            this.list_callback = callback;
        },

        onDestroy: function(callback) {
            this.destroy_callback = callback;
        },

        onKill: function(callback) {
            this.kill_callback = callback;
        },

        onHitPoints: function(callback) {
            this.hitpoints_callback = callback;
        },

        onBlink: function(callback) {
            this.blink_callback = callback;
        },

        onZone: function(callback) {
            this.zone_callback = callback;
        }
    });

    return SinglePlayerClient;
});