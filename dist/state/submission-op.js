const KEY_PREFIX = "op";
export const newOperationId = () => {
    const uuid = typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
    return `${KEY_PREFIX}-${uuid}`;
};
const stepLabel = (step) => {
    switch (step.kind) {
        case "start":
            return "start";
        case "submit":
            return `submit.${step.stageId}`;
        case "withdraw":
            return "withdraw";
    }
};
export const idempotencyKeyFor = (opId, step) => `${opId}.${stepLabel(step)}`;
