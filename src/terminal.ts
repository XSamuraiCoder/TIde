// The Terminal tab: xterm.js on a real shell (PowerShell on Windows, your $SHELL elsewhere), run on
// a pseudo-terminal by the desktop app (src-tauri/src/pty.rs). Colors, line editing, history, tab
// completion and full-screen programs work as in any terminal. The web version has no shell, so
// there it only says where to find one.
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { invoke } from "@tauri-apps/api/core";
import { mix, token } from "./theme";
import { mod } from "./keys";

/** TIde's navy, with the same ANSI colors as Output. */
const DARK = {
  background: "#0f1f3f", foreground: "#e3e9f3", cursor: "#38bdf8", cursorAccent: "#0f1f3f",
  selectionBackground: "#1e4a80", scrollbarSliderBackground: "#2a457980", scrollbarSliderHoverBackground: "#2a4579",
  black: "#4b5563", red: "#f87171", green: "#86d9a8", yellow: "#f5c07a", blue: "#7dd3fc", magenta: "#c4b5fd", cyan: "#5eead4", white: "#e3e9f3",
  brightBlack: "#8b9cbb", brightRed: "#fca5a5", brightGreen: "#bbf7d0", brightYellow: "#fde68a", brightBlue: "#bae6fd",
  brightMagenta: "#ddd6fe", brightCyan: "#99f6e4", brightWhite: "#ffffff",
};
/** Light mode's, as in style.css. */
const LIGHT = {
  background: "#ffffff", foreground: "#1a2436", cursor: "#0369a1", cursorAccent: "#ffffff",
  selectionBackground: "#bfdcf5", scrollbarSliderBackground: "#c2cddd80", scrollbarSliderHoverBackground: "#c2cddd",
  black: "#4b5563", red: "#dc2626", green: "#15803d", yellow: "#a16207", blue: "#0369a1", magenta: "#7c3aed", cyan: "#0f766e", white: "#94a3b8",
  brightBlack: "#6b7280", brightRed: "#ef4444", brightGreen: "#16a34a", brightYellow: "#ca8a04", brightBlue: "#0284c7",
  brightMagenta: "#8b5cf6", brightCyan: "#0d9488", brightWhite: "#1a2436",
};
/** The terminal's colors: TIde's own two themes have theirs; any other's come from its tokens (theme.ts). */
const themeNow = () => {
  const palette = document.documentElement.dataset.palette;
  if (!palette || palette === "dark") return DARK;
  if (palette === "light") return LIGHT;
  const [paper, ink, key, scroll] = ["paper", "ink", "key", "scroll"].map(token);
  const ansi = Array.from({ length: 16 }, (_, i) => token(`ansi-${i}`));
  const light = document.documentElement.dataset.theme === "light";
  return {
    background: paper, foreground: ink, cursor: key, cursorAccent: paper,
    selectionBackground: mix(paper, key, 0.32), scrollbarSliderBackground: `${scroll}80`, scrollbarSliderHoverBackground: scroll,
    black: ansi[0], red: ansi[1], green: ansi[2], yellow: ansi[3], blue: ansi[4], magenta: ansi[5], cyan: ansi[6],
    // On a light paper, white is the muted grey (as TIde Light has it), or it couldn't be seen.
    white: light ? token("muted") : ansi[7],
    brightBlack: ansi[8], brightRed: ansi[9], brightGreen: ansi[10], brightYellow: ansi[11], brightBlue: ansi[12],
    brightMagenta: ansi[13], brightCyan: ansi[14], brightWhite: light ? ink : ansi[15],
  };
};

/** Keys TIde keeps while the terminal has focus: Ctrl+` and Ctrl+Shift+U (Cmd+Shift+U on macOS), the panel's own toggles. */
const forTide = (e: KeyboardEvent) =>
  (e.key === "`" && e.ctrlKey && !e.metaKey) || (mod(e) && e.shiftKey && e.key.toLowerCase() === "u");

export interface TideTerminal {
  el: HTMLElement;
  /** Shows the terminal: starts the shell the first time, and after it ends. */
  show(): void;
  focus(): void;
  clear(): void;
  /** Ends the shell and starts a new one, in `dir` if given. */
  restart(dir?: string): void;
  /** Whether a shell is running. */
  readonly running: boolean;
}

export function createTerminal(opts: {
  desktop: boolean;
  /** Where a new shell starts: the open folder, or home. */
  startDir: () => Promise<string>;
}): TideTerminal {
  const el = Object.assign(document.createElement("div"), { className: "term-host" });
  const term = new Terminal({
    fontFamily: getComputedStyle(document.body).getPropertyValue("--mono") || "monospace",
    fontSize: 13,
    lineHeight: 1.15,
    theme: themeNow(),
    cursorBlink: true,
    scrollback: 10000,
    allowProposedApi: false,
    macOptionIsMeta: true,
    rightClickSelectsWord: false,
  });
  // The bundled code font may load after the terminal measured its cells: setting it again re-measures.
  void document.fonts.load('13px "JetBrains Mono Variable"').then(() => {
    term.options.fontFamily = getComputedStyle(document.body).getPropertyValue("--mono") || "monospace";
  });
  // Follows the theme (theme.ts sets these attributes).
  new MutationObserver(() => { term.options.theme = themeNow(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette"] });
  const fit = new FitAddon();
  term.loadAddon(fit);
  // Links open in your browser.
  term.loadAddon(new WebLinksAddon((_e, url) => {
    if (opts.desktop) void import("@tauri-apps/plugin-opener").then(o => o.openUrl(url));
    else window.open(url, "_blank", "noopener");
  }));

  let opened = false;
  let id: number | null = null;
  let starting = false;
  /** After the shell ends, Enter starts another. */
  let ended = false;

  // One listener for every shell's output and end, told apart by id.
  if (opts.desktop) {
    void import("@tauri-apps/api/event").then(({ listen }) => {
      void listen<{ id: number; data: string }>("pty://output", e => { if (e.payload.id === id) term.write(e.payload.data); });
      void listen<{ id: number; code: number | null }>("pty://exit", e => {
        if (e.payload.id !== id) return;
        id = null;
        ended = true;
        const how = e.payload.code ? ` with exit code ${e.payload.code}` : "";
        term.write(`\r\n\x1b[90m[The shell ended${how}. Press Enter to start a new one.]\x1b[0m\r\n`);
      });
    });
  }

  async function start(dir?: string) {
    if (!opts.desktop || id !== null || starting) return;
    starting = true;
    ended = false;
    fitNow();
    const next = Math.floor(Math.random() * 0x7fffffff);
    try {
      id = next;
      await invoke("pty_open", { id: next, dir: dir ?? (await opts.startDir()), cols: term.cols, rows: term.rows });
    } catch (err) {
      id = null;
      ended = true;
      term.write(`\x1b[31m${err}\x1b[0m\r\n\x1b[90m[Press Enter to try again.]\x1b[0m\r\n`);
    } finally {
      starting = false;
    }
  }

  term.onData(data => {
    if (id !== null) { void invoke("pty_write", { id, data }).catch(() => {}); return; }
    if (ended && data.includes("\r")) { term.clear(); void start(); }
  });
  term.onResize(({ cols, rows }) => { if (id !== null) void invoke("pty_resize", { id, cols, rows }).catch(() => {}); });

  // Ctrl+C copies when there's a selection (and interrupts otherwise); Ctrl+V and Ctrl+Shift+V paste.
  // On macOS that's Cmd+C and Cmd+V, and Ctrl+C always interrupts.
  term.attachCustomKeyEventHandler(e => {
    if (e.type !== "keydown") return true;
    if (forTide(e)) return false;
    const key = e.key.toLowerCase();
    if (mod(e) && key === "c" && term.hasSelection()) {
      void navigator.clipboard.writeText(term.getSelection());
      term.clearSelection();
      return false;
    }
    // Returning false leaves the key to the browser, whose paste event xterm.js then handles.
    if (mod(e) && key === "v") return false;
    return true;
  });
  // TIde's own shortcuts (Ctrl+S, F5, Ctrl+W…) stay out of the terminal's way, except its toggles.
  el.addEventListener("keydown", e => { if (!forTide(e)) e.stopPropagation(); });

  function fitNow() {
    if (!opened || !el.offsetParent) return;
    try { fit.fit(); } catch { /* not laid out yet */ }
  }
  new ResizeObserver(() => fitNow()).observe(el);
  // A new code font from Settings (fonts.ts): measure the cells again and refit.
  window.addEventListener("tide-fonts", () => {
    term.options.fontFamily = getComputedStyle(document.body).getPropertyValue("--mono") || "monospace";
    fitNow();
  });

  return {
    el,
    show() {
      if (!opened) {
        opened = true;
        term.open(el);
        if (!opts.desktop) term.write("\x1b[90mThe terminal is in the desktop app. Builds in the web version show their logs in Output.\x1b[0m\r\n");
      }
      requestAnimationFrame(() => {
        fitNow();
        if (id === null && !ended) void start();
      });
    },
    focus: () => term.focus(),
    clear: () => term.clear(),
    restart(dir) {
      const old = id;
      id = null;
      ended = false;
      if (old !== null) void invoke("pty_kill", { id: old }).catch(() => {});
      term.reset();
      void start(dir);
    },
    get running() { return id !== null; },
  };
}
