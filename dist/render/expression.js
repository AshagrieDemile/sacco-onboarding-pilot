const readVar = (path, ctx) => ctx[path];
const asNumber = (v) => typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined;
const compare = (left, right, num) => {
    const a = asNumber(left);
    const b = asNumber(right);
    if (a === undefined || b === undefined)
        return false;
    return num(a, b);
};
export const evaluate = (expr, ctx) => {
    switch (expr.op) {
        case "const":
            return expr.value;
        case "var":
            return readVar(expr.path, ctx) ?? null;
        case "not":
            return !toBool(evaluate(expr.expr, ctx));
        case "and":
            return expr.all.every((e) => toBool(evaluate(e, ctx)));
        case "or":
            return expr.any.some((e) => toBool(evaluate(e, ctx)));
        case "eq":
            return evaluate(expr.left, ctx) === evaluate(expr.right, ctx);
        case "ne":
            return evaluate(expr.left, ctx) !== evaluate(expr.right, ctx);
        case "gt":
            return compare(evaluate(expr.left, ctx), evaluate(expr.right, ctx), (a, b) => a > b);
        case "gte":
            return compare(evaluate(expr.left, ctx), evaluate(expr.right, ctx), (a, b) => a >= b);
        case "lt":
            return compare(evaluate(expr.left, ctx), evaluate(expr.right, ctx), (a, b) => a < b);
        case "lte":
            return compare(evaluate(expr.left, ctx), evaluate(expr.right, ctx), (a, b) => a <= b);
        case "in": {
            const v = evaluate(expr.value, ctx);
            return expr.set.includes(v);
        }
        case "isPresent": {
            const v = readVar(expr.path, ctx);
            return v !== undefined && v !== null && v !== "";
        }
        default:
            return false;
    }
};
export const toBool = (v) => v === true;
export const evaluateBoolean = (expr, ctx) => toBool(evaluate(expr, ctx));
