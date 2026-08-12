export const round2 = (n) => (Number.isFinite(n) ? Math.round((n + Number.EPSILON) * 100) / 100 : 0);
export const formatAmount = (n) => {
    if (!Number.isFinite(n))
        return "0.00";
    const neg = n < 0;
    const [int, frac] = Math.abs(n).toFixed(2).split(".");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${neg ? "-" : ""}${grouped}.${frac}`;
};
export const formatMoney = (n, i18n) => `${i18n.t("money.birr")} ${formatAmount(n)}`;
export const parseAmount = (raw) => {
    const cleaned = raw.replace(/[,\s]/g, "");
    if (cleaned === "" || !/^-?\d*(\.\d+)?$/.test(cleaned))
        return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
};
export const sanitiseMoneyInput = (raw) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot === -1)
        return cleaned;
    const intPart = cleaned.slice(0, firstDot);
    const fracPart = cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
    return `${intPart}.${fracPart}`;
};
export const toNumber = (v) => {
    if (typeof v === "number")
        return Number.isFinite(v) ? v : 0;
    if (typeof v === "string") {
        const n = parseAmount(v);
        return n ?? 0;
    }
    return 0;
};
