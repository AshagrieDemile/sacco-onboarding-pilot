import { h } from "../render/h.js";
import { buildSignatureValue, parseSignatureValue } from "../presentation/signature-evidence.js";
import { StrokeAccumulator, toViewBoxPoint } from "../presentation/signature-draw.js";
const VIEW_W = 600;
const VIEW_H = 200;
const wireDrawing = (svg, path, initialD, commit) => {
    const acc = new StrokeAccumulator(initialD);
    const pt = (ev) => toViewBoxPoint(ev.clientX, ev.clientY, svg.getBoundingClientRect(), VIEW_W, VIEW_H);
    const redraw = () => path.setAttribute("d", acc.path());
    const down = (ev) => { acc.down(pt(ev)); try {
        svg.setPointerCapture(ev.pointerId);
    }
    catch { } redraw(); ev.preventDefault(); };
    const move = (ev) => { if (acc.move(pt(ev))) {
        redraw();
        ev.preventDefault();
    } };
    const up = () => { const d = acc.up(); redraw(); if (d)
        commit(d); };
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
    const statusText = captured
        ? i18n.t("sacco.signature.captured")
        : props.justCleared === true ? i18n.t("sacco.signature.clearedNotice") : i18n.t("sacco.signature.notSigned");
    const statusClass = captured ? "signature-captured" : "signature-notsigned";
    return h("div", { class: "signature-pad", "data-field": props.id }, h("p", { class: "signature-instruction" }, i18n.t("sacco.signature.instruction")), h("p", { class: "signature-hint" }, i18n.t("sacco.signature.hint")), h("p", { class: "signature-testnote" }, i18n.t("sacco.signature.testNote")), props.justCleared === true && !captured
        ? h("p", { class: "signature-cleared-notice", role: "alert" }, i18n.t("sacco.signature.clearedNotice"))
        : "", h("div", { class: "signature-canvas-wrap" }, h("svg", {
        class: "signature-canvas",
        id: `${props.id}-canvas`,
        viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
        role: "img",
        "aria-label": i18n.t("sacco.signature.aria"),
        "touch-action": "none",
        onMount,
    }, h("path", { class: "signature-stroke", d: drawnD, fill: "none", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" }))), h("div", { class: "signature-actions" }, h("button", { type: "button", class: "btn btn-secondary signature-clear", onClick: () => onChange(undefined) }, i18n.t("sacco.signature.clear"))), h("p", { class: `signature-status-line ${statusClass}`, role: "status" }, h("span", { class: "signature-status-label" }, i18n.t("sacco.signature.statusLabel")), " ", h("span", { class: "signature-status-value" }, statusText)), h("details", { class: "signature-typed" }, h("summary", { class: "signature-typed-toggle btn btn-ghost" }, i18n.t("sacco.signature.typedToggle")), h("div", { class: "signature-typed-body" }, h("label", { class: "signature-typed-label", for: `${props.id}-typed` }, i18n.t("sacco.signature.typedLabel")), h("input", {
        id: `${props.id}-typed`, type: "text", class: "field-input signature-typed-input", value: typedName, autocomplete: "name",
        onInput: ((ev) => {
            const name = (ev.target?.value ?? "").trim();
            if (name.length === 0) {
                onChange(undefined);
                return;
            }
            void buildSignatureValue({ method: "typed-name", artifact: name, answers, signedAt: now() }).then(onChange);
        }),
    }))));
};
