export const getTelegramWebApp = () => {
    const tg = globalThis.Telegram?.WebApp;
    if (!tg || typeof tg.ready !== "function")
        return undefined;
    return typeof tg.initData === "string" && tg.initData.length > 0 ? tg : undefined;
};
class TgMain {
    b;
    current;
    constructor(b) {
        this.b = b;
    }
    show(text, onClick) {
        if (this.current)
            this.b.offClick(this.current);
        this.current = onClick;
        this.b.setText(text);
        this.b.onClick(onClick);
        this.b.enable();
        this.b.hideProgress();
        this.b.show();
    }
    hide() {
        if (this.current)
            this.b.offClick(this.current);
        this.current = undefined;
        this.b.hide();
    }
    setBusy(busy) {
        if (busy) {
            this.b.disable();
            this.b.showProgress(true);
        }
        else {
            this.b.hideProgress();
            this.b.enable();
        }
    }
}
class TgBack {
    b;
    current;
    constructor(b) {
        this.b = b;
    }
    show(onClick) {
        if (this.current)
            this.b.offClick(this.current);
        this.current = onClick;
        this.b.onClick(onClick);
        this.b.show();
    }
    hide() {
        if (this.current)
            this.b.offClick(this.current);
        this.current = undefined;
        this.b.hide();
    }
}
export const createTelegramChannel = (tg) => {
    const mainButton = new TgMain(tg.MainButton);
    const backButton = new TgBack(tg.BackButton);
    const user = () => {
        const u = tg.initDataUnsafe?.user;
        if (u?.id === undefined)
            return undefined;
        const displayName = [u.first_name, u.last_name].filter((s) => typeof s === "string").join(" ").trim();
        return {
            id: String(u.id),
            ...(displayName.length > 0 ? { displayName } : {}),
            ...(u.language_code ? { languageCode: u.language_code } : {}),
        };
    };
    return {
        key: "telegram",
        ready: () => {
            tg.ready();
            tg.expand();
        },
        user,
        initData: () => (tg.initData && tg.initData.length > 0 ? tg.initData : undefined),
        startParam: () => tg.initDataUnsafe?.start_param,
        themeParams: () => tg.themeParams,
        colorScheme: () => (tg.colorScheme === "dark" ? "dark" : "light"),
        onThemeChanged: (fn) => tg.onEvent("themeChanged", fn),
        languageCode: () => tg.initDataUnsafe?.user?.language_code,
        mainButton,
        backButton,
        haptic: (kind) => {
            const hf = tg.HapticFeedback;
            if (!hf)
                return;
            if (kind === "impact")
                hf.impactOccurred("light");
            else
                hf.notificationOccurred(kind === "success" ? "success" : "error");
        },
        close: () => tg.close(),
    };
};
export const detectChannel = (fallback) => {
    const tg = getTelegramWebApp();
    return tg ? createTelegramChannel(tg) : fallback();
};
