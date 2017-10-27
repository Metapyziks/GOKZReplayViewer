var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>
var WebGame = Facepunch.WebGame;
var ReplayViewer = (function (_super) {
    __extends(ReplayViewer, _super);
    function ReplayViewer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ReplayViewer.prototype.onInitialize = function () {
        _super.prototype.onInitialize.call(this);
        this.canLockPointer = false;
        this.useDefaultCameraControl = false;
    };
    return ReplayViewer;
}(SourceUtils.MapViewer));
