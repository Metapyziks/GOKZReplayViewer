namespace Gokz {
    export class KeyDisplay {
        private readonly viewer: ReplayViewer;

        private readonly element: HTMLElement;
        private readonly buttonMap: {[button: number]: HTMLElement} = {};

        private readonly syncValueElem: HTMLElement;
        private readonly speedValueElem: HTMLElement;

        syncSampleRange = 4;
        speedSampleRange = 1 / 8;

        constructor(viewer: ReplayViewer, container?: HTMLElement) {
            this.viewer = viewer;

            if (container === undefined) container = viewer.container;

            const element = this.element = document.createElement("div");
            element.classList.add("key-display");
            element.innerHTML = `
                <div class="stat sync-outer">Sync: <span class="value sync-value">0.0</span> %</div>
                <div class="stat speed-outer">Speed: <span class="value speed-value">000</span> u/s</div>
                <div class="key key-w">W</div>
                <div class="key key-a">A</div>
                <div class="key key-s">S</div>
                <div class="key key-d">D</div>
                <div class="key key-walk">Walk</div>
                <div class="key key-duck">Duck</div>
                <div class="key key-jump">Jump</div>`;

            container.appendChild(element);

            this.buttonMap[Button.Forward] = element.getElementsByClassName("key-w")[0] as HTMLElement;
            this.buttonMap[Button.MoveLeft] = element.getElementsByClassName("key-a")[0] as HTMLElement;
            this.buttonMap[Button.Back] = element.getElementsByClassName("key-s")[0] as HTMLElement;
            this.buttonMap[Button.MoveRight] = element.getElementsByClassName("key-d")[0] as HTMLElement;
            this.buttonMap[Button.Walk] = element.getElementsByClassName("key-walk")[0] as HTMLElement;
            this.buttonMap[Button.Duck] = element.getElementsByClassName("key-duck")[0] as HTMLElement;
            this.buttonMap[Button.Jump] = element.getElementsByClassName("key-jump")[0] as HTMLElement;

            this.syncValueElem = element.getElementsByClassName("sync-value")[0] as HTMLElement;
            this.speedValueElem = element.getElementsByClassName("speed-value")[0] as HTMLElement;

            viewer.showKeyDisplayChanged.addListener(showKeyDisplay => {
                if (showKeyDisplay && viewer.cameraMode === SourceUtils.CameraMode.Fixed) this.show();
                else this.hide();
            });

            viewer.cameraModeChanged.addListener(cameraMode => {
                if (viewer.showKeyDisplay && cameraMode === SourceUtils.CameraMode.Fixed) this.show();
                else this.hide();
            });

            viewer.playbackSkipped.addListener(oldTick => {
                this.syncIndex = 0;
                this.syncSampleCount = 0;

                this.lastTick = viewer.replay.clampTick(viewer.playbackRate > 0
                    ? viewer.tick - 32
                    : viewer.tick + 32);
            });

            viewer.tickChanged.addListener(tickData => {
                this.updateButtons(tickData);
                this.updateSpeed();
                this.updateSync();
            });
        }

        private updateButtons(tickData: TickData): void {
            for (let key in this.buttonMap) {
                const pressed = (tickData.buttons & (parseInt(key) as Button)) !== 0;

                if (pressed) {
                    this.buttonMap[key].classList.add("pressed");
                } else {
                    this.buttonMap[key].classList.remove("pressed");
                }
            }
        }

        private readonly tempTickData = new TickData();
        private readonly tempPosition = new Facepunch.Vector3();

        private syncBuffer: boolean[] = [];
        private syncIndex = 0;
        private syncSampleCount = 0;

        private lastTick = 0;

        private updateSync(): void {
            if (this.lastTick === this.viewer.tick) return;

            const replay = this.viewer.replay;
            const maxSamples = Math.ceil(this.syncSampleRange * replay.tickRate);
            let syncBuffer = this.syncBuffer;

            if (syncBuffer.length < maxSamples) {
                syncBuffer = this.syncBuffer = new Array<boolean>(maxSamples);
                this.syncIndex = 0;
                this.syncSampleCount = 0;
            }

            const min = replay.clampTick(Math.min(this.lastTick, this.viewer.tick) - 1);
            const max = replay.clampTick(Math.max(this.lastTick, this.viewer.tick));

            let prevSpeed = this.getSpeedAtTick(min, 1);
            for (let i = min + 1; i <= max; ++i) {
                const nextSpeed = this.getSpeedAtTick(i, 1);

                // A bit gross
                if ((this.tempTickData.flags & (EntityFlag.OnGround | EntityFlag.PartialGround)) === 0) {
                    syncBuffer[this.syncIndex] = nextSpeed > prevSpeed;
                    this.syncIndex = this.syncIndex >= maxSamples - 1 ? 0 : this.syncIndex + 1;
                    this.syncSampleCount = Math.min(this.syncSampleCount + 1, maxSamples);
                }

                prevSpeed = nextSpeed;
            }

            this.lastTick = this.viewer.tick;

            let syncFraction = 0.0;
            for (let i = 0; i < this.syncSampleCount; ++i) {
                if (syncBuffer[i]) ++syncFraction;
            }

            syncFraction /= Math.max(this.syncSampleCount, 1);
            this.syncValueElem.innerText = (syncFraction * 100).toFixed(1);
        }

        private getSpeedAtTick(tick: number, tickRange: number): number {
            const replay = this.viewer.replay;
            const firstTick = replay.clampTick(tick - Math.ceil(tickRange / 2));
            const lastTick = replay.clampTick(firstTick + tickRange);
            tickRange = lastTick - firstTick;

            const tickData = this.tempTickData;
            const position = this.tempPosition;

            replay.getTickData(lastTick, tickData);
            position.copy(tickData.position);

            replay.getTickData(firstTick, tickData);
            position.sub(tickData.position);

            // Ignore vertical speed
            position.z = 0;

            return position.length() * replay.tickRate / Math.max(1, lastTick - firstTick);
        }

        private updateSpeed(): void {
            // TODO: cache

            const replay = this.viewer.replay;
            const maxTickRange = Math.ceil(this.speedSampleRange * replay.tickRate);

            let speedString = Math.round(this.getSpeedAtTick(this.viewer.tick, maxTickRange)).toString();

            for (; speedString.length < 3; speedString = "0" + speedString);

            this.speedValueElem.innerText = speedString;
        }

        show(): void {
            this.element.style.display = "block";
        }

        hide(): void {
            this.element.style.display = "none";
        }
    }
}