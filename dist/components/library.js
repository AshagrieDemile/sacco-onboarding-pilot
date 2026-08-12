import { h } from "../render/h.js";
const val = (e) => e.target.value;
const checked = (e) => e.target.checked;
export const TextInput = (p) => h("input", {
    type: p.type ?? "text",
    id: p.id,
    class: `field-input${p.extraClass ? " " + p.extraClass : ""}${p.readonly ? " is-readonly" : ""}`,
    value: p.value,
    ...(p.inputmode ? { inputmode: p.inputmode } : {}),
    ...(p.placeholder ? { placeholder: p.placeholder } : {}),
    ...(p.autocomplete ? { autocomplete: p.autocomplete } : {}),
    ...(p.autofocus ? { autofocus: true } : {}),
    ...(p.maxlength !== undefined ? { maxlength: p.maxlength } : {}),
    ...(p.invalid ? { "aria-invalid": "true" } : {}),
    ...(p.readonly ? { readonly: true } : {}),
    ...(p.lang ? { lang: p.lang } : {}),
    ...(p.dir ? { dir: p.dir } : {}),
    ...(p.groupedCaret ? { "data-caret": "digits" } : {}),
    onInput: (e) => p.onInput(val(e)),
    ...(p.onBlur ? { onBlur: () => p.onBlur?.() } : {}),
});
export const TextArea = (p) => h("textarea", {
    id: p.id,
    class: "field-input",
    value: p.value,
    ...(p.autofocus ? { autofocus: true } : {}),
    onInput: (e) => p.onInput(val(e)),
});
export const Select = (p) => h("select", {
    id: p.id,
    class: "field-input",
    value: p.value,
    ...(p.disabled ? { disabled: true } : {}),
    ...(p.autofocus ? { autofocus: true } : {}),
    ...(p.invalid ? { "aria-invalid": "true" } : {}),
    onChange: (e) => p.onChange(val(e)),
}, h("option", { value: "" }, p.placeholderLabel), ...p.options.map((o) => h("option", { value: o.value }, o.label)));
export const RadioGroup = (p) => h("div", { class: "radio-group", role: "radiogroup" }, ...p.options.map((o) => h("label", { class: "radio-row" }, h("input", { type: "radio", name: p.name, value: o.value, checked: p.value === o.value, onChange: () => p.onChange(o.value) }), h("span", {}, o.label))));
export const CheckboxRow = (p) => h("label", { class: "field-check" }, h("input", { type: "checkbox", id: p.id, checked: p.checked, onChange: (e) => p.onChange(checked(e)) }), h("span", {}, p.label));
export const FieldShell = (p, control) => {
    const rows = [];
    if (p.label !== "") {
        rows.push(h("label", { class: "field-label", for: p.id }, p.label, p.required ? h("span", { class: "req", "aria-hidden": "true" }, " *") : "", !p.required && p.optionalLabel ? h("span", { class: "opt" }, ` (${p.optionalLabel})`) : ""));
    }
    rows.push(control);
    if (p.hint)
        rows.push(h("p", { class: "field-hint", id: `${p.id}-hint` }, p.hint));
    if (p.errorText)
        rows.push(h("p", { class: "field-error", role: "alert" }, p.errorText));
    return h("div", { class: `field${p.errorText ? " has-error" : ""}` }, ...rows);
};
export const Button = (p) => h("button", {
    type: p.type ?? "button",
    class: `btn btn-${p.variant ?? "primary"}`,
    ...(p.disabled ? { disabled: true } : {}),
    ...(p.ariaLabel ? { "aria-label": p.ariaLabel } : {}),
    onClick: p.onClick,
}, p.label);
export const LanguageSwitcher = (p) => h("button", { type: "button", class: "lang-toggle", onClick: p.onToggle, "aria-label": p.ariaLabel }, p.label);
export const ProgressIndicator = (p) => {
    const pct = p.total > 0 ? Math.round((p.step / p.total) * 100) : 0;
    return h("div", { class: "progress", role: "group", "aria-label": p.label }, h("div", { class: "progress-track" }, h("div", { class: "progress-fill", style: `width:${pct}%` })), h("p", { class: "progress-text" }, p.label));
};
export const StepHeader = (p) => h("header", { class: "journey-head" }, h("div", { class: "journey-head-row" }, h("h1", { id: "journey-title", class: "journey-title" }, p.title), LanguageSwitcher({ label: p.langLabel, onToggle: p.onLanguage, ariaLabel: p.langAria })), ProgressIndicator({ step: p.step, total: p.total, label: p.progressLabel }), p.saveLabel ? h("p", { class: "save-indicator", role: "status", "aria-live": "polite" }, p.saveLabel) : "");
export const StageHeader = (p) => h("header", { class: "journey-head stage-head" }, h("div", { class: "journey-head-row" }, h("span", { class: "stage-kicker" }, p.journeyName), LanguageSwitcher({ label: p.langLabel, onToggle: p.onLanguage, ariaLabel: p.langAria })), h("div", { class: "stage-title-row" }, h("span", { class: "stage-icon", "aria-hidden": "true" }, p.icon), h("h1", { id: "journey-title", class: "stage-title" }, p.title)), h("div", { class: "stage-progress-row" }, h("span", { class: "stage-step" }, p.progressLabel), p.remainingLabel ? h("span", { class: "stage-remaining" }, p.remainingLabel) : ""), ProgressIndicator({ step: p.step, total: p.total, label: p.progressLabel }), p.helpText ? h("p", { class: "stage-help" }, p.helpText) : "", p.saveLabel ? h("p", { class: "save-indicator", role: "status", "aria-live": "polite" }, p.saveLabel) : "");
export const ErrorBanner = (p) => h("p", { class: "form-error-summary", role: "alert" }, p.text);
export const LoadingSpinner = (p) => h("div", { class: "loading", role: "status", "aria-live": "polite" }, h("span", { class: "spinner", "aria-hidden": "true" }), h("span", { class: "loading-label" }, p.label));
export const SummaryCard = (p) => h("section", { class: "summary-card", "aria-label": p.title }, h("h2", { class: "summary-title" }, p.title), h("dl", { class: "summary-list" }, ...p.rows.flatMap((r) => [h("dt", { class: "summary-key" }, r.label), h("dd", { class: "summary-val" }, r.value)])));
export const DocumentUploadPlaceholder = (p) => h("input", {
    type: "text",
    id: p.id,
    class: "field-input field-document",
    placeholder: p.hint,
    value: p.value,
    onInput: (e) => p.onInput(val(e)),
});
