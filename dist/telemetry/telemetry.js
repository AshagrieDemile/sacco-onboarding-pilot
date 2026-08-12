export class BufferSink {
    opts;
    events = [];
    constructor(opts = {}) {
        this.opts = opts;
    }
    emit(event) {
        this.events.push(event);
        const max = this.opts.max ?? 200;
        if (this.events.length > max)
            this.events.splice(0, this.events.length - max);
        if (this.opts.log)
            console.debug("[telemetry]", event.type, event);
    }
    drain() {
        return [...this.events];
    }
}
export class Telemetry {
    sink;
    ctx;
    now;
    clock;
    stepViewedAt;
    currentStage;
    constructor(sink, ctx = {}, now = () => Date.now(), clock = () => new Date().toISOString()) {
        this.sink = sink;
        this.ctx = ctx;
        this.now = now;
        this.clock = clock;
    }
    setContext(ctx) {
        this.ctx = { ...this.ctx, ...ctx };
    }
    base() {
        return {
            at: this.clock(),
            ...(this.ctx.templateId !== undefined ? { templateId: this.ctx.templateId } : {}),
            ...(this.ctx.journeyId !== undefined ? { journeyId: this.ctx.journeyId } : {}),
            ...(this.ctx.locale !== undefined ? { locale: this.ctx.locale } : {}),
        };
    }
    send(e) {
        this.sink.emit(e);
    }
    journeyStarted(templateId) {
        this.ctx = { ...this.ctx, templateId };
        this.send({ ...this.base(), type: "journey.started", templateId });
    }
    journeyResumed(journeyId) {
        this.ctx = { ...this.ctx, journeyId };
        this.send({ ...this.base(), type: "journey.resumed", journeyId });
    }
    stageEntered(stageId, step, total) {
        this.currentStage = stageId;
        this.stepViewedAt = this.now();
        this.send({ ...this.base(), type: "stage.entered", stageId, step, total });
    }
    stageCompleted(stageId, step, total) {
        this.send({ ...this.base(), type: "stage.completed", stageId, step, total, ...this.msOnStep() });
        this.send({ ...this.base(), type: "time.on.stage", stageId, step, total, ...this.msOnStep() });
    }
    journeyCompleted(journeyId, outcome) {
        this.send({ ...this.base(), type: "journey.completed", journeyId, ...(outcome ? { code: outcome } : {}) });
    }
    submissionSuccessful(journeyId, outcome) {
        this.send({ ...this.base(), type: "submission.successful", journeyId, ...(outcome ? { code: outcome } : {}) });
    }
    submissionFailed(journeyId, code) {
        this.send({ ...this.base(), type: "submission.failed", journeyId, code });
    }
    helpRequested(stageId) {
        this.send({ ...this.base(), type: "help.requested", stageId });
    }
    draftRestored(stageId) {
        this.send({ ...this.base(), type: "draft.restored", ...(stageId ? { stageId } : {}) });
    }
    themeChanged(scheme) {
        this.send({ ...this.base(), type: "theme.changed", code: scheme });
    }
    networkLost() {
        this.send({ ...this.base(), type: "network.lost" });
    }
    networkRestored() {
        this.send({ ...this.base(), type: "network.restored" });
    }
    stepViewed(stageId, step, total) {
        this.currentStage = stageId;
        this.stepViewedAt = this.now();
        this.send({ ...this.base(), type: "step.viewed", stageId, step, total });
    }
    stepCompleted(stageId, step, total) {
        this.send({ ...this.base(), type: "step.completed", stageId, step, total, ...this.msOnStep() });
    }
    validationFailed(stageId, fieldIds) {
        this.send({ ...this.base(), type: "validation.failed", stageId, fieldIds });
    }
    draftSaved(stageId) {
        this.send({ ...this.base(), type: "draft.saved", stageId });
    }
    journeySubmitted(journeyId, outcome) {
        this.send({ ...this.base(), type: "journey.submitted", journeyId, ...(outcome ? { code: outcome } : {}) });
    }
    stepAbandoned() {
        if (this.currentStage === undefined)
            return;
        this.send({ ...this.base(), type: "step.abandoned", stageId: this.currentStage, ...this.msOnStep() });
        this.currentStage = undefined;
        this.stepViewedAt = undefined;
    }
    languageChanged(locale) {
        this.ctx = { ...this.ctx, locale };
        this.send({ ...this.base(), type: "language.changed", locale });
    }
    error(code) {
        this.send({ ...this.base(), type: "journey.error", code });
    }
    msOnStep() {
        return this.stepViewedAt === undefined ? {} : { msOnStep: this.now() - this.stepViewedAt };
    }
}
