namespace Gokz {
    export class KeyDisplay {
        private readonly viewer: ReplayViewer;

        private readonly element: HTMLElement;
        private readonly buttonMap: {[button: number]: HTMLElement} = {};

        private readonly speedValueElem: HTMLElement;

        speedSampleRange = 8;

        constructor(viewer: ReplayViewer, container?: HTMLElement) {
            this.viewer = viewer;

            if (container === undefined) container = viewer.container;

            this.element = document.createElement("div");
            this.element.classList.add("key-display");
            this.element.innerHTML = `
                <div class="stat sync-outer">Sync: <span class="value sync-value">0.0</span> %</div>
                <div class="stat speed-outer">Speed: <span class="value speed-value">000</span> u/s</div>
                <div class="key key-w">W</div>
                <div class="key key-a">A</div>
                <div class="key key-s">S</div>
                <div class="key key-d">D</div>
                <div class="key key-walk">Walk</div>
                <div class="key key-duck">Duck</div>
                <div class="key key-jump">Jump</div>`;

            container.appendChild(this.element);

            this.buttonMap[Button.Forward] = this.element.getElementsByClassName("key-w")[0] as HTMLElement;
            this.buttonMap[Button.MoveLeft] = this.element.getElementsByClassName("key-a")[0] as HTMLElement;
            this.buttonMap[Button.Back] = this.element.getElementsByClassName("key-s")[0] as HTMLElement;
            this.buttonMap[Button.MoveRight] = this.element.getElementsByClassName("key-d")[0] as HTMLElement;
            this.buttonMap[Button.Walk] = this.element.getElementsByClassName("key-walk")[0] as HTMLElement;
            this.buttonMap[Button.Duck] = this.element.getElementsByClassName("key-duck")[0] as HTMLElement;
            this.buttonMap[Button.Jump] = this.element.getElementsByClassName("key-jump")[0] as HTMLElement;

            this.speedValueElem = this.element.getElementsByClassName("speed-value")[0] as HTMLElement;

            viewer.tickChanged.addListener(tickData => {
                for (let key in this.buttonMap) {
                    const pressed = (tickData.buttons & (parseInt(key) as Button)) !== 0;
    
                    if (pressed) {
                        this.buttonMap[key].classList.add("pressed");
                    } else {
                        this.buttonMap[key].classList.remove("pressed");
                    }
                }

                this.updateSpeed();
            });
        }

        private readonly tempTickData = new Gokz.TickData();
        private readonly tempPosition = new Facepunch.Vector3();

        private updateSpeed(): void {
            // TODO: cache

            const firstTick = this.viewer.replay.clampTick(this.viewer.tick - Math.floor(this.speedSampleRange / 2));
            const lastTick = this.viewer.replay.clampTick(firstTick + this.speedSampleRange);
            const tickRange = lastTick - firstTick;

            const tickData = this.tempTickData;
            const position = this.tempPosition;
            const replay = this.viewer.replay;

            replay.getTickData(lastTick, tickData);
            position.copy(tickData.position);

            replay.getTickData(firstTick, tickData);
            position.sub(tickData.position);

            // Ignore vertical speed
            position.z = 0;

            const period = Math.max(1, lastTick - firstTick) / replay.tickRate;
            let speedString = Math.round(position.length() / period).toString();

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