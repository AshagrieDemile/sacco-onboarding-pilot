const ETHIOPIC_EPOCH = 1723856;
const gregorianToJdn = (y, m, d) => {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
};
const jdnToGregorian = (jdn) => {
    const a = jdn + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d2 = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d2) / 4);
    const m2 = Math.floor((5 * e + 2) / 153);
    const day = e - Math.floor((153 * m2 + 2) / 5) + 1;
    const month = m2 + 3 - 12 * Math.floor(m2 / 10);
    const year = 100 * b + d2 - 4800 + Math.floor(m2 / 10);
    return { year, month, day };
};
const ethiopicToJdn = (y, m, d) => (ETHIOPIC_EPOCH - 1) + 365 * y + Math.floor(y / 4) + 30 * (m - 1) + d;
const jdnToEthiopic = (jdn) => {
    const r = ((jdn - ETHIOPIC_EPOCH) % 1461 + 1461) % 1461;
    const n = (r % 365) + 365 * Math.floor(r / 1460);
    const year = 4 * Math.floor((jdn - ETHIOPIC_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
    const month = Math.floor(n / 30) + 1;
    const day = (n % 30) + 1;
    return { year, month, day };
};
export const isEthiopianLeap = (year) => year % 4 === 3;
export const ethiopianMonthLength = (year, month) => (month === 13 ? (isEthiopianLeap(year) ? 6 : 5) : 30);
export const ethiopianToIso = (e) => {
    const g = jdnToGregorian(ethiopicToJdn(e.year, e.month, e.day));
    return `${String(g.year).padStart(4, "0")}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}`;
};
export const isoToEthiopian = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!m)
        return undefined;
    return jdnToEthiopic(gregorianToJdn(Number(m[1]), Number(m[2]), Number(m[3])));
};
export const ETHIOPIAN_MONTHS_AM = [
    "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ",
];
export const ETHIOPIAN_MONTHS_EN = [
    "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit", "Miyazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume",
];
export const formatEthiopian = (e, locale = "am") => {
    const months = locale === "am" ? ETHIOPIAN_MONTHS_AM : ETHIOPIAN_MONTHS_EN;
    return `${String(e.day).padStart(2, "0")} ${months[e.month - 1] ?? e.month} ${e.year}`;
};
