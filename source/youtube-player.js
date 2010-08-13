/**
 * Provides a skinnable UI for playing Youtube videos by ID.
 * Requires Ojay and SWFObject version 2.0.
 * @constructor
 * @class YoutubePlayer
 */
var YoutubePlayer = new JS.Class({
    include: [Ojay.Observable, JS.State],
    
    /**
     * @param {String} videoId
     * @param {String} elementId
     */
    initialize: function(videoId, elementId, options) {
        this._videoId   = videoId;
        this._elementId = elementId;
        this._options   = options || {};
        
        this._options.skipTime    = options.skipTime    || this.klass.SKIP_TIME;
        this._options.volumeSteps = options.volumeSteps || this.klass.VOLUME_STEPS;
        
        this.klass._register(this);
        
        var elements = this._elements = {};
        Ojay.byId(this._elementId).insert(this.getHTML(), 'after');
        
        this._embed();
        this._setupProgressSlider();
        
        this.on('playing', function(player) {
            player.klass._playing(player);
            player.setState('PLAYING');
            player._elements._playButton.removeClass('play').addClass('pause').setContent('Pause');
        });
        
        this.on('paused', function(player) {
            player.setState('PAUSED');
            player._elements._playButton.removeClass('pause').addClass('play').setContent('Play');
        });
    },
    
    /**
     * Instantiates a flash video player in the correct element.
     * @returns {YoutubePlayer}
     */
    _embed: function() {
        var url = this.klass.getPlayerURL(this._elementId);
        if (url === null) return null;
        
        var element = Ojay.byId(this._elementId), width = element.getWidth();
        if (!this.klass.hasAcceptableFlash()) element.insert(this.klass._getFlashWarning(), 'before');
        
        swfobject.embedSWF( url, escape(this._elementId),
                            width, this._options.height || width / this.klass.ASPECT_RATIO,
                            this.klass.FLASH_VERSION,
                            null, null,
                            {allowScriptAccess: 'always', wmode: 'transparent'});
        return this;
    },
    
    /**
     * Returns an Ojay collection containing the HTML elements used for the UI.
     * @returns {DomCollection}
     */
    getHTML: function() {
        var elements = this._elements, self = this;
        if (elements._container) return elements._container;
        elements._container = Ojay(Ojay.HTML.div({className: 'youtube-controls'}, function(C) {
            C.h3({className: 'controls-header'}, 'Video player controls');
            
            elements._playButton = Ojay(C.button({className: 'play-pause'}, 'Play'));
            
            C.div({className: 'progress-controls'}, function(P) {
                elements._time = Ojay(P.div({className: 'time'}));
                elements._skipBack = Ojay(P.button({className: 'skip-back'}, 'Skip back'));
                P.concat(self.getProgressSliderElement().node);
                elements._skipForward = Ojay(P.button({className: 'skip-forwards'}, 'Skip forwards'));
            });
            
            C.div({className: 'volume-controls'}, function(V) {
                elements._volumeDownButton = Ojay(V.button({className: 'volume-down'}, 'Lower volume'));
                V.concat(self.getVolumeSteps().node);
                elements._volumeUpButton = Ojay(V.button({className: 'volume-up'}, 'Raise volume'));
            });
        }));
        
        elements._playButton.on('click')._(this).toggle();
        
        elements._skipBack.on('click', Ojay.stopDefault)._(this).skip(-this.klass.SKIP_TIME);
        elements._skipForward.on('click', Ojay.stopDefault)._(this).skip(this.klass.SKIP_TIME);
        
        elements._volumeDownButton.on('click', Ojay.stopDefault)._(this).decreaseVolume();
        elements._volumeUpButton.on('click', Ojay.stopDefault)._(this).increaseVolume();
        
        return elements._container;
    },
    
    /**
     * Returns HTML elements required to implement a slider.
     * @returns {DomCollection}
     */
    getProgressSliderElement: function() {
        var elements = this._elements;
        return elements._progressSlider = Ojay( Ojay.HTML.div({className: 'progress-slider'}, function(HTML) {
            elements._progressSliderThumb = Ojay( HTML.div({className: 'thumb'}) );
        }) );
    },
    
    /**
     */
    _setupProgressSlider: function() {
        var elements    = this._elements,
            thumbWidth  = elements._progressSliderThumb.getWidth(),
            sliderWidth = elements._progressSlider.getWidth();
        
        var limit = this._progressSliderLimit = sliderWidth - thumbWidth;
        this._progressSlider = YAHOO.widget.Slider.getHorizSlider(elements._progressSlider.node,
                elements._progressSliderThumb.node, 0, this._progressSliderLimit);
        
        this._progressBar = Ojay(Ojay.HTML.div({className: 'progress-bar', style: {width: 0}}));
        Ojay(this._progressSlider.getEl()).insert(this._progressBar, 'before');
        
        this._thumbWidth = thumbWidth;
        
        var player = this._getPlayer(), self = this;
        this._progressSlider.subscribe('change', function(value) {
            self.setCompletion(value / limit);
        });
    },
    
    /**
     * Sets the percentage completion of the video.
     * @param {Number} offset
     * @returns {YoutubePlayer}
     */
    setCompletion: function(offset) {
        var player = this._getPlayer();
        player.seekTo(offset * player.getDuration(), true);
        return this;
    },
    
    /**
     * Skips forward or back in time by the specified nubmer of seconds.
     * Providing a negative number skips back.
     */
    skip: function(offset) {
        var player   = this._getPlayer(),
            time     = player.getCurrentTime(),
            skipTime = time + offset;
        
        if (skipTime < 0) {
            skipTime = 0;
        } else if (skipTime > (duration = player.getDuration())) {
            skipTime = duration - 5;
        }
        
        player.seekTo(skipTime);
        return this;
    },
    
    getVolumeSteps: function() {
        if (this._elements._volumeSteps) return this._elements._volumeSteps;
        
        var elements = this._elements,
            numSteps = this._options.volumeSteps,
            step     = 100 / numSteps,
            self     = this;
        
        if (numSteps < 1) numSteps = 1;
        
        return elements._volumeSteps = Ojay(Ojay.HTML.div({className: 'volume-steps steps-' + numSteps}, function(V) {
            var stepAmount, ctrl, i;
            
            for (i = 1; i <= numSteps; i++) {
                stepAmount = 100 / numSteps * i;
                elements['_stepControl' + i] = ctrl = Ojay(V.span({className: 'step step-' + i}));
                ctrl.on('click')._(self).setVolume(stepAmount);
            }
        }));
    },
    
    /**
     * Sets the volume as a percentage.
     * @param {Number} volume
     * @returns {YoutubePlayer}
     */
    setVolume: function(volume) {
        var player        = this._getPlayer(),
            currentVolume = player.getVolume(),
            classPrefix   = 'volume-level-';
        
        if (volume === undefined) volume = currentVolume;
        
        this._elements._volumeSteps.replaceClass(classPrefix + currentVolume,
                                                 classPrefix + (volume));
        
        player.setVolume(volume);
        return this;
    },
    
    /**
     * Increases the volume by one step, where the total number of steps is
     * determined by the volumeSteps option.
     * @returns {YoutubePlayer}
     */
    increaseVolume: function() {
        var step   = 100 / this._options.volumeSteps,
            volume = this._getPlayer().getVolume() + step;
        if (volume > 100) volume = 100;
        this.setVolume(volume);
    },
    
    /**
    * Decreases the volume by one step, where the total number of steps is
    * determined by the volumeSteps option.
     * @returns {YoutubePlayer}
     */
    decreaseVolume: function() {
        var step   = 100 / this._options.volumeSteps,
            volume = this._getPlayer().getVolume() - step;
        if (volume < 0) volume = 0;
        this.setVolume(volume);
    },
    
    /**
     * Cues the requested video when the video player is ready.
     */
    _onready: function() {
        var callback = 'YoutubePlayer._dispatchStateEvent("' + this._elementId + '")';
        this._getPlayer().addEventListener('onStateChange', callback);
        this._getPlayer().cueVideoById(this._videoId);
        this.setState('PAUSED');
        this.notifyObservers('ready');
        setInterval(this.method('updateTime'), 250);
        this.setVolume();
    },
    
    /**
     * Returns a string representation of the current play time.
     * @returns {String}
     */
    getTimeString: function() { try {
        var player = this._getPlayer();
        var time = player.getCurrentTime();
        var mins = (time / 60).floor(), secs = (time % 60).floor();
            mins = mins > 0 ? mins : 0;
            secs = secs > 0 ? secs : 0;
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    } catch (e) {
        return '';
    }},
    
    /**
     * Dispatches event calls from the YouTube API to Ojay.Observable's named
     * event listener system. See YoutubePlayer.STATES for event names.
     * @param {Number} state
     */
    _dispatchStateEvent: function(state) {
        for (var key in this.klass.STATES) {
            if (this.klass.STATES[key] == state)
                this.notifyObservers(key);
        }
    },
    
    /**
     * Returns a reference to the flash object that provides the Youtube API.
     * @returns {HTMLElement}
     */
    _getPlayer: function() {
        return Ojay.byId(this._elementId).node;
    },
    
    states: {
        PAUSED: {
            /**
             * @returns {YoutubePlayer}
             */
            play: function() {
                this._getPlayer().playVideo();
                return this;
            },
            
            /**
             * @returns {YoutubePlayer}
             */
            toggle: function() {
                return this.play();
            },
            
            /**
             * Updates the time display
             * @returns {YoutubePlayer}
             */
            updateTime: function() {
                this._elements._time.setContent(this.getTimeString());
                return this;
            }
        },
        
        PLAYING: {
            /**
             * @returns {YoutubePlayer}
             */
            pause: function() {
                this._getPlayer().pauseVideo();
                return this;
            },
            
            /**
             * @returns {YoutubePlayer}
             */
            toggle: function() {
                return this.pause();
            },
            
            /**
             * Updates the time display
             * @returns {YoutubePlayer}
             */
            updateTime: function() { try {
                var player = this._getPlayer();
                this._elements._time.setContent(this.getTimeString());
                var offset   = player.getCurrentTime() / player.getDuration(),
                    distance = offset * this._progressSliderLimit;
                
                this._progressSlider.setValue(distance, true, true, true);
                
                this._progressBar.setStyle({width: this._thumbWidth * offset + 
                                                   distance + 'px'});
                return this;
            } catch (e) {
                return this;
            }}
        }
    },
    
    extend: {
        _instances: {},
        
        /**
         * @param {YoutubePlayer}
         */
        _register: function(player) {
            this._instances[player._elementId] = player;
        },
        
        /**
         * @param {YoutubePlayer}
         */
        _playing: function(player) {
            if (this._current && this._current !== player) this._current.pause();
            this._current = player;
        },
        
        /**
         * Returns the correct URL for the given video ID.
         * @param {String} videoId
         * @returns {String}
         */
        getVideoURL: function(videoId) {
            return 'http://www.youtube.com/v/' + videoId + '&enablejsapi=1';
        },
        
        /**
         * Returns the correct player URL for the set developer key.
         * @param {String} playerId
         * @returns {String}
         */
        getPlayerURL: function(playerId) {
            if (this.API_KEY === null) return null;
            var uri = Ojay.URI.parse('http://www.youtube.com/apiplayer?enablejsapi=1');
            uri.setParam('key', this.API_KEY);
            uri.setParam('playerapiid', playerId);
            return uri.toString();
        },
        
        /**
         * Returns the instance with the given ID.
         * @param {id}
         * @returns {YoutubePlayer}
         */
        findById: function(id) {
            return this._instances[id];
        },
        
        /**
         * Dispatches calls from the YouTube event API to individual
         * YoutubePlayer instances. Is curried to allow usage with the
         * YouTube event API while adding instance identification.
         * @param {String} playerId
         * @param {String} state
         */
        _dispatchStateEvent: function(playerId, state) {
            YoutubePlayer.findById(playerId)._dispatchStateEvent(state);
        }.curry(),
        
        /**
         * The amount of time, in seconds, to seek forwards or back when a skip
         * control is used.
         */
        SKIP_TIME: 15,
        
        /**
         * The number of steps from silent to full volume. This controls how
         * many step controls are displayed, as well as the fraction by which
         * the volume is increased or decreased by the volume up and down
         * controls.
         */
        VOLUME_STEPS: 4,
        
        FLASH_VERSION: '8',
        ASPECT_RATIO: 4/3,
        
        /* Must be assigned before use */
        CLIENT_ID:  null,
        API_KEY:    null,
        
        /**
         * Returns true iff we have a recent enough Flash plugin installed.
         * @returns {Boolean}
         */
        hasAcceptableFlash: function() {
            var expected = this.MINIMUM_FLASH_VERSION, actual = swfobject.getFlashPlayerVersion();
            return !(actual.major < expected.major ||
                     actual.minor < expected.minor ||
                     actual.release < expected.release);
        },
        
        /**
         * @returns {HTMLElement}
         */
        _getFlashWarning: function() {
            var self = this;
            return Ojay.HTML.p({className: 'flash-warning'},
                'If this media player does not work for you, try ',
                Ojay.HTML.a({href: self.FLASH_DOWNLOAD_URL},
                        'installing the latest Flash plugin'), '.');
        },
                
        /* Where to go to download Flash */
        FLASH_DOWNLOAD_URL:     'http://www.adobe.com/products/flashplayer/',
        MINIMUM_FLASH_VERSION:  {major: 9, minor: 0, release: 0},
        
        STATES: {
            unstarted:  -1,
            ended:      0,
            playing:    1,
            paused:     2,
            buffering:  3,
            cued:       5
        }
    }
});

onYouTubePlayerReady = function(playerId) {
    YoutubePlayer.findById(playerId)._onready();
};
