///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>

import WebGame = Facepunch.WebGame;

class ReplayViewer extends SourceUtils.MapViewer {
    static readonly hashTickRegex = /^#t[0-9]+$/;

    private replay: ReplayFile;
    private currentMapName: string;
    private mapBaseUrl: string;
    private ignoreHashChange = false;

    playbackRate = 1;

    protected onInitialize(): void {
        super.onInitialize();

        this.canLockPointer = false;
        this.useDefaultCameraControl = false;

        this.gotoTickHash();

        window.onhashchange = ev => {
            if (this.ignoreHashChange) return;
            this.gotoTickHash();
        };

        $("#playback-speed").on("input", ev => {
            const val = $("#playback-speed").val();
            const rate = val * Math.abs(val);
            this.playbackRate = rate;
            $("#control-playbackrate").text(rate.toPrecision(2));
        });
    }

    loadReplay(url: string): void {
        console.log(`Downloading: ${url}`);

        const req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "arraybuffer";
        req.onload = ev => {
            const arrayBuffer = req.response;
            if (arrayBuffer) {
                this.setReplay(new ReplayFile(arrayBuffer));
            }
        };
        req.send(null);
    }

    private pauseTime = 1.0;
    private pauseTicks: number;

    private isPaused = false;
    private tick = -1;
    private spareTime = 0;

    private tickData = new TickData();

    private tempTickData0 = new TickData();
    private tempTickData1 = new TickData();
    private tempTickData2 = new TickData();

    setMapBaseUrl(url: string): void {
        this.mapBaseUrl = url;
    }

    setReplay(replay: ReplayFile): void {
        this.replay = replay;
        this.pauseTicks = Math.round(replay.tickRate * this.pauseTime);
        this.tick = this.tick === -1 ? -this.pauseTicks : this.tick;
        this.spareTime = 0;

        const mins = Math.floor(replay.time / 60);
        const secs = replay.time - (mins * 60);

        const title = `${replay.playerName} - ${replay.mapName} - ${mins}:${secs < 10 ? '0' : ''}${secs.toFixed(3)}`;

        $("#title").text(title);
        document.title = title;

        $("#control-totalticks").text(replay.tickCount.toLocaleString());

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
        this.updateTickHash();
    }

    resume(): void {
        this.isPaused = false;
    }

    private updateTickHash(): void {
        this.ignoreHashChange = true;
        window.location.hash = `#t${this.clampTick(this.tick) + 1}`;
        this.ignoreHashChange = false;
    }

    private gotoTickHash(): void {        
        if (window.location.hash != null && ReplayViewer.hashTickRegex.test(window.location.hash)) {
            this.gotoTick(parseInt(window.location.hash.substr(2)) - 1);
            this.pause();
        }
    }

    private updateControlText(): void {
        $("#control-currenttick").text((this.clampTick(this.tick) + 1).toLocaleString());
    }

    gotoTick(tick: number): void {
        this.tick = tick;
        this.updateControlText();
    }

    protected onKeyDown(key: WebGame.Key): boolean {
        switch (key) {
            case WebGame.Key.F:
                this.toggleFullscreen();
                break;
            case WebGame.Key.Space:
                if (this.isPaused) this.resume();
                else this.pause();
                break;
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
