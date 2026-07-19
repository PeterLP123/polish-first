const THEME_KEY = "czesc-theme";
const THEME_COLORS = { light: "#f7f4ec", dark: "#15120e" };

// index.html applies the saved theme pre-paint; React syncs from the document.
export function getInitialTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be unavailable; the theme still applies for this session.
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme] ?? THEME_COLORS.light);
}
