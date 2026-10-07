import { h } from "./h.js";
import { renderField } from "./fields.js";
import { evaluateBoolean } from "./expression.js";
import { groupOf } from "../standards/ethiopian.js";
import { personNameGroup, addressSelector } from "../components/semantic.js";
import { StageHeader, ErrorBanner } from "../components/library.js";
import { stageMeta, estimateRemainingMinutes } from "../presentation/stage-meta.js";
export const isFieldVisible = (field, ctx) => field.visible === undefined ? true : evaluateBoolean(field.visible, ctx);
export const isFieldRequired = (field, ctx) => {
    if (field.required === undefined)
        return false;
    if (typeof field.required === "boolean")
        return field.required;
    return evaluateBoolean(field.required, ctx);
};
export const renderJourney = (props) => {
    const { i18n, presentation, draft, errors } = props;
    const ctx = draft;
    const errorFor = new Map(errors.map((e) => [e.fieldId, e.messageKey]));
    const renderOne = (field) => {
        const value = draft[field.id];
        const isVerifiedMobile = field.semanticType === "ethiopian-mobile-number" && props.verifiedPhone !== undefined;
        const live = props.liveFieldIds?.has(field.id) === true;
        const money = props.moneyFieldIds?.has(field.id) === true;
        const readOnly = props.readOnlyFieldIds?.has(field.id) === true;
        return renderField(field, {
            i18n,
            required: isFieldRequired(field, ctx),
            onChange: (v) => props.onChange(field.id, v, live ? true : undefined),
            ...(readOnly && !isVerifiedMobile ? { readOnly: true } : {}),
            ...(field.semanticType === "signature" ? { answers: draft, justCleared: props.signatureCleared === true } : {}),
            ...(money ? { money: true, onBlur: () => props.onFieldBlur?.(field.id) } : {}),
            ...(isVerifiedMobile ? { value: props.verifiedPhone, readOnly: true } : value !== undefined ? { value } : { value: undefined }),
            ...(errorFor.has(field.id) ? { errorKey: errorFor.get(field.id) } : {}),
        });
    };
    const fields = (presentation.form?.fields ?? [])
        .filter((f) => isFieldVisible(f, ctx))
        .filter((f) => props.hiddenFieldIds?.has(f.id) !== true);
    const fieldNodes = [];
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const group = groupOf(field.id);
        if (group === undefined) {
            fieldNodes.push(renderOne(field));
            continue;
        }
        const run = [];
        while (i < fields.length && groupOf(fields[i].id) === group) {
            run.push(fields[i]);
            i++;
        }
        i--;
        const composite = { i18n, fields: run, draft, errorFor, onChange: props.onChange };
        fieldNodes.push(group === "name" ? personNameGroup(composite) : addressSelector(composite));
    }
    const meta = stageMeta(presentation.stageId, presentation.stageType);
    const { step, total } = presentation.progress;
    const resolve = (key, fallback) => {
        const v = i18n.t(key);
        if (v !== key)
            return v;
        const fb = i18n.t(fallback);
        return fb === fallback ? "" : fb;
    };
    const title = resolve(meta.titleKey, `stage.type.${presentation.stageType}.title`) || i18n.t(props.titleKey);
    const help = resolve(meta.helpKey, `stage.type.${presentation.stageType}.help`);
    return h("section", { class: "journey", "aria-labelledby": "journey-title" }, props.banner ?? "", StageHeader({
        journeyName: i18n.t(props.titleKey),
        icon: meta.icon,
        title,
        step,
        total,
        progressLabel: i18n.t("progress.step", { step, total }),
        remainingLabel: i18n.t("progress.remaining", { minutes: estimateRemainingMinutes(step, total) }),
        ...(help !== "" ? { helpText: help } : {}),
        langLabel: i18n.t(`language.${i18n.locale === "am" ? "en" : "am"}`),
        langAria: i18n.t("action.change_language"),
        onLanguage: props.onLanguage,
        ...(props.saveLabel !== undefined ? { saveLabel: props.saveLabel } : {}),
    }), errors.length > 0 ? ErrorBanner({ text: i18n.t("apierror.unprocessable_entity") }) : "", h("form", {
        class: "journey-form",
        novalidate: true,
        onSubmit: (e) => { e.preventDefault?.(); props.onSubmit?.(); },
    }, props.panelBefore ?? "", ...fieldNodes, props.panelAfter ?? ""), props.canPrevious && props.onPrevious
        ? h("div", { class: "stage-nav sticky-nav" }, h("button", { type: "button", class: "btn btn-previous stage-prev", onClick: props.onPrevious }, i18n.t("nav.previous")))
        : "");
};
