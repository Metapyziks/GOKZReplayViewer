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

    private tickData = new TickData();
    private tick = -1;
    private spareTime = 0;

    setReplay(replay: ReplayFile): void {
        this.replay = replay;
        this.setTick(0);
    }

    setTick(tick: number): void {
        if (tick >= this.replay.tickCount) tick = 0;

        this.tick = tick;
        this.replay.getTickData(tick, this.tickData);
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
            this.setTick(this.tick + 1);
        }

        this.mainCamera.setPosition(
            this.tickData.position.x,
            this.tickData.position.y,
            this.tickData.position.z + 64);

        this.setCameraAngles(
            (this.tickData.angles.y - 90) * Math.PI / 180,
            -this.tickData.angles.x * Math.PI / 180);
    }
}
