class TickData {
    readonly position = new Facepunch.Vector3();
    readonly angles = new Facepunch.Vector2();
    buttons = 0;
    flags = 0;
}

class ReplayFile {
    static readonly MAGIC = 0x676F6B7A;

    private readonly reader: BinaryReader;
    private readonly firstTickOffset: number;
    private readonly tickSize: number;

    readonly formatVersion: number;
    readonly pluginVersion: string;

    readonly mapName: string;
    readonly course: number;
    readonly mode: number;
    readonly style: number;
    readonly time: number;
    readonly teleportsUsed: number;
    readonly steamId: number;
    readonly steamId2: string;
    readonly playerIp: string;
    readonly playerName: string;
    readonly tickCount: number;
    readonly tickRate: number;

    constructor(data: ArrayBuffer) {
        const reader = this.reader = new BinaryReader(data);

        const magic = reader.readInt32();
        if (magic !== ReplayFile.MAGIC) {
            throw "Unrecognised replay file format.";
        }

        this.formatVersion = reader.readUint8();
        this.pluginVersion = reader.readAsciiString();

        this.mapName = reader.readAsciiString();
        this.course = reader.readInt32();
        this.mode = reader.readInt32();
        this.style = reader.readInt32();
        this.time = reader.readFloat32();
        this.teleportsUsed = reader.readInt32();
        this.steamId = reader.readInt32();
        this.steamId2 = reader.readAsciiString();
        this.playerIp = reader.readAsciiString();
        this.playerName = reader.readAsciiString();
        this.tickCount = reader.readInt32();
        this.tickRate = Math.round(this.tickCount / this.time); // todo

        this.firstTickOffset = reader.getOffset();
        this.tickSize = 7 * 4;
    }

    getTickData(tick: number, data?: TickData): TickData {
        if (data === undefined) data = new TickData();

        const reader = this.reader;
        reader.seek(this.firstTickOffset + this.tickSize * tick, SeekOrigin.Begin);

        reader.readVector3(data.position);
        reader.readVector2(data.angles);
        data.buttons = reader.readInt32();
        data.flags = reader.readInt32();

        return data;
    }
}