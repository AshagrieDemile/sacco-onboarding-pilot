import { deriveFullName, formatMobileDisplay } from "../standards/ethiopian.js";
import { saccoName, saccoShareValue } from "../brand/organisation.js";
import { formatWoreda, lookupAdminName } from "../data/ethiopia.js";
import { round2 } from "../presentation/money.js";
const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) || 0 : 0);
const str = (v) => (typeof v === "string" ? v : v === undefined || v === null ? "" : String(v));
export const maskFayda = (fin) => {
    const d = fin.replace(/\D+/g, "");
    return d.length <= 4 ? d : `${"•".repeat(d.length - 4)}${d.slice(-4)}`.replace(/(.{4})/g, "$1 ").trim();
};
export const toSummary = (r, locale = "en") => {
    const d = r.data;
    const shares = num(d["sharesRequested"]);
    const shareValue = round2(num(d["shareValue"]) > 0 ? num(d["shareValue"]) : saccoShareValue());
    const total = round2(shares * shareValue);
    const initial = round2(num(d["initialContribution"]));
    return {
        reference: r.reference,
        memberName: deriveFullName(d) || "—",
        mobile: d["mobile"] ? formatMobileDisplay(str(d["mobile"])) : "—",
        faydaMasked: d["fayda"] ? maskFayda(str(d["fayda"])) : "—",
        journeyType: r.templateId,
        sacco: saccoName(locale),
        status: r.lifecycle,
        currentStage: r.currentStageId,
        startedDate: r.startedAt,
        lastUpdated: r.updatedAt,
        completionDate: r.lifecycle === "submitted" || r.lifecycle === "completed" ? r.updatedAt : "",
        subCity: d["addr_zone"] ? lookupAdminName(str(d["addr_zone"]), locale) : "—",
        woreda: d["addr_woreda"] ? formatWoreda(str(d["addr_woreda"]), locale) : "—",
        sharesRequested: shares,
        shareValue,
        totalShareSubscription: total,
        initialContribution: initial,
        remainingShareSubscription: round2(total - initial),
    };
};
export const computeMetrics = (records, today = new Date().toISOString().slice(0, 10)) => {
    const summaries = records.map((r) => toSummary(r));
    const count = (lc) => records.filter((r) => r.lifecycle === lc).length;
    const submitted = count("submitted");
    const total = records.length;
    return {
        totalStarted: total,
        draft: count("draft") + count("started"),
        submitted,
        completed: count("completed") + submitted,
        completionRate: total === 0 ? 0 : Math.round((submitted / total) * 100),
        todayRegistrations: records.filter((r) => r.startedAt.slice(0, 10) === today).length,
        totalShareSubscription: summaries.reduce((s, x) => s + x.totalShareSubscription, 0),
        totalInitialContribution: summaries.reduce((s, x) => s + x.initialContribution, 0),
        totalRemainingSubscription: summaries.reduce((s, x) => s + x.remainingShareSubscription, 0),
    };
};
export const followUpQueue = (records, days = 3, now = Date.now()) => {
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return records.filter((r) => (r.lifecycle === "draft" || r.lifecycle === "started") && Date.parse(r.updatedAt) < cutoff);
};
export const checksum = (s) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++)
        h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(16).padStart(8, "0");
};
const csvCell = (v) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const UTF8_BOM = "﻿";
export const withUtf8Bom = (csv) => `${UTF8_BOM}${csv}`;
export const toCsv = (summaries, operator, filtersUsed, exportTime = new Date().toISOString()) => {
    const cols = [
        "reference", "member_name", "phone_number", "fayda_masked", "sacco", "membership_type",
        "sub_city", "woreda",
        "shares_requested", "share_value", "total_share_subscription", "initial_contribution", "remaining_share_subscription",
        "registration_status", "started_at", "last_updated", "completion_date",
    ];
    const rows = summaries.map((s) => [
        s.reference, s.memberName, s.mobile, s.faydaMasked, s.sacco, s.journeyType,
        s.subCity, s.woreda,
        s.sharesRequested, s.shareValue, s.totalShareSubscription, s.initialContribution, s.remainingShareSubscription,
        s.status, s.startedDate, s.lastUpdated, s.completionDate,
    ]);
    const body = [cols, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const sum = checksum(body);
    const header = [
        `# Export Time,${exportTime}`,
        `# Operator,${operator}`,
        `# Filters,${filtersUsed || "(none)"}`,
        `# Record Count,${summaries.length}`,
        `# Checksum,${sum}`,
    ].join("\n");
    return { csv: `${header}\n${body}\n`, meta: { exportTime, operator, filtersUsed, recordCount: summaries.length, checksum: sum } };
};
