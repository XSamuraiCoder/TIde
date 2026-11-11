/// <reference types="vite/client" />
import * as monaco from "monaco-editor/editor/editor.api.js";
// The bare API ships no editor widgets, so the full entry is imported for its side effects.
import "monaco-editor"; // full entry: registers suggest, hover, parameter hints, folding and marker navigation
import editorWorker from "monaco-editor/editor/editor.worker.js?worker";
import { languageFor, registerTiBasic, tiCatalog } from "./language";
import { TARGETS, getTarget, onTargetChange, setTarget } from "./target";
import { C_CATALOG, registerC } from "./c-support";                        // ← CHANGED: full catalog, not just snippets
import { PY_CATALOG, registerPy2ez80, watchPython } from "./py2ez80-support"; // ← CHANGED: py2ez80 support
import { ASM_CATALOG, ASM_LANG, registerAsm } from "./asm-support";
import { appVersion, checkForUpdate } from "./updater";
import { createScm } from "./scm";
import { SEND_TYPES, createCalc } from "./calc";
import { DOCS, createDocs, type DocLangId } from "./docs";
import { registerIntellisense, watchModel } from "./intellisense";
import { make8xp, tokenize } from "./build";
import { exportProgram } from "./export";
import { fs, normalizeName, store, type Entry } from "./store";

(self as unknown as { MonacoEnvironment: object }).MonacoEnvironment = { getWorker: () => new editorWorker() };

const screenCols = () => TARGETS[getTarget()].cols;

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
  target: $<HTMLButtonElement>("target"),
  problems: $<HTMLButtonElement>("problems"),
  docFind: $<HTMLInputElement>("doc-find"),
  docList: $("doc-list"),
  docsLang: $("docs-lang"),
  project: $("status-project"),
  openFolder: $<HTMLButtonElement>("open-folder"),
  projectName: $("project-name"),
  tree: $("tree"),
  treeEmpty: $("tree-empty"),
  exportBtn: $<HTMLButtonElement>("export"),
  run: $<HTMLButtonElement>("run"),
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

const docsView = createDocs($("docs"), () => { if (activeDoc()) editor.focus(); });

const calc = createCalc({
  say: text => setMessage(text),
  pickRom: () => fs.pickFile("TI-84 Plus CE ROM", ["rom"]),
  pickFiles: () => fs.pickFiles("TI files", SEND_TYPES),
  readFile: path => fs.readBinary(path),
  layout: () => {
    // The calculator takes the editor area, like the docs page; only one of them shows at a time.
    $("act-calc").setAttribute("aria-pressed", String(calc.visible));
    if (calc.visible) docsView.close();
  },
});

const scm = createScm({
  root: () => project?.root ?? null,
  open: (path, name) => void openFile({ name, path, isDir: false }),
  say: text => setMessage(text),
  changed: status => {
    // Changed-file count on the activity bar, and the branch in the status bar.
    const badge = $("scm-badge"), branch = $<HTMLButtonElement>("status-branch");
    const count = status?.files.length ?? 0;
    badge.hidden = !count;
    badge.textContent = count > 99 ? "99+" : String(count);
    branch.hidden = !status?.branch;
    if (status) {
      const sync = [status.ahead && `↑${status.ahead}`, status.behind && `↓${status.behind}`].filter(Boolean).join(" ");
      branch.textContent = `⎇ ${status.branch}${sync ? ` ${sync}` : ""}`;
      branch.title = `${status.branch}${status.upstream ? "" : " (not pushed yet)"} · Source Control`;
    }
  },
});

registerTiBasic();
registerC();
registerPy2ez80();                                                        // ← CHANGED
registerAsm();
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
  rulers: [screenCols() - 1], // the calculator's editor width includes the leading ":"
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
let project: { root: string; name: string; hasMakefile: boolean } | null = null;
let building = false;
const dirCache = new Map<string, Entry[]>();
const expanded = new Set<string>();

const progId = (name: string) => `prgm:${name}`;
const fileId = (path: string) => `file:${path}`;
const baseName = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;
const isDirty = (d: Doc) => d.model.getAlternativeVersionId() !== d.savedVersion;
const activeDoc = () => (active ? docs.get(active) : undefined);
const mod = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;
/** In a folder with a Makefile, everything except a TI-BASIC program builds with make. */
const usesMake = () => !!project?.hasMakefile && activeDoc()?.language !== "tibasic";
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
    // Assembly lines up with tabs; everything else uses four spaces.
    model.updateOptions(doc.language === ASM_LANG ? { tabSize: 8, insertSpaces: false } : { tabSize: 4, insertSpaces: true });
    if (doc.language === "python") watchPython(model);
  }
  return doc;
}

function activate(id: string, note?: string) {
  const doc = docs.get(id);
  if (!doc) return;
  if (!tabOrder.includes(id)) tabOrder.push(id);
  active = id;
  docsView.close();
  if (calc.visible) calc.hide();
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

async function saveDoc(doc: Doc): Promise<boolean> {
  let saved = true;
  try {
    await doc.write(doc.model.getValue());
    doc.savedVersion = doc.model.getAlternativeVersionId();
    if (doc.language === "tibasic") buildErrors.set(doc.label, tokenize(doc.model.getValue()).errors.length);
    setMessage(`Saved ${doc.label}`);
    if (doc.id.startsWith("file:")) void scm.refresh();
  } catch (err) {
    setMessage(`Could not save ${doc.label}: ${err}`);
    saved = false;
  }
  refresh();
  return saved;
}

async function saveActive() {
  const doc = activeDoc();
  if (doc) await saveDoc(doc);
}

/** Saves every changed project file, runs make in the folder, and shows the result in the status bar. */
/** Saves, runs make, and reports the result. Resolves true when the build succeeded. */
async function buildProject(): Promise<boolean> {
  if (!project || building) return false;
  const { root, name } = project;
  for (const doc of docs.values()) {
    if (doc.id.startsWith("file:") && isDirty(doc) && !(await saveDoc(doc))) return false;
  }
  building = true;
  els.exportBtn.disabled = true;
  setMessage(`Building ${name}…`);
  try {
    const { ok, output } = await fs.runMake(root);
    const lines = output.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const last = lines[lines.length - 1] ?? "";
    const why = ok ? last : lines.find(l => /\berror\b/i.test(l)) ?? last;
    setMessage(ok ? `Built ${name}${why ? `: ${why}` : ""}` : `Build failed: ${why || "make exited with an error"}`);
    els.msg.title = output.trim(); // the full make output, on hover
    // The build usually creates folders like bin/ and obj/.
    await Promise.all([...dirCache.keys()].map(async dir => {
      try { dirCache.set(dir, await fs.readDir(dir)); } catch { dirCache.delete(dir); }
    }));
    renderTree();
    void scm.refresh();
    return ok;
  } catch (err) {
    setMessage(`Could not build ${name}: ${err}`);
    return false;
  } finally {
    building = false;
    els.exportBtn.disabled = false;
  }
}

/** Downloads CEmu the first time, after asking. Resolves true once it is installed. */
async function ensureEmulator(): Promise<boolean> {
  if (await fs.emulator.status()) return true;
  if (!confirm("Running needs CEmu, the TI-84 Plus CE emulator. Download it from its GitHub releases (about 20 MB)?\n\nThe first time it starts, CEmu asks for your calculator's ROM.")) return false;
  setMessage("Downloading CEmu…");
  try {
    await fs.emulator.install();
    return true;
  } catch (err) {
    setMessage(`Could not install CEmu: ${err}`);
    return false;
  }
}

/** A built program ready to run: its file name, bytes, and (for the CEmu app) a path on disk. */
interface Built { name: string; bytes: Uint8Array; path?: string }
interface ForRun { programs: Built[]; launch: string; libs: Built[] }

/** Builds the active TI-BASIC program, or the C project with make, into .8xp files to run. */
async function buildForRun(): Promise<ForRun | null> {
  if (!fs.available) { setMessage("Running programs needs the desktop app."); return null; }
  if (getTarget() === "plus" && isBasic()) { setMessage("The emulator is a TI-84 Plus CE. Switch Target to CE to run this program."); return null; }
  if (usesMake()) {
    const root = project!.root;
    if (!(await buildProject())) return null;
    const bin = `${root}${root.includes("\\") ? "\\" : "/"}bin`;
    const built = (await fs.readDir(bin).catch(() => [] as Entry[])).filter(e => !e.isDir && /\.8x[pv]$/i.test(e.name));
    if (!built.length) { setMessage("The build made no .8xp in bin/, so there's nothing to run."); return null; }
    const programs = await Promise.all(built.map(async e => ({ name: e.name, path: e.path, bytes: await fs.readBinary(e.path) })));
    const launch = built.find(e => /\.8xp$/i.test(e.name))?.name.replace(/\.8xp$/i, "").toUpperCase() ?? "";
    // C programs that use graphx, keypadc or fileioc need the CE C libraries on the calculator.
    const clibs = await fs.findClibs(root).catch(() => null);
    const libs = clibs ? [{ name: "clibs.8xg", path: clibs, bytes: await fs.readBinary(clibs) }] : [];
    return { programs, launch, libs };
  }
  const doc = activeDoc();
  if (!doc || doc.language !== "tibasic") { setMessage("Open a TI-BASIC program or a C project to run it."); return null; }
  if (isDirty(doc)) await saveDoc(doc);
  const { bytes, errors } = tokenize(doc.model.getValue());
  if (errors.length) setMessage(`${errors.length} character${errors.length === 1 ? "" : "s"} had no token and were skipped.`);
  return { programs: [{ name: `${doc.label}.8xp`, bytes: make8xp(doc.label, bytes) }], launch: doc.label, libs: [] };
}

/** F5: builds and runs in the calculator panel, inside TIde. */
async function runInEmulator() {
  try {
    const built = await buildForRun();
    if (built) await calc.run(built.programs, built.launch, built.libs);
  } catch (err) {
    setMessage(`Could not run: ${err}`);
  }
}

/** Builds and runs in the CEmu app instead, reusing the emulator window TIde opened before. */
async function runInCemu() {
  try {
    const built = await buildForRun();
    if (!built) return;
    const files = await Promise.all([...built.libs, ...built.programs].map(p => p.path ?? fs.emulator.stage(p.name.replace(/\.8xp$/i, ""), Array.from(p.bytes))));
    if (!(await ensureEmulator())) return;
    await fs.emulator.run(files, built.launch);
    setMessage(built.launch ? `Running ${built.launch} in CEmu` : "Sent to CEmu");
  } catch (err) {
    setMessage(`Could not run in CEmu: ${err}`);
  }
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
  if (usesMake()) return buildProject();
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
  const hasMakefile = entries.some(e => !e.isDir && /^(?:gnu)?makefile$/i.test(e.name));
  project = { root, name: baseName(root), hasMakefile };
  try { localStorage.setItem(PROJECT_PREF, root); } catch { /* storage unavailable */ }
  if (reveal) showPane("files");
  renderTree();
  applyEditorMode(); // the docs and Build button follow the project type
  setMessage(`Opened ${hasMakefile ? "C project" : "folder"} ${project.name}`);
  void scm.refresh();
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
/** Mark text past the screen width (one column is taken by the ":"), which wraps on the calculator. */
function markOverflow() {
  const doc = activeDoc();
  if (!doc || doc.language !== "tibasic") { overflow.clear(); return; }
  const cols = screenCols();
  const marks: monaco.editor.IModelDeltaDecoration[] = [];
  doc.model.getLinesContent().forEach((text, i) => {
    if (text.length < cols) return;
    marks.push({
      range: new monaco.Range(i + 1, cols, i + 1, text.length + 1),
      options: { inlineClassName: "overflow", hoverMessage: { value: "Wraps onto a new row on the calculator." } },
    });
  });
  overflow.set(marks);
}

/** Which docs (and inserts) the active tab uses, or null for file types without one. */
function catalogLang(): DocLangId | null {
  const language = activeDoc()?.language;
  if (!language || language === "tibasic") return "tibasic";
  if (language === "python") return "python";
  if (language === ASM_LANG) return "ez80";
  // The CE toolchain builds C++ too. A Makefile marks the whole folder as a C project.
  if (language === "c" || language === "cpp" || project?.hasMakefile) return "c";
  return null;
}

/** What the Docs view lists depends on the toolchain of the active tab. */
function catalogGroups(): { group: string; entries: { name: string; insert: string; hint: string; detail?: string }[] }[] {
  switch (catalogLang()) {
    case "tibasic": return tiCatalog(getTarget());
    case "python": return PY_CATALOG;
    case "ez80": return ASM_CATALOG;
    case "c": return C_CATALOG;
    default: return [];
  }
}

/** Opens the docs page for the active tab's language, at the named entry if given. */
function openDocs(name?: string) {
  if (calc.visible) calc.hide();
  docsView.open(catalogLang() ?? undefined, name);
}

/** The Docs view: every entry for the active tab's language. Click opens its page; Enter or + inserts it. */
function renderDocList() {
  const lang = catalogLang();
  els.docsLang.textContent = lang ? `· ${DOCS.find(d => d.id === lang)!.label}` : "";
  const q = els.docFind.value.trim().toLowerCase();
  const groups = catalogGroups();
  const nodes = groups.flatMap(group => {
    const entries = group.entries.filter(e => !q || `${e.name} ${e.hint} ${e.detail ?? ""}`.toLowerCase().includes(q));
    if (!entries.length) return [];
    return [
      h("h3", { className: "section" }, group.group),
      ...entries.map(e => {
        const hint = e.hint.replace(/`/g, "");
        const row = h("div", { className: "item", tabIndex: 0, title: [e.detail, hint, "Click: full docs · Enter: insert"].filter(Boolean).join("\n"),
          onclick: () => openDocs(e.name) },
          h("code", {}, e.name), ...(hint ? [h("span", {}, hint)] : []),
          h("button", { className: "insert", type: "button", title: "Insert at the cursor", tabIndex: -1,
            onclick: (ev: Event) => { ev.stopPropagation(); insertSnippet(e.insert); } }, "+"));
        row.dataset.insert = e.insert;
        return row;
      }),
    ];
  });
  const none = groups.length ? "Nothing matches." : "No docs for this file type.";
  els.docList.replaceChildren(...(nodes.length ? nodes : [h("p", { className: "hint" }, none)]));
}

/** Inserts an entry at the cursor. Monaco snippet syntax ($0, ${1:…}) expands into tab stops. */
function insertSnippet(text: string) {
  if (!activeDoc()) { setMessage("Open a program to insert commands."); return; }
  editor.focus();
  // Standalone Monaco has no "editor.action.insertSnippet" command; the snippet controller is the way in.
  editor.getContribution<monaco.editor.IEditorContribution & { insert(template: string): void }>("snippetController2")?.insert(text);
  if (text.endsWith("(")) editor.trigger("docs","editor.action.triggerParameterHints", null);
}

/** Arrow keys walk the docs list; Up from the first item goes back to the search box. */
function docListKeys(e: KeyboardEvent) {
  if (e.key === "Escape") { e.preventDefault(); editor.focus(); return; }
  const items = [...els.docList.querySelectorAll<HTMLElement>(".item")];
  const nameOf = (i: HTMLElement) => i.querySelector("code")!.textContent!;
  // Best match, not first listed: "sin(" must pick sin( over asin(.
  const best = () => {
    const q = els.docFind.value.trim().toLowerCase();
    const named = (test: (name: string) => boolean) => items.find(i => test(nameOf(i).toLowerCase()));
    return named(n => n === q) ?? named(n => n.startsWith(q)) ?? items[0];
  };
  const current = e.target === els.docFind ? best() : (e.target as HTMLElement).closest<HTMLElement>(".item");
  if (e.key === "F1") { e.preventDefault(); if (current) openDocs(nameOf(current)); return; }
  if (e.key === "Enter") { e.preventDefault(); if (current?.dataset.insert) insertSnippet(current.dataset.insert); return; }
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  const next = items.indexOf(e.target as HTMLElement) + (e.key === "ArrowDown" ? 1 : -1);
  if (next < 0) els.docFind.focus();
  else items[Math.min(next, items.length - 1)]?.focus();
}

const PANES = ["files", "scm", "docs"] as const;
type Pane = (typeof PANES)[number];
let pane: Pane = "files";
const app = document.querySelector<HTMLElement>(".app")!;
/** Shows a side bar view. As in VS Code, picking the view that is already showing hides the side bar. */
function showPane(which: Pane, toggle = false) {
  const hide = toggle && which === pane && !app.classList.contains("no-side");
  app.classList.toggle("no-side", hide);
  pane = which;
  for (const k of PANES) {
    $(`act-${k}`).setAttribute("aria-pressed", String(k === which && !hide));
    $(`pane-${k}`).hidden = k !== which;
  }
  if (which === "scm" && !hide) void scm.refresh();
}

/** TI-BASIC gets the calculator's ":" gutter, the 26-column ruler and its own completions; other languages get a normal editor. */
function applyEditorMode() {
  const basic = isBasic();
  editor.updateOptions({
    ...(basic ? gutterOptions() : { lineNumbers: "on" as const, lineNumbersMinChars: 3 }),
    rulers: basic ? [screenCols() - 1] : [],
    wordBasedSuggestions: basic ? "off" : "currentDocument",
    suggest: { showWords: !basic, snippetsPreventQuickSuggestions: false },
  });
  els.gutter.hidden = !basic;
  els.gutter.textContent = showNumbers ? "Gutter: line numbers" : "Gutter: \":\"";
  els.gutter.setAttribute("aria-pressed", String(showNumbers));
  els.target.hidden = !basic;
  els.target.textContent = `Target: ${TARGETS[getTarget()].label}`;
  const make = usesMake();
  els.exportBtn.hidden = !make && (!basic || !activeDoc());
  els.run.hidden = !fs.available || els.exportBtn.hidden;
  els.exportBtn.textContent = make ? "Build" : "Build .8xp";
  els.exportBtn.title = make
    ? `Runs make in ${project?.name} (Ctrl+E). Saves changed files first.`
    : "Ctrl+E rebuilds to the same file. Ctrl+Shift+E picks a new location.";
  renderDocList(); // the docs follow the toolchain of the active tab
  renderProject(); // so does the status bar
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

const statusBar = document.querySelector<HTMLElement>(".status")!;
const KIND_LABEL: Record<DocLangId, string> = { tibasic: "TI-BASIC", c: "C", python: "py2ez80", ez80: "eZ80 assembly" };

/** The status bar takes the color of the active toolchain and names the project on its left, as VS Code does. */
function renderProject() {
  const kind = catalogLang();
  statusBar.dataset.kind = kind ?? "plain";
  const where = project ? `${project.hasMakefile ? "C project" : "Folder"}: ${project.name}` : "Programs";
  els.project.textContent = kind ? `${where} · ${KIND_LABEL[kind]}` : where;
  els.project.title = project ? project.root : "TI-BASIC programs stored by TIde";
}

function renderStatus() {
  renderProject();
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
els.docFind.addEventListener("input", renderDocList);
els.docFind.addEventListener("keydown", docListKeys);
els.docList.addEventListener("keydown", docListKeys);
monaco.editor.onDidChangeMarkers(renderProblems);
els.problems.addEventListener("click", () => { editor.focus(); void editor.getAction("editor.action.marker.next")?.run(); });
els.exportBtn.addEventListener("click", () => void exportActive());
els.run.addEventListener("click", () => void runInEmulator());
// F5 runs, as in most IDEs. It also stops the webview from reloading the page.
window.addEventListener("keydown", e => {
  if (e.key !== "F5") return;
  e.preventDefault();
  if (!els.run.hidden) void runInEmulator();
});
$("act-files").addEventListener("click", () => showPane("files", true));
$("act-docs").addEventListener("click", () => showPane("docs", true));
$("act-scm").addEventListener("click", () => showPane("scm", true));
$("act-calc").addEventListener("click", () => void (calc.visible ? calc.hide() : calc.show()));
$("calc-cemu").addEventListener("click", () => void runInCemu());
$("status-branch").addEventListener("click", () => showPane("scm"));
window.addEventListener("focus", () => void scm.refresh()); // files may have changed outside TIde
els.openFolder.addEventListener("click", () => void openFolder());
els.gutter.addEventListener("click", () => {
  showNumbers = !showNumbers;
  try { localStorage.setItem(GUTTER_PREF, showNumbers ? "1" : "0"); } catch { /* storage unavailable */ }
  applyEditorMode();
});
els.target.addEventListener("click", () => setTarget(getTarget() === "ce" ? "plus" : "ce"));
onTargetChange(() => {
  applyEditorMode();
  refresh();
  void checkPrograms();
  setMessage(`Target: TI-84 ${TARGETS[getTarget()].label === "CE" ? "Plus CE" : "Plus"}`);
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
  else if (e.shiftKey && key === "j") { e.preventDefault(); if (docsView.isOpen) docsView.close(); else openDocs(); }
  else if (key === "j") { e.preventDefault(); showPane("docs"); els.docFind.select(); }
  else if (key === "b") { e.preventDefault(); showPane(pane, true); }
  else if (e.shiftKey && key === "g") { e.preventDefault(); showPane("scm"); }
});

store.list().then(list => { names = list; refresh(); checkPrograms(); }).catch(err => setMessage(`Could not load programs: ${err}`));
applyEditorMode();
showPane("files");
renderTree();

// Desktop builds check the latest release for an update; the status bar shows the version and checks on click.
if (fs.available) {
  const version = $<HTMLButtonElement>("version");
  version.hidden = false;
  appVersion().then(v => { version.textContent = `TIde ${v}`; }).catch(() => { version.textContent = "TIde"; });
  version.addEventListener("click", () => void checkForUpdate(setMessage));
  if (!import.meta.env.DEV) void checkForUpdate(setMessage, true);
}

// Reopen the last project folder, quietly: if it moved or was deleted, just start empty.
if (fs.available) {
  let last: string | null = null;
  try { last = localStorage.getItem(PROJECT_PREF); } catch { /* storage unavailable */ }
  if (last) loadProject(last, false).catch(() => { project = null; renderTree(); });
}