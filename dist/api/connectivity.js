export const checkHealth = async (baseUrl, fetchImpl, now = () => Date.now()) => {
    const started = now();
    const correlationId = safeUuid();
    try {
        const res = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/health`, {
            method: "GET",
            headers: { "x-correlation-id": correlationId },
        });
        return { ok: res.status >= 200 && res.status < 300, status: res.status, latencyMs: now() - started, correlationId };
    }
    catch (e) {
        return { ok: false, status: 0, latencyMs: now() - started, correlationId, error: e instanceof Error ? e.message : String(e) };
    }
};
const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const withRetry = async (fn, opts = {}) => {
    const attempts = opts.attempts ?? 3;
    const base = opts.baseDelayMs ?? 300;
    const max = opts.maxDelayMs ?? 4000;
    const sleep = opts.sleep ?? defaultSleep;
    const retryable = opts.retryable ?? isTransient;
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        }
        catch (e) {
            lastError = e;
            if (i === attempts - 1 || !retryable(e))
                break;
            await sleep(Math.min(max, base * 2 ** i));
        }
    }
    throw lastError;
};
export const isTransient = (error) => {
    const code = error?.code;
    const status = error?.status;
    return code === "network" || code === "service_unavailable" || code === "internal_error" || (typeof status === "number" && status >= 500);
};
const safeUuid = () => typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `hc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
