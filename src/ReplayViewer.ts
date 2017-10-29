///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>

import WebGame = Facepunch.WebGame;

class ReplayViewer extends SourceUtils.MapViewer {
    static readonly hashTickRegex = /^#t[0-9]+$/;
    static readonly speedSliderValues = [-5, -1, 0.1, 0.25, 1, 2, 5, 10];

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

    autoRepeat = true;

    constructor(container: HTMLElement) {
        super(container);

        this.onCreatePlaybackBar();
    }

    protected onCreatePlaybackBar(): HTMLElement {
        const playbackBar = document.createElement("div");
        playbackBar.classList.add("playback-bar");
        playbackBar.innerHTML = `
            <div class="scrubber-container">
            <input id="scrubber" type="range" min="0" max="1.0" value="0.0" step="1" />
            </div>`;

        this.container.appendChild(playbackBar);

        this.scrubberElem = document.getElementById("scrubber") as HTMLInputElement;
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
        this.timeElem.id = "time";
        playbackBar.appendChild(this.timeElem);

        this.speedElem = document.createElement("div");
        this.speedElem.id = "speed";
        this.speedElem.onclick = ev => {
            if (this.speedControlVisible) this.hideSpeedControl();
            else this.showSpeedControl();
        }
        playbackBar.appendChild(this.speedElem);

        this.pauseElem = document.createElement("div");
        this.pauseElem.id = "pause";
        this.pauseElem.classList.add("control");
        this.pauseElem.onclick = ev => this.pause();
        playbackBar.appendChild(this.pauseElem);

        this.resumeElem = document.createElement("div");
        this.resumeElem.id = "play";
        this.resumeElem.classList.add("control");
        this.resumeElem.onclick = ev => this.resume();
        playbackBar.appendChild(this.resumeElem);

        this.settingsElem = document.createElement("div");
        this.settingsElem.id = "settings";
        this.settingsElem.classList.add("control");
        this.settingsElem.onclick = ev => this.showSettings();
        playbackBar.appendChild(this.settingsElem);

        this.fullscreenElem = document.createElement("div");
        this.fullscreenElem.id = "fullscreen";
        this.fullscreenElem.classList.add("control");
        this.fullscreenElem.onclick = ev => this.toggleFullscreen();
        playbackBar.appendChild(this.fullscreenElem);

        this.speedControlElem = document.createElement("div");
        this.speedControlElem.classList.add("speed-control");
        this.speedControlElem.innerHTML = `<input id="speed-slider" type="range" min="0" max="${ReplayViewer.speedSliderValues.length - 1}" step="1">`;
        this.container.appendChild(this.speedControlElem);

        this.speedSliderElem = document.getElementById("speed-slider") as HTMLInputElement;
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

        this.gotoTickHash();
        this.setPlaybackRate(1);

        window.onhashchange = ev => {
            this.gotoTickHash();
        };

        this.canLockPointer = false;
        this.cameraMode = SourceUtils.CameraMode.Fixed;
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

        const mins = Math.floor(replay.time / 60);
        const secs = replay.time - (mins * 60);
        const secsString = secs.toFixed(3);

        const title = `${replay.playerName} - ${replay.mapName} - ${mins}:${secsString.indexOf(".") === 1 ? "0" : ""}${secsString}`;

        document.getElementById("title").innerText = title;
        document.title = title;

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
        document.getElementById("pause").style.display = "none";
        document.getElementById("play").style.display = "block";
        this.updateTickHash();
    }

    resume(): void {
        document.getElementById("pause").style.display = "block";
        document.getElementById("play").style.display = "none";
        this.isPaused = false;
    }

    togglePause(): void {
        if (this.isPaused) this.resume();
        else this.pause();
    }

    private updateTickHash(): void {
        window.location.hash = `#t${this.clampTick(this.tick) + 1}`;
    }

    private gotoTickHash(): void {        
        if (window.location.hash == null || !ReplayViewer.hashTickRegex.test(window.location.hash)) return;

        const parsedTick = parseInt(window.location.hash.substr(2)) - 1;
        if (this.tick === parsedTick) return;

        this.gotoTick(parsedTick);
        this.pause();
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

    private clampTick(index: number): number {
        return index < 0
            ? 0 : this.replay != null && index >= this.replay.tickCount
            ? this.replay.tickCount - 1 : index;
    }

    private deltaAngle(a: number, b: number): number {
        return (b - a) - Math.floor((b - a + 180) / 360) * 360;
    }

    private hermiteValue(p0: number, p1: number, p2: number, p3: number, t: number): number {
        const m0 = (p2 - p0) * 0.5;
        const m1 = (p3 - p1) * 0.5;

        const t2 = t * t;
        const t3 = t * t * t;

        return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m0
            + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m1;
    }

    private hermitePosition(p0: Facepunch.Vector3, p1: Facepunch.Vector3,
        p2: Facepunch.Vector3, p3: Facepunch.Vector3, t: number, out: Facepunch.Vector3) {
        out.x = this.hermiteValue(p0.x, p1.x, p2.x, p3.x, t);
        out.y = this.hermiteValue(p0.y, p1.y, p2.y, p3.y, t);
        out.z = this.hermiteValue(p0.z, p1.z, p2.z, p3.z, t);
    }

    private hermiteAngles(a0: Facepunch.Vector2, a1: Facepunch.Vector2,
        a2: Facepunch.Vector2, a3: Facepunch.Vector2, t: number, out: Facepunch.Vector2) {
        out.x = this.hermiteValue(
            a1.x + this.deltaAngle(a1.x, a0.x),
            a1.x,
            a1.x + this.deltaAngle(a1.x, a2.x),
            a1.x + this.deltaAngle(a1.x, a3.x), t);
        out.y = this.hermiteValue(
            a1.y + this.deltaAngle(a1.y, a0.y),
            a1.y,
            a1.y + this.deltaAngle(a1.y, a2.y),
            a1.y + this.deltaAngle(a1.y, a3.y), t);
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

            this.hermitePosition(d0.position, d1.position,
                d2.position, d3.position, t, this.tickData.position);
            this.hermiteAngles(d0.angles, d1.angles,
                d2.angles, d3.angles, t, this.tickData.angles);

            eyeHeight = this.hermiteValue(
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
