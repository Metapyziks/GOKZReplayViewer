///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>

import WebGame = Facepunch.WebGame;

class ReplayViewer extends SourceUtils.MapViewer {
    private replay: ReplayFile;

    playbackRate = 1;

    protected onInitialize(): void {
        super.onInitialize();
        this.canLockPointer = false;
        this.useDefaultCameraControl = false;
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
    private tick = -1;
    private spareTime = 0;

    private prevTick = new TickData();
    private nextTick = new TickData();

    setReplay(replay: ReplayFile): void {
        this.replay = replay;
        this.pauseTicks = Math.round(replay.tickRate * this.pauseTime);
        this.tick = -this.pauseTicks;
    }

    protected onKeyDown(key: WebGame.Key): boolean {
        switch (key) {
            case WebGame.Key.F:
                this.toggleFullscreen();
                break;
        }

        return super.onKeyDown(key);
    }

    private clampTick(index: number): number {
        return index < 0
            ? 0 : index >= this.replay.tickCount
            ? this.replay.tickCount - 1 : index;
    }

    private subAngles(a: Facepunch.Vector2, b: Facepunch.Vector2): void {
        a.x -= b.x;
        a.y -= b.y;

        a.x -= Math.floor((a.x + 180) / 360) * 360;
        a.y -= Math.floor((a.y + 180) / 360) * 360;
    }

    protected onUpdateFrame(dt: number): void {
        super.onUpdateFrame(dt);

        if (this.replay == null) return;

        const tickPeriod = 1.0 / this.replay.tickRate;

        this.spareTime += dt * this.playbackRate;
        while (this.spareTime >= tickPeriod) {
            this.spareTime -= tickPeriod;
            this.tick += 1;

            if (this.tick >= this.replay.tickCount + this.pauseTicks * 2) {
                this.tick = -this.pauseTicks;
            }
        }

        const prevTickIndex = this.clampTick(this.tick + 0);
        const nextTickIndex = this.clampTick(this.tick + 1);

        this.replay.getTickData(prevTickIndex, this.prevTick);
        let eyeHeight = this.prevTick.getEyeHeight();

        if (prevTickIndex !== nextTickIndex && this.spareTime >= 0 && this.spareTime <= tickPeriod) {
            const t = this.spareTime / tickPeriod;
            this.replay.getTickData(nextTickIndex, this.nextTick);

            this.nextTick.position.sub(this.prevTick.position);
            this.nextTick.position.multiplyScalar(t);
            this.prevTick.position.add(this.nextTick.position);

            this.subAngles(this.nextTick.angles, this.prevTick.angles);
            this.nextTick.angles.multiplyScalar(t);
            this.prevTick.angles.add(this.nextTick.angles);

            eyeHeight += (this.nextTick.getEyeHeight() - eyeHeight) * t;
        }

        this.mainCamera.setPosition(
            this.prevTick.position.x,
            this.prevTick.position.y,
            this.prevTick.position.z + eyeHeight);

        this.setCameraAngles(
            (this.prevTick.angles.y - 90) * Math.PI / 180,
            -this.prevTick.angles.x * Math.PI / 180);
    }
}
