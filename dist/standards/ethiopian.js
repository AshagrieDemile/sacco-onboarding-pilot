export const ETH = {
    Mobile: "ethiopian-mobile-number",
    Fayda: "fayda-national-id",
    GivenName: "given-name",
    Patronymic: "patronymic-name",
    GrandPatronymic: "grandpatronymic-name",
    Region: "eth-region",
    Zone: "eth-zone",
    Woreda: "eth-woreda",
    City: "eth-city",
    Kebele: "eth-kebele",
    House: "eth-house",
};
export const ETHIOPIA_MOBILE = { dialCode: "+251", nationalLength: 9, trunkPrefix: "0" };
export const normaliseMobile = (raw, profile = ETHIOPIA_MOBILE) => {
    let digits = raw.replace(/\D+/g, "");
    const cc = profile.dialCode.replace(/\D+/g, "");
    if (digits.startsWith(cc) && digits.length >= cc.length + profile.nationalLength - 1)
        digits = digits.slice(cc.length);
    else if (profile.trunkPrefix && digits.startsWith(profile.trunkPrefix) && digits.length > profile.nationalLength)
        digits = digits.slice(profile.trunkPrefix.length);
    return digits.slice(0, profile.nationalLength);
};
export const formatMobileDisplay = (national, profile = ETHIOPIA_MOBILE) => {
    if (national === "")
        return "";
    const g = national.replace(/\D+/g, "");
    const parts = [g.slice(0, 2), g.slice(2, 5), g.slice(5, 9)].filter((p) => p.length > 0);
    return `${profile.dialCode} ${parts.join(" ")}`.trim();
};
export const enforceNational = (raw, profile = ETHIOPIA_MOBILE) => {
    let d = raw.replace(/\D+/g, "");
    const cc = profile.dialCode.replace(/\D+/g, "");
    if (d.startsWith(cc))
        d = d.slice(cc.length);
    else if (profile.trunkPrefix && d.startsWith(profile.trunkPrefix) && d.length > profile.nationalLength)
        d = d.slice(profile.trunkPrefix.length);
    while (d.length > 0 && d[0] !== "9" && d[0] !== "7")
        d = d.slice(1);
    return d.slice(0, profile.nationalLength);
};
export const groupNational = (national) => {
    const g = national.replace(/\D+/g, "").slice(0, 9);
    return [g.slice(0, 3), g.slice(3, 5), g.slice(5, 7), g.slice(7, 9)].filter((p) => p.length > 0).join(" ");
};
export const isValidNationalMobile = (national) => /^(9|7)[0-9]{8}$/.test(national);
export const normaliseFayda = (raw) => raw.replace(/\D+/g, "").slice(0, 16);
export const formatFaydaDisplay = (digits) => digits.replace(/\D+/g, "").replace(/(.{4})/g, "$1 ").trim();
export const NAME_PREFIX = "name_";
export const ADDR_PREFIX = "addr_";
export const deriveFullName = (draft) => {
    const val = (id) => {
        const v = draft[id];
        return typeof v === "string" ? v.trim() : "";
    };
    const preferred = val("name_preferred");
    if (preferred !== "")
        return preferred;
    return [val("name_first"), val("name_father"), val("name_grandfather"), val("name_fourth")]
        .filter((p) => p !== "")
        .join(" ");
};
export const groupOf = (fieldId) => {
    if (fieldId.startsWith(NAME_PREFIX))
        return "name";
    if (fieldId.startsWith(ADDR_PREFIX))
        return "address";
    return undefined;
};
export const groupHeaderKey = (group) => group === "name" ? "std.group.name" : "std.group.address";
