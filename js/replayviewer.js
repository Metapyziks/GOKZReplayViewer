var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Gokz;
(function (Gokz) {
    (function (SeekOrigin) {
        SeekOrigin[SeekOrigin["Begin"] = 0] = "Begin";
        SeekOrigin[SeekOrigin["Current"] = 1] = "Current";
        SeekOrigin[SeekOrigin["End"] = 2] = "End";
    })(Gokz.SeekOrigin || (Gokz.SeekOrigin = {}));
    var SeekOrigin = Gokz.SeekOrigin;
    var BinaryReader = (function () {
        function BinaryReader(buffer) {
            this.buffer = buffer;
            this.view = new DataView(buffer);
            this.offset = 0;
        }
        BinaryReader.prototype.seek = function (offset, origin) {
            switch (origin) {
                case SeekOrigin.Begin:
                    return this.offset = offset;
                case SeekOrigin.End:
                    return this.offset = this.buffer.byteLength - offset;
                default:
                    return this.offset = this.offset + offset;
            }
        };
        BinaryReader.prototype.getOffset = function () {
            return this.offset;
        };
        BinaryReader.prototype.readUint8 = function () {
            var value = this.view.getUint8(this.offset);
            this.offset += 1;
            return value;
        };
        BinaryReader.prototype.readInt32 = function () {
            var value = this.view.getInt32(this.offset, true);
            this.offset += 4;
            return value;
        };
        BinaryReader.prototype.readUint32 = function () {
            var value = this.view.getUint32(this.offset, true);
            this.offset += 4;
            return value;
        };
        BinaryReader.prototype.readFloat32 = function () {
            var value = this.view.getFloat32(this.offset, true);
            this.offset += 4;
            return value;
        };
        // http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
        /* utf.js - UTF-8 <=> UTF-16 convertion
        *
        * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
        * Version: 1.0
        * LastModified: Dec 25 1999
        * This library is free.  You can redistribute it and/or modify it.
        */
        BinaryReader.utf8ArrayToStr = function (array) {
            var out, i, len, c;
            var char2, char3;
            out = "";
            len = array.length;
            i = 0;
            while (i < len) {
                c = array[i++];
                switch (c >> 4) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                        // 0xxxxxxx
                        out += String.fromCharCode(c);
                        break;
                    case 12:
                    case 13:
                        // 110x xxxx   10xx xxxx
                        char2 = array[i++];
                        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                        break;
                    case 14:
                        // 1110 xxxx  10xx xxxx  10xx xxxx
                        char2 = array[i++];
                        char3 = array[i++];
                        out += String.fromCharCode(((c & 0x0F) << 12) |
                            ((char2 & 0x3F) << 6) |
                            ((char3 & 0x3F) << 0));
                        break;
                }
            }
            return out;
        };
        BinaryReader.prototype.readString = function (length) {
            if (length === undefined) {
                length = this.readUint8();
            }
            var chars = new Array(length);
            for (var i = 0; i < length; ++i) {
                chars[i] = this.readUint8();
            }
            return BinaryReader.utf8ArrayToStr(chars);
        };
        BinaryReader.prototype.readVector2 = function (vec) {
            if (vec === undefined)
                vec = new Facepunch.Vector2();
            vec.set(this.readFloat32(), this.readFloat32());
            return vec;
        };
        BinaryReader.prototype.readVector3 = function (vec) {
            if (vec === undefined)
                vec = new Facepunch.Vector3();
            vec.set(this.readFloat32(), this.readFloat32(), this.readFloat32());
            return vec;
        };
        return BinaryReader;
    }());
    Gokz.BinaryReader = BinaryReader;
})(Gokz || (Gokz = {}));
var Gokz;
(function (Gokz) {
    var Event = (function () {
        function Event(sender) {
            this.handlers = [];
            this.sender = sender;
        }
        Event.prototype.addListener = function (handler) {
            this.handlers.push(handler);
        };
        Event.prototype.removeListener = function (handler) {
            var index = this.handlers.indexOf(handler);
            if (index === -1)
                return false;
            this.handlers.splice(index, 1);
            return true;
        };
        Event.prototype.clearListeners = function () {
            this.handlers = [];
        };
        Event.prototype.dispatch = function (args) {
            var count = this.handlers.length;
            for (var i = 0; i < count; ++i) {
                this.handlers[i](args, this.sender);
            }
        };
        return Event;
    }());
    Gokz.Event = Event;
    var ChangedEvent = (function (_super) {
        __extends(ChangedEvent, _super);
        function ChangedEvent(sender, equalityComparison) {
            _super.call(this, sender);
            if (equalityComparison != null) {
                this.equalityComparison = equalityComparison;
            }
            else {
                this.equalityComparison = function (a, b) { return a === b; };
            }
        }
        ChangedEvent.prototype.reset = function () {
            this.prevValue = undefined;
        };
        ChangedEvent.prototype.update = function (value, args) {
            if (this.equalityComparison(this.prevValue, value))
                return;
            this.prevValue = value;
            this.dispatch(args === undefined ? value : args);
        };
        return ChangedEvent;
    }(Event));
    Gokz.ChangedEvent = ChangedEvent;
})(Gokz || (Gokz = {}));
var Gokz;
(function (Gokz) {
    var KeyDisplay = (function () {
        function KeyDisplay(viewer, container) {
            var _this = this;
            this.buttonMap = {};
            this.syncSampleRange = 4;
            this.speedSampleRange = 1 / 8;
            this.tempTickData = new Gokz.TickData();
            this.tempPosition = new Facepunch.Vector3();
            this.syncBuffer = [];
            this.syncIndex = 0;
            this.syncSampleCount = 0;
            this.lastTick = 0;
            this.viewer = viewer;
            if (container === undefined)
                container = viewer.container;
            var element = this.element = document.createElement("div");
            element.classList.add("key-display");
            element.innerHTML = "\n                <div class=\"stat sync-outer\">Sync: <span class=\"value sync-value\">0.0</span> %</div>\n                <div class=\"stat speed-outer\">Speed: <span class=\"value speed-value\">000</span> u/s</div>\n                <div class=\"key key-w\">W</div>\n                <div class=\"key key-a\">A</div>\n                <div class=\"key key-s\">S</div>\n                <div class=\"key key-d\">D</div>\n                <div class=\"key key-walk\">Walk</div>\n                <div class=\"key key-duck\">Duck</div>\n                <div class=\"key key-jump\">Jump</div>";
            container.appendChild(element);
            this.buttonMap[Gokz.Button.Forward] = element.getElementsByClassName("key-w")[0];
            this.buttonMap[Gokz.Button.MoveLeft] = element.getElementsByClassName("key-a")[0];
            this.buttonMap[Gokz.Button.Back] = element.getElementsByClassName("key-s")[0];
            this.buttonMap[Gokz.Button.MoveRight] = element.getElementsByClassName("key-d")[0];
            this.buttonMap[Gokz.Button.Walk] = element.getElementsByClassName("key-walk")[0];
            this.buttonMap[Gokz.Button.Duck] = element.getElementsByClassName("key-duck")[0];
            this.buttonMap[Gokz.Button.Jump] = element.getElementsByClassName("key-jump")[0];
            this.syncValueElem = element.getElementsByClassName("sync-value")[0];
            this.speedValueElem = element.getElementsByClassName("speed-value")[0];
            viewer.showKeyDisplayChanged.addListener(function (showKeyDisplay) {
                if (showKeyDisplay && viewer.cameraMode === SourceUtils.CameraMode.Fixed)
                    _this.show();
                else
                    _this.hide();
            });
            viewer.cameraModeChanged.addListener(function (cameraMode) {
                if (viewer.showKeyDisplay && cameraMode === SourceUtils.CameraMode.Fixed)
                    _this.show();
                else
                    _this.hide();
            });
            viewer.playbackSkipped.addListener(function (oldTick) {
                _this.syncIndex = 0;
                _this.syncSampleCount = 0;
                _this.lastTick = viewer.replay.clampTick(viewer.playbackRate > 0
                    ? viewer.tick - 32
                    : viewer.tick + 32);
            });
            viewer.tickChanged.addListener(function (tickData) {
                _this.updateButtons(tickData);
                _this.updateSpeed();
                _this.updateSync();
            });
        }
        KeyDisplay.prototype.updateButtons = function (tickData) {
            for (var key in this.buttonMap) {
                var pressed = (tickData.buttons & parseInt(key)) !== 0;
                if (pressed) {
                    this.buttonMap[key].classList.add("pressed");
                }
                else {
                    this.buttonMap[key].classList.remove("pressed");
                }
            }
        };
        KeyDisplay.prototype.updateSync = function () {
            if (this.lastTick === this.viewer.tick)
                return;
            var replay = this.viewer.replay;
            var maxSamples = Math.ceil(this.syncSampleRange * replay.tickRate);
            var syncBuffer = this.syncBuffer;
            if (syncBuffer.length < maxSamples) {
                syncBuffer = this.syncBuffer = new Array(maxSamples);
                this.syncIndex = 0;
                this.syncSampleCount = 0;
            }
            var min = replay.clampTick(Math.min(this.lastTick, this.viewer.tick) - 1);
            var max = replay.clampTick(Math.max(this.lastTick, this.viewer.tick));
            var prevSpeed = this.getSpeedAtTick(min, 1);
            for (var i = min + 1; i <= max; ++i) {
                var nextSpeed = this.getSpeedAtTick(i, 1);
                // A bit gross
                if ((this.tempTickData.flags & (Gokz.EntityFlag.OnGround | Gokz.EntityFlag.PartialGround)) === 0) {
                    syncBuffer[this.syncIndex] = nextSpeed > prevSpeed;
                    this.syncIndex = this.syncIndex >= maxSamples - 1 ? 0 : this.syncIndex + 1;
                    this.syncSampleCount = Math.min(this.syncSampleCount + 1, maxSamples);
                }
                prevSpeed = nextSpeed;
            }
            this.lastTick = this.viewer.tick;
            var syncFraction = 0.0;
            for (var i = 0; i < this.syncSampleCount; ++i) {
                if (syncBuffer[i])
                    ++syncFraction;
            }
            syncFraction /= Math.max(this.syncSampleCount, 1);
            this.syncValueElem.innerText = (syncFraction * 100).toFixed(1);
        };
        KeyDisplay.prototype.getSpeedAtTick = function (tick, tickRange) {
            var replay = this.viewer.replay;
            var firstTick = replay.clampTick(tick - Math.ceil(tickRange / 2));
            var lastTick = replay.clampTick(firstTick + tickRange);
            tickRange = lastTick - firstTick;
            var tickData = this.tempTickData;
            var position = this.tempPosition;
            replay.getTickData(lastTick, tickData);
            position.copy(tickData.position);
            replay.getTickData(firstTick, tickData);
            position.sub(tickData.position);
            // Ignore vertical speed
            position.z = 0;
            return position.length() * replay.tickRate / Math.max(1, lastTick - firstTick);
        };
        KeyDisplay.prototype.updateSpeed = function () {
            // TODO: cache
            var replay = this.viewer.replay;
            var maxTickRange = Math.ceil(this.speedSampleRange * replay.tickRate);
            var speedString = Math.round(this.getSpeedAtTick(this.viewer.tick, maxTickRange)).toString();
            for (; speedString.length < 3; speedString = "0" + speedString)
                ;
            this.speedValueElem.innerText = speedString;
        };
        KeyDisplay.prototype.show = function () {
            this.element.style.display = "block";
        };
        KeyDisplay.prototype.hide = function () {
            this.element.style.display = "none";
        };
        return KeyDisplay;
    }());
    Gokz.KeyDisplay = KeyDisplay;
})(Gokz || (Gokz = {}));
var Gokz;
(function (Gokz) {
    var OptionsMenu = (function () {
        function OptionsMenu(viewer, container) {
            var _this = this;
            this.viewer = viewer;
            if (container === undefined) {
                container = this.viewer.container;
            }
            var element = this.element = document.createElement("div");
            element.classList.add("options-menu");
            element.innerHTML = "<div class=\"options-title\"></div><div class=\"options-list\"></div>";
            container.appendChild(element);
            this.titleElem = element.getElementsByClassName("options-title")[0];
            this.optionContainer = element.getElementsByClassName("options-list")[0];
            viewer.showOptionsChanged.addListener(function (showOptions) {
                if (showOptions)
                    _this.show();
                else
                    _this.hide();
            });
        }
        OptionsMenu.prototype.show = function () {
            this.element.style.display = "block";
            this.showMainPage();
            if (this.viewer.controls != null) {
                this.viewer.controls.hideSpeedControl();
            }
        };
        OptionsMenu.prototype.hide = function () {
            this.element.style.display = "none";
            this.clear();
        };
        OptionsMenu.prototype.clear = function () {
            this.optionContainer.innerHTML = "";
        };
        OptionsMenu.prototype.showMainPage = function () {
            var viewer = this.viewer;
            this.clear();
            this.setTitle("Options");
            this.addToggleOption("Show Crosshair", function () { return viewer.showCrosshair; }, function (value) { return viewer.showCrosshair = value; }, viewer.showCrosshairChanged);
            this.addToggleOption("Show Framerate", function () { return viewer.showDebugPanel; }, function (value) { return viewer.showDebugPanel = value; });
            this.addToggleOption("Show Key Presses", function () { return viewer.showKeyDisplay; }, function (value) { return viewer.showKeyDisplay = value; }, viewer.showKeyDisplayChanged);
            this.addToggleOption("Free Camera", function () { return viewer.cameraMode === SourceUtils.CameraMode.FreeCam; }, function (value) { return viewer.cameraMode = value
                ? SourceUtils.CameraMode.FreeCam
                : SourceUtils.CameraMode.Fixed; }, viewer.cameraModeChanged);
        };
        OptionsMenu.prototype.setTitle = function (title) {
            this.titleElem.innerText = title;
        };
        OptionsMenu.prototype.addToggleOption = function (label, getter, setter, changed) {
            var option = document.createElement("div");
            option.classList.add("option");
            option.innerHTML = label + "<div class=\"toggle\"><div class=\"knob\"></div></div>";
            this.optionContainer.appendChild(option);
            var toggle = option.getElementsByClassName("toggle")[0];
            var updateOption = function () {
                if (getter()) {
                    toggle.classList.add("on");
                }
                else {
                    toggle.classList.remove("on");
                }
            };
            option.addEventListener("click", function (ev) {
                setter(!getter());
                if (changed == null) {
                    updateOption();
                }
            });
            if (changed != null) {
                changed.addListener(function () { return updateOption(); });
            }
            updateOption();
        };
        return OptionsMenu;
    }());
    Gokz.OptionsMenu = OptionsMenu;
})(Gokz || (Gokz = {}));
var Gokz;
(function (Gokz) {
    var ReplayControls = (function () {
        function ReplayControls(viewer) {
            var _this = this;
            this.playbackBarVisible = true;
            this.mouseOverPlaybackBar = false;
            this.speedControlVisible = false;
            this.autoHidePeriod = 2;
            this.viewer = viewer;
            this.container = viewer.container;
            var playbackBar = this.playbackBarElem = document.createElement("div");
            playbackBar.classList.add("playback-bar");
            playbackBar.innerHTML = "\n                <div class=\"scrubber-container\">\n                <input class=\"scrubber\" type=\"range\" min=\"0\" max=\"1.0\" value=\"0.0\" step=\"1\" />\n                </div>";
            playbackBar.addEventListener("mouseover", function (ev) {
                _this.mouseOverPlaybackBar = true;
            });
            playbackBar.addEventListener("mouseout", function (ev) {
                _this.mouseOverPlaybackBar = false;
            });
            this.container.appendChild(playbackBar);
            this.scrubberElem = playbackBar.getElementsByClassName("scrubber")[0];
            this.scrubberElem.addEventListener("input", function (ev) {
                viewer.tick = _this.scrubberElem.valueAsNumber;
            });
            this.scrubberElem.addEventListener("mousedown", function (ev) {
                _this.viewer.isScrubbing = true;
            });
            this.scrubberElem.addEventListener("mouseup", function (ev) {
                _this.viewer.updateTickHash();
                _this.viewer.isScrubbing = false;
            });
            this.timeElem = document.createElement("div");
            this.timeElem.classList.add("time");
            playbackBar.appendChild(this.timeElem);
            this.speedElem = document.createElement("div");
            this.speedElem.classList.add("speed");
            this.speedElem.addEventListener("click", function (ev) {
                if (_this.speedControlVisible)
                    _this.hideSpeedControl();
                else
                    _this.showSpeedControl();
            });
            playbackBar.appendChild(this.speedElem);
            this.pauseElem = document.createElement("div");
            this.pauseElem.classList.add("pause");
            this.pauseElem.classList.add("control");
            this.pauseElem.addEventListener("click", function (ev) { return _this.viewer.isPlaying = false; });
            playbackBar.appendChild(this.pauseElem);
            this.resumeElem = document.createElement("div");
            this.resumeElem.classList.add("play");
            this.resumeElem.classList.add("control");
            this.resumeElem.addEventListener("click", function (ev) { return _this.viewer.isPlaying = true; });
            playbackBar.appendChild(this.resumeElem);
            this.settingsElem = document.createElement("div");
            this.settingsElem.classList.add("settings");
            this.settingsElem.classList.add("control");
            this.settingsElem.addEventListener("click", function (ev) { return viewer.showOptions = !viewer.showOptions; });
            playbackBar.appendChild(this.settingsElem);
            this.fullscreenElem = document.createElement("div");
            this.fullscreenElem.classList.add("fullscreen");
            this.fullscreenElem.classList.add("control");
            this.fullscreenElem.addEventListener("click", function (ev) { return _this.viewer.toggleFullscreen(); });
            playbackBar.appendChild(this.fullscreenElem);
            this.speedControlElem = document.createElement("div");
            this.speedControlElem.classList.add("speed-control");
            this.speedControlElem.innerHTML = "<input class=\"speed-slider\" type=\"range\" min=\"0\" max=\"" + (ReplayControls.speedSliderValues.length - 1) + "\" step=\"1\">";
            this.container.appendChild(this.speedControlElem);
            this.speedSliderElem = this.speedControlElem.getElementsByClassName("speed-slider")[0];
            this.speedSliderElem.addEventListener("input", function (ev) {
                _this.viewer.playbackRate = ReplayControls.speedSliderValues[_this.speedSliderElem.valueAsNumber];
            });
            viewer.replayLoaded.addListener(function (replay) {
                _this.scrubberElem.max = replay.tickCount.toString();
            });
            viewer.isPlayingChanged.addListener(function (isPlaying) {
                _this.pauseElem.style.display = isPlaying ? "block" : "none";
                _this.resumeElem.style.display = isPlaying ? "none" : "block";
                _this.showPlaybackBar();
            });
            viewer.playbackRateChanged.addListener(function (playbackRate) {
                _this.speedElem.innerText = playbackRate.toString();
                _this.speedSliderElem.valueAsNumber = ReplayControls.speedSliderValues.indexOf(playbackRate);
            });
            viewer.tickChanged.addListener(function (tickData) {
                var replay = _this.viewer.replay;
                if (replay != null) {
                    var totalSeconds = replay.clampTick(tickData.tick) / replay.tickRate;
                    var minutes = Math.floor(totalSeconds / 60);
                    var seconds = totalSeconds - minutes * 60;
                    var secondsString = seconds.toFixed(1);
                    _this.timeElem.innerText = minutes + ":" + (secondsString.indexOf(".") === 1 ? "0" : "") + secondsString;
                }
                _this.scrubberElem.valueAsNumber = tickData.tick;
            });
            viewer.updated.addListener(function (dt) {
                if ((viewer.isPlaying && !_this.mouseOverPlaybackBar) || viewer.isPointerLocked()) {
                    var sinceLastAction = (performance.now() - _this.lastActionTime) / 1000;
                    var hidePeriod = viewer.isPointerLocked() ? 0 : _this.autoHidePeriod;
                    if (sinceLastAction >= hidePeriod) {
                        _this.hidePlaybackBar();
                    }
                }
            });
            viewer.container.addEventListener("mousemove", function (ev) {
                if (!viewer.isPointerLocked()) {
                    _this.showPlaybackBar();
                }
            });
        }
        ReplayControls.prototype.showPlaybackBar = function () {
            if (this.playbackBarVisible) {
                this.lastActionTime = performance.now();
                return;
            }
            this.playbackBarVisible = true;
            this.playbackBarElem.classList.remove("hidden");
        };
        ReplayControls.prototype.hidePlaybackBar = function () {
            if (!this.playbackBarVisible)
                return;
            this.playbackBarVisible = false;
            this.playbackBarElem.classList.add("hidden");
            this.lastActionTime = undefined;
            this.hideSpeedControl();
        };
        ReplayControls.prototype.showSpeedControl = function () {
            if (this.speedControlVisible)
                return false;
            this.speedControlVisible = true;
            this.speedControlElem.style.display = "block";
            this.viewer.showOptions = false;
            return true;
        };
        ReplayControls.prototype.hideSpeedControl = function () {
            if (!this.speedControlVisible)
                return false;
            this.speedControlVisible = false;
            this.speedControlElem.style.display = "none";
            return true;
        };
        ReplayControls.prototype.showSettings = function () {
            // TODO
            this.viewer.showDebugPanel = !this.viewer.showDebugPanel;
        };
        ReplayControls.speedSliderValues = [-5, -1, 0.1, 0.25, 1, 2, 5, 10];
        return ReplayControls;
    }());
    Gokz.ReplayControls = ReplayControls;
})(Gokz || (Gokz = {}));
var Gokz;
(function (Gokz) {
    (function (GlobalMode) {
        GlobalMode[GlobalMode["Vanilla"] = 0] = "Vanilla";
        GlobalMode[GlobalMode["KzSimple"] = 1] = "KzSimple";
        GlobalMode[GlobalMode["KzTimer"] = 2] = "KzTimer";
    })(Gokz.GlobalMode || (Gokz.GlobalMode = {}));
    var GlobalMode = Gokz.GlobalMode;
    (function (GlobalStyle) {
        GlobalStyle[GlobalStyle["Normal"] = 0] = "Normal";
    })(Gokz.GlobalStyle || (Gokz.GlobalStyle = {}));
    var GlobalStyle = Gokz.GlobalStyle;
    (function (Button) {
        Button[Button["Attack"] = 1] = "Attack";
        Button[Button["Jump"] = 2] = "Jump";
        Button[Button["Duck"] = 4] = "Duck";
        Button[Button["Forward"] = 8] = "Forward";
        Button[Button["Back"] = 16] = "Back";
        Button[Button["Use"] = 32] = "Use";
        Button[Button["Cancel"] = 64] = "Cancel";
        Button[Button["Left"] = 128] = "Left";
        Button[Button["Right"] = 256] = "Right";
        Button[Button["MoveLeft"] = 512] = "MoveLeft";
        Button[Button["MoveRight"] = 1024] = "MoveRight";
        Button[Button["Attack2"] = 2048] = "Attack2";
        Button[Button["Run"] = 4096] = "Run";
        Button[Button["Reload"] = 8192] = "Reload";
        Button[Button["Alt1"] = 16384] = "Alt1";
        Button[Button["Alt2"] = 32768] = "Alt2";
        Button[Button["Score"] = 65536] = "Score";
        Button[Button["Speed"] = 131072] = "Speed";
        Button[Button["Walk"] = 262144] = "Walk";
        Button[Button["Zoom"] = 524288] = "Zoom";
        Button[Button["Weapon1"] = 1048576] = "Weapon1";
        Button[Button["Weapon2"] = 2097152] = "Weapon2";
        Button[Button["BullRush"] = 4194304] = "BullRush";
        Button[Button["Grenade1"] = 8388608] = "Grenade1";
        Button[Button["Grenade2"] = 16777216] = "Grenade2";
    })(Gokz.Button || (Gokz.Button = {}));
    var Button = Gokz.Button;
    (function (EntityFlag) {
        EntityFlag[EntityFlag["OnGround"] = 1] = "OnGround";
        EntityFlag[EntityFlag["Ducking"] = 2] = "Ducking";
        EntityFlag[EntityFlag["WaterJump"] = 4] = "WaterJump";
        EntityFlag[EntityFlag["OnTrain"] = 8] = "OnTrain";
        EntityFlag[EntityFlag["InRain"] = 16] = "InRain";
        EntityFlag[EntityFlag["Frozen"] = 32] = "Frozen";
        EntityFlag[EntityFlag["AtControls"] = 64] = "AtControls";
        EntityFlag[EntityFlag["Client"] = 128] = "Client";
        EntityFlag[EntityFlag["FakeClient"] = 256] = "FakeClient";
        EntityFlag[EntityFlag["InWater"] = 512] = "InWater";
        EntityFlag[EntityFlag["Fly"] = 1024] = "Fly";
        EntityFlag[EntityFlag["Swim"] = 2048] = "Swim";
        EntityFlag[EntityFlag["Conveyor"] = 4096] = "Conveyor";
        EntityFlag[EntityFlag["Npc"] = 8192] = "Npc";
        EntityFlag[EntityFlag["GodMode"] = 16384] = "GodMode";
        EntityFlag[EntityFlag["NoTarget"] = 32768] = "NoTarget";
        EntityFlag[EntityFlag["AimTarget"] = 65536] = "AimTarget";
        EntityFlag[EntityFlag["PartialGround"] = 131072] = "PartialGround";
        EntityFlag[EntityFlag["StaticProp"] = 262144] = "StaticProp";
        EntityFlag[EntityFlag["Graphed"] = 524288] = "Graphed";
        EntityFlag[EntityFlag["Grenade"] = 1048576] = "Grenade";
        EntityFlag[EntityFlag["StepMovement"] = 2097152] = "StepMovement";
        EntityFlag[EntityFlag["DontTouch"] = 4194304] = "DontTouch";
        EntityFlag[EntityFlag["BaseVelocity"] = 8388608] = "BaseVelocity";
        EntityFlag[EntityFlag["WorldBrush"] = 16777216] = "WorldBrush";
        EntityFlag[EntityFlag["Object"] = 33554432] = "Object";
        EntityFlag[EntityFlag["KillMe"] = 67108864] = "KillMe";
        EntityFlag[EntityFlag["OnFire"] = 134217728] = "OnFire";
        EntityFlag[EntityFlag["Dissolving"] = 268435456] = "Dissolving";
        EntityFlag[EntityFlag["TransRagdoll"] = 536870912] = "TransRagdoll";
        EntityFlag[EntityFlag["UnblockableByPlayer"] = 1073741824] = "UnblockableByPlayer";
        EntityFlag[EntityFlag["Freezing"] = -2147483648] = "Freezing";
    })(Gokz.EntityFlag || (Gokz.EntityFlag = {}));
    var EntityFlag = Gokz.EntityFlag;
    var TickData = (function () {
        function TickData() {
            this.position = new Facepunch.Vector3();
            this.angles = new Facepunch.Vector2();
            this.tick = -1;
            this.buttons = 0;
            this.flags = 0;
        }
        TickData.prototype.getEyeHeight = function () {
            return (this.flags & EntityFlag.Ducking) != 0 ? 46 : 64;
        };
        return TickData;
    }());
    Gokz.TickData = TickData;
    var ReplayFile = (function () {
        function ReplayFile(data) {
            var reader = this.reader = new Gokz.BinaryReader(data);
            var magic = reader.readInt32();
            if (magic !== ReplayFile.MAGIC) {
                throw "Unrecognised replay file format.";
            }
            this.formatVersion = reader.readUint8();
            this.pluginVersion = reader.readString();
            this.mapName = reader.readString();
            this.course = reader.readInt32();
            this.mode = reader.readInt32();
            this.style = reader.readInt32();
            this.time = reader.readFloat32();
            this.teleportsUsed = reader.readInt32();
            this.steamId = reader.readInt32();
            this.steamId2 = reader.readString();
            reader.readString();
            this.playerName = reader.readString();
            this.tickCount = reader.readInt32();
            this.tickRate = Math.round(this.tickCount / this.time); // todo
            this.firstTickOffset = reader.getOffset();
            this.tickSize = 7 * 4;
        }
        ReplayFile.prototype.getTickData = function (tick, data) {
            if (data === undefined)
                data = new TickData();
            data.tick = tick;
            var reader = this.reader;
            reader.seek(this.firstTickOffset + this.tickSize * tick, Gokz.SeekOrigin.Begin);
            reader.readVector3(data.position);
            reader.readVector2(data.angles);
            data.buttons = reader.readInt32();
            data.flags = reader.readInt32();
            return data;
        };
        ReplayFile.prototype.clampTick = function (tick) {
            return tick < 0 ? 0 : tick >= this.tickCount ? this.tickCount - 1 : tick;
        };
        ReplayFile.MAGIC = 0x676F6B7A;
        return ReplayFile;
    }());
    Gokz.ReplayFile = ReplayFile;
})(Gokz || (Gokz = {}));
///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>
var WebGame = Facepunch.WebGame;
var Gokz;
(function (Gokz) {
    /**
     * Creates a GOKZ replay viewer applet.
     */
    var ReplayViewer = (function (_super) {
        __extends(ReplayViewer, _super);
        /**
         * Creates a new ReplayViewer inside the given `container` element.
         * @param container Element that should contain the viewer.
         */
        function ReplayViewer(container) {
            var _this = this;
            _super.call(this, container);
            /**
             * If true, the current tick will be stored in the address hash when
             * playback is paused or the viewer uses the playback bar to skip
             * around.
             * @default `true`
             */
            this.saveTickInHash = true;
            /**
             * The current tick being shown during playback, starting with 0 for
             * the first tick. Will automatically be increased while playing,
             * although some ticks might be skipped depending on playback speed and
             * frame rate. Can be set to skip to a particular tick.
             */
            this.tick = -1;
            /**
             * Current playback rate, measured in seconds per second. Can support
             * negative values for rewinding.
             * @default `1.0`
             */
            this.playbackRate = 1.0;
            /**
             * If true, the replay will automatically loop back to the first tick
             * when it reaches the end.
             * @default `true`
             */
            this.autoRepeat = true;
            /**
             * Used internally to temporarily pause playback while the user is
             * dragging the scrubber in the playback bar.
             */
            this.isScrubbing = false;
            /**
             * If true, the currently displayed tick will advance based on the
             * value of `playbackRate`.
             * @default `false`
             */
            this.isPlaying = false;
            /**
             * If true, a crosshair graphic will be displayed in the middle of the
             * viewer.
             * @default `true`
             */
            this.showCrosshair = true;
            /**
             * If true, makes the key press display visible.
             * @default `true`
             */
            this.showKeyDisplay = true;
            /**
             * If true, makes the options menu visible.
             * @default `false`
             */
            this.showOptions = false;
            /**
             * Event invoked when a new replay is loaded. Will be invoked before
             * the map for the replay is loaded (if required).
             *
             * **Available event arguments**:
             * * `replay: Gokz.ReplayFile` - The newly loaded ReplayFile
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.replayLoaded = new Gokz.Event(this);
            /**
             * Event invoked after each update.
             *
             * **Available event arguments**:
             * * `dt: number` - Time since the last update
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.updated = new Gokz.Event(this);
            /**
             * Event invoked when the current tick has changed.
             *
             * **Available event arguments**:
             * * `tickData: Gokz.TickData` - Recorded data for the current tick
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.tickChanged = new Gokz.ChangedEvent(this);
            /**
             * Event invoked when playback has skipped to a different tick, for
             * example when the user uses the scrubber.
             *
             * **Available event arguments**:
             * * `oldTick: number` - The previous value of `tick` before skipping
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.playbackSkipped = new Gokz.Event(this);
            /**
             * Event invoked when `playbackRate` changes.
             *
             * **Available event arguments**:
             * * `playbackRate: number` - The new playback rate
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.playbackRateChanged = new Gokz.ChangedEvent(this);
            /**
             * Event invoked when `isPlaying` changes, for example when the user
             * pauses or resumes playback.
             *
             * **Available event arguments**:
             * * `isPlaying: boolean` - True if currently playing
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.isPlayingChanged = new Gokz.ChangedEvent(this);
            /**
             * Event invoked when `showCrosshair` changes.
             *
             * **Available event arguments**:
             * * `showCrosshair: boolean` - True if crosshair is now visible
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.showCrosshairChanged = new Gokz.ChangedEvent(this);
            /**
             * Event invoked when `showKeyDisplay` changes.
             *
             * **Available event arguments**:
             * * `showKeyDisplay: boolean` - True if keyDisplay is now visible
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.showKeyDisplayChanged = new Gokz.ChangedEvent(this);
            /**
             * Event invoked when `showOptions` changes.
             *
             * **Available event arguments**:
             * * `showOptions: boolean` - True if options menu is now visible
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.showOptionsChanged = new Gokz.ChangedEvent(this);
            /**
             * Event invoked when `cameraMode` changes.
             *
             * **Available event arguments**:
             * * `cameraMode: SourceUtils.CameraMode` - Camera mode value
             * * `sender: Gokz.ReplayViewer` - This ReplayViewer
             */
            this.cameraModeChanged = new Gokz.ChangedEvent(this);
            this.pauseTime = 1.0;
            this.spareTime = 0;
            this.prevTick = undefined;
            this.tickData = new Gokz.TickData();
            this.tempTickData0 = new Gokz.TickData();
            this.tempTickData1 = new Gokz.TickData();
            this.tempTickData2 = new Gokz.TickData();
            this.ignoreMouseUp = true;
            this.saveCameraPosInHash = false;
            this.controls = new Gokz.ReplayControls(this);
            this.keyDisplay = new Gokz.KeyDisplay(this, this.controls.playbackBarElem);
            this.options = new Gokz.OptionsMenu(this, this.controls.playbackBarElem);
            var crosshair = document.createElement("div");
            crosshair.classList.add("crosshair");
            container.appendChild(crosshair);
            this.showCrosshairChanged.addListener(function (showCrosshair) {
                crosshair.hidden = !showCrosshair;
            });
            this.isPlayingChanged.addListener(function (isPlaying) {
                if (!isPlaying && _this.saveTickInHash)
                    _this.updateTickHash();
                if (isPlaying) {
                    _this.wakeLock = navigator.wakeLock;
                    if (_this.wakeLock != null) {
                        _this.wakeLock.request("display");
                    }
                    _this.cameraMode = SourceUtils.CameraMode.Fixed;
                }
                else if (_this.wakeLock != null) {
                    _this.wakeLock.release("display");
                    _this.wakeLock = null;
                }
            });
            this.cameraModeChanged.addListener(function (mode) {
                if (mode === SourceUtils.CameraMode.FreeCam) {
                    _this.isPlaying = false;
                }
                if (_this.routeLine != null) {
                    _this.routeLine.visible = mode === SourceUtils.CameraMode.FreeCam;
                }
                _this.canLockPointer = mode === SourceUtils.CameraMode.FreeCam;
                if (!_this.canLockPointer && _this.isPointerLocked()) {
                    document.exitPointerLock();
                }
            });
        }
        /**
         * Used to display an error message in the middle of the viewer.
         * @param message Message to display
         */
        ReplayViewer.prototype.showMessage = function (message) {
            if (this.messageElem === undefined) {
                this.messageElem = this.onCreateMessagePanel();
            }
            if (this.messageElem == null)
                return;
            this.messageElem.innerText = message;
        };
        /**
         * Attempt to load a GOKZ replay from the given URL. When loaded, the
         * replay will be stored in the `replay` property in this viewer.
         * @param url Url of the replay to download.
         */
        ReplayViewer.prototype.loadReplay = function (url) {
            var _this = this;
            console.log("Downloading: " + url);
            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.responseType = "arraybuffer";
            req.onload = function (ev) {
                if (req.status !== 200) {
                    _this.showMessage("Unable to download replay: " + req.statusText);
                    return;
                }
                var arrayBuffer = req.response;
                if (arrayBuffer) {
                    if (_this.routeLine != null) {
                        _this.routeLine.dispose();
                        _this.routeLine = null;
                    }
                    try {
                        _this.replay = new Gokz.ReplayFile(arrayBuffer);
                    }
                    catch (e) {
                        _this.showMessage("Unable to read replay: " + e);
                    }
                }
            };
            req.send(null);
        };
        /**
         * If `saveTickInHash` is true, will set the address hash to include
         * the current tick number.
         */
        ReplayViewer.prototype.updateTickHash = function () {
            if (this.replay == null || !this.saveTickInHash)
                return;
            this.setHash({ t: this.replay.clampTick(this.tick) + 1 });
        };
        ReplayViewer.prototype.onCreateMessagePanel = function () {
            var elem = document.createElement("div");
            elem.classList.add("message");
            this.container.appendChild(elem);
            return elem;
        };
        ReplayViewer.prototype.onInitialize = function () {
            _super.prototype.onInitialize.call(this);
            this.canLockPointer = false;
            this.cameraMode = SourceUtils.CameraMode.Fixed;
        };
        ReplayViewer.prototype.onHashChange = function (hash) {
            if (typeof hash === "string")
                return;
            if (!this.saveTickInHash)
                return;
            var data = hash;
            if (data.t !== undefined && this.tick !== data.t) {
                this.tick = data.t - 1;
                this.isPlaying = false;
            }
        };
        ReplayViewer.prototype.onMouseDown = function (button, screenPos, target) {
            this.ignoreMouseUp = event.target !== this.canvas;
            if (_super.prototype.onMouseDown.call(this, button, screenPos, target)) {
                this.showOptions = false;
                return true;
            }
            return false;
        };
        ReplayViewer.prototype.onMouseUp = function (button, screenPos, target) {
            var ignored = this.ignoreMouseUp || event.target !== this.canvas;
            this.ignoreMouseUp = true;
            if (ignored)
                return false;
            if (this.controls.hideSpeedControl() || this.showOptions) {
                this.showOptions = false;
                return true;
            }
            if (_super.prototype.onMouseUp.call(this, button, screenPos, target))
                return true;
            if (button === WebGame.MouseButton.Left && this.replay != null && this.map.isReady()) {
                this.isPlaying = !this.isPlaying;
                return true;
            }
            return false;
        };
        ReplayViewer.prototype.onKeyDown = function (key) {
            switch (key) {
                case WebGame.Key.X:
                    this.cameraMode = this.cameraMode === SourceUtils.CameraMode.FreeCam
                        ? SourceUtils.CameraMode.Fixed : SourceUtils.CameraMode.FreeCam;
                    if (this.cameraMode === SourceUtils.CameraMode.FreeCam) {
                        this.container.requestPointerLock();
                    }
                    return true;
                case WebGame.Key.F:
                    this.toggleFullscreen();
                    return true;
                case WebGame.Key.Space:
                    if (this.replay != null && this.map.isReady()) {
                        this.isPlaying = !this.isPlaying;
                    }
                    return true;
            }
            return _super.prototype.onKeyDown.call(this, key);
        };
        ReplayViewer.prototype.onChangeReplay = function (replay) {
            this.pauseTicks = Math.round(replay.tickRate * this.pauseTime);
            this.tick = this.tick === -1 ? 0 : this.tick;
            this.spareTime = 0;
            this.prevTick = undefined;
            this.replayLoaded.dispatch(this.replay);
            if (this.currentMapName !== replay.mapName) {
                if (this.currentMapName != null) {
                    this.map.unload();
                }
                if (this.mapBaseUrl == null) {
                    throw "Cannot load a map when mapBaseUrl is unspecified.";
                }
                var version = new Date().getTime().toString(16);
                this.currentMapName = replay.mapName;
                this.loadMap(this.mapBaseUrl + "/" + replay.mapName + "/index.json?v=" + version);
            }
        };
        ReplayViewer.prototype.onUpdateFrame = function (dt) {
            _super.prototype.onUpdateFrame.call(this, dt);
            if (this.replay != this.lastReplay) {
                this.lastReplay = this.replay;
                if (this.replay != null) {
                    this.onChangeReplay(this.replay);
                }
            }
            this.showCrosshairChanged.update(this.showCrosshair);
            this.showKeyDisplayChanged.update(this.showKeyDisplay);
            this.showOptionsChanged.update(this.showOptions);
            this.playbackRateChanged.update(this.playbackRate);
            this.cameraModeChanged.update(this.cameraMode);
            if (this.replay == null) {
                this.updated.dispatch(dt);
                return;
            }
            var replay = this.replay;
            var tickPeriod = 1.0 / replay.tickRate;
            this.isPlayingChanged.update(this.isPlaying);
            if (this.prevTick !== undefined && this.tick !== this.prevTick) {
                this.playbackSkipped.dispatch(this.prevTick);
            }
            if (this.routeLine == null && this.map.isReady()) {
                this.routeLine = new Gokz.RouteLine(this.map, this.replay);
            }
            if (this.map.isReady() && this.isPlaying && !this.isScrubbing) {
                this.spareTime += dt * this.playbackRate;
                var oldTick = this.tick;
                // Forward playback
                while (this.spareTime > tickPeriod) {
                    this.spareTime -= tickPeriod;
                    this.tick += 1;
                    if (this.tick > replay.tickCount + this.pauseTicks * 2) {
                        this.tick = -this.pauseTicks;
                    }
                }
                // Rewinding
                while (this.spareTime < 0) {
                    this.spareTime += tickPeriod;
                    this.tick -= 1;
                    if (this.tick < -this.pauseTicks * 2) {
                        this.tick = replay.tickCount + this.pauseTicks;
                    }
                }
            }
            else {
                this.spareTime = 0;
            }
            this.prevTick = this.tick;
            replay.getTickData(replay.clampTick(this.tick), this.tickData);
            var eyeHeight = this.tickData.getEyeHeight();
            this.tickChanged.update(this.tick, this.tickData);
            if (this.spareTime >= 0 && this.spareTime <= tickPeriod) {
                var t = this.spareTime / tickPeriod;
                var d0 = replay.getTickData(replay.clampTick(this.tick - 1), this.tempTickData0);
                var d1 = this.tickData;
                var d2 = replay.getTickData(replay.clampTick(this.tick + 1), this.tempTickData1);
                var d3 = replay.getTickData(replay.clampTick(this.tick + 2), this.tempTickData2);
                Gokz.Utils.hermitePosition(d0.position, d1.position, d2.position, d3.position, t, this.tickData.position);
                Gokz.Utils.hermiteAngles(d0.angles, d1.angles, d2.angles, d3.angles, t, this.tickData.angles);
                eyeHeight = Gokz.Utils.hermiteValue(d0.getEyeHeight(), d1.getEyeHeight(), d2.getEyeHeight(), d3.getEyeHeight(), t);
            }
            if (this.cameraMode === SourceUtils.CameraMode.Fixed) {
                this.mainCamera.setPosition(this.tickData.position.x, this.tickData.position.y, this.tickData.position.z + eyeHeight);
                this.setCameraAngles((this.tickData.angles.y - 90) * Math.PI / 180, -this.tickData.angles.x * Math.PI / 180);
            }
            this.updated.dispatch(dt);
        };
        return ReplayViewer;
    }(SourceUtils.MapViewer));
    Gokz.ReplayViewer = ReplayViewer;
})(Gokz || (Gokz = {}));
var Gokz;
(function (Gokz) {
    var RouteLine = (function (_super) {
        __extends(RouteLine, _super);
        function RouteLine(map, replay) {
            _super.call(this, map, { classname: "route_line", clusters: null });
            this.isVisible = false;
            this.segments = new Array(Math.ceil(replay.tickCount / RouteLine.segmentTicks));
            var tickData = new Gokz.TickData();
            var progressScale = 16 / replay.tickRate;
            var lastPos = new Facepunch.Vector3();
            var currPos = new Facepunch.Vector3();
            for (var i = 0; i < this.segments.length; ++i) {
                var firstTick = i * RouteLine.segmentTicks;
                var lastTick = Math.min((i + 1) * RouteLine.segmentTicks, replay.tickCount - 1);
                var segment = this.segments[i] = {
                    debugLine: new WebGame.DebugLine(map.viewer),
                    clusters: {}
                };
                var debugLine = segment.debugLine;
                var clusters = segment.clusters;
                debugLine.setColor({ x: 0.125, y: 0.75, z: 0.125 }, { x: 0.0, y: 0.25, z: 0.0 });
                debugLine.frequency = 4.0;
                var lineStartTick = firstTick;
                for (var t = firstTick; t <= lastTick; ++t) {
                    replay.getTickData(t, tickData);
                    currPos.copy(tickData.position);
                    currPos.z += 16;
                    var leaf = map.getLeafAt(currPos);
                    if (leaf != null && leaf.cluster !== -1) {
                        clusters[leaf.cluster] = true;
                    }
                    // Start new line if first in segment or player teleported
                    if (t === firstTick || lastPos.sub(currPos).lengthSq() > 1024.0) {
                        debugLine.moveTo(currPos);
                        lineStartTick = t;
                    }
                    else {
                        debugLine.lineTo(currPos, (t - lineStartTick) * progressScale);
                    }
                    lastPos.copy(currPos);
                }
                debugLine.update();
            }
        }
        Object.defineProperty(RouteLine.prototype, "visible", {
            get: function () {
                return this.isVisible;
            },
            set: function (value) {
                if (this.isVisible === value)
                    return;
                this.isVisible = value;
                if (value) {
                    this.map.addPvsEntity(this);
                }
                else {
                    this.map.removePvsEntity(this);
                }
                this.map.viewer.forceDrawListInvalidation(true);
            },
            enumerable: true,
            configurable: true
        });
        RouteLine.prototype.onPopulateDrawList = function (drawList, clusters) {
            for (var _i = 0, _a = this.segments; _i < _a.length; _i++) {
                var segment = _a[_i];
                if (clusters == null) {
                    drawList.addItem(segment.debugLine);
                    continue;
                }
                var segmentClusters = segment.clusters;
                for (var _b = 0, clusters_1 = clusters; _b < clusters_1.length; _b++) {
                    var cluster = clusters_1[_b];
                    if (segmentClusters[cluster]) {
                        drawList.addItem(segment.debugLine);
                        break;
                    }
                }
            }
        };
        RouteLine.prototype.dispose = function () {
            this.visible = false;
            for (var _i = 0, _a = this.segments; _i < _a.length; _i++) {
                var segment = _a[_i];
                segment.debugLine.dispose();
            }
            this.segments.splice(0, this.segments.length);
        };
        RouteLine.segmentTicks = 60 * 128;
        return RouteLine;
    }(SourceUtils.Entities.PvsEntity));
    Gokz.RouteLine = RouteLine;
})(Gokz || (Gokz = {}));
var Gokz;
(function (Gokz) {
    var Utils = (function () {
        function Utils() {
        }
        Utils.deltaAngle = function (a, b) {
            return (b - a) - Math.floor((b - a + 180) / 360) * 360;
        };
        Utils.hermiteValue = function (p0, p1, p2, p3, t) {
            var m0 = (p2 - p0) * 0.5;
            var m1 = (p3 - p1) * 0.5;
            var t2 = t * t;
            var t3 = t * t * t;
            return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m0
                + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m1;
        };
        Utils.hermitePosition = function (p0, p1, p2, p3, t, out) {
            out.x = Utils.hermiteValue(p0.x, p1.x, p2.x, p3.x, t);
            out.y = Utils.hermiteValue(p0.y, p1.y, p2.y, p3.y, t);
            out.z = Utils.hermiteValue(p0.z, p1.z, p2.z, p3.z, t);
        };
        Utils.hermiteAngles = function (a0, a1, a2, a3, t, out) {
            out.x = Utils.hermiteValue(a1.x + Utils.deltaAngle(a1.x, a0.x), a1.x, a1.x + Utils.deltaAngle(a1.x, a2.x), a1.x + Utils.deltaAngle(a1.x, a3.x), t);
            out.y = Utils.hermiteValue(a1.y + Utils.deltaAngle(a1.y, a0.y), a1.y, a1.y + Utils.deltaAngle(a1.y, a2.y), a1.y + Utils.deltaAngle(a1.y, a3.y), t);
        };
        return Utils;
    }());
    Gokz.Utils = Utils;
})(Gokz || (Gokz = {}));
