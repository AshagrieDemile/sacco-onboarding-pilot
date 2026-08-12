export const LOCALES = ["am", "en"];
export const DEFAULT_LOCALE = "am";
const RTL_LOCALES = new Set([]);
const interpolate = (template, params) => params === undefined ? template : template.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
export const createI18n = (locale, bundles) => {
    const active = bundles[locale] ?? {};
    const english = bundles.en ?? {};
    const resolve = (key) => active[key] ?? english[key];
    const t = (key, params) => interpolate(resolve(key) ?? key, params);
    const cascade = (keys, fallback) => {
        for (const k of keys) {
            const hit = resolve(k);
            if (hit !== undefined)
                return hit;
        }
        return fallback;
    };
    return {
        locale,
        t,
        option: (fieldId, value) => cascade([`field.${fieldId}.option.${value}`, `option.${value}`], value),
        validation: (messageKey) => {
            const rule = messageKey.split(".").pop() ?? messageKey;
            return cascade([messageKey, `validation.${rule}`], t("validation.generic"));
        },
        localeName: (l) => t(`language.${l}`),
        dir: () => (RTL_LOCALES.has(locale) ? "rtl" : "ltr"),
    };
};
