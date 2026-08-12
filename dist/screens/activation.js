import { h } from "../render/h.js";
import { Button, TextInput, FieldShell, LanguageSwitcher } from "../components/library.js";
import { phoneControl } from "../components/semantic.js";
import { groupNational, isValidNationalMobile } from "../standards/ethiopian.js";
import { currentBrand } from "../brand/brand.js";
const brandHeader = (i18n, onLanguage) => {
    const brand = currentBrand();
    return h("header", { class: "app-header" }, h("span", { class: "brand-logo" }, brand.logoImage ? h("img", { class: "brand-logo-img", src: brand.logoImage, alt: brand.name }) : h("span", { class: "brand-logo-mark" }, brand.logoMark)), LanguageSwitcher({ label: i18n.t(`language.${i18n.locale === "am" ? "en" : "am"}`), onToggle: onLanguage, ariaLabel: i18n.t("action.change_language") }));
};
export const phoneScreen = (p) => {
    const t = p.i18n.t.bind(p.i18n);
    const valid = isValidNationalMobile(p.phone);
    return h("div", { class: "screen screen-phone" }, brandHeader(p.i18n, p.onLanguage), h("main", { class: "screen-body" }, h("h1", { class: "screen-title" }, t("activation.phone.title")), h("p", { class: "screen-lede" }, t("activation.phone.lede")), FieldShell({ id: "f_activation_phone", label: t("std.mobile"), required: true }, phoneControl({ id: "f_activation_phone", value: p.phone, invalid: false, onChange: p.onPhone })), p.message ? h("p", { class: "field-error", role: "alert" }, t(p.message)) : "", Button({ label: p.busy ? t("status.loading") : t("activation.phone.request"), onClick: p.onRequest, variant: "primary", disabled: p.busy || !valid }), h("p", { class: "field-hint" }, t("activation.phone.hint"))));
};
export const OTP_DIGITS = 6;
export const sanitiseOtpInput = (raw) => raw.replace(/\D+/g, "").slice(0, OTP_DIGITS);
export const isCompleteOtp = (code) => new RegExp(`^[0-9]{${OTP_DIGITS}}$`).test(code);
export const otpScreen = (p) => {
    const t = p.i18n.t.bind(p.i18n);
    const display = `+251 ${groupNational(p.verification.phone ?? "")}`;
    const canResend = p.cooldownRemaining <= 0 && !p.busy;
    const canVerify = isCompleteOtp(p.code) && !p.busy && p.verification.state !== "LOCKED";
    return h("div", { class: "screen screen-otp" }, brandHeader(p.i18n, p.onLanguage), h("main", { class: "screen-body" }, h("h1", { class: "screen-title" }, t("activation.otp.title")), h("p", { class: "screen-lede" }, t("activation.otp.sent", { phone: display })), p.devTestOtp
        ? h("div", { class: "otp-testmode", role: "status" }, h("span", { class: "otp-testmode-tag" }, t("activation.otp.testmode.tag")), h("p", { class: "otp-testmode-lede" }, t("activation.otp.testmode.lede")), h("code", { class: "otp-testmode-code" }, p.devTestOtp), h("p", { class: "otp-testmode-note" }, t("activation.otp.testmode.note")))
        : "", FieldShell({ id: "f_otp", label: t("activation.otp.label"), required: true }, TextInput({ id: "f_otp", value: p.code, type: "text", inputmode: "numeric", dir: "ltr", placeholder: "••••••", maxlength: OTP_DIGITS, autofocus: true, extraClass: "otp-input", onInput: (v) => p.onCode(sanitiseOtpInput(v)) })), p.verification.message ? h("p", { class: `field-error${p.verification.state === "VERIFIED" ? " is-ok" : ""}`, role: "alert" }, t(p.verification.message, p.verification.remainingAttempts !== undefined ? { n: p.verification.remainingAttempts } : undefined)) : "", p.expiryRemaining > 0
        ? h("p", { class: "field-hint" }, t("activation.otp.expiresIn", { s: p.expiryRemaining }))
        : h("p", { class: "field-error" }, t("activation.otp.expired")), Button({ label: p.busy ? t("status.loading") : t("activation.otp.verify"), onClick: p.onVerify, variant: "primary", disabled: !canVerify }), h("div", { class: "otp-actions" }, h("button", { type: "button", class: "btn btn-ghost", onClick: p.onResend, disabled: !canResend }, canResend ? t("activation.otp.resend") : t("activation.otp.resendIn", { s: p.cooldownRemaining })), h("button", { type: "button", class: "btn btn-ghost", onClick: p.onChangeNumber }, t("activation.otp.change")))));
};
