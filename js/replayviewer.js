var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SeekOrigin;
(function (SeekOrigin) {
    SeekOrigin[SeekOrigin["Begin"] = 0] = "Begin";
    SeekOrigin[SeekOrigin["Current"] = 1] = "Current";
    SeekOrigin[SeekOrigin["End"] = 2] = "End";
})(SeekOrigin || (SeekOrigin = {}));
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
    BinaryReader.prototype.readAsciiString = function (length) {
        if (length === undefined) {
            length = this.readUint8();
        }
        var result = "";
        for (var i = 0; i < length; ++i) {
            result += String.fromCharCode(this.readUint8());
        }
        return result;
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
var Button;
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
})(Button || (Button = {}));
var EntityFlag;
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
})(EntityFlag || (EntityFlag = {}));
var TickData = (function () {
    function TickData() {
        this.position = new Facepunch.Vector3();
        this.angles = new Facepunch.Vector2();
        this.buttons = 0;
        this.flags = 0;
    }
    TickData.prototype.getEyeHeight = function () {
        return (this.flags & EntityFlag.Ducking) != 0 ? 46 : 64;
    };
    return TickData;
}());
var ReplayFile = (function () {
    function ReplayFile(data) {
        var reader = this.reader = new BinaryReader(data);
        var magic = reader.readInt32();
        if (magic !== ReplayFile.MAGIC) {
            throw "Unrecognised replay file format.";
        }
        this.formatVersion = reader.readUint8();
        this.pluginVersion = reader.readAsciiString();
        this.mapName = reader.readAsciiString();
        this.course = reader.readInt32();
        this.mode = reader.readInt32();
        this.style = reader.readInt32();
        this.time = reader.readFloat32();
        this.teleportsUsed = reader.readInt32();
        this.steamId = reader.readInt32();
        this.steamId2 = reader.readAsciiString();
        reader.readAsciiString();
        this.playerName = reader.readAsciiString();
        this.tickCount = reader.readInt32();
        this.tickRate = Math.round(this.tickCount / this.time); // todo
        this.firstTickOffset = reader.getOffset();
        this.tickSize = 7 * 4;
    }
    ReplayFile.prototype.getTickData = function (tick, data) {
        if (data === undefined)
            data = new TickData();
        var reader = this.reader;
        reader.seek(this.firstTickOffset + this.tickSize * tick, SeekOrigin.Begin);
        reader.readVector3(data.position);
        reader.readVector2(data.angles);
        data.buttons = reader.readInt32();
        data.flags = reader.readInt32();
        return data;
    };
    return ReplayFile;
}());
ReplayFile.MAGIC = 0x676F6B7A;
///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>
var WebGame = Facepunch.WebGame;
var ReplayViewer = (function (_super) {
    __extends(ReplayViewer, _super);
    function ReplayViewer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ignoreHashChange = false;
        _this.playbackRate = 1;
        _this.pauseTime = 1.0;
        _this.isPaused = false;
        _this.tick = -1;
        _this.spareTime = 0;
        _this.tickData = new TickData();
        _this.tempTickData0 = new TickData();
        _this.tempTickData1 = new TickData();
        _this.tempTickData2 = new TickData();
        _this.ignoreMouseUp = false;
        return _this;
    }
    ReplayViewer.prototype.onInitialize = function () {
        var _this = this;
        _super.prototype.onInitialize.call(this);
        this.canLockPointer = false;
        this.useDefaultCameraControl = false;
        this.gotoTickHash();
        window.onhashchange = function (ev) {
            if (_this.ignoreHashChange)
                return;
            _this.gotoTickHash();
        };
        $("#playback-speed").on("input", function (ev) {
            var val = $("#playback-speed").val();
            var rate = val * Math.abs(val);
            _this.playbackRate = rate;
            $("#control-playbackrate").text(rate.toPrecision(2));
        });
    };
    ReplayViewer.prototype.loadReplay = function (url) {
        var _this = this;
        console.log("Downloading: " + url);
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "arraybuffer";
        req.onload = function (ev) {
            var arrayBuffer = req.response;
            if (arrayBuffer) {
                _this.setReplay(new ReplayFile(arrayBuffer));
            }
        };
        req.send(null);
    };
    ReplayViewer.prototype.setMapBaseUrl = function (url) {
        this.mapBaseUrl = url;
    };
    ReplayViewer.prototype.setReplay = function (replay) {
        this.replay = replay;
        this.pauseTicks = Math.round(replay.tickRate * this.pauseTime);
        this.tick = this.tick === -1 ? -this.pauseTicks : this.tick;
        this.spareTime = 0;
        var mins = Math.floor(replay.time / 60);
        var secs = replay.time - (mins * 60);
        var title = replay.playerName + " - " + replay.mapName + " - " + mins + ":" + (secs < 10 ? '0' : '') + secs.toFixed(3);
        $("#title").text(title);
        document.title = title;
        $("#control-totalticks").text(replay.tickCount.toLocaleString());
        if (this.currentMapName !== replay.mapName) {
            this.currentMapName = replay.mapName;
            this.loadMap(this.mapBaseUrl + "/" + replay.mapName + "/index.json");
        }
    };
    ReplayViewer.prototype.getIsPaused = function () {
        return this.isPaused;
    };
    ReplayViewer.prototype.pause = function () {
        this.isPaused = true;
        $("#pause").show();
        $("#play").hide();
        this.updateTickHash();
    };
    ReplayViewer.prototype.resume = function () {
        $("#pause").hide();
        this.isPaused = false;
    };
    ReplayViewer.prototype.togglePause = function () {
        if (this.isPaused)
            this.resume();
        else
            this.pause();
    };
    ReplayViewer.prototype.updateTickHash = function () {
        this.ignoreHashChange = true;
        window.location.hash = "#t" + (this.clampTick(this.tick) + 1);
        this.ignoreHashChange = false;
    };
    ReplayViewer.prototype.gotoTickHash = function () {
        if (window.location.hash != null && ReplayViewer.hashTickRegex.test(window.location.hash)) {
            this.gotoTick(parseInt(window.location.hash.substr(2)) - 1);
            this.pause();
        }
    };
    ReplayViewer.prototype.updateControlText = function () {
        $("#control-currenttick").text((this.clampTick(this.tick) + 1).toLocaleString());
    };
    ReplayViewer.prototype.gotoTick = function (tick) {
        this.tick = tick;
        this.updateControlText();
    };
    ReplayViewer.prototype.onMouseDown = function (button, screenPos) {
        this.ignoreMouseUp = $(".side-panel").find(":hover").length > 0;
        return _super.prototype.onMouseDown.call(this, button, screenPos);
    };
    ReplayViewer.prototype.onMouseUp = function (button, screenPos) {
        if (_super.prototype.onMouseUp.call(this, button, screenPos))
            return true;
        if (button === WebGame.MouseButton.Left && this.replay != null
            && this.map.isReady() && !this.ignoreMouseUp) {
            this.togglePause();
            return true;
        }
        return false;
    };
    ReplayViewer.prototype.onKeyDown = function (key) {
        switch (key) {
            case WebGame.Key.F:
                this.toggleFullscreen();
                return true;
            case WebGame.Key.Space:
                if (this.replay != null && this.map.isReady()) {
                    this.togglePause();
                }
                return true;
        }
        return _super.prototype.onKeyDown.call(this, key);
    };
    ReplayViewer.prototype.clampTick = function (index) {
        return index < 0
            ? 0 : this.replay != null && index >= this.replay.tickCount
            ? this.replay.tickCount - 1 : index;
    };
    ReplayViewer.prototype.deltaAngle = function (a, b) {
        return (b - a) - Math.floor((b - a + 180) / 360) * 360;
    };
    ReplayViewer.prototype.hermiteValue = function (p0, p1, p2, p3, t) {
        var m0 = (p2 - p0) * 0.5;
        var m1 = (p3 - p1) * 0.5;
        var t2 = t * t;
        var t3 = t * t * t;
        return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m0
            + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m1;
    };
    ReplayViewer.prototype.hermitePosition = function (p0, p1, p2, p3, t, out) {
        out.x = this.hermiteValue(p0.x, p1.x, p2.x, p3.x, t);
        out.y = this.hermiteValue(p0.y, p1.y, p2.y, p3.y, t);
        out.z = this.hermiteValue(p0.z, p1.z, p2.z, p3.z, t);
    };
    ReplayViewer.prototype.hermiteAngles = function (a0, a1, a2, a3, t, out) {
        out.x = this.hermiteValue(a1.x + this.deltaAngle(a1.x, a0.x), a1.x, a1.x + this.deltaAngle(a1.x, a2.x), a1.x + this.deltaAngle(a1.x, a3.x), t);
        out.y = this.hermiteValue(a1.y + this.deltaAngle(a1.y, a0.y), a1.y, a1.y + this.deltaAngle(a1.y, a2.y), a1.y + this.deltaAngle(a1.y, a3.y), t);
    };
    ReplayViewer.prototype.onUpdateFrame = function (dt) {
        _super.prototype.onUpdateFrame.call(this, dt);
        if (this.replay == null)
            return;
        var tickPeriod = 1.0 / this.replay.tickRate;
        if (this.map.isReady() && !this.isPaused) {
            this.spareTime += dt * this.playbackRate;
            // Forward playback
            while (this.spareTime > tickPeriod) {
                this.spareTime -= tickPeriod;
                this.tick += 1;
                if (this.tick > this.replay.tickCount + this.pauseTicks * 2) {
                    this.tick = -this.pauseTicks;
                }
            }
            // Rewinding
            while (this.spareTime < 0) {
                this.spareTime += tickPeriod;
                this.tick -= 1;
                if (this.tick < -this.pauseTicks * 2) {
                    this.tick = this.replay.tickCount + this.pauseTicks;
                }
            }
            this.updateControlText();
        }
        else {
            this.spareTime = 0;
        }
        this.replay.getTickData(this.clampTick(this.tick), this.tickData);
        var eyeHeight = this.tickData.getEyeHeight();
        if (this.spareTime >= 0 && this.spareTime <= tickPeriod) {
            var t = this.spareTime / tickPeriod;
            var d0 = this.replay.getTickData(this.clampTick(this.tick - 1), this.tempTickData0);
            var d1 = this.tickData;
            var d2 = this.replay.getTickData(this.clampTick(this.tick + 1), this.tempTickData1);
            var d3 = this.replay.getTickData(this.clampTick(this.tick + 2), this.tempTickData2);
            this.hermitePosition(d0.position, d1.position, d2.position, d3.position, t, this.tickData.position);
            this.hermiteAngles(d0.angles, d1.angles, d2.angles, d3.angles, t, this.tickData.angles);
            eyeHeight = this.hermiteValue(d0.getEyeHeight(), d1.getEyeHeight(), d2.getEyeHeight(), d3.getEyeHeight(), t);
        }
        this.mainCamera.setPosition(this.tickData.position.x, this.tickData.position.y, this.tickData.position.z + eyeHeight);
        this.setCameraAngles((this.tickData.angles.y - 90) * Math.PI / 180, -this.tickData.angles.x * Math.PI / 180);
    };
    return ReplayViewer;
}(SourceUtils.MapViewer));
ReplayViewer.hashTickRegex = /^#t[0-9]+$/;
