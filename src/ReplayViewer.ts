///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>

import WebGame = Facepunch.WebGame;

class ReplayViewer extends SourceUtils.MapViewer {
    private replay: ReplayFile;

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
    private tickData = new TickData();
    private tick = -1;
    private spareTime = 0;

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

    protected onUpdateFrame(dt: number): void {
        super.onUpdateFrame(dt);

        if (this.replay == null) return;

        const tickPeriod = 1.0 / this.replay.tickRate;

        this.spareTime += dt;
        while (this.spareTime >= tickPeriod) {
            this.spareTime -= tickPeriod;
            this.tick += 1;

            if (this.tick >= this.replay.tickCount + this.pauseTicks * 2) {
                this.tick = -this.pauseTicks;
            }
        }
        
        const clampedTick = this.tick < 0
            ? 0 : this.tick >= this.replay.tickCount
            ? this.replay.tickCount - 1 : this.tick;

        this.replay.getTickData(clampedTick, this.tickData);

        const eyeHeight = (this.tickData.flags & EntityFlag.Ducking) != 0 ? 28 : 64;

        this.mainCamera.setPosition(
            this.tickData.position.x,
            this.tickData.position.y,
            this.tickData.position.z + eyeHeight);

        this.setCameraAngles(
            (this.tickData.angles.y - 90) * Math.PI / 180,
            -this.tickData.angles.x * Math.PI / 180);
    }
}
