export const CATALOG = [
    { templateId: "sacco.member-onboarding", templateVersion: "1.1.0", nameKey: "sacco.journey.name" },
];
export const resolveApiBaseUrl = () => {
    try {
        const q = new URLSearchParams(typeof location !== "undefined" ? location.search : "").get("api");
        if (q && q.length > 0)
            return q.replace(/\/$/, "");
    }
    catch { }
    const rc = globalThis.__LIFT_CONFIG__;
    if (rc?.apiBaseUrl && rc.apiBaseUrl.length > 0)
        return rc.apiBaseUrl.replace(/\/$/, "");
    return "/v1";
};
export const devTestOtpAllowed = () => {
    const rc = globalThis.__LIFT_CONFIG__;
    if (rc?.devTestOtp === true)
        return true;
    if (rc?.devTestOtp === false)
        return false;
    try {
        const host = typeof location !== "undefined" ? location.hostname : "";
        return host === "localhost" || host === "127.0.0.1" || host === "";
    }
    catch {
        return false;
    }
};
export const resolveOrganisationId = () => {
    const rc = globalThis.__LIFT_CONFIG__;
    return rc?.organisationId && rc.organisationId.length > 0 ? rc.organisationId : "org-demo";
};
export const DEFAULT_CONFIG = {
    apiBaseUrl: resolveApiBaseUrl(),
    defaultOrganisationId: resolveOrganisationId(),
    catalog: CATALOG,
};
export const catalogEntry = (templateId) => CATALOG.find((e) => e.templateId === templateId);
export const parseStartParam = (raw) => {
    if (!raw)
        return {};
    const decoded = raw.replace(/__/g, ":").replace(/--/g, "|");
    const out = {};
    for (const part of decoded.split("|")) {
        if (part.startsWith("org:"))
            out.organisationId = part.slice(4);
        else if (catalogEntry(part))
            out.templateId = part;
    }
    return out;
};
