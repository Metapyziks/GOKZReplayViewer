namespace Gokz {
    export enum SeekOrigin {
        Begin,
        Current,
        End
    }

    export class BinaryReader {
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

        // http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt

        /* utf.js - UTF-8 <=> UTF-16 convertion
        *
        * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
        * Version: 1.0
        * LastModified: Dec 25 1999
        * This library is free.  You can redistribute it and/or modify it.
        */

        static utf8ArrayToStr(array: number[]): string {
            var out, i, len, c;
            var char2, char3;

            out = "";
            len = array.length;
            i = 0;
            while(i < len) {
                c = array[i++];
                switch(c >> 4) { 
                case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                    // 0xxxxxxx
                    out += String.fromCharCode(c);
                    break;
                case 12: case 13:
                    // 110x xxxx   10xx xxxx
                    char2 = array[i++];
                    out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                    break;
                case 14:
                    // 1110 xxxx  10xx xxxx  10xx xxxx
                    char2 = array[i++];
                    char3 = array[i++];
                    out += String.fromCharCode(((c & 0x0F) << 12) |
                                ((char2 & 0x3F) << 6) |
                                ((char3 & 0x3F) << 0));
                    break;
                }
            }

            return out;
        }

        readString(length?: number): string {
            if (length === undefined) {
                length = this.readUint8();
            }

            let chars = new Array<number>(length);
            for (let i = 0; i < length; ++i) {
                chars[i] = this.readUint8();
            }

            return BinaryReader.utf8ArrayToStr(chars);
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
}