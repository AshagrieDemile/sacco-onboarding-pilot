export const h = (tag, props = {}, ...children) => ({
    tag,
    props,
    children: children.flat(),
});
export const isVNode = (v) => typeof v === "object" && v !== null && "tag" in v && "children" in v;
export const textOf = (node) => {
    if (node === null || node === undefined || node === false)
        return "";
    if (typeof node === "string")
        return node;
    if (typeof node === "number")
        return String(node);
    return node.children.map(textOf).join("");
};
export const findNode = (node, pred) => {
    if (!isVNode(node))
        return undefined;
    if (pred(node))
        return node;
    for (const c of node.children) {
        const found = findNode(c, pred);
        if (found)
            return found;
    }
    return undefined;
};
export const findAll = (node, pred) => {
    const out = [];
    const walk = (n) => {
        if (!isVNode(n))
            return;
        if (pred(n))
            out.push(n);
        for (const c of n.children)
            walk(c);
    };
    walk(node);
    return out;
};
