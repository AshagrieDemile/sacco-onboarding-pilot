import { mount } from "./render/dom.js";
import { h } from "./render/h.js";
import { renderJourney } from "./render/journey-view.js";
import { widgetForField } from "./render/fields.js";
import { welcomeScreen, pickerScreen, languageScreen, terminalScreen, errorScreen } from "./screens/screens.js";
import { phoneScreen, otpScreen } from "./screens/activation.js";
import { reviewScreen } from "./screens/review.js";
import { recoveryScreen } from "./screens/recovery.js";
import { syncRecoveryScreen } from "./screens/sync-recovery.js";
import { connectivityBanner, canSubmitNow, saveIndicatorKey } from "./presentation/connectivity-ux.js";
import { nextSyncAction, classifySyncFailure, syncNoticeBanner, reconnectedBanner } from "./presentation/sync-recovery.js";
import { newOperationId, idempotencyKeyFor } from "./state/submission-op.js";
import { resetDatePartials } from "./components/date-control.js";
import { shouldInvalidateSignature } from "./presentation/signature-evidence.js";
import { deriveEducationLevel } from "./presentation/education.js";
import { phoneContinuityHash, resumeAuthorized } from "./presentation/identity.js";
import { LoadingSpinner } from "./components/library.js";
import { isValidNationalMobile } from "./standards/ethiopian.js";
import { createI18n } from "./i18n/i18n.js";
import { bundles } from "./i18n/bundles.js";
import { applyTheme } from "./theme/theme.js";
import { applyBrand } from "./brand/brand.js";
import { applyOrganisationTheme } from "./brand/organisation.js";
import { ApiError } from "./api/errors.js";
import { catalogEntry, devTestOtpAllowed } from "./config.js";
import { sharesPanel, contributionPanel, computeSubscription, shareInfoPanel } from "./presentation/share-subscription.js";
import { termsPrivacyPanel } from "./presentation/terms.js";
import { saccoShareValue } from "./brand/organisation.js";
import { isAddisSubCity, isValidAddisWoreda, canonicalWoreda } from "./data/ethiopia.js";
const afterFrame = (fn) => {
    if (typeof requestAnimationFrame === "function")
        requestAnimationFrame(fn);
    else
        setTimeout(fn, 0);
};
export const createApp = (deps) => {
    const { root, store, channel, api, config, telemetry } = deps;
    const idleMs = deps.idleTimeoutMs ?? 15 * 60 * 1000;
    const i18nNow = () => createI18n(store.get().locale, bundles);
    const titleKeyFor = (templateId) => (templateId ? catalogEntry(templateId)?.nameKey : undefined) ?? "app.title";
    let saveResetTimer;
    const setSave = (saveState) => {
        store.set({ saveState });
        if (saveResetTimer)
            clearTimeout(saveResetTimer);
        if (saveState === "saved")
            saveResetTimer = setTimeout(() => store.set({ saveState: "idle" }), 1600);
    };
    let restoreDraft;
    let restoreEntry;
    let restoreOriginatorHash;
    let pendingRecovery;
    let persistTimer;
    let submissionOp;
    let resumeInstanceId;
    const draftIdentityFor = (sel) => {
        if (deps.session === undefined)
            return undefined;
        const s = sel ?? store.get().selected;
        if (s === undefined)
            return undefined;
        return { organisationId: deps.session.organisationId, actorRef: deps.session.actorRef, templateId: s.templateId, templateVersion: s.templateVersion };
    };
    const persistDraft = () => {
        if (deps.draftStore === undefined)
            return;
        const id = draftIdentityFor();
        if (id === undefined)
            return;
        const s = store.get();
        const originatorHash = s.verification.state === "VERIFIED" ? phoneContinuityHash(s.verification.phone) : undefined;
        deps.draftStore.save({
            identity: id,
            draft: mergedDraft(),
            locale: s.locale,
            ...(originatorHash !== undefined ? { originatorHash } : {}),
            ...(s.presentation?.stageId !== undefined ? { stageId: s.presentation.stageId } : {}),
            ...(submissionOp !== undefined ? { pendingOp: submissionOp } : {}),
        });
    };
    const ensureSubmissionOp = () => {
        const sel = store.get().selected;
        if (submissionOp === undefined) {
            submissionOp = {
                opId: newOperationId(),
                templateId: sel?.templateId ?? "",
                templateVersion: sel?.templateVersion ?? "",
                ...(store.get().instanceId !== undefined ? { originalInstanceId: store.get().instanceId } : {}),
                createdAt: Date.now(),
                attempts: 0,
            };
        }
        submissionOp = { ...submissionOp, attempts: submissionOp.attempts + 1 };
        persistDraft();
        return submissionOp;
    };
    const noteSubmissionInstance = (instanceId) => {
        if (submissionOp !== undefined && submissionOp.submissionInstanceId !== instanceId) {
            submissionOp = { ...submissionOp, submissionInstanceId: instanceId };
            persistDraft();
        }
    };
    const clearSubmissionOp = () => { submissionOp = undefined; resumeInstanceId = undefined; };
    const schedulePersist = () => {
        if (deps.draftStore === undefined)
            return;
        if (persistTimer)
            clearTimeout(persistTimer);
        persistTimer = setTimeout(persistDraft, deps.autosaveDebounceMs ?? 600);
    };
    const clearDraft = (sel) => {
        if (persistTimer) {
            clearTimeout(persistTimer);
            persistTimer = undefined;
        }
        const id = draftIdentityFor(sel);
        if (id !== undefined)
            deps.draftStore?.discard(id);
    };
    const detectRecoverableDraft = () => {
        if (deps.draftStore === undefined || deps.session === undefined)
            return undefined;
        for (const entry of config.catalog) {
            const id = { organisationId: deps.session.organisationId, actorRef: deps.session.actorRef, templateId: entry.templateId, templateVersion: entry.templateVersion };
            const res = deps.draftStore.load(id);
            if (res.status === "match")
                return { entry, snapshot: res.snapshot };
        }
        return undefined;
    };
    let idleTimer;
    const resetIdle = () => {
        if (idleTimer)
            clearTimeout(idleTimer);
        idleTimer = setTimeout(onIdleTimeout, idleMs);
    };
    const onIdleTimeout = () => {
        const s = store.get();
        if (s.screen === "journey" && s.instanceId !== undefined) {
            telemetry.stepAbandoned();
            store.set({ screen: "error", errorMessage: "session.timeout", busy: false });
        }
    };
    const mobileFieldId = (presentation) => presentation.form?.fields.find((f) => f.semanticType === "ethiopian-mobile-number")?.id;
    let history = [];
    let pos = 0;
    let frontier = 0;
    let dirty = false;
    let reviewConfirmed = false;
    let signatureClearedNotice = false;
    const resetBuffer = () => { history = []; pos = 0; frontier = 0; dirty = false; reviewConfirmed = false; resetDatePartials(); };
    const saveViewedDraft = () => { const cur = history[pos]; if (cur)
        cur.draft = { ...store.get().draft }; };
    const showStage = (i) => {
        const h = history[i];
        if (!h)
            return;
        pos = i;
        store.set({ presentation: h.presentation, draft: { ...h.draft }, errors: [], busy: false, screen: "journey" });
    };
    const prefilledDraftFor = (presentation) => {
        const verified = store.get().verification;
        const mob = mobileFieldId(presentation);
        const out = {};
        if (restoreDraft !== undefined) {
            for (const f of presentation.form?.fields ?? []) {
                const v = restoreDraft[f.id];
                if (v !== undefined)
                    out[f.id] = v;
            }
        }
        if (mob !== undefined && verified.state === "VERIFIED" && verified.phone)
            out[mob] = verified.phone;
        if ((presentation.form?.fields ?? []).some((f) => f.id === "shareValue"))
            out["shareValue"] = saccoShareValue();
        return out;
    };
    const mergedDraft = () => {
        const m = {};
        for (const entry of history)
            Object.assign(m, entry.draft);
        Object.assign(m, store.get().draft);
        return m;
    };
    const applyPresentation = (instanceId, revision, presentation) => {
        telemetry.setContext({ journeyId: instanceId, locale: store.get().locale });
        if (presentation.status === "completed") {
            clearDraft();
            clearSubmissionOp();
            restoreDraft = undefined;
            restoreEntry = undefined;
            restoreOriginatorHash = undefined;
            store.set({ instanceId, revision, presentation, draft: {}, errors: [], busy: false, screen: "terminal", syncNotice: undefined });
            telemetry.submissionSuccessful(instanceId, presentation.outcome);
            telemetry.journeyCompleted(instanceId, presentation.outcome);
            return;
        }
        const entry = { stageId: presentation.stageId, presentation, draft: prefilledDraftFor(presentation) };
        history.push(entry);
        frontier = history.length - 1;
        pos = frontier;
        store.set({ instanceId, revision, presentation, draft: { ...entry.draft }, errors: presentation.errors ?? [], busy: false, screen: "journey", syncNotice: undefined });
        telemetry.stageEntered(presentation.stageId, presentation.progress.step, presentation.progress.total);
        persistDraft();
    };
    let reconnectTimer;
    const setReconnected = () => {
        store.set({ reconnected: true });
        if (reconnectTimer)
            clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => store.set({ reconnected: false }), 5000);
    };
    const reconcileFromServer = async (notice) => {
        const s = store.get();
        if (s.instanceId === undefined)
            return;
        restoreDraft = { ...(restoreDraft ?? {}), ...mergedDraft() };
        resetBuffer();
        store.set({ busy: true, screen: "journey", errorMessage: undefined });
        try {
            const res = await api.resume(s.instanceId);
            telemetry.journeyResumed(s.instanceId);
            applyPresentation(res.instanceId, res.revision, res.presentation);
            if (notice !== undefined && store.get().screen === "journey")
                store.set({ syncNotice: notice });
        }
        catch (e) {
            onSubmissionFailure(e);
        }
    };
    const onSubmissionFailure = (error, opts = {}) => {
        setSave("idle");
        persistDraft();
        const instanceId = store.get().instanceId;
        if (instanceId !== undefined)
            telemetry.submissionFailed(instanceId, error instanceof ApiError ? error.code : "unknown");
        const action = nextSyncAction(error, { atStart: opts.atStart === true, hasInstance: instanceId !== undefined });
        switch (action.kind) {
            case "journeyGone":
                store.set({ busy: false, screen: "syncRecover", syncNotice: undefined });
                channel.haptic("error");
                return;
            case "reconcile":
                if (action.notice !== undefined)
                    channel.haptic("error");
                void reconcileFromServer(action.notice);
                return;
            case "stay":
                store.set({ busy: false, screen: "journey", syncNotice: action.notice });
                channel.haptic("error");
                return;
            case "hardError":
            default:
                showError(error);
                return;
        }
    };
    const startNewAfterSync = () => {
        const local = mergedDraft();
        restoreDraft = Object.keys(local).length > 0 ? local : undefined;
        restoreEntry = undefined;
        restoreOriginatorHash = phoneContinuityHash(store.get().verification.phone);
        clearSubmissionOp();
        resetBuffer();
        store.set({ screen: "welcome", instanceId: undefined, revision: undefined, presentation: undefined, draft: {}, errors: [], errorMessage: undefined, syncNotice: undefined });
    };
    const startOrPick = () => {
        if (config.catalog.length === 1)
            void startJourney(config.catalog[0]);
        else
            store.set({ screen: "picker" });
    };
    const showError = (e) => {
        const api = e instanceof ApiError ? e : undefined;
        telemetry.error(api ? api.code : "unknown");
        store.set({
            screen: "error",
            errorMessage: api ? api.messageKey : "error.body",
            errorCode: api?.code ?? "unknown",
            errorReference: api?.reference ?? "ERR-UNKNOWN",
            errorCorrelation: api?.correlationId,
            busy: false,
        });
        channel.haptic("error");
    };
    const showConnectivityError = (result) => {
        const code = result.status >= 500 ? "service_unavailable" : "network";
        store.set({
            screen: "error", busy: false,
            errorMessage: `apierror.${code}`, errorCode: code,
            errorReference: code === "service_unavailable" ? "ERR-SVC-001" : "ERR-NET-001",
            errorCorrelation: result.correlationId,
        });
        channel.haptic("error");
        telemetry.error(code);
    };
    const startJourney = async (entry) => {
        if (catalogEntry(entry.templateId) === undefined) {
            showError(new ApiError(422, "unknown_template", "apierror.unknown_template"));
            return;
        }
        if (store.get().verification.state !== "VERIFIED") {
            beginActivation();
            return;
        }
        resetBuffer();
        store.set({ selected: { templateId: entry.templateId, templateVersion: entry.templateVersion }, screen: "connecting", busy: true, errorMessage: undefined });
        if (deps.health) {
            const h = await deps.health();
            if (!h.ok) {
                showConnectivityError(h);
                return;
            }
        }
        store.set({ screen: "journey", busy: true });
        telemetry.journeyStarted(entry.templateId);
        try {
            const res = await api.start(entry.templateId, entry.templateVersion, store.get().locale, channel.key);
            applyPresentation(res.instanceId, res.revision, res.presentation);
        }
        catch (e) {
            showError(e);
        }
    };
    const submitStage = async (idempotencyKey) => {
        const s = store.get();
        if (s.presentation === undefined || s.instanceId === undefined || s.revision === undefined || s.busy)
            return;
        const stageId = s.presentation.stageId;
        store.set({ busy: true, syncNotice: undefined });
        setSave("saving");
        channel.mainButton.setBusy(true);
        try {
            const res = await api.submit(s.instanceId, stageId, s.draft, s.revision, idempotencyKey);
            const p = res.presentation;
            if (p.errors !== undefined && p.errors.length > 0) {
                telemetry.validationFailed(stageId, p.errors.map((e) => e.fieldId));
                setSave("idle");
                store.set({ presentation: p, revision: res.revision, errors: p.errors, busy: false });
                channel.haptic("error");
            }
            else {
                telemetry.stageCompleted(stageId, s.presentation.progress.step, s.presentation.progress.total);
                telemetry.draftSaved(stageId);
                setSave("saved");
                channel.haptic("success");
                applyPresentation(s.instanceId, res.revision, p);
            }
        }
        catch (e) {
            onSubmissionFailure(e);
        }
    };
    const navPrevious = () => {
        if (store.get().busy)
            return;
        saveViewedDraft();
        if (pos > 0)
            showStage(pos - 1);
    };
    const applyClientTransforms = () => {
        const s = store.get();
        const d = s.draft;
        if (s.presentation?.stageId === "identity" && isAddisSubCity(String(d["addr_zone"] ?? ""))) {
            const w = d["addr_woreda"];
            if (typeof w === "string" && w !== "") {
                const canon = canonicalWoreda(w);
                if (canon !== w)
                    store.setDraft("addr_woreda", canon);
            }
        }
    };
    const validateClientStage = (stageId) => {
        const errs = [];
        const d = store.get().draft;
        if (stageId === "identity") {
            const zone = String(d["addr_zone"] ?? "");
            const woreda = String(d["addr_woreda"] ?? "");
            if (isAddisSubCity(zone) && woreda !== "" && !isValidAddisWoreda(zone, woreda))
                errs.push({ fieldId: "addr_woreda", messageKey: "validation.addr_woreda.invalidWoreda" });
        }
        if (stageId === "shares") {
            const n = Number(d["sharesRequested"]);
            if (Number.isFinite(n) && n > 0 && n < 20)
                errs.push({ fieldId: "sharesRequested", messageKey: "validation.sharesRequested.belowMin" });
        }
        if (stageId === "savings" && computeSubscription(mergedDraft()).initialExceedsTotal)
            errs.push({ fieldId: "initialContribution", messageKey: "validation.initialContribution.exceedsTotal" });
        return errs;
    };
    const navNext = () => {
        if (store.get().busy)
            return;
        if (pos === frontier) {
            applyClientTransforms();
            const errs = validateClientStage(store.get().presentation?.stageId);
            if (errs.length > 0) {
                saveViewedDraft();
                store.set({ errors: errs });
                channel.haptic("error");
                return;
            }
            if (!canSubmitNow(store.get().connectivity)) {
                saveViewedDraft();
                persistDraft();
                setSave("savedOnDevice");
                channel.haptic("impact");
                return;
            }
        }
        saveViewedDraft();
        if (pos < frontier)
            showStage(pos + 1);
        else
            void submitStage();
    };
    const editStage = (index) => { saveViewedDraft(); showStage(index); };
    const confirmReview = async () => {
        saveViewedDraft();
        const reviewEntry = history[pos];
        if (reviewEntry) {
            for (const f of reviewEntry.presentation.form?.fields ?? [])
                if (f.semanticType === "boolean")
                    reviewEntry.draft[f.id] = true;
            store.set({ draft: { ...reviewEntry.draft } });
        }
        if (!canSubmitNow(store.get().connectivity)) {
            persistDraft();
            setSave("savedOnDevice");
            channel.haptic("impact");
            return;
        }
        const op = ensureSubmissionOp();
        if (!dirty) {
            const reviewStageId = store.get().presentation?.stageId ?? "review";
            void submitStage(idempotencyKeyFor(op.opId, { kind: "submit", stageId: reviewStageId }));
            return;
        }
        const sel = store.get().selected;
        if (sel === undefined) {
            void submitStage(idempotencyKeyFor(op.opId, { kind: "submit", stageId: store.get().presentation?.stageId ?? "review" }));
            return;
        }
        const originalId = op.originalInstanceId ?? store.get().instanceId;
        store.set({ busy: true, screen: "connecting", syncNotice: undefined });
        setSave("saving");
        try {
            const started = await api.start(sel.templateId, sel.templateVersion, store.get().locale, channel.key, idempotencyKeyFor(op.opId, { kind: "start" }));
            let instanceId = started.instanceId, revision = started.revision, pres = started.presentation;
            noteSubmissionInstance(instanceId);
            let guard = 0;
            while (pres.status === "active" && guard++ < 50) {
                const buffered = history.find((h) => h.stageId === pres.stageId);
                const res = await api.submit(instanceId, pres.stageId, buffered?.draft ?? {}, revision, idempotencyKeyFor(op.opId, { kind: "submit", stageId: pres.stageId }));
                revision = res.revision;
                pres = res.presentation;
                if (pres.errors !== undefined && pres.errors.length > 0) {
                    telemetry.validationFailed(pres.stageId, pres.errors.map((e) => e.fieldId));
                    resetBuffer();
                    applyPresentation(instanceId, revision, pres);
                    setSave("idle");
                    return;
                }
            }
            dirty = false;
            if (originalId !== undefined && originalId !== instanceId) {
                try {
                    await api.withdraw(originalId, idempotencyKeyFor(op.opId, { kind: "withdraw" }));
                }
                catch { }
            }
            applyPresentation(instanceId, revision, pres);
            setSave("saved");
        }
        catch (e) {
            onSubmissionFailure(e);
        }
    };
    const restart = () => {
        resetBuffer();
        restoreDraft = undefined;
        restoreEntry = undefined;
        restoreOriginatorHash = undefined;
        clearSubmissionOp();
        telemetry.stepAbandoned();
        store.set({ screen: "welcome", instanceId: undefined, revision: undefined, presentation: undefined, draft: {}, errors: [], errorMessage: undefined, saveState: "idle" });
    };
    const onRecoverContinue = () => {
        const r = pendingRecovery;
        pendingRecovery = undefined;
        if (r === undefined) {
            store.set({ screen: "language" });
            return;
        }
        restoreEntry = r.entry;
        restoreDraft = { ...r.snapshot.draft };
        restoreOriginatorHash = r.snapshot.originatorHash;
        telemetry.draftRestored(r.snapshot.stageId);
        store.set({ screen: "welcome", ...(r.snapshot.locale === "am" || r.snapshot.locale === "en" ? { locale: r.snapshot.locale } : {}) });
    };
    const beginFreshAfterRecovery = () => {
        const r = pendingRecovery;
        pendingRecovery = undefined;
        restoreDraft = undefined;
        restoreEntry = undefined;
        restoreOriginatorHash = undefined;
        clearSubmissionOp();
        if (r !== undefined)
            clearDraft(r.entry);
        store.set({ screen: "language" });
    };
    const onRecoverStartNew = () => beginFreshAfterRecovery();
    const onRecoverDiscard = () => beginFreshAfterRecovery();
    const reconcilePendingSubmission = async (recoverable) => {
        const op = recoverable.snapshot.pendingOp;
        if (op === undefined) {
            pendingRecovery = recoverable;
            store.set({ screen: "recover" });
            return;
        }
        submissionOp = op;
        restoreEntry = recoverable.entry;
        restoreDraft = { ...recoverable.snapshot.draft };
        restoreOriginatorHash = recoverable.snapshot.originatorHash;
        const loc = recoverable.snapshot.locale;
        store.set({ screen: "checking", ...(loc === "am" || loc === "en" ? { locale: loc } : {}) });
        const knownInstance = op.submissionInstanceId ?? op.originalInstanceId;
        if (knownInstance !== undefined) {
            try {
                await api.resume(knownInstance);
                resumeInstanceId = knownInstance;
            }
            catch (e) {
                if (classifySyncFailure(e) === "journeyGone") {
                    pendingRecovery = recoverable;
                    store.set({ screen: "syncRecover" });
                    return;
                }
                resumeInstanceId = undefined;
            }
        }
        pendingRecovery = recoverable;
        store.set({ screen: "recover" });
    };
    const resumeOperationInstance = async (instanceId) => {
        resetBuffer();
        store.set({ busy: true, screen: "journey", errorMessage: undefined });
        try {
            const res = await api.resume(instanceId);
            telemetry.journeyResumed(instanceId);
            applyPresentation(res.instanceId, res.revision, res.presentation);
        }
        catch (e) {
            onSubmissionFailure(e);
        }
    };
    const retry = async () => {
        const s = store.get();
        if (s.instanceId !== undefined) {
            store.set({ busy: true, errorMessage: undefined, screen: "journey" });
            try {
                const res = await api.resume(s.instanceId);
                telemetry.journeyResumed(s.instanceId);
                applyPresentation(res.instanceId, res.revision, res.presentation);
            }
            catch (e) {
                showError(e);
            }
        }
        else {
            restart();
        }
    };
    let bootPreselect;
    const boot = async () => {
        store.set({ screen: "connecting", errorMessage: undefined });
        const result = deps.health ? await deps.health() : { ok: true, status: 200, latencyMs: 0 };
        if (!result.ok) {
            store.set({ screen: "error", errorMessage: "apierror.network", errorCode: "network", errorReference: "ERR-NET-001", errorCorrelation: result.correlationId, busy: false });
            channel.haptic("error");
            telemetry.error("network");
            return;
        }
        if (bootPreselect !== undefined) {
            void startJourney(bootPreselect);
            return;
        }
        const recoverable = detectRecoverableDraft();
        if (recoverable !== undefined) {
            if (recoverable.snapshot.pendingOp !== undefined) {
                void reconcilePendingSubmission(recoverable);
                return;
            }
            pendingRecovery = recoverable;
            store.set({ screen: "recover" });
            return;
        }
        store.set({ screen: "language" });
    };
    const isConnectivityGate = () => {
        const s = store.get();
        return s.instanceId === undefined && (s.errorCode === "network" || s.errorCode === "service_unavailable");
    };
    const setLocale = (loc) => {
        telemetry.languageChanged(loc);
        const cur = store.get();
        const screen = cur.screen === "recover" || cur.screen === "syncRecover" || cur.screen === "checking"
            ? cur.screen
            : cur.instanceId !== undefined
                ? "journey"
                : "welcome";
        store.set({ locale: loc, screen });
    };
    const toggleLocale = () => setLocale(store.get().locale === "am" ? "en" : "am");
    let otpCode = "";
    let devTestOtp;
    let otpTimer;
    let expiryRemaining = 0;
    let cooldownRemaining = 0;
    const stopTimers = () => { if (otpTimer)
        clearInterval(otpTimer); otpTimer = undefined; };
    const startTimers = (expirySec, cooldownSec) => {
        stopTimers();
        expiryRemaining = expirySec;
        cooldownRemaining = cooldownSec;
        otpTimer = setInterval(() => {
            if (expiryRemaining > 0)
                expiryRemaining -= 1;
            if (cooldownRemaining > 0)
                cooldownRemaining -= 1;
            if (expiryRemaining <= 0) {
                const v = store.get().verification;
                if (v.state === "OTP_PENDING") {
                    store.set({ verification: { ...v, state: "VERIFICATION_EXPIRED", message: "activation.msg.expired" } });
                    return;
                }
            }
            render();
        }, 1000);
    };
    const beginActivation = () => { otpCode = ""; devTestOtp = undefined; store.set({ screen: "phone", verification: { state: "UNVERIFIED", phone: store.get().verification.phone } }); };
    const onPhoneInput = (v) => {
        const cur = store.get().verification;
        store.set({ verification: { ...cur, phone: v ?? "", state: "UNVERIFIED", message: undefined } });
    };
    const onOtpInput = (v) => { otpCode = v; render(); };
    const requestOtp = async () => {
        const ver = store.get().verification;
        const phone = ver.phone ?? "";
        if (!isValidNationalMobile(phone)) {
            store.set({ verification: { ...ver, message: "activation.msg.invalid_phone" } });
            return;
        }
        store.set({ busy: true });
        const r = await deps.verification.requestOtp(phone);
        if (r.ok) {
            otpCode = "";
            devTestOtp = undefined;
            store.set({ busy: false, screen: "otp", verification: { state: "OTP_PENDING", phone, verificationId: r.verificationId, expiresInSec: r.expiresInSec, resendCooldownSec: r.resendCooldownSec, message: undefined } });
            startTimers(r.expiresInSec, r.resendCooldownSec);
            if (devTestOtpAllowed()) {
                void deps.verification.peekTestOtp(phone).then((code) => {
                    if (code && store.get().verification.state === "OTP_PENDING" && store.get().verification.phone === phone) {
                        devTestOtp = code;
                        render();
                    }
                });
            }
        }
        else {
            store.set({ busy: false, verification: { ...ver, message: `activation.msg.${r.reason}`, ...(r.reason === "rate_limited" || r.reason === "cooldown" ? { state: "LOCKED" } : {}) } });
        }
    };
    const verifyOtp = async () => {
        const ver = store.get().verification;
        if (ver.verificationId === undefined || store.get().busy)
            return;
        store.set({ busy: true });
        const r = await deps.verification.verifyOtp(ver.verificationId, otpCode);
        if (r.ok) {
            stopTimers();
            devTestOtp = undefined;
            store.set({ busy: false, verification: { state: "VERIFIED", phone: r.phone, token: r.verificationToken, message: "activation.msg.verified" } });
            channel.haptic("success");
            telemetry.setContext({});
            const resumePending = resumeInstanceId !== undefined || restoreEntry !== undefined || restoreDraft !== undefined;
            const identityOk = resumeAuthorized(restoreOriginatorHash, r.phone);
            if (resumePending && !identityOk) {
                telemetry.error("resume_identity_denied");
                resumeInstanceId = undefined;
                restoreEntry = undefined;
                restoreDraft = undefined;
                restoreOriginatorHash = undefined;
                clearSubmissionOp();
                startOrPick();
                return;
            }
            if (resumeInstanceId !== undefined) {
                const id = resumeInstanceId;
                resumeInstanceId = undefined;
                void resumeOperationInstance(id);
            }
            else if (restoreEntry !== undefined)
                void startJourney(restoreEntry);
            else
                startOrPick();
        }
        else {
            const map = { locked: "LOCKED", expired: "VERIFICATION_EXPIRED", used: "VERIFICATION_EXPIRED", not_found: "VERIFICATION_EXPIRED", invalid: "VERIFICATION_FAILED", network: "VERIFICATION_FAILED", error: "VERIFICATION_FAILED" };
            store.set({ busy: false, verification: { ...ver, state: map[r.reason] ?? "VERIFICATION_FAILED", message: `activation.msg.${r.reason}`, remainingAttempts: r.remainingAttempts } });
            channel.haptic("error");
        }
    };
    const onFieldChange = (fieldId, value, rerender) => {
        if (pos < frontier)
            dirty = true;
        let discrete = rerender;
        if (discrete === undefined) {
            const field = store.get().presentation?.form?.fields.find((f) => f.id === fieldId);
            const w = field ? widgetForField(field) : undefined;
            discrete = w === undefined ? true : w === "select" || w === "checkbox" || w === "fayda";
        }
        store.setDraft(fieldId, value, discrete);
        if (fieldId === "highestGrade")
            store.setDraft("educationLevel", deriveEducationLevel(value), true);
        if (shouldInvalidateSignature(fieldId, store.get().draft)) {
            store.setDraft("signature", undefined, true);
            signatureClearedNotice = true;
        }
        else if (fieldId === "signature") {
            signatureClearedNotice = false;
        }
        schedulePersist();
    };
    const saveLabelFor = (i18n, s) => {
        const key = saveIndicatorKey(s);
        return key === undefined ? undefined : i18n.t(key);
    };
    const topBanner = (i18n) => {
        const s = store.get();
        return (syncNoticeBanner(i18n, s.syncNotice) ??
            reconnectedBanner(i18n, s.reconnected === true) ??
            connectivityBanner(i18n, s.connectivity));
    };
    const view = () => {
        const s = store.get();
        const i18n = i18nNow();
        const rootEl = document.documentElement;
        rootEl.lang = i18n.locale;
        rootEl.dir = i18n.dir();
        switch (s.screen) {
            case "connecting":
                channel.mainButton.hide();
                return h("div", { class: "screen screen-body-center" }, LoadingSpinner({ label: i18n.t("status.connecting") }), h("p", { class: "coldstart-note" }, i18n.t("status.coldStart")));
            case "checking":
                channel.mainButton.hide();
                return h("div", { class: "screen screen-body-center screen-checking" }, h("h1", { class: "screen-title" }, i18n.t("sync.checkingTitle")), LoadingSpinner({ label: i18n.t("sync.checkingBody") }));
            case "language":
                channel.mainButton.hide();
                return languageScreen({ i18n, onChoose: setLocale });
            case "welcome":
                channel.mainButton.hide();
                return welcomeScreen({ i18n, onStart: beginActivation, onLanguage: toggleLocale });
            case "phone":
                channel.mainButton.hide();
                return phoneScreen({
                    i18n, phone: s.verification.phone ?? "", onPhone: onPhoneInput, onRequest: () => void requestOtp(),
                    onLanguage: toggleLocale, busy: s.busy, ...(s.verification.message ? { message: s.verification.message } : {}),
                });
            case "otp":
                channel.mainButton.hide();
                return otpScreen({
                    i18n, verification: s.verification, code: otpCode, onCode: onOtpInput,
                    onVerify: () => void verifyOtp(), onResend: () => void requestOtp(), onChangeNumber: beginActivation,
                    onLanguage: toggleLocale, busy: s.busy, cooldownRemaining, expiryRemaining,
                    ...(devTestOtp ? { devTestOtp } : {}),
                });
            case "recover":
                channel.mainButton.hide();
                return recoveryScreen({ i18n, onContinue: onRecoverContinue, onStartNew: onRecoverStartNew, onDiscard: onRecoverDiscard, onLanguage: toggleLocale });
            case "syncRecover":
                channel.mainButton.hide();
                return syncRecoveryScreen({ i18n, onStartNew: startNewAfterSync, onLanguage: toggleLocale });
            case "picker":
                channel.mainButton.hide();
                return pickerScreen({ i18n, catalog: config.catalog, onSelect: (entry) => void startJourney(entry), onLanguage: toggleLocale });
            case "terminal":
                channel.mainButton.hide();
                return terminalScreen({ i18n, presentation: s.presentation, onRestart: restart, onLanguage: toggleLocale });
            case "error":
                channel.mainButton.hide();
                return errorScreen({
                    i18n,
                    messageKey: s.errorMessage,
                    code: s.errorCode,
                    reference: s.errorReference,
                    correlation: s.errorCorrelation,
                    onRetry: () => { if (isConnectivityGate())
                        void boot();
                    else
                        void retry(); },
                    onHome: restart,
                });
            case "journey": {
                const p = s.presentation;
                if (p === undefined) {
                    channel.mainButton.hide();
                    return h("div", { class: "screen" }, LoadingSpinner({ label: i18n.t("status.loading") }));
                }
                if (p.stageType === "review") {
                    channel.mainButton.hide();
                    return reviewScreen({
                        i18n,
                        stages: history.map((hh) => ({ stageId: hh.stageId, presentation: hh.presentation, draft: hh.draft })),
                        onEdit: editStage,
                        onConfirm: () => void confirmReview(),
                        onLanguage: toggleLocale,
                        confirmed: reviewConfirmed,
                        onToggleConfirm: (v) => { reviewConfirmed = v; render(); },
                        busy: s.busy,
                        banner: topBanner(i18n),
                    });
                }
                channel.mainButton.show(i18n.t(p.stageId === "declaration" ? "action.submitApplication" : "action.next"), () => navNext());
                channel.mainButton.setBusy(s.busy);
                return renderJourney({
                    i18n,
                    titleKey: titleKeyFor(s.selected?.templateId),
                    presentation: p,
                    draft: s.draft,
                    errors: s.errors,
                    banner: topBanner(i18n),
                    onChange: onFieldChange,
                    onLanguage: toggleLocale,
                    onSubmit: () => navNext(),
                    onPrevious: navPrevious,
                    canPrevious: pos > 0,
                    ...(s.verification.state === "VERIFIED" && s.verification.phone ? { verifiedPhone: s.verification.phone } : {}),
                    ...(saveLabelFor(i18n, s.saveState) !== undefined ? { saveLabel: saveLabelFor(i18n, s.saveState) } : {}),
                    ...(p.stageId === "shares"
                        ? { hiddenFieldIds: new Set(["shareValue"]), panelBefore: shareInfoPanel(i18n), panelAfter: sharesPanel(i18n, mergedDraft()), liveFieldIds: new Set(["sharesRequested"]) }
                        : {}),
                    ...(p.stageId === "membership"
                        ? { readOnlyFieldIds: new Set(["educationLevel"]), liveFieldIds: new Set(["highestGrade"]) }
                        : {}),
                    ...(p.stageId === "savings"
                        ? {
                            panelAfter: contributionPanel(i18n, mergedDraft()),
                            moneyFieldIds: new Set(["initialContribution", "plannedRegularContribution"]),
                            onFieldBlur: () => render(),
                        }
                        : {}),
                    ...(p.stageId === "declaration" ? { panelBefore: termsPrivacyPanel(i18n), signatureCleared: signatureClearedNotice } : {}),
                });
            }
        }
    };
    let lastStage;
    let lastErrorSig = "";
    const runEffects = () => {
        const s = store.get();
        const stage = s.screen === "journey" ? s.presentation?.stageId : undefined;
        const errSig = s.errors.map((e) => e.fieldId).join(",");
        if (stage !== undefined && stage !== lastStage) {
            afterFrame(() => {
                window.scrollTo?.({ top: 0, behavior: "smooth" });
                const first = root.querySelector(".journey-form input, .journey-form select, .journey-form textarea");
                first?.focus();
            });
        }
        else if (errSig !== "" && errSig !== lastErrorSig) {
            afterFrame(() => {
                const bad = root.querySelector(".field.has-error input, .field.has-error select, .field.has-error textarea");
                (bad ?? root.querySelector(".form-error-summary"))?.scrollIntoView({ block: "center", behavior: "smooth" });
                bad?.focus();
            });
        }
        lastStage = stage;
        lastErrorSig = errSig;
    };
    const render = () => {
        mount(root, view());
        runEffects();
        resetIdle();
    };
    return {
        start: (preselect) => {
            channel.ready();
            applyBrand();
            applyOrganisationTheme();
            applyTheme(channel.themeParams(), channel.colorScheme());
            channel.onThemeChanged(() => {
                const scheme = channel.colorScheme();
                applyTheme(channel.themeParams(), scheme);
                telemetry.themeChanged(scheme);
            });
            telemetry.setContext({ locale: store.get().locale });
            store.subscribe(render);
            if (deps.network !== undefined) {
                const net = deps.network;
                net.subscribe((ns) => {
                    const prev = store.get().connectivity;
                    if (ns.status === prev)
                        return;
                    store.set({ connectivity: ns.status });
                    if (ns.status === "offline")
                        telemetry.networkLost();
                    else if (ns.status === "online" && (prev === "offline" || prev === "recovering")) {
                        telemetry.networkRestored();
                        setReconnected();
                    }
                });
                store.set({ connectivity: net.getState().status });
                net.start();
            }
            bootPreselect = preselect;
            render();
            void boot();
        },
    };
};
