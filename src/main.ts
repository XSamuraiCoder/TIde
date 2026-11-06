import * as monaco from "monaco-editor/editor/editor.api.js";
// The bare API ships no editor widgets, so the full entry is imported for its side effects.
import "monaco-editor"; // full entry: registers suggest, hover, parameter hints, folding and marker navigation
import editorWorker from "monaco-editor/editor/editor.worker.js?worker";
import "./style.css";
import { CATALOG, languageFor, registerTiBasic } from "./language";
import { C_CATALOG, registerC } from "./c-support";                        // ← CHANGED: full catalog, not just snippets
import { PY_CATALOG, registerPy2ez80, watchPython } from "./py2ez80-support"; // ← CHANGED: py2ez80 support
import { registerIntellisense, watchModel } from "./intellisense";
import { tokenize } from "./build";
import { exportProgram } from "./export";
import { fs, normalizeName, store, type Entry } from "./store";

(self as unknown as { MonacoEnvironment: object }).MonacoEnvironment = { getWorker: () => new editorWorker() };

const SCREEN_COLS = 26;

/** One open editor tab: either a TI-BASIC program from the store or a file from the open project folder. */
interface Doc {
  id: string;        // "prgm:NAME" or "file:/absolute/path"
  label: string;     // tab title
  hint?: string;     // tab tooltip (full path for project files)
  language: string;
  model: monaco.editor.ITextModel;
  savedVersion: number;
  write: (source: string) => Promise<void>;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const els = {
  find: $<HTMLInputElement>("find"),
  list: $("list"),
  listEmpty: $("list-empty"),
  tabs: $("tabs"),
  empty: $("empty"),
  msg: $("status-msg"),
  pos: $("status-pos"),
  size: $("status-size"),
  gutter: $<HTMLButtonElement>("gutter"),
  problems: $<HTMLButtonElement>("problems"),
  catFind: $<HTMLInputElement>("cat-find"),
  catalog: $("catalog"),
  openFolder: $<HTMLButtonElement>("open-folder"),
  projectName: $("project-name"),
  tree: $("tree"),
  treeEmpty: $("tree-empty"),
  exportBtn: $<HTMLButtonElement>("export"),
};

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, props: Partial<HTMLElementTagNameMap[K]> & { role?: string } = {}, ...kids: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  if (props.role) node.setAttribute("role", props.role);
  node.append(...kids);
  return node;
}

// ── State ──────────────────────────────────────────────────────────────────

registerTiBasic();
registerC();
registerPy2ez80();                                                        // ← CHANGED
registerIntellisense();

// The calculator shows a ":" before every line. It is a gutter, not file content, so saved programs stay clean.
const GUTTER_PREF = "tide-pref-numbers"; // must not start with "tide:" or the browser store lists it as a program
const PROJECT_PREF = "tide-pref-project"; // same rule
const BUILD_PREF = "tide-pref-builds"; // same rule
let showNumbers = false;
try { showNumbers = localStorage.getItem(GUTTER_PREF) === "1"; } catch { /* storage unavailable */ }

function gutterOptions(): Pick<monaco.editor.IEditorOptions, "lineNumbers" | "lineNumbersMinChars"> {
  return showNumbers
    ? { lineNumbers: "on", lineNumbersMinChars: 3 }
    : { lineNumbers: () => ":", lineNumbersMinChars: 1 };
}

const editor = monaco.editor.create($("editor"), {
  model: null,
  theme: "tide",
  automaticLayout: true,
  fontSize: 13,
  lineHeight: 22,
  fontFamily: getComputedStyle(document.body).getPropertyValue("--mono"),
  minimap: { enabled: false },
  rulers: [SCREEN_COLS - 1], // the calculator's editor fits 26 columns including the leading ":"
  scrollBeyondLastLine: false,
  folding: true,
  showFoldingControls: "mouseover",
  quickSuggestions: { other: true, comments: false, strings: false },
  wordBasedSuggestions: "off",
  suggest: { showWords: false, snippetsPreventQuickSuggestions: false },
  acceptSuggestionOnEnter: "smart",
  tabCompletion: "on",
  fixedOverflowWidgets: true,
  glyphMargin: false,
  ...gutterOptions(),
  lineDecorationsWidth: 4,
  overviewRulerLanes: 0,
  contextmenu: false,
  padding: { top: 10 },
});

const docs = new Map<string, Doc>();
let tabOrder: string[] = [];
let active: string | null = null;
let names: string[] = [];

// Build state: tokenize errors per program name, so the list can flag ones that won't build.
const buildErrors = new Map<string, number>();

// Project folder: entries are loaded one directory at a time, when it is first expanded.
let project: { root: string; name: string } | null = null;
const dirCache = new Map<string, Entry[]>();
const expanded = new Set<string>();

const progId = (name: string) => `prgm:${name}`;
const fileId = (path: string) => `file:${path}`;
const baseName = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;
const isDirty = (d: Doc) => d.model.getAlternativeVersionId() !== d.savedVersion;
const activeDoc = () => (active ? docs.get(active) : undefined);
const mod = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;
const isBasic = () => (activeDoc()?.language ?? "tibasic") === "tibasic";

// ── Actions ────────────────────────────────────────────────────────────────

function addDoc(init: Pick<Doc, "id" | "label" | "hint" | "language" | "write"> & { source: string }): Doc {
  const model = monaco.editor.createModel(init.source, init.language);
  const doc: Doc = {
    id: init.id, label: init.label, hint: init.hint, language: init.language,
    model, savedVersion: model.getAlternativeVersionId(), write: init.write,
  };
  docs.set(doc.id, doc);
  model.onDidChangeContent(refresh);
  if (doc.language === "tibasic") watchModel(model);
  else {
    model.updateOptions({ tabSize: 4, insertSpaces: true });
    if (doc.language === "python") watchPython(model);
  }
  return doc;
}

function activate(id: string, note?: string) {
  const doc = docs.get(id);
  if (!doc) return;
  if (!tabOrder.includes(id)) tabOrder.push(id);
  active = id;
  editor.setModel(doc.model);
  applyEditorMode();
  editor.focus();
  setMessage(note ?? `Opened ${doc.label}`);
  refresh();
}

async function openProgram(name: string, note?: string) {
  const id = progId(name);
  if (!docs.has(id)) {
    const source = await store.load(name);
    if (!docs.has(id)) addDoc({ id, label: name, language: "tibasic", source, write: s => store.save(name, s) });
  }
  activate(id, note);
}

async function openFile(entry: Entry) {
  const id = fileId(entry.path);
  if (!docs.has(id)) {
    let source: string;
    try {
      source = await fs.readFile(entry.path);
    } catch (err) {
      setMessage(`Can't open ${entry.name}: ${err}`);
      return;
    }
    if (!docs.has(id)) {
      addDoc({
        id, label: entry.name, hint: entry.path, language: languageFor(entry.name), source,
        write: s => fs.writeFile(entry.path, s),
      });
    }
  }
  activate(id);
}

async function createProgram(name: string) {
  if (!names.includes(name)) {
    await store.save(name, "");
    names = [...names, name].sort();
    buildErrors.set(name, 0);
    await openProgram(name, `Created ${name}`);
  } else {
    await openProgram(name);
  }
}

async function saveActive() {
  const doc = activeDoc();
  if (!doc) return;
  try {
    await doc.write(doc.model.getValue());
    doc.savedVersion = doc.model.getAlternativeVersionId();
    if (doc.language === "tibasic") buildErrors.set(doc.label, tokenize(doc.model.getValue()).errors.length);
    setMessage(`Saved ${doc.label}`);
  } catch (err) {
    setMessage(`Could not save ${doc.label}: ${err}`);
  }
  refresh();
}

/** Where each program was last built, so a rebuild can skip the save dialog. */
function buildPaths(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(BUILD_PREF) ?? "{}"); } catch { return {}; }
}
function rememberBuild(name: string, path: string | null) {
  const paths = buildPaths();
  if (path) paths[name] = path; else delete paths[name];
  try { localStorage.setItem(BUILD_PREF, JSON.stringify(paths)); } catch { /* storage unavailable */ }
}

/** Tokenizes the active TI-BASIC program and writes a real .8xp the calculator accepts. Asks where only the first time, or when `pick` is set. */
async function exportActive(pick = false) {
  const doc = activeDoc();
  if (!doc) return setMessage("Nothing to build.");
  if (doc.language !== "tibasic") return setMessage("Only TI-BASIC programs build to .8xp.");
  if (isDirty(doc)) await saveActive();
  const { bytes, errors } = tokenize(doc.model.getValue());
  let path: string | null;
  try {
    path = await exportProgram(doc.label, bytes, pick ? undefined : buildPaths()[doc.label]);
  } catch (err) {
    return setMessage(`Could not build ${doc.label}: ${err}`);
  }
  if (!path) return; // cancelled the save dialog
  if (fs.available) rememberBuild(doc.label, path);
  setMessage(errors.length
    ? `Built ${path} — ${errors.length} character${errors.length === 1 ? "" : "s"} had no token and were skipped.`
    : `Built ${path}`);
}

/** Tokenize every stored program so the list can show which ones build cleanly. */
async function checkPrograms() {
  const sources = await Promise.all(names.map(n => store.load(n)));
  names.forEach((n, i) => buildErrors.set(n, tokenize(sources[i]).errors.length));
  renderList();
}

function closeTab(id: string) {
  const doc = docs.get(id);
  if (doc && isDirty(doc) && !confirm(`${doc.label} has unsaved changes. Close without saving?`)) return;
  const index = tabOrder.indexOf(id);
  tabOrder = tabOrder.filter(n => n !== id);
  doc?.model.dispose();
  docs.delete(id);
  if (active === id) {
    active = tabOrder[Math.min(index, tabOrder.length - 1)] ?? null;
    editor.setModel(active ? docs.get(active)!.model : null);
    applyEditorMode();
  }
  refresh();
}

async function deleteProgram(name: string) {
  if (!confirm(`Delete ${name}? This can't be undone.`)) return;
  try {
    await store.remove(name);
  } catch (err) {
    setMessage(`Could not delete ${name}: ${err}`);
    return;
  }
  names = names.filter(n => n !== name);
  buildErrors.delete(name);
  rememberBuild(name, null);
  const doc = docs.get(progId(name));
  if (doc) { doc.savedVersion = doc.model.getAlternativeVersionId(); closeTab(doc.id); }
  setMessage(`Deleted ${name}`);
  refresh();
}

async function loadProject(root: string, reveal = true) {
  const entries = await fs.readDir(root);
  dirCache.clear();
  expanded.clear();
  dirCache.set(root, entries);
  project = { root, name: baseName(root) };
  try { localStorage.setItem(PROJECT_PREF, root); } catch { /* storage unavailable */ }
  if (reveal) showPane("files");
  renderTree();
  setMessage(`Opened folder ${project.name}`);
}

async function openFolder() {
  if (!fs.available) { setMessage("Opening folders needs the desktop app."); return; }
  try {
    const root = await fs.pickFolder();
    if (root) await loadProject(root);
  } catch (err) {
    setMessage(`Could not open folder: ${err}`);
  }
}

async function toggleDir(entry: Entry) {
  if (expanded.has(entry.path)) {
    expanded.delete(entry.path);
  } else {
    expanded.add(entry.path);
    if (!dirCache.has(entry.path)) {
      try {
        dirCache.set(entry.path, await fs.readDir(entry.path));
      } catch (err) {
        expanded.delete(entry.path);
        setMessage(`Can't read ${entry.name}: ${err}`);
      }
    }
  }
  renderTree();
}

function setMessage(text: string) { els.msg.textContent = text; els.msg.title = text; }

// ── Rendering ──────────────────────────────────────────────────────────────

function renderList() {
  const query = els.find.value.toUpperCase();
  const shown = names.filter(n => n.includes(query));
  els.list.replaceChildren(...shown.map(n => {
    const doc = docs.get(progId(n));
    // Open programs are checked live against their model; closed ones use the last checked source.
    const errors = doc ? tokenize(doc.model.getValue()).errors.length : buildErrors.get(n) ?? 0;
    const row = h("li", { role: "option", tabIndex: 0 },
      ...(errors ? [h("span", { className: "bad", title: `${errors} character${errors === 1 ? "" : "s"} won't tokenize — the .8xp will skip them.` }, "!")] : []),
      h("span", { className: "name" }, n),
      ...(doc && isDirty(doc) ? [h("span", { className: "unsaved", title: "Unsaved changes" }, "●")] : []),
      h("button", { className: "del", title: `Delete ${n}`, onclick: (e: Event) => { e.stopPropagation(); void deleteProgram(n); } }, "×"),
    );
    row.setAttribute("aria-selected", String(progId(n) === active));
    row.onclick = () => void openProgram(n);
    row.onkeydown = e => { if (e.key === "Enter") void openProgram(n); };
    return row;
  }));
  els.listEmpty.hidden = names.length > 0 || !!query;
}

function treeRows(path: string, depth: number, out: HTMLElement[]) {
  for (const entry of dirCache.get(path) ?? []) {
    const open = entry.isDir && expanded.has(entry.path);
    const row = h("li", { role: "treeitem", tabIndex: 0, title: entry.path },
      h("span", { className: "twisty" }, entry.isDir ? (open ? "▾" : "▸") : ""),
      h("span", { className: "name" }, entry.name),
    );
    row.style.paddingLeft = `${10 + depth * 14}px`;
    if (entry.isDir) row.setAttribute("aria-expanded", String(open));
    row.setAttribute("aria-selected", String(!entry.isDir && fileId(entry.path) === active));
    const act = () => void (entry.isDir ? toggleDir(entry) : openFile(entry));
    row.onclick = act;
    row.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } };
    out.push(row);
    if (open) treeRows(entry.path, depth + 1, out);
  }
}

function renderTree() {
  els.projectName.textContent = project?.name ?? "No folder open";
  els.projectName.title = project?.root ?? "";
  els.treeEmpty.hidden = project !== null;
  const rows: HTMLElement[] = [];
  if (project) treeRows(project.root, 0, rows);
  els.tree.replaceChildren(...rows);
}

function renderTabs() {
  els.tabs.replaceChildren(...tabOrder.map(id => {
    const doc = docs.get(id)!;
    const tab = h("div", { className: "tab", role: "tab", tabIndex: 0, title: doc.hint ?? doc.label, onclick: () => activate(id) },
      doc.label,
      ...(isDirty(doc) ? [h("span", { className: "dirty", title: "Unsaved changes" })] : []),
      h("button", { className: "close", title: `Close ${doc.label}`, onclick: (e: Event) => { e.stopPropagation(); closeTab(id); } }, "×"),
    );
    tab.setAttribute("aria-selected", String(id === active));
    return tab;
  }));
}

const overflow = editor.createDecorationsCollection();
/** Mark text past column 25 (column 26 is taken by the ":"), which wraps on the calculator. */
function markOverflow() {
  const doc = activeDoc();
  if (!doc || doc.language !== "tibasic") { overflow.clear(); return; }
  const marks: monaco.editor.IModelDeltaDecoration[] = [];
  doc.model.getLinesContent().forEach((text, i) => {
    if (text.length < SCREEN_COLS) return;
    marks.push({
      range: new monaco.Range(i + 1, SCREEN_COLS, i + 1, text.length + 1),
      options: { inlineClassName: "overflow", hoverMessage: { value: "Wraps onto a new row on the calculator." } },
    });
  });
  overflow.set(marks);
}

/** What the catalog shows depends on the toolchain of the active tab. */
function catalogGroups(): { group: string; entries: { name: string; insert: string; hint: string; detail?: string }[] }[] {
  const doc = activeDoc();
  if (!doc || doc.language === "tibasic") return CATALOG;
  if (doc.language === "c" || doc.language === "cpp") return C_CATALOG; // the CE toolchain builds C++ too
  if (doc.language === "python") return PY_CATALOG;
  return [];
}

function renderCatalog() {
  const q = els.catFind.value.trim().toLowerCase();
  const groups = catalogGroups();
  const nodes = groups.flatMap(group => {
    const entries = group.entries.filter(e => !q || `${e.name} ${e.hint} ${e.detail ?? ""}`.toLowerCase().includes(q));
    if (!entries.length) return [];
    return [
      h("h3", {}, group.group),
      ...entries.map(e => {
        const hint = e.hint.replace(/`/g, "");
        return h("button", { className: "item", type: "button", title: [e.detail, hint].filter(Boolean).join("\n"), onclick: () => insertSnippet(e.insert) },
          h("code", {}, e.name), ...(hint ? [h("span", {}, hint)] : []));
      }),
    ];
  });
  const none = groups.length ? "Nothing matches." : "No catalog for this file type.";
  els.catalog.replaceChildren(...(nodes.length ? nodes : [h("p", { className: "hint" }, none)]));
}

/** Inserts catalog text at the cursor. Monaco snippet syntax ($0, ${1:…}) expands into tab stops. */
function insertSnippet(text: string) {
  if (!activeDoc()) { setMessage("Open a program to insert commands."); return; }
  editor.focus();
  // Standalone Monaco has no "editor.action.insertSnippet" command; the snippet controller is the way in.
  editor.getContribution<monaco.editor.IEditorContribution & { insert(template: string): void }>("snippetController2")?.insert(text);
  if (text.endsWith("(")) editor.trigger("catalog", "editor.action.triggerParameterHints", null);
}

/** Arrow keys walk the catalog; Up from the first item goes back to the search box. */
function catalogKeys(e: KeyboardEvent) {
  if (e.key === "Escape") { e.preventDefault(); editor.focus(); return; }
  const items = [...els.catalog.querySelectorAll<HTMLButtonElement>(".item")];
  if (e.key === "Enter" && e.target === els.catFind) {
    e.preventDefault();
    // Best match, not first listed: "sin(" must pick sin( over asin(.
    const q = els.catFind.value.trim().toLowerCase();
    const named = (test: (name: string) => boolean) => items.find(i => test(i.querySelector("code")!.textContent!.toLowerCase()));
    (named(n => n === q) ?? named(n => n.startsWith(q)) ?? items[0])?.click();
    return;
  }
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  const next = items.indexOf(e.target as HTMLButtonElement) + (e.key === "ArrowDown" ? 1 : -1);
  if (next < 0) els.catFind.focus();
  else items[Math.min(next, items.length - 1)]?.focus();
}

const PANES = ["files", "catalog"] as const;
function showPane(which: (typeof PANES)[number]) {
  for (const k of PANES) {
    $(`tab-${k}`).setAttribute("aria-selected", String(k === which));
    $(`pane-${k}`).hidden = k !== which;
  }
}

/** TI-BASIC gets the calculator's ":" gutter, the 26-column ruler and its own completions; other languages get a normal editor. */
function applyEditorMode() {
  const basic = isBasic();
  editor.updateOptions({
    ...(basic ? gutterOptions() : { lineNumbers: "on" as const, lineNumbersMinChars: 3 }),
    rulers: basic ? [SCREEN_COLS - 1] : [],
    wordBasedSuggestions: basic ? "off" : "currentDocument",
    suggest: { showWords: !basic, snippetsPreventQuickSuggestions: false },
  });
  els.gutter.hidden = !basic;
  els.gutter.textContent = showNumbers ? "Gutter: line numbers" : "Gutter: \":\"";
  els.gutter.setAttribute("aria-pressed", String(showNumbers));
  els.exportBtn.hidden = !basic || !activeDoc();
  renderCatalog(); // the catalog follows the toolchain of the active tab
}

function renderProblems() {
  const doc = activeDoc();
  // Only TI-BASIC and Python (py2ez80) have diagnostics; "No problems" for C would be a claim nothing is checking.
  els.problems.hidden = !doc || (doc.language !== "tibasic" && doc.language !== "python"); // ← CHANGED
  if (els.problems.hidden || !doc) return;
  const markers = monaco.editor.getModelMarkers({ resource: doc.model.uri });
  const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error).length;
  const warnings = markers.filter(m => m.severity === monaco.MarkerSeverity.Warning).length;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  els.problems.textContent = errors || warnings
    ? [errors && plural(errors, "error"), warnings && plural(warnings, "warning")].filter(Boolean).join(", ")
    : "No problems";
  els.problems.className = errors ? "has-errors" : warnings ? "has-warnings" : "";
}

function renderStatus() {
  const doc = activeDoc();
  const pos = editor.getPosition();
  els.pos.textContent = doc && pos ? `Ln ${pos.lineNumber}, Col ${pos.column}` : "";
  if (!doc) { els.size.textContent = ""; els.size.title = ""; return; }
  const source = doc.model.getValue();
  if (doc.language === "tibasic") {
    // Real tokenized size: what the calculator will store, not an estimate.
    const { bytes } = tokenize(source);
    els.size.textContent = `${bytes.length.toLocaleString()} bytes`;
    els.size.title = "Tokenized size";
  } else {
    els.size.textContent = `${new TextEncoder().encode(source).length.toLocaleString()} bytes`;
    els.size.title = doc.language;
  }
}

function refresh() {
  els.empty.hidden = active !== null;
  renderList();
  renderTabs();
  renderStatus();
  renderProblems();
  markOverflow();
  if (project) renderTree();
}

// ── Wiring ─────────────────────────────────────────────────────────────────

editor.onDidChangeCursorPosition(renderStatus);
els.find.addEventListener("input", renderList);
els.catFind.addEventListener("input", renderCatalog);
els.catFind.addEventListener("keydown", catalogKeys);
els.catalog.addEventListener("keydown", catalogKeys);
monaco.editor.onDidChangeMarkers(renderProblems);
els.problems.addEventListener("click", () => { editor.focus(); void editor.getAction("editor.action.marker.next")?.run(); });
els.exportBtn.addEventListener("click", () => void exportActive());
$("tab-files").addEventListener("click", () => { showPane("files"); els.find.focus(); });
$("tab-catalog").addEventListener("click", () => { showPane("catalog"); els.catFind.focus(); });
els.openFolder.addEventListener("click", () => void openFolder());
els.gutter.addEventListener("click", () => {
  showNumbers = !showNumbers;
  try { localStorage.setItem(GUTTER_PREF, showNumbers ? "1" : "0"); } catch { /* storage unavailable */ }
  applyEditorMode();
});
els.find.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  // Enter opens the first match, so finding never makes a near-duplicate. Ctrl+Enter always creates.
  const query = els.find.value.toUpperCase();
  const match = query && !mod(e) ? names.find(n => n.includes(query)) : undefined;
  const name = normalizeName(els.find.value);
  if (!match && !name) return setMessage("Names start with a letter and use only letters and digits.");
  els.find.value = "";
  void (match ? openProgram(match) : createProgram(name));
});

window.addEventListener("keydown", e => {
  if (!mod(e)) return;
  const key = e.key.toLowerCase(); // Caps Lock and Shift report capitals
  if (e.shiftKey && key === "o") { e.preventDefault(); void openFolder(); }
  else if (e.shiftKey && key === "e") { e.preventDefault(); void exportActive(true); }
  else if (key === "s") { e.preventDefault(); void saveActive(); }
  else if (key === "e") { e.preventDefault(); void exportActive(); }
  else if (key === "w" && active) { e.preventDefault(); closeTab(active); }
  else if (key === "n") { e.preventDefault(); showPane("files"); els.find.focus(); }
  else if (key === "j") { e.preventDefault(); showPane("catalog"); els.catFind.select(); }
});

store.list().then(list => { names = list; refresh(); checkPrograms(); }).catch(err => setMessage(`Could not load programs: ${err}`));
applyEditorMode();
renderCatalog();
renderTree();

// Reopen the last project folder, quietly: if it moved or was deleted, just start empty.
if (fs.available) {
  let last: string | null = null;
  try { last = localStorage.getItem(PROJECT_PREF); } catch { /* storage unavailable */ }
  if (last) loadProject(last, false).catch(() => { project = null; renderTree(); });
}