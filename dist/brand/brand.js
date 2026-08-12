export const LIFT_BRAND = {
    id: "lift",
    name: "LiFT",
    logoMark: "LiFT",
    colors: { primary: "#1f6feb", secondary: "#0b3d91", accent: "#0aa06e" },
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Noto Sans Ethiopic", "Abyssinica SIL", Roboto, sans-serif',
    welcomeTitleKey: "welcome.title",
    welcomeBodyKey: "welcome.body",
};
let active = LIFT_BRAND;
export const currentBrand = () => active;
export const organisationName = () => active.organisationName ?? active.name;
export const applyBrand = (brand = active) => {
    active = brand;
    if (typeof document === "undefined")
        return;
    const root = document.documentElement;
    root.dataset["brand"] = brand.id;
    const set = (k, v) => { if (v)
        root.style.setProperty(k, v); };
    set("--brand-primary", brand.colors.primary);
    set("--brand-secondary", brand.colors.secondary);
    set("--brand-accent", brand.colors.accent);
    set("--brand-font", brand.fontFamily);
    for (const [k, v] of Object.entries(brand.tokens ?? {}))
        root.style.setProperty(k, v);
};
