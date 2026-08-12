import { h } from "../render/h.js";
import { formatMoney, toNumber, round2 } from "./money.js";
import { saccoShareValue } from "../brand/organisation.js";
export const computeSubscription = (draft, shareValue = saccoShareValue()) => {
    const shares = Math.max(0, Math.trunc(toNumber(draft["sharesRequested"])));
    const total = round2(shares * shareValue);
    const initial = round2(Math.max(0, toNumber(draft["initialContribution"])));
    return {
        shares,
        shareValue: round2(shareValue),
        total,
        initial,
        remaining: round2(total - initial),
        initialExceedsTotal: total > 0 && initial > total,
    };
};
const row = (label, value, extraClass = "") => h("div", { class: `subs-row${extraClass ? " " + extraClass : ""}` }, h("span", { class: "subs-label" }, label), h("span", { class: "subs-value" }, value));
export const sharesPanel = (i18n, draft, shareValue) => {
    const s = computeSubscription(draft, shareValue);
    return h("section", { class: "subs-panel", "aria-live": "polite" }, row(i18n.t("share.valuePerShare"), formatMoney(s.shareValue, i18n), "subs-fixed"), row(i18n.t("share.total"), formatMoney(s.total, i18n), "subs-total"));
};
export const contributionPanel = (i18n, draft, shareValue) => {
    const s = computeSubscription(draft, shareValue);
    return h("section", { class: "subs-panel", "aria-live": "polite" }, row(i18n.t("share.total"), formatMoney(s.total, i18n), "subs-total"), row(i18n.t("share.initial"), formatMoney(s.initial, i18n)), row(i18n.t("share.remaining"), formatMoney(Math.max(0, s.remaining), i18n), "subs-remaining"), s.initialExceedsTotal
        ? h("p", { class: "subs-error", role: "alert" }, i18n.t("share.err.exceeds", { total: formatMoney(s.total, i18n) }))
        : "");
};
