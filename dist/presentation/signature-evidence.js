export const EVIDENCE_VERSIONS = {
    privacyNotice: "privacy_notice_v1",
    declaration: "declaration_v1",
    signatureConsent: "esignature_consent_v1",
};
export const canonicalAnswers = (answers) => {
    const keys = Object.keys(answers).filter((k) => k !== "signature" && answers[k] !== undefined && answers[k] !== null).sort();
    return JSON.stringify(keys.map((k) => [k, answers[k]]));
};
export const pilotHash = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
};
export const sha256Hex = async (s) => {
    const subtle = globalThis.crypto?.subtle;
    if (subtle === undefined)
        return undefined;
    const bytes = new TextEncoder().encode(s);
    const digest = await subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
export const computeApplicationHash = async (answers) => {
    const canon = canonicalAnswers(answers);
    const sha = await sha256Hex(canon);
    return sha !== undefined ? { hash: sha, hashAlg: "sha-256" } : { hash: pilotHash(canon), hashAlg: "fnv-1a" };
};
export const composeSignatureValue = (args) => {
    const record = {
        v: 1,
        method: args.method,
        artifact: args.artifact,
        signedAt: args.signedAt,
        applicationHash: args.applicationHash,
        hashAlg: args.hashAlg,
        privacyNoticeVersion: EVIDENCE_VERSIONS.privacyNotice,
        declarationVersion: EVIDENCE_VERSIONS.declaration,
        signatureConsentVersion: EVIDENCE_VERSIONS.signatureConsent,
    };
    return JSON.stringify(record);
};
export const buildSignatureValue = async (args) => {
    const { hash, hashAlg } = await computeApplicationHash(args.answers);
    return composeSignatureValue({ method: args.method, artifact: args.artifact, signedAt: args.signedAt, applicationHash: hash, hashAlg });
};
export const parseSignatureValue = (value) => {
    if (typeof value !== "string" || value.length === 0)
        return undefined;
    try {
        const r = JSON.parse(value);
        if (r && r.v === 1 && typeof r.artifact === "string" && (r.method === "drawn" || r.method === "typed-name"))
            return r;
    }
    catch { }
    return undefined;
};
export const hasSignature = (value) => {
    const r = parseSignatureValue(value);
    return r !== undefined && r.artifact.trim().length > 0;
};
export const shouldInvalidateSignature = (changedFieldId, draft) => changedFieldId !== "signature" && hasSignature(draft["signature"]);
