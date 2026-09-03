import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import sse from "./plugins/sse";
import api from "./utils/api.vue";
import translations from "./translations/translations.json";
import "./styles/main.scss";

const initialTheme =
  localStorage.getItem("theme") === "false" ? "cs2Light" : "cs2Dark";
document.documentElement.dataset.theme = initialTheme;

const i18n = createI18n({
  legacy: true,
  locale: "en",
  fallbackLocale: "en",
  messages: translations
});

const app = createApp(App);
app.use(router);
app.use(store);
app.use(i18n);
app.use(vuetify);
app.use(sse);
app.mixin(api);

if (typeof vuetify.theme.change === "function") {
  vuetify.theme.change(initialTheme);
} else {
  vuetify.theme.global.name = initialTheme;
}

app.mount("#app");
