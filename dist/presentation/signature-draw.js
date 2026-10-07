export const toViewBoxPoint = (clientX, clientY, rect, viewW, viewH) => {
    const w = rect.width || 1;
    const h = rect.height || 1;
    const x = ((clientX - rect.left) / w) * viewW;
    const y = ((clientY - rect.top) / h) * viewH;
    return { x: Math.round(clamp(x, 0, viewW)), y: Math.round(clamp(y, 0, viewH)) };
};
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const startStroke = (p) => `M ${p.x} ${p.y}`;
export const extendStroke = (current, p) => (current === "" ? startStroke(p) : `${current} L ${p.x} ${p.y}`);
export const joinStrokes = (strokes, current = "") => [...strokes, current].filter((s) => s !== "").join(" ");
export class StrokeAccumulator {
    strokes;
    current = "";
    drawing = false;
    constructor(initial = "") { this.strokes = initial ? [initial] : []; }
    down(p) { this.drawing = true; this.current = startStroke(p); }
    move(p) { if (!this.drawing)
        return false; this.current = extendStroke(this.current, p); return true; }
    up() { if (!this.drawing)
        return undefined; this.drawing = false; if (this.current)
        this.strokes.push(this.current); this.current = ""; const d = this.strokes.join(" "); return d === "" ? undefined : d; }
    path() { return joinStrokes(this.strokes, this.current); }
    isDrawing() { return this.drawing; }
}
