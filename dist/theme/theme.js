const FALLBACK_LIGHT = {
    bg_color: "#ffffff",
    text_color: "#1a1a1a",
    hint_color: "#7d8b99",
    link_color: "#2678b6",
    button_color: "#2678b6",
    button_text_color: "#ffffff",
    secondary_bg_color: "#f1f4f7",
};
const FALLBACK_DARK = {
    bg_color: "#17212b",
    text_color: "#f5f5f5",
    hint_color: "#8895a3",
    link_color: "#6ab3f3",
    button_color: "#5288c1",
    button_text_color: "#ffffff",
    secondary_bg_color: "#232e3c",
};
const VAR = {
    bg_color: "--tg-bg",
    text_color: "--tg-text",
    hint_color: "--tg-hint",
    link_color: "--tg-link",
    button_color: "--tg-button",
    button_text_color: "--tg-button-text",
    secondary_bg_color: "--tg-secondary-bg",
};
export const themeVariables = (params, scheme) => {
    const base = scheme === "dark" ? FALLBACK_DARK : FALLBACK_LIGHT;
    const merged = { ...base, ...(params ?? {}) };
    const out = {};
    for (const [k, cssVar] of Object.entries(VAR)) {
        const value = merged[k];
        if (typeof value === "string" && value.length > 0)
            out[cssVar] = value;
    }
    return out;
};
export const applyTheme = (params, scheme) => {
    const root = document.documentElement;
    root.dataset["scheme"] = scheme;
    for (const [cssVar, value] of Object.entries(themeVariables(params, scheme))) {
        root.style.setProperty(cssVar, value);
    }
};
