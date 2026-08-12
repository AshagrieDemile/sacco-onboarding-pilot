export const DRAFT_SCHEMA_VERSION = 1;
export const DEFAULT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_SENSITIVE_FIELD_IDS = ["fayda"];
const SENSITIVE_KEY_PATTERN = /(otp|token|secret|password|passcode|credential|fayda|verificationcode|apikey)/i;
const DEFAULT_KEY_PREFIX = "lift.draft";
const nullStorage = {
    getItem: () => null,
    setItem: () => {
    },
    removeItem: () => {
    },
};
const defaultStorage = () => {
    try {
        const ls = globalThis.localStorage;
        return ls ?? nullStorage;
    }
    catch {
        return nullStorage;
    }
};
const isScalar = (v) => v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
const asIdentity = (v) => {
    if (typeof v !== "object" || v === null)
        return undefined;
    const o = v;
    const org = o["organisationId"];
    const actor = o["actorRef"];
    const tpl = o["templateId"];
    const ver = o["templateVersion"];
    if (typeof org !== "string" || typeof actor !== "string" || typeof tpl !== "string" || typeof ver !== "string")
        return undefined;
    return { organisationId: org, actorRef: actor, templateId: tpl, templateVersion: ver };
};
const asEnvelope = (v) => {
    if (typeof v !== "object" || v === null)
        return undefined;
    const o = v;
    if (typeof o["schemaVersion"] !== "number" || typeof o["savedAt"] !== "number")
        return undefined;
    const identity = asIdentity(o["identity"]);
    if (identity === undefined)
        return undefined;
    const draftRaw = o["draft"];
    if (typeof draftRaw !== "object" || draftRaw === null)
        return undefined;
    const draft = {};
    for (const [k, val] of Object.entries(draftRaw)) {
        if (isScalar(val))
            draft[k] = val;
    }
    const stageId = typeof o["stageId"] === "string" ? o["stageId"] : undefined;
    const locale = typeof o["locale"] === "string" ? o["locale"] : undefined;
    const pendingOp = asPendingOp(o["pendingOp"], identity);
    return {
        schemaVersion: o["schemaVersion"],
        savedAt: o["savedAt"],
        identity,
        draft,
        ...(stageId !== undefined ? { stageId } : {}),
        ...(locale !== undefined ? { locale } : {}),
        ...(pendingOp !== undefined ? { pendingOp } : {}),
    };
};
const asPendingOp = (v, identity) => {
    if (typeof v !== "object" || v === null)
        return undefined;
    const o = v;
    if (typeof o["opId"] !== "string" || o["opId"].length === 0)
        return undefined;
    const originalInstanceId = typeof o["originalInstanceId"] === "string" ? o["originalInstanceId"] : undefined;
    const submissionInstanceId = typeof o["submissionInstanceId"] === "string" ? o["submissionInstanceId"] : undefined;
    return {
        opId: o["opId"],
        templateId: identity.templateId,
        templateVersion: identity.templateVersion,
        ...(originalInstanceId !== undefined ? { originalInstanceId } : {}),
        ...(submissionInstanceId !== undefined ? { submissionInstanceId } : {}),
        createdAt: typeof o["createdAt"] === "number" ? o["createdAt"] : 0,
        attempts: typeof o["attempts"] === "number" ? o["attempts"] : 0,
    };
};
export const createDraftStore = (options = {}) => {
    const storage = options.storage ?? defaultStorage();
    const now = options.now ?? (() => Date.now());
    const retentionMs = options.retentionMs ?? DEFAULT_RETENTION_MS;
    const prefix = options.keyPrefix ?? DEFAULT_KEY_PREFIX;
    const sensitive = new Set([...DEFAULT_SENSITIVE_FIELD_IDS, ...(options.sensitiveFieldIds ?? [])]);
    const keyFor = (id) => `${prefix}:${encodeURIComponent(id.organisationId)}:${encodeURIComponent(id.actorRef)}`;
    const sanitize = (draft) => {
        const out = {};
        for (const [k, val] of Object.entries(draft)) {
            if (sensitive.has(k) || SENSITIVE_KEY_PATTERN.test(k))
                continue;
            out[k] = val;
        }
        return out;
    };
    const safeRemove = (id) => {
        try {
            storage.removeItem(keyFor(id));
        }
        catch {
        }
    };
    const load = (identity) => {
        let raw;
        try {
            raw = storage.getItem(keyFor(identity));
        }
        catch {
            return { status: "corrupt", reason: "parse" };
        }
        if (raw === null)
            return { status: "none" };
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            safeRemove(identity);
            return { status: "corrupt", reason: "parse" };
        }
        if (typeof parsed !== "object" || parsed === null) {
            safeRemove(identity);
            return { status: "corrupt", reason: "shape" };
        }
        const sv = parsed["schemaVersion"];
        if (typeof sv !== "number") {
            safeRemove(identity);
            return { status: "corrupt", reason: "shape" };
        }
        if (sv !== DRAFT_SCHEMA_VERSION) {
            safeRemove(identity);
            return { status: "corrupt", reason: "schema" };
        }
        const env = asEnvelope(parsed);
        if (env === undefined) {
            safeRemove(identity);
            return { status: "corrupt", reason: "shape" };
        }
        if (env.identity.templateId !== identity.templateId)
            return { status: "mismatch", reason: "template", savedAt: env.savedAt };
        if (env.identity.templateVersion !== identity.templateVersion)
            return { status: "mismatch", reason: "version", savedAt: env.savedAt };
        const ageMs = now() - env.savedAt;
        if (ageMs >= retentionMs) {
            safeRemove(identity);
            return { status: "expired", savedAt: env.savedAt };
        }
        const snapshot = {
            identity: env.identity,
            draft: sanitize(env.draft),
            ...(env.stageId !== undefined ? { stageId: env.stageId } : {}),
            ...(env.locale !== undefined ? { locale: env.locale } : {}),
            ...(env.pendingOp !== undefined ? { pendingOp: env.pendingOp } : {}),
        };
        return { status: "match", snapshot, savedAt: env.savedAt, ageMs };
    };
    return {
        save: (snapshot) => {
            try {
                const env = {
                    schemaVersion: DRAFT_SCHEMA_VERSION,
                    savedAt: now(),
                    identity: snapshot.identity,
                    draft: sanitize(snapshot.draft),
                    ...(snapshot.stageId !== undefined ? { stageId: snapshot.stageId } : {}),
                    ...(snapshot.locale !== undefined ? { locale: snapshot.locale } : {}),
                    ...(snapshot.pendingOp !== undefined ? { pendingOp: snapshot.pendingOp } : {}),
                };
                storage.setItem(keyFor(snapshot.identity), JSON.stringify(env));
                return true;
            }
            catch {
                return false;
            }
        },
        load,
        has: (identity) => load(identity).status === "match",
        discard: (identity) => safeRemove(identity),
        sanitize,
    };
};
