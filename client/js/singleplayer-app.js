define(['jquery', 'enhanced-storage'], function($, EnhancedStorage) {

    var SinglePlayerApp = Class.extend({
        init: function() {
            this.currentPage = 1;
            this.blinkInterval = null;
            this.previousState = null;
            this.isParchmentReady = true;
            this.ready = false;
            this.storage = new EnhancedStorage();
            this.watchNameInputInterval = setInterval(this.toggleButton.bind(this), 100);
            this.$playButton = $('.play'),
            this.$playDiv = $('.play div');
        },
        
        setGame: function(game) {
            this.game = game;
            this.isMobile = this.game.renderer.mobile;
            this.isTablet = this.game.renderer.tablet;
            this.isDesktop = !(this.isMobile || this.isTablet);
            this.supportsWorkers = !!window.Worker;
            this.ready = true;
        },
    
        center: function() {
            window.scrollTo(0, 1);
        },
        
        canStartGame: function() {
            if(this.isDesktop) {
                return (this.game && this.game.map && this.game.map.isLoaded);
            } else {
                return this.game;
            }
        },
        
        tryStartingGame: function(username, starting_callback) {
            var self = this,
                $play = this.$playButton;
            
            if(username !== '') {
                if(!this.ready || !this.canStartGame()) {
                    if(!this.isMobile) {
                        // on desktop and tablets, add a spinner to the play button
                        $play.addClass('loading');
                    }
                    this.$playDiv.unbind('click');
                    var watchCanStart = setInterval(function() {
                        log.debug("waiting...");
                        if(self.canStartGame()) {
                            setTimeout(function() {
                                if(!self.isMobile) {
                                    $play.removeClass('loading');
                                }
                            }, 1500);
                            clearInterval(watchCanStart);
                            self.startGame(username, starting_callback);
                        }
                    }, 100);
                } else {
                    this.$playDiv.unbind('click');
                    this.startGame(username, starting_callback);
                }      
            }
        },
        
        startGame: function(username, starting_callback) {
            var self = this;
            
            if(starting_callback) {
                starting_callback();
            }
            this.hideIntro(function() {
                if(!self.isDesktop) {
                    // On mobile and tablet we load the map after the player has clicked
                    // on the PLAY button instead of loading it in a web worker.
                    self.game.loadMap();
                }
                self.start(username);
            });
        },

        start: function(username) {
            var self = this,
                firstTimePlaying = !self.storage.hasAlreadyPlayed();
            
            if(username && !this.game.started) {
                // Initialize player in storage
                self.storage.initPlayer(username);
                
                // Set up auto-save
                self.storage.startAutoSave();
                self.game.startAutoSave();
                
                this.center();
                this.game.run(function() {
                    $('body').addClass('started');
                	if(firstTimePlaying) {
                	    self.toggleInstructions();
                	}
            	});
            }
        },

        setMouseCoordinates: function(event) {
            var gamePos = $('#container').offset(),
                scale = this.game.renderer.getScaleFactor(),
                width = this.game.renderer.getWidth(),
                height = this.game.renderer.getHeight(),
                mouse = this.game.mouse;

            mouse.x = event.pageX - gamePos.left - (this.isMobile ? 0 : 5 * scale);
        	mouse.y = event.pageY - gamePos.top - (this.isMobile ? 0 : 7 * scale);

        	if(mouse.x <= 0) {
        	    mouse.x = 0;
        	} else if(mouse.x >= width) {
        	    mouse.x = width - 1;
        	}

        	if(mouse.y <= 0) {
        	    mouse.y = 0;
        	} else if(mouse.y >= height) {
        	    mouse.y = height - 1;
        	}
        },

        initHealthBar: function() {
            var scale = this.game.renderer.getScaleFactor(),
                healthMaxWidth = $("#healthbar").width() - (12 * scale);

        	this.game.onPlayerHealthChange(function(hp, maxHp) {
        	    var barWidth = Math.round((healthMaxWidth / maxHp) * (hp > 0 ? hp : 0));
        	    $("#hitpoints").css('width', barWidth + "px");
        	});

        	this.game.onPlayerHurt(this.blinkHealthBar.bind(this));
        },

        blinkHealthBar: function() {
            var $hitpoints = $('#hitpoints');

            $hitpoints.addClass('white');
            setTimeout(function() {
                $hitpoints.removeClass('white');
            }, 500)
        },

        toggleButton: function() {
            var name = $('#parchment input').val(),
                $play = $('#createcharacter .play');
    
            if(name && name.length > 0) {
                $play.removeClass('disabled');
                $('#character').removeClass('disabled');
            } else {
                $play.addClass('disabled');
                $('#character').addClass('disabled');
            }
        },

        hideIntro: function(hidden_callback) {
            clearInterval(this.watchNameInputInterval);
            $('body').removeClass('intro');
            setTimeout(function() {
                $('body').addClass('game');
                hidden_callback();
            }, 1000);
        },

        showChat: function() {
            if(this.game.started) {
                $('#chatbox').addClass('active');
                $('#chatinput').focus();
                $('#chatbutton').addClass('active');
            }
        },

        hideChat: function() {
            if(this.game.started) {
                $('#chatbox').removeClass('active');
                $('#chatinput').blur();
                $('#chatbutton').removeClass('active');
            }
        },

        toggleInstructions: function() {
            $('#instructions').addClass('active');
        },

        hideWindows: function() {
            $('#instructions').removeClass('active');
            $('#achievements').removeClass('active');
        },

        toggleAchievements: function() {
            var $achievements = $('#achievements');
            
            if($achievements.hasClass('active')) {
                this.hideWindows();
            } else {
                this.hideWindows();
                this.loadAchievements();
                $achievements.addClass('active');
            }
        },

        loadAchievements: function() {
            var self = this,
                $lists = $('#lists'),
                achievements = this.game.achievements,
                unlockedCount = 0,
                totalCount = 0;

            $lists.empty();

            _.each(achievements, function(achievement, key) {
                totalCount++;
                var isUnlocked = self.storage.hasUnlockedAchievement(achievement.id);
                if(isUnlocked) {
                    unlockedCount++;
                }

                var $achievement = $('<li>').addClass(isUnlocked ? 'unlocked' : 'locked');
                $achievement.html(
                    '<div class="coin"></div>' +
                    '<span class="achievement-name">' + achievement.name + '</span>' +
                    '<span class="achievement-description">' + achievement.desc + '</span>'
                );

                $lists.append($achievement);
            });

            $('#unlocked-achievements').text(unlockedCount);
            $('#total-achievements').text(totalCount);
        },

        togglePopulationInfo: function() {
            $('#population').toggleClass('active');
        },

        toggleCredits: function() {
            var $parchment = $('#parchment');
            
            if($parchment.hasClass('credits')) {
                $parchment.removeClass('credits');
            } else {
                this.hideWindows();
                $parchment.addClass('credits');
            }
        },

        toggleAbout: function() {
            var $parchment = $('#parchment');
            
            if($parchment.hasClass('about')) {
                $parchment.removeClass('about');
            } else {
                this.hideWindows();
                $parchment.addClass('about');
            }
        },

        animateParchment: function(from, to) {
            var $parchment = $('#parchment');
            
            $parchment.removeClass(from).addClass(to);
        },

        // Single-player specific methods
        showGameStats: function() {
            var stats = this.storage.getStatistics();
            var achievements = this.storage.data.achievements;
            
            var statsHtml = '<div class="game-stats">' +
                '<h3>Game Statistics</h3>' +
                '<p>Total Play Time: ' + this.formatTime(achievements.timePlayed) + '</p>' +
                '<p>Total Kills: ' + achievements.totalKills + '</p>' +
                '<p>Total Gold: ' + achievements.totalGold + '</p>' +
                '<p>Items Looted: ' + achievements.itemsLooted + '</p>' +
                '<p>Deaths: ' + stats.deaths + '</p>' +
                '<p>Areas Explored: ' + stats.areasExplored.length + '</p>' +
                '</div>';
            
            // Show stats in a modal or overlay
            this.showModal('Game Statistics', statsHtml);
        },

        formatTime: function(milliseconds) {
            var seconds = Math.floor(milliseconds / 1000);
            var minutes = Math.floor(seconds / 60);
            var hours = Math.floor(minutes / 60);
            
            if (hours > 0) {
                return hours + 'h ' + (minutes % 60) + 'm';
            } else if (minutes > 0) {
                return minutes + 'm ' + (seconds % 60) + 's';
            } else {
                return seconds + 's';
            }
        },

        showModal: function(title, content) {
            var modalHtml = '<div class="modal-overlay">' +
                '<div class="modal">' +
                '<div class="modal-header">' +
                '<h2>' + title + '</h2>' +
                '<button class="modal-close">&times;</button>' +
                '</div>' +
                '<div class="modal-content">' + content + '</div>' +
                '</div>' +
                '</div>';
            
            $('body').append(modalHtml);
            
            $('.modal-close, .modal-overlay').click(function() {
                $('.modal-overlay').remove();
            });
        },

        exportSave: function() {
            var saveData = this.storage.exportSave();
            var blob = new Blob([saveData], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            
            var a = document.createElement('a');
            a.href = url;
            a.download = 'browserquest-save.json';
            a.click();
            
            URL.revokeObjectURL(url);
        },

        importSave: function(file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var success = this.storage.importSave(e.target.result);
                if (success) {
                    alert('Save imported successfully! Please refresh the page.');
                } else {
                    alert('Failed to import save file. Please check the file format.');
                }
            }.bind(this);
            reader.readAsText(file);
        },

        // Cleanup method
        destroy: function() {
            if (this.storage) {
                this.storage.stopAutoSave();
            }
            if (this.game) {
                this.game.stopAutoSave();
            }
            if (this.watchNameInputInterval) {
                clearInterval(this.watchNameInputInterval);
            }
        }
    });

    return SinglePlayerApp;
});