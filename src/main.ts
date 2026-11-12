/// <reference types="vite/client" />
import * as monaco from "monaco-editor/editor/editor.api.js";
// The bare API ships no editor widgets, so the full entry is imported for its side effects.
import "monaco-editor"; // full entry: registers suggest, hover, parameter hints, folding and marker navigation
import editorWorker from "monaco-editor/editor/editor.worker.js?worker";
import jsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import { json as monacoJson } from "monaco-editor";
import { languageFor, registerTiBasic, tiCatalog } from "./language";
import { TARGETS, getTarget, onTargetChange, setTarget } from "./target";
import { C_CATALOG, registerC } from "./c-support";                        // ← CHANGED: full catalog, not just snippets
import { PY_CATALOG, registerPy2ez80, watchPython } from "./py2ez80-support"; // ← CHANGED: py2ez80 support
import { ASM_CATALOG, ASM_LANG, registerAsm } from "./asm-support";
import { appVersion, checkForUpdate } from "./updater";
import { createScm } from "./scm";
import { showMenu, type MenuItem } from "./menu";
import { SEND_TYPES, createCalc, unbundle } from "./calc";
import { ENCODINGS, canSave, decodeWith, detect, encode, encodingByKey, encodingKey, type Encoding } from "./encoding";
import { hexDump, parseTiFile } from "./tifile";
import { onSettingsChange, projectSettings, resetSettings, setProjectSettings, setSetting, settings, settingsPage, type Row } from "./settings";
import { CONFIG_DIR, CONFIG_FILE, CONFIG_SCHEMA, CONFIG_TEMPLATE, parseMacro, readConfig, splitCommand, splitPattern, steps, type ProjectConfig } from "./config";
import { DOCS, createDocs, type DocLangId } from "./docs";
import { registerIntellisense, watchModel } from "./intellisense";
import { make8xp, tokenize } from "./build";
import { exportProgram } from "./export";
import { fs, normalizeName, store, type Entry } from "./store";

(self as unknown as { MonacoEnvironment: object }).MonacoEnvironment = {
  getWorker: (_: unknown, label: string) => (label === "json" ? new jsonWorker() : new editorWorker()),
};
// tide.json gets completions, hover help and checking from its schema. Comments are allowed in it.
monacoJson.jsonDefaults.setDiagnosticsOptions({
  validate: true, allowComments: true, trailingCommas: "ignore",
  schemas: [{ uri: "tide://schema/tide.json", fileMatch: [`**/${CONFIG_DIR}/${CONFIG_FILE}`], schema: CONFIG_SCHEMA }],
});

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
  /** For project files: the text encoding it was read in and is saved in. */
  encoding?: Encoding;
}

/** A tab that isn't a text editor: Settings, a TI file's metadata, or a file TIde can't show as text. */
interface View { id: string; label: string; hint?: string; el: HTMLElement }

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
  encoding: $<HTMLSelectElement>("status-encoding"),
  scripts: $<HTMLSelectElement>("status-scripts"),
  viewHost: $("view-host"),
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
  fontSize: settings().fontSize,
  lineHeight: Math.round(settings().fontSize * 1.7),
  wordWrap: settings().wordWrap ? "on" : "off",
  renderWhitespace: settings().renderWhitespace,
  fontFamily: getComputedStyle(document.body).getPropertyValue("--mono"),
  minimap: { enabled: settings().minimap },
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
const views = new Map<string, View>();
let tabOrder: string[] = [];
let active: string | null = null;
let names: string[] = [];

// Build state: tokenize errors per program name, so the list can flag ones that won't build.
const buildErrors = new Map<string, number>();

// Project folder: entries are loaded one directory at a time, when it is first expanded.
let project: { root: string; name: string; hasMakefile: boolean } | null = null;
/** The open project's tide.json, or {} when it has none. */
let config: ProjectConfig = {};
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
const usesMake = () => !!project && (project.hasMakefile || !!config.build) && activeDoc()?.language !== "tibasic";
const joinPath = (root: string, rel: string) => {
  const sep = root.includes("\\") ? "\\" : "/";
  return [root.replace(/[\\/]+$/, ""), ...rel.split(/[\\/]/).filter(Boolean)].join(sep);
};
const configPath = () => (project ? joinPath(project.root, `${CONFIG_DIR}/${CONFIG_FILE}`) : null);
const isBasic = () => (activeDoc()?.language ?? "tibasic") === "tibasic";

// ── Actions ────────────────────────────────────────────────────────────────

function addDoc(init: Pick<Doc, "id" | "label" | "hint" | "language" | "write"> & { source: string }): Doc {
  const model = monaco.editor.createModel(init.source, init.language, init.hint ? monaco.Uri.file(init.hint) : undefined);
  const doc: Doc = {
    id: init.id, label: init.label, hint: init.hint, language: init.language,
    model, savedVersion: model.getAlternativeVersionId(), write: init.write,
  };
  docs.set(doc.id, doc);
  model.onDidChangeContent(refresh);
  if (doc.language === "tibasic") watchModel(model);
  else {
    // Assembly lines up with tabs; everything else uses four spaces.
    model.updateOptions(doc.language === ASM_LANG ? { tabSize: 8, insertSpaces: false } : { tabSize: settings().tabSize, insertSpaces: true });
    if (doc.language === "python") watchPython(model);
  }
  return doc;
}

function activate(id: string, note?: string) {
  const doc = docs.get(id), view = views.get(id);
  if (!doc && !view) return;
  if (!tabOrder.includes(id)) tabOrder.push(id);
  active = id;
  docsView.close();
  if (calc.visible) calc.hide();
  showActive();
  if (doc) editor.focus();
  setMessage(note ?? `Opened ${(doc ?? view)!.label}`);
  refresh();
}

/** Shows the active tab: its model in the editor, or its view over the editor. */
function showActive() {
  const view = active ? views.get(active) : undefined;
  editor.setModel(active ? docs.get(active)?.model ?? null : null);
  els.viewHost.hidden = !view;
  if (view && els.viewHost.firstElementChild !== view.el) els.viewHost.replaceChildren(view.el);
  applyEditorMode();
}

/** Opens (or brings back) a view tab. */
function openView(view: View, note?: string) {
  views.set(view.id, view);
  if (active === view.id) els.viewHost.replaceChildren(view.el);
  activate(view.id, note);
}

async function openProgram(name: string, note?: string) {
  const id = progId(name);
  if (!docs.has(id)) {
    const source = await store.load(name);
    if (!docs.has(id)) addDoc({ id, label: name, language: "tibasic", source, write: s => store.save(name, s) });
  }
  activate(id, note);
}

const extOf = (name: string) => name.slice(name.lastIndexOf(".") + 1).toLowerCase();

async function openFile(entry: Entry) {
  const id = fileId(entry.path);
  if (docs.has(id) || views.has(id)) return activate(id);
  let bytes: Uint8Array;
  try {
    bytes = await fs.readBinary(entry.path);
  } catch (err) {
    setMessage(`Can't open ${entry.name}: ${err}`);
    return;
  }
  if (docs.has(id) || views.has(id)) return activate(id);
  if (SEND_TYPES.includes(extOf(entry.name))) return openView(await tiFileView(entry, bytes));
  const fallback = encodingByKey(settings().fallbackEncoding) ?? ENCODINGS[4];
  const found = detect(bytes, fallback);
  if (!found) return openView(unsupportedView(entry, bytes));
  openText(entry, found.text, found.encoding);
  if (found.encoding !== ENCODINGS[0]) setMessage(`Opened ${entry.name} as ${found.encoding.label}`);
}

/** Opens a project file as text in an encoding, saving it back in the same encoding. */
function openText(entry: Entry, text: string, encoding: Encoding) {
  const id = fileId(entry.path);
  const doc = addDoc({
    id, label: entry.name, hint: entry.path, language: languageFor(entry.name), source: text,
    write: s => fs.writeBinary(entry.path, encode(s, docs.get(id)!.encoding!)),
  });
  doc.encoding = encoding;
  activate(id);
}

/** Reopens the active file from disk in another encoding. */
async function reopenWith(encoding: Encoding) {
  const doc = activeDoc();
  if (!doc?.encoding || !doc.hint) return;
  if (isDirty(doc) && !confirm(`Reopening ${doc.label} as ${encoding.label} discards your unsaved changes. Continue?`)) return renderStatus();
  const bytes = await fs.readBinary(doc.hint);
  doc.model.setValue(decodeWith(bytes, encoding));
  doc.savedVersion = doc.model.getAlternativeVersionId();
  doc.encoding = encoding;
  setMessage(`Reopened ${doc.label} as ${encoding.label}`);
  refresh();
}

/** Saves the active file in another encoding from now on. */
async function saveWith(encoding: Encoding) {
  const doc = activeDoc();
  if (!doc?.encoding) return;
  if (!canSave(encoding)) { setMessage(`TIde can open ${encoding.label} but not save it.`); return renderStatus(); }
  const before = doc.encoding;
  doc.encoding = encoding;
  if (!(await saveDoc(doc))) doc.encoding = before;
  else setMessage(`Saved ${doc.label} as ${encoding.label}`);
  refresh();
}

/** A tab for a file that is binary or not text in any encoding TIde recognises. */
function unsupportedView(entry: Entry, bytes: Uint8Array): View {
  const select = h("select", {}, ...ENCODINGS.map(e => h("option", { value: encodingKey(e) }, e.label)));
  const open = h("button", { type: "button", className: "primary", onclick: () => {
    const encoding = encodingByKey(select.value) ?? ENCODINGS[0];
    closeTab(fileId(entry.path));
    openText(entry, decodeWith(bytes, encoding), encoding);
  } }, "Open as text");
  return {
    id: fileId(entry.path), label: entry.name, hint: entry.path,
    el: h("div", { className: "file-view" },
      h("h1", {}, entry.name),
      h("p", { className: "notice" }, "This file isn't shown because it is binary or uses an unsupported text encoding."),
      h("p", { className: "hint" }, `${bytes.length.toLocaleString()} bytes. Opening it as text and saving can damage a binary file.`),
      h("div", { className: "row" }, h("label", {}, "Encoding ", select), open),
      h("h2", {}, "First bytes"),
      h("pre", { className: "hex" }, hexDump(bytes))),
  };
}

/** A tab with a TI file's metadata: its variables, or the Flash app/OS header, or a bundle's contents. */
async function tiFileView(entry: Entry, bytes: Uint8Array): Promise<View> {
  const view: View = { id: fileId(entry.path), label: entry.name, hint: entry.path, el: h("div", { className: "file-view ti-file" }) };
  const send = h("button", { type: "button", className: "primary", onclick: () => void calc.send([{ name: entry.name, bytes }]) }, "Send to calculator");
  const facts = (pairs: [string, string][]) => h("dl", { className: "facts" }, ...pairs.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]));
  const parts: HTMLElement[] = [h("div", { className: "title-row" }, h("h1", {}, entry.name), send)];
  try {
    if (/^b8[34]$/.test(extOf(entry.name))) {
      const inside = await unbundle({ name: entry.name, bytes });
      parts.push(facts([["Kind", "Bundle"], ["Size", `${bytes.length.toLocaleString()} bytes`], ["Files", String(inside.length)]]),
        h("h2", {}, "Contents"),
        h("table", {}, h("tr", {}, h("th", {}, "File"), h("th", {}, "Size")),
          ...inside.map(f => h("tr", {}, h("td", {}, f.name), h("td", {}, `${f.bytes.length.toLocaleString()} bytes`)))));
    } else {
      const info = parseTiFile(bytes);
      if (info.kind === "flash") {
        parts.push(facts([["Kind", info.type], ["Name", info.name], ["Version", info.version], ["For", info.device],
          ["Date", info.date], ["Data", `${info.size.toLocaleString()} bytes`], ["Signature", info.signature]]));
      } else {
        parts.push(facts([["Comment", info.comment || "(none)"], ["Variables", String(info.vars.length)],
          ["Size", `${bytes.length.toLocaleString()} bytes`], ["Checksum", info.checksumOk ? "Valid" : "Doesn't match: the file may be damaged"],
          ["Signature", info.signature]]));
        parts.push(h("h2", {}, "Variables"),
          h("table", {}, h("tr", {}, ...["Name", "Type", "Size", "Archived", "Version"].map(t => h("th", {}, t))),
            ...info.vars.map(v => h("tr", {}, h("td", { className: "mono" }, v.name), h("td", {}, v.typeName),
              h("td", {}, `${v.size.toLocaleString()} bytes`), h("td", {}, v.archived === null ? "—" : v.archived ? "Yes" : "No"),
              h("td", {}, v.version === null ? "—" : String(v.version))))));
        for (const v of info.vars) {
          if (v.source !== null) {
            const name = normalizeName(v.name);
            parts.push(h("div", { className: "title-row" }, h("h2", {}, `prgm${v.name}`),
              ...(name ? [h("button", { type: "button", onclick: () => void importProgram(name, v.source!) }, "Open as program")] : [])),
              h("pre", { className: "source" }, v.source || "(empty)"));
          } else if (v.native) {
            parts.push(h("h2", {}, `prgm${v.name}`),
              h("p", { className: "hint" }, "A native program (C or assembly). Send it to the calculator to run it; TI blocks native programs on OS 5.5 and later."));
          } else if (v.data.length) {
            parts.push(h("details", {}, h("summary", {}, `${v.name} data`), h("pre", { className: "hex" }, hexDump(v.data))));
          }
        }
      }
    }
  } catch (err) {
    parts.push(h("p", { className: "notice" }, `TIde couldn't read this file: ${err instanceof Error ? err.message : err}`), h("pre", { className: "hex" }, hexDump(bytes)));
  }
  view.el.replaceChildren(...parts);
  return view;
}

// ── Output tab: build and script output ──
const outputLog = h("pre", { className: "output-log" });
const outputView: View = {
  id: "output", label: "Output",
  el: h("div", { className: "output-view" },
    h("div", { className: "title-row" }, h("h1", {}, "Output"),
      h("button", { type: "button", onclick: () => outputLog.replaceChildren() }, "Clear")),
    outputLog),
};
function output(text: string, kind: "cmd" | "ok" | "err" | "" = "") {
  const atEnd = outputLog.scrollTop + outputLog.clientHeight >= outputLog.scrollHeight - 4;
  outputLog.append(h("span", { className: kind }, text.endsWith("\n") ? text : `${text}\n`));
  if (atEnd) outputLog.scrollTop = outputLog.scrollHeight;
}
const openOutput = () => openView(outputView, "Opened Output");

/** Runs a command line in the project folder, writing it and its output to the Output tab. */
async function runLine(label: string, line: string): Promise<{ ok: boolean; output: string }> {
  const { command, args } = splitCommand(line);
  output(`> ${label}: ${line}`, "cmd");
  const result = await fs.runCommand(project!.root, command, args);
  if (result.output.trim()) output(result.output);
  output(result.ok ? `${label} finished.` : `${label} failed.`, result.ok ? "ok" : "err");
  return result;
}

async function runScript(name: string) {
  const line = config.scripts?.[name];
  if (!project || !line) return;
  openOutput();
  setMessage(`Running ${name}…`);
  try {
    const { ok } = await runLine(name, line);
    setMessage(ok ? `${name} finished` : `${name} failed: see Output`);
  } catch (err) {
    output(String(err), "err");
    setMessage(`Could not run ${name}: ${err}`);
  }
  await Promise.all([...dirCache.keys()].map(async dir => { try { dirCache.set(dir, await fs.readDir(dir)); } catch { dirCache.delete(dir); } }));
  renderTree();
  void scm.refresh();
}

/** Runs tide.json steps in order: calculator macros on the calculator, anything else as a command line. */
async function runSteps(label: string, list: string[]): Promise<boolean> {
  for (const step of list) {
    try {
      const macro = parseMacro(step);
      if (macro) {
        output(`> ${label}: ${step}`, "cmd");
        await calc.macro(macro.macro, macro.arg);
      } else if (!(await runLine(label, step)).ok) {
        openOutput();
        setMessage(`${label} failed at ${step}: see Output`);
        return false;
      }
    } catch (err) {
      output(`${step}: ${err instanceof Error ? err.message : err}`, "err");
      openOutput();
      setMessage(`${label} failed at ${step}: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }
  return true;
}

/** tide.json's "prerun": after building, before sending. Resolves false if a step failed. */
async function prerun(): Promise<boolean> {
  const list = project ? steps(config.prerun) : [];
  if (!list.length) return true;
  setMessage("Running prerun…");
  return runSteps("Prerun", list);
}

/** Files in the project matching tide.json's "send" patterns, such as bin/*.8xp. */
async function matchFiles(root: string, patterns: string[]): Promise<Entry[]> {
  const found = new Map<string, Entry>();
  for (const pattern of patterns) {
    const { dir, match } = splitPattern(pattern);
    const entries = await fs.readDir(dir ? joinPath(root, dir) : root).catch(() => [] as Entry[]);
    for (const e of entries) if (!e.isDir && match.test(e.name)) found.set(e.path, e);
  }
  return [...found.values()];
}

/** Reads the open project's tide.json and applies it. A broken file is reported and ignored. */
async function loadConfig(exists = true) {
  config = {};
  const path = configPath();
  if (path && exists && await configExists()) {
    try {
      config = readConfig(await fs.readFile(path));
    } catch (err) {
      setMessage(`${CONFIG_DIR}/${CONFIG_FILE} isn't used: ${err instanceof Error ? err.message : err}`);
    }
  }
  setProjectSettings(config.editor ?? {});
  if (config.calculator && config.calculator !== getTarget()) setTarget(config.calculator);
  renderScripts();
  applyEditorMode();
}

/** Whether the open project has .tide/tide.json. */
async function configExists(): Promise<boolean> {
  if (!project) return false;
  const entries = await fs.readDir(joinPath(project.root, CONFIG_DIR)).catch(() => [] as Entry[]);
  return entries.some(e => !e.isDir && e.name.toLowerCase() === CONFIG_FILE);
}

/** Opens the project's .tide/tide.json, creating it from a starter first if there isn't one. */
async function openProjectFile() {
  const path = configPath();
  if (!project || !path) return setMessage("Open a folder to give it a .tide/tide.json.");
  if (!(await configExists())) {
    await fs.writeFile(path, CONFIG_TEMPLATE);
    dirCache.set(project.root, await fs.readDir(project.root));
    expanded.add(joinPath(project.root, CONFIG_DIR));
    dirCache.delete(joinPath(project.root, CONFIG_DIR));
    renderTree();
    await loadConfig();
    setMessage(`Created ${CONFIG_DIR}/${CONFIG_FILE}`);
  }
  await openFile({ name: CONFIG_FILE, path, isDir: false });
}

/** The Scripts menu in the status bar, from tide.json's "scripts". */
function renderScripts() {
  const names = Object.keys(config.scripts ?? {});
  els.scripts.hidden = !project || !names.length;
  els.scripts.replaceChildren(
    h("option", { value: "", hidden: true }, "Scripts"),
    ...names.map(n => h("option", { value: n, title: config.scripts![n] }, `${n}: ${config.scripts![n]}`)));
  els.scripts.value = "";
}

/** Copies a program out of a TI file into TIde's programs. */
async function importProgram(name: string, source: string) {
  if (names.includes(name) && !confirm(`Replace your program ${name} with the one in this file?`)) return;
  await store.save(name, source);
  if (!names.includes(name)) names = [...names, name].sort();
  const open = docs.get(progId(name));
  if (open) { open.model.setValue(source); open.savedVersion = open.model.getAlternativeVersionId(); }
  await openProgram(name, `Opened ${name} from the file`);
  void checkPrograms();
}

/** The Settings tab. */
function openSettings() {
  openView(views.get("settings") ?? { id: "settings", label: "Settings", el: settingsPage(settingRows) });
}

function settingRows(): Row[] {
  const s = settings();
  const toggle = (key: "wordWrap" | "minimap" | "showRuler" | "sendClibs" | "checkUpdates" | "refreshScmOnFocus" | "shiftDeletes") =>
    ({ kind: "toggle" as const, get: () => settings()[key], set: (v: boolean) => setSetting(key, v) });
  const keyOf: Record<string, string> = { "Font size": "fontSize", "Tab size": "tabSize", "Word wrap": "wordWrap", Minimap: "minimap",
    "Show whitespace": "renderWhitespace", "Screen width ruler": "showRuler", "Encoding for other text": "fallbackEncoding",
    "Send clibs.8xg with C projects": "sendClibs" };
  const rows: Row[] = [
    { section: "Editor", label: "Font size", description: "Size of text in the editor, in pixels.",
      control: { kind: "number", min: 9, max: 28, get: () => s.fontSize, set: v => setSetting("fontSize", v) } },
    { section: "Editor", label: "Tab size", description: "Spaces per indent in C, Python and other files. Assembly always uses tabs.",
      control: { kind: "select", options: [["2", "2"], ["4", "4"], ["8", "8"]], get: () => String(s.tabSize), set: v => setSetting("tabSize", Number(v)) } },
    { section: "Editor", label: "Word wrap", description: "Wrap long lines at the edge of the editor.", control: toggle("wordWrap") },
    { section: "Editor", label: "Minimap", description: "Show an overview of the file beside the editor.", control: toggle("minimap") },
    { section: "Editor", label: "Show whitespace", description: "Draw spaces and tabs.",
      control: { kind: "select", options: [["none", "Never"], ["boundary", "Between words"], ["all", "Always"]],
        get: () => s.renderWhitespace, set: v => setSetting("renderWhitespace", v as typeof s.renderWhitespace) } },
    { section: "TI-BASIC", label: "Calculator", description: "Which calculator programs are for: sets the screen size checks and which commands exist.",
      control: { kind: "select", options: [["ce", "TI-84 Plus CE"], ["plus", "TI-84 Plus"]], get: () => getTarget(), set: v => setTarget(v as "ce" | "plus") } },
    { section: "TI-BASIC", label: "Gutter", description: "Show the calculator's \":\" before each line, or line numbers.",
      control: { kind: "select", options: [["colon", "\":\" like the calculator"], ["numbers", "Line numbers"]],
        get: () => (showNumbers ? "numbers" : "colon"), set: v => setGutter(v === "numbers") } },
    { section: "TI-BASIC", label: "Screen width ruler", description: "Mark the column where a line wraps on the calculator's screen.", control: toggle("showRuler") },
    { section: "Files", label: "Encoding for other text", description: "How to read a text file that isn't UTF-8 or UTF-16. The status bar can reopen or save a file in any encoding.",
      control: { kind: "select", options: ENCODINGS.filter(e => !e.bom && e.id !== "utf-8").map(e => [encodingKey(e), e.label]),
        get: () => s.fallbackEncoding, set: v => setSetting("fallbackEncoding", v) } },
    { section: "Calculator", label: "Console", description: "Show CEmu's output under the calculator.",
      control: { kind: "toggle", get: () => calc.consoleShown, set: v => { calc.consoleShown = v; } } },
    { section: "Calculator", label: "Send clibs.8xg with C projects", description: "Send the CE C libraries before running a C project, when TIde finds them.", control: toggle("sendClibs") },
    { section: "Files", label: "Shift for permanent delete", description: "In the Explorer's right-click menu, show one Delete that holding Shift turns into Delete permanently. Off shows both.", control: toggle("shiftDeletes") },
    { section: "Source control", label: "Refresh when TIde gets focus", description: "Check git status again when you switch back to TIde.", control: toggle("refreshScmOnFocus") },
    { section: "Updates", label: "Check for updates on start", description: "Look for a newer TIde when it starts. Desktop app only.", control: toggle("checkUpdates") },
    { section: "Updates", label: "Check now", description: "Look for a newer version of TIde.",
      control: { kind: "button", label: "Check for updates", run: () => void checkForUpdate(setMessage) } },
    { section: "Project", label: CONFIG_FILE, description: project
        ? `How ${project.name} builds and runs, its calculator, editor settings and scripts. Its editor settings are used instead of these while it's open.`
        : "Open a folder to give it a .tide/tide.json, which sets how it builds and runs.",
      control: { kind: "button", label: project ? "Open .tide/tide.json" : "No folder open", run: () => void openProjectFile() } },
    { section: "Reset", label: "Restore defaults", description: "Put every setting above back to how TIde starts.",
      control: { kind: "button", label: "Restore defaults", run: () => { if (confirm("Restore every setting to its default?")) { resetSettings(); openSettings(); } } } },
  ];
  const fromProject = projectSettings();
  for (const row of rows) {
    const key = keyOf[row.label] as keyof typeof fromProject | undefined;
    if (key && key in fromProject) row.description += ` This project's tide.json sets it to ${JSON.stringify(fromProject[key])}.`;
  }
  return rows;
}

function setGutter(numbers: boolean) {
  showNumbers = numbers;
  try { localStorage.setItem(GUTTER_PREF, showNumbers ? "1" : "0"); } catch { /* storage unavailable */ }
  applyEditorMode();
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
    if (doc.hint && doc.hint === configPath()) await loadConfig();
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
  const { name } = project;
  for (const doc of docs.values()) {
    if (doc.id.startsWith("file:") && isDirty(doc) && !(await saveDoc(doc))) return false;
  }
  building = true;
  els.exportBtn.disabled = true;
  setMessage(`Building ${name}…`);
  try {
    const line = config.build ?? "make";
    const { ok, output } = await runLine("Build", line);
    const lines = output.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const last = lines[lines.length - 1] ?? "";
    const why = ok ? last : lines.find(l => /\berror\b/i.test(l)) ?? last;
    setMessage(ok ? `Built ${name}${why ? `: ${why}` : ""}` : `Build failed: ${why || `${splitCommand(line).command} exited with an error`}`);
    els.msg.title = output.trim(); // the full build output, on hover; it is also in the Output tab
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
    if (!(await prerun())) return null; // before matching, so files it makes are sent
    const patterns = config.send ?? ["bin/*.8xp", "bin/*.8xv"];
    const built = await matchFiles(root, patterns);
    if (!built.length) { setMessage(`Nothing to send: no files match ${patterns.join(", ")}.`); return null; }
    const programs = await Promise.all(built.map(async e => ({ name: e.name, path: e.path, bytes: await fs.readBinary(e.path) })));
    const launch = config.program ?? built.find(e => /\.8xp$/i.test(e.name))?.name.replace(/\.8xp$/i, "").toUpperCase() ?? "";
    // C programs that use graphx, keypadc or fileioc need the CE C libraries on the calculator.
    let libPaths: string[] = [];
    if (Array.isArray(config.libraries)) libPaths = config.libraries.map(p => joinPath(root, p));
    else if (config.libraries ?? settings().sendClibs) {
      const clibs = await fs.findClibs(root).catch(() => null);
      if (clibs) libPaths = [clibs];
    }
    const libs = await Promise.all(libPaths.map(async p => ({ name: baseName(p), path: p, bytes: await fs.readBinary(p) })));
    return { programs, launch, libs };
  }
  const doc = activeDoc();
  if (!doc || doc.language !== "tibasic") { setMessage("Open a TI-BASIC program or a C project to run it."); return null; }
  if (isDirty(doc)) await saveDoc(doc);
  const { bytes, errors } = tokenize(doc.model.getValue());
  if (errors.length) setMessage(`${errors.length} character${errors.length === 1 ? "" : "s"} had no token and were skipped.`);
  if (!(await prerun())) return null;
  return { programs: [{ name: `${doc.label}.8xp`, bytes: make8xp(doc.label, bytes) }], launch: doc.label, libs: [] };
}

/** F5: builds and runs in the calculator panel, inside TIde. */
async function runInEmulator() {
  if (usesMake() && config.runIn === "cemu") return runInCemu();
  try {
    const built = await buildForRun();
    if (!built) return;
    await calc.run(built.programs, built.launch, built.libs);
    const post = project ? steps(config.postrun) : [];
    if (post.length && await runSteps("Postrun", post)) setMessage("Postrun finished");
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
  views.delete(id);
  if (active === id) {
    active = tabOrder[Math.min(index, tabOrder.length - 1)] ?? null;
    showActive();
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
  targetDir = null;
  creating = null;
  try { localStorage.setItem(PROJECT_PREF, root); } catch { /* storage unavailable */ }
  await loadConfig(entries.some(e => e.isDir && e.name === CONFIG_DIR));
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
    row.dataset.program = n;
    row.onkeydown = e => { if (e.key === "Enter") void openProgram(n); };
    return row;
  }));
  els.listEmpty.hidden = names.length > 0 || !!query;
}

function treeRows(path: string, depth: number, out: HTMLElement[]) {
  if (creating?.dir === path) out.push(creating.row ??= nameBoxRow(path, creating.kind, depth)); // the same box across redraws
  for (const entry of dirCache.get(path) ?? []) {
    const open = entry.isDir && expanded.has(entry.path);
    const row = h("li", { role: "treeitem", tabIndex: 0, title: entry.path },
      h("span", { className: "twisty" }, entry.isDir ? (open ? "▾" : "▸") : ""),
      h("span", { className: "name" }, entry.name),
    );
    row.style.paddingLeft = `${10 + depth * 14}px`;
    row.dataset.path = entry.path;
    row.dataset.dir = String(entry.isDir);
    if (entry.isDir) row.setAttribute("aria-expanded", String(open));
    row.setAttribute("aria-selected", String(!entry.isDir && fileId(entry.path) === active));
    const act = () => { targetDir = entry.isDir ? entry.path : parentOf(entry.path); void (entry.isDir ? toggleDir(entry) : openFile(entry)); };
    row.onclick = act;
    row.onkeydown = e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); }
      else if (e.key === "Delete") { e.preventDefault(); void deleteEntry(entry.path, entry.isDir, e.shiftKey); }
    };
    out.push(row);
    if (open) treeRows(entry.path, depth + 1, out);
  }
}

function renderTree() {
  $("new-file").hidden = $("new-folder").hidden = !project;
  els.openFolder.hidden = !!project;
  els.projectName.textContent = project?.name ?? "No folder open";
  els.projectName.title = project?.root ?? "";
  els.treeEmpty.hidden = project !== null;
  const rows: HTMLElement[] = [];
  if (project) treeRows(project.root, 0, rows);
  const typing = !!creating?.row && creating.row.contains(document.activeElement);
  els.tree.replaceChildren(...rows);
  if (typing) creating!.row!.querySelector("input")?.focus();
}

function renderTabs() {
  els.tabs.replaceChildren(...tabOrder.map(id => {
    const doc = docs.get(id), item = (doc ?? views.get(id))!;
    const tab = h("div", { className: `tab${doc ? "" : " view-tab"}`, role: "tab", tabIndex: 0, title: item.hint ?? item.label, onclick: () => activate(id) },
      item.label,
      ...(doc && isDirty(doc) ? [h("span", { className: "dirty", title: "Unsaved changes" })] : []),
      h("button", { className: "close", title: `Close ${item.label}`, onclick: (e: Event) => { e.stopPropagation(); closeTab(id); } }, "×"),
    );
    tab.setAttribute("aria-selected", String(id === active));
    tab.dataset.tab = id;
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
    rulers: basic && settings().showRuler ? [screenCols() - 1] : [],
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

/** The encoding picker in the status bar, for project files: reopen in, or save as, another encoding. */
function renderEncoding(doc: Doc | undefined) {
  els.encoding.hidden = !doc?.encoding;
  if (!doc?.encoding) return;
  const key = encodingKey(doc.encoding);
  if (els.encoding.dataset.for !== `${doc.id}|${key}`) {
    els.encoding.dataset.for = `${doc.id}|${key}`;
    const option = (action: string, e: Encoding) => h("option", { value: `${action}:${encodingKey(e)}` }, e.label);
    els.encoding.replaceChildren(
      h("option", { value: "", hidden: true }, doc.encoding.label),
      Object.assign(document.createElement("optgroup"), { label: "Reopen with encoding" }),
      Object.assign(document.createElement("optgroup"), { label: "Save with encoding" }));
    const [, reopen, save] = els.encoding.children;
    reopen.append(...ENCODINGS.map(e => option("reopen", e)));
    save.append(...ENCODINGS.filter(canSave).map(e => option("save", e)));
  }
  els.encoding.value = "";
  els.encoding.title = `${doc.encoding.label}. Pick an encoding to reopen or save this file in.`;
}

function renderStatus() {
  renderProject();
  const doc = activeDoc();
  const pos = editor.getPosition();
  els.pos.textContent = doc && pos ? `Ln ${pos.lineNumber}, Col ${pos.column}` : "";
  renderEncoding(doc);
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

// ── Right-click menus ──────────────────────────────────────────────────────

const copy = (text: string, what: string) =>
  navigator.clipboard.writeText(text).then(() => setMessage(`Copied ${what}`), () => setMessage("Couldn't copy to the clipboard."));

function closeOthers(keep: string, toRight = false) {
  const from = tabOrder.indexOf(keep);
  for (const id of [...tabOrder]) if (id !== keep && (!toRight || tabOrder.indexOf(id) > from)) closeTab(id);
}

async function sendPath(path: string, name: string) {
  try { await calc.send([{ name, bytes: await fs.readBinary(path) }]); } catch (err) { setMessage(`Could not send ${name}: ${err}`); }
}

// ── Creating files and folders in the tree ──
// As in VS Code: a name box appears in the tree inside the folder, Enter creates, Escape cancels,
// clicking away creates if a name was typed, and "a/b/c.c" creates the folders on the way.

/** The folder the header's New file and New folder buttons create in: the last folder clicked, or the one holding the last file clicked. */
let targetDir: string | null = null;
/** The name box being shown, if any. */
let creating: { dir: string; kind: "file" | "folder"; row?: HTMLElement } | null = null;

const parentOf = (path: string) => path.replace(/[\\/][^\\/]*$/, "");

/** Shows a name box for a new file or folder inside `dir`, opening the folder if needed. */
async function createIn(dir: string, kind: "file" | "folder") {
  if (!project) return;
  showPane("files");
  if (dir !== project.root && !expanded.has(dir)) {
    expanded.add(dir);
    if (!dirCache.has(dir)) dirCache.set(dir, await fs.readDir(dir).catch(() => [] as Entry[]));
  }
  creating = { dir, kind };
  renderTree();
  const input = creating.row?.querySelector("input");
  input?.focus();
  input?.scrollIntoView({ block: "nearest" });
}

/** Why a name can't be used, or null if it can. Slashes make folders on the way. */
function nameProblem(dir: string, name: string): string | null {
  if (!name) return null;
  const parts = name.split(/[\\/]/);
  if (parts.some(p => !p.trim())) return "A name can't start or end with a slash, or have two in a row.";
  if (parts.some(p => /[:*?"<>|]/.test(p))) return 'A name can\'t contain : * ? " < > |';
  if (parts.some(p => p === "." || p === "..")) return "A name can't be . or ..";
  if (parts.some(p => /[. ]$/.test(p))) return "A name can't end with a dot or a space.";
  const first = parts[0].toLowerCase();
  const clash = (dirCache.get(dir) ?? []).find(e => e.name.toLowerCase() === first);
  if (clash && (parts.length === 1 || !clash.isDir)) return `${parts.length === 1 ? name : parts[0]} already exists here. Choose a different name.`;
  return null;
}

/** The name box row in the tree. */
function nameBoxRow(dir: string, kind: "file" | "folder", depth: number): HTMLElement {
  const input = h("input", { className: "name-input", spellcheck: false, ariaLabel: `New ${kind} name` });
  const problem = h("div", { className: "name-problem", hidden: true });
  const row = h("li", { className: "creating" },
    h("span", { className: "twisty" }, kind === "folder" ? "▸" : ""), input, problem);
  row.style.paddingLeft = `${10 + depth * 14}px`;
  let done = false;
  const finish = async (commit: boolean) => {
    if (done) return;
    const name = input.value.trim();
    if (commit && name && nameProblem(dir, name)) { input.focus(); return; }
    done = true;
    creating = null;
    if (!commit || !name) return renderTree();
    const path = joinPath(dir, name);
    try {
      if (kind === "folder") await fs.createDir(path);
      else await fs.writeFile(path, "");
      // Refresh and open every folder on the way, so the new item shows.
      let at = dir;
      for (const part of name.split(/[\\/]/).slice(0, kind === "folder" ? undefined : -1)) {
        dirCache.set(at, await fs.readDir(at));
        at = joinPath(at, part);
        expanded.add(at);
      }
      dirCache.set(at, await fs.readDir(at).catch(() => [] as Entry[]));
      if (kind === "folder") targetDir = path;
      renderTree();
      if (kind === "file") await openFile({ name: baseName(path), path, isDir: false });
      else setMessage(`Created ${name}`);
    } catch (err) {
      renderTree();
      setMessage(`Could not create ${name}: ${err}`);
    }
  };
  input.addEventListener("input", () => {
    const why = nameProblem(dir, input.value.trim());
    problem.hidden = !why;
    problem.textContent = why ?? "";
    row.classList.toggle("invalid", !!why);
  });
  input.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter") { e.preventDefault(); void finish(true); }
    else if (e.key === "Escape") { e.preventDefault(); void finish(false); }
  });
  // Clicking away creates it if the name is good, and drops it otherwise.
  input.addEventListener("blur", () => window.setTimeout(() => {
    if (document.activeElement === input) return; // the tree was only redrawn
    void finish(!nameProblem(dir, input.value.trim()));
  }));
  return row;
}

/** Deletes a file or folder from the Explorer: to the Recycle Bin, or permanently. Closes its tabs. */
async function deleteEntry(path: string, isDir: boolean, permanent: boolean) {
  const name = baseName(path), what = isDir ? `the folder ${name} and everything in it` : name;
  const bin = navigator.userAgent.includes("Mac") ? "Trash" : "Recycle Bin";
  const ok = permanent
    ? confirm(`Permanently delete ${what}?

This can't be undone.`)
    : confirm(`Move ${what} to the ${bin}?

You can restore it from there.`);
  if (!ok) return;
  // Unsaved changes in files being deleted are lost with them.
  const inside = (id: string) => {
    const p = docs.get(id)?.hint ?? views.get(id)?.hint;
    return !!p && (p === path || p.startsWith(path + "\\") || p.startsWith(path + "/"));
  };
  try {
    await fs.deletePath(path, permanent);
  } catch (err) {
    return setMessage(`Could not delete ${name}: ${err}`);
  }
  for (const id of tabOrder.filter(inside)) {
    const doc = docs.get(id);
    if (doc) doc.savedVersion = doc.model.getAlternativeVersionId(); // nothing to save any more
    closeTab(id);
  }
  const parent = parentOf(path);
  dirCache.set(parent, await fs.readDir(parent).catch(() => [] as Entry[]));
  for (const key of [...dirCache.keys()]) if (key.startsWith(path)) dirCache.delete(key);
  if (targetDir?.startsWith(path)) targetDir = parent;
  renderTree();
  void scm.refresh();
  setMessage(permanent ? `Deleted ${name}` : `Moved ${name} to the ${bin}`);
}

/** Delete items for the Explorer menu: one that Shift turns permanent, or both, by the setting. */
function deleteItems(path: string, isDir: boolean): MenuItem[] {
  const trash = { label: "Delete", shortcut: "Delete", run: () => void deleteEntry(path, isDir, false) };
  const permanent = { label: "Delete permanently", shortcut: "Shift+Delete", run: () => void deleteEntry(path, isDir, true) };
  return settings().shiftDeletes ? [{ ...trash, shift: permanent }] : [trash, permanent];
}

/** Menu items for a folder: the project's root or one inside it. */
function folderItems(path: string, isRoot: boolean): MenuItem[] {
  return [
    ...(isRoot ? [] : [{ label: expanded.has(path) ? "Collapse" : "Expand", run: () => void toggleDir({ name: baseName(path), path, isDir: true }) }]),
    { label: "New file…", run: () => void createIn(path, "file") },
    { label: "New folder…", run: () => void createIn(path, "folder") },
    "-",
    { label: "Copy path", run: () => void copy(path, "path") },
    { label: "Copy name", run: () => void copy(baseName(path), baseName(path)) },
    "-",
    { label: "Refresh", run: () => void (project && loadProject(project.root, false)) },
    ...(isRoot ? [] : ["-" as const, ...deleteItems(path, true)]),
    ...(isRoot ? ["-" as const,
      { label: "Project settings (.tide/tide.json)", run: () => void openProjectFile() },
      { label: "Open another folder…", shortcut: "Ctrl+Shift+O", run: () => void openFolder() }] : []),
  ];
}

/** What the menu offers depends on what was right-clicked. */
function menuFor(target: HTMLElement): MenuItem[] | null {
  const program = target.closest<HTMLElement>("[data-program]")?.dataset.program;
  if (program) {
    return [
      { label: "Open", run: () => void openProgram(program) },
      { label: "Run in calculator", shortcut: "F5", disabled: !fs.available, run: () => void openProgram(program).then(runInEmulator) },
      { label: "Build .8xp", shortcut: "Ctrl+E", run: () => void openProgram(program).then(() => exportActive()) },
      "-",
      { label: "Copy name", run: () => void copy(program, program) },
      "-",
      { label: "Delete…", run: () => void deleteProgram(program) },
    ];
  }
  // The project's root folder: its header, or empty space below the tree.
  if (project && target.closest(".project-head, #tree-empty, .files") && !target.closest("[data-path], [data-program], #list, #open-folder")) {
    return folderItems(project.root, true);
  }
  const row = target.closest<HTMLElement>("[data-path]");
  if (row?.dataset.dir === "true") return folderItems(row.dataset.path!, false);
  if (row) {
    const path = row.dataset.path!, name = baseName(path), isDir = row.dataset.dir === "true";
    const entry: Entry = { name, path, isDir };
    const tiFile = !isDir && SEND_TYPES.includes(extOf(name));
    return [
      isDir ? { label: expanded.has(path) ? "Collapse" : "Expand", run: () => void toggleDir(entry) }
        : { label: "Open", run: () => void openFile(entry) },
      ...(tiFile ? [{ label: "Send to calculator", run: () => void sendPath(path, name) }] : []),
      "-",
      { label: "Copy path", run: () => void copy(path, "path") },
      { label: "Copy name", run: () => void copy(name, name) },
      "-",
      { label: "Refresh", run: () => void (project && loadProject(project.root, false)) },
      "-",
      ...deleteItems(path, isDir),
    ];
  }
  const tab = target.closest<HTMLElement>("[data-tab]")?.dataset.tab;
  if (tab) {
    const path = docs.get(tab)?.hint ?? views.get(tab)?.hint;
    return [
      { label: "Close", shortcut: "Ctrl+W", run: () => closeTab(tab) },
      { label: "Close others", disabled: tabOrder.length < 2, run: () => closeOthers(tab) },
      { label: "Close to the right", disabled: tabOrder.indexOf(tab) === tabOrder.length - 1, run: () => closeOthers(tab, true) },
      { label: "Close all", run: () => { for (const id of [...tabOrder]) closeTab(id); } },
      ...(path ? ["-" as const, { label: "Copy path", run: () => void copy(path, "path") }] : []),
    ];
  }
  if (target.closest("#calc-lcd")) {
    return [
      { label: "Send files…", run: () => $("calc-send").click() },
      { label: "Copy screenshot", run: () => {
        $<HTMLCanvasElement>("calc-lcd").toBlob(blob => {
          if (!blob) return;
          navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
            .then(() => setMessage("Copied the screen"), () => setMessage("Couldn't copy to the clipboard."));
        });
      } },
      { label: calc.consoleShown ? "Hide console" : "Show console", run: () => { calc.consoleShown = !calc.consoleShown; } },
      "-",
      { label: "Reset calculator", run: () => $("calc-reset").click() },
    ];
  }
  return null;
}

/** The editor's menu: clipboard, comments, labels, docs for the word under the mouse, and Run. */
function editorMenu(position: monaco.IPosition | null): MenuItem[] {
  const doc = activeDoc();
  if (!doc) return [];
  const act = (id: string) => () => { editor.focus(); void editor.getAction(id)?.run(); };
  const word = position ? doc.model.getWordAtPosition(position)?.word : undefined;
  const lang = catalogLang();
  const hasDocs = !!word && !!lang && DOCS.find(d => d.id === lang)!.groups.some(g => g.entries.some(e => e.name === word || e.name === `${word}(`));
  const selection = !editor.getSelection()?.isEmpty();
  return [
    { label: "Cut", shortcut: "Ctrl+X", disabled: !selection, run: act("editor.action.clipboardCutAction") },
    { label: "Copy", shortcut: "Ctrl+C", disabled: !selection, run: act("editor.action.clipboardCopyAction") },
    { label: "Paste", shortcut: "Ctrl+V", run: () => {
      navigator.clipboard.readText().then(text => { editor.focus(); editor.trigger("menu", "type", { text }); }, () => setMessage("Couldn't read the clipboard."));
    } },
    { label: "Select all", shortcut: "Ctrl+A", run: act("editor.action.selectAll") },
    "-",
    { label: "Toggle comment", shortcut: "Ctrl+/", run: act("editor.action.commentLine") },
    ...(doc.language === "tibasic" ? [{ label: "Go to label", shortcut: "F12", run: act("editor.action.revealDefinition") }] : []),
    ...(hasDocs ? [{ label: `Docs for ${word}`, run: () => {
      const name = DOCS.find(d => d.id === lang)!.groups.flatMap(g => g.entries).find(e => e.name === word || e.name === `${word}(`)!.name;
      openDocs(name);
    } }] : []),
    "-",
    { label: "Run in calculator", shortcut: "F5", disabled: els.run.hidden, run: () => void runInEmulator() },
    { label: usesMake() ? "Build" : "Build .8xp", shortcut: "Ctrl+E", disabled: els.exportBtn.hidden, run: () => void exportActive() },
  ];
}

// Every right-click gets TIde's menu or none; text boxes keep their own (for spelling and paste).
document.addEventListener("contextmenu", e => {
  const target = e.target as HTMLElement;
  if (target.closest("input, textarea, select, .monaco-editor")) {
    if (!target.closest(".monaco-editor")) return;
  }
  e.preventDefault();
  if (target.closest(".monaco-editor")) return; // the editor shows its own, below
  const items = menuFor(target);
  if (items) showMenu(e.clientX, e.clientY, items);
});
editor.onContextMenu(e => {
  e.event.preventDefault();
  if (e.target.position) {
    const selection = editor.getSelection();
    if (!selection || !selection.containsPosition(e.target.position)) editor.setPosition(e.target.position);
  }
  showMenu(e.event.posx, e.event.posy, editorMenu(e.target.position));
});

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
window.addEventListener("focus", () => { if (settings().refreshScmOnFocus) void scm.refresh(); }); // files may have changed outside TIde
els.openFolder.addEventListener("click", () => void openFolder());
$("new-file").addEventListener("click", () => void (project && createIn(targetDir ?? project.root, "file")));
$("new-folder").addEventListener("click", () => void (project && createIn(targetDir ?? project.root, "folder")));
// The File menu: programs, files, folders, saving, building and settings in one place.
$("file-menu").addEventListener("click", e => {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const doc = activeDoc();
  showMenu(r.left, r.bottom + 2, [
    { label: "New program…", shortcut: "Ctrl+N", run: () => { showPane("files"); els.find.focus(); } },
    { label: "New file…", disabled: !project, run: () => void (project && createIn(targetDir ?? project.root, "file")) },
    { label: "New folder…", disabled: !project, run: () => void (project && createIn(targetDir ?? project.root, "folder")) },
    "-",
    { label: "Open folder…", shortcut: "Ctrl+Shift+O", run: () => void openFolder() },
    { label: "Send files to calculator…", run: () => { void calc.show().then(() => $("calc-send").click()); } },
    "-",
    { label: "Save", shortcut: "Ctrl+S", disabled: !doc, run: () => void saveActive() },
    { label: "Save all", disabled: ![...docs.values()].some(isDirty), run: () => { for (const d of docs.values()) if (isDirty(d)) void saveDoc(d); } },
    "-",
    { label: usesMake() ? "Build" : "Build .8xp", shortcut: "Ctrl+E", disabled: els.exportBtn.hidden, run: () => void exportActive() },
    { label: "Build to…", shortcut: "Ctrl+Shift+E", disabled: !doc || usesMake() || doc.language !== "tibasic", run: () => void exportActive(true) },
    { label: "Run in calculator", shortcut: "F5", disabled: els.run.hidden, run: () => void runInEmulator() },
    "-",
    { label: "Project settings (.tide/tide.json)", disabled: !project, run: () => void openProjectFile() },
    { label: "Settings", shortcut: "Ctrl+,", run: openSettings },
    "-",
    { label: "Close tab", shortcut: "Ctrl+W", disabled: !active, run: () => { if (active) closeTab(active); } },
    { label: "Close all tabs", disabled: !tabOrder.length, run: () => { for (const id of [...tabOrder]) closeTab(id); } },
  ]);
});
els.gutter.addEventListener("click", () => setGutter(!showNumbers));
els.encoding.addEventListener("change", () => {
  const [action, key] = els.encoding.value.split(":");
  const encoding = encodingByKey(key);
  if (encoding) void (action === "reopen" ? reopenWith(encoding) : saveWith(encoding));
});
$("act-settings").addEventListener("click", openSettings);
els.scripts.addEventListener("change", () => { const name = els.scripts.value; els.scripts.value = ""; if (name) void runScript(name); });
onSettingsChange(s => {
  editor.updateOptions({
    fontSize: s.fontSize, lineHeight: Math.round(s.fontSize * 1.7), wordWrap: s.wordWrap ? "on" : "off",
    minimap: { enabled: s.minimap }, renderWhitespace: s.renderWhitespace,
  });
  for (const doc of docs.values()) if (doc.language !== ASM_LANG && doc.language !== "tibasic") doc.model.updateOptions({ tabSize: s.tabSize });
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
  else if (key === ",") { e.preventDefault(); openSettings(); }
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
  if (!import.meta.env.DEV && settings().checkUpdates) void checkForUpdate(setMessage, true);
}

// Reopen the last project folder, quietly: if it moved or was deleted, just start empty.
if (fs.available) {
  let last: string | null = null;
  try { last = localStorage.getItem(PROJECT_PREF); } catch { /* storage unavailable */ }
  if (last) loadProject(last, false).catch(() => { project = null; renderTree(); });
}