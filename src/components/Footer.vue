<template>
  <v-footer>
    <v-card class="flex g5-footer" flat tile width="100%">
      <v-card-title class="secondary">
        <v-spacer />
        <v-tooltip v-if="!isDarkTheme" location="top">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon size="small" @click="toggleTheme">
              <v-icon>mdi-moon-waxing-crescent</v-icon>
            </v-btn>
          </template>
          <span>{{ $t("Navbar.DarkMode") }}</span>
        </v-tooltip>
        <v-tooltip v-else location="top">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon size="small" @click="toggleTheme">
              <v-icon>mdi-weather-sunny</v-icon>
            </v-btn>
          </template>
          <span>{{ $t("Navbar.DarkMode") }}</span>
        </v-tooltip>
        <v-menu location="top" open-on-hover>
          <template v-slot:activator="{ props }">
            <v-btn class="mx-4" icon size="small" v-bind="props">
              <v-icon size="24">mdi-translate</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(item, index) in languages"
              :key="index"
              @click="handleLanguage(item.Code)"
            >
              <v-list-item-title>{{ item.Language }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <v-btn
              class="mx-4"
              icon
              size="small"
              v-bind="props"
              :to="'/metrics'"
            >
              <v-icon size="24">mdi-information</v-icon>
            </v-btn>
          </template>
          <span>{{ $t("Footer.metrics") }}</span>
        </v-tooltip>
      </v-card-title>

      <v-card-text class="py-2 text-center">
        {{ new Date().getFullYear() }} —
        <strong>{{ $t("Footer.company") }}</strong> —
        {{ $t("Footer.powered") }}
      </v-card-text>
    </v-card>
  </v-footer>
</template>

<script>
const THEME_DARK = "cs2Dark";
const THEME_LIGHT = "cs2Light";

function themeName(vuetifyTheme) {
  const name = vuetifyTheme?.global?.name;
  return typeof name === "object" && name !== null ? name.value : name;
}

function applyDocumentTheme(name) {
  document.documentElement.dataset.theme = name || THEME_DARK;
}

export default {
  name: "Footer",
  data() {
    return {
      themeTick: 0,
      languages: [
        { Language: "English", Code: "en" },
        { Language: "Français", Code: "fr" },
        { Language: "日本語", Code: "jp" }
      ]
    };
  },
  computed: {
    isDarkTheme() {
      // themeTick forces recompute after toggle
      void this.themeTick;
      return themeName(this.$vuetify.theme) !== THEME_LIGHT;
    }
  },
  methods: {
    handleLanguage(command) {
      this.ChangeLanguage(command);
    },
    setTheme(name) {
      if (typeof this.$vuetify.theme.change === "function") {
        this.$vuetify.theme.change(name);
      } else {
        this.$vuetify.theme.global.name = name;
      }
      applyDocumentTheme(name);
      localStorage.setItem("theme", name === THEME_DARK ? "true" : "false");
      this.themeTick += 1;
    },
    toggleTheme() {
      this.setTheme(this.isDarkTheme ? THEME_LIGHT : THEME_DARK);
    }
  },
  mounted() {
    const language = localStorage.getItem("language");
    if (language) this.$i18n.locale = language;

    const theme = localStorage.getItem("theme");
    const initial =
      theme === "false" ? THEME_LIGHT : theme === "true" ? THEME_DARK : THEME_DARK;
    this.setTheme(initial);
  }
};
</script>
