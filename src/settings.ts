// TIde's settings: a small typed store kept in localStorage, and the Settings page that edits it.

export interface Settings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  renderWhitespace: "none" | "boundary" | "all";
  showRuler: boolean;
  fallbackEncoding: string;
  sendClibs: boolean;
  checkUpdates: boolean;
  refreshScmOnFocus: boolean;
  shiftDeletes: boolean;
}

const DEFAULTS: Settings = {
  fontSize: 13, tabSize: 4, wordWrap: false, minimap: false, renderWhitespace: "none", showRuler: true,
  fallbackEncoding: "windows-1252", sendClibs: true, checkUpdates: true, refreshScmOnFocus: true, shiftDeletes: true,
};
const PREF = "tide-pref-settings"; // not "tide:", which the browser store treats as a program

let current: Settings = { ...DEFAULTS };
try { current = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREF) ?? "{}") }; } catch { /* storage unavailable or bad JSON */ }
const listeners = new Set<(s: Settings) => void>();

let project: Partial<Settings> = {};
/** The settings in use: yours, with the open project's tide.json "editor" values over them. */
export const settings = (): Readonly<Settings> => ({ ...current, ...project });
/** Your own settings, before the project's. */
export const userSettings = (): Readonly<Settings> => current;
/** Settings the open project sets, by name. */
export const projectSettings = (): Readonly<Partial<Settings>> => project;
export function setProjectSettings(values: Partial<Settings>) {
  project = Object.fromEntries(Object.entries(values).filter(([k]) => k in DEFAULTS)) as Partial<Settings>;
  for (const fn of listeners) fn(settings());
}
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  current = { ...current, [key]: value };
  try { localStorage.setItem(PREF, JSON.stringify(current)); } catch { /* storage unavailable */ }
  for (const fn of listeners) fn(settings());
}
export function onSettingsChange(fn: (s: Settings) => void) { listeners.add(fn); return () => listeners.delete(fn); }
export function resetSettings() {
  current = { ...DEFAULTS };
  try { localStorage.removeItem(PREF); } catch { /* storage unavailable */ }
  for (const fn of listeners) fn(settings());
}

// ── The Settings page ──

export type Control =
  | { kind: "toggle"; get: () => boolean; set: (v: boolean) => void }
  | { kind: "select"; get: () => string; set: (v: string) => void; options: [value: string, label: string][] }
  | { kind: "number"; get: () => number; set: (v: number) => void; min: number; max: number }
  | { kind: "button"; label: string; run: () => void };
export interface Row { section: string; label: string; description: string; control: Control }

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
}

function control(c: Control, id: string): HTMLElement {
  switch (c.kind) {
    case "toggle": {
      const input = el("input", { type: "checkbox", id, checked: c.get() });
      input.addEventListener("change", () => c.set(input.checked));
      return el("label", { className: "switch-toggle" }, input, el("span"));
    }
    case "select": {
      const select = el("select", { id }, ...c.options.map(([value, label]) => el("option", { value }, label)));
      select.value = c.get();
      select.addEventListener("change", () => c.set(select.value));
      return select;
    }
    case "number": {
      const input = el("input", { type: "number", id, min: c.min, max: c.max, value: String(c.get()) });
      input.addEventListener("change", () => {
        const n = Math.min(c.max, Math.max(c.min, Math.round(Number(input.value) || c.get())));
        input.value = String(n);
        c.set(n);
      });
      return input;
    }
    case "button":
      return el("button", { type: "button", id, className: "settings-button", onclick: c.run }, c.label);
  }
}

/** Builds the Settings page. Rows are rebuilt from `rows()` each time, so they show current values. */
export function settingsPage(rows: () => Row[]): HTMLElement {
  const search = el("input", { type: "search", placeholder: "Search settings", spellcheck: false });
  const list = el("div", { className: "settings-list" });
  const render = () => {
    const q = search.value.trim().toLowerCase();
    const shown = rows().filter(r => !q || `${r.section} ${r.label} ${r.description}`.toLowerCase().includes(q));
    const sections = [...new Set(shown.map(r => r.section))];
    list.replaceChildren(...(shown.length ? sections.flatMap(section => [
      el("h2", {}, section),
      ...shown.filter(r => r.section === section).map((r, i) => {
        const id = `setting-${section}-${i}`.replace(/\W+/g, "-");
        return el("div", { className: "setting" },
          el("div", { className: "setting-text" }, el("label", { htmlFor: id }, r.label), el("p", {}, r.description)),
          el("div", { className: "setting-control" }, control(r.control, id)));
      }),
    ]) : [el("p", { className: "hint" }, "No settings match.")]));
  };
  search.addEventListener("input", render);
  const page = el("div", { className: "settings-page" },
    el("div", { className: "settings-head" }, el("h1", {}, "Settings"), search), list);
  // Refresh values when the page is shown again (they may have changed from the status bar).
  new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) render(); }).observe(page);
  render();
  return page;
}
