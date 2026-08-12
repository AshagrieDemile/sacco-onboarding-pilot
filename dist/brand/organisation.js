export const PLACEHOLDER_ORGANISATION = {
    id: "placeholder-sacco",
    saccoNameAm: "{{SACCO_NAME_AM}}",
    saccoNameEn: "{{SACCO_NAME_EN}}",
    shortName: "SACCO",
};
export const DEMO_ORGANISATION = {
    id: "demo-sacco",
    saccoNameAm: "አዲስ ብድርና ቁጠባ",
    saccoNameEn: "Addis Credit & Savings",
    shortName: "Addis SACCO",
    theme: { primary: "#1f6feb", accent: "#0aa06e" },
    contacts: { phone: "+251 11 000 0000", email: "info@example.coop", address: "Addis Ababa, Ethiopia" },
    shareValue: 1000.0,
    currency: "ETB",
    organisationTypeEn: "Savings and Credit Cooperative",
    organisationTypeAm: "ኅብረት ሥራ ማህበር",
};
export const resolveOrganisation = () => {
    const rc = globalThis.__LIFT_CONFIG__;
    const override = rc?.organisation;
    if (!override)
        return DEMO_ORGANISATION;
    return { ...DEMO_ORGANISATION, ...override };
};
let active = resolveOrganisation();
export const currentOrganisation = () => active;
export const setOrganisation = (org) => { active = org; };
export const saccoName = (locale, org = active) => locale === "am" ? org.saccoNameAm : org.saccoNameEn;
const TYPE_DEFAULT_EN = "Savings and Credit Cooperative";
const TYPE_DEFAULT_AM = "ኅብረት ሥራ ማህበር";
export const organisationType = (locale, org = active) => locale === "am" ? org.organisationTypeAm ?? TYPE_DEFAULT_AM : org.organisationTypeEn ?? TYPE_DEFAULT_EN;
const cleanToken = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const CONNECTORS = new Set(["and", "&"]);
export const composeOrgDisplay = (locale, org = active) => {
    const name = saccoName(locale, org);
    const type = organisationType(locale, org);
    const nameTokens = new Set(name.split(/\s+/).map(cleanToken).filter((t) => t.length > 0));
    const words = type.split(/\s+/).filter((w) => w.length > 0);
    const isDup = (w) => nameTokens.has(cleanToken(w));
    const isConn = (w) => CONNECTORS.has(cleanToken(w));
    const out = [];
    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (isDup(w))
            continue;
        if (isConn(w)) {
            const prevKept = out.length > 0;
            let nextContent = false;
            for (let j = i + 1; j < words.length; j++) {
                const nw = words[j];
                if (!isConn(nw)) {
                    nextContent = !isDup(nw);
                    break;
                }
            }
            if (prevKept && nextContent)
                out.push(w);
            continue;
        }
        out.push(w);
    }
    return `${name}${out.length > 0 ? " " + out.join(" ") : ""}`.trim();
};
export const saccoShareValue = (org = active) => typeof org.shareValue === "number" && org.shareValue > 0 ? org.shareValue : 1000.0;
export const saccoCurrency = (org = active) => org.currency ?? "ETB";
export const applyOrganisationTheme = (org = active) => {
    if (typeof document === "undefined")
        return;
    const root = document.documentElement;
    root.dataset["org"] = org.id;
    const set = (k, v) => { if (v)
        root.style.setProperty(k, v); };
    set("--brand-primary", org.theme?.primary);
    set("--brand-secondary", org.theme?.secondary);
    set("--brand-accent", org.theme?.accent);
};
