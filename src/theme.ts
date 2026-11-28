// Themes. A theme is data: its name, whether it's dark or light, the page's color tokens it changes
// (style.css's :root, such as "paper" for --paper) and its syntax colors. TIde's own two, TIde Dark
// and TIde Light, are style.css's tokens as they are, with the editor themes language.ts defines;
// every other theme sets its tokens on <html> and gets an editor theme built from them here. The
// terminal reads the same tokens (terminal.ts).
// - <html data-theme> is the theme's base, "dark" or "light", which style.css's light rules follow;
//   <html data-palette> is the theme's id.
// - The theme setting is a theme's id, or "system": TIde Dark or TIde Light, as the system is.
// - Extensions add themes with "contributes": { "themes": [...] } (extensions.ts).
// - The theme in use is kept for index.html, which paints it before anything else loads.
import * as monaco from "monaco-editor/editor/editor.api.js";
import { onSettingsChange, settings } from "./settings";

export type ThemeBase = "dark" | "light";

/** The page's color tokens a theme may set: style.css's --name, without the dashes. */
export const THEME_TOKENS = [
  "navy", "panel", "paper", "body", "lcd", "ink", "muted", "rule", "key", "key-wash", "warn", "danger", "ok", "scroll",
  "wave-top", "wave-mid", "wave-bot", "wave-end", "git-m", "git-a", "git-r", "git-u",
  ...Array.from({ length: 16 }, (_, i) => `ansi-${i}`),
] as const;
const TOKENS = new Set<string>(THEME_TOKENS);

/** The editor's syntax colors, by role. */
export interface ThemeSyntax {
  /** Plain text, variables and names. */
  text?: string;
  comment?: string;
  string?: string;
  number?: string;
  operator?: string;
  /** Keywords: TI-BASIC's If, For( and End; C's int and return. */
  keyword?: string;
  /** TI-BASIC's input and output commands (Disp, Output(…), and assembly's directives. */
  io?: string;
  /** Functions and built-in names. */
  function?: string;
  /** Types, such as C's int and struct names. The function color, if not set. */
  type?: string;
  /** Variables and other names. The text color, if not set. */
  variable?: string;
  /** Colons, commas and brackets. */
  delimiter?: string;
}
export const SYNTAX_KEYS: (keyof ThemeSyntax)[] = ["text", "comment", "string", "number", "operator", "keyword", "io", "function", "type", "variable", "delimiter"];

export interface Theme {
  /** Its id: the theme setting's value. */
  id: string;
  name: string;
  base: ThemeBase;
  /** Page tokens it changes (THEME_TOKENS), as #rrggbb colors; the rest are its base's. */
  colors?: Record<string, string>;
  /** Syntax colors it changes; the rest are its base's. */
  syntax?: ThemeSyntax;
  /** The extension it came from, if it isn't TIde's own. */
  source?: string;
}

const COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** TIde's own syntax colors, as language.ts's tide and tide-light themes have them (type and variable follow function and text). */
const BASE_SYNTAX: Record<ThemeBase, Omit<Required<ThemeSyntax>, "type" | "variable">> = {
  dark: { text: "#e3e9f3", comment: "#7486a8", string: "#86d9a8", number: "#f5c07a", operator: "#7dd3fc", keyword: "#38bdf8", io: "#c4b5fd", function: "#5eead4", delimiter: "#8b9cbb" },
  light: { text: "#1a2436", comment: "#6a7a96", string: "#15803d", number: "#b45309", operator: "#0369a1", keyword: "#1d4ed8", io: "#7c3aed", function: "#0f766e", delimiter: "#5a6883" },
};

// ── The themes that come with TIde ──
// TIde's own two; themes modeled on Visual Studio Code's built-in ones, so its colors feel familiar
// to anyone coming from it; and two of TIde's own looks, Graphite and LCD. The window's colors are
// fitted to TIde's tokens; the syntax colors are each theme's own.

/** VS Code's Dark Modern syntax colors. */
const MODERN_DARK: ThemeSyntax = {
  text: "#d4d4d4", comment: "#6a9955", string: "#ce9178", number: "#b5cea8", operator: "#d4d4d4", keyword: "#569cd6",
  io: "#c586c0", function: "#dcdcaa", type: "#4ec9b0", variable: "#9cdcfe", delimiter: "#d4d4d4",
};
/** VS Code's Light Modern syntax colors. */
const MODERN_LIGHT: ThemeSyntax = {
  text: "#000000", comment: "#008000", string: "#a31515", number: "#098658", operator: "#000000", keyword: "#0000ff",
  io: "#af00db", function: "#795e26", type: "#267f99", variable: "#001080", delimiter: "#3b3b3b",
};

const BUILT_IN: Theme[] = [
  { id: "dark", name: "TIde Dark", base: "dark" },
  { id: "light", name: "TIde Light", base: "light" },
  {
    id: "dark-modern", name: "Dark Modern", base: "dark",
    colors: {
      navy: "#181818", panel: "#181818", paper: "#1f1f1f", body: "#2a2d2e", lcd: "#2b2b2b", ink: "#cccccc", muted: "#9d9d9d",
      rule: "#2b2b2b", key: "#3794ff", "key-wash": "#04395e", warn: "#cca700", danger: "#f14c4c", ok: "#89d185", scroll: "#424242",
      "wave-top": "#0078d4", "wave-mid": "#181818", "wave-bot": "#181818", "wave-end": "#181818",
    },
    syntax: MODERN_DARK,
  },
  {
    id: "light-modern", name: "Light Modern", base: "light",
    colors: {
      navy: "#f8f8f8", panel: "#f8f8f8", paper: "#ffffff", body: "#ebebeb", lcd: "#f3f3f3", ink: "#3b3b3b", muted: "#6e6e6e",
      rule: "#e5e5e5", key: "#005fb8", "key-wash": "#e4e6f1", warn: "#9a6c02", danger: "#d1242f", ok: "#2e7d32", scroll: "#c4c4c4",
      "wave-top": "#005fb8", "wave-mid": "#005fb8", "wave-bot": "#005fb8", "wave-end": "#005fb8",
    },
    syntax: MODERN_LIGHT,
  },
  {
    id: "monokai", name: "Monokai", base: "dark",
    colors: {
      navy: "#1e1f1c", panel: "#1e1f1c", paper: "#272822", body: "#3e3d32", lcd: "#3e3d32", ink: "#f8f8f2", muted: "#a6a69c",
      rule: "#414339", key: "#66d9ef", "key-wash": "#49483e", warn: "#e6db74", danger: "#f92672", ok: "#a6e22e", scroll: "#5a5a4e",
      "wave-top": "#f92672", "wave-mid": "#414339", "wave-bot": "#414339", "wave-end": "#414339",
      "ansi-1": "#f92672", "ansi-2": "#a6e22e", "ansi-3": "#e6db74", "ansi-4": "#66d9ef", "ansi-5": "#ae81ff", "ansi-6": "#a1efe4", "ansi-7": "#f8f8f2",
    },
    // Comments a step lighter than Monokai's #75715e, so they read on its background.
    syntax: {
      text: "#f8f8f2", comment: "#8c8870", string: "#e6db74", number: "#ae81ff", operator: "#f92672", keyword: "#f92672",
      io: "#fd971f", function: "#a6e22e", type: "#66d9ef", variable: "#f8f8f2", delimiter: "#f8f8f2",
    },
  },
  {
    // Black and white with one bright accent: grey lines that stay visible without crowding,
    // and cyan for what you can press, what's selected and the status bar.
    id: "high-contrast-dark", name: "High Contrast Dark", base: "dark",
    colors: {
      navy: "#000000", panel: "#000000", paper: "#000000", body: "#141414", lcd: "#0a0a0a", ink: "#ffffff", muted: "#d0d0d0",
      rule: "#8a8a8a", key: "#38c6ff", "key-wash": "#003a57", warn: "#ffd700", danger: "#ff7b72", ok: "#7ee787", scroll: "#8a8a8a",
      "wave-top": "#38c6ff", "wave-mid": "#000000", "wave-bot": "#000000", "wave-end": "#000000",
    },
    syntax: {
      text: "#ffffff", comment: "#8fbf7a", string: "#ffa98a", number: "#c8f0b0", operator: "#ffffff", keyword: "#6cb8ff",
      io: "#e0a0f0", function: "#fff59d", type: "#5ff0d0", variable: "#b0e4ff", delimiter: "#ffffff",
    },
  },
  {
    // White and black with one deep accent: grey lines, and blue for what you can press,
    // what's selected and the status bar.
    id: "high-contrast-light", name: "High Contrast Light", base: "light",
    colors: {
      navy: "#ffffff", panel: "#ffffff", paper: "#ffffff", body: "#ededed", lcd: "#f5f5f5", ink: "#000000", muted: "#333333",
      rule: "#6b6b6b", key: "#0046b8", "key-wash": "#d6e4ff", warn: "#7a4b00", danger: "#b5200d", ok: "#1f5c00", scroll: "#6b6b6b",
      "wave-top": "#0046b8", "wave-mid": "#0046b8", "wave-bot": "#0046b8", "wave-end": "#0046b8",
    },
    syntax: {
      text: "#000000", comment: "#3d6b1f", string: "#a31515", number: "#096d48", operator: "#000000", keyword: "#0037a0",
      io: "#8b008b", function: "#5e2cbc", type: "#185e73", variable: "#001080", delimiter: "#000000",
    },
  },
  {
    // A neutral grey, like the TI-Nspire's case, with blue only for what you can press.
    id: "graphite", name: "Graphite", base: "dark",
    colors: {
      navy: "#1a1c20", panel: "#212327", paper: "#27292e", body: "#32353b", lcd: "#2d3035", ink: "#e4e6ea", muted: "#9aa0a8",
      rule: "#3a3d44", key: "#6cb6ff", "key-wash": "#2a3a4f", scroll: "#474b53", "wave-top": "#6cb6ff", "wave-mid": "#3b4252", "wave-bot": "#2b2f36", "wave-end": "#4a5262",
    },
    syntax: { text: "#e4e6ea", comment: "#8a919c", string: "#a8d5a2", number: "#f0c674", operator: "#9fb7d0", keyword: "#81a2be", io: "#c5a5d8", function: "#8abeb7", delimiter: "#9aa0a8" },
  },
  {
    // A calculator's screen: dark green-black on the grey-green of an unlit LCD.
    id: "lcd", name: "LCD", base: "light",
    colors: {
      navy: "#aab59c", panel: "#b9c4aa", paper: "#c8d3b8", body: "#b3bfa4", lcd: "#c0cbb0", ink: "#1c2617", muted: "#4d5b43",
      rule: "#a1ad93", key: "#243f25", "key-wash": "#b0c19d", warn: "#6b4f0f", danger: "#8a1f1f", ok: "#1f5a1f", scroll: "#98a48a",
      "wave-top": "#5a7350", "wave-mid": "#3d5434", "wave-bot": "#2a3b24", "wave-end": "#4f6745",
    },
    syntax: { text: "#1c2617", comment: "#5b6a51", string: "#2b4a1d", number: "#4f3d12", operator: "#2a3a22", keyword: "#0f1f0a", io: "#3b2f4f", function: "#1f4020", delimiter: "#4d5b43" },
  },
];

const themes = new Map<string, Theme>(BUILT_IN.map((t) => [t.id, t]));

/** Every theme, TIde's first, then extensions' by name. */
export function listThemes(): Theme[] {
  const all = [...themes.values()];
  return [...all.filter((t) => !t.source), ...all.filter((t) => t.source).sort((a, b) => a.name.localeCompare(b.name))];
}

/**
 * Adds a theme, as from an extension, after checking it: an id and a name, a base of "dark" or
 * "light", and colors that are #rrggbb (others are left out). A theme can't take the id of one
 * already there. Returns what takes it away again, or throws why it can't be added.
 */
export function registerTheme(raw: unknown, source: string): () => void {
  const t = raw as Partial<Theme> | null;
  if (!t || typeof t.id !== "string" || !/^[\w.-]+$/.test(t.id)) throw new Error('a theme needs an "id" of letters, digits, ".", "-" or "_"');
  if (typeof t.name !== "string" || !t.name.trim()) throw new Error(`the theme ${t.id} needs a "name"`);
  if (t.base !== "dark" && t.base !== "light") throw new Error(`the theme ${t.id}'s "base" is "dark" or "light"`);
  if (themes.has(t.id)) throw new Error(`there's already a theme called ${t.id}`);
  const colors = Object.fromEntries(
    Object.entries(t.colors ?? {}).filter(([k, v]) => TOKENS.has(k) && typeof v === "string" && COLOR.test(v)),
  );
  const syntax = Object.fromEntries(
    Object.entries(t.syntax ?? {}).filter(([k, v]) => SYNTAX_KEYS.includes(k as keyof ThemeSyntax) && typeof v === "string" && COLOR.test(v)),
  ) as ThemeSyntax;
  const theme: Theme = { id: t.id, name: t.name.trim(), base: t.base, colors, syntax, source };
  themes.set(theme.id, theme);
  if (currentId() === theme.id) applyTheme();
  return () => {
    if (themes.get(theme.id) !== theme) return;
    themes.delete(theme.id);
    if (settings().theme === theme.id) applyTheme(); // back to its base's TIde theme
  };
}

const systemLight = matchMedia("(prefers-color-scheme: light)");

/** The id the setting asks for: "system" is TIde Dark or TIde Light, as the system is. */
const currentId = () => {
  const choice = settings().theme;
  return choice === "system" ? (systemLight.matches ? "light" : "dark") : choice;
};

/** The theme in use. One that isn't there (an extension's, turned off) falls back to TIde Dark. */
export function currentTheme(): Theme {
  return themes.get(currentId()) ?? themes.get("dark")!;
}

/** Whether a light theme is showing. */
export const isLight = () => document.documentElement.dataset.theme === "light";

// ── Colors ──
const hex = (c: string) => {
  const s = c.trim().replace("#", "");
  const full = s.length === 3 ? [...s].map((d) => d + d).join("") : s.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
};
/** `a` mixed with `b`: t = 0 is a, 1 is b. Both #rgb or #rrggbb. */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [hex(a), hex(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
/** A token's value as the page has it now: the theme's, or its base's from style.css. */
export const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();

/** The editor's theme for a theme: language.ts's for TIde's own two, else built from its colors. */
function editorTheme(t: Theme): string {
  if (t.id === "dark") return "tide";
  if (t.id === "light") return "tide-light";
  const base = { ...BASE_SYNTAX[t.base], ...t.syntax };
  const s = { ...base, type: t.syntax?.type ?? base.function, variable: t.syntax?.variable ?? base.text };
  const c = (v: string) => v.replace("#", "");
  const [paper, ink, muted, key, rule, panel, warn, danger, scroll, wash] =
    ["paper", "ink", "muted", "key", "rule", "panel", "warn", "danger", "scroll", "key-wash"].map(token);
  const name = `tide-theme-${t.id}`;
  monaco.editor.defineTheme(name, {
    base: t.base === "light" ? "vs" : "vs-dark",
    inherit: false,
    rules: [
      { token: "", foreground: c(s.text) },
      { token: "comment", foreground: c(s.comment), fontStyle: "italic" },
      { token: "string", foreground: c(s.string) },
      { token: "number", foreground: c(s.number) },
      { token: "operator", foreground: c(s.operator) },
      { token: "keyword.control", foreground: c(s.keyword), fontStyle: "bold" },
      { token: "keyword.io", foreground: c(s.io) },
      { token: "support.function", foreground: c(s.function) },
      { token: "variable", foreground: c(s.variable) },
      { token: "delimiter", foreground: c(s.delimiter) },
      { token: "keyword", foreground: c(s.keyword), fontStyle: "bold" },
      { token: "keyword.directive", foreground: c(s.io), fontStyle: "" },
      { token: "type", foreground: c(s.type) },
      { token: "predefined", foreground: c(s.function) },
      { token: "identifier", foreground: c(s.variable) },
    ],
    colors: {
      "editor.background": paper,
      "editor.foreground": s.text,
      "editor.lineHighlightBackground": mix(paper, ink, 0.06),
      "editorLineNumber.foreground": mix(paper, muted, 0.75),
      "editorLineNumber.activeForeground": ink,
      "editorCursor.foreground": key,
      "editor.selectionBackground": mix(paper, key, 0.32),
      "editor.inactiveSelectionBackground": mix(paper, key, 0.18),
      "editorRuler.foreground": mix(paper, warn, 0.35),
      "editorIndentGuide.background1": mix(paper, rule, 0.8),
      "editorWidget.background": panel,
      "editorWidget.border": rule,
      "editorSuggestWidget.background": panel,
      "editorSuggestWidget.border": rule,
      "editorSuggestWidget.foreground": ink,
      "editorSuggestWidget.selectedBackground": wash,
      "editorSuggestWidget.highlightForeground": key,
      "editorHoverWidget.background": panel,
      "editorHoverWidget.border": rule,
      "editorError.foreground": danger,
      "editorWarning.foreground": warn,
      "scrollbarSlider.background": `${scroll}80`,
      "scrollbarSlider.hoverBackground": scroll,
    },
  });
  return name;
}

/** What index.html paints before anything loads: the theme's base and the tokens it sets. */
const PAINT_PREF = "tide-pref-theme-paint"; // not "tide:", which the browser store treats as a program

let set: string[] = [];
export function applyTheme() {
  const t = currentTheme();
  const root = document.documentElement;
  for (const name of set) root.style.removeProperty(`--${name}`);
  set = Object.keys(t.colors ?? {});
  for (const [name, value] of Object.entries(t.colors ?? {})) root.style.setProperty(`--${name}`, value);
  root.dataset.theme = t.base;
  root.dataset.palette = t.id;
  monaco.editor.setTheme(editorTheme(t));
  try { localStorage.setItem(PAINT_PREF, JSON.stringify({ base: t.base, colors: t.colors ?? {} })); } catch { /* storage unavailable */ }
}

/** The editor theme to start the editor with. */
export const startingEditorTheme = () => editorTheme(currentTheme());

/** Applies the theme now, and again when the setting or the system's mode changes. */
export function watchTheme() {
  applyTheme();
  onSettingsChange(applyTheme);
  systemLight.addEventListener("change", () => { if (settings().theme === "system") applyTheme(); });
}
