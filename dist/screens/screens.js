import { h } from "../render/h.js";
import { LOCALES } from "../i18n/i18n.js";
import { Button } from "../components/library.js";
import { currentBrand } from "../brand/brand.js";
import { currentOrganisation, composeOrgDisplay } from "../brand/organisation.js";
const chromeHeader = (i18n, onLanguage) => {
    const brand = currentBrand();
    return h("header", { class: "app-header" }, h("span", { class: "brand-logo" }, brand.logoImage ? h("img", { class: "brand-logo-img", src: brand.logoImage, alt: brand.name }) : h("span", { class: "brand-logo-mark" }, brand.logoMark)), h("button", { type: "button", class: "lang-toggle", onClick: onLanguage, "aria-label": i18n.t("action.change_language") }, i18n.t(`language.${i18n.locale === "am" ? "en" : "am"}`)));
};
const introText = (i18n) => {
    const org = currentOrganisation();
    const bespoke = i18n.locale === "am" ? org.welcomeMessageAm : org.welcomeMessageEn;
    return bespoke ?? i18n.t("home.intro", { org: composeOrgDisplay(i18n.locale, org) });
};
export const welcomeScreen = (p) => {
    const t = p.i18n.t.bind(p.i18n);
    const need = (icon, key) => h("li", { class: "need-item" }, h("span", { class: "need-check", "aria-hidden": "true" }, "✓"), h("span", {}, t(key)));
    return h("div", { class: "screen screen-home" }, chromeHeader(p.i18n, p.onLanguage), h("main", { class: "screen-body" }, h("p", { class: "home-kicker" }, t("home.subtitle")), h("h1", { class: "screen-title" }, t("welcome.title")), h("p", { class: "screen-lede" }, introText(p.i18n)), h("p", { class: "home-interest" }, t("welcome.interest")), h("div", { class: "home-estimate" }, h("span", { class: "home-estimate-label" }, t("welcome.estimated.label")), h("span", { class: "home-estimate-value" }, t("welcome.estimated.time"))), h("section", { class: "home-need", "aria-label": t("welcome.need.title") }, h("h2", { class: "section-title" }, t("welcome.need.title")), h("ul", { class: "need-list" }, need("✓", "welcome.need.fayda"), need("✓", "welcome.need.mobile"), need("✓", "welcome.need.personal"), need("✓", "welcome.need.membership"))), h("p", { class: "home-autosave" }, t("welcome.autosave")), Button({ label: t("action.startOnboarding"), onClick: p.onStart, variant: "primary" })));
};
export const pickerScreen = (p) => h("div", { class: "screen screen-picker" }, chromeHeader(p.i18n, p.onLanguage), h("main", { class: "screen-body" }, h("h1", { class: "screen-title" }, p.i18n.t("journey.pick.title")), h("ul", { class: "journey-list" }, ...p.catalog.map((entry) => h("li", {}, h("button", { type: "button", class: "journey-choice", onClick: () => p.onSelect(entry) }, p.i18n.t(entry.nameKey)))))));
export const languageScreen = (p) => h("div", { class: "screen screen-language" }, h("main", { class: "screen-body" }, h("h1", { class: "screen-title" }, p.i18n.t("language.select.title")), h("p", { class: "screen-lede" }, p.i18n.t("language.select.prompt")), h("ul", { class: "lang-list" }, ...LOCALES.map((loc) => h("li", {}, h("button", { type: "button", class: `lang-choice${loc === p.i18n.locale ? " is-active" : ""}`, onClick: () => p.onChoose(loc) }, p.i18n.t(`language.${loc}`)))))));
export const terminalScreen = (p) => h("div", { class: "screen screen-terminal" }, chromeHeader(p.i18n, p.onLanguage), h("main", { class: "screen-body screen-body-center" }, h("div", { class: "terminal-badge", "aria-hidden": "true" }, "✓"), h("h1", { class: "screen-title" }, p.i18n.t("terminal.title")), h("p", { class: "screen-lede" }, p.i18n.t("terminal.body")), p.presentation.outcome
    ? h("p", { class: "terminal-meta" }, `${p.i18n.t("terminal.outcome")}: ${p.presentation.outcome}`)
    : "", h("p", { class: "terminal-meta" }, `${p.i18n.t("terminal.reference")}: ${p.presentation.instanceId}`), h("button", { type: "button", class: "btn-secondary", onClick: p.onRestart }, p.i18n.t("action.restart"))));
export const errorScreen = (p) => {
    const t = p.i18n.t.bind(p.i18n);
    const connectivity = p.code === "network" || p.code === "service_unavailable";
    const title = connectivity ? t("error.unable_connect") : t("error.title");
    const explanation = t(p.messageKey ?? "error.body");
    return h("div", { class: "screen screen-error" }, h("main", { class: "screen-body screen-body-center" }, h("div", { class: "error-badge", "aria-hidden": "true" }, "!"), h("h1", { class: "screen-title" }, title), h("p", { class: "screen-lede" }, explanation), p.reference
        ? h("p", { class: "error-ref" }, h("span", { class: "error-ref-label" }, t("error.reference") + ": "), h("span", { class: "error-ref-code" }, p.reference), p.correlation ? h("span", { class: "error-corr" }, ` (${p.correlation})`) : "")
        : "", h("div", { class: "error-actions" }, h("button", { type: "button", class: "btn-primary", onClick: p.onRetry }, t("action.retry")), h("button", { type: "button", class: "btn-secondary", onClick: p.onHome }, t("action.returnHome"))), h("p", { class: "error-support" }, t("error.support"))));
};
