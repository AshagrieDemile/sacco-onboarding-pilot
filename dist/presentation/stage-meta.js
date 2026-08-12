export const STAGE_ICONS = {
    personal: "👤",
    identity: "🪪",
    address: "📍",
    contact: "📞",
    membership: "🏦",
    shares: "💰",
    savings: "💰",
    documents: "📄",
    declaration: "☑️",
    review: "✅",
    submitted: "🎉",
    welcome: "👋",
    confirm: "✅",
    complete: "🎉",
};
const TYPE_ICONS = {
    capture: "📝",
    evidence: "📄",
    consent: "☑️",
    verification: "🔎",
    review: "✅",
    decision: "⚖️",
    terminal: "🎉",
};
const hasIconForId = (stageId) => Object.prototype.hasOwnProperty.call(STAGE_ICONS, stageId);
export const stageMeta = (stageId, stageType) => ({
    icon: hasIconForId(stageId) ? STAGE_ICONS[stageId] : (TYPE_ICONS[stageType] ?? "•"),
    titleKey: `stage.${stageId}.title`,
    helpKey: `stage.${stageId}.help`,
});
export const AVG_MINUTES_PER_STAGE = 1.5;
export const estimateRemainingMinutes = (step, total) => {
    const remainingStages = Math.max(0, total - step + 1);
    return Math.max(1, Math.round(remainingStages * AVG_MINUTES_PER_STAGE));
};
