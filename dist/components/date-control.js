import { h } from "../render/h.js";
import { Select, TextInput } from "./library.js";
import { isoToEthiopian, ethiopianToIso, ethiopianMonthLength, ETHIOPIAN_MONTHS_AM, ETHIOPIAN_MONTHS_EN } from "../standards/ethiopian-calendar.js";
export const gregorianDateControl = (p) => TextInput({ id: p.id, value: p.value, type: "date", invalid: p.invalid, onInput: (v) => p.onChange(v || undefined) });
const partials = new Map();
export const resetDatePartials = () => partials.clear();
export const ethiopianDateControl = (p) => {
    const eth = p.value ? isoToEthiopian(p.value) : undefined;
    const stored = partials.get(p.id) ?? { y: "", mo: "", d: "" };
    const y = eth ? String(eth.year) : stored.y;
    const mo = eth ? String(eth.month) : stored.mo;
    const d = eth ? String(eth.day) : stored.d;
    partials.set(p.id, { y, mo, d });
    const months = p.locale === "am" ? ETHIOPIAN_MONTHS_AM : ETHIOPIAN_MONTHS_EN;
    const setPart = (patch) => {
        const cur = partials.get(p.id) ?? { y: "", mo: "", d: "" };
        const nxt = { ...cur, ...patch };
        partials.set(p.id, nxt);
        if (nxt.y !== "" && nxt.mo !== "" && nxt.d !== "")
            p.onChange(ethiopianToIso({ year: Number(nxt.y), month: Number(nxt.mo), day: Number(nxt.d) }));
        else
            p.onChange(undefined);
    };
    const monthOptions = months.map((name, i) => ({ value: String(i + 1), label: name }));
    const dayCount = ethiopianMonthLength(Number(y) || 2016, Number(mo) || 1);
    const dayOptions = Array.from({ length: dayCount }, (_, i) => ({ value: String(i + 1), label: String(i + 1).padStart(2, "0") }));
    return h("div", { class: "eth-date", role: "group", "aria-label": p.id }, Select({ id: `${p.id}_d`, value: d, options: dayOptions, placeholderLabel: "ቀን", invalid: p.invalid, onChange: (v) => setPart({ d: v }) }), Select({ id: `${p.id}_m`, value: mo, options: monthOptions, placeholderLabel: "ወር", invalid: p.invalid, onChange: (v) => setPart({ mo: v }) }), TextInput({ id: `${p.id}_y`, value: y, type: "number", inputmode: "numeric", placeholder: "ዓመት", invalid: p.invalid, onInput: (v) => setPart({ y: v.replace(/\D+/g, "") }) }));
};
