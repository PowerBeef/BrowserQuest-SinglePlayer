define(['jquery', 'singleplayer-app'], function($, SinglePlayerApp) {
    var app, game;

    var initApp = function() {
        $(document).ready(function() {
        	app = new SinglePlayerApp();
            app.center();
        
            if(Detect.isWindows()) {
                // Workaround for graphical glitches on text
                $('body').addClass('windows');
            }
            
            if(Detect.isOpera()) {
                // Fix for no pointer events
                $('body').addClass('opera');
            }
        
            $('body').click(function(event) {
                if($('#parchment').hasClass('credits')) {
                    app.toggleCredits();
                }
                
                if($('#parchment').hasClass('about')) {
                    app.toggleAbout();
                }
            });
	
        	$('.barbutton').click(function() {
        	    $(this).toggleClass('active');
        	});
	
        	$('#chatbutton').click(function() {
        	    if($('#chatbutton').hasClass('active')) {
        	        app.showChat();
        	    } else {
                    app.hideChat();
        	    }
        	});
	
        	$('#helpbutton').click(function() {
                app.toggleAbout();
        	});
	
        	$('#achievementsbutton').click(function() {
                app.toggleAchievements();
                if(app.blinkInterval) {
                    clearInterval(app.blinkInterval);
                }
                $(this).removeClass('blink');
        	});
	
        	$('#instructions').click(function() {
                app.hideWindows();
        	});
        	
        	$('#playercount').click(function() {
        	    app.togglePopulationInfo();
        	});
        	
        	$('#population').click(function() {
        	    app.togglePopulationInfo();
        	});

        	$('.clickable').click(function(event) {
                event.stopPropagation();
        	});

        	$('#toggle-credits').click(function() {
        	    app.toggleCredits();
        	});

        	$('#create-new span').click(function() {
        	    app.animateParchment('loadcharacter', 'confirmation');
        	});

        	$('.delete').click(function() {
                app.storage.clear();
        	    app.animateParchment('confirmation', 'createcharacter');
        	});

        	$('#cancel span').click(function() {
        	    app.animateParchment('confirmation', 'loadcharacter');
        	});
        	
        	$('.ribbon').click(function() {
        	    app.toggleAbout();
        	});

            $('#nameinput').bind("keyup", function() {
                app.toggleButton();
            });
    
            $('#previous').click(function() {
                var $achievements = $('#achievements');
        
                if(app.currentPage === 1) {
                    return false;
                } else {
                    app.currentPage--;
                    $achievements.removeClass('page' + (app.currentPage + 1)).addClass('page' + app.currentPage);
                }
            });
    
            $('#next').click(function() {
                var $achievements = $('#achievements');
        
                if(app.currentPage === 1) {
                    app.currentPage++;
                    $achievements.removeClass('page' + (app.currentPage - 1)).addClass('page' + app.currentPage);
                }
            });

            // Single-player specific event handlers
            $('#respawn').click(function() {
                app.game.respawnPlayer();
                $('#parchment').removeClass('death');
            });

            // Add keyboard shortcuts for single-player features
            $(document).keydown(function(e) {
                if (app.game && app.game.started) {
                    switch(e.keyCode) {
                        case 83: // S key for stats
                            if (e.ctrlKey) {
                                e.preventDefault();
                                app.showGameStats();
                            }
                            break;
                        case 69: // E key for export save
                            if (e.ctrlKey) {
                                e.preventDefault();
                                app.exportSave();
                            }
                            break;
                    }
                }
            });

            // Add file input for save import
            var fileInput = $('<input type="file" accept=".json" style="display:none">');
            $('body').append(fileInput);
            
            fileInput.change(function() {
                var file = this.files[0];
                if (file) {
                    app.importSave(file);
                }
            });

            // Add import save button (hidden by default, can be shown via console)
            var importButton = $('<button id="import-save" style="display:none">Import Save</button>');
            $('body').append(importButton);
            
            importButton.click(function() {
                fileInput.click();
            });
        });
    };

    var initGame = function() {
        require(['singleplayer-game', 'renderer', 'updater', 'pathfinder', 'audio'], 
        function(SinglePlayerGame, Renderer, Updater, Pathfinder, AudioManager) {
            game = new SinglePlayerGame(app);
            app.setGame(game);
            
            game.setup($('#bubbles'), $('#entities'), $('#background'), $('#foreground'), $('#chatinput'));
            game.setStorage(app.storage);
            
            var renderer = new Renderer(game, $('#entities')[0], $('#background')[0], $('#foreground')[0]);
            var updater = new Updater(game);
            var pathfinder = new Pathfinder(game);
            var audioManager = new AudioManager(game);
            
            game.setRenderer(renderer);
            game.setUpdater(updater);
            game.setPathfinder(pathfinder);
            
            app.initHealthBar();
            
            // Load the game
            game.loadSprites();
            game.loadMap();
            
            // Set up game event handlers
            setupGameHandlers();
        });
    };

    var setupGameHandlers = function() {
        // Handle player movement
        $('#foreground').click(function(event) {
            if (game && game.started && game.player && !game.player.isDead) {
                app.setMouseCoordinates(event);
                var gridX = Math.floor(game.mouse.x / 16);
                var gridY = Math.floor(game.mouse.y / 16);
                
                if (game.map && game.map.isValidPosition(gridX, gridY)) {
                    game.sendMessage([Types.Messages.MOVE, gridX * 16, gridY * 16]);
                }
            }
        });

        // Handle chat input
        $('#chatinput').keydown(function(event) {
            if (event.keyCode === 13) { // Enter key
                var message = $(this).val();
                if (message && message.trim() !== '') {
                    game.sendMessage([Types.Messages.CHAT, message.trim()]);
                    $(this).val('');
                }
            }
        });

        // Handle window resize
        $(window).resize(function() {
            if (game && game.renderer) {
                game.renderer.resize();
            }
        });

        // Handle page visibility change (pause/resume game)
        document.addEventListener('visibilitychange', function() {
            if (game) {
                if (document.hidden) {
                    // Page is hidden, pause game
                    if (game.engine) {
                        game.engine.stop();
                    }
                } else {
                    // Page is visible, resume game
                    if (game.engine) {
                        game.engine.start();
                    }
                }
            }
        });

        // Handle beforeunload (save game state)
        $(window).on('beforeunload', function() {
            if (game && game.started) {
                game.saveGameState();
            }
        });
    };

    // Initialize the application
    initApp();
    
    // Initialize the game after a short delay to ensure DOM is ready
    setTimeout(initGame, 100);

    // Expose app and game globally for debugging
    window.app = app;
    window.game = game;
});