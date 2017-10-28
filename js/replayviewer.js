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
var TickData = (function () {
    function TickData() {
        this.position = new Facepunch.Vector3();
        this.angles = new Facepunch.Vector2();
        this.buttons = 0;
        this.flags = 0;
    }
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
        this.playerIp = reader.readAsciiString();
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
        _this.tickData = new TickData();
        _this.tick = -1;
        _this.spareTime = 0;
        return _this;
    }
    ReplayViewer.prototype.onInitialize = function () {
        _super.prototype.onInitialize.call(this);
        this.canLockPointer = false;
        this.useDefaultCameraControl = false;
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
    ReplayViewer.prototype.setReplay = function (replay) {
        this.replay = replay;
        this.setTick(0);
    };
    ReplayViewer.prototype.setTick = function (tick) {
        if (tick >= this.replay.tickCount)
            tick = 0;
        this.tick = tick;
        this.replay.getTickData(tick, this.tickData);
    };
    ReplayViewer.prototype.onKeyDown = function (key) {
        switch (key) {
            case WebGame.Key.F:
                this.toggleFullscreen();
                break;
        }
        return _super.prototype.onKeyDown.call(this, key);
    };
    ReplayViewer.prototype.onUpdateFrame = function (dt) {
        _super.prototype.onUpdateFrame.call(this, dt);
        if (this.replay == null)
            return;
        var tickPeriod = 1.0 / this.replay.tickRate;
        this.spareTime += dt;
        while (this.spareTime >= tickPeriod) {
            this.spareTime -= tickPeriod;
            this.setTick(this.tick + 1);
        }
        this.mainCamera.setPosition(this.tickData.position.x, this.tickData.position.y, this.tickData.position.z + 64);
        this.setCameraAngles((this.tickData.angles.y - 90) * Math.PI / 180, -this.tickData.angles.x * Math.PI / 180);
    };
    return ReplayViewer;
}(SourceUtils.MapViewer));
