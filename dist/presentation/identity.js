export const normalizePhone = (phone) => (phone ?? "").replace(/\D+/g, "").replace(/^251/, "");
export const phoneContinuityHash = (phone) => {
    const n = normalizePhone(phone);
    if (n === "")
        return undefined;
    const fnv = (seed) => {
        let h = seed >>> 0;
        for (let i = 0; i < n.length; i++) {
            h ^= n.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        return (h >>> 0).toString(16).padStart(8, "0");
    };
    return fnv(0x811c9dc5) + fnv(0x7ee3623b);
};
export const samePhoneIdentity = (a, b) => {
    const ha = phoneContinuityHash(a);
    const hb = phoneContinuityHash(b);
    return ha !== undefined && hb !== undefined && ha === hb;
};
export const resumeAuthorized = (originatorHash, verifiedPhone) => originatorHash !== undefined && originatorHash === phoneContinuityHash(verifiedPhone);
