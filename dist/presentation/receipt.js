import { computeSubscription } from "./share-subscription.js";
import { formatMoney, toNumber } from "./money.js";
import { deriveFullName } from "../standards/ethiopian.js";
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const humanReference = (instanceId) => instanceId.replace(/^ji-/, "").toUpperCase().slice(0, 12);
export const buildReceiptHtml = (i18n, d) => {
    const t = i18n.t.bind(i18n);
    const a = d.answers;
    const sub = computeSubscription(a);
    const name = deriveFullName(a) || "—";
    const when = (() => { const dt = new Date(d.submittedAt); return Number.isNaN(dt.getTime()) ? d.submittedAt : dt.toLocaleString(i18n.locale === "am" ? "am-ET" : "en-GB"); })();
    const money = (n) => formatMoney(n, i18n);
    const row = (label, value) => `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`;
    const freq = String(a["contributionFrequency"] ?? "");
    const method = String(a["contributionPaymentMethod"] ?? "");
    const photoImg = d.photo && d.photo.startsWith("data:image/") ? `<img class="photo" src="${d.photo}" alt="${esc(t("photo.aria"))}"/>` : "";
    return `<!doctype html><html lang="${i18n.locale}"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(t("receipt.docTitle"))}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, Segoe UI, Roboto, "Noto Sans Ethiopic", sans-serif; color: #111; background: #fff; margin: 0; padding: 24px; }
  .doc { max-width: 720px; margin: 0 auto; border: 1px solid #ccc; border-radius: 8px; padding: 24px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid #0b3a66; padding-bottom: 12px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #0b3a66; }
  .status { display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 4px; background: #e6f4ea; color: #1b7a43; font-weight: 600; font-size: 14px; }
  .photo { width: 96px; height: 96px; object-fit: cover; border-radius: 8px; border: 1px solid #ccc; }
  h2 { font-size: 15px; margin: 20px 0 6px; color: #0b3a66; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: top; }
  th { width: 55%; font-weight: 500; color: #333; }
  td { text-align: right; }
  .caveat { margin-top: 20px; padding: 10px 12px; background: #fff7e6; border: 1px solid #f0d9a8; border-radius: 6px; font-size: 13px; color: #5a4a1a; }
  @media print { body { padding: 0; } .doc { border: none; } }
</style></head><body><div class="doc">
<header><div><h1>${esc(t("receipt.docTitle"))}</h1>
<div>${esc(t("receipt.reference"))}: <strong>${esc(d.reference)}</strong></div>
<div>${esc(t("receipt.submittedAt"))}: ${esc(when)}</div>
<div class="status">${esc(t("receipt.status"))}</div></div>${photoImg}</header>
<h2>${esc(t("receipt.section.application"))}</h2>
<table>${row(t("receipt.applicant"), name)}${row(t("sacco.field.occupation"), a["occupation"] ? i18n.option("occupation", String(a["occupation"])) : "—")}${row(t("sacco.field.educationLevel"), a["educationLevel"] ? i18n.option("educationLevel", String(a["educationLevel"])) : "—")}</table>
<h2>${esc(t("receipt.section.shares"))}</h2>
<table>${row(t("receipt.totalSubscription"), money(sub.total))}${row(t("receipt.purchaseNow"), money(sub.initial))}${row(t("receipt.remaining"), money(Math.max(0, sub.remaining)))}</table>
<h2>${esc(t("receipt.section.contribution"))}</h2>
<table>${row(t("receipt.regularAmount"), money(toNumber(a["plannedRegularContribution"])))}${row(t("receipt.frequency"), freq ? i18n.option("contributionFrequency", freq) : "—")}${row(t("receipt.method"), method ? i18n.option("contributionPaymentMethod", method) : "—")}</table>
<div class="caveat">${esc(t("receipt.caveat"))}</div>
</div></body></html>`;
};
export const downloadReceipt = (i18n, d) => {
    try {
        const html = buildReceiptHtml(i18n, d);
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `registration-confirmation-${d.reference || "receipt"}.html`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    catch { }
};
