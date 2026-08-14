import { h } from "../render/h.js";
import { buildSignatureValue, parseSignatureValue } from "../presentation/signature-evidence.js";
const VIEW_W = 600;
const VIEW_H = 200;
const wireDrawing = (svg, path, initialD, commit) => {
    let strokes = initialD ? [initialD] : [];
    let current = "";
    let drawing = false;
    const pt = (ev) => {
        const r = svg.getBoundingClientRect();
        const x = ((ev.clientX - r.left) / r.width) * VIEW_W;
        const y = ((ev.clientY - r.top) / r.height) * VIEW_H;
        return { x: Math.round(x), y: Math.round(y) };
    };
    const redraw = () => path.setAttribute("d", [...strokes, current].filter(Boolean).join(" "));
    const down = (ev) => {
        drawing = true;
        const p = pt(ev);
        current = `M ${p.x} ${p.y}`;
        try {
            svg.setPointerCapture(ev.pointerId);
        }
        catch { }
        redraw();
        ev.preventDefault();
    };
    const move = (ev) => {
        if (!drawing)
            return;
        const p = pt(ev);
        current += ` L ${p.x} ${p.y}`;
        redraw();
        ev.preventDefault();
    };
    const up = () => {
        if (!drawing)
            return;
        drawing = false;
        if (current)
            strokes.push(current);
        current = "";
        const d = strokes.join(" ");
        redraw();
        if (d)
            commit(d);
    };
    svg.addEventListener("pointerdown", down);
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointerleave", up);
    path.setAttribute("d", initialD);
};
export const signaturePad = (props) => {
    const { i18n, value, answers, onChange } = props;
    const now = props.now ?? (() => new Date().toISOString());
    const record = parseSignatureValue(value);
    const drawnD = record?.method === "drawn" ? record.artifact : "";
    const typedName = record?.method === "typed-name" ? record.artifact : "";
    const captured = record !== undefined && record.artifact.trim().length > 0;
    const commitDrawn = (d) => { void buildSignatureValue({ method: "drawn", artifact: d, answers, signedAt: now() }).then(onChange); };
    const onMount = (el) => wireDrawing(el, el.querySelector("path"), drawnD, commitDrawn);
    return h("div", { class: "signature-pad", "data-field": props.id }, h("p", { class: "signature-instruction" }, i18n.t("sacco.signature.instruction")), h("p", { class: "signature-testnote" }, i18n.t("sacco.signature.testNote")), props.justCleared === true && !captured
        ? h("p", { class: "signature-cleared-notice", role: "alert" }, i18n.t("sacco.signature.clearedNotice"))
        : "", h("svg", {
        class: "signature-canvas",
        id: `${props.id}-canvas`,
        viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
        role: "img",
        "aria-label": i18n.t("sacco.signature.aria"),
        "touch-action": "none",
        onMount,
    }, h("path", { class: "signature-stroke", d: drawnD, fill: "none", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" })), h("div", { class: "signature-actions" }, h("button", { type: "button", class: "btn btn-secondary signature-clear", onClick: () => onChange(undefined) }, i18n.t("sacco.signature.clear")), captured
        ? h("span", { class: "signature-status signature-captured", role: "status" }, i18n.t("sacco.signature.captured"))
        : props.justCleared === true ? "" : h("span", { class: "signature-status signature-notsigned" }, i18n.t("sacco.signature.notSigned"))), h("details", { class: "signature-typed" }, h("summary", {}, i18n.t("sacco.signature.typedToggle")), h("label", { class: "signature-typed-label", for: `${props.id}-typed` }, i18n.t("sacco.signature.typedLabel")), h("input", {
        id: `${props.id}-typed`, type: "text", class: "signature-typed-input", value: typedName,
        onInput: ((ev) => {
            const name = (ev.target?.value ?? "").trim();
            if (name.length === 0) {
                onChange(undefined);
                return;
            }
            void buildSignatureValue({ method: "typed-name", artifact: name, answers, signedAt: now() }).then(onChange);
        }),
    })));
};
