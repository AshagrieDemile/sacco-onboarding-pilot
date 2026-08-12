import { h } from "../render/h.js";
import { saccoName } from "../brand/organisation.js";
const bullets = (i18n, keys, params) => h("ul", { class: "terms-list" }, ...keys.map((k) => h("li", {}, i18n.t(k, params))));
export const termsPrivacyPanel = (i18n) => {
    const sacco = saccoName(i18n.locale);
    return h("section", { class: "terms-panel" }, h("h2", { class: "terms-title" }, i18n.t("terms.title")), h("p", { class: "terms-lede" }, i18n.t("terms.lede", { sacco })), bullets(i18n, [
        "terms.point.willingness",
        "terms.point.subscription",
        "terms.point.initial",
        "terms.point.remaining",
        "terms.point.admission",
        "terms.point.obligations",
        "terms.point.notOverride",
    ], { sacco }), h("p", { class: "terms-note" }, i18n.t("terms.note")), h("h2", { class: "terms-title" }, i18n.t("privacy.title")), h("p", { class: "terms-lede" }, i18n.t("privacy.lede", { sacco })), h("p", { class: "terms-subhead" }, i18n.t("privacy.collectHead")), bullets(i18n, [
        "privacy.collect.name",
        "privacy.collect.phone",
        "privacy.collect.fayda",
        "privacy.collect.address",
        "privacy.collect.dob",
        "privacy.collect.membership",
        "privacy.collect.contribution",
        "privacy.collect.verification",
    ]), h("p", { class: "terms-subhead" }, i18n.t("privacy.useHead")), bullets(i18n, [
        "privacy.use.identification",
        "privacy.use.administration",
        "privacy.use.compliance",
        "privacy.use.communication",
        "privacy.use.operational",
    ]), h("p", { class: "terms-note" }, i18n.t("privacy.note")));
};
