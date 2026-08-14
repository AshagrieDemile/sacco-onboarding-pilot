import {} from "./h.js";
import { ETH } from "../standards/ethiopian.js";
import { TextInput, TextArea, Select, CheckboxRow, FieldShell, DocumentUploadPlaceholder } from "../components/library.js";
import { phoneControl, faydaControl } from "../components/semantic.js";
import { signaturePad } from "../components/signature-pad.js";
import { ethiopianDateControl, gregorianDateControl } from "../components/date-control.js";
import { formatAmount, toNumber, sanitiseMoneyInput } from "../presentation/money.js";
export const widgetFor = (semanticType) => {
    switch (semanticType) {
        case "long-text":
            return "textarea";
        case "integer":
        case "decimal":
            return "number";
        case "boolean":
            return "checkbox";
        case "single-choice":
            return "select";
        case "date":
            return "date";
        case "phone-number":
            return "tel";
        case ETH.Mobile:
            return "phone";
        case ETH.Fayda:
            return "fayda";
        case "email":
            return "email";
        case "document-reference":
            return "document";
        case "signature":
            return "signature";
        default:
            return "text";
    }
};
export const widgetForField = (field) => {
    if (field.semanticType === "boolean")
        return "checkbox";
    if (field.constraints?.options !== undefined && field.constraints.options.length > 0)
        return "select";
    return widgetFor(field.semanticType);
};
export const coerceValue = (semanticType, raw) => {
    if (typeof raw === "boolean")
        return raw;
    if (raw === "")
        return undefined;
    if (semanticType === "integer") {
        const n = Number(raw.replace(/[,\s]/g, ""));
        return Number.isInteger(n) ? n : raw;
    }
    if (semanticType === "decimal") {
        const cleaned = raw.replace(/[,\s]/g, "");
        const n = Number(cleaned);
        return cleaned !== "" && !Number.isNaN(n) ? n : raw;
    }
    return raw;
};
const controlId = (fieldId) => `f_${fieldId}`;
export const renderField = (field, ctx) => {
    const widget = widgetForField(field);
    const label = ctx.i18n.t(field.labelKey);
    const id = controlId(field.id);
    const value = ctx.value === undefined || ctx.value === null ? "" : String(ctx.value);
    const invalid = ctx.errorKey !== undefined;
    const emit = (raw) => ctx.onChange(coerceValue(field.semanticType, raw));
    if (ctx.money) {
        const display = ctx.value === undefined || ctx.value === "" ? "" : formatAmount(toNumber(ctx.value));
        return FieldShell({ id, label, required: ctx.required, optionalLabel: ctx.i18n.t("form.optional"), ...(ctx.errorKey ? { errorText: ctx.i18n.validation(ctx.errorKey) } : {}) }, TextInput({
            id, value: display, type: "text", inputmode: "decimal", dir: "ltr", invalid, placeholder: "0.00", extraClass: "money-input",
            onInput: (raw) => { const c = sanitiseMoneyInput(raw); const n = c === "" || c === "." ? undefined : Number(c); ctx.onChange(n !== undefined && Number.isFinite(n) ? n : undefined); },
            ...(ctx.onBlur ? { onBlur: ctx.onBlur } : {}),
        }));
    }
    if (widget === "signature") {
        return FieldShell({ id, label, required: ctx.required, ...(ctx.errorKey ? { errorText: ctx.i18n.validation(ctx.errorKey) } : {}) }, signaturePad({ id, value: ctx.value, i18n: ctx.i18n, answers: ctx.answers ?? {}, onChange: ctx.onChange, justCleared: ctx.justCleared === true }));
    }
    if (widget === "checkbox") {
        return FieldShell({ id, label: "", required: ctx.required, ...(ctx.errorKey ? { errorText: ctx.i18n.validation(ctx.errorKey) } : {}) }, CheckboxRow({ id, checked: ctx.value === true, onChange: (b) => emit(b), label }));
    }
    const amText = ctx.i18n.locale === "am";
    const control = (() => {
        switch (widget) {
            case "textarea":
                return TextArea({ id, value, onInput: (v) => emit(v), ...(amText ? { lang: "am" } : {}) });
            case "select": {
                const options = (field.constraints?.options ?? []).map((opt) => ({
                    value: String(opt),
                    label: ctx.i18n.option(field.id, String(opt)),
                }));
                return Select({ id, value, options, placeholderLabel: ctx.i18n.t("field.choose"), invalid, onChange: (v) => emit(v) });
            }
            case "document":
                return DocumentUploadPlaceholder({ id, value, hint: ctx.i18n.t("doc.placeholder"), onInput: (v) => emit(v) });
            case "date":
                return amText
                    ? ethiopianDateControl({ id, value, invalid, locale: "am", onChange: (v) => ctx.onChange(v) })
                    : gregorianDateControl({ id, value, invalid, onChange: (v) => ctx.onChange(v) });
            case "phone":
                return phoneControl({ id, value, invalid, onChange: (v) => ctx.onChange(v), ...(ctx.readOnly ? { readOnly: true } : {}) });
            case "fayda":
                return faydaControl({ id, value, invalid, onChange: (v) => ctx.onChange(v) });
            default: {
                const type = widget === "number" ? "number" : widget === "tel" ? "tel" : widget === "email" ? "email" : "text";
                const amHere = amText && type === "text";
                return TextInput({ id, value, type, invalid, onInput: (v) => emit(v), ...(amHere ? { lang: "am" } : {}) });
            }
        }
    })();
    return FieldShell({
        id,
        label,
        required: ctx.required,
        optionalLabel: ctx.i18n.t("form.optional"),
        ...(ctx.errorKey ? { errorText: ctx.i18n.validation(ctx.errorKey) } : {}),
    }, control);
};
