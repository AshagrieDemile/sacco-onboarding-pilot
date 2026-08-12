import { h } from "../render/h.js";
import { ApiError } from "../api/errors.js";
export const classifySyncFailure = (error) => {
    if (!(error instanceof ApiError))
        return "unknown";
    switch (error.code) {
        case "network":
        case "service_unavailable":
        case "internal_error":
            return "transient";
        case "conflict":
            return "conflict";
        case "completed":
            return "alreadyDone";
        case "not_found":
        case "unknown_template":
            return "journeyGone";
        case "unprocessable_entity":
            return "invalid";
        default:
            return typeof error.status === "number" && error.status >= 500 ? "transient" : "unknown";
    }
};
export const nextSyncAction = (error, ctx) => {
    switch (classifySyncFailure(error)) {
        case "journeyGone":
            return { kind: "journeyGone" };
        case "conflict":
            return { kind: "reconcile", notice: "conflict" };
        case "alreadyDone":
            return { kind: "reconcile" };
        case "invalid":
            return !ctx.atStart && ctx.hasInstance ? { kind: "reconcile" } : { kind: "hardError" };
        case "transient":
        case "unknown":
        default:
            return ctx.atStart || !ctx.hasInstance ? { kind: "hardError" } : { kind: "stay", notice: "transient" };
    }
};
export const syncNoticeKey = (kind) => {
    switch (kind) {
        case "transient":
        case "unknown":
            return "sync.transient";
        case "conflict":
            return "sync.conflict";
        default:
            return undefined;
    }
};
export const reconnectedBanner = (i18n, show) => {
    if (!show)
        return null;
    return h("div", { class: "conn-banner is-restored", role: "status", "aria-live": "polite" }, h("span", { class: "conn-dot", "aria-hidden": "true" }, ""), h("span", { class: "conn-text" }, i18n.t("conn.restored")));
};
export const syncNoticeBanner = (i18n, kind) => {
    const key = syncNoticeKey(kind);
    if (key === undefined)
        return null;
    const tone = kind === "conflict" ? "is-conflict" : "is-retry";
    return h("div", { class: `conn-banner ${tone}`, role: "status", "aria-live": "polite" }, h("span", { class: "conn-dot", "aria-hidden": "true" }, ""), h("span", { class: "conn-text" }, i18n.t(key)));
};
