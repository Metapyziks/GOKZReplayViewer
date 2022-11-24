/// <reference path="facepunch.webgame.d.ts" />
/// <reference path="sourceutils.d.ts" />
declare namespace Gokz {
    enum SeekOrigin {
        Begin = 0,
        Current = 1,
        End = 2
    }
    class BinaryReader {
        private readonly buffer;
        private readonly view;
        private offset;
        constructor(buffer: ArrayBuffer);
        seek(offset: number, origin: SeekOrigin): number;
        getOffset(): number;
        readUint8(): number;
        readInt32(): number;
        readUint32(): number;
        readFloat32(): number;
        static utf8ArrayToStr(array: number[]): string;
        readString(length?: number): string;
        readVector2(vec?: Facepunch.Vector2): Facepunch.Vector2;
        readVector3(vec?: Facepunch.Vector3): Facepunch.Vector3;
    }
}
declare namespace Gokz {
    type Handler<TEventArgs, TSender> = (args: TEventArgs, sender: TSender) => void;
    class Event<TEventArgs, TSender> {
        private readonly sender;
        private handlers;
        constructor(sender: TSender);
        addListener(handler: Handler<TEventArgs, TSender>): void;
        removeListener(handler: Handler<TEventArgs, TSender>): boolean;
        clearListeners(): void;
        dispatch(args: TEventArgs): void;
    }
    class ChangedEvent<TValue, TEventArgs, TSender> extends Event<TEventArgs, TSender> {
        private prevValue;
        private equalityComparison;
        constructor(sender: TSender, equalityComparison?: (a: TValue, b: TValue) => boolean);
        reset(): void;
        update(value: TValue, args?: TEventArgs): void;
    }
}
declare namespace Gokz {
    class KeyDisplay {
        private readonly viewer;
        private readonly element;
        private readonly buttonMap;
        private readonly syncValueElem;
        private readonly speedValueElem;
        syncSampleRange: number;
        speedSampleRange: number;
        constructor(viewer: ReplayViewer, container?: HTMLElement);
        private updateButtons;
        private readonly tempTickData;
        private readonly tempPosition;
        private syncBuffer;
        private syncIndex;
        private syncSampleCount;
        private lastTick;
        private updateSync;
        private getSpeedAtTick;
        private updateSpeed;
        show(): void;
        hide(): void;
    }
}
declare namespace Gokz {
    class OptionsMenu {
        private readonly viewer;
        readonly element: HTMLElement;
        readonly titleElem: HTMLSpanElement;
        readonly optionContainer: HTMLElement;
        constructor(viewer: ReplayViewer, container?: HTMLElement);
        show(): void;
        hide(): void;
        private clear;
        private showMainPage;
        private setTitle;
        private addToggleOption;
    }
}
declare namespace Gokz {
    class ReplayControls {
        private static readonly speedSliderValues;
        private readonly viewer;
        private readonly container;
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
        private playbackBarVisible;
        private mouseOverPlaybackBar;
        private speedControlVisible;
        private lastActionTime;
        autoHidePeriod: number;
        constructor(viewer: ReplayViewer);
        showPlaybackBar(): void;
        hidePlaybackBar(): void;
        showSpeedControl(): boolean;
        hideSpeedControl(): boolean;
        showSettings(): void;
    }
}
declare namespace Gokz {
    enum GlobalMode {
        Vanilla = 0,
        KzSimple = 1,
        KzTimer = 2
    }
    enum GlobalStyle {
        Normal = 0
    }
    enum Button {
        Attack = 1,
        Jump = 2,
        Duck = 4,
        Forward = 8,
        Back = 16,
        Use = 32,
        Cancel = 64,
        Left = 128,
        Right = 256,
        MoveLeft = 512,
        MoveRight = 1024,
        Attack2 = 2048,
        Run = 4096,
        Reload = 8192,
        Alt1 = 16384,
        Alt2 = 32768,
        Score = 65536,
        Speed = 131072,
        Walk = 262144,
        Zoom = 524288,
        Weapon1 = 1048576,
        Weapon2 = 2097152,
        BullRush = 4194304,
        Grenade1 = 8388608,
        Grenade2 = 16777216
    }
    enum EntityFlag {
        OnGround = 1,
        Ducking = 2,
        WaterJump = 4,
        OnTrain = 8,
        InRain = 16,
        Frozen = 32,
        AtControls = 64,
        Client = 128,
        FakeClient = 256,
        InWater = 512,
        Fly = 1024,
        Swim = 2048,
        Conveyor = 4096,
        Npc = 8192,
        GodMode = 16384,
        NoTarget = 32768,
        AimTarget = 65536,
        PartialGround = 131072,
        StaticProp = 262144,
        Graphed = 524288,
        Grenade = 1048576,
        StepMovement = 2097152,
        DontTouch = 4194304,
        BaseVelocity = 8388608,
        WorldBrush = 16777216,
        Object = 33554432,
        KillMe = 67108864,
        OnFire = 134217728,
        Dissolving = 268435456,
        TransRagdoll = 536870912,
        UnblockableByPlayer = 1073741824,
        Freezing = -2147483648
    }
    enum ReplayV2Flag {
        MovetypeMask = 15,
        Attack = 16,
        Attack2 = 32,
        Jump = 64,
        Duck = 128,
        Forward = 256,
        Back = 512,
        Left = 1024,
        Right = 2048,
        Moveleft = 4096,
        Moveright = 8192,
        Reload = 16384,
        Speed = 32768,
        Use = 65536,
        Bullrush = 131072,
        Onground = 262144,
        Ducking = 524288,
        Swim = 1048576,
        UnderWater = 2097152,
        TeleportTick = 4194304,
        TakeoffTick = 8388608,
        HitPerf = 16777216,
        SecondaryEquipped = 33554432
    }
    enum ButtonOffset {
        Attack = 0,
        Jump = 1,
        Duck = 2,
        Forward = 3,
        Back = 4,
        Use = 5,
        Cancel = 6,
        Left = 7,
        Right = 8,
        Moveleft = 9,
        Moveright = 10,
        Attack2 = 11,
        Run = 12,
        Reload = 13,
        Alt1 = 14,
        Alt2 = 15,
        Score = 16,
        Speed = 17,
        Walk = 18,
        Zoom = 19,
        Weapon1 = 20,
        Weapon2 = 21,
        Bullrush = 22,
        Grenade1 = 23,
        Grenade2 = 24,
        Attack3 = 25
    }
    enum ReplayType {
        Run = 0,
        Cheater = 1,
        Jump = 2
    }
    class TickData {
        readonly position: Facepunch.Vector3;
        readonly angles: Facepunch.Vector2;
        tick: number;
        buttons: Button;
        flags: EntityFlag;
        getEyeHeight(): number;
    }
    class ReplayFile {
        static readonly MAGIC = 1735355258;
        private readonly reader;
        private readonly firstTickOffset;
        private readonly tickSize;
        readonly formatVersion: number;
        readonly pluginVersion: string;
        readonly mapName: string;
        readonly course: number;
        readonly mode: GlobalMode;
        readonly style: GlobalStyle;
        readonly time: number;
        readonly teleportsUsed: number;
        readonly steamId: number;
        readonly steamId2: string;
        readonly playerName: string;
        readonly tickCount: number;
        readonly tickRate: number;
        readonly tickDataArray: Array<TickData>;
        constructor(data: ArrayBuffer);
        getTickData(tick: number, data?: TickData): TickData;
        clampTick(tick: number): number;
    }
}
import WebGame = Facepunch.WebGame;
declare namespace Gokz {
    /**
     * Address hash format for the ReplayViewer.
     */
    interface IHashData {
        /** Tick number, starting from 1 for the first tick. */
        t?: number;
    }
    /**
     * Creates a GOKZ replay viewer applet.
     */
    class ReplayViewer extends SourceUtils.MapViewer {
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
        saveTickInHash: boolean;
        /**
         * The current tick being shown during playback, starting with 0 for
         * the first tick. Will automatically be increased while playing,
         * although some ticks might be skipped depending on playback speed and
         * frame rate. Can be set to skip to a particular tick.
         */
        tick: number;
        /**
         * Current playback rate, measured in seconds per second. Can support
         * negative values for rewinding.
         * @default `1.0`
         */
        playbackRate: number;
        /**
         * If true, the replay will automatically loop back to the first tick
         * when it reaches the end.
         * @default `true`
         */
        autoRepeat: boolean;
        /**
         * Used internally to temporarily pause playback while the user is
         * dragging the scrubber in the playback bar.
         */
        isScrubbing: boolean;
        /**
         * If true, the currently displayed tick will advance based on the
         * value of `playbackRate`.
         * @default `false`
         */
        isPlaying: boolean;
        /**
         * If true, a crosshair graphic will be displayed in the middle of the
         * viewer.
         * @default `true`
         */
        showCrosshair: boolean;
        /**
         * If true, makes the key press display visible.
         * @default `true`
         */
        showKeyDisplay: boolean;
        /**
         * If true, makes the options menu visible.
         * @default `false`
         */
        showOptions: boolean;
        /**
         * Event invoked when a new replay is loaded. Will be invoked before
         * the map for the replay is loaded (if required).
         *
         * **Available event arguments**:
         * * `replay: Gokz.ReplayFile` - The newly loaded ReplayFile
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly replayLoaded: Event<ReplayFile, ReplayViewer>;
        /**
         * Event invoked after each update.
         *
         * **Available event arguments**:
         * * `dt: number` - Time since the last update
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly updated: Event<number, ReplayViewer>;
        /**
         * Event invoked when the current tick has changed.
         *
         * **Available event arguments**:
         * * `tickData: Gokz.TickData` - Recorded data for the current tick
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly tickChanged: ChangedEvent<number, TickData, ReplayViewer>;
        /**
         * Event invoked when playback has skipped to a different tick, for
         * example when the user uses the scrubber.
         *
         * **Available event arguments**:
         * * `oldTick: number` - The previous value of `tick` before skipping
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly playbackSkipped: Event<number, ReplayViewer>;
        /**
         * Event invoked when `playbackRate` changes.
         *
         * **Available event arguments**:
         * * `playbackRate: number` - The new playback rate
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly playbackRateChanged: ChangedEvent<number, number, ReplayViewer>;
        /**
         * Event invoked when `isPlaying` changes, for example when the user
         * pauses or resumes playback.
         *
         * **Available event arguments**:
         * * `isPlaying: boolean` - True if currently playing
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly isPlayingChanged: ChangedEvent<boolean, boolean, ReplayViewer>;
        /**
         * Event invoked when `showCrosshair` changes.
         *
         * **Available event arguments**:
         * * `showCrosshair: boolean` - True if crosshair is now visible
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly showCrosshairChanged: ChangedEvent<boolean, boolean, ReplayViewer>;
        /**
         * Event invoked when `showKeyDisplay` changes.
         *
         * **Available event arguments**:
         * * `showKeyDisplay: boolean` - True if keyDisplay is now visible
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly showKeyDisplayChanged: ChangedEvent<boolean, boolean, ReplayViewer>;
        /**
         * Event invoked when `showOptions` changes.
         *
         * **Available event arguments**:
         * * `showOptions: boolean` - True if options menu is now visible
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly showOptionsChanged: ChangedEvent<boolean, boolean, ReplayViewer>;
        /**
         * Event invoked when `cameraMode` changes.
         *
         * **Available event arguments**:
         * * `cameraMode: SourceUtils.CameraMode` - Camera mode value
         * * `sender: Gokz.ReplayViewer` - This ReplayViewer
         */
        readonly cameraModeChanged: ChangedEvent<SourceUtils.CameraMode, SourceUtils.CameraMode, ReplayViewer>;
        private messageElem;
        private lastReplay;
        private currentMapName;
        private pauseTime;
        private pauseTicks;
        private wakeLock;
        private spareTime;
        private prevTick;
        private tickData;
        private tempTickData0;
        private tempTickData1;
        private tempTickData2;
        private routeLine;
        /**
         * Creates a new ReplayViewer inside the given `container` element.
         * @param container Element that should contain the viewer.
         */
        constructor(container: HTMLElement);
        /**
         * Used to display an error message in the middle of the viewer.
         * @param message Message to display
         */
        showMessage(message: string): void;
        /**
         * Attempt to load a GOKZ replay from the given URL. When loaded, the
         * replay will be stored in the `replay` property in this viewer.
         * @param url Url of the replay to download.
         */
        loadReplay(url: string): void;
        /**
         * If `saveTickInHash` is true, will set the address hash to include
         * the current tick number.
         */
        updateTickHash(): void;
        protected onCreateMessagePanel(): HTMLElement;
        protected onInitialize(): void;
        protected onHashChange(hash: string | Object): void;
        private ignoreMouseUp;
        protected onMouseDown(button: WebGame.MouseButton, screenPos: Facepunch.Vector2, target: EventTarget): boolean;
        protected onMouseUp(button: WebGame.MouseButton, screenPos: Facepunch.Vector2, target: EventTarget): boolean;
        protected onKeyDown(key: WebGame.Key): boolean;
        protected onChangeReplay(replay: ReplayFile): void;
        protected onUpdateFrame(dt: number): void;
    }
}
declare namespace Gokz {
    class RouteLine extends SourceUtils.Entities.PvsEntity {
        private static readonly segmentTicks;
        private readonly segments;
        private isVisible;
        get visible(): boolean;
        set visible(value: boolean);
        constructor(map: SourceUtils.Map, replay: ReplayFile);
        protected onPopulateDrawList(drawList: WebGame.DrawList, clusters: number[]): void;
        dispose(): void;
    }
}
declare namespace Gokz {
    class Utils {
        static deltaAngle(a: number, b: number): number;
        static hermiteValue(p0: number, p1: number, p2: number, p3: number, t: number): number;
        static hermitePosition(p0: Facepunch.Vector3, p1: Facepunch.Vector3, p2: Facepunch.Vector3, p3: Facepunch.Vector3, t: number, out: Facepunch.Vector3): void;
        static hermiteAngles(a0: Facepunch.Vector2, a1: Facepunch.Vector2, a2: Facepunch.Vector2, a3: Facepunch.Vector2, t: number, out: Facepunch.Vector2): void;
    }
}
