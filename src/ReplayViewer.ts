///<reference path="../js/facepunch.webgame.d.ts"/>
///<reference path="../js/sourceutils.d.ts"/>

import WebGame = Facepunch.WebGame;

namespace Gokz {
    /**
     * Address hash format for the ReplayViewer.
     */
    export interface IHashData {
        /** Tick number, starting from 1 for the first tick. */
        t?: number;
    }

    /**
     * Creates a GOKZ replay viewer applet.
     */
    export class ReplayViewer extends SourceUtils.MapViewer {
        /**
         * Handles a key input display overlay that also shows some stats like
         * speed and sync.
         */
        readonly keyDisplay: KeyDisplay;

        /**
         * Handles replay controls such as a playback bar.
         */
        readonly controls: ReplayControls;

        /**
         * Handles options menu.
         */
        readonly options: OptionsMenu;

        /**
         * The URL to look for exported maps at. The directory at the URL
         * should contain sub-folders for each map, inside each of which is the
         * index.json for that map.
         * @example `viewer.mapBaseUrl = "http://my-website.com/maps";`
         */
        mapBaseUrl: string;

        /**
         * The currently loaded replay. Will be automatically set after a
         * replay is loaded with `loadReplay(url)`. You can also set this
         * manually to switch between replays.
         */
        replay: ReplayFile;

        /**
         * If true, the current tick will be stored in the address hash when
         * playback is paused or the viewer uses the playback bar to skip
         * around.
         * @default `true`
         */
        saveTickInHash = true;

        /**
         * The current tick being shown during playback, starting with 0 for
         * the first tick. Will automatically be increased while playing,
         * although some ticks might be skipped depending on playback speed and
         * frame rate. Can be set to skip to a particular tick.
         */
        tick = -1;

        /**
         * Current playback rate, measured in seconds per second. Can support
         * negative values for rewinding.
         * @default `1.0`
         */
        playbackRate = 1.0;

        /**
         * If true, the replay will automatically loop back to the first tick
         * when it reaches the end.
         * @default `true`
         */
        autoRepeat = true;

        /**
         * Used internally to temporarily pause playback while the user is
         * dragging the scrubber in the playback bar.
         */
        isScrubbing = false;

        /**
         * If true, the currently displayed tick will advance based on the
         * value of `playbackRate`.
         * @default `false`
         */
        isPlaying = false;

        /**
         * If true, a crosshair graphic will be displayed in the middle of the
         * viewer.
         * @default `true`
         */
        showCrosshair = true;

        /**
         * If true, makes the key press display visible.
         * @default `true`
         */
        showKeyDisplay = true;

        /**
         * If true, makes the options menu visible.
         * @default `false`
         */
        showOptions = false;

        /**
         * Event invoked when a new replay is loaded. Will be invoked before
         * the map for the replay is loaded (if required).
         * 
         * **Available event arguments**:
         * * `replay: Gokz.ReplayFile` - The newly loaded ReplayFile
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly replayLoaded = new Event<ReplayFile, ReplayViewer>(this);

        /**
         * Event invoked after each update.
         * 
         * **Available event arguments**:
         * * `dt: number` - Time since the last update
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly updated = new Event<number, ReplayViewer>(this);

        /**
         * Event invoked when the current tick has changed.
         * 
         * **Available event arguments**:
         * * `tickData: Gokz.TickData` - Recorded data for the current tick
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly tickChanged = new ChangedEvent<number, TickData, ReplayViewer>(this);

        /**
         * Event invoked when playback has skipped to a different tick, for
         * example when the user uses the scrubber.
         * 
         * **Available event arguments**:
         * * `oldTick: number` - The previous value of `tick` before skipping
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly playbackSkipped = new Event<number, ReplayViewer>(this);

        /**
         * Event invoked when `playbackRate` changes.
         * 
         * **Available event arguments**:
         * * `playbackRate: number` - The new playback rate
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly playbackRateChanged = new ChangedEvent<number, number, ReplayViewer>(this);

        /**
         * Event invoked when `isPlaying` changes, for example when the user
         * pauses or resumes playback.
         * 
         * **Available event arguments**:
         * * `isPlaying: boolean` - True if currently playing
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly isPlayingChanged = new ChangedEvent<boolean, boolean, ReplayViewer>(this);

        /**
         * Event invoked when `showCrosshair` changes.
         * 
         * **Available event arguments**:
         * * `showCrosshair: boolean` - True if crosshair is now visible
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly showCrosshairChanged = new ChangedEvent<boolean, boolean, ReplayViewer>(this);

        /**
         * Event invoked when `showKeyDisplay` changes.
         * 
         * **Available event arguments**:
         * * `showKeyDisplay: boolean` - True if keyDisplay is now visible
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly showKeyDisplayChanged = new ChangedEvent<boolean, boolean, ReplayViewer>(this);

        /**
         * Event invoked when `showOptions` changes.
         * 
         * **Available event arguments**:
         * * `showOptions: boolean` - True if options menu is now visible
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly showOptionsChanged = new ChangedEvent<boolean, boolean, ReplayViewer>(this);

        /**
         * Event invoked when `cameraMode` changes.
         * 
         * **Available event arguments**:
         * * `cameraMode: SourceUtils.CameraMode` - Camera mode value
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly cameraModeChanged = new ChangedEvent<SourceUtils.CameraMode, SourceUtils.CameraMode, ReplayViewer>(this);

        private messageElem: HTMLElement;

        private lastReplay: ReplayFile;
        private currentMapName: string;

        private pauseTime = 1.0;
        private pauseTicks: number;

        private wakeLock: any;

        private spareTime = 0;
        private prevTick: number = undefined;

        private tickData = new TickData();

        private tempTickData0 = new TickData();
        private tempTickData1 = new TickData();
        private tempTickData2 = new TickData();

        private routeLine: RouteLine;

        /**
         * Creates a new ReplayViewer inside the given `container` element.
         * @param container Element that should contain the viewer.
         */
        constructor(container: HTMLElement) {
            super(container);

            this.saveCameraPosInHash = false;

            this.controls = new ReplayControls(this);
            this.keyDisplay = new KeyDisplay(this, this.controls.playbackBarElem);
            this.options = new OptionsMenu(this, this.controls.playbackBarElem);

            const crosshair = document.createElement("div");
            crosshair.classList.add("crosshair");
            container.appendChild(crosshair);

            this.showCrosshairChanged.addListener(showCrosshair => {
                crosshair.hidden = !showCrosshair;
            });

            this.isPlayingChanged.addListener(isPlaying => {
                if (!isPlaying && this.saveTickInHash) this.updateTickHash();

                if (isPlaying) {
                    this.wakeLock = (navigator as any).wakeLock;
                    if (this.wakeLock != null) {
                        this.wakeLock.request("display");
                    }

                    this.cameraMode = SourceUtils.CameraMode.Fixed;
                } else if (this.wakeLock != null) {
                    this.wakeLock.release("display");
                    this.wakeLock = null;
                }
            });

            this.cameraModeChanged.addListener(mode => {
                if (mode === SourceUtils.CameraMode.FreeCam) {
                    this.isPlaying = false;
                }

                if (this.routeLine != null) {
                    this.routeLine.visible = mode === SourceUtils.CameraMode.FreeCam;
                }

                this.canLockPointer = mode === SourceUtils.CameraMode.FreeCam;
                if (!this.canLockPointer && this.isPointerLocked()) {
                    document.exitPointerLock();
                }
            });
        }

        /**
         * Used to display an error message in the middle of the viewer.
         * @param message Message to display
         */
        showMessage(message: string): void {
            if (this.messageElem === undefined) {
                this.messageElem = this.onCreateMessagePanel();
            }

            if (this.messageElem == null) return;

            this.messageElem.innerText = message;
        }

        /**
         * Attempt to load a GOKZ replay from the given URL. When loaded, the
         * replay will be stored in the `replay` property in this viewer.
         * @param url Url of the replay to download.
         */
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

                    if (this.routeLine != null) {
                        this.routeLine.dispose();
                        this.routeLine = null;
                    }

                    try {
                        this.replay = new ReplayFile(arrayBuffer);
                    } catch (e) {
                        this.showMessage(`Unable to read replay: ${e}`);
                    }
                }
            };
            req.send(null);
        }

        /**
         * If `saveTickInHash` is true, will set the address hash to include
         * the current tick number.
         */
        updateTickHash(): void {
            if (this.replay == null || !this.saveTickInHash) return;
            this.setHash({ t: this.replay.clampTick(this.tick) + 1 });
        }

        protected onCreateMessagePanel(): HTMLElement {
            const elem = document.createElement("div");
            elem.classList.add("message");

            this.container.appendChild(elem);

            return elem;
        }

        protected onInitialize(): void {
            super.onInitialize();

            this.canLockPointer = false;
            this.cameraMode = SourceUtils.CameraMode.Fixed;
        }

        protected onHashChange(hash: string | Object): void {
            if (typeof hash === "string") return;
            if (!this.saveTickInHash) return;

            const data = hash as IHashData;

            if (data.t !== undefined && this.tick !== data.t) {
                this.tick = data.t - 1;
                this.isPlaying = false;
            }
        }

        private ignoreMouseUp = true;

        protected onMouseDown(button: WebGame.MouseButton, screenPos: Facepunch.Vector2, target: EventTarget): boolean {
            this.ignoreMouseUp = event.target !== this.canvas;
            if (super.onMouseDown(button, screenPos, target)) {
                this.showOptions = false;
                return true;
            }

            return false;
        }

        protected onMouseUp(button: WebGame.MouseButton, screenPos: Facepunch.Vector2, target: EventTarget): boolean {
            const ignored = this.ignoreMouseUp || event.target !== this.canvas;
            this.ignoreMouseUp = true;

            if (ignored) return false;

            if (this.controls.hideSpeedControl() || this.showOptions) {
                this.showOptions = false;
                return true;
            }

            if (super.onMouseUp(button, screenPos, target)) return true;

            if (button === WebGame.MouseButton.Left && this.replay != null && this.map.isReady()) {
                this.isPlaying = !this.isPlaying;
                return true;
            }

            return false;
        }

        protected onKeyDown(key: WebGame.Key): boolean {
            switch (key) {
                case WebGame.Key.X:
                    this.cameraMode = this.cameraMode === SourceUtils.CameraMode.FreeCam
                        ? SourceUtils.CameraMode.Fixed : SourceUtils.CameraMode.FreeCam;
                    
                    if (this.cameraMode === SourceUtils.CameraMode.FreeCam) {
                        this.container.requestPointerLock();
                    }
                    return true;
                case WebGame.Key.F:
                    this.toggleFullscreen();
                    return true;
                case WebGame.Key.Space:
                    if (this.replay != null && this.map.isReady()) {
                        this.isPlaying = !this.isPlaying;
                    }
                    return true;
            }

            return super.onKeyDown(key);
        }

        protected onChangeReplay(replay: ReplayFile): void {
            this.pauseTicks = Math.round(replay.tickRate * this.pauseTime);
            this.tick = this.tick === -1 ? 0 : this.tick;
            this.spareTime = 0;
            this.prevTick = undefined;

            this.replayLoaded.dispatch(this.replay);

            if (this.currentMapName !== replay.mapName) {
                if (this.currentMapName != null) {
                    this.map.unload();
                }

                if (this.mapBaseUrl == null) {
                    throw "Cannot load a map when mapBaseUrl is unspecified.";
                }

                const version = new Date().getTime().toString(16);

                this.currentMapName = replay.mapName;
                this.loadMap(`${this.mapBaseUrl}/${replay.mapName}/index.json?v=${version}`);
            }
        }

        protected onUpdateFrame(dt: number): void {
            super.onUpdateFrame(dt);

            if (this.replay != this.lastReplay) {
                this.lastReplay = this.replay;

                if (this.replay != null) {
                    this.onChangeReplay(this.replay);
                }
            }

            this.showCrosshairChanged.update(this.showCrosshair);
            this.showKeyDisplayChanged.update(this.showKeyDisplay);
            this.showOptionsChanged.update(this.showOptions);
            this.playbackRateChanged.update(this.playbackRate);
            this.cameraModeChanged.update(this.cameraMode);

            if (this.replay == null) {
                this.updated.dispatch(dt);
                return;
            }

            const replay = this.replay;
            const tickPeriod = 1.0 / replay.tickRate;

            this.isPlayingChanged.update(this.isPlaying);

            if (this.prevTick !== undefined && this.tick !== this.prevTick) {
                this.playbackSkipped.dispatch(this.prevTick);
            }

            if (this.routeLine == null && this.map.isReady()) {
                this.routeLine = new RouteLine(this.map, this.replay);
            }

            if (this.map.isReady() && this.isPlaying && !this.isScrubbing) {
                this.spareTime += dt * this.playbackRate;

                const oldTick = this.tick;

                // Forward playback
                while (this.spareTime > tickPeriod) {
                    this.spareTime -= tickPeriod;
                    this.tick += 1;

                    if (this.tick > replay.tickCount + this.pauseTicks * 2) {
                        this.tick = -this.pauseTicks;
                    }
                }

                // Rewinding
                while (this.spareTime < 0) {
                    this.spareTime += tickPeriod;
                    this.tick -= 1;

                    if (this.tick < -this.pauseTicks * 2) {
                        this.tick = replay.tickCount + this.pauseTicks;
                    }
                }
            } else {
                this.spareTime = 0;
            }

            this.prevTick = this.tick;

            replay.getTickData(replay.clampTick(this.tick), this.tickData);
            let eyeHeight = this.tickData.getEyeHeight();

            this.tickChanged.update(this.tick, this.tickData);

            if (this.spareTime >= 0 && this.spareTime <= tickPeriod) {
                const t = this.spareTime / tickPeriod;

                const d0 = replay.getTickData(replay.clampTick(this.tick - 1), this.tempTickData0);
                const d1 = this.tickData;
                const d2 = replay.getTickData(replay.clampTick(this.tick + 1), this.tempTickData1);
                const d3 = replay.getTickData(replay.clampTick(this.tick + 2), this.tempTickData2);

                Utils.hermitePosition(d0.position, d1.position,
                    d2.position, d3.position, t, this.tickData.position);
                Utils.hermiteAngles(d0.angles, d1.angles,
                    d2.angles, d3.angles, t, this.tickData.angles);

                eyeHeight = Utils.hermiteValue(
                    d0.getEyeHeight(), d1.getEyeHeight(),
                    d2.getEyeHeight(), d3.getEyeHeight(), t);
            }

            if (this.cameraMode === SourceUtils.CameraMode.Fixed) {
                this.mainCamera.setPosition(
                    this.tickData.position.x,
                    this.tickData.position.y,
                    this.tickData.position.z + eyeHeight);

                this.setCameraAngles(
                    (this.tickData.angles.y - 90) * Math.PI / 180,
                    -this.tickData.angles.x * Math.PI / 180);
            }

            this.updated.dispatch(dt);
        }
    }
}
