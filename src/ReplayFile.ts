namespace Gokz {
    export enum GlobalMode {
        Vanilla = 0,
        KzSimple = 1,
        KzTimer = 2
    }

    export enum GlobalStyle {
        Normal = 0
    }

    export enum Button {
        Attack = 1 << 0,
        Jump = 1 << 1,
        Duck = 1 << 2,
        Forward = 1 << 3,
        Back = 1 << 4,
        Use = 1 << 5,
        Cancel = 1 << 6,
        Left = 1 << 7,
        Right = 1 << 8,
        MoveLeft = 1 << 9,
        MoveRight = 1 << 10,
        Attack2 = 1 << 11,
        Run = 1 << 12,
        Reload = 1 << 13,
        Alt1 = 1 << 14,
        Alt2 = 1 << 15,
        Score = 1 << 16,
        Speed = 1 << 17,
        Walk = 1 << 18,
        Zoom = 1 << 19,
        Weapon1 = 1 << 20,
        Weapon2 = 1 << 21,
        BullRush = 1 << 22, // ...what?
        Grenade1 = 1 << 23,
        Grenade2 = 1 << 24
    }

    export enum EntityFlag {
        OnGround = 1 << 0,
        Ducking = 1 << 1,
        WaterJump = 1 << 2,
        OnTrain = 1 << 3,
        InRain = 1 << 4,
        Frozen = 1 << 5,
        AtControls = 1 << 6,
        Client = 1 << 7,
        FakeClient = 1 << 8,
        InWater = 1 << 9,
        Fly = 1 << 10,
        Swim = 1 << 11,
        Conveyor = 1 << 12,
        Npc = 1 << 13,
        GodMode = 1 << 14,
        NoTarget = 1 << 15,
        AimTarget = 1 << 16,
        PartialGround = 1 << 17,
        StaticProp = 1 << 18,
        Graphed = 1 << 19,
        Grenade = 1 << 20,
        StepMovement = 1 << 21,
        DontTouch = 1 << 22,
        BaseVelocity = 1 << 23,
        WorldBrush = 1 << 24,
        Object = 1 << 25,
        KillMe = 1 << 26,
        OnFire = 1 << 27,
        Dissolving = 1 << 28,
        TransRagdoll = 1 << 29,
        UnblockableByPlayer = 1 << 30,
        Freezing = 1 << 31
    }

    export enum ReplayV2Flag {
        MovetypeMask      = (0xF),
        Attack            = (1 << 4),
        Attack2           = (1 << 5),
        Jump              = (1 << 6),
        Duck              = (1 << 7),
        Forward           = (1 << 8),
        Back              = (1 << 9),
        Left              = (1 << 10),
        Right             = (1 << 11),
        Moveleft          = (1 << 12),
        Moveright         = (1 << 13),
        Reload            = (1 << 14),
        Speed             = (1 << 15),
        Use               = (1 << 16),
        Bullrush          = (1 << 17),
        Onground          = (1 << 18),
        Ducking           = (1 << 19),
        Swim              = (1 << 20),
        UnderWater        = (1 << 21),
        TeleportTick      = (1 << 22),
        TakeoffTick       = (1 << 23),
        HitPerf           = (1 << 24),
        SecondaryEquipped = (1 << 25),
    }
    
    export enum ButtonOffset {
        Attack    = 0,
        Jump      = 1,
        Duck      = 2,
        Forward   = 3,
        Back      = 4,
        Use       = 5,
        Cancel    = 6,
        Left      = 7,
        Right     = 8,
        Moveleft  = 9,
        Moveright = 10,
        Attack2   = 11,
        Run       = 12,
        Reload    = 13,
        Alt1      = 14,
        Alt2      = 15,
        Score     = 16,
        Speed     = 17,
        Walk      = 18,
        Zoom      = 19,
        Weapon1   = 20,
        Weapon2   = 21,
        Bullrush  = 22,
        Grenade1  = 23,
        Grenade2  = 24,
        Attack3   = 25,
    }
    
    export enum ReplayType {
        Run,
        Cheater,
        Jump
    }

    export class TickData {
        readonly position = new Facepunch.Vector3();
        readonly angles = new Facepunch.Vector2();
        tick = -1;
        buttons: Button = 0;
        flags: EntityFlag = 0;

        getEyeHeight(): number {
            return (this.flags & EntityFlag.Ducking) != 0 ? 46 : 64;
        }
    }

    export class ReplayFile {
        static readonly MAGIC = 0x676F6B7A;

        private readonly reader: BinaryReader;
        private readonly firstTickOffset: number;
        private readonly tickSize: number;

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
        readonly tickDataArray: Array<TickData> = [];

        constructor(data: ArrayBuffer) {
            const reader = this.reader = new BinaryReader(data);

            const magic = reader.readInt32();
            if (magic !== ReplayFile.MAGIC) {
                throw "Unrecognised replay file format.";
            }

            this.formatVersion = reader.readUint8();
            
            if (this.formatVersion === 1) {
                this.pluginVersion = reader.readString();
                
                this.mapName = reader.readString();
                this.course = reader.readInt32();
                this.mode = reader.readInt32() as GlobalMode;
                this.style = reader.readInt32() as GlobalStyle;
                this.time = reader.readFloat32();
                this.teleportsUsed = reader.readInt32();
                this.steamId = reader.readInt32();
                this.steamId2 = reader.readString();
                reader.readString();
                this.playerName = reader.readString();
                this.tickCount = reader.readInt32();
                this.tickRate = Math.round(this.tickCount / this.time); // todo

                this.firstTickOffset = reader.getOffset();
                this.tickSize = 7 * 4;
                
                for (let i: number = 0; i < this.tickCount; i++) {
                    let tickData: TickData = new TickData();
                    
                    reader.readVector3(tickData.position);
                    reader.readVector2(tickData.angles);
                    tickData.buttons = reader.readInt32();
                    tickData.flags = reader.readInt32();
                    
                    this.tickDataArray.push(tickData);
                }
            } else if (this.formatVersion === 2) {
                this.steamId2 = "";
                this.time = 0.0;
                this.course = -1;
                this.teleportsUsed = 0;
                
                let replayType: ReplayType = reader.readUint8() as ReplayType;
                this.pluginVersion = reader.readString();
                this.mapName = reader.readString();
                reader.readInt32(); // map file size
                reader.readInt32(); // server ip
                reader.readInt32(); // unix time stamp
                this.playerName = reader.readString();
                this.steamId = reader.readInt32();
                this.mode = reader.readUint8() as GlobalMode;
                this.style = reader.readUint8() as GlobalStyle;
                reader.readInt32(); // mouse sensitivity
                reader.readInt32(); // m_yaw cvar value
                this.tickRate = reader.readFloat32();
                this.tickCount = reader.readInt32();
                reader.readInt32(); // equipped weapon
                reader.readInt32(); // equipped knife
                
                if (replayType == ReplayType.Run) {
                    this.time = reader.readFloat32();
                    this.course = reader.readUint8();
                    this.teleportsUsed = reader.readInt32();
                } else if (replayType == ReplayType.Cheater) {
                    reader.readUint8(); // AC ban reason
                } else if (replayType == ReplayType.Jump) {
                    reader.readUint8(); // jump type
                    reader.readFloat32(); // jump distance
                    reader.readFloat32(); // block distance
                    reader.readUint8(); // strafe count
                    reader.readFloat32(); // strafe sync
                    reader.readFloat32(); // prestrafe speed
                    reader.readFloat32(); // max speed
                    reader.readInt32(); // airtime
                } else {
                    throw "Invalid replay type.";
                }
                
                this.firstTickOffset = reader.getOffset();
                
                // NOTE: ????
                this.tickSize = 7 * 4;
                
                let array = new Array<number>(20);
                for (let tick: number = 0; tick < this.tickCount; tick++) {
                    
                    let deltaFlags: number = reader.readInt32();
                    // NOTE(GameChaos): read delta-compressed tickdata.
                    for (let i: number = 1; i < 20; i++) {
                        
                        let currentFlag = (1 << i);
                        if (deltaFlags & currentFlag) {
                            
                            if (i == 0 || i == 1 || i == 5 || i == 6 || i == 16 || i == 19) {
                                array[i] = reader.readInt32();
                            } else {
                                array[i] = reader.readFloat32();
                            }
                        }
                    }
                    
                    let tickData: TickData = new TickData();
                    tickData.tick = tick;
                    tickData.position.x = array[7];
                    tickData.position.y = array[8];
                    tickData.position.z = array[9];
                    
                    tickData.angles.x = array[10];
                    tickData.angles.y = array[11];
                    let flags: number = array[16];
                    
                    tickData.buttons = 0;
                    tickData.buttons |= ((flags & ReplayV2Flag.Attack)    != 0 ? 1 : 0) << ButtonOffset.Attack;
                    tickData.buttons |= ((flags & ReplayV2Flag.Attack2)   != 0 ? 1 : 0) << ButtonOffset.Attack2;
                    tickData.buttons |= ((flags & ReplayV2Flag.Jump)      != 0 ? 1 : 0) << ButtonOffset.Jump;
                    tickData.buttons |= ((flags & ReplayV2Flag.Duck)      != 0 ? 1 : 0) << ButtonOffset.Duck;
                    tickData.buttons |= ((flags & ReplayV2Flag.Forward)   != 0 ? 1 : 0) << ButtonOffset.Forward;
                    tickData.buttons |= ((flags & ReplayV2Flag.Back)      != 0 ? 1 : 0) << ButtonOffset.Back;
                    tickData.buttons |= ((flags & ReplayV2Flag.Left)      != 0 ? 1 : 0) << ButtonOffset.Left;
                    tickData.buttons |= ((flags & ReplayV2Flag.Right)     != 0 ? 1 : 0) << ButtonOffset.Right;
                    tickData.buttons |= ((flags & ReplayV2Flag.Moveleft)  != 0 ? 1 : 0) << ButtonOffset.Moveleft;
                    tickData.buttons |= ((flags & ReplayV2Flag.Moveright) != 0 ? 1 : 0) << ButtonOffset.Moveright;
                    tickData.buttons |= ((flags & ReplayV2Flag.Reload)    != 0 ? 1 : 0) << ButtonOffset.Reload;
                    tickData.buttons |= ((flags & ReplayV2Flag.Speed)     != 0 ? 1 : 0) << ButtonOffset.Speed;
                    tickData.buttons |= ((flags & ReplayV2Flag.Use)       != 0 ? 1 : 0) << ButtonOffset.Use;
                    tickData.buttons |= ((flags & ReplayV2Flag.Bullrush)  != 0 ? 1 : 0) << ButtonOffset.Bullrush;
                    
                    tickData.flags = 0;
                    tickData.flags |= ((flags & ReplayV2Flag.Onground) != 0 ? 1 : 0) << 0;
                    tickData.flags |= ((flags & ReplayV2Flag.Ducking)  != 0 ? 1 : 0) << 1;
                    tickData.flags |= ((flags & ReplayV2Flag.Swim)     != 0 ? 1 : 0) << 11;
                    
                    this.tickDataArray.push(tickData);
                }
            } else {
                throw "Invalid replay version " + this.formatVersion + ".";
            }
        }
        
        getTickData(tick: number, data?: TickData): TickData {
            if (data === undefined) data = new TickData();
            
            data.tick = tick;
            data.position.x = this.tickDataArray[tick].position.x;
            data.position.y = this.tickDataArray[tick].position.y;
            data.position.z = this.tickDataArray[tick].position.z;
            data.angles.x = this.tickDataArray[tick].angles.x;
            data.angles.y = this.tickDataArray[tick].angles.y;
            data.buttons = this.tickDataArray[tick].buttons;
            data.flags = this.tickDataArray[tick].flags;
            
            return data;
        }

        clampTick(tick: number): number {
            return tick < 0 ? 0 : tick >= this.tickCount ? this.tickCount - 1 : tick;
        }
    }
}