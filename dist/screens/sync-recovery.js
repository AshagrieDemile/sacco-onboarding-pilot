import { h } from "../render/h.js";
import { Button } from "../components/library.js";
const languageToggle = (i18n, onLanguage) => h("button", { type: "button", class: "lang-toggle", onClick: onLanguage, "aria-label": i18n.t("action.change_language") }, i18n.t(`language.${i18n.locale === "am" ? "en" : "am"}`));
export const syncRecoveryScreen = (p) => {
    const t = p.i18n.t.bind(p.i18n);
    return h("div", { class: "screen screen-recover screen-sync-recover" }, h("header", { class: "app-header" }, languageToggle(p.i18n, p.onLanguage)), h("main", { class: "screen-body" }, h("h1", { class: "screen-title" }, t("sync.goneTitle")), h("p", { class: "screen-lede" }, t("sync.goneBody")), h("div", { class: "recover-actions" }, Button({ label: t("sync.startNew"), onClick: p.onStartNew, variant: "primary" })), h("p", { class: "recover-note" }, t("sync.goneNote"))));
};
