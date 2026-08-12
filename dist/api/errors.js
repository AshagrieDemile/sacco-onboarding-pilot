export const REFERENCES = {
    network: "ERR-NET-001",
    service_unavailable: "ERR-SVC-001",
    internal_error: "ERR-SVC-002",
    conflict: "ERR-CON-001",
    completed: "ERR-CON-002",
    unprocessable_entity: "ERR-VAL-001",
    not_found: "ERR-NF-001",
    unknown_template: "ERR-CFG-001",
    missing_organisation: "ERR-CFG-002",
    missing_actor: "ERR-CFG-003",
    bad_request: "ERR-REQ-001",
};
export class ApiError extends Error {
    status;
    code;
    messageKey;
    correlationId;
    serverMessage;
    constructor(status, code, messageKey, correlationId, serverMessage) {
        super(serverMessage ?? code);
        this.status = status;
        this.code = code;
        this.messageKey = messageKey;
        this.correlationId = correlationId;
        this.serverMessage = serverMessage;
        this.name = "ApiError";
    }
    get reference() {
        return REFERENCES[this.code] ?? "ERR-UNKNOWN";
    }
}
const KNOWN_CODES = new Set([
    "bad_request",
    "missing_organisation",
    "missing_actor",
    "not_found",
    "conflict",
    "completed",
    "unknown_template",
    "unprocessable_entity",
    "internal_error",
    "service_unavailable",
]);
export const toApiError = (status, body, correlationId) => {
    const err = body?.error;
    let code = typeof err?.code === "string" ? err.code : status >= 500 ? "internal_error" : "bad_request";
    if (code === "proxy_error" || status === 502 || status === 503 || status === 504)
        code = "service_unavailable";
    const key = KNOWN_CODES.has(code) ? `apierror.${code}` : "apierror.internal_error";
    return new ApiError(status, code, key, err?.correlationId ?? correlationId, err?.message);
};
export const networkError = (cause) => new ApiError(0, "network", "apierror.network", undefined, cause instanceof Error ? cause.message : undefined);
