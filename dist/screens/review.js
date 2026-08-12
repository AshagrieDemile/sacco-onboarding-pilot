import { h } from "../render/h.js";
import { Button } from "../components/library.js";
import { stageMeta } from "../presentation/stage-meta.js";
import { groupNational, isValidNationalMobile } from "../standards/ethiopian.js";
import { isoToEthiopian, formatEthiopian } from "../standards/ethiopian-calendar.js";
import { lookupAdminName, formatWoreda } from "../data/ethiopia.js";
import { maskFayda } from "../ops/operations.js";
import { deriveFullName } from "../standards/ethiopian.js";
import { formatMoney, toNumber } from "../presentation/money.js";
import { computeSubscription } from "../presentation/share-subscription.js";
const strv = (v) => (v === undefined || v === null ? "" : String(v));
const formatValue = (i18n, field, draft) => {
    const raw = strv(draft[field.id]);
    if (raw === "")
        return "—";
    switch (field.semanticType) {
        case "ethiopian-mobile-number": return `+251 ${groupNational(raw)}`;
        case "fayda-national-id": return maskFayda(raw);
        case "eth-woreda": return formatWoreda(raw, i18n.locale);
        case "eth-region":
        case "eth-zone":
        case "eth-city": return lookupAdminName(raw, i18n.locale);
        case "decimal": return formatMoney(toNumber(raw), i18n);
        case "boolean": return raw === "true" ? "✓" : "—";
        case "date": {
            if (i18n.locale === "am") {
                const e = isoToEthiopian(raw);
                return e ? formatEthiopian(e, "am") : raw;
            }
            return raw;
        }
        default:
            return field.constraints?.options !== undefined ? i18n.option(field.id, raw) : raw;
    }
};
const moneyRow = (label, value, extraClass = "") => h("div", { class: `review-row${extraClass ? " " + extraClass : ""}` }, h("dt", {}, label), h("dd", {}, value));
const subscriptionRows = (i18n, stageId, merged) => {
    const sub = computeSubscription(merged);
    if (stageId === "shares") {
        return [
            moneyRow(i18n.t("share.valuePerShare"), formatMoney(sub.shareValue, i18n)),
            moneyRow(i18n.t("share.total"), formatMoney(sub.total, i18n), "review-row-strong"),
        ];
    }
    if (stageId === "savings") {
        return [
            moneyRow(i18n.t("share.total"), formatMoney(sub.total, i18n)),
            moneyRow(i18n.t("share.remaining"), formatMoney(Math.max(0, sub.remaining), i18n), "review-row-strong"),
        ];
    }
    return [];
};
const sectionFor = (i18n, s, index, onEdit, merged) => {
    const meta = stageMeta(s.stageId, s.presentation.stageType);
    const fields = (s.presentation.form?.fields ?? []).filter((f) => strv(s.draft[f.id]) !== "" && f.id !== "shareValue");
    const nameFields = fields.filter((f) => f.id.startsWith("name_"));
    const otherFields = fields.filter((f) => !f.id.startsWith("name_"));
    const rows = [];
    if (nameFields.length > 0) {
        rows.push(h("div", { class: "review-row" }, h("dt", {}, i18n.t("std.name.full")), h("dd", {}, deriveFullName(s.draft) || "—")));
    }
    for (const f of otherFields) {
        rows.push(h("div", { class: "review-row" }, h("dt", {}, i18n.t(f.labelKey)), h("dd", {}, formatValue(i18n, f, s.draft))));
    }
    rows.push(...subscriptionRows(i18n, s.stageId, merged));
    if (rows.length === 0)
        return h("");
    return h("section", { class: "review-card" }, h("header", { class: "review-card-head" }, h("span", { class: "review-card-title" }, `${meta.icon} ${i18n.t(meta.titleKey)}`), h("button", { type: "button", class: "btn btn-ghost review-edit", onClick: () => onEdit(index) }, i18n.t("review.edit"))), h("dl", { class: "review-list" }, ...rows));
};
export const reviewScreen = (p) => {
    const t = p.i18n.t.bind(p.i18n);
    const merged = {};
    for (const st of p.stages)
        Object.assign(merged, st.draft);
    const sections = p.stages
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.presentation.stageType !== "review" && s.presentation.stageType !== "terminal")
        .map(({ s, i }) => sectionFor(p.i18n, s, i, p.onEdit, merged));
    return h("div", { class: "screen screen-review" }, p.banner ?? "", h("header", { class: "journey-head" }, h("div", { class: "journey-head-row" }, h("h1", { class: "journey-title" }, t("review.title")), h("button", { type: "button", class: "lang-toggle", onClick: p.onLanguage, "aria-label": t("action.change_language") }, t(`language.${p.i18n.locale === "am" ? "en" : "am"}`))), h("p", { class: "screen-lede" }, t("review.lede"))), h("main", { class: "review-body" }, ...sections), h("label", { class: "field-check review-confirm" }, h("input", { type: "checkbox", checked: p.confirmed, onChange: (e) => p.onToggleConfirm(Boolean(e.target.checked)) }), h("span", {}, t("review.confirm"))), Button({ label: p.busy ? t("status.saving") : t("review.submit"), onClick: p.onConfirm, variant: "primary", disabled: p.busy || !p.confirmed }));
};
