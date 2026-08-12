const KEY = "lift.diag.requests";
const MAX = 50;
let memory = [];
const storage = () => {
    try {
        return typeof localStorage !== "undefined" ? localStorage : undefined;
    }
    catch {
        return undefined;
    }
};
const load = () => {
    const s = storage();
    if (!s)
        return memory;
    try {
        const raw = s.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
};
const save = (list) => {
    memory = list;
    const s = storage();
    if (!s)
        return;
    try {
        s.setItem(KEY, JSON.stringify(list));
    }
    catch {
    }
};
export const recordRequest = (entry) => {
    const list = load();
    list.push(entry);
    if (list.length > MAX)
        list.splice(0, list.length - MAX);
    save(list);
};
export const diagnosticsSnapshot = () => {
    const requests = load();
    const lastSuccess = [...requests].reverse().find((r) => r.ok);
    const lastFailure = [...requests].reverse().find((r) => !r.ok);
    return {
        requests,
        ...(lastSuccess ? { lastSuccess } : {}),
        ...(lastFailure ? { lastFailure } : {}),
    };
};
export const clearDiagnostics = () => save([]);
