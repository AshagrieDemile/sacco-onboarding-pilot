import { h } from "../render/h.js";
import { TextInput, Select, FieldShell } from "./library.js";
import { ETHIOPIA_MOBILE, enforceNational, groupNational, normaliseFayda, formatFaydaDisplay, deriveFullName, groupHeaderKey, } from "../standards/ethiopian.js";
import { addressData, itemName, isAddisSubCity, isValidAddisWoreda, normaliseWoredaInput, canonicalWoreda } from "../data/ethiopia.js";
const strv = (v) => (v === undefined || v === null ? "" : String(v));
const isRequired = (f) => f.required === true;
export const phoneControl = (p) => h("div", { class: "field-phone" }, h("span", { class: "field-adornment", "aria-hidden": "true" }, ETHIOPIA_MOBILE.dialCode), TextInput({
    id: p.id,
    value: groupNational(p.value),
    type: "tel",
    inputmode: "numeric",
    autocomplete: "tel-national",
    placeholder: "9XX XX XX XX",
    maxlength: 12,
    invalid: p.invalid,
    dir: "ltr",
    groupedCaret: true,
    ...(p.readOnly ? { readonly: true } : {}),
    onInput: (raw) => p.onChange(enforceNational(raw) || undefined),
}));
export const faydaControl = (p) => TextInput({
    id: p.id,
    value: formatFaydaDisplay(p.value),
    type: "text",
    inputmode: "numeric",
    placeholder: "XXXX XXXX XXXX XXXX",
    maxlength: 19,
    invalid: p.invalid,
    extraClass: "field-fayda",
    dir: "ltr",
    groupedCaret: true,
    onInput: (raw) => p.onChange(normaliseFayda(raw) || undefined),
});
const shellFor = (p, field, control) => FieldShell({
    id: `f_${field.id}`,
    label: p.i18n.t(field.labelKey),
    required: isRequired(field),
    optionalLabel: p.i18n.t("form.optional"),
    ...(p.errorFor.has(field.id) ? { errorText: p.i18n.validation(p.errorFor.get(field.id)) } : {}),
}, control);
export const personNameGroup = (p) => {
    const inputs = p.fields.map((field, i) => shellFor(p, field, TextInput({
        id: `f_${field.id}`,
        value: strv(p.draft[field.id]),
        autocomplete: field.id === "name_first" ? "given-name" : field.id === "name_father" ? "additional-name" : "off",
        ...(i === 0 ? { autofocus: true } : {}),
        ...(p.i18n.locale === "am" ? { lang: "am" } : {}),
        onInput: (raw) => p.onChange(field.id, raw === "" ? undefined : raw),
    })));
    const full = deriveFullName(p.draft);
    return h("fieldset", { class: "composite composite-name" }, h("legend", { class: "composite-legend" }, p.i18n.t(groupHeaderKey("name"))), ...inputs, full !== ""
        ? h("p", { class: "composite-derived", "aria-live": "polite" }, h("span", { class: "composite-derived-label" }, p.i18n.t("std.name.full")), h("span", { class: "composite-derived-value" }, full))
        : "");
};
export const addressSelector = (p) => {
    const byId = new Map(p.fields.map((f) => [f.id, f]));
    const v = (id) => strv(p.draft[id]);
    const opts = (items) => items.map((it) => ({ value: it.code, label: itemName(it, p.i18n.locale) }));
    const level = (id, options, onPick) => {
        const field = byId.get(id);
        if (field === undefined)
            return "";
        const control = options.length > 0
            ? Select({
                id: `f_${id}`,
                value: v(id),
                options,
                placeholderLabel: p.i18n.t("field.choose"),
                invalid: p.errorFor.has(id),
                onChange: (val) => onPick(val === "" ? undefined : val),
            })
            : TextInput({
                id: `f_${id}`,
                value: v(id),
                invalid: p.errorFor.has(id),
                ...(p.i18n.locale === "am" ? { lang: "am" } : {}),
                onInput: (raw) => onPick(raw === "" ? undefined : raw),
            });
        return shellFor(p, field, control);
    };
    const region = v("addr_region");
    const zone = v("addr_zone");
    const woreda = v("addr_woreda");
    const woredaLevel = () => {
        const field = byId.get("addr_woreda");
        if (field === undefined)
            return "";
        if (!isAddisSubCity(zone)) {
            return level("addr_woreda", opts(addressData.woredas(zone || undefined)), (val) => {
                p.onChange("addr_city", undefined);
                p.onChange("addr_woreda", val, true);
            });
        }
        const val = v("addr_woreda");
        const localInvalid = val !== "" && !isValidAddisWoreda(zone, val);
        const serverInvalid = p.errorFor.has("addr_woreda");
        const control = TextInput({
            id: "f_addr_woreda",
            value: val,
            type: "text",
            inputmode: "numeric",
            dir: "ltr",
            placeholder: "01",
            maxlength: 2,
            invalid: localInvalid || serverInvalid,
            onInput: (raw) => {
                const nn = normaliseWoredaInput(raw);
                p.onChange("addr_city", undefined);
                p.onChange("addr_woreda", nn === "" ? undefined : nn, true);
            },
            onBlur: () => { const c = canonicalWoreda(val); if (c !== val)
                p.onChange("addr_woreda", c === "" ? undefined : c, true); },
        });
        return FieldShell({
            id: "f_addr_woreda",
            label: p.i18n.t(field.labelKey),
            required: isRequired(field),
            hint: p.i18n.t("addr.woreda.hint"),
            ...(localInvalid
                ? { errorText: p.i18n.t("addr.woreda.invalid") }
                : serverInvalid
                    ? { errorText: p.i18n.validation(p.errorFor.get("addr_woreda")) }
                    : {}),
        }, control);
    };
    const children = [
        h("legend", { class: "composite-legend" }, p.i18n.t(groupHeaderKey("address"))),
        level("addr_region", opts(addressData.regions()), (val) => {
            p.onChange("addr_woreda", undefined);
            p.onChange("addr_city", undefined);
            p.onChange("addr_zone", undefined);
            p.onChange("addr_region", val, true);
        }),
        level("addr_zone", opts(addressData.zones(region || undefined)), (val) => {
            p.onChange("addr_city", undefined);
            p.onChange("addr_woreda", undefined);
            p.onChange("addr_zone", val, true);
        }),
        woredaLevel(),
        level("addr_city", opts(addressData.cities(woreda || undefined)), (val) => p.onChange("addr_city", val, true)),
        level("addr_kebele", [], (val) => p.onChange("addr_kebele", val)),
        level("addr_house", [], (val) => p.onChange("addr_house", val)),
    ];
    return h("fieldset", { class: "composite composite-address" }, ...children.filter((c) => c !== ""));
};
