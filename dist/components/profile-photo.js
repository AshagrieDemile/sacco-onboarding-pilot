import { h } from "../render/h.js";
export const PHOTO_MAX_EDGE = 256;
export const PHOTO_QUALITY = 0.72;
export const fitDimensions = (w, h, max) => {
    if (w <= 0 || h <= 0)
        return { w: 0, h: 0 };
    const longest = Math.max(w, h);
    if (longest <= max)
        return { w: Math.round(w), h: Math.round(h) };
    const scale = max / longest;
    return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
};
export const downscaleFile = (file, max = PHOTO_MAX_EDGE, quality = PHOTO_QUALITY) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
        try {
            const { w, h } = fitDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height, max);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("no-2d-context"));
                return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", quality));
        }
        catch (e) {
            reject(e);
        }
        finally {
            URL.revokeObjectURL(url);
        }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image-load-failed")); };
    img.src = url;
});
const onPick = (onChange) => (e) => {
    const input = e.target;
    const file = input?.files?.[0];
    if (!file)
        return;
    void downscaleFile(file).then((dataUrl) => onChange(dataUrl)).catch(() => { });
    if (input)
        input.value = "";
};
export const profilePhotoControl = (p) => {
    const t = p.i18n.t.bind(p.i18n);
    const hasPhoto = typeof p.value === "string" && p.value.length > 0;
    const avatar = hasPhoto
        ? h("img", { class: "profile-photo-img", src: p.value, alt: t("photo.aria") })
        : h("div", { class: "profile-photo-placeholder", role: "img", "aria-label": t("photo.aria") }, "👤");
    const selfieInput = h("input", { type: "file", accept: "image/*", capture: "user", class: "profile-photo-input", id: "profile-photo-selfie", onChange: onPick(p.onChange) });
    const uploadInput = h("input", { type: "file", accept: "image/*", class: "profile-photo-input", id: "profile-photo-upload", onChange: onPick(p.onChange) });
    return h("section", { class: "profile-photo", "aria-label": t("photo.aria") }, avatar, h("div", { class: "profile-photo-actions" }, h("label", { class: "btn btn-secondary profile-photo-btn", for: "profile-photo-selfie" }, t("photo.take"), selfieInput), h("label", { class: "btn btn-secondary profile-photo-btn", for: "profile-photo-upload" }, hasPhoto ? t("photo.change") : t("photo.upload"), uploadInput), hasPhoto ? h("button", { type: "button", class: "btn btn-ghost profile-photo-remove", onClick: () => p.onChange(undefined) }, t("photo.remove")) : ""), h("p", { class: "profile-photo-hint" }, t("photo.hint")));
};
