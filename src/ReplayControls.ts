namespace Gokz {
    export class ReplayControls {
        private static readonly speedSliderValues = [-5, -1, 0.1, 0.25, 1, 2, 5, 10];

        private readonly viewer: ReplayViewer;
        private readonly container: HTMLElement;

        readonly playbackBarElem: HTMLElement;
        readonly timeElem: HTMLElement;
        readonly speedElem: HTMLElement;
        readonly pauseElem: HTMLElement;
        readonly resumeElem: HTMLElement;
        readonly settingsElem: HTMLElement;
        readonly fullscreenElem: HTMLElement;
        readonly scrubberElem: HTMLInputElement;

        readonly speedControlElem: HTMLElement;
        readonly speedSliderElem: HTMLInputElement;

        private playbackBarVisible = true;
        private mouseOverPlaybackBar = false;
        private speedControlVisible = false;
        private lastActionTime: number;

        autoHidePeriod = 2;

        constructor(viewer: ReplayViewer) {
            this.viewer = viewer;
            this.container = viewer.container;

            const playbackBar = this.playbackBarElem = document.createElement("div");
            playbackBar.classList.add("playback-bar");
            playbackBar.innerHTML = `
                <div class="scrubber-container">
                <input class="scrubber" type="range" min="0" max="1.0" value="0.0" step="1" />
                </div>`;

            playbackBar.addEventListener("mouseover", ev => {
                this.mouseOverPlaybackBar = true;
            });

            playbackBar.addEventListener("mouseout", ev => {
                this.mouseOverPlaybackBar = false;
            });

            this.container.appendChild(playbackBar);

            this.scrubberElem = playbackBar.getElementsByClassName("scrubber")[0] as HTMLInputElement;
            this.scrubberElem.addEventListener("input", ev => {
                viewer.tick = this.scrubberElem.valueAsNumber;
            });

            this.scrubberElem.addEventListener("mousedown", ev => {
                this.viewer.isScrubbing = true;
            });

            this.scrubberElem.addEventListener("mouseup", ev => {
                this.viewer.updateTickHash();
                this.viewer.isScrubbing = false;
            });

            this.timeElem = document.createElement("div");
            this.timeElem.classList.add("time");
            playbackBar.appendChild(this.timeElem);

            this.speedElem = document.createElement("div");
            this.speedElem.classList.add("speed");
            this.speedElem.addEventListener("click", ev => {
                if (this.speedControlVisible) this.hideSpeedControl();
                else this.showSpeedControl();
            });
            playbackBar.appendChild(this.speedElem);

            this.pauseElem = document.createElement("div");
            this.pauseElem.classList.add("pause");
            this.pauseElem.classList.add("control");
            this.pauseElem.addEventListener("click", ev => this.viewer.isPlaying = false);
            playbackBar.appendChild(this.pauseElem);

            this.resumeElem = document.createElement("div");
            this.resumeElem.classList.add("play");
            this.resumeElem.classList.add("control");
            this.resumeElem.addEventListener("click", ev => this.viewer.isPlaying = true);
            playbackBar.appendChild(this.resumeElem);

            this.settingsElem = document.createElement("div");
            this.settingsElem.classList.add("settings");
            this.settingsElem.classList.add("control");
            this.settingsElem.addEventListener("click", ev => viewer.showOptions = !viewer.showOptions);
            playbackBar.appendChild(this.settingsElem);

            this.fullscreenElem = document.createElement("div");
            this.fullscreenElem.classList.add("fullscreen");
            this.fullscreenElem.classList.add("control");
            this.fullscreenElem.addEventListener("click", ev => this.viewer.toggleFullscreen());
            playbackBar.appendChild(this.fullscreenElem);

            this.speedControlElem = document.createElement("div");
            this.speedControlElem.classList.add("speed-control");
            this.speedControlElem.innerHTML = `<input class="speed-slider" type="range" min="0" max="${ReplayControls.speedSliderValues.length - 1}" step="1">`;
            this.container.appendChild(this.speedControlElem);

            this.speedSliderElem = this.speedControlElem.getElementsByClassName("speed-slider")[0] as HTMLInputElement;
            this.speedSliderElem.addEventListener("input", ev => {
                this.viewer.playbackRate = ReplayControls.speedSliderValues[this.speedSliderElem.valueAsNumber];
            });

            viewer.replayLoaded.addListener(replay => {
                this.scrubberElem.max = replay.tickCount.toString();
            });

            viewer.isPlayingChanged.addListener(isPlaying => {
                this.pauseElem.style.display = isPlaying ? "block" : "none";
                this.resumeElem.style.display = isPlaying ? "none" : "block";

                this.showPlaybackBar();
            });

            viewer.playbackRateChanged.addListener(playbackRate => {
                this.speedElem.innerText = playbackRate.toString();
                this.speedSliderElem.valueAsNumber = ReplayControls.speedSliderValues.indexOf(playbackRate);
            });

            viewer.tickChanged.addListener(tickData => {
                const replay = this.viewer.replay;
                if (replay != null) {
                    const totalSeconds = replay.clampTick(tickData.tick) / replay.tickRate;
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds - minutes * 60;
                    const secondsString = seconds.toFixed(1);
                    this.timeElem.innerText = `${minutes}:${secondsString.indexOf(".") === 1 ? "0" : ""}${secondsString}`;
                }

                this.scrubberElem.valueAsNumber = tickData.tick;
            });

            viewer.updated.addListener(dt => {
                if ((viewer.isPlaying && !this.mouseOverPlaybackBar) || viewer.isPointerLocked()) {
                    const sinceLastAction = (performance.now() - this.lastActionTime) / 1000;
                    const hidePeriod = viewer.isPointerLocked() ? 0 : this.autoHidePeriod;
                    if (sinceLastAction >= hidePeriod) {
                        this.hidePlaybackBar();
                    }
                }
            });

            viewer.container.addEventListener("mousemove", ev => {
                if (!viewer.isPointerLocked()) {
                    this.showPlaybackBar();
                }
            });
        }

        showPlaybackBar(): void {
            if (this.playbackBarVisible) {
                this.lastActionTime = performance.now();
                return;
            }

            this.playbackBarVisible = true;
            this.playbackBarElem.classList.remove("hidden");
        }

        hidePlaybackBar(): void {
            if (!this.playbackBarVisible) return;
            this.playbackBarVisible = false;
            this.playbackBarElem.classList.add("hidden");
            this.lastActionTime = undefined;

            this.hideSpeedControl();
        }

        showSpeedControl(): boolean {
            if (this.speedControlVisible) return false;

            this.speedControlVisible = true;
            this.speedControlElem.style.display = "block";

            this.viewer.showOptions = false;

            return true;
        }

        hideSpeedControl(): boolean {
            if (!this.speedControlVisible) return false;

            this.speedControlVisible = false;
            this.speedControlElem.style.display = "none";

            return true;
        }

        showSettings(): void {
            // TODO
            this.viewer.showDebugPanel = !this.viewer.showDebugPanel;
        }
    }
}