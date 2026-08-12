const defaultFetch = (url, init) => fetch(url, init).then((r) => ({ status: r.status, text: () => r.text() }));
export const createVerificationClient = (opts) => {
    const base = opts.baseUrl.replace(/\/$/, "");
    const fetchImpl = opts.fetchImpl ?? defaultFetch;
    const newId = opts.newId ?? (() => (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`));
    const post = async (path, body) => {
        const correlationId = newId();
        const started = Date.now();
        let res;
        try {
            res = await fetchImpl(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-correlation-id": correlationId }, body: JSON.stringify(body) });
        }
        catch {
            opts.log?.({ ts: new Date().toISOString(), method: "POST", path, status: 0, ok: false, durationMs: Date.now() - started, correlationId, errorCode: "network" });
            throw new Error("network");
        }
        const raw = await res.text();
        let json = {};
        try {
            json = raw ? JSON.parse(raw) : {};
        }
        catch { }
        opts.log?.({ ts: new Date().toISOString(), method: "POST", path, status: res.status, ok: res.status < 300, durationMs: Date.now() - started, correlationId });
        return { status: res.status, json };
    };
    const codeOf = (json) => {
        const err = json["error"];
        return (err?.code ?? "").replace(/^otp_/, "");
    };
    const detailsOf = (json) => {
        const err = json["error"];
        return err?.details ?? {};
    };
    return {
        requestOtp: async (phone) => {
            try {
                const { status, json } = await post("/verification/otp", { phone });
                if (status === 200)
                    return { ok: true, verificationId: String(json["verificationId"]), expiresInSec: Number(json["expiresInSec"]), resendCooldownSec: Number(json["resendCooldownSec"]) };
                const reason = (codeOf(json) || "error");
                const retry = Number(detailsOf(json)["retryAfterSec"]);
                return { ok: false, reason, ...(Number.isFinite(retry) ? { retryAfterSec: retry } : {}) };
            }
            catch {
                return { ok: false, reason: "network" };
            }
        },
        verifyOtp: async (verificationId, code) => {
            try {
                const { status, json } = await post("/verification/otp/verify", { verificationId, code });
                if (status === 200 && json["verified"] === true)
                    return { ok: true, verificationToken: String(json["verificationToken"]), phone: String(json["phone"]) };
                const reason = (codeOf(json) || "error");
                const remaining = Number(detailsOf(json)["remainingAttempts"]);
                return { ok: false, reason, ...(Number.isFinite(remaining) ? { remainingAttempts: remaining } : {}) };
            }
            catch {
                return { ok: false, reason: "network" };
            }
        },
        peekTestOtp: async (phone) => {
            const national = (phone ?? "").replace(/\D+/g, "");
            try {
                const res = await fetchImpl(`${base}/verification/_test/peek?phone=${encodeURIComponent(national)}`, { method: "GET", headers: {} });
                if (res.status !== 200)
                    return null;
                const raw = await res.text();
                const json = raw ? JSON.parse(raw) : {};
                const code = json["code"];
                return typeof code === "string" && code.length > 0 ? code : null;
            }
            catch {
                return null;
            }
        },
    };
};
