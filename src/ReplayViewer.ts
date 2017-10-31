///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>

import WebGame = Facepunch.WebGame;

namespace Gokz {
    export interface IHashData {
        t?: number;
    }

    export class ReplayViewer extends SourceUtils.MapViewer {
        private messageElem: HTMLElement;

        private lastReplay: ReplayFile;
        private currentMapName: string;
        mapBaseUrl: string;

        private pauseTime = 1.0;
        private pauseTicks: number;

        private spareTime = 0;

        private tickData = new TickData();

        private tempTickData0 = new TickData();
        private tempTickData1 = new TickData();
        private tempTickData2 = new TickData();

        readonly keyDisplay: KeyDisplay;
        readonly controls: ReplayControls;

        replay: ReplayFile;
        tick = -1;
        playbackRate = 1.0;
        autoRepeat = true;
        isScrubbing = false;
        isPlaying = false;

        //
        // Events
        //

        onreplayloaded: (this: ReplayViewer, replay: ReplayFile) => void;

        //
        // Constructors
        //

        constructor(container: HTMLElement) {
            super(container);

            this.controls = new ReplayControls(this);
            this.keyDisplay = new KeyDisplay(container);
        }

        //
        // Overrides
        //

        protected onCreateMessagePanel(): HTMLElement {
            const elem = document.createElement("div");
            elem.classList.add("message");

            this.container.appendChild(elem);

            return elem;
        }

        protected onInitialize(): void {
            super.onInitialize();

            this.canLockPointer = false;
            this.cameraMode = SourceUtils.CameraMode.Fixed;
        }

        protected onHashChange(hash: string | Object): void {
            if (typeof hash === "string") return;

            const data = hash as IHashData;

            if (data.t !== undefined && this.tick !== data.t) {
                this.tick = data.t;
                this.isPlaying = false;
            }
        }

        private ignoreMouseUp = true;

        protected onMouseDown(button: WebGame.MouseButton, screenPos: Facepunch.Vector2): boolean {
            this.ignoreMouseUp = event.target !== this.canvas;
            return super.onMouseDown(button, screenPos);
        }

        protected onMouseUp(button: WebGame.MouseButton, screenPos: Facepunch.Vector2): boolean {
            const ignored = this.ignoreMouseUp || event.target !== this.canvas;
            this.ignoreMouseUp = true;

            if (super.onMouseUp(button, screenPos)) return true;

            if (!ignored && this.controls.hideSpeedControl()) {
                return true;
            }

            if (!ignored && button === WebGame.MouseButton.Left && this.replay != null && this.map.isReady()) {
                this.isPlaying = !this.isPlaying;
                return true;
            }

            return false;
        }

        protected onKeyDown(key: WebGame.Key): boolean {
            switch (key) {
                case WebGame.Key.F:
                    this.toggleFullscreen();
                    return true;
                case WebGame.Key.Space:
                    if (this.replay != null && this.map.isReady()) {
                        this.isPlaying = !this.isPlaying;
                    }
                    return true;
            }

            return super.onKeyDown(key);
        }

        protected onChangeReplay(replay: ReplayFile): void {
            this.pauseTicks = Math.round(replay.tickRate * this.pauseTime);
            this.tick = this.tick === -1 ? 0 : this.tick;
            this.spareTime = 0;

            this.controls.setScrubberMax(this.replay.tickCount);

            if (this.onreplayloaded != null) {
                this.onreplayloaded(this.replay);
            }

            if (this.currentMapName !== replay.mapName) {
                if (this.currentMapName != null) {
                    this.map.unload();
                }

                this.currentMapName = replay.mapName;
                this.loadMap(`${this.mapBaseUrl}/${replay.mapName}/index.json`);
            }
        }

        protected onUpdateFrame(dt: number): void {
            super.onUpdateFrame(dt);

            if (this.replay != this.lastReplay) {
                this.lastReplay = this.replay;

                if (this.replay != null) {
                    this.onChangeReplay(this.replay);
                }
            }

            if (this.replay == null) return;

            const replay = this.replay;
            const tickPeriod = 1.0 / replay.tickRate;

            if (this.map.isReady() && this.isPlaying && !this.isScrubbing) {
                this.spareTime += dt * this.playbackRate;

                const oldTick = this.tick;

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
            } else {
                this.spareTime = 0;
            }

            replay.getTickData(replay.clampTick(this.tick), this.tickData);
            let eyeHeight = this.tickData.getEyeHeight();

            if (this.spareTime >= 0 && this.spareTime <= tickPeriod) {
                const t = this.spareTime / tickPeriod;

                const d0 = replay.getTickData(replay.clampTick(this.tick - 1), this.tempTickData0);
                const d1 = this.tickData;
                const d2 = replay.getTickData(replay.clampTick(this.tick + 1), this.tempTickData1);
                const d3 = replay.getTickData(replay.clampTick(this.tick + 2), this.tempTickData2);

                Utils.hermitePosition(d0.position, d1.position,
                    d2.position, d3.position, t, this.tickData.position);
                    Utils.hermiteAngles(d0.angles, d1.angles,
                    d2.angles, d3.angles, t, this.tickData.angles);

                eyeHeight = Utils.hermiteValue(
                    d0.getEyeHeight(), d1.getEyeHeight(),
                    d2.getEyeHeight(), d3.getEyeHeight(), t);
            }

            this.controls.update();
            this.keyDisplay.update(this.tickData.buttons);

            this.mainCamera.setPosition(
                this.tickData.position.x,
                this.tickData.position.y,
                this.tickData.position.z + eyeHeight);

            this.setCameraAngles(
                (this.tickData.angles.y - 90) * Math.PI / 180,
                -this.tickData.angles.x * Math.PI / 180);
        }

        showMessage(message: string): void {
            if (this.messageElem === undefined) {
                this.messageElem = this.onCreateMessagePanel();
            }

            if (this.messageElem == null) return;

            this.messageElem.innerText = message;
        }

        loadReplay(url: string): void {
            console.log(`Downloading: ${url}`);

            const req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.responseType = "arraybuffer";
            req.onload = ev => {
                if (req.status !== 200) {
                    this.showMessage(`Unable to download replay: ${req.statusText}`);
                    return;
                }

                const arrayBuffer = req.response;
                if (arrayBuffer) {
                    try {
                        this.replay = new ReplayFile(arrayBuffer);
                    } catch (e) {
                        this.showMessage(`Unable to read replay: ${e}`);
                    }
                }
            };
            req.send(null);
        }

        updateTickHash(): void {
            if (this.replay == null) return;
            this.setHash({ t: this.replay.clampTick(this.tick) + 1 });
        }
    }
}
