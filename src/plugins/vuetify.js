import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";

const cs2Dark = {
  dark: true,
  colors: {
    background: "#0e1419",
    surface: "#1a222d",
    "surface-bright": "#232d3b",
    "surface-light": "#2a3544",
    primary: "#de9b35",
    secondary: "#3d4f63",
    accent: "#de9b35",
    error: "#e25555",
    info: "#4a90c8",
    success: "#3d9b6e",
    warning: "#de9b35",
    footer: "#121820"
  }
};

const cs2Light = {
  dark: false,
  colors: {
    background: "#eef1f5",
    surface: "#ffffff",
    "surface-bright": "#ffffff",
    "surface-light": "#f4f6f8",
    "on-background": "#1a222d",
    "on-surface": "#1a222d",
    primary: "#c47d1a",
    "on-primary": "#ffffff",
    secondary: "#3d4f63",
    "on-secondary": "#ffffff",
    accent: "#c47d1a",
    error: "#c62828",
    info: "#1565c0",
    success: "#2e7d32",
    warning: "#c47d1a",
    footer: "#de9b35"
  }
};

export default createVuetify({
  theme: {
    defaultTheme: "cs2Dark",
    themes: {
      cs2Dark,
      cs2Light
    }
  },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: { mdi }
  },
  defaults: {
    VBtn: {
      rounded: "sm",
      style: "text-transform: uppercase; letter-spacing: 0.06em; font-family: Rajdhani, sans-serif; font-weight: 600;"
    },
    VCard: {
      rounded: "sm",
      elevation: 0
    },
    VDataTable: {
      hover: true
    }
  }
});
