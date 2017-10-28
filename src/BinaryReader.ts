enum SeekOrigin {
    Begin,
    Current,
    End
}

class BinaryReader {
    private readonly buffer: ArrayBuffer;
    private readonly view: DataView;
    private offset: number;
    
    constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;
        this.view = new DataView(buffer);
        this.offset = 0;
    }

    seek(offset: number, origin: SeekOrigin): number {
        switch (origin) {
            case SeekOrigin.Begin:
                return this.offset = offset;
            case SeekOrigin.End:
                return this.offset = this.buffer.byteLength - offset;
            default:
                return this.offset = this.offset + offset;
        }
    }

    getOffset(): number {
        return this.offset;
    }

    readUint8(): number {
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }
    
    readInt32(): number {
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }
    
    readUint32(): number {
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readFloat32(): number {
        const value = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readAsciiString(length?: number): string {
        if (length === undefined) {
            length = this.readUint8();
        }

        let result = "";
        for (let i = 0; i < length; ++i) {
            result += String.fromCharCode(this.readUint8());
        }
        return result;
    }

    readVector2(vec?: Facepunch.Vector2): Facepunch.Vector2 {
        if (vec === undefined) vec = new Facepunch.Vector2();
        vec.set(this.readFloat32(), this.readFloat32());
        return vec;
    }

    readVector3(vec?: Facepunch.Vector3): Facepunch.Vector3 {
        if (vec === undefined) vec = new Facepunch.Vector3();
        vec.set(this.readFloat32(), this.readFloat32(), this.readFloat32());
        return vec;
    }
}