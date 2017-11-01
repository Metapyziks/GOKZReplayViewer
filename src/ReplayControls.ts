namespace Gokz {
    export class ReplayControls {
        private static readonly speedSliderValues = [-5, -1, 0.1, 0.25, 1, 2, 5, 10];

        private readonly viewer: ReplayViewer;
        private readonly container: HTMLElement;

        private readonly timeElem: HTMLElement;
        private readonly speedElem: HTMLElement;
        private readonly pauseElem: HTMLElement;
        private readonly resumeElem: HTMLElement;
        private readonly settingsElem: HTMLElement;
        private readonly fullscreenElem: HTMLElement;
        private readonly scrubberElem: HTMLInputElement;

        private readonly speedControlElem: HTMLElement;
        private readonly speedSliderElem: HTMLInputElement;

        private speedControlVisible = false;
        private wasPlaying: boolean;
        private lastTick: number;
        private lastTickCount: number;
        private lastPlaybackRate: number;

        constructor(viewer: ReplayViewer) {
            this.viewer = viewer;
            this.container = viewer.container;

            const playbackBar = document.createElement("div");
            playbackBar.classList.add("playback-bar");
            playbackBar.innerHTML = `
                <div class="scrubber-container">
                <input class="scrubber" type="range" min="0" max="1.0" value="0.0" step="1" />
                </div>`;

            this.container.appendChild(playbackBar);

            this.scrubberElem = playbackBar.getElementsByClassName("scrubber")[0] as HTMLInputElement;
            this.scrubberElem.oninput = ev => {
                viewer.tick = this.scrubberElem.valueAsNumber;
            };

            this.scrubberElem.onmousedown = ev => {
                this.viewer.isScrubbing = true;
            };

            this.scrubberElem.onmouseup = ev => {
                this.viewer.updateTickHash();
                this.viewer.isScrubbing = false;
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
            this.pauseElem.onclick = ev => this.viewer.isPlaying = false;
            playbackBar.appendChild(this.pauseElem);

            this.resumeElem = document.createElement("div");
            this.resumeElem.classList.add("play");
            this.resumeElem.classList.add("control");
            this.resumeElem.onclick = ev => this.viewer.isPlaying = true;
            playbackBar.appendChild(this.resumeElem);

            this.settingsElem = document.createElement("div");
            this.settingsElem.classList.add("settings");
            this.settingsElem.classList.add("control");
            this.settingsElem.onclick = ev => this.showSettings();
            playbackBar.appendChild(this.settingsElem);

            this.fullscreenElem = document.createElement("div");
            this.fullscreenElem.classList.add("fullscreen");
            this.fullscreenElem.classList.add("control");
            this.fullscreenElem.onclick = ev => this.viewer.toggleFullscreen();
            playbackBar.appendChild(this.fullscreenElem);

            this.speedControlElem = document.createElement("div");
            this.speedControlElem.classList.add("speed-control");
            this.speedControlElem.innerHTML = `<input class="speed-slider" type="range" min="0" max="${ReplayControls.speedSliderValues.length - 1}" step="1">`;
            this.container.appendChild(this.speedControlElem);

            this.speedSliderElem = this.speedControlElem.getElementsByClassName("speed-slider")[0] as HTMLInputElement;
            this.speedSliderElem.oninput = ev => {
                this.viewer.playbackRate = ReplayControls.speedSliderValues[this.speedSliderElem.valueAsNumber];
            }
        }

        showSpeedControl(): boolean {
            if (this.speedControlVisible) return false;

            this.speedControlVisible = true;
            this.speedControlElem.style.display = "block";

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

        update(): void {
            if (this.wasPlaying !== this.viewer.isPlaying) {
                const isPlaying = this.wasPlaying = this.viewer.isPlaying;
                this.pauseElem.style.display = isPlaying ? "block" : "none";
                this.resumeElem.style.display = isPlaying ? "none" : "block";
            }

            if (this.lastTickCount !== this.viewer.replay.tickCount) {
                const tickCount = this.lastTickCount = this.viewer.replay.tickCount;
                this.scrubberElem.max = tickCount.toString();
            }

            if (this.lastTick !== this.viewer.tick) {
                const tick = this.lastTick = this.viewer.tick;

                const replay = this.viewer.replay;
                if (replay != null) {
                    const totalSeconds = replay.clampTick(tick) / replay.tickRate;
                    const minutes = Math.floor(totalSeconds / 60);
                    const seconds = totalSeconds - minutes * 60;
                    const secondsString = seconds.toFixed(1);
                    this.timeElem.innerText = `${minutes}:${secondsString.indexOf(".") === 1 ? "0" : ""}${secondsString}`;
                }

                this.scrubberElem.valueAsNumber = this.lastTick;
            }

            if (this.lastPlaybackRate !== this.viewer.playbackRate) {
                const playbackRate = this.lastPlaybackRate = this.viewer.playbackRate;
                this.speedElem.innerText = playbackRate.toString();
                this.speedSliderElem.valueAsNumber = ReplayControls.speedSliderValues.indexOf(playbackRate);
            }
        }
    }
}