namespace Gokz {
    export class Utils {
        static deltaAngle(a: number, b: number): number {
            return (b - a) - Math.floor((b - a + 180) / 360) * 360;
        }

        static hermiteValue(p0: number, p1: number, p2: number, p3: number, t: number): number {
            const m0 = (p2 - p0) * 0.5;
            const m1 = (p3 - p1) * 0.5;

            const t2 = t * t;
            const t3 = t * t * t;

            return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m0
                + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m1;
        }

        static hermitePosition(p0: Facepunch.Vector3, p1: Facepunch.Vector3,
            p2: Facepunch.Vector3, p3: Facepunch.Vector3, t: number, out: Facepunch.Vector3) {
            out.x = Utils.hermiteValue(p0.x, p1.x, p2.x, p3.x, t);
            out.y = Utils.hermiteValue(p0.y, p1.y, p2.y, p3.y, t);
            out.z = Utils.hermiteValue(p0.z, p1.z, p2.z, p3.z, t);
        }

        static hermiteAngles(a0: Facepunch.Vector2, a1: Facepunch.Vector2,
            a2: Facepunch.Vector2, a3: Facepunch.Vector2, t: number, out: Facepunch.Vector2) {
            out.x = Utils.hermiteValue(
                a1.x + Utils.deltaAngle(a1.x, a0.x),
                a1.x,
                a1.x + Utils.deltaAngle(a1.x, a2.x),
                a1.x + Utils.deltaAngle(a1.x, a3.x), t);
            out.y = Utils.hermiteValue(
                a1.y + Utils.deltaAngle(a1.y, a0.y),
                a1.y,
                a1.y + Utils.deltaAngle(a1.y, a2.y),
                a1.y + Utils.deltaAngle(a1.y, a3.y), t);
        }
    }
}
