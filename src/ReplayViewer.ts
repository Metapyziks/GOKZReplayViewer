///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>

import WebGame = Facepunch.WebGame;

namespace Gokz {
    export interface IHashData {
        t?: number;
    }

    export class ReplayViewer extends SourceUtils.MapViewer {

        //
        // Private properties
        //

        private messageElem: HTMLElement;

        private lastReplay: ReplayFile;
        private currentMapName: string;

        private pauseTime = 1.0;
        private pauseTicks: number;

        private wakeLock: any;

        private spareTime = 0;
        private prevTick = undefined;

        private tickData = new TickData();

        private tempTickData0 = new TickData();
        private tempTickData1 = new TickData();
        private tempTickData2 = new TickData();

        //
        // Public properties
        //

        readonly keyDisplay: KeyDisplay;
        readonly controls: ReplayControls;

        mapBaseUrl: string;
        replay: ReplayFile;

        saveTickInHash = true;

        tick = -1;
        playbackRate = 1.0;
        autoRepeat = true;
        isScrubbing = false;
        isPlaying = false;

        showCrosshair = true;

        //
        // Public events
        //

        // (replay: ReplayFile, sender: ReplayViewer)
        readonly replayLoaded = new Event<ReplayFile, ReplayViewer>(this);

        // (tickData: TickData, sender: ReplayViewer)
        readonly tickChanged = new ChangedEvent<number, TickData, ReplayViewer>(this);
        
        // (oldTick: number, sender: ReplayViewer)
        readonly playbackSkipped = new Event<number, ReplayViewer>(this);
        
        // (playbackRate: number, sender: ReplayViewer)
        readonly playbackRateChanged = new ChangedEvent<number, number, ReplayViewer>(this);
        
        // (isPlaying: boolean, sender: ReplayViewer)
        readonly isPlayingChanged = new ChangedEvent<boolean, boolean, ReplayViewer>(this);
        
        // (showCrosshair: boolean, sender: ReplayViewer)
        readonly showCrosshairChanged = new ChangedEvent<boolean, boolean, ReplayViewer>(this);

        //
        // Public constructors
        //

        constructor(container: HTMLElement) {
            super(container);

            this.saveCameraPosInHash = false;

            this.controls = new ReplayControls(this);
            this.keyDisplay = new KeyDisplay(this, this.controls.playbackBarElem);

            const crosshair = document.createElement("div");
            crosshair.classList.add("crosshair");
            container.appendChild(crosshair);

            this.showCrosshairChanged.addListener(showCrosshair => {
                crosshair.hidden = !showCrosshair;
            });

            this.isPlayingChanged.addListener(isPlaying => {
                if (!isPlaying && this.saveTickInHash) this.updateTickHash();

                if (isPlaying) {
                    this.wakeLock = (navigator as any).wakeLock;
                    if (this.wakeLock != null) {
                        this.wakeLock.request("display");
                    }
                } else if (this.wakeLock != null) {
                    this.wakeLock.release("display");
                    this.wakeLock = null;
                }
            });
        }

        //
        // Public Methods
        //

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
            if (this.replay == null || !this.saveTickInHash) return;
            this.setHash({ t: this.replay.clampTick(this.tick) + 1 });
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
            if (!this.saveTickInHash) return;

            const data = hash as IHashData;

            if (data.t !== undefined && this.tick !== data.t) {
                this.tick = data.t - 1;
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
            this.prevTick = undefined;

            this.replayLoaded.dispatch(this.replay);

            if (this.currentMapName !== replay.mapName) {
                if (this.currentMapName != null) {
                    this.map.unload();
                }

                const version = new Date().getTime().toString(16);

                this.currentMapName = replay.mapName;
                this.loadMap(`${this.mapBaseUrl}/${replay.mapName}/index.json?v=${version}`);
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

            this.showCrosshairChanged.update(this.showCrosshair);
            this.playbackRateChanged.update(this.playbackRate);

            if (this.replay == null) return;

            const replay = this.replay;
            const tickPeriod = 1.0 / replay.tickRate;

            this.isPlayingChanged.update(this.isPlaying);

            if (this.prevTick !== undefined && this.tick !== this.prevTick) {
                this.playbackSkipped.dispatch(this.prevTick);
            }

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

            this.prevTick = this.tick;

            replay.getTickData(replay.clampTick(this.tick), this.tickData);
            let eyeHeight = this.tickData.getEyeHeight();

            this.tickChanged.update(this.tick, this.tickData);

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

            this.mainCamera.setPosition(
                this.tickData.position.x,
                this.tickData.position.y,
                this.tickData.position.z + eyeHeight);

            this.setCameraAngles(
                (this.tickData.angles.y - 90) * Math.PI / 180,
                -this.tickData.angles.x * Math.PI / 180);
        }
    }
}
