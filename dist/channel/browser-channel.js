class DomMainButton {
    el;
    handler;
    ensure() {
        if (this.el)
            return this.el;
        const b = document.createElement("button");
        b.className = "tg-mainbutton";
        b.type = "button";
        b.addEventListener("click", () => this.handler?.());
        document.body.appendChild(b);
        this.el = b;
        return b;
    }
    show(text, onClick) {
        const b = this.ensure();
        this.handler = onClick;
        b.textContent = text;
        b.disabled = false;
        b.style.display = "block";
    }
    hide() {
        if (this.el)
            this.el.style.display = "none";
    }
    setBusy(busy) {
        if (this.el)
            this.el.disabled = busy;
    }
}
class DomBackButton {
    handler;
    show(onClick) {
        this.handler = onClick;
    }
    hide() {
        this.handler = undefined;
    }
    invoke() {
        this.handler?.();
    }
    get active() {
        return this.handler !== undefined;
    }
}
export const createBrowserChannel = () => {
    const mainButton = new DomMainButton();
    const backButton = new DomBackButton();
    const prefersDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
    const params = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
    return {
        key: "browser",
        ready: () => {
        },
        user: () => undefined,
        initData: () => undefined,
        startParam: () => params.get("start_param") ?? params.get("startapp") ?? undefined,
        themeParams: () => undefined,
        colorScheme: () => (prefersDark ? "dark" : "light"),
        onThemeChanged: () => {
        },
        languageCode: () => params.get("lang") ?? undefined,
        mainButton,
        backButton,
        haptic: () => {
        },
        close: () => {
        },
    };
};
