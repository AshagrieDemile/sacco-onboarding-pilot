import { toApiError, networkError, } from "./errors.js";
import { withRetry } from "./connectivity.js";
const defaultId = () => typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const defaultFetch = (url, init) => fetch(url, init).then((r) => ({ status: r.status, text: () => r.text() }));
export const createApiClient = (opts) => {
    const fetchImpl = opts.fetchImpl ?? defaultFetch;
    const newId = opts.newId ?? defaultId;
    const base = opts.baseUrl.replace(/\/$/, "");
    const now = opts.now ?? (() => Date.now());
    const call = async (method, path, body, idempotent = false, stableKey) => {
        const correlationId = newId();
        const idempotencyKey = idempotent ? (stableKey ?? newId()) : undefined;
        const headers = {
            "content-type": "application/json",
            "x-organisation-id": opts.organisationId,
            "x-actor-ref": opts.actorRef,
            "x-correlation-id": correlationId,
            ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
        };
        const run = async () => {
            const started = now();
            let res;
            try {
                res = await fetchImpl(`${base}${path}`, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
            }
            catch (cause) {
                opts.log?.({ ts: new Date().toISOString(), method, path, status: 0, ok: false, durationMs: now() - started, correlationId, errorCode: "network" });
                throw networkError(cause);
            }
            const raw = await res.text();
            const parsed = raw.length > 0 ? safeJson(raw) : undefined;
            const durationMs = now() - started;
            if (res.status >= 200 && res.status < 300) {
                opts.log?.({ ts: new Date().toISOString(), method, path, status: res.status, ok: true, durationMs, correlationId });
                return parsed;
            }
            const apiErr = toApiError(res.status, parsed, correlationId);
            opts.log?.({ ts: new Date().toISOString(), method, path, status: res.status, ok: false, durationMs, correlationId, errorCode: apiErr.code });
            throw apiErr;
        };
        const retryOpts = { attempts: opts.retryAttempts ?? 3, ...(opts.retrySleep ? { sleep: opts.retrySleep } : {}) };
        return withRetry(run, retryOpts);
    };
    return {
        start: (templateId, templateVersion, locale, channel, idempotencyKey) => call("POST", "/journeys", { templateId, templateVersion, locale, ...(channel ? { channel } : {}) }, true, idempotencyKey),
        resume: (instanceId) => call("GET", `/journeys/${encodeURIComponent(instanceId)}`),
        submit: (instanceId, stageId, data, expectedRevision, idempotencyKey) => call("POST", `/journeys/${encodeURIComponent(instanceId)}/submissions`, { stageId, data, expectedRevision }, true, idempotencyKey),
        events: (instanceId) => call("GET", `/journeys/${encodeURIComponent(instanceId)}/events`).then((r) => r.events ?? []),
        withdraw: (instanceId, idempotencyKey) => call("POST", `/journeys/${encodeURIComponent(instanceId)}/withdrawal`, {}, true, idempotencyKey).then(() => undefined),
    };
};
const safeJson = (raw) => {
    try {
        return JSON.parse(raw);
    }
    catch {
        return undefined;
    }
};
