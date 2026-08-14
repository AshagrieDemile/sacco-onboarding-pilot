import { isVNode } from "./h.js";
import { regroupCaret } from "./caret.js";
const EVENT_PROPS = {
    onClick: "click",
    onInput: "input",
    onChange: "change",
    onSubmit: "submit",
    onBlur: "blur",
};
const toDom = (node) => {
    if (node === null || node === undefined || node === false)
        return null;
    if (typeof node === "string" || typeof node === "number")
        return document.createTextNode(String(node));
    return elementFrom(node);
};
const elementFrom = (v) => {
    const el = document.createElement(v.tag);
    const isSelect = v.tag === "select";
    let deferredValue;
    for (const [key, value] of Object.entries(v.props)) {
        if (value === undefined)
            continue;
        const event = EVENT_PROPS[key];
        if (event !== undefined) {
            el.addEventListener(event, value);
        }
        else if (key === "value") {
            if (isSelect)
                deferredValue = String(value);
            else
                el.value = String(value);
        }
        else if (key === "checked") {
            el.checked = Boolean(value);
        }
        else if (typeof value === "boolean") {
            if (value)
                el.setAttribute(key, "");
        }
        else {
            el.setAttribute(key, String(value));
        }
    }
    for (const child of v.children) {
        const dom = toDom(child);
        if (dom)
            el.appendChild(dom);
    }
    if (deferredValue !== undefined)
        el.value = deferredValue;
    const onMount = v.props["onMount"];
    if (typeof onMount === "function")
        queueMicrotask(() => onMount(el));
    return el;
};
export const mount = (container, vnode) => {
    const active = document.activeElement;
    const focusId = active && active.id && container.contains(active) ? active.id : undefined;
    const selStart = active?.selectionStart ?? null;
    const selEnd = active?.selectionEnd ?? null;
    const caretMode = active && typeof active.getAttribute === "function" ? active.getAttribute("data-caret") : null;
    const oldValue = typeof active?.value === "string" ? active.value : "";
    container.replaceChildren();
    if (isVNode(vnode))
        container.appendChild(elementFrom(vnode));
    if (focusId !== undefined) {
        const next = document.getElementById(focusId);
        if (next) {
            next.focus();
            if (selStart !== null && typeof next.setSelectionRange === "function" && "value" in next) {
                try {
                    if (caretMode === "digits") {
                        const pos = regroupCaret(oldValue, selStart, next.value);
                        next.setSelectionRange(pos, pos);
                    }
                    else {
                        const end = Math.min(selEnd ?? selStart, next.value.length);
                        next.setSelectionRange(Math.min(selStart, end), end);
                    }
                }
                catch {
                }
            }
        }
    }
};
