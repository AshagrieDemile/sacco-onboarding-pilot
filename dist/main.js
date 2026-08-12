import { DEFAULT_CONFIG, parseStartParam, catalogEntry } from "./config.js";
import { createStore } from "./state/store.js";
import { createDraftStore } from "./state/draft-store.js";
import { createNetworkMonitor, apiReachabilityProbe } from "./state/network-monitor.js";
import { createApiClient } from "./api/client.js";
import { createVerificationClient } from "./api/verification-client.js";
import { checkHealth } from "./api/connectivity.js";
import { recordRequest } from "./telemetry/diagnostics.js";
import { detectChannel } from "./channel/telegram-channel.js";
import { createBrowserChannel } from "./channel/browser-channel.js";
import { createApp } from "./app.js";
import { Telemetry, BufferSink } from "./telemetry/telemetry.js";
import { DEFAULT_LOCALE } from "./i18n/i18n.js";
const channel = detectChannel(createBrowserChannel);
const telemetry = new Telemetry(new BufferSink({ log: false }));
const start = parseStartParam(channel.startParam());
const organisationId = start.organisationId ?? DEFAULT_CONFIG.defaultOrganisationId;
const actorRef = channel.user()?.id ?? "anon";
const hostLang = channel.languageCode();
const initialLocale = hostLang === "en" ? "en" : DEFAULT_LOCALE;
const preselect = start.templateId ? catalogEntry(start.templateId) : undefined;
const store = createStore({
    screen: "connecting",
    locale: initialLocale,
    draft: {},
    errors: [],
    busy: preselect !== undefined,
    verification: { state: "UNVERIFIED" },
});
const api = createApiClient({ baseUrl: DEFAULT_CONFIG.apiBaseUrl, organisationId, actorRef, log: recordRequest });
const verification = createVerificationClient({ baseUrl: DEFAULT_CONFIG.apiBaseUrl, log: recordRequest });
const health = () => checkHealth(DEFAULT_CONFIG.apiBaseUrl, (url, init) => fetch(url, init).then((r) => ({ status: r.status, text: () => r.text() })));
const draftStore = createDraftStore();
const network = createNetworkMonitor({
    probeApi: apiReachabilityProbe(DEFAULT_CONFIG.apiBaseUrl, (url, init) => fetch(url, init).then((r) => ({ status: r.status, text: () => r.text() }))),
});
const root = document.getElementById("app");
if (root === null)
    throw new Error("missing #app root element");
createApp({
    root, store, channel, api, config: DEFAULT_CONFIG, telemetry, verification, health,
    draftStore, network, session: { organisationId, actorRef },
}).start(preselect);
