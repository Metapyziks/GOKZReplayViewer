///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>

import WebGame = Facepunch.WebGame;

namespace Gokz {
    export interface IHashData {
        t?: number;
    }

    export class ReplayViewer extends SourceUtils.MapViewer {
        private static readonly speedSliderValues = [-5, -1, 0.1, 0.25, 1, 2, 5, 10];

        private replay: ReplayFile;
        private currentMapName: string;
        private mapBaseUrl: string;

        private timeElem: HTMLElement;
        private speedElem: HTMLElement;
        private pauseElem: HTMLElement;
        private resumeElem: HTMLElement;
        private settingsElem: HTMLElement;
        private fullscreenElem: HTMLElement;
        private scrubberElem: HTMLInputElement;

        private speedControlElem: HTMLElement;
        private speedSliderElem: HTMLInputElement;
        private speedControlVisible = false;

        private messageElem: HTMLElement;

        private pauseTime = 1.0;
        private pauseTicks: number;

        private isPaused = true;
        private isScrubbing = false;

        private tick = -1;
        private spareTime = 0;
        private playbackRate = 1;

        private tickData = new TickData();

        private tempTickData0 = new TickData();
        private tempTickData1 = new TickData();
        private tempTickData2 = new TickData();

        readonly keyDisplay: KeyDisplay;

        autoRepeat = true;

        //
        // Events
        //

        onreplayloaded: (this: ReplayViewer, replay: ReplayFile) => void;

        //
        // Constructors
        //

        constructor(container: HTMLElement) {
            super(container);

            this.onCreatePlaybackBar();

            this.keyDisplay = new KeyDisplay(container);
        }

        //
        // Overrides
        //

        protected onCreatePlaybackBar(): HTMLElement {
            const playbackBar = document.createElement("div");
            playbackBar.classList.add("playback-bar");
            playbackBar.innerHTML = `
                <div class="scrubber-container">
                <input class="scrubber" type="range" min="0" max="1.0" value="0.0" step="1" />
                </div>`;

            this.container.appendChild(playbackBar);

            this.scrubberElem = playbackBar.getElementsByClassName("scrubber")[0] as HTMLInputElement;
            this.scrubberElem.oninput = ev => {
                this.gotoTick(this.scrubberElem.valueAsNumber);
            };

            this.scrubberElem.onmousedown = ev => {
                this.isScrubbing = true;
            };

            this.scrubberElem.onmouseup = ev => {
                this.updateTickHash();
                this.isScrubbing = false;
            };

            this.timeElem = document.createElement("div");
            this.timeElem.classList.add("time");
            playbackBar.appendChild(this.timeElem);

            this.speedElem = document.createElement("div");
            this.speedElem.classList.add("speed");
            this.speedElem.onclick = ev => {
                if (this.speedControlVisible) this.hideSpeedControl();
                else this.showSpeedControl();
            }
            playbackBar.appendChild(this.speedElem);

            this.pauseElem = document.createElement("div");
            this.pauseElem.classList.add("pause");
            this.pauseElem.classList.add("control");
            this.pauseElem.onclick = ev => this.pause();
            playbackBar.appendChild(this.pauseElem);

            this.resumeElem = document.createElement("div");
            this.resumeElem.classList.add("play");
            this.resumeElem.classList.add("control");
            this.resumeElem.onclick = ev => this.resume();
            playbackBar.appendChild(this.resumeElem);

            this.settingsElem = document.createElement("div");
            this.settingsElem.classList.add("settings");
            this.settingsElem.classList.add("control");
            this.settingsElem.onclick = ev => this.showSettings();
            playbackBar.appendChild(this.settingsElem);

            this.fullscreenElem = document.createElement("div");
            this.fullscreenElem.classList.add("fullscreen");
            this.fullscreenElem.classList.add("control");
            this.fullscreenElem.onclick = ev => this.toggleFullscreen();
            playbackBar.appendChild(this.fullscreenElem);

            this.speedControlElem = document.createElement("div");
            this.speedControlElem.classList.add("speed-control");
            this.speedControlElem.innerHTML = `<input class="speed-slider" type="range" min="0" max="${ReplayViewer.speedSliderValues.length - 1}" step="1">`;
            this.container.appendChild(this.speedControlElem);

            this.speedSliderElem = this.speedControlElem.getElementsByClassName("speed-slider")[0] as HTMLInputElement;
            this.speedSliderElem.oninput = ev => {
                this.setPlaybackRate(ReplayViewer.speedSliderValues[this.speedSliderElem.valueAsNumber]);
            }

            return playbackBar;
        }

        protected onCreateMessagePanel(): HTMLElement {
            const elem = document.createElement("div");
            elem.classList.add("message");

            this.container.appendChild(elem);

            return elem;
        }

        protected onInitialize(): void {
            super.onInitialize();

            this.setPlaybackRate(1);

            this.canLockPointer = false;
            this.cameraMode = SourceUtils.CameraMode.Fixed;
        }

        protected onHashChange(hash: string | Object): void {
            if (typeof hash === "string") return;

            const data = hash as IHashData;

            if (data.t !== undefined && this.tick !== data.t) {
                this.gotoTick(data.t);
                this.pause();
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

            if (!ignored && this.speedControlVisible) {
                this.hideSpeedControl();
                return true;
            }

            if (!ignored && button === WebGame.MouseButton.Left && this.replay != null && this.map.isReady()) {
                this.togglePause();
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
                        this.togglePause();
                    }
                    return true;
            }

            return super.onKeyDown(key);
        }

        protected onUpdateFrame(dt: number): void {
            super.onUpdateFrame(dt);

            if (this.replay == null) return;

            const tickPeriod = 1.0 / this.replay.tickRate;

            if (this.map.isReady() && !this.isPaused && !this.isScrubbing) {
                this.spareTime += dt * this.playbackRate;

                const oldTick = this.tick;

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

                if (this.tick !== oldTick) {
                    this.onTickChanged(this.tick);
                }
            } else {
                this.spareTime = 0;
            }

            this.replay.getTickData(this.clampTick(this.tick), this.tickData);
            let eyeHeight = this.tickData.getEyeHeight();

            if (this.spareTime >= 0 && this.spareTime <= tickPeriod) {
                const t = this.spareTime / tickPeriod;

                const d0 = this.replay.getTickData(this.clampTick(this.tick - 1), this.tempTickData0);
                const d1 = this.tickData;
                const d2 = this.replay.getTickData(this.clampTick(this.tick + 1), this.tempTickData1);
                const d3 = this.replay.getTickData(this.clampTick(this.tick + 2), this.tempTickData2);

                Utils.hermitePosition(d0.position, d1.position,
                    d2.position, d3.position, t, this.tickData.position);
                    Utils.hermiteAngles(d0.angles, d1.angles,
                    d2.angles, d3.angles, t, this.tickData.angles);

                eyeHeight = Utils.hermiteValue(
                    d0.getEyeHeight(), d1.getEyeHeight(),
                    d2.getEyeHeight(), d3.getEyeHeight(), t);
            }

            this.keyDisplay.update(this.tickData.buttons);

            this.mainCamera.setPosition(
                this.tickData.position.x,
                this.tickData.position.y,
                this.tickData.position.z + eyeHeight);

            this.setCameraAngles(
                (this.tickData.angles.y - 90) * Math.PI / 180,
                -this.tickData.angles.x * Math.PI / 180);
        }

        showSettings(): void {
            // TODO
            this.showDebugPanel = !this.showDebugPanel;
        }

        showSpeedControl(): void {
            this.speedControlVisible = true;
            this.speedControlElem.style.display = "block";
        }

        hideSpeedControl(): void {
            this.speedControlVisible = false;
            this.speedControlElem.style.display = "none";
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
                        this.setReplay(new ReplayFile(arrayBuffer));
                    } catch (e) {
                        this.showMessage(`Unable to read replay: ${e}`);
                    }
                }
            };
            req.send(null);
        }

        setMapBaseUrl(url: string): void {
            this.mapBaseUrl = url;
        }

        setReplay(replay: ReplayFile): void {
            this.replay = replay;
            this.pauseTicks = Math.round(replay.tickRate * this.pauseTime);
            this.tick = this.tick === -1 ? 0 : this.tick;
            this.spareTime = 0;

            this.scrubberElem.max = this.replay.tickCount.toString();
            this.onTickChanged(this.tick);

            if (this.onreplayloaded != null) {
                this.onreplayloaded(this.replay);
            }

            if (this.currentMapName !== replay.mapName) {
                this.currentMapName = replay.mapName;
                this.loadMap(`${this.mapBaseUrl}/${replay.mapName}/index.json`);
            }
        }

        getIsPaused(): boolean {
            return this.isPaused;
        }

        pause(): void {
            this.isPaused = true;
            this.pauseElem.style.display = "none";
            this.resumeElem.style.display = "block";
            this.updateTickHash();
        }

        resume(): void {
            this.pauseElem.style.display = "block";
            this.resumeElem.style.display = "none";
            this.isPaused = false;
        }

        togglePause(): void {
            if (this.isPaused) this.resume();
            else this.pause();
        }

        private updateTickHash(): void {
            this.setHash({ t: this.clampTick(this.tick) + 1 });
        }

        protected onTickChanged(tick: number): void {
            if (this.replay != null) {
                const totalSeconds = this.clampTick(this.tick) / this.replay.tickRate;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds - minutes * 60;
                const secondsString = seconds.toFixed(1);
                this.timeElem.innerText = `${minutes}:${secondsString.indexOf(".") === 1 ? "0" : ""}${secondsString}`;
            }

            this.scrubberElem.valueAsNumber = tick;
        }

        gotoTick(tick: number): void {
            if (tick === this.tick) return;
            this.tick = tick;
            this.onTickChanged(tick);
        }

        setPlaybackRate(speed: number): void {
            this.playbackRate = speed;
            this.speedElem.innerText = speed.toString();
            this.speedSliderElem.valueAsNumber = ReplayViewer.speedSliderValues.indexOf(this.playbackRate);
        }

        getPlaybackRate(): number {
            return this.playbackRate;
        }

        private clampTick(index: number): number {
            return index < 0
                ? 0 : this.replay != null && index >= this.replay.tickCount
                ? this.replay.tickCount - 1 : index;
        }
    }
}
