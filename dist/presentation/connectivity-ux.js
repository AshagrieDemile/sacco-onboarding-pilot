import { h } from "../render/h.js";
export const connectivityKey = (status) => {
    switch (status) {
        case "offline":
            return "conn.offline";
        case "recovering":
            return "conn.reconnecting";
        default:
            return undefined;
    }
};
export const canSubmitNow = (status) => status !== "offline";
export const saveIndicatorKey = (save) => {
    switch (save) {
        case "saving":
            return "status.saving";
        case "saved":
            return "status.saved";
        case "savedOnDevice":
            return "status.savedOnDevice";
        default:
            return undefined;
    }
};
export const connectivityBanner = (i18n, status) => {
    const key = connectivityKey(status);
    if (key === undefined)
        return null;
    const tone = status === "offline" ? "is-offline" : "is-reconnecting";
    return h("div", { class: `conn-banner ${tone}`, role: "status", "aria-live": "polite" }, h("span", { class: "conn-dot", "aria-hidden": "true" }, ""), h("span", { class: "conn-text" }, i18n.t(key)));
};
