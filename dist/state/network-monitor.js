import { checkHealth } from "../api/connectivity.js";
const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_RETRY_BASE_MS = 1_000;
const DEFAULT_RETRY_MAX_MS = 30_000;
const defaultScheduler = {
    schedule: (fn, ms) => {
        const id = setTimeout(fn, ms);
        return () => clearTimeout(id);
    },
};
const defaultEvents = {
    on: (type, handler) => {
        const g = globalThis;
        g.addEventListener?.(type, handler);
        return () => g.removeEventListener?.(type, handler);
    },
};
const defaultIsBrowserOnline = () => {
    const nav = globalThis.navigator;
    return nav?.onLine ?? true;
};
export const apiReachabilityProbe = (baseUrl, fetchImpl, now) => () => checkHealth(baseUrl, fetchImpl, now)
    .then((r) => r.ok)
    .catch(() => false);
export const createNetworkMonitor = (options) => {
    const isOnline = options.isBrowserOnline ?? defaultIsBrowserOnline;
    const events = options.events ?? defaultEvents;
    const scheduler = options.scheduler ?? defaultScheduler;
    const now = options.now ?? (() => Date.now());
    const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    const retryBase = options.retryBaseMs ?? DEFAULT_RETRY_BASE_MS;
    const retryMax = options.retryMaxMs ?? DEFAULT_RETRY_MAX_MS;
    const listeners = new Set();
    let started = false;
    let unsub = [];
    let cancelPending;
    let inFlight;
    let failures = 0;
    let lastProbeAt;
    const initialStatus = isOnline() ? "recovering" : "offline";
    let state = {
        status: initialStatus,
        browserOnline: isOnline(),
        apiReachable: initialStatus === "offline" ? false : undefined,
        since: now(),
        lastProbeAt: undefined,
    };
    const emit = () => {
        for (const fn of listeners)
            fn(state);
    };
    const apply = (next) => {
        const changed = next.status !== state.status || next.browserOnline !== state.browserOnline || next.apiReachable !== state.apiReachable;
        const since = next.status !== state.status ? now() : state.since;
        state = { status: next.status, browserOnline: next.browserOnline, apiReachable: next.apiReachable, since, lastProbeAt };
        if (changed)
            emit();
    };
    const cancelScheduled = () => {
        if (cancelPending) {
            cancelPending();
            cancelPending = undefined;
        }
    };
    const scheduleProbe = (delayMs) => {
        cancelScheduled();
        cancelPending = scheduler.schedule(() => {
            cancelPending = undefined;
            void check();
        }, delayMs);
    };
    const scheduleBackoff = () => {
        const exp = Math.min(Math.max(failures - 1, 0), 16);
        scheduleProbe(Math.min(retryMax, retryBase * 2 ** exp));
    };
    const runProbe = async () => {
        cancelScheduled();
        let ok = false;
        try {
            ok = await options.probeApi();
        }
        catch {
            ok = false;
        }
        lastProbeAt = now();
        if (!isOnline()) {
            failures = 0;
            apply({ status: "offline", browserOnline: false, apiReachable: false });
            return state;
        }
        if (ok) {
            failures = 0;
            apply({ status: "online", browserOnline: true, apiReachable: true });
        }
        else {
            failures += 1;
            apply({ status: "recovering", browserOnline: true, apiReachable: false });
            scheduleBackoff();
        }
        return state;
    };
    const check = () => {
        if (inFlight)
            return inFlight;
        inFlight = runProbe().finally(() => {
            inFlight = undefined;
        });
        return inFlight;
    };
    const onOnline = () => {
        apply({ status: "recovering", browserOnline: true, apiReachable: state.apiReachable });
        scheduleProbe(debounceMs);
    };
    const onOffline = () => {
        cancelScheduled();
        failures = 0;
        apply({ status: "offline", browserOnline: false, apiReachable: false });
    };
    return {
        getState: () => state,
        subscribe: (fn) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        start: () => {
            if (started)
                return;
            started = true;
            unsub = [events.on("online", onOnline), events.on("offline", onOffline)];
            if (!isOnline()) {
                onOffline();
            }
            else {
                apply({ status: "recovering", browserOnline: true, apiReachable: state.apiReachable });
                void check();
            }
        },
        stop: () => {
            started = false;
            cancelScheduled();
            for (const u of unsub)
                u();
            unsub = [];
        },
        check,
    };
};
