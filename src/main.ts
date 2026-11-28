/// <reference types="vite/client" />
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { applyFonts, chooseFontFile, FILE, fontFileName, FONTS, readFontFileName } from "./fonts";
import * as monaco from "monaco-editor/editor/editor.api.js";
// The bare API ships no editor widgets, so the full entry is imported for its side effects.
import "monaco-editor"; // full entry: registers suggest, hover, parameter hints, folding and marker navigation
import editorWorker from "monaco-editor/editor/editor.worker.js?worker";
import jsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import tsWorker from "monaco-editor/language/typescript/ts.worker.js?worker";
import { json as monacoJson, typescript as monacoTs } from "monaco-editor";
import { languageFor, registerTiBasic, tiCatalog } from "./language";
import { applyIndentation, registerIndentation } from "./indent";
import { isLight, listThemes, startingEditorTheme, watchTheme } from "./theme";
import { createSerialView } from "./serial-view";
import { TARGETS, getTarget, isTarget, onTargetChange, setTarget, type Target } from "./target";
import { C_CATALOG } from "./c-support";
import { PY_CATALOG, watchPython } from "./py2ez80-support";
import { TI_PYTHON_CATALOG } from "./tipython-support";
import { ASM_CATALOG, ASM_LANG } from "./asm-support";
import { getVersion as appVersion } from "@tauri-apps/api/app";
import { createScm } from "./scm";
import { menuIsOpen, showMenu, type MenuItem } from "./menu";
import { isMac, keys, mod } from "./keys";
import { openWindow, titleWindow, windowStart, type WindowStart } from "./windows";
import "./select-popup"; // TIde's own option list for every <select>
import { offerToolchain, type ToolchainOffer } from "./toolchain-setup";
import { SEND_TYPES, TREE_DRAG, createCalc, unbundle } from "./calc";
import {
  ENCODINGS,
  canSave,
  decodeWith,
  detect,
  encode,
  encodingByKey,
  encodingKey,
  type Encoding,
} from "./encoding";
import { hexDump, parseTiFile } from "./tifile";
import {
  onSettingsChange,
  projectSettings,
  resetSettings,
  setProjectSettings,
  setSetting,
  settings,
  settingsPage,
  type Row,
  type Settings,
} from "./settings";

/**
 * Updates are the desktop app's alone. The web version is always the one on its page, so it has no
 * update button, settings or code: MODE is fixed when Vite builds, and the web build leaves the
 * updater (updater.ts and the updater plugin) out entirely.
 */
const updater = import.meta.env.MODE === "web" ? null : () => import("./updater");
const checkForUpdate = (say: (text: string) => void, quiet = false) =>
  updater ? updater().then((u) => u.checkForUpdate(say, quiet)) : Promise.resolve();
import {
  CONFIG_DIR,
  CONFIG_FILE,
  CONFIG_SCHEMA,
  CONFIG_TEMPLATE,
  parseMacro,
  readConfig,
  splitCommand,
  splitPattern,
  steps,
  type ProjectConfig,
  type ProjectLanguage,
} from "./config";
import { DOCS, createDocs, type DocLangId } from "./docs";
import { watchModel } from "./intellisense";
import { make8xp, tokenize } from "./build";
import { exportProgram } from "./export";
import {
  EXTENSION_SCHEMA,
  EXTENSION_TYPES,
  commandApplies,
  emit,
  extensionCommands,
  extensionsFolder,
  loadExtensions,
  reloadExtensions,
  type BundledExtension,
  type CommandContext,
  type ExtensionHost,
  type ExtensionManifest,
} from "./extensions";
import { createExtensionsView } from "./extensions-view";
import { createPanel } from "./panel";
import { assemble, programName } from "./spasm";
import { runWebMake } from "./webmake";
import { fs, normalizeName, store, type Entry, type ToolchainKind, type ToolchainStatus } from "./store";

(self as unknown as { MonacoEnvironment: object }).MonacoEnvironment = {
  getWorker: (_: unknown, label: string) =>
    label === "json"
      ? new jsonWorker()
      : label === "typescript" || label === "javascript"
        ? new tsWorker()
        : new editorWorker(),
};
// tide.json gets completions, hover help and checking from its schema. Comments are allowed in it.
monacoJson.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  allowComments: true,
  trailingCommas: "ignore",
  schemas: [
    {
      uri: "tide://schema/tide.json",
      fileMatch: [`**/${CONFIG_DIR}/${CONFIG_FILE}`],
      schema: CONFIG_SCHEMA,
    },
    {
      uri: "tide://schema/extension.json",
      fileMatch: ["**/extensions/*/extension.json"],
      schema: EXTENSION_SCHEMA,
    },
  ],
});
// An extension's main.js gets completions and checking for the tide API it's given.
monacoTs.javascriptDefaults.addExtraLib(
  EXTENSION_TYPES,
  "file:///tide/extension-api.d.ts",
);
monacoTs.javascriptDefaults.setCompilerOptions({
  target: monacoTs.ScriptTarget.ESNext,
  module: monacoTs.ModuleKind.ESNext,
  allowNonTsExtensions: true,
  allowJs: true,
  lib: ["esnext", "dom"],
});

const screenCols = () => TARGETS[getTarget()].cols;

/** One open editor tab: either a TI-BASIC program from the store or a file from the open project folder. */
interface Doc {
  id: string; // "prgm:NAME" or "file:/absolute/path"
  label: string; // tab title
  hint?: string; // tab tooltip (full path for project files)
  language: string;
  model: monaco.editor.ITextModel;
  savedVersion: number;
  write: (source: string) => Promise<void>;
  /** For project files: the text encoding it was read in and is saved in. */
  encoding?: Encoding;
  /** For project files: the text as it was last read from or written to disk, to tell when it changes there. */
  disk?: string;
  /** The disk's newer text, when the file changed there while this tab had unsaved changes. */
  diskChanged?: string | "deleted";
}

/** A tab that isn't a text editor: Settings, a TI file's metadata, or a file TIde can't show as text. */
interface View {
  id: string;
  label: string;
  hint?: string;
  el: HTMLElement;
}

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
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
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { role?: string } = {},
  ...kids: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  if (props.role) node.setAttribute("role", props.role);
  node.append(...kids);
  return node;
}

// ── State ──────────────────────────────────────────────────────────────────

// The docs page is a tab: its view is this element, moved into the view host when it shows.
const docsEl = $("docs");
docsEl.remove();
docsEl.hidden = false;
const docsView = createDocs(docsEl);
/** The docs tab's id. */
const DOCS_TAB = "view:docs";
/** The Serial tab's id: a calculator on a serial cable (serial-view.ts). */
const SERIAL_TAB = "view:serial";

// The calculator's console lines also go to the Console tab under the editor. The calculator starts
// before that panel exists, so its first lines wait here.
const consoleBacklog: [string, "out" | "err" | "info" | "emu"][] = [];
let toConsole = (text: string, kind: "out" | "err" | "info" | "emu") => {
  consoleBacklog.push([text, kind]);
};
const calc = createCalc({
  onLog: (text, kind) => toConsole(text, kind),
  say: (text) => setMessage(text),
  pickRom: (label, extensions) => fs.pickFile(label, extensions),
  pickFiles: () => fs.pickFiles("TI files", SEND_TYPES),
  readFile: (path) => fs.readBinary(path),
  serialConnected: (link, portName) => serialView.adopt(link, portName),
  serialDropped: () => serialView.dropped(),
  layout: () => {
    // The calculator takes the editor area, like the docs page; only one of them shows at a time.
    // and it has its own tab: showing it opens the tab, hiding it while its tab is active closes the tab.
    $("act-calc").setAttribute("aria-pressed", String(calc.visible));
    if (calc.visible) {
      if (active !== CALC_TAB) {
        views.set(CALC_TAB, {
          id: CALC_TAB,
          label: "Calculator",
          hint: "The TI-84 Plus CE emulator",
          el: h("div"),
        });
        if (!tabOrder.includes(CALC_TAB)) tabOrder.push(CALC_TAB);
        active = CALC_TAB;
        showActive();
        refresh();
      }
    } else if (active === CALC_TAB) closeTab(CALC_TAB);
  },
});

// The Serial tab: a calculator on a serial cable. While it's connected, the calculator panel uses it too.
const serialView = createSerialView({
  say: (text) => setMessage(text),
  log: (text, err) => toConsole(text, err ? "err" : "info"),
  connect: () => calc.connectReal(),
  disconnect: () => calc.disconnectReal(),
  pickFiles: () => fs.pickFiles("TI files", SEND_TYPES),
  readFile: (path) => fs.readBinary(path),
});
function openSerialTab() {
  openView({
    id: SERIAL_TAB,
    label: "Serial",
    hint: "A calculator on a serial cable (TI-Graph Link)",
    el: serialView.el,
  });
}

const scm = createScm({
  root: () => project?.root ?? null,
  open: (path, name) => void openFile({ name, path, isDir: false }),
  say: (text) => setMessage(text),
  changed: (status) => {
    // Changed-file count on the activity bar, and the branch in the status bar.
    const badge = $("scm-badge"),
      branch = $<HTMLButtonElement>("status-branch");
    const count = status?.files.length ?? 0;
    badge.hidden = !count;
    badge.textContent = count > 99 ? "99+" : String(count);
    branch.hidden = !status?.branch;
    if (status) {
      const sync = [
        status.ahead && `↑${status.ahead}`,
        status.behind && `↓${status.behind}`,
      ]
        .filter(Boolean)
        .join(" ");
      branch.textContent = `⎇ ${status.branch}${sync ? ` ${sync}` : ""}`;
      branch.title = `${status.branch}${status.upstream ? "" : " (not pushed yet)"} · Source Control`;
    }
  },
});

// TI-BASIC's highlighting is TIde's own; the IntelliSense for every language comes from the built-in
// CE Languages extension, which starts below.
registerTiBasic();
registerIndentation();
watchTheme();

// The calculator shows a ":" before every line. It is a gutter, not file content, so saved programs stay clean.
const GUTTER_PREF = "tide-pref-numbers"; // must not start with "tide:" or the browser store lists it as a program
const PROJECT_PREF = "tide-pref-project"; // same rule
const BUILD_PREF = "tide-pref-builds"; // same rule
let showNumbers = false;
try {
  showNumbers = localStorage.getItem(GUTTER_PREF) === "1";
} catch {
  /* storage unavailable */
}

function gutterOptions(): Pick<
  monaco.editor.IEditorOptions,
  "lineNumbers" | "lineNumbersMinChars"
> {
  return showNumbers
    ? { lineNumbers: "on", lineNumbersMinChars: 3 }
    : { lineNumbers: () => ":", lineNumbersMinChars: 1 };
}

const editor = monaco.editor.create($("editor"), {
  model: null,
  theme: startingEditorTheme(),
  automaticLayout: true,
  fontSize: settings().fontSize,
  lineHeight: Math.round(settings().fontSize * 1.7),
  wordWrap: settings().wordWrap ? "on" : "off",
  renderWhitespace: settings().renderWhitespace,
  fontFamily: getComputedStyle(document.body).getPropertyValue("--mono"),
  fontLigatures: settings().fontLigatures,
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
  // Files dropped on the editor open in tabs (setUpDragging), rather than going into the text.
  dropIntoEditor: { enabled: false },
});
// On macOS the editor has Cmd+E (find with the selection) and Cmd+Shift+G (previous match), which
// are Build and Source Control in TIde; Cmd+G and Enter still go through the matches.
if (isMac)
  monaco.editor.addKeybindingRules([
    { keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, command: "-actions.findWithSelection" },
    {
      keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyG,
      command: "-editor.action.previousMatchFindAction",
    },
  ]);
// The bundled code font loads after the editor measured its characters: measure again once it's in.
void document.fonts.load(`${settings().fontSize}px "JetBrains Mono Variable"`).then(() => monaco.editor.remeasureFonts());
// The code and interface fonts you picked (fonts.ts), once they're loaded.
void applyFonts(settings(), editor);
void readFontFileName().then(() => refreshSettingsPage());

const docs = new Map<string, Doc>();
const views = new Map<string, View>();
/** The calculator's tab id. Its view is the calculator panel over the editor, not the view host. */
const CALC_TAB = "view:calculator";
let tabOrder: string[] = [];
let active: string | null = null;
/** The last file or program tab shown, which the docs tab follows. */
let lastDocTab: string | null = null;
let names: string[] = [];

// Build state: tokenize errors per program name, so the list can flag ones that won't build.
const buildErrors = new Map<string, number>();

// Project folder: entries are loaded one directory at a time, when it is first expanded.
let project: { root: string; name: string; hasMakefile: boolean } | null = null;
/**
 * The folders open in this window: one, or several in a workspace. `project` is the active one,
 * which builds, Source Control, the terminal and tide.json follow; it's the folder of the file
 * you're in. A saved workspace is a .tide-workspace file listing its folders.
 */
let workspace: { file: string | null; folders: string[] } = { file: null, folders: [] };
/** Workspace folders folded shut in the Explorer. */
const foldedFolders = new Set<string>();
const WORKSPACE_PREF = "tide-pref-workspace"; // not "tide:", which the browser store treats as a program
const WORKSPACE_EXT = "tide-workspace";
const nightlyWeb = fs.web && import.meta.env.BASE_URL.endsWith("/nightly/");
/** The open project's tide.json, or {} when it has none. */
let config: ProjectConfig = {};
let building = false;
const dirCache = new Map<string, Entry[]>();
const expanded = new Set<string>();

const progId = (name: string) => `prgm:${name}`;
const fileId = (path: string) => `file:${path}`;
const baseName = (path: string) =>
  path.split(/[\\/]/).filter(Boolean).pop() ?? path;
const isDirty = (d: Doc) =>
  d.model.getAlternativeVersionId() !== d.savedVersion;
const activeDoc = () => (active ? docs.get(active) : undefined);
/** In a folder with a Makefile, everything except a TI-BASIC program builds with make. */
const usesMake = () =>
  !!project &&
  (project.hasMakefile || !!config.build) &&
  activeDoc()?.language !== "tibasic";
/** The open file is assembly that spasm-ng builds: z80 (TI-83 Plus / 84 Plus), or eZ80 outside a make project. */
const assemblesActive = () => {
  const doc = activeDoc();
  return (
    !!doc &&
    !!project &&
    doc.id.startsWith("file:") &&
    (doc.language === "z80" || (doc.language === ASM_LANG && !usesMake()))
  );
};

/** The project's files, by path relative to its root with "/", for the assembler. Leaves out hidden and build folders. */
/** The project's files (or those in its folder `dir`), by path relative to it, for the browser's make. */
async function projectFiles(dir = ""): Promise<Map<string, Uint8Array>> {
  const out = new Map<string, Uint8Array>();
  const walk = async (dir: string, rel: string) => {
    for (const e of await fs.readDir(dir)) {
      if (
        e.name.startsWith(".") ||
        (e.isDir && ["node_modules", "bin", "obj", "target"].includes(e.name))
      )
        continue;
      if (out.size > 2000) return;
      if (e.isDir) await walk(e.path, `${rel}${e.name}/`);
      else if (
        !/\.(8x[a-z]|8e[a-z]|b8[34]|rom|zip|exe|png|jpe?g|gif)$/i.test(e.name)
      )
        out.set(`${rel}${e.name}`, await fs.readBinary(e.path));
    }
  };
  await walk(dir ? joinPath(project!.root, dir) : project!.root, "");
  return out;
}

/** Assembles the open file with spasm-ng: its log in Output, and the program on success. */
async function assembleActive(): Promise<{
  name: string;
  bytes: Uint8Array;
  path: string;
} | null> {
  const doc = activeDoc()!;
  if (isDirty(doc)) await saveDoc(doc);
  const path = doc.id.slice(5);
  const rel = path
    .slice(project!.root.length)
    .replace(/^[\\/]+/, "")
    .replace(/\\/g, "/");
  const name = programName(baseName(path));
  const ez80 = doc.language === ASM_LANG;
  setMessage(`Assembling ${doc.label}…`);
  const run = panel.outputRun(
    "Assemble",
    `spasm${ez80 ? " -E" : ""} ${rel} → ${name}.8xp`,
    () => {},
  );
  try {
    const result = await assemble(await projectFiles(), rel, name, ez80);
    if (result.log.trim()) run.write(`${result.log.trim()}\n`, !result.ok);
    run.end(result.ok, result.ok ? 0 : 1);
    if (!result.ok || !result.bytes) {
      panel.show("output");
      const first = result.log.split("\n").find((l) => /error/i.test(l));
      setMessage(
        `${doc.label} didn't assemble${first ? `: ${first.trim()}` : ""} (full log in Output)`,
      );
      return null;
    }
    const out = joinPath(parentOf(path), `${name}.8xp`);
    await fs.writeBinary(out, result.bytes);
    setMessage(
      `Assembled ${doc.label} into ${name}.8xp (${result.bytes.length} bytes)`,
    );
    return { name, bytes: result.bytes, path: out };
  } catch (err) {
    run.write(`${err}\n`, true);
    run.end(false, 1);
    setMessage(`Could not assemble ${doc.label}: ${err}`);
    return null;
  }
}
const joinPath = (root: string, rel: string) => {
  const sep = root.includes("\\") ? "\\" : "/";
  return [
    root.replace(/[\\/]+$/, ""),
    ...rel.split(/[\\/]/).filter(Boolean),
  ].join(sep);
};
const configPath = () =>
  project ? joinPath(project.root, `${CONFIG_DIR}/${CONFIG_FILE}`) : null;
const isBasic = () => (activeDoc()?.language ?? "tibasic") === "tibasic";
/** The folder a path is in, for running Luna beside the script it packs. */
const dirName = (path: string) => {
  const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return i < 0 ? "." : path.slice(0, i);
};
/** A script Run packs into a .tns with Luna: any .lua file, or a .py file outside a make project. */
const nspireScript = (d = activeDoc()) =>
  !!d &&
  (d.language === "lua" ||
    ((d.language === "tipython" || d.language === "python") && getTarget() === "nspire"));
/** The Build button's label for what the active file builds into. */
const buildLabel = () =>
  usesMake() ? "Build" : nspireScript() ? "Pack .tns" : "Build .8xp";

// ── Actions ────────────────────────────────────────────────────────────────

function addDoc(
  init: Pick<Doc, "id" | "label" | "hint" | "language" | "write"> & {
    source: string;
  },
): Doc {
  const model = monaco.editor.createModel(
    init.source,
    init.language,
    init.hint ? monaco.Uri.file(init.hint) : undefined,
  );
  const doc: Doc = {
    id: init.id,
    label: init.label,
    hint: init.hint,
    language: init.language,
    model,
    savedVersion: model.getAlternativeVersionId(),
    write: init.write,
  };
  docs.set(doc.id, doc);
  model.onDidChangeContent(() => {
    refresh();
    autoSaveSoon(doc);
  });
  // Each file keeps the indentation it has: tabs or spaces, in its own steps (indent.ts).
  applyIndentation(model, doc.label, doc.language, settings().tabSize);
  if (doc.language === "tibasic") watchModel(model);
  else if (doc.language === "python") watchPython(model);
  return doc;
}

function activate(id: string, note?: string) {
  const doc = docs.get(id),
    view = views.get(id);
  if (!doc && !view) return;
  if (!tabOrder.includes(id)) tabOrder.push(id);
  active = id;
  if (doc) lastDocTab = id;
  if (id === CALC_TAB) void calc.show();
  else if (calc.visible) calc.hide();
  showActive();
  if (doc) editor.focus();
  setMessage(note ?? `Opened ${(doc ?? view)!.label}`);
  refresh();
  if (doc)
    emit("open", {
      name: doc.label,
      path: doc.id.startsWith("file:") ? doc.id.slice(5) : null,
      language: doc.language,
    });
  // In a workspace, the file's folder becomes the active one.
  if (doc?.id.startsWith("file:") && project && workspace.folders.length > 1) {
    const folder = folderOf(doc.id.slice(5));
    if (folder && samePath(folder) !== samePath(project.root)) void useFolder(folder);
  }
}

/** Shows the active tab: its model in the editor, or its view over the editor. */
function showActive() {
  const view = active && active !== CALC_TAB ? views.get(active) : undefined;
  editor.setModel(active ? (docs.get(active)?.model ?? null) : null);
  els.viewHost.hidden = !view;
  if (view && els.viewHost.firstElementChild !== view.el)
    els.viewHost.replaceChildren(view.el);
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
    if (!docs.has(id))
      addDoc({
        id,
        label: name,
        language: "tibasic",
        source,
        write: (s) => store.save(name, s),
      });
  }
  activate(id, note);
}

const extOf = (name: string) =>
  name.slice(name.lastIndexOf(".") + 1).toLowerCase();

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
  if (SEND_TYPES.includes(extOf(entry.name)))
    return openView(await tiFileView(entry, bytes));
  if (IMAGE_TYPES[extOf(entry.name)]) return openView(imageView(entry, bytes));
  const fallback = encodingByKey(settings().fallbackEncoding) ?? ENCODINGS[4];
  const found = detect(bytes, fallback);
  if (!found) return openView(unsupportedView(entry, bytes));
  openText(entry, found.text, found.encoding);
  if (found.encoding !== ENCODINGS[0])
    setMessage(`Opened ${entry.name} as ${found.encoding.label}`);
}

/** Opens a project file as text in an encoding, saving it back in the same encoding. */
function openText(entry: Entry, text: string, encoding: Encoding) {
  const id = fileId(entry.path);
  let path = entry.path;
  const doc = addDoc({
    id,
    label: entry.name,
    hint: entry.path,
    language: projectLanguageFor(entry.name),
    source: text,
    async write(s) {
      // A file dropped from outside has nowhere to go back to: the first save asks where.
      if (path.startsWith(DROPPED)) {
        const ext = entry.name.includes(".") ? extOf(entry.name) : "";
        const to = await fs.pickSaveFile(entry.name, {
          name: ext ? `.${ext} file` : "File",
          extensions: ext ? [ext] : ["*"],
        });
        if (!to) throw new Error("no place was chosen");
        path = to;
        docs.get(id)!.hint = to;
      }
      await fs.writeBinary(path, encode(s, docs.get(id)!.encoding!));
    },
  });
  doc.encoding = encoding;
  doc.disk = text;
  activate(id);
}

/** Reopens the active file from disk in another encoding. */
async function reopenWith(encoding: Encoding) {
  const doc = activeDoc();
  if (!doc?.encoding || !doc.hint) return;
  if (
    isDirty(doc) &&
    !confirm(
      `Reopening ${doc.label} as ${encoding.label} discards your unsaved changes. Continue?`,
    )
  )
    return renderStatus();
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
  if (!canSave(encoding)) {
    setMessage(`TIde can open ${encoding.label} but not save it.`);
    return renderStatus();
  }
  const before = doc.encoding;
  doc.encoding = encoding;
  if (!(await saveDoc(doc))) doc.encoding = before;
  else setMessage(`Saved ${doc.label} as ${encoding.label}`);
  refresh();
}

/** Image files the editor shows as pictures, with the type each is served as. */
const IMAGE_TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", bmp: "image/bmp",
  webp: "image/webp", avif: "image/avif", ico: "image/x-icon", svg: "image/svg+xml",
};

/**
 * An image file, shown in the editor: the picture on a checkerboard (so transparency shows), with
 * its dimensions and size above. It opens fitted to the editor; it zooms with the − and + buttons,
 * Ctrl+wheel (or a trackpad pinch) about the pointer, and +, − and 0 (fit) while it has focus.
 * Clicking the percentage goes to 100%. Zoomed past 100%, pixels stay sharp, for sprites.
 */
function imageView(entry: Entry, bytes: Uint8Array): View {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: IMAGE_TYPES[extOf(entry.name)] }));
  const img = h("img", { src: url, alt: entry.name, draggable: false });
  const stage = h("div", { className: "image-stage", tabIndex: 0 }, img);
  const info = h("span", { className: "image-info" }, `${bytes.length.toLocaleString()} bytes`);
  const level = h("button", { type: "button", className: "image-level", title: "Actual size (100%)" }, "");
  const out = h("button", { type: "button", title: "Zoom out (−)" }, "−");
  const into = h("button", { type: "button", title: "Zoom in (+)" }, "+");
  const fitButton = h("button", { type: "button", title: "Fit to the editor (0)" }, "Fit");
  const MIN = 0.05, MAX = 64;
  let scale = 1, fitted = true;
  const fitScale = () => {
    if (!img.naturalWidth) return 1;
    const w = stage.clientWidth - 32, h2 = stage.clientHeight - 32;
    return Math.min(1, w / img.naturalWidth, h2 / img.naturalHeight);
  };
  /** Sets the zoom; keeps the point under (x, y) in the stage, or its centre, where it was. */
  const zoom = (next: number, x = stage.clientWidth / 2, y = stage.clientHeight / 2) => {
    next = Math.min(MAX, Math.max(MIN, next));
    const before = scale;
    const px = (stage.scrollLeft + x) / before, py = (stage.scrollTop + y) / before;
    scale = next;
    img.style.width = `${Math.round(img.naturalWidth * scale)}px`;
    img.style.height = `${Math.round(img.naturalHeight * scale)}px`;
    stage.classList.toggle("sharp", scale > 1);
    level.textContent = `${Math.round(scale * 100)}%`;
    fitButton.classList.toggle("on", fitted);
    stage.scrollLeft = px * scale - x;
    stage.scrollTop = py * scale - y;
  };
  const fit = () => { fitted = true; zoom(fitScale()); };
  // Steps through 25%, 50%, 100%, 200%... with a few in between.
  const STEPS = [0.05, 0.1, 0.25, 0.33, 0.5, 0.67, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64];
  const step = (dir: 1 | -1) => {
    fitted = false;
    zoom(dir > 0 ? STEPS.find(s2 => s2 > scale + 1e-6) ?? MAX : [...STEPS].reverse().find(s2 => s2 < scale - 1e-6) ?? MIN);
  };
  out.onclick = () => step(-1);
  into.onclick = () => step(1);
  fitButton.onclick = fit;
  level.onclick = () => { fitted = false; zoom(1); };
  stage.addEventListener("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    fitted = false;
    zoom(scale * Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "+" || e.key === "=") step(1);
    else if (e.key === "-" || e.key === "_") step(-1);
    else if (e.key === "0") fit();
    else return;
    e.preventDefault();
  });
  // Fitted, it follows the editor's size.
  new ResizeObserver(() => { if (fitted && img.naturalWidth) zoom(fitScale()); }).observe(stage);
  img.onload = () => {
    info.textContent = `${img.naturalWidth} × ${img.naturalHeight} px · ${bytes.length.toLocaleString()} bytes`;
    fit();
  };
  img.onerror = () => {
    stage.replaceChildren(h("p", { className: "notice" }, "This image couldn't be shown: the file may be damaged, or in a form this browser doesn't read."));
  };
  return {
    id: fileId(entry.path),
    label: entry.name,
    hint: entry.path,
    el: h(
      "div",
      { className: "image-view" },
      h("div", { className: "image-bar" }, h("strong", {}, entry.name), info,
        h("span", { className: "image-zoom" }, out, level, into, fitButton)),
      stage,
    ),
  };
}

/** A tab for a file that is binary or not text in any encoding TIde recognises. */
function unsupportedView(entry: Entry, bytes: Uint8Array): View {
  const select = h(
    "select",
    {},
    ...ENCODINGS.map((e) => h("option", { value: encodingKey(e) }, e.label)),
  );
  const open = h(
    "button",
    {
      type: "button",
      className: "primary",
      onclick: () => {
        const encoding = encodingByKey(select.value) ?? ENCODINGS[0];
        closeTab(fileId(entry.path));
        openText(entry, decodeWith(bytes, encoding), encoding);
      },
    },
    "Open as text",
  );
  return {
    id: fileId(entry.path),
    label: entry.name,
    hint: entry.path,
    el: h(
      "div",
      { className: "file-view" },
      h("h1", {}, entry.name),
      h(
        "p",
        { className: "notice" },
        "This file isn't shown because it is binary or uses an unsupported text encoding.",
      ),
      h(
        "p",
        { className: "hint" },
        `${bytes.length.toLocaleString()} bytes. Opening it as text and saving can damage a binary file.`,
      ),
      h("div", { className: "row" }, h("label", {}, "Encoding ", select), open),
      h("h2", {}, "First bytes"),
      h("pre", { className: "hex" }, hexDump(bytes)),
    ),
  };
}

/** A tab with a TI file's metadata: its variables, or the Flash app/OS header, or a bundle's contents. */
async function tiFileView(entry: Entry, bytes: Uint8Array): Promise<View> {
  const view: View = {
    id: fileId(entry.path),
    label: entry.name,
    hint: entry.path,
    el: h("div", { className: "file-view ti-file" }),
  };
  const send = h(
    "button",
    {
      type: "button",
      className: "primary",
      onclick: () => void calc.send([{ name: entry.name, bytes }]),
    },
    "Send to calculator",
  );
  const facts = (pairs: [string, string][]) =>
    h(
      "dl",
      { className: "facts" },
      ...pairs.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]),
    );
  const parts: HTMLElement[] = [
    h("div", { className: "title-row" }, h("h1", {}, entry.name), send),
  ];
  try {
    if (/^b8[34]$/.test(extOf(entry.name))) {
      const inside = await unbundle({ name: entry.name, bytes });
      parts.push(
        facts([
          ["Kind", "Bundle"],
          ["Size", `${bytes.length.toLocaleString()} bytes`],
          ["Files", String(inside.length)],
        ]),
        h("h2", {}, "Contents"),
        h(
          "table",
          {},
          h("tr", {}, h("th", {}, "File"), h("th", {}, "Size")),
          ...inside.map((f) =>
            h(
              "tr",
              {},
              h("td", {}, f.name),
              h("td", {}, `${f.bytes.length.toLocaleString()} bytes`),
            ),
          ),
        ),
      );
    } else {
      const info = parseTiFile(bytes);
      if (info.kind === "flash") {
        parts.push(
          facts([
            ["Kind", info.type],
            ["Name", info.name],
            ["Version", info.version],
            ["For", info.device],
            ["Date", info.date],
            ["Data", `${info.size.toLocaleString()} bytes`],
            ["Signature", info.signature],
          ]),
        );
      } else {
        parts.push(
          facts([
            ["Comment", info.comment || "(none)"],
            ["Variables", String(info.vars.length)],
            ["Size", `${bytes.length.toLocaleString()} bytes`],
            [
              "Checksum",
              info.checksumOk
                ? "Valid"
                : "Doesn't match: the file may be damaged",
            ],
            ["Signature", info.signature],
          ]),
        );
        parts.push(
          h("h2", {}, "Variables"),
          h(
            "table",
            {},
            h(
              "tr",
              {},
              ...["Name", "Type", "Size", "Archived", "Version"].map((t) =>
                h("th", {}, t),
              ),
            ),
            ...info.vars.map((v) =>
              h(
                "tr",
                {},
                h("td", { className: "mono" }, v.name),
                h("td", {}, v.typeName),
                h("td", {}, `${v.size.toLocaleString()} bytes`),
                h(
                  "td",
                  {},
                  v.archived === null ? "—" : v.archived ? "Yes" : "No",
                ),
                h("td", {}, v.version === null ? "—" : String(v.version)),
              ),
            ),
          ),
        );
        for (const v of info.vars) {
          if (v.source !== null) {
            const name = normalizeName(v.name);
            parts.push(
              h(
                "div",
                { className: "title-row" },
                h("h2", {}, `prgm${v.name}`),
                ...(name
                  ? [
                      h(
                        "button",
                        {
                          type: "button",
                          onclick: () => void importProgram(name, v.source!),
                        },
                        "Open as program",
                      ),
                    ]
                  : []),
              ),
              h("pre", { className: "source" }, v.source || "(empty)"),
            );
          } else if (v.native) {
            parts.push(
              h("h2", {}, `prgm${v.name}`),
              h(
                "p",
                { className: "hint" },
                "A native program (C or assembly). Send it to the calculator to run it; TI blocks native programs on OS 5.5 and later.",
              ),
            );
          } else if (v.data.length) {
            parts.push(
              h(
                "details",
                {},
                h("summary", {}, `${v.name} data`),
                h("pre", { className: "hex" }, hexDump(v.data)),
              ),
            );
          }
        }
      }
    }
  } catch (err) {
    parts.push(
      h(
        "p",
        { className: "notice" },
        `TIde couldn't read this file: ${err instanceof Error ? err.message : err}`,
      ),
      h("pre", { className: "hex" }, hexDump(bytes)),
    );
  }
  view.el.replaceChildren(...parts);
  return view;
}

// ── The panel under the editor: Output (build, prerun, postrun and script logs) and Terminal ──
const panel = createPanel({
  available: fs.desktop,
  homeDir: () => fs.homeDir(),
  projectRoot: () => project?.root ?? null,
  say: setMessage,
  layout: () => editor.layout(),
});
toConsole = (text, kind) => panel.console(text, kind);
$("calc-console-toggle").addEventListener("click", () => panel.show("console"));
for (const [text, kind] of consoleBacklog.splice(0)) panel.console(text, kind);
// ── Output: build, script and prerun logs, in the panel under the editor (panel.ts) ──
function output(text: string, kind: "cmd" | "ok" | "err" | "" = "") {
  panel.output(text.replace(/\n$/, ""), kind);
}
const openOutput = () => panel.show("output");

/**
 * Runs a command line in the system shell, so &&, pipes, redirects and variables work as in a
 * terminal, in `dir` (the project folder by default), with `env` added to its environment (a
 * Nspire project's NDLESS_HOME, whose bin folders go on PATH). Its output streams into Output, with
 * a Stop button while it runs.
 */
async function runLine(
  label: string,
  line: string,
  dir?: string,
  env?: Record<string, string>,
): Promise<{ ok: boolean; output: string }> {
  const cwd = dir ?? project?.root;
  if (!cwd) throw new Error("Open a folder to run a command in it.");
  env ??= await toolchainEnv();
  panel.show("output");
  let text = "";
  let stop = () => {};
  const run = panel.outputRun(label, line, () => stop());
  const shell = fs.runShell(cwd, line, (chunk, err) => { text += chunk; run.write(chunk, err); }, env);
  stop = () => void shell.stop();
  const code = await shell.done.catch(err => {
    const message = `${err}`;
    text += message;
    run.write(`${message}\n`, true);
    return 1;
  });
  run.end(code === 0, code);
  return { ok: code === 0, output: text };
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
  await Promise.all(
    [...dirCache.keys()].map(async (dir) => {
      try {
        dirCache.set(dir, await fs.readDir(dir));
      } catch {
        dirCache.delete(dir);
      }
    }),
  );
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
      setMessage(
        `${label} failed at ${step}: ${err instanceof Error ? err.message : err}`,
      );
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

let ndlessMakefile: boolean | null = null; // cached for the open project
/** Whether the project's Makefile builds for the Nspire (Ndless SDK tools) rather than the CE. */
async function makefileIsNdless(): Promise<boolean> {
  if (ndlessMakefile !== null) return ndlessMakefile;
  ndlessMakefile = false;
  if (project) {
    for (const name of ["Makefile", "makefile", "GNUmakefile"]) {
      const text = await fs
        .readFile(joinPath(project.root, name))
        .catch(() => null);
      if (
        text &&
        /\b(?:nspire-gcc|nspire-g\+\+|nspire-ld|nspire-as|genzehn|make-prg|NDLESS_HOME)\b/i.test(
          text,
        )
      ) {
        ndlessMakefile = true;
        break;
      }
    }
  }
  return ndlessMakefile;
}

const isWindows = navigator.userAgent.includes("Windows");
/** A folder from Settings, with a leading ~ for your home folder, as a shell would. */
async function expandHome(path: string): Promise<string> {
  path = path.trim();
  if (!/^~(?:[\\/]|$)/.test(path)) return path;
  const home = await fs.homeDir().catch(() => "");
  return home ? joinPath(home, path.slice(2)) : path;
}
// ── Toolchains: offering to install the one a project builds with, when it isn't there ──

const TOOLCHAIN_SKIP_PREF = "tide-pref-toolchain-skip"; // "<root>\n<kind>" for "Don't ask again"
/** The projects and toolchains asked about this session, so it's once each. */
const toolchainAsked = new Set<string>();
function toolchainSkipped(): string[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(TOOLCHAIN_SKIP_PREF) ?? "[]");
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/**
 * The toolchain the open project builds with, in the desktop app: the CE toolchain for a CE C, C++,
 * eZ80 or py2ez80 project with a Makefile or a build line, the Ndless SDK for a Nspire C or C++ one,
 * and Luna for Nspire scripts. Null when TIde builds it itself (TI-BASIC, assembly, the web version).
 */
async function neededToolchain(): Promise<ToolchainKind | null> {
  if (fs.web || !project) return null;
  const language = config.language;
  const builds = project.hasMakefile || !!config.build;
  if (await nspireProject()) {
    if (language === "lua" || language === "tipython") return "luna";
    return builds && (!language || language === "c" || language === "cpp") ? "ndless" : null;
  }
  const calculator = isTarget(config.calculator) ? config.calculator : getTarget();
  const compiled = !language || ["c", "cpp", "ez80", "py2ez80"].includes(language);
  return calculator === "ce" && builds && compiled ? "ce" : null;
}

/** The setting that says where a toolchain is. */
const TOOLCHAIN_SETTING = { ce: "cedevHome", ndless: "ndlessHome", luna: "luna" } as const;

/**
 * Asks to install the open project's toolchain when it isn't there (or make, which its build runs):
 * once a session for each project, when it opens or before it builds, unless told not to ask again.
 * Resolves when the window closes, or at once when nothing's missing.
 */
async function checkToolchain() {
  const kind = await neededToolchain();
  if (!kind || !project) return;
  const root = project.root, key = `${root}\n${kind}`;
  if (toolchainAsked.has(key) || toolchainSkipped().includes(key)) return;
  const home = await expandHome(settings()[TOOLCHAIN_SETTING[kind]]);
  const status = await fs.toolchain.status(kind, home).catch(() => null);
  if (!status || (status.found && status.make) || project?.root !== root) return;
  toolchainAsked.add(key);
  const answer = await offerToolchain(toolchainOffer(kind, status, project.name));
  if (answer === "never") {
    try {
      localStorage.setItem(TOOLCHAIN_SKIP_PREF, JSON.stringify([...new Set([...toolchainSkipped(), key])].slice(-200)));
    } catch {
      /* storage unavailable */
    }
  } else if (answer === "installed" || answer === "used") {
    refreshSettingsPage();
  }
}

/** What the window says and offers for a toolchain, from what's missing. */
function toolchainOffer(kind: ToolchainKind, status: ToolchainStatus, name: string): ToolchainOffer {
  const openUrl = (url: string) => void import("@tauri-apps/plugin-opener").then((o) => o.openUrl(url));
  const mac = navigator.userAgent.includes("Mac");
  const makeNote = status.make
    ? undefined
    : mac
      ? "make isn't installed, and building runs it. Install Apple's command line tools: run xcode-select --install in a terminal."
      : "make isn't installed, and building runs it. Install it with your system's package manager: sudo apt install make, sudo dnf install make or sudo pacman -S make.";
  const remember = `Don't ask again for ${name}`;
  /** Settings points to the folder (or program) picked, if it's the toolchain. */
  const useFolder = (what: string, check: string) => async () => {
    const folder = await fs.pickFolder();
    if (!folder) return false;
    if (!(await fs.toolchain.status(kind, folder)).found)
      throw new Error(`${folder} isn't ${what}: it has no ${check}. Pick the folder it's installed in.`);
    setSetting(TOOLCHAIN_SETTING[kind], folder);
    setMessage(`Using ${what} in ${folder}`);
    return true;
  };
  if (status.found) {
    // Only make is missing.
    return { title: "Install make?", body: `${name} builds with make, which TIde can't find.`, note: makeNote, remember, openUrl };
  }
  if (kind === "ce") {
    return {
      title: "Install the CE toolchain?",
      body: `${name} is a CE C project, and building it needs the CE C/C++ toolchain (CEdev), which TIde can't find. TIde can download the official release (about 50 MB) from GitHub into its data folder, and use it for every CE project.`,
      // Windows' toolchain has its own make.
      note: isWindows ? undefined : makeNote,
      install: {
        label: "Download and install",
        busy: "Downloading… (about 50 MB)",
        run: async () => {
          const path = await fs.toolchain.installCe();
          setSetting("cedevHome", path);
          setMessage("Installed the CE toolchain");
          return `Installed in ${path}. Settings → Toolchains has it.`;
        },
      },
      use: { label: "Use one I have…", run: useFolder("the CE toolchain", "meta/makefile.mk") },
      guide: { label: "About the toolchain", url: "https://ce-programming.github.io/toolchain/static/getting-started.html" },
      remember,
      openUrl,
    };
  }
  if (kind === "ndless") {
    return {
      title: "Set up the Ndless SDK?",
      body: `${name} is a TI-Nspire C project, and building it needs the Ndless SDK (nspire-gcc), which TIde can't find. It has no ready-made download: build it once with its guide, then show TIde where it is.`,
      note: makeNote,
      use: { label: "Use one I have…", run: useFolder("the Ndless SDK", "nspire-gcc") },
      guide: { label: "How to install it", url: "https://github.com/ndless-nspire/Ndless/wiki/Ndless-SDK:-C-and-assembly-development-introduction" },
      remember,
      openUrl,
    };
  }
  return {
    title: "Set up Luna?",
    body: `${name} is a TI-Nspire script project, and Run packs its scripts into .tns documents with Luna, which TIde can't find.`,
    use: {
      label: "Choose the Luna program…",
      run: async () => {
        const path = await fs.pickFile("The Luna program", isWindows ? ["exe"] : []);
        if (!path) return false;
        if (!(await fs.toolchain.status("luna", path)).found) throw new Error(`${path} isn't there.`);
        setSetting("luna", path);
        setMessage(`Using Luna at ${path}`);
        return true;
      },
    },
    guide: { label: "How to install it", url: "https://github.com/ndless-nspire/Luna" },
    remember,
    openUrl,
  };
}

/** Whether the open project builds for the Nspire: its tide.json, its target, or its Makefile's Ndless tools. */
const nspireProject = async () =>
  config.calculator === "nspire" || (!!project && getTarget() === "nspire") || (await makefileIsNdless());

/**
 * The toolchains from Settings, for every command TIde runs in the desktop app: the Ndless SDK
 * (NDLESS_HOME) for a Nspire project, otherwise the CE toolchain (CEDEV), and the extra PATH folders.
 * The app puts their bin folders first on PATH (shell.rs add_env).
 */
async function toolchainEnv(): Promise<Record<string, string> | undefined> {
  if (fs.web) return undefined;
  const s = settings(), env: Record<string, string> = {};
  if (await nspireProject()) {
    if (s.ndlessHome.trim()) env.NDLESS_HOME = await expandHome(s.ndlessHome);
  } else if (s.cedevHome.trim()) env.CEDEV = await expandHome(s.cedevHome);
  const extra = await Promise.all(pathList(s.toolchainPath).map(expandHome));
  if (extra.length) env.TIDE_PATH = extra.join("\n");
  return Object.keys(env).length ? env : undefined;
}
/** The folders in the "More folders on PATH" setting: separated by ; or new lines. */
const pathList = (value: string) => value.split(/[;\n]/).map((p) => p.trim()).filter(Boolean);

/** Packs a .lua/.py script into a .tns with Luna (Settings → TI-Nspire → Luna command). Resolves true when it succeeded. */
async function packWithLuna(
  srcPath: string,
  outPath: string,
): Promise<boolean> {
  await checkToolchain();
  const luna = settings().luna.trim() || "luna";
  const { ok, output: text } = await runLine(
    "Luna",
    `"${luna}" "${baseName(srcPath)}" "${outPath}"`,
    dirName(srcPath),
  );
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const why =
    lines.find((l) => /\berror\b/i.test(l)) ??
    lines[lines.length - 1] ??
    "exited with an error";
  setMessage(ok ? `Packed ${baseName(outPath)}` : `Luna failed: ${why}`);
  els.msg.title = text.trim(); // the full output, on hover; it is also in the Output tab
  return ok;
}

/** Files in the project matching tide.json's "send" patterns, such as bin/*.8xp. */
async function matchFiles(root: string, patterns: string[]): Promise<Entry[]> {
  const found = new Map<string, Entry>();
  for (const pattern of patterns) {
    const { dir, match } = splitPattern(pattern);
    const entries = await fs
      .readDir(dir ? joinPath(root, dir) : root)
      .catch(() => [] as Entry[]);
    for (const e of entries)
      if (!e.isDir && match.test(e.name)) found.set(e.path, e);
  }
  return [...found.values()];
}

/** Reads the open project's tide.json and applies it. A broken file is reported and ignored. */
async function loadConfig(exists = true) {
  config = {};
  const path = configPath();
  if (path && exists && (await configExists())) {
    try {
      config = readConfig(await fs.readFile(path));
    } catch (err) {
      setMessage(
        `${CONFIG_DIR}/${CONFIG_FILE} isn't used: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
  setProjectSettings(config.editor ?? {});
  // A project's tide.json names its calculator, and that is the target while it's open.
  if (isTarget(config.calculator) && config.calculator !== getTarget())
    setTarget(config.calculator);
  calc.setLink(config.link);
  renderScripts();
  applyEditorMode();
  refreshSettingsPage();
}

/** Whether the open project has .tide/tide.json. */
async function configExists(): Promise<boolean> {
  if (!project) return false;
  const entries = await fs
    .readDir(joinPath(project.root, CONFIG_DIR))
    .catch(() => [] as Entry[]);
  return entries.some((e) => !e.isDir && e.name.toLowerCase() === CONFIG_FILE);
}

/** Opens the project's .tide/tide.json, creating it from a starter first if there isn't one. */
async function openProjectFile() {
  const path = configPath();
  if (!project || !path)
    return setMessage("Open a folder to give it a .tide/tide.json.");
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
    ...names.map((n) =>
      h(
        "option",
        { value: n, title: config.scripts![n] },
        `${n}: ${config.scripts![n]}`,
      ),
    ),
  );
  els.scripts.value = "";
}

/** Copies a program out of a TI file into TIde's programs. */
async function importProgram(name: string, source: string) {
  if (
    names.includes(name) &&
    !confirm(`Replace your program ${name} with the one in this file?`)
  )
    return;
  await store.save(name, source);
  if (!names.includes(name)) names = [...names, name].sort();
  const open = docs.get(progId(name));
  if (open) {
    open.model.setValue(source);
    open.savedVersion = open.model.getAlternativeVersionId();
  }
  await openProgram(name, `Opened ${name} from the file`);
  void checkPrograms();
}

/** The Settings tab. */
function openSettings() {
  openView(
    views.get("settings") ?? {
      id: "settings",
      label: "Settings",
      el: settingsPage(settingRows),
    },
  );
}

/** Asks for a font file, keeps it, and switches TIde's font to it. */
async function pickFontFile() {
  try {
    const name = await chooseFontFile();
    // Cancelled: the list goes back to the font in use.
    if (!name) return refreshSettingsPage();
    setSetting("font", FILE);
    refreshSettingsPage();
    setMessage(`Font: ${name}`);
  } catch (e) {
    refreshSettingsPage();
    setMessage(e instanceof Error ? e.message : String(e));
  }
}

function settingRows(): Row[] {
  const s = settings();
  const toggle = (
    key:
      | "wordWrap"
      | "minimap"
      | "showRuler"
      | "sendClibs"
      | "checkUpdates"
      | "refreshScmOnFocus"
      | "shiftDeletes"
      | "autoSave"
      | "fontLigatures",
  ) => ({
    kind: "toggle" as const,
    get: () => settings()[key],
    set: (v: boolean) => setSetting(key, v),
  });
  const keyOf: Record<string, string> = {
    "Font size": "fontSize",
    Font: "font",
    Ligatures: "fontLigatures",
    "Tab size": "tabSize",
    "Word wrap": "wordWrap",
    Minimap: "minimap",
    "Show whitespace": "renderWhitespace",
    "Screen width ruler": "showRuler",
    "Encoding for other text": "fallbackEncoding",
    "Send clibs.8xg with C projects": "sendClibs",
  };
  const rows: Row[] = [
    {
      section: "Appearance",
      label: "Theme",
      description:
        "TIde's colors: the window, the editor's syntax and the terminal. Same as the system is TIde Dark or TIde Light, as your system is. Extensions can add themes.",
      control: {
        kind: "select",
        options: [
          ...listThemes().map(
            (t) => [t.id, t.source ? `${t.name} (${t.source})` : t.name] as [string, string],
          ),
          ["system", "Same as the system"],
        ],
        get: () => s.theme,
        set: (v) => setSetting("theme", v),
      },
    },
    {
      section: "Appearance",
      label: "Font",
      description:
        "TIde's font, for the window, the editor and the terminal. Default is Inter for the window and JetBrains Mono for code; System is your computer's own pair; any other is used everywhere. All but System come with TIde. Font file… asks for a .ttf, .otf, .woff or .woff2 file.",
      control: {
        kind: "select",
        options: [...FONTS.map((f) => [f.id, f.name] as [string, string]), [FILE, "Font file…"]],
        get: () => s.font,
        set: (v) => (v === FILE ? void pickFontFile() : setSetting("font", v)),
      },
    },
    ...(s.font === FILE
      ? [
          {
            section: "Appearance",
            label: "Font file",
            description: fontFileName()
              ? `Using ${fontFileName()}. TIde keeps its own copy, so the file can move.`
              : "The font file TIde keeps a copy of.",
            control: { kind: "button" as const, label: "Choose another…", run: () => void pickFontFile() },
          },
        ]
      : []),
    {
      section: "Appearance",
      label: "Ligatures",
      description: "Join characters such as -> and != into one symbol, in fonts that have them (Fira Code, JetBrains Mono).",
      control: toggle("fontLigatures"),
    },
    {
      section: "Editor",
      label: "Font size",
      description: "Size of text in the editor, in pixels.",
      control: {
        kind: "number",
        min: 9,
        max: 28,
        get: () => s.fontSize,
        set: (v) => setSetting("fontSize", v),
      },
    },
    {
      section: "Editor",
      label: "Tab size",
      description:
        "Spaces per indent in C, Python and other files. Assembly always uses tabs.",
      control: {
        kind: "select",
        options: [
          ["2", "2"],
          ["4", "4"],
          ["8", "8"],
        ],
        get: () => String(s.tabSize),
        set: (v) => setSetting("tabSize", Number(v)),
      },
    },
    {
      section: "Editor",
      label: "Word wrap",
      description: "Wrap long lines at the edge of the editor.",
      control: toggle("wordWrap"),
    },
    {
      section: "Editor",
      label: "Minimap",
      description: "Show an overview of the file beside the editor.",
      control: toggle("minimap"),
    },
    {
      section: "Editor",
      label: "Show whitespace",
      description: "Draw spaces and tabs.",
      control: {
        kind: "select",
        options: [
          ["none", "Never"],
          ["boundary", "Between words"],
          ["all", "Always"],
        ],
        get: () => s.renderWhitespace,
        set: (v) =>
          setSetting("renderWhitespace", v as typeof s.renderWhitespace),
      },
    },
    {
      section: "TI-BASIC",
      label: "Calculator",
      description:
        "Which calculator programs are for: sets the screen size checks and which commands exist.",
      control: {
        kind: "select",
        options: [
          ["ce", "TI-84 Plus CE"],
          ["plus", "TI-84 Plus"],
          ["nspire", "TI-Nspire CX"],
        ],
        get: () => getTarget(),
        set: (v) => void chooseTarget(v as Target),
      },
    },
    {
      section: "TI-BASIC",
      label: "Gutter",
      description:
        'Show the calculator\'s ":" before each line, or line numbers.',
      control: {
        kind: "select",
        options: [
          ["colon", '":" like the calculator'],
          ["numbers", "Line numbers"],
        ],
        get: () => (showNumbers ? "numbers" : "colon"),
        set: (v) => setGutter(v === "numbers"),
      },
    },
    {
      section: "TI-BASIC",
      label: "Screen width ruler",
      description:
        "Mark the column where a line wraps on the calculator's screen.",
      control: toggle("showRuler"),
    },
    {
      section: "Files",
      label: "Encoding for other text",
      description:
        "How to read a text file that isn't UTF-8 or UTF-16. The status bar can reopen or save a file in any encoding.",
      control: {
        kind: "select",
        options: ENCODINGS.filter((e) => !e.bom && e.id !== "utf-8").map(
          (e) => [encodingKey(e), e.label],
        ),
        get: () => s.fallbackEncoding,
        set: (v) => setSetting("fallbackEncoding", v),
      },
    },
    {
      section: "Calculator",
      label: "Send clibs.8xg with C projects",
      description:
        "Send the CE C libraries before running a C project, when TIde finds them.",
      control: toggle("sendClibs"),
    },
    {
      section: "Toolchains",
      label: "CE toolchain folder",
      description:
        "CEDEV, the CE C/C++ toolchain's folder, for building CE C, C++, eZ80 and py2ez80 projects: make runs with it set and its bin folder (ez80-clang, convbin, and make on Windows) first on PATH, and Run finds clibs.8xg there. Empty if the toolchain is already on PATH.",
      control: {
        kind: "text",
        get: () => s.cedevHome,
        set: (v) => setSetting("cedevHome", v),
        placeholder: isWindows ? "C:\\CEdev" : "~/CEdev",
      },
    },
    {
      section: "Toolchains",
      label: "Ndless SDK folder",
      description:
        "NDLESS_HOME for building Ndless C/C++ projects: make runs with it set, and its bin folders (nspire-gcc, nspire-ld, genzehn, make-prg) go on PATH. Empty if the toolchain is already on PATH.",
      control: {
        kind: "text",
        get: () => s.ndlessHome,
        set: (v) => setSetting("ndlessHome", v),
        placeholder: "path to the Ndless SDK",
      },
    },
    {
      section: "Toolchains",
      label: "Luna command",
      description:
        "How to run Luna, which packs .lua and .py scripts into .tns documents. A path if it isn't on PATH.",
      control: {
        kind: "text",
        get: () => s.luna,
        set: (v) => setSetting("luna", v),
        placeholder: "luna",
      },
    },
    {
      section: "Toolchains",
      label: "More folders on PATH",
      description:
        "Folders put first on PATH for this project's build, scripts, prerun and postrun steps, such as where spasm-ng, Python or SDCC is. Separate them with ;.",
      control: {
        kind: "text",
        get: () => s.toolchainPath,
        set: (v) => setSetting("toolchainPath", pathList(v).join("; ")),
        placeholder: isWindows ? "C:\\tools\\bin; D:\\sdcc\\bin" : "~/.local/bin; /opt/sdcc/bin",
      },
    },
    {
      section: "Files",
      label: "Auto save",
      description:
        "Save changed files and programs a second after you stop typing, and when TIde loses focus. Files dropped in from outside still ask where to go on their first save.",
      control: toggle("autoSave"),
    },
    {
      section: "Files",
      label: "Shift for permanent delete",
      description:
        "In the Explorer's right-click menu, show one Delete that holding Shift turns into Delete permanently. Off shows both.",
      control: toggle("shiftDeletes"),
    },
    {
      section: "Source control",
      label: "Refresh when TIde gets focus",
      description: "Check git status again when you switch back to TIde.",
      control: toggle("refreshScmOnFocus"),
    },
    {
      section: "Updates",
      label: "Check for updates on start",
      description: "Look for a newer TIde when it starts. Desktop app only.",
      control: toggle("checkUpdates"),
    },
    {
      section: "Updates",
      label: "Update channel",
      description:
        "Stable updates to each tagged release. Nightly updates to every build of TIde's main branch, with the newest changes before they're released, and less tested. Going back to Stable keeps the nightly until the next release is newer. Desktop app only.",
      control: {
        kind: "select",
        options: [
          ["stable", "Stable"],
          ["nightly", "Nightly"],
        ],
        get: () => s.updateChannel,
        set: (v) => {
          setSetting("updateChannel", v as Settings["updateChannel"]);
          void checkForUpdate(setMessage);
        },
      },
    },
    {
      section: "Updates",
      label: "Check now",
      description: "Look for a newer version of TIde.",
      control: {
        kind: "button",
        label: "Check for updates",
        run: () => void checkForUpdate(setMessage),
      },
    },
    {
      section: "Project",
      label: "Set up a folder when it opens",
      description:
        "When an opened folder's tide.json doesn't say which calculator it's for or its language, ask, with what its files show already chosen. The answer goes in tide.json. Only when its files point more than one way, or never: then the files decide.",
      control: {
        kind: "select",
        options: [
          ["always", "Ask"],
          ["conflicts", "Only when its files disagree"],
          ["never", "Never"],
        ],
        get: () => s.projectSetup,
        set: (v) => setSetting("projectSetup", v as Settings["projectSetup"]),
      },
    },
    {
      section: "Project",
      label: "Calculator and language",
      description: project
        ? `Choose which calculator ${project.name} is for and what it's written in, kept in its tide.json.`
        : "Open a folder to set it up.",
      control: {
        kind: "button",
        label: project ? "Set up this folder…" : "No folder open",
        run: () => void setUpProject(),
      },
    },
    {
      section: "Project",
      label: CONFIG_FILE,
      description: project
        ? `How ${project.name} builds and runs, its calculator, editor settings and scripts. Its editor settings are used instead of these while it's open.`
        : "Open a folder to give it a .tide/tide.json, which sets how it builds and runs.",
      control: {
        kind: "button",
        label: project ? "Open .tide/tide.json" : "No folder open",
        run: () => void openProjectFile(),
      },
    },
    {
      section: "Reset",
      label: "Restore defaults",
      description: "Put every setting above back to how TIde starts.",
      control: {
        kind: "button",
        label: "Restore defaults",
        run: () => {
          if (confirm("Restore every setting to its default?")) {
            resetSettings();
            openSettings();
          }
        },
      },
    },
  ];
  const fromProject = projectSettings();
  for (const row of rows) {
    const key = keyOf[row.label] as keyof typeof fromProject | undefined;
    if (key && key in fromProject)
      row.description += ` This project's tide.json sets it to ${JSON.stringify(fromProject[key])}.`;
  }
  // The web version leaves out what only the desktop app does: updates (see updater above), source
  // control, the TI-Nspire's command-line tools, and the Recycle Bin (a browser deletes for good).
  const desktopOnly = new Set(["Updates", "Source control", "Toolchains"]);
  const available = fs.web
    ? rows.filter((r) => !desktopOnly.has(r.section) && r.label !== "Shift for permanent delete")
    : rows;
  // Settings for a kind of project show only while one is open, and only those that fit it, until
  // you ask for all of them. With no folder open, none of them show.
  const fits = projectFits();
  if (!fits) return available.filter((r) => !PROJECT_ONLY(r));
  const shown = showAllSettings ? available : available.filter(fits.applies);
  const hidden = available.length - shown.length;
  if (!hidden && !showAllSettings) return shown;
  shown.splice(shown.findIndex((r) => r.section === "Project"), 0, {
    section: "Project",
    label: showAllSettings ? "Showing every setting" : `Showing settings for ${fits.kind}`,
    description: showAllSettings
      ? `Including those that don't apply to ${project!.name}.`
      : `${hidden} setting${hidden === 1 ? " doesn't" : "s don't"} apply to ${project!.name} and ${hidden === 1 ? "is" : "are"} hidden.`,
    control: {
      kind: "button",
      label: showAllSettings ? "Only this project's" : "Show all",
      run: () => {
        showAllSettings = !showAllSettings;
        refreshSettingsPage();
      },
    },
  });
  return shown;
}

let showAllSettings = false;
const LANGUAGE_NAMES: Record<ProjectLanguage, string> = {
  tibasic: "TI-BASIC", c: "C", cpp: "C++", ez80: "eZ80 assembly", z80: "z80 assembly",
  tipython: "TI-Python", py2ez80: "py2ez80", lua: "Lua",
};
/** Settings that are about a project, so they show only while a folder is open. */
const PROJECT_ONLY = (r: Row) =>
  r.section === "Toolchains" ||
  r.label === "Send clibs.8xg with C projects" ||
  r.label === "Calculator and language" ||
  r.label === CONFIG_FILE;
/** Which settings apply to the open project, from its tide.json calculator and language. Null with no folder open. */
function projectFits(): { kind: string; applies: (r: Row) => boolean } | null {
  if (!project) return null;
  const calculator: Target = isTarget(config.calculator) ? config.calculator : getTarget();
  const language = config.language; // unknown: don't leave anything out for it
  const is = (...languages: ProjectLanguage[]) => !language || languages.includes(language);
  const nspire = calculator === "nspire" || language === "lua";
  const ce = calculator === "ce" && !nspire;
  const fit: Record<string, () => boolean> = {
    "CE toolchain folder": () => ce && is("c", "cpp", "ez80", "py2ez80"),
    "Send clibs.8xg with C projects": () => ce && is("c", "cpp", "py2ez80"),
    "Ndless SDK folder": () => nspire && is("c", "cpp"),
    "Luna command": () => nspire && is("lua", "tipython"),
  };
  return {
    kind: `${language ? `${LANGUAGE_NAMES[language]} on the ` : "the "}${TARGETS[calculator].name}`,
    applies: (r) => {
      if (r.section === "TI-BASIC") return is("tibasic");
      return fit[r.label]?.() ?? true;
    },
  };
}
/** Rebuilds the Settings page if it's open, after the project or what it shows changes. */
function refreshSettingsPage() {
  const page = views.get("settings")?.el;
  page?.dispatchEvent(new Event("settings-refresh"));
}

function setGutter(numbers: boolean) {
  showNumbers = numbers;
  try {
    localStorage.setItem(GUTTER_PREF, showNumbers ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
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

// ── Auto save: changed files and programs save a second after the last change, and when TIde
// loses focus. Files dropped in from outside are left to a real save, which asks where they go.
const AUTO_SAVE_MS = 1000;
const autoSaveTimers = new Map<Doc, number>();
const autoSavable = (doc: Doc) =>
  settings().autoSave &&
  docs.get(doc.id) === doc &&
  isDirty(doc) &&
  !doc.hint?.startsWith(DROPPED);
function autoSaveSoon(doc: Doc) {
  window.clearTimeout(autoSaveTimers.get(doc));
  autoSaveTimers.delete(doc);
  if (!autoSavable(doc)) return;
  autoSaveTimers.set(
    doc,
    window.setTimeout(() => {
      autoSaveTimers.delete(doc);
      if (autoSavable(doc)) void saveDoc(doc);
    }, AUTO_SAVE_MS),
  );
}
function autoSaveAll() {
  for (const doc of docs.values()) {
    window.clearTimeout(autoSaveTimers.get(doc));
    autoSaveTimers.delete(doc);
    if (autoSavable(doc)) void saveDoc(doc);
  }
}
window.addEventListener("blur", autoSaveAll);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) autoSaveAll();
});

async function saveDoc(doc: Doc): Promise<boolean> {
  let saved = true;
  // Changed on disk since it was opened, while it had unsaved changes here: ask before overwriting.
  if (
    doc.diskChanged &&
    doc.diskChanged !== "deleted" &&
    !confirm(
      `${doc.label} changed on disk since TIde read it.\n\nSave your version over it? Cancel keeps both: File → Reload from disk shows the disk's.`,
    )
  ) {
    return false;
  }
  try {
    const text = doc.model.getValue();
    // Before the write, so the watcher's report of it isn't taken for a change from elsewhere.
    const before = doc.disk;
    if (doc.encoding) doc.disk = text;
    try {
      await doc.write(text);
    } catch (err) {
      doc.disk = before;
      throw err;
    }
    doc.diskChanged = undefined;
    doc.savedVersion = doc.model.getAlternativeVersionId();
    if (doc.language === "tibasic")
      buildErrors.set(doc.label, tokenize(doc.model.getValue()).errors.length);
    setMessage(`Saved ${doc.label}`);
    const savedPath = doc.id.startsWith("file:") ? doc.id.slice(5) : null;
    emit("save", { name: doc.label, path: savedPath, language: doc.language });
    // Saving an extension's files reloads the extensions, so changes show at once.
    const extDir = extensionsFolder();
    if (
      savedPath &&
      extDir &&
      savedPath.toLowerCase().startsWith(extDir.toLowerCase())
    ) {
      void reloadExtensions().then(() =>
        setMessage(`Saved ${doc.label} and reloaded extensions`),
      );
    }
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
/**
 * The web version's make: the CE toolchain compiled to WebAssembly, building the project the way its
 * makefile would, with the log streaming to Output. Writes bin/ (the .8xp and the linked .obj) back
 * to the project.
 */
async function buildInBrowser(
  line: string,
): Promise<{ ok: boolean; output: string }> {
  panel.show("output");
  let text = "";
  const run = panel.outputRun("Build", `${line} (in the browser)`, () => {});
  const log = (chunk: string, err: boolean) => {
    text += chunk;
    run.write(chunk, err);
  };
  try {
    // Commands joined with && run one after another, as in a shell (webmake.ts).
    const result = await runWebMake(line, {
      files: (dir) => projectFiles(dir),
      write: (rel, bytes) =>
        fs.writeBinary(joinPath(project!.root, rel), bytes),
      remove: (rel) =>
        fs.deletePath(joinPath(project!.root, rel), false).catch(() => {
          /* not there */
        }),
      log,
    });
    run.end(result.ok, result.ok ? 0 : 1);
    if (result.ok && result.names.length)
      text += `\n${result.names.join("\n")}\n`;
    // Last, so the status bar shows it: what the browser left out.
    if (result.ok && result.skipped.length) {
      const note = `Left out ${result.skipped.length} step${result.skipped.length === 1 ? "" : "s"} that need${result.skipped.length === 1 ? "s" : ""} a shell or the desktop app (listed in Output).`;
      log(`${note}\n`, false);
    }
    return { ok: result.ok, output: text };
  } catch (err) {
    log(`${err instanceof Error ? err.message : err}\n`, true);
    run.end(false, 1);
    return { ok: false, output: text };
  }
}

async function buildProject(): Promise<boolean> {
  if (!project || building) return false;
  const { name } = project;
  for (const doc of docs.values()) {
    if (doc.id.startsWith("file:") && isDirty(doc) && !(await saveDoc(doc)))
      return false;
  }
  await checkToolchain();
  building = true;
  els.exportBtn.disabled = true;
  setMessage(`Building ${name}…`);
  try {
    const line = config.build ?? "make";
    const { ok, output } = fs.web
      ? await buildInBrowser(line)
      : await runLine("Build", line);
    const lines = output
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const last = lines[lines.length - 1] ?? "";
    const why = ok ? last : (lines.find((l) => /\berror\b/i.test(l)) ?? last);
    setMessage(
      ok
        ? `Built ${name}${why ? `: ${why}` : ""}`
        : `Build failed: ${why || `${splitCommand(line).command} exited with an error`} (full log in Output)`,
    );
    els.msg.title = output.trim(); // the full build output, on hover; it is also in the Output tab
    // The build usually creates folders like bin/ and obj/.
    await Promise.all(
      [...dirCache.keys()].map(async (dir) => {
        try {
          dirCache.set(dir, await fs.readDir(dir));
        } catch {
          dirCache.delete(dir);
        }
      }),
    );
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
  if (
    !confirm(
      "Running needs CEmu, the TI-84 Plus CE emulator. Download it from its GitHub releases (about 20 MB)?\n\nThe first time it starts, CEmu asks for your calculator's ROM.",
    )
  )
    return false;
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
interface Built {
  name: string;
  bytes: Uint8Array;
  path?: string;
}
interface ForRun {
  programs: Built[];
  launch: string;
  libs: Built[];
}

/** Builds the active TI-BASIC program, or the C project with make, into .8xp files to run. */
async function buildForRun(): Promise<ForRun | null> {
  if (!fs.available) {
    setMessage("Running programs needs the desktop app.");
    return null;
  }
  // A project is for the Nspire when its target is (tide.json's "calculator", or what its files show),
  // or when its Makefile uses the Ndless SDK's tools.
  const nspire = getTarget() === "nspire" || config.calculator === "nspire" || (await makefileIsNdless());
  if (isBasic()) {
    // TI-BASIC runs as an .8xp: on the CE when the target is CE, or on a TI-83 Plus or 84 Plus.
    const family = await calc.family();
    if (family === "ce" && getTarget() === "plus") {
      setMessage(
        "The calculator is a TI-84 Plus CE. Switch Target to CE, or pick a TI-84 Plus in the calculator's model menu.",
      );
      return null;
    }
    if (family !== "ce" && family !== "plus") {
      setMessage(
        "Run sends .8xp programs, for the TI-83 Plus, 84 Plus and CE. Pick one in the calculator's model menu.",
      );
      return null;
    }
  }
  if (assemblesActive()) {
    const built = await assembleActive();
    if (!built) return null;
    if (!(await prerun())) return null;
    return {
      programs: [
        { name: `${built.name}.8xp`, path: built.path, bytes: built.bytes },
      ],
      launch: built.name,
      libs: [],
    };
  }
  if (usesMake()) {
    const root = project!.root;
    if (nspire && (await calc.family()) !== "nspire") {
      setMessage(
        "This project builds .tns files for the TI-Nspire CX. Pick the TI-Nspire CX in the calculator's model menu.",
      );
      return null;
    }
    if (!(await buildProject())) return null;
    if (!(await prerun())) return null; // before matching, so files it makes are sent
    const patterns =
      config.send ??
      (nspire ? ["*.tns", "bin/*.tns"] : ["bin/*.8xp", "bin/*.8xv"]);
    const built = await matchFiles(root, patterns);
    if (!built.length) {
      setMessage(`Nothing to send: no files match ${patterns.join(", ")}.`);
      return null;
    }
    const programs = await Promise.all(
      built.map(async (e) => ({
        name: e.name,
        path: e.path,
        bytes: await fs.readBinary(e.path),
      })),
    );
    // The Nspire starts a .tns from its own UI, so there is nothing to launch by name.
    const launch = nspire
      ? (config.program ?? "")
      : (config.program ??
        built
          .find((e) => /\.8xp$/i.test(e.name))
          ?.name.replace(/\.8xp$/i, "")
          .toUpperCase() ??
        "");
    // C programs that use graphx, keypadc or fileioc need the CE C libraries on the calculator.
    let libPaths: string[] = [];
    if (!nspire) {
      if (Array.isArray(config.libraries))
        libPaths = config.libraries.map((p) => joinPath(root, p));
      else if (config.libraries ?? settings().sendClibs) {
        const clibs = await fs.findClibs(root, await expandHome(settings().cedevHome)).catch(() => null);
        if (clibs) libPaths = [clibs];
      }
    }
    const libs = await Promise.all(
      libPaths.map(async (p) => ({
        name: baseName(p),
        path: p,
        bytes: await fs.readBinary(p),
      })),
    );
    return { programs, launch, libs };
  }
  const doc = activeDoc();
  if (doc && nspireScript(doc)) {
    // A .lua (or, in a "nspire" project, a .py) script runs as a Luna-packed .tns on the Nspire.
    const family = await calc.family();
    if (family !== "nspire") {
      setMessage(
        "Run sends .tns files to a TI-Nspire CX. Pick one in the calculator's model menu.",
      );
      return null;
    }
    if (isDirty(doc)) await saveDoc(doc);
    const path = doc.id.startsWith("file:") ? doc.id.slice(5) : null;
    if (!path) {
      setMessage(
        "Open the script from a folder — Luna packs the file on disk.",
      );
      return null;
    }
    if (!(await prerun())) return null;
    const outPath = joinPath(
      dirName(path),
      `${baseName(path).replace(/\.(lua|py)$/i, "")}.tns`,
    );
    if (!(await packWithLuna(path, outPath))) {
      openOutput();
      return null;
    }
    return {
      programs: [
        {
          name: baseName(outPath),
          path: outPath,
          bytes: await fs.readBinary(outPath),
        },
      ],
      launch: "",
      libs: [],
    };
  }
  if (!doc || doc.language !== "tibasic") {
    setMessage(
      "Open a TI-BASIC program, a Nspire script (.lua or .py), or a C/C++ project to run it.",
    );
    return null;
  }
  if (isDirty(doc)) await saveDoc(doc);
  const { bytes, errors } = tokenize(doc.model.getValue());
  if (errors.length)
    setMessage(
      `${errors.length} character${errors.length === 1 ? "" : "s"} had no token and were skipped.`,
    );
  if (!(await prerun())) return null;
  return {
    programs: [{ name: `${doc.label}.8xp`, bytes: make8xp(doc.label, bytes) }],
    launch: doc.label,
    libs: [],
  };
}

/** F5: builds and runs in the calculator panel, inside TIde. */
async function runInEmulator() {
  if (usesMake() && config.runIn === "cemu") return runInCemu();
  try {
    const built = await buildForRun();
    if (!built) return;
    await calc.run(built.programs, built.launch, built.libs);
    emit("run", {
      programs: built.programs.map((p) => p.name),
      launch: built.launch,
    });
    const post = project ? steps(config.postrun) : [];
    if (post.length && (await runSteps("Postrun", post)))
      setMessage("Postrun finished");
  } catch (err) {
    setMessage(`Could not run: ${err}`);
  }
}

/** Builds and runs in the CEmu app instead, reusing the emulator window TIde opened before. */
async function runInCemu() {
  try {
    const built = await buildForRun();
    if (!built) return;
    const files = await Promise.all(
      [...built.libs, ...built.programs].map(
        (p) =>
          p.path ??
          fs.emulator.stage(p.name.replace(/\.8xp$/i, ""), Array.from(p.bytes)),
      ),
    );
    if (!(await ensureEmulator())) return;
    await fs.emulator.run(files, built.launch);
    setMessage(
      built.launch ? `Running ${built.launch} in CEmu` : "Sent to CEmu",
    );
  } catch (err) {
    setMessage(`Could not run in CEmu: ${err}`);
  }
}

/** Where each program was last built, so a rebuild can skip the save dialog. */
function buildPaths(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(BUILD_PREF) ?? "{}");
  } catch {
    return {};
  }
}
function rememberBuild(name: string, path: string | null) {
  const paths = buildPaths();
  if (path) paths[name] = path;
  else delete paths[name];
  try {
    localStorage.setItem(BUILD_PREF, JSON.stringify(paths));
  } catch {
    /* storage unavailable */
  }
}

/** Tokenizes the active TI-BASIC program and writes a real .8xp the calculator accepts. Asks where only the first time, or when `pick` is set. */
async function exportActive(pick = false) {
  if (assemblesActive()) {
    await assembleActive();
    return;
  }
  if (usesMake()) return buildProject();
  const doc = activeDoc();
  if (!doc) return setMessage("Nothing to build.");
  if (nspireScript(doc)) {
    // A Nspire script builds to a .tns with Luna, asking where only the first time, like .8xp.
    if (isDirty(doc)) await saveActive();
    const path = doc.id.startsWith("file:") ? doc.id.slice(5) : null;
    if (!path)
      return setMessage(
        "Open the script from a folder — Luna packs the file on disk.",
      );
    let out: string | undefined = pick ? undefined : buildPaths()[doc.label];
    if (!out)
      out =
        (await fs.pickSaveFile(`${doc.label}.tns`, {
          name: "TI-Nspire document",
          extensions: ["tns"],
        })) ?? undefined;
    if (!out) return; // cancelled the save dialog
    if (!/\.tns$/i.test(out)) out += ".tns";
    rememberBuild(doc.label, out);
    if (await packWithLuna(path, out)) {
      await Promise.all(
        [...dirCache.keys()].map(async (dir) => {
          try {
            dirCache.set(dir, await fs.readDir(dir));
          } catch {
            dirCache.delete(dir);
          }
        }),
      );
      renderTree();
    } else openOutput();
    return;
  }
  if (doc.language !== "tibasic")
    return setMessage(
      "Only TI-BASIC programs build to .8xp, and Nspire scripts to .tns.",
    );
  if (isDirty(doc)) await saveActive();
  const { bytes, errors } = tokenize(doc.model.getValue());
  let path: string | null;
  try {
    path = await exportProgram(
      doc.label,
      bytes,
      pick ? undefined : buildPaths()[doc.label],
    );
  } catch (err) {
    return setMessage(`Could not build ${doc.label}: ${err}`);
  }
  if (!path) return; // cancelled the save dialog
  if (fs.available) rememberBuild(doc.label, path);
  setMessage(
    errors.length
      ? `Built ${path} — ${errors.length} character${errors.length === 1 ? "" : "s"} had no token and were skipped.`
      : `Built ${path}`,
  );
}

/** Tokenize every stored program so the list can show which ones build cleanly. */
async function checkPrograms() {
  const sources = await Promise.all(names.map((n) => store.load(n)));
  names.forEach((n, i) =>
    buildErrors.set(n, tokenize(sources[i]).errors.length),
  );
  renderList();
}

function closeTab(id: string) {
  const doc = docs.get(id);
  if (
    doc &&
    isDirty(doc) &&
    !confirm(`${doc.label} has unsaved changes. Close without saving?`)
  )
    return;
  const index = tabOrder.indexOf(id);
  tabOrder = tabOrder.filter((n) => n !== id);
  doc?.model.dispose();
  docs.delete(id);
  views.delete(id);
  if (active === id) {
    active = tabOrder[Math.min(index, tabOrder.length - 1)] ?? null;
    if (active) activate(active);
    else showActive();
  }
  if (id === CALC_TAB && calc.visible) calc.hide();
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
  names = names.filter((n) => n !== name);
  buildErrors.delete(name);
  rememberBuild(name, null);
  const doc = docs.get(progId(name));
  if (doc) {
    doc.savedVersion = doc.model.getAlternativeVersionId();
    closeTab(doc.id);
  }
  setMessage(`Deleted ${name}`);
  refresh();
}

// ── Setting up a project: which calculator it's for, and its language ──
// tide.json's "calculator" and "language" decide them. Without them, the folder's files show them:
// a Makefile using the CE toolchain or the Ndless SDK, Lua scripts and .tns files, z80 or eZ80
// assembly, C, C++, Python, .8xp programs. Opening a folder asks for whatever tide.json leaves
// out, with what the files show already chosen, and keeps the answer in tide.json (Settings →
// Project → "Set up a folder when it opens": always, only when the files point several ways, or
// never). Whatever isn't asked, the files decide: one calculator found becomes the target.

const LANGUAGES: Record<ProjectLanguage, string> = {
  tibasic: "TI-BASIC", c: "C", cpp: "C++", ez80: "eZ80 assembly", z80: "z80 assembly",
  tipython: "TI-Python", py2ez80: "py2ez80", lua: "Lua",
};
/** What a language choice is, under its name. */
const LANGUAGE_NOTES: Partial<Record<ProjectLanguage, string>> = {
  tipython: "The calculator's Python app",
  py2ez80: "Python compiled to a CE program",
  ez80: "fasmg, or spasm-ng",
  z80: "spasm-ng",
  c: "", cpp: "",
};
/** The languages each calculator's programs are written in, as TIde builds and runs them. */
const LANGUAGES_FOR: Record<Target, ProjectLanguage[]> = {
  ce: ["tibasic", "c", "cpp", "ez80", "tipython", "py2ez80"],
  plus: ["tibasic", "z80"],
  nspire: ["lua", "c", "cpp", "tipython"],
};
/** The other calculators each target covers: the same programs run on them. */
const TARGET_ALSO: Record<Target, string> = {
  ce: "Also the TI-83 Premium CE and TI-82 AEP; TI-Python covers the TI-84 Evo",
  plus: "Also the TI-83 Plus, TI-83 Plus SE and TI-84 Plus SE",
  nspire: "CX and CX II, with Ndless for C and C++",
};
/**
 * The language a project file opens in: Monaco's for its name, except where the project's language
 * says otherwise. A .py file is TI-Python, or py2ez80 in a py2ez80 project; assembly is eZ80, or
 * z80 in a z80 (TI-83 Plus and 84 Plus) project.
 */
function projectLanguageFor(name: string): string {
  const language = languageFor(name);
  if (language === "tipython" && config.language === "py2ez80") return "python";
  if (language === ASM_LANG && config.language === "z80") return "z80";
  return language;
}
const SETUP_SKIP_PREF = "tide-pref-setup-skipped"; // folders whose setup was put off: not asked again

interface Found { targets: Map<Target, string>; languages: Map<ProjectLanguage, string> }

/** The calculators and languages a folder's files point to, each with why. Reads the folder and its src/. */
async function detectProject(entries: Entry[]): Promise<Found> {
  const targets = new Map<Target, string>(), languages = new Map<ProjectLanguage, string>();
  const src = entries.find((e) => e.isDir && e.name.toLowerCase() === "src");
  const files = [...entries, ...(src ? await fs.readDir(src.path).catch(() => [] as Entry[]) : [])].filter((e) => !e.isDir);
  const ext = (re: RegExp) => files.find((e) => re.test(e.name));
  const makefile = entries.find((e) => !e.isDir && /^(?:gnu)?makefile$/i.test(e.name));
  const make = makefile ? await fs.readFile(makefile.path).catch(() => "") : "";
  if (/\b(?:nspire-gcc|nspire-g\+\+|nspire-ld|nspire-as|genzehn|make-prg|NDLESS_HOME)\b/i.test(make)) targets.set("nspire", "its Makefile uses the Ndless SDK");
  if (/cedev/i.test(make)) targets.set("ce", "its Makefile uses the CE C toolchain");
  const tns = ext(/\.(?:lua|tns)$/i);
  if (tns && !targets.has("nspire")) targets.set("nspire", `it has ${tns.name}`);
  const ez80 = ext(/\.ez80$/i);
  if (ez80 && !targets.has("ce")) targets.set("ce", `it has ${ez80.name}`);
  const plus = ext(/\.(?:z80|8xk)$/i);
  if (plus) targets.set("plus", `it has ${plus.name}`);
  const lang = (l: ProjectLanguage, re: RegExp) => { const f = ext(re); if (f) languages.set(l, `it has ${f.name}`); };
  lang("c", /\.c$/i);
  lang("cpp", /\.(?:cpp|cc|cxx|hpp)$/i);
  lang("ez80", /\.(?:ez80|asm|s|src)$/i);
  lang("z80", /\.z80$/i);
  lang("lua", /\.lua$/i);
  lang("tibasic", /\.8xp$/i);
  // A .py file is TI-Python when it imports TI's modules (ti_system, ti_plotlib, ti_draw…); py2ez80
  // has its own graphics module. Without either, it's taken as TI-Python, the calculator's own.
  const py = ext(/\.py$/i);
  if (py) {
    const text = await fs.readFile(py.path).catch(() => "");
    if (/^\s*(?:from|import)\s+ti_\w+/m.test(text)) languages.set("tipython", `${py.name} imports TI's modules`);
    else if (/^\s*(?:from|import)\s+graphics\b/m.test(text)) languages.set("py2ez80", `${py.name} imports py2ez80's modules`);
    else languages.set("tipython", `it has ${py.name}`);
  }
  // A Plus project's assembly is z80, whatever its files are named.
  if (targets.has("plus") && languages.has("ez80") && !targets.has("ce")) {
    languages.set("z80", languages.get("ez80")!);
    languages.delete("ez80");
  }
  // A project with C++ has C headers too: it's a C++ project. Assembly helpers beside C don't make
  // it an assembly project either.
  if (languages.has("cpp")) languages.delete("c");
  if (languages.has("c") || languages.has("cpp")) { languages.delete("ez80"); languages.delete("tibasic"); }
  return { targets, languages };
}

let setupSkipped: string[] = [];
try { setupSkipped = JSON.parse(localStorage.getItem(SETUP_SKIP_PREF) ?? "[]"); } catch { /* storage unavailable or bad JSON */ }

/** On opening a folder: asks for what tide.json leaves out, as the setting says, or goes by the files. */
async function settleProject(root: string, entries: Entry[]) {
  const found = await detectProject(entries).catch((): Found => ({ targets: new Map(), languages: new Map() }));
  if (project?.root !== root) return; // another folder opened meanwhile
  const needTarget = !isTarget(config.calculator), needLanguage = !config.language;
  if (!needTarget && !needLanguage) return;
  const mode = settings().projectSetup;
  const conflicts = (needTarget && found.targets.size > 1) || (needLanguage && found.languages.size > 1);
  const ask = mode === "always" ? !setupSkipped.includes(root) : mode === "conflicts" ? conflicts : false;
  if (ask) {
    const answer = await askSetup(found);
    if (project?.root !== root) return;
    if (answer) return void (await saveSetup(answer));
    try { localStorage.setItem(SETUP_SKIP_PREF, JSON.stringify([...new Set([...setupSkipped, root])].slice(-200))); } catch { /* storage unavailable */ }
    setupSkipped.push(root);
  }
  // Not asked (or put off): one calculator the files point to is the target for now.
  if (needTarget && found.targets.size === 1) {
    const [only] = found.targets.keys();
    if (only !== getTarget()) setTarget(only);
  }
}

/** What the setup popup settles: the calculator, the language, and the prerun and postrun steps. */
interface SetupAnswer { calculator: Target; language: ProjectLanguage; prerun: string[]; postrun: string[] }

/** The kinds of step prerun and postrun take: a shell line, or one of the calculator macros. */
type StepKind = "shell" | "key.press" | "key.type" | "program.run" | "app.open" | "wait";
const STEP_KINDS: [StepKind, string, string][] = [
  ["shell", "Shell command", "make test"],
  ["key.press", "Press a key", "enter"],
  ["key.type", "Type text", "HELLO"],
  ["program.run", "Run a program", "MYPROG"],
  ["app.open", "Open an app", "CabriJr"],
  ["wait", "Wait (ms)", "500"],
];
/** The keys key.press knows (config.ts MACROS). */
const STEP_KEYS = ["enter", "clear", "2nd", "alpha", "mode", "del", "math", "apps", "prgm", "vars", "stat", "on",
  "y=", "window", "zoom", "trace", "graph", "up", "down", "left", "right"];

interface Step { kind: StepKind; value: string }
/** A tide.json step as the popup edits it: its kind and its argument (a shell step: its whole line). */
function readStep(text: string): Step {
  let macro: ReturnType<typeof parseMacro> = null;
  try { macro = parseMacro(text); } catch { /* an unknown macro: shown as typed, as a shell line */ }
  if (!macro) return { kind: "shell", value: text };
  return { kind: macro.macro === "program.open" ? "program.run" : (macro.macro as StepKind), value: macro.arg };
}
/** A step back as tide.json writes it. */
function writeStep(step: Step): string {
  const v = step.value.trim();
  if (step.kind === "shell") return v;
  if (step.kind === "key.type") return `key.type(${JSON.stringify(v)})`;
  return `${step.kind}(${v})`;
}

/** A list of steps the user builds: a row per step (its kind, its value, move and remove), and a button per kind adding one. */
function stepList(initial: string[], empty: string): { el: HTMLElement; value: () => string[] } {
  const list: Step[] = initial.map(readStep);
  const rows = h("div", { className: "setup-steps" });
  const adds = h("div", { className: "setup-adds" },
    ...STEP_KINDS.map(([kind, label]) => h("button", {
      type: "button", className: "setup-add", title: `Add a step: ${label.toLowerCase()}`,
      onclick: () => {
        list.push({ kind, value: kind === "key.press" ? "enter" : kind === "wait" ? "500" : "" });
        render();
        (rows.lastElementChild?.querySelector("input, select") as HTMLElement | null)?.focus();
      },
    }, `+ ${STEP_SHORT[kind]}`)));
  const render = () => {
    rows.replaceChildren(...list.map((step, i) => {
      const [, label, example] = STEP_KINDS.find(([k]) => k === step.kind)!;
      const field = step.kind === "key.press"
        ? h("select", { ariaLabel: label, onchange: (e: Event) => { step.value = (e.target as HTMLSelectElement).value; } },
            ...[...new Set([...STEP_KEYS, step.value])].filter(Boolean).map((k) => h("option", { value: k, selected: k === step.value }, k)))
        : h("input", {
            type: step.kind === "wait" ? "number" : "text", value: step.value, placeholder: example, spellcheck: false, ariaLabel: label,
            min: step.kind === "wait" ? "0" : undefined,
            oninput: (e: Event) => { step.value = (e.target as HTMLInputElement).value; },
          });
      const move = (by: number) => {
        const j = i + by;
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        render();
      };
      return h("div", { className: "setup-step" },
        h("span", { className: `setup-step-kind kind-${step.kind.replace(".", "-")}` }, STEP_SHORT[step.kind]),
        field,
        h("span", { className: "setup-step-tools" },
          h("button", { type: "button", className: "setup-step-btn", title: "Move up", ariaLabel: "Move up", disabled: i === 0, onclick: () => move(-1) }, "↑"),
          h("button", { type: "button", className: "setup-step-btn", title: "Move down", ariaLabel: "Move down", disabled: i === list.length - 1, onclick: () => move(1) }, "↓"),
          h("button", { type: "button", className: "setup-step-btn remove", title: "Remove", ariaLabel: "Remove", onclick: () => { list.splice(i, 1); render(); } }, "×")));
    }));
    if (!list.length) rows.append(h("p", { className: "setup-empty" }, empty));
  };
  render();
  return {
    el: h("div", { className: "setup-steplist" }, rows, adds),
    value: () => list.filter((s) => s.value.trim()).map(writeStep),
  };
}
/** Each step kind's short name, on its row and its add button. */
const STEP_SHORT: Record<StepKind, string> = {
  shell: "Shell", "key.press": "Key", "key.type": "Type", "program.run": "Program", "app.open": "App", wait: "Wait",
};

/** What ▶ Run does for a calculator and language, before and after the user's steps (as buildForRun does it). */
function runStages(calculator: Target, language: ProjectLanguage): { build: string; send: string; start: string } {
  // A Makefile builds everything but TI-BASIC (usesMake).
  const make = (!!project?.hasMakefile && language !== "tibasic") || language === "c" || language === "cpp";
  const nspire = calculator === "nspire";
  const build = make ? "Build with make"
    : language === "tibasic" ? "Build the program into an .8xp"
      : language === "z80" || language === "ez80" ? "Assemble with spasm-ng into an .8xp"
        : nspire ? "Pack the script into a .tns with Luna"
          : language === "tipython" ? "Nothing to build: TI-Python runs as it is"
            : "Build";
  const send = nspire ? "Send the .tns files to the TI-Nspire"
    : language === "tipython" ? "Send the .py files with TI Connect CE or TI Connect Evo"
      : calculator === "ce" && make ? "Send the .8xp and .8xv files, and the C libraries the first time"
        : "Send the .8xp files to the calculator";
  const start = nspire ? "Open it on the calculator: the Nspire starts a .tns from its own documents"
    : language === "tipython" ? "Run it from the Python app"
      : "Start the program from the home screen";
  return { build, send, start };
}

/**
 * The setup popup, a page at a time with Back and Next, in the order a project is set up and then
 * run: (1) the calculator and (2) the
 * language, showing what the folder's files point to (all of them when they point to none), with
 * Other calculators / Other languages for when the files are wrong; then what ▶ Run does, as a
 * timeline: (3) the user's prerun steps, between building and sending, and (4) postrun, after the
 * program starts, each on its own page. Resolves with what was chosen, or null to put it off.
 */
function askSetup(found: Found): Promise<SetupAnswer | null> {
  return new Promise((resolve) => {
    const order: Target[] = ["ce", "plus", "nspire"];
    let calculator: Target = isTarget(config.calculator) ? config.calculator
      : found.targets.size ? [...found.targets.keys()][0] : getTarget();
    let language: ProjectLanguage | null = config.language ?? null;
    let allTargets = false, allLanguages = false;
    const prerun = stepList(steps(config.prerun), "No steps: Run goes straight on to sending.");
    const postrun = stepList(steps(config.postrun), "No steps: Run is done once the program starts.");
    const dialog = h("dialog", { className: "images-dialog setup-dialog" });
    const done = (ok: boolean) => {
      dialog.close();
      dialog.remove();
      resolve(ok && language ? { calculator, language, prerun: prerun.value(), postrun: postrun.value() } : null);
    };
    const save = h("button", { type: "button", className: "image-btn primary", onclick: () => done(true) }, "Save to tide.json");
    const calcRow = h("div", { className: "setup-choices" });
    const langRow = h("div", { className: "setup-choices" });
    const stage = (text: string) => h("div", { className: "setup-stage" }, h("span", { className: "setup-dot" }), h("span", {}, text));
    // Each Run page shows the stages around its steps: prerun between building and sending, postrun
    // once the program has started. (An element is in one place, so each page has its own.)
    const stages = { build: [stage("")], send: [stage(""), stage("")], start: [stage("")] };
    /** A choice card: pressed when it's the one chosen; "Detected" when the files point to it. */
    const choice = (pressed: boolean, pick: () => void, name: string, note: string, why?: string) =>
      h("button", {
        type: "button", className: `setup-choice${why ? " detected" : ""}`, ariaPressed: String(pressed), title: why ? `Detected: ${why}` : "",
        onclick: () => { pick(); render(); },
      },
        h("span", { className: "setup-choice-top" }, h("strong", {}, name), why ? h("span", { className: "setup-badge" }, "Detected") : ""),
        note ? h("span", { className: "setup-note" }, note) : "",
        why ? h("span", { className: "setup-why" }, why[0].toUpperCase() + why.slice(1)) : "");
    /** The button showing the rest, or only what the files show again. */
    const more = (open: boolean, what: string, toggle: () => void) =>
      h("button", { type: "button", className: "setup-more", onclick: () => { toggle(); render(); } },
        open ? "Only what the files show" : `Other ${what}…`);
    const render = () => {
      // Shown: what the files point to, and the one chosen; everything when the files show nothing.
      const narrowTargets = found.targets.size > 0 && !allTargets;
      const targets = narrowTargets ? order.filter((t) => found.targets.has(t) || t === calculator) : order;
      const langs = LANGUAGES_FOR[calculator];
      const foundLangs = langs.filter((l) => found.languages.has(l));
      if (!language || !langs.includes(language)) language = foundLangs[0] ?? langs[0];
      const narrowLangs = foundLangs.length > 0 && !allLanguages;
      const shownLangs = narrowLangs ? langs.filter((l) => found.languages.has(l) || l === language) : langs;
      calcRow.replaceChildren(
        ...targets.map((t) => choice(t === calculator, () => { calculator = t; }, TARGETS[t].name, TARGET_ALSO[t], found.targets.get(t))),
        ...(found.targets.size && (targets.length < order.length || allTargets) ? [more(allTargets, "calculators", () => { allTargets = !allTargets; })] : []));
      langRow.replaceChildren(
        ...shownLangs.map((l) => choice(l === language, () => { language = l; }, LANGUAGES[l], LANGUAGE_NOTES[l] ?? "", found.languages.get(l))),
        ...(foundLangs.length && (shownLangs.length < langs.length || allLanguages) ? [more(allLanguages, "languages", () => { allLanguages = !allLanguages; })] : []));
      const run = runStages(calculator, language);
      for (const key of ["build", "send", "start"] as const)
        for (const el of stages[key]) el.lastElementChild!.textContent = run[key];
      save.disabled = !language;
    };
    render();
    const several = found.targets.size > 1 || found.languages.size > 1;
    const none = !found.targets.size && !found.languages.size;
    /** A page: its title and what it's for (the progress above numbers it), then its choices. */
    const section = (_n: number, title: string, hint: string, ...body: HTMLElement[]) =>
      h("section", { className: "setup-section" },
        h("div", { className: "setup-head" }, h("div", {}, h("h3", {}, title), h("p", {}, hint))),
        ...body);
    const steplane = (title: string, hint: string, list: HTMLElement) =>
      h("div", { className: "setup-lane" }, h("div", { className: "setup-lane-head" }, h("strong", {}, title), h("span", {}, hint)), list);
    // One page at a time, Back and Next between them, and Save on the last: the calculator first,
    // since the languages shown depend on it, then the language, then Run's prerun and postrun steps.
    const pages: [string, HTMLElement][] = [
      ["Calculator", section(1, "Calculator", "What the project's programs run on.", calcRow)],
      ["Language", section(2, "Language", "What it's written in. Its files open in this language.", langRow)],
      ["Prerun", section(3, "Prerun", "Steps ▶ Run takes after building and before sending: tests, copying files, getting the calculator ready. If one fails, nothing is sent.",
        h("div", { className: "setup-timeline" },
          stages.build[0],
          steplane("Your prerun steps", "after building, before sending", prerun.el),
          stages.send[0]))],
      ["Postrun", section(4, "Postrun", "Steps ▶ Run takes once the program is running: pressing its keys, typing into it, waiting.",
        h("div", { className: "setup-timeline" },
          stages.send[1],
          stages.start[0],
          steplane("Your postrun steps", "once the program is running", postrun.el)))],
    ];
    let page = 0;
    const body = h("div", { className: "images-body setup-body" });
    const progress = h("ol", { className: "setup-progress" });
    const back = h("button", { type: "button", className: "image-btn", onclick: () => go(page - 1) }, "← Back");
    const next = h("button", { type: "button", className: "image-btn primary", onclick: () => go(page + 1) }, "Next →");
    const summary = h("span", { className: "hint setup-summary" });
    const go = (to: number) => {
      page = Math.max(0, Math.min(pages.length - 1, to));
      body.replaceChildren(pages[page][1]);
      body.scrollTop = 0;
      progress.replaceChildren(...pages.map(([name], i) =>
        h("li", { className: i === page ? "now" : i < page ? "done" : "" },
          // A page already passed can be gone back to; ahead, only through Next.
          h("button", { type: "button", disabled: i > page, onclick: () => go(i), ariaCurrent: i === page ? "step" : undefined },
            h("span", { className: "setup-progress-num" }, i < page ? "✓" : String(i + 1)), name))));
      back.hidden = page === 0;
      next.hidden = page === pages.length - 1;
      save.hidden = page !== pages.length - 1;
      // What's chosen so far, on the pages after it.
      summary.textContent = page === 0 ? "Saved in .tide/tide.json."
        : `${TARGETS[calculator].name}${page > 1 && language ? ` · ${LANGUAGES[language]}` : ""}`;
      (body.querySelector('[aria-pressed="true"], input, select') as HTMLElement | null)?.focus({ preventScroll: true });
    };
    dialog.append(
      h("header", { className: "images-head" },
        h("div", {}, h("h2", {}, `Set up ${project?.name ?? "this folder"}`),
          h("p", { className: "hint" }, several
            ? "Its files point more than one way: choose what it is."
            : none
              ? "Nothing in it shows what it is yet: choose its calculator and language."
              : "Here's what its files show. Check it, and add any steps Run should take."),
          progress),
        h("button", { type: "button", className: "images-close", title: "Not now (Esc)", ariaLabel: "Close", onclick: () => done(false) }, "×")),
      body,
      h("footer", { className: "images-foot" },
        summary,
        h("button", { type: "button", className: "image-btn setup-later", onclick: () => done(false) }, "Not now"),
        back, next, save),
    );
    go(0);
    dialog.addEventListener("cancel", (e) => { e.preventDefault(); done(false); });
    document.body.append(dialog);
    dialog.showModal();
  });
}

/** Opens the setup popup for the open folder, from Settings → Project. */
async function setUpProject() {
  if (!project) return setMessage("Open a folder to set it up.");
  const root = project.root;
  const entries = await fs.readDir(root);
  const answer = await askSetup(await detectProject(entries));
  if (answer && project?.root === root) await saveSetup(answer);
}

/**
 * Sets keys in the project's tide.json (creating it if there isn't one) and loads it again. Only
 * a key at the start of a line is replaced, never one in a // comment; a new one goes first.
 */
async function setConfigKeys(values: Record<string, string | string[]>) {
  const path = configPath();
  if (!project || !path) throw new Error("no folder is open");
  let text = (await configExists())
    ? await fs.readFile(path)
    : "{\n}\n";
  for (const [name, raw] of Object.entries(values)) {
    const value = Array.isArray(raw) ? `[${raw.map((v) => JSON.stringify(v)).join(", ")}]` : JSON.stringify(raw);
    // The key's value: a string, or a list of strings (on one line or several).
    const key = new RegExp(`^(\\s*)"${name}"\\s*:\\s*(?:"(?:[^"\\\\]|\\\\.)*"|\\[(?:\\s|"(?:[^"\\\\]|\\\\.)*"|,)*\\])`, "m");
    text = key.test(text)
      ? text.replace(key, (_, indent: string) => `${indent}"${name}": ${value}`)
      : text.replace(/\{(\s*)(\}?)/, (_, space: string, close: string) =>
          close ? `{\n  "${name}": ${value}\n}` : `{${space}"${name}": ${value},${space}`);
  }
  await fs.writeFile(path, text);
  await loadConfig();
}

/**
 * A whole tide.json for a new project, from its calculator and language: how it builds, its prerun
 * and postrun steps, what Run sends, the libraries, where it runs and its scripts,
 * each set as that kind of project needs, with a comment saying what the rest are for.
 */
function starterConfig({ calculator, language, prerun, postrun }: SetupAnswer, hasMakefile: boolean): string {
  const compiled = language === "c" || language === "cpp" || ((language === "ez80" || language === "py2ez80") && hasMakefile);
  const make = compiled || (hasMakefile && calculator === "nspire");
  const tns = calculator === "nspire";
  const send =
    tns ? (make ? ["bin/*.tns", "*.tns"] : ["*.tns"])
      : make ? ["bin/*.8xp", "bin/*.8xv"]
        : language === "tipython" ? [] : ["*.8xp"];
  const lines: string[] = [
    `  "calculator": "${calculator}",`,
    `  "language": "${language}",`,
    ...(make ? [`  "build": "make",`] : []),
    // The program Run starts: "" sends without starting one; leave it out to start the first sent.
    ...(language === "tipython" ? [`  "program": "",`] : []),
    `  "prerun": ${JSON.stringify(prerun).replace(/","/g, '", "')},`,
    `  "postrun": ${JSON.stringify(postrun).replace(/","/g, '", "')},`,
    `  "send": [${send.map((p) => JSON.stringify(p)).join(", ")}],`,
    // The CE C libraries are for C and C++ on the CE.
    `  "libraries": ${calculator === "ce" && compiled},`,
    ...(calculator === "ce" ? [`  "runIn": "calculator",`] : []),
    `  "scripts": {${make ? `\n    "clean": "make clean"\n  ` : ""}}`,
  ];
  return [
    "{",
    "  // How TIde builds and runs this project. Hover a name for help, or press Ctrl+Space for options.",
    '  // "prerun" and "postrun" take shell lines and calculator steps such as "key.press(enter)";',
    '  // "program" is the program Run starts, "link": { "via": "usb" } the real calculator\'s cable,',
    '  // and "editor" settings used instead of yours while the project is open.',
    ...lines,
    "}",
    "",
  ].join("\n");
}

async function saveSetup(answer: SetupAnswer) {
  try {
    const path = configPath();
    // A new project gets a whole tide.json for its kind; an existing one only what the popup sets.
    if (project && path && !(await configExists())) {
      await fs.writeFile(path, starterConfig(answer, project.hasMakefile));
      await loadConfig();
    } else {
      await setConfigKeys({ calculator: answer.calculator, language: answer.language, prerun: answer.prerun, postrun: answer.postrun });
    }
    setMessage(`${project?.name}: ${LANGUAGES[answer.language]} for the ${TARGETS[answer.calculator].name}, in tide.json.`);
  } catch (err) {
    setTarget(answer.calculator);
    setMessage(`Target: ${TARGETS[answer.calculator].name}, for now: tide.json couldn't be changed (${err instanceof Error ? err.message : err}).`);
  }
}

/** Sets the target. In a project, it's the project's: it goes in tide.json as "calculator". */
async function chooseTarget(target: Target) {
  if (!project) return setTarget(target);
  try {
    await setConfigKeys({ calculator: target });
    setMessage(`This project is for the ${TARGETS[target].name} now (tide.json's "calculator").`);
  } catch (err) {
    setTarget(target);
    setMessage(`Target: ${TARGETS[target].name}, for now: tide.json couldn't be changed (${err instanceof Error ? err.message : err}).`);
  }
}

/** Opens a folder on its own, in place of what this window had open. */
async function loadProject(root: string, reveal = true) {
  const entries = await fs.readDir(root);
  dirCache.clear();
  expanded.clear();
  foldedFolders.clear();
  workspace = { file: null, folders: [root] };
  await useFolder(root, reveal, entries);
}

/**
 * Makes one of the workspace's folders the active one: its tide.json, Source Control, builds and
 * terminal. Opening a file in another folder of the workspace does this for that folder.
 */
async function useFolder(root: string, reveal = false, read?: Entry[]) {
  const entries = read ?? (await fs.readDir(root));
  dirCache.set(root, entries);
  const switching = workspace.folders.length > 1 && !!project;
  const hasMakefile = entries.some(
    (e) => !e.isDir && /^(?:gnu)?makefile$/i.test(e.name),
  );
  project = { root, name: baseName(root), hasMakefile };
  targetDir = null;
  creating = null;
  ndlessMakefile = null;
  try {
    localStorage.setItem(PROJECT_PREF, root);
  } catch {
    /* storage unavailable */
  }
  saveWorkspacePref();
  await loadConfig(entries.some((e) => e.isDir && e.name === CONFIG_DIR));
  // What tide.json leaves out (its calculator, its language), the setup popup asks, or the files show.
  // Then, once that's settled, whether its toolchain is installed.
  void settleProject(root, entries).then(() => {
    if (project?.root === root) void checkToolchain();
  });
  if (reveal) showPane("files");
  renderTree();
  applyEditorMode(); // the docs and Build button follow the project type
  setMessage(
    switching
      ? `Working in ${project.name}: builds, Source Control and tide.json follow it`
      : `Opened ${hasMakefile ? "C project" : "folder"} ${project.name}`,
  );
  void scm.refresh();
  emit("project", { root, name: project.name });
  panel.projectChanged(root);
  watchWorkspace();
  void titleWindow(workspaceName(), fs.desktop, nightlyWeb);
}

// ── Workspaces: several folders in one window ──
const isAbsolute = (path: string) => /^(?:[a-zA-Z]:)?[\\/]/.test(path) || path.startsWith("/");
/** What the window is called: the workspace file's name, or the folder's. */
const workspaceName = () =>
  workspace.file
    ? baseName(workspace.file).replace(/\.tide-workspace$/i, "")
    : workspace.folders.length > 1
      ? `${project?.name ?? baseName(workspace.folders[0])} (workspace)`
      : (project?.name ?? null);
/** The workspace folder a path is in (the innermost, if folders are nested), or null. */
function folderOf(path: string): string | null {
  const p = samePath(path);
  let best: string | null = null;
  for (const f of workspace.folders) {
    const root = samePath(f);
    if ((p === root || p.startsWith(`${root}/`)) && (!best || root.length > samePath(best).length)) best = f;
  }
  return best;
}
function watchWorkspace() {
  void fs
    .watchFolders(workspace.folders)
    .catch((err) => console.error("Couldn't watch the folders", err));
}
function saveWorkspacePref() {
  try {
    localStorage.setItem(
      WORKSPACE_PREF,
      JSON.stringify({ ...workspace, active: project?.root ?? null }),
    );
  } catch {
    /* storage unavailable */
  }
}
/** Rewrites a saved workspace's file when its folders change, as VS Code does. */
async function writeWorkspaceFile() {
  if (!workspace.file) return;
  const dir = parentOf(workspace.file);
  const folders = workspace.folders.map((f) => {
    // Folders beside or below the file are kept relative, so the workspace moves with them.
    const inside = samePath(f).startsWith(`${samePath(dir)}/`);
    return { path: inside ? f.slice(dir.length + 1).replace(/\\/g, "/") : f };
  });
  try {
    await fs.writeFile(workspace.file, `${JSON.stringify({ folders }, null, 2)}\n`);
  } catch (err) {
    setMessage(`Couldn't save ${baseName(workspace.file)}: ${err instanceof Error ? err.message : err}`);
  }
}
function afterWorkspaceChange() {
  saveWorkspacePref();
  watchWorkspace();
  renderTree();
  void writeWorkspaceFile();
  void titleWindow(workspaceName(), fs.desktop, nightlyWeb);
}

/** Adds a folder to this window's workspace. With nothing open, it just opens it. */
async function addFolderToWorkspace() {
  if (!fs.available) return setMessage("Opening folders needs the desktop app.");
  try {
    const root = await fs.pickFolder();
    if (!root) return;
    if (!project) return void (await loadProject(root));
    if (workspace.folders.some((f) => samePath(f) === samePath(root)))
      return setMessage(`${baseName(root)} is already in this workspace.`);
    dirCache.set(root, await fs.readDir(root));
    workspace.folders.push(root);
    showPane("files");
    afterWorkspaceChange();
    setMessage(`Added ${baseName(root)} to the workspace. ${project.name} stays the active folder until you open a file in another.`);
  } catch (err) {
    setMessage(`Could not add the folder: ${err instanceof Error ? err.message : err}`);
  }
}

/** Takes a folder out of the workspace (nothing on disk changes). Its open tabs stay open. */
async function removeFromWorkspace(root: string) {
  workspace.folders = workspace.folders.filter((f) => samePath(f) !== samePath(root));
  foldedFolders.delete(root);
  for (const dir of [...dirCache.keys()])
    if (folderOf(dir) === null) {
      dirCache.delete(dir);
      expanded.delete(dir);
    }
  if (!workspace.folders.length) {
    workspace.file = null;
    closeFolder();
    return;
  }
  if (project && samePath(project.root) === samePath(root)) await useFolder(workspace.folders[0]);
  afterWorkspaceChange();
  setMessage(`Removed ${baseName(root)} from the workspace.`);
}

/** Closes every folder in this window: tabs stay open, but nothing builds or shows in the Explorer. */
function closeFolder() {
  project = null;
  workspace = { file: null, folders: [] };
  dirCache.clear();
  expanded.clear();
  foldedFolders.clear();
  targetDir = null;
  creating = null;
  try {
    localStorage.removeItem(PROJECT_PREF);
  } catch {
    /* storage unavailable */
  }
  saveWorkspacePref();
  watchWorkspace();
  void loadConfig(false);
  renderTree();
  applyEditorMode();
  void scm.refresh();
  emit("project", { root: null, name: null });
  void titleWindow(null, fs.desktop, nightlyWeb);
  setMessage("Closed the folder");
}

/** Saves this window's folders as a .tide-workspace file, to open again together. */
async function saveWorkspaceAs() {
  if (!workspace.folders.length) return setMessage("Open a folder first.");
  const name = workspace.file ? baseName(workspace.file) : `${project?.name ?? "TIde"}.${WORKSPACE_EXT}`;
  const path = await fs.pickSaveFile(name, { name: "TIde workspace", extensions: [WORKSPACE_EXT] });
  if (!path) return;
  workspace.file = /\.tide-workspace$/i.test(path) ? path : `${path}.${WORKSPACE_EXT}`;
  await writeWorkspaceFile();
  saveWorkspacePref();
  void titleWindow(workspaceName(), fs.desktop, nightlyWeb);
  renderTree();
  setMessage(`Saved the workspace as ${baseName(workspace.file)}`);
}

/** Opens a .tide-workspace file: its folders, in place of what this window had open. */
async function openWorkspace(file?: string) {
  if (!fs.desktop) return setMessage("Workspace files need the desktop app.");
  try {
    const path = file ?? (await fs.pickFile("TIde workspace", [WORKSPACE_EXT]));
    if (!path) return;
    const data = JSON.parse(await fs.readFile(path)) as { folders?: { path?: unknown }[] };
    const dir = parentOf(path);
    const wanted = (Array.isArray(data.folders) ? data.folders : [])
      .map((f) => (typeof f?.path === "string" ? f.path : ""))
      .filter(Boolean)
      .map((f) => (isAbsolute(f) ? f : joinPath(dir, f)));
    const folders: string[] = [];
    const missing: string[] = [];
    dirCache.clear();
    expanded.clear();
    foldedFolders.clear();
    for (const f of wanted) {
      try {
        dirCache.set(f, await fs.readDir(f));
        folders.push(f);
      } catch {
        missing.push(baseName(f));
      }
    }
    if (!folders.length) return setMessage(`${baseName(path)} has no folders TIde can open${missing.length ? ` (${missing.join(", ")} can't be found)` : ""}.`);
    workspace = { file: path, folders };
    await useFolder(folders[0], true);
    renderTree();
    if (missing.length) setMessage(`Opened ${baseName(path)}, without ${missing.join(", ")}: not found.`);
  } catch (err) {
    setMessage(`Could not open the workspace: ${err instanceof Error ? err.message : err}`);
  }
}

/** Re-reads every folder the Explorer shows. */
const refreshWorkspace = () => void foldersChanged([...dirCache.keys()]);

// ── Live folders: the Explorer re-reads a folder when anything changes in it ──
const samePath = (p: string) =>
  p
    .replace(/[\\/]+$/, "")
    .replace(/\\/g, "/")
    .toLowerCase();
async function foldersChanged(dirs: string[]) {
  if (!project) return;
  const changed = new Set(dirs.map(samePath));
  // Only folders the Explorer has read: the rest are read when they're opened.
  const stale = [...dirCache.keys()].filter((dir) =>
    changed.has(samePath(dir)),
  );
  await Promise.all(
    stale.map(async (dir) => {
      try {
        dirCache.set(dir, await fs.readDir(dir));
      } catch {
        dirCache.delete(dir);
        expanded.delete(dir);
      }
    }),
  );
  // Not while a new file's name is being typed: the tree is drawn again when that's done.
  if (stale.length && !creating) renderTree();
  if (changed.has(samePath(joinPath(project.root, CONFIG_DIR))))
    await loadConfig();
  // Open files in those folders: reloaded if they changed there.
  refreshOpenFiles(changed);
}
// ── Open files that change on disk: another program, git, a build, the terminal ──
// A tab with no unsaved changes takes the new text, keeping its place and undo history. One with
// unsaved changes keeps them, and says so: saving asks first, and Reload from disk takes the disk's.

/** Where an open file is on disk: its tab's path (a dropped file's, once saved somewhere), or null. */
const diskPath = (doc: Doc) => {
  if (!doc.id.startsWith("file:") || !doc.encoding) return null;
  const path = doc.hint ?? doc.id.slice(5);
  return path.startsWith(DROPPED) ? null : path;
};

/** Reads an open file again and brings its tab up to date with the disk. */
async function reloadFromDisk(doc: Doc, force = false) {
  const path = diskPath(doc);
  if (!path) return;
  let text: string;
  try {
    text = decodeWith(await fs.readBinary(path), doc.encoding!);
  } catch {
    if (doc.diskChanged === "deleted" || docs.get(doc.id) !== doc) return;
    doc.diskChanged = "deleted";
    setMessage(
      `${doc.label} was deleted or moved outside TIde. Its tab stays open; saving writes it again.`,
    );
    return;
  }
  if (docs.get(doc.id) !== doc) return; // closed meanwhile
  if (doc.diskChanged === "deleted") doc.diskChanged = undefined;
  if (text === doc.disk && !force) return;
  if (isDirty(doc) && !force) {
    if (doc.diskChanged === text) return;
    doc.diskChanged = text;
    setMessage(
      `${doc.label} changed on disk. Your unsaved changes are kept: saving asks before overwriting, and File → Reload from disk takes the disk's version.`,
    );
    return;
  }
  // In place, as one edit: the cursor, scroll and undo history stay.
  const showing = active === doc.id;
  const view = showing ? editor.saveViewState() : null;
  doc.model.pushEditOperations(
    [],
    [{ range: doc.model.getFullModelRange(), text }],
    () => null,
  );
  doc.disk = text;
  doc.diskChanged = undefined;
  doc.savedVersion = doc.model.getAlternativeVersionId();
  if (view) editor.restoreViewState(view);
  setMessage(`Reloaded ${doc.label}: it changed on disk.`);
  refresh();
}

/** Brings open files up to date: those in `dirs` (folders a change was reported in), or all of them. */
function refreshOpenFiles(dirs?: Set<string>) {
  for (const doc of [...docs.values()]) {
    const path = diskPath(doc);
    if (!path || (dirs && !dirs.has(samePath(parentOf(path))))) continue;
    void reloadFromDisk(doc);
  }
}

// The web version has no folder watching: a real folder (not one kept in the browser, which only
// TIde changes) is looked at again every couple of seconds while TIde shows, and when it gets focus.
if (fs.web) {
  const look = async () => {
    if (!project || project.root.startsWith("/Browser/") || document.hidden)
      return;
    let changed = false;
    await Promise.all(
      [...dirCache.keys()].map(async (dir) => {
        try {
          const now = await fs.readDir(dir);
          const was = dirCache.get(dir) ?? [];
          if (
            now.length !== was.length ||
            now.some(
              (e, i) => e.name !== was[i]?.name || e.isDir !== was[i]?.isDir,
            )
          ) {
            dirCache.set(dir, now);
            changed = true;
          }
        } catch {
          /* gone, or not allowed now */
        }
      }),
    );
    if (changed && !creating) renderTree();
    refreshOpenFiles();
  };
  window.setInterval(() => void look(), 2500);
  window.addEventListener("focus", () => void look());
}

if (fs.desktop) {
  // This window's folders only: each window watches its own (watch.rs).
  import("@tauri-apps/api/webviewWindow")
    .then(({ getCurrentWebviewWindow }) =>
      getCurrentWebviewWindow().listen<{ dirs: string[] }>(
        "folder://changed",
        (e) => void foldersChanged(e.payload.dirs),
      ),
    )
    .catch(() => {
      /* not in the desktop app */
    });
}

/** Web only: opens or makes a project kept in the browser's storage. */
async function openBrowserProject() {
  try {
    const root = await fs.pickBrowserProject?.();
    if (root) await loadProject(root);
  } catch (err) {
    setMessage(
      `Could not open the project: ${err instanceof Error ? err.message : err}`,
    );
  }
}

/** Opens another TIde window (desktop app): empty, or with a folder or workspace. */
async function newWindow(start?: WindowStart) {
  if (!fs.desktop) return setMessage("More windows need the desktop app. In the browser, open TIde in another tab.");
  try {
    await openWindow(start);
  } catch (err) {
    setMessage(`Could not open a window: ${err instanceof Error ? err.message : err}`);
  }
}
/** Picks a folder and opens it in a new window. */
async function openFolderInNewWindow() {
  if (!fs.desktop) return setMessage("More windows need the desktop app.");
  const root = await fs.pickFolder();
  if (root) await newWindow({ folder: root });
}

async function openFolder() {
  if (!fs.available) {
    setMessage("Opening folders needs the desktop app.");
    return;
  }
  try {
    const root = await fs.pickFolder();
    if (!root) return;
    await loadProject(root);
    // Browsers that can't write to folders on your computer get a copy kept in the browser.
    if (fs.web && root.startsWith("/Browser/"))
      setMessage(
        `Opened a copy of ${baseName(root)}, kept in this browser: this browser can't save into folders on your computer. Chrome and Edge can.`,
      );
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

function setMessage(text: string) {
  els.msg.textContent = text;
  els.msg.title = text;
}

// ── Rendering ──────────────────────────────────────────────────────────────

function renderList() {
  const query = els.find.value.toUpperCase();
  const shown = names.filter((n) => n.includes(query));
  els.list.replaceChildren(
    ...shown.map((n) => {
      const doc = docs.get(progId(n));
      // Open programs are checked live against their model; closed ones use the last checked source.
      const errors = doc
        ? tokenize(doc.model.getValue()).errors.length
        : (buildErrors.get(n) ?? 0);
      const row = h(
        "li",
        { role: "option", tabIndex: 0 },
        ...(errors
          ? [
              h(
                "span",
                {
                  className: "bad",
                  title: `${errors} character${errors === 1 ? "" : "s"} won't tokenize — the .8xp will skip them.`,
                },
                "!",
              ),
            ]
          : []),
        h("span", { className: "name" }, n),
        ...(doc && isDirty(doc)
          ? [h("span", { className: "unsaved", title: "Unsaved changes" }, "●")]
          : []),
        h(
          "button",
          {
            className: "del",
            title: `Delete ${n}`,
            onclick: (e: Event) => {
              e.stopPropagation();
              void deleteProgram(n);
            },
          },
          "×",
        ),
      );
      row.setAttribute("aria-selected", String(progId(n) === active));
      row.onclick = () => void openProgram(n);
      row.dataset.program = n;
      row.onkeydown = (e) => {
        if (e.key === "Enter") void openProgram(n);
      };
      return row;
    }),
  );
  els.listEmpty.hidden = names.length > 0 || !!query;
}

function treeRows(path: string, depth: number, out: HTMLElement[]) {
  if (creating?.dir === path)
    out.push((creating.row ??= nameBoxRow(path, creating.kind, depth))); // the same box across redraws
  for (const entry of dirCache.get(path) ?? []) {
    const open = entry.isDir && expanded.has(entry.path);
    const row = h(
      "li",
      { role: "treeitem", tabIndex: 0, title: entry.path },
      h("span", { className: "twisty" }, entry.isDir ? (open ? "▾" : "▸") : ""),
      h("span", { className: "name" }, entry.name),
    );
    row.style.paddingLeft = `${10 + depth * 14}px`;
    row.style.setProperty("--depth", String(depth));
    row.draggable = true;
    row.dataset.path = entry.path;
    row.dataset.dir = String(entry.isDir);
    if (entry.isDir) row.setAttribute("aria-expanded", String(open));
    row.setAttribute(
      "aria-selected",
      String(!entry.isDir && fileId(entry.path) === active),
    );
    const act = () => {
      targetDir = entry.isDir ? entry.path : parentOf(entry.path);
      void (entry.isDir ? toggleDir(entry) : openFile(entry));
    };
    row.onclick = act;
    row.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        act();
      } else if (e.key === "Delete") {
        e.preventDefault();
        void deleteEntry(entry.path, entry.isDir, e.shiftKey);
      }
    };
    out.push(row);
    if (open) treeRows(entry.path, depth + 1, out);
  }
}

function renderTree() {
  $("new-file").hidden = $("new-folder").hidden = !project;
  els.openFolder.hidden = !!project;
  const several = workspace.folders.length > 1;
  els.projectName.textContent = several
    ? (workspace.file ? baseName(workspace.file).replace(/\.tide-workspace$/i, "") : "Workspace")
    : (project?.name ?? "No folder open");
  els.projectName.title = several
    ? `${workspace.file ?? "A workspace of these folders"}\n${workspace.folders.join("\n")}`
    : (project?.root ?? "");
  els.treeEmpty.hidden = project !== null;
  const rows: HTMLElement[] = [];
  if (several)
    for (const root of workspace.folders) {
      const open = !foldedFolders.has(root);
      const isActive = !!project && samePath(project.root) === samePath(root);
      const row = h(
        "li",
        {
          role: "treeitem",
          tabIndex: 0,
          className: `ws-folder${isActive ? " active" : ""}`,
          title: `${root}${isActive ? "\nThe active folder: builds, Source Control and tide.json follow it" : ""}`,
        },
        h("span", { className: "twisty" }, open ? "▾" : "▸"),
        h("span", { className: "name" }, baseName(root)),
        ...(isActive ? [h("span", { className: "ws-active" }, "active")] : []),
      );
      row.dataset.wsFolder = root;
      row.setAttribute("aria-expanded", String(open));
      const fold = () => {
        if (open) foldedFolders.add(root);
        else foldedFolders.delete(root);
        targetDir = root;
        renderTree();
      };
      row.onclick = fold;
      row.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fold();
        }
      };
      rows.push(row);
      if (open) treeRows(root, 1, rows);
    }
  else if (project) treeRows(project.root, 0, rows);
  const typing =
    !!creating?.row && creating.row.contains(document.activeElement);
  els.tree.replaceChildren(...rows);
  if (typing) creating!.row!.querySelector("input")?.focus();
}

function renderTabs() {
  els.tabs.replaceChildren(
    ...tabOrder.map((id) => {
      const doc = docs.get(id),
        item = (doc ?? views.get(id))!;
      const tab = h(
        "div",
        {
          className: `tab${doc ? "" : " view-tab"}`,
          role: "tab",
          tabIndex: 0,
          title: item.hint ?? item.label,
          onclick: () => activate(id),
        },
        item.label,
        ...(doc && isDirty(doc)
          ? [h("span", { className: "dirty", title: "Unsaved changes" })]
          : []),
        h(
          "button",
          {
            className: "close",
            title: `Close ${item.label}`,
            onclick: (e: Event) => {
              e.stopPropagation();
              closeTab(id);
            },
          },
          "×",
        ),
      );
      tab.setAttribute("aria-selected", String(id === active));
      tab.dataset.tab = id;
      return tab;
    }),
  );
}

const overflow = editor.createDecorationsCollection();
/** Mark text past the screen width (one column is taken by the ":"), which wraps on the calculator. */
function markOverflow() {
  const doc = activeDoc();
  if (!doc || doc.language !== "tibasic") {
    overflow.clear();
    return;
  }
  const cols = screenCols();
  const marks: monaco.editor.IModelDeltaDecoration[] = [];
  doc.model.getLinesContent().forEach((text, i) => {
    // Indentation isn't on the calculator, so the screen's width starts after it.
    const lead = text.length - text.trimStart().length;
    if (text.length - lead < cols) return;
    marks.push({
      range: new monaco.Range(i + 1, lead + cols, i + 1, text.length + 1),
      options: {
        inlineClassName: "overflow",
        hoverMessage: { value: "Wraps onto a new row on the calculator." },
      },
    });
  });
  overflow.set(marks);
}

/** Which docs (and inserts) the active tab uses, or null for file types without one. */
function catalogLang(): DocLangId | null {
  // While the docs tab shows, the docs follow the file you came from.
  const language = (
    active === DOCS_TAB && lastDocTab ? docs.get(lastDocTab) : activeDoc()
  )?.language;
  if (!language || language === "tibasic") return "tibasic";
  if (language === "python") return "python";
  if (language === "tipython") return "tipython";
  if (language === ASM_LANG) return "ez80";
  // The CE toolchain builds C++ too. A Makefile marks the whole folder as a C project.
  if (language === "c" || language === "cpp" || project?.hasMakefile)
    return "c";
  return null;
}

/** What the Docs view lists depends on the toolchain of the active tab. */
function catalogGroups(): {
  group: string;
  entries: { name: string; insert: string; hint: string; detail?: string }[];
}[] {
  switch (catalogLang()) {
    case "tibasic":
      return tiCatalog(getTarget());
    case "python":
      return PY_CATALOG;
    case "tipython":
      return TI_PYTHON_CATALOG;
    case "ez80":
      return ASM_CATALOG;
    case "c":
      return C_CATALOG;
    default:
      return [];
  }
}

/** Opens the docs tab for the active tab's language, at the named entry if given. */
function openDocs(name?: string) {
  const lang = catalogLang() ?? undefined;
  openView({
    id: DOCS_TAB,
    label: "Docs",
    hint: keys("Documentation for TI-BASIC, the C libraries, py2ez80 and eZ80 assembly (Ctrl+Shift+J)"),
    el: docsEl,
  });
  docsView.open(lang, name);
}

/** The Docs view: every entry for the active tab's language. Click opens its page; Enter or + inserts it. */
function renderDocList() {
  const lang = catalogLang();
  els.docsLang.textContent = lang
    ? `· ${DOCS.find((d) => d.id === lang)!.label}`
    : "";
  const q = els.docFind.value.trim().toLowerCase();
  const groups = catalogGroups();
  const nodes = groups.flatMap((group) => {
    const entries = group.entries.filter(
      (e) =>
        !q || `${e.name} ${e.hint} ${e.detail ?? ""}`.toLowerCase().includes(q),
    );
    if (!entries.length) return [];
    return [
      h("h3", { className: "section" }, group.group),
      ...entries.map((e) => {
        const hint = e.hint.replace(/`/g, "");
        const row = h(
          "div",
          {
            className: "item",
            tabIndex: 0,
            title: [e.detail, hint, "Click: full docs · Enter: insert"]
              .filter(Boolean)
              .join("\n"),
            onclick: () => openDocs(e.name),
          },
          h("code", {}, e.name),
          ...(hint ? [h("span", {}, hint)] : []),
          h(
            "button",
            {
              className: "insert",
              type: "button",
              title: "Insert at the cursor",
              tabIndex: -1,
              onclick: (ev: Event) => {
                ev.stopPropagation();
                insertSnippet(e.insert);
              },
            },
            "+",
          ),
        );
        row.dataset.insert = e.insert;
        return row;
      }),
    ];
  });
  const none = groups.length
    ? "Nothing matches."
    : "No docs for this file type.";
  els.docList.replaceChildren(
    ...(nodes.length ? nodes : [h("p", { className: "hint" }, none)]),
  );
}

/** Inserts an entry at the cursor. Monaco snippet syntax ($0, ${1:…}) expands into tab stops. */
function insertSnippet(text: string) {
  if (!activeDoc()) {
    setMessage("Open a program to insert commands.");
    return;
  }
  editor.focus();
  // Standalone Monaco has no "editor.action.insertSnippet" command; the snippet controller is the way in.
  editor
    .getContribution<
      monaco.editor.IEditorContribution & { insert(template: string): void }
    >("snippetController2")
    ?.insert(text);
  if (text.endsWith("("))
    editor.trigger("docs", "editor.action.triggerParameterHints", null);
}

/** Arrow keys walk the docs list; Up from the first item goes back to the search box. */
function docListKeys(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    editor.focus();
    return;
  }
  const items = [...els.docList.querySelectorAll<HTMLElement>(".item")];
  const nameOf = (i: HTMLElement) => i.querySelector("code")!.textContent!;
  // Best match, not first listed: "sin(" must pick sin( over asin(.
  const best = () => {
    const q = els.docFind.value.trim().toLowerCase();
    const named = (test: (name: string) => boolean) =>
      items.find((i) => test(nameOf(i).toLowerCase()));
    return named((n) => n === q) ?? named((n) => n.startsWith(q)) ?? items[0];
  };
  const current =
    e.target === els.docFind
      ? best()
      : (e.target as HTMLElement).closest<HTMLElement>(".item");
  if (e.key === "F1") {
    e.preventDefault();
    if (current) openDocs(nameOf(current));
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    if (current?.dataset.insert) insertSnippet(current.dataset.insert);
    return;
  }
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  const next =
    items.indexOf(e.target as HTMLElement) + (e.key === "ArrowDown" ? 1 : -1);
  if (next < 0) els.docFind.focus();
  else items[Math.min(next, items.length - 1)]?.focus();
}

const PANES = ["files", "scm", "docs", "ext"] as const;
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

// ── The side bar's width: drag its right edge (double-click for the default), remembered ──
const SIDE_WIDTH_PREF = "tide-pref-side-width"; // not "tide:", which the browser store treats as a program
const SIDE_DEFAULT = 230;
let sideWidth = SIDE_DEFAULT;
try { sideWidth = Number(localStorage.getItem(SIDE_WIDTH_PREF)) || SIDE_DEFAULT; } catch { /* storage unavailable */ }
/** Fits the chosen width to the window, so a narrow window keeps room for the editor without forgetting it. */
const fitSide = () => {
  const w = Math.max(160, Math.min(sideWidth, 640, window.innerWidth - 360));
  app.style.setProperty("--side-w", `${Math.round(w)}px`);
};
const saveSide = () => { try { localStorage.setItem(SIDE_WIDTH_PREF, String(sideWidth)); } catch { /* storage unavailable */ } };
fitSide();
window.addEventListener("resize", fitSide);
{
  const sash = $("side-resize");
  sash.addEventListener("pointerdown", e => {
    e.preventDefault();
    const startX = e.clientX, startW = $("pane-files").parentElement!.getBoundingClientRect().width;
    app.classList.add("resizing-side");
    const move = (m: PointerEvent) => { sideWidth = Math.max(160, startW + m.clientX - startX); fitSide(); };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      app.classList.remove("resizing-side");
      saveSide();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
  sash.addEventListener("dblclick", () => { sideWidth = SIDE_DEFAULT; fitSide(); saveSide(); });
}

/** TI-BASIC gets the calculator's ":" gutter, the 26-column ruler and its own completions; other languages get a normal editor. */
function applyEditorMode() {
  const basic = isBasic();
  editor.updateOptions({
    ...(basic
      ? gutterOptions()
      : { lineNumbers: "on" as const, lineNumbersMinChars: 3 }),
    rulers: basic && settings().showRuler ? [screenCols() - 1] : [],
    wordBasedSuggestions: basic ? "off" : "currentDocument",
    suggest: { showWords: !basic, snippetsPreventQuickSuggestions: false },
  });
  els.gutter.hidden = !basic;
  els.gutter.textContent = showNumbers ? "Gutter: line numbers" : 'Gutter: ":"';
  els.gutter.setAttribute("aria-pressed", String(showNumbers));
  const make = usesMake(),
    asm = assemblesActive(),
    script = nspireScript();
  els.exportBtn.hidden = !make && !asm && !script && (!basic || !activeDoc());
  els.run.hidden = !fs.available || els.exportBtn.hidden;
  els.exportBtn.textContent = asm ? "Assemble .8xp" : buildLabel();
  els.exportBtn.title = keys(asm
    ? "Assembles this file with spasm-ng into an .8xp next to it (Ctrl+E). F5 also sends it to the calculator."
    : make
      ? `Runs make in ${project?.name} (Ctrl+E). Saves changed files first.`
      : script
        ? "Packs the script with Luna into a .tns (Ctrl+E). Ctrl+Shift+E picks a new location."
        : "Ctrl+E rebuilds to the same file. Ctrl+Shift+E picks a new location.");
  renderDocList(); // the docs follow the toolchain of the active tab
  renderProject(); // so does the status bar
}

function renderProblems() {
  const doc = activeDoc();
  // Only TI-BASIC and Python (py2ez80) have diagnostics; "No problems" for C would be a claim nothing is checking.
  els.problems.hidden =
    !doc || (doc.language !== "tibasic" && doc.language !== "python"); // ← CHANGED
  if (els.problems.hidden || !doc) return;
  const markers = monaco.editor.getModelMarkers({ resource: doc.model.uri });
  const errors = markers.filter(
    (m) => m.severity === monaco.MarkerSeverity.Error,
  ).length;
  const warnings = markers.filter(
    (m) => m.severity === monaco.MarkerSeverity.Warning,
  ).length;
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;
  els.problems.textContent =
    errors || warnings
      ? [
          errors && plural(errors, "error"),
          warnings && plural(warnings, "warning"),
        ]
          .filter(Boolean)
          .join(", ")
      : "No problems";
  els.problems.className = errors
    ? "has-errors"
    : warnings
      ? "has-warnings"
      : "";
}

const statusBar = document.querySelector<HTMLElement>(".status")!;
const KIND_LABEL: Record<DocLangId, string> = {
  tibasic: "TI-BASIC",
  c: "C",
  python: "py2ez80",
  tipython: "TI-Python",
  ez80: "eZ80 assembly",
};

/** The status bar takes the color of the active toolchain and names the project on its left, as VS Code does. */
function renderProject() {
  const kind = catalogLang();
  statusBar.dataset.kind = kind ?? "plain";
  const where = project
    ? `${project.hasMakefile ? "C project" : "Folder"}: ${project.name}`
    : "Programs";
  els.project.textContent = kind ? `${where} · ${KIND_LABEL[kind]}` : where;
  els.project.title = project
    ? project.root
    : "TI-BASIC programs stored by TIde";
}

/** The encoding picker in the status bar, for project files: reopen in, or save as, another encoding. */
function renderEncoding(doc: Doc | undefined) {
  els.encoding.hidden = !doc?.encoding;
  if (!doc?.encoding) return;
  const key = encodingKey(doc.encoding);
  if (els.encoding.dataset.for !== `${doc.id}|${key}`) {
    els.encoding.dataset.for = `${doc.id}|${key}`;
    const option = (action: string, e: Encoding) =>
      h("option", { value: `${action}:${encodingKey(e)}` }, e.label);
    els.encoding.replaceChildren(
      h("option", { value: "", hidden: true }, doc.encoding.label),
      Object.assign(document.createElement("optgroup"), {
        label: "Reopen with encoding",
      }),
      Object.assign(document.createElement("optgroup"), {
        label: "Save with encoding",
      }),
    );
    const [, reopen, save] = els.encoding.children;
    reopen.append(...ENCODINGS.map((e) => option("reopen", e)));
    save.append(...ENCODINGS.filter(canSave).map((e) => option("save", e)));
  }
  els.encoding.value = "";
  els.encoding.title = `${doc.encoding.label}. Pick an encoding to reopen or save this file in.`;
}

function renderStatus() {
  renderProject();
  const doc = activeDoc();
  const pos = editor.getPosition();
  els.pos.textContent =
    doc && pos ? `Ln ${pos.lineNumber}, Col ${pos.column}` : "";
  renderEncoding(doc);
  if (!doc) {
    els.size.textContent = "";
    els.size.title = "";
    return;
  }
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
  navigator.clipboard.writeText(text).then(
    () => setMessage(`Copied ${what}`),
    () => setMessage("Couldn't copy to the clipboard."),
  );

function closeOthers(keep: string, toRight = false) {
  const from = tabOrder.indexOf(keep);
  for (const id of [...tabOrder])
    if (id !== keep && (!toRight || tabOrder.indexOf(id) > from)) closeTab(id);
}

async function sendPath(path: string, name: string) {
  try {
    await calc.send([{ name, bytes: await fs.readBinary(path) }]);
  } catch (err) {
    setMessage(`Could not send ${name}: ${err}`);
  }
}

// ── Creating files and folders in the tree ──
// As in VS Code: a name box appears in the tree inside the folder, Enter creates, Escape cancels,
// clicking away creates if a name was typed, and "a/b/c.c" creates the folders on the way.

/** The folder the header's New file and New folder buttons create in: the last folder clicked, or the one holding the last file clicked. */
let targetDir: string | null = null;
/** The name box being shown, if any. */
let creating: {
  dir: string;
  kind: "file" | "folder";
  row?: HTMLElement;
} | null = null;

const parentOf = (path: string) => path.replace(/[\\/][^\\/]*$/, "");

/** Shows a name box for a new file or folder inside `dir`, opening the folder if needed. */
async function createIn(dir: string, kind: "file" | "folder") {
  if (!project) return;
  showPane("files");
  if (dir !== project.root && !expanded.has(dir)) {
    expanded.add(dir);
    if (!dirCache.has(dir))
      dirCache.set(dir, await fs.readDir(dir).catch(() => [] as Entry[]));
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
  if (parts.some((p) => !p.trim()))
    return "A name can't start or end with a slash, or have two in a row.";
  if (parts.some((p) => /[:*?"<>|]/.test(p)))
    return "A name can't contain : * ? \" < > |";
  if (parts.some((p) => p === "." || p === ".."))
    return "A name can't be . or ..";
  if (parts.some((p) => /[. ]$/.test(p)))
    return "A name can't end with a dot or a space.";
  const first = parts[0].toLowerCase();
  const clash = (dirCache.get(dir) ?? []).find(
    (e) => e.name.toLowerCase() === first,
  );
  if (clash && (parts.length === 1 || !clash.isDir))
    return `${parts.length === 1 ? name : parts[0]} already exists here. Choose a different name.`;
  return null;
}

/** The name box row in the tree. */
function nameBoxRow(
  dir: string,
  kind: "file" | "folder",
  depth: number,
): HTMLElement {
  const input = h("input", {
    className: "name-input",
    spellcheck: false,
    ariaLabel: `New ${kind} name`,
  });
  const problem = h("div", { className: "name-problem", hidden: true });
  const row = h(
    "li",
    { className: "creating" },
    h("span", { className: "twisty" }, kind === "folder" ? "▸" : ""),
    input,
    problem,
  );
  row.style.paddingLeft = `${10 + depth * 14}px`;
  row.style.setProperty("--depth", String(depth));
  let done = false;
  const finish = async (commit: boolean) => {
    if (done) return;
    const name = input.value.trim();
    if (commit && name && nameProblem(dir, name)) {
      input.focus();
      return;
    }
    done = true;
    creating = null;
    if (!commit || !name) return renderTree();
    const path = joinPath(dir, name);
    try {
      if (kind === "folder") await fs.createDir(path);
      else await fs.writeFile(path, "");
      // Refresh and open every folder on the way, so the new item shows.
      let at = dir;
      for (const part of name
        .split(/[\\/]/)
        .slice(0, kind === "folder" ? undefined : -1)) {
        dirCache.set(at, await fs.readDir(at));
        at = joinPath(at, part);
        expanded.add(at);
      }
      dirCache.set(at, await fs.readDir(at).catch(() => [] as Entry[]));
      if (kind === "folder") targetDir = path;
      renderTree();
      if (kind === "file")
        await openFile({ name: baseName(path), path, isDir: false });
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
  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      void finish(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      void finish(false);
    }
  });
  // Clicking away creates it if the name is good, and drops it otherwise.
  input.addEventListener("blur", () =>
    window.setTimeout(() => {
      if (document.activeElement === input) return; // the tree was only redrawn
      void finish(!nameProblem(dir, input.value.trim()));
    }),
  );
  return row;
}

/** Deletes a file or folder from the Explorer: to the Recycle Bin, or permanently. Closes its tabs. */
async function deleteEntry(path: string, isDir: boolean, permanent: boolean) {
  if (fs.web) permanent = true; // a browser has no Recycle Bin
  const name = baseName(path),
    what = isDir ? `the folder ${name} and everything in it` : name;
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
    return (
      !!p &&
      (p === path || p.startsWith(path + "\\") || p.startsWith(path + "/"))
    );
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
  for (const key of [...dirCache.keys()])
    if (key.startsWith(path)) dirCache.delete(key);
  if (targetDir?.startsWith(path)) targetDir = parent;
  renderTree();
  void scm.refresh();
  setMessage(permanent ? `Deleted ${name}` : `Moved ${name} to the ${bin}`);
}

// ── Dragging files ──
// In the Explorer, files and folders drag onto a folder (or the project's root) to move there, and
// files and folders dropped from outside are copied in. On the editor, files dropped from outside or
// dragged from the Explorer open in tabs.

/** Paths of files dropped from outside TIde, which have no place on disk TIde knows. */
const DROPPED = "dropped:";
let droppedCount = 0;
const isInside = (path: string, dir: string) =>
  path === dir || path.startsWith(dir + "\\") || path.startsWith(dir + "/");

/** The folder a drop on `target` goes into, or null where nothing can be dropped. */
function dropFolder(target: EventTarget | null): string | null {
  if (!project || !(target instanceof Element)) return null;
  const row = target.closest<HTMLElement>("#tree [data-path]");
  if (row)
    return row.dataset.dir === "true"
      ? row.dataset.path!
      : parentOf(row.dataset.path!);
  return target.closest(".files") &&
    !target.closest("#list, #list-empty, .files > .section:first-child")
    ? project.root
    : null;
}

/** Shows which folder a drop goes into: its row, and the rows inside it. */
function markDropFolder(dir: string | null) {
  for (const row of els.tree.querySelectorAll<HTMLElement>(".drop-into"))
    row.classList.remove("drop-into");
  els.tree.classList.toggle("drop-root", !!project && dir === project.root);
  if (!dir || dir === project?.root) return;
  for (const row of els.tree.querySelectorAll<HTMLElement>("[data-path]")) {
    if (isInside(row.dataset.path!, dir)) row.classList.add("drop-into");
  }
}

/** Moves files and folders into `dir`, keeping their tabs open on the new paths. */
async function moveInto(paths: string[], dir: string) {
  const moving = paths.filter((p) => parentOf(p) !== dir && !isInside(dir, p));
  if (!moving.length) return;
  const tabsIn = (p: string) =>
    tabOrder.filter((id) => {
      const at = docs.get(id)?.hint ?? views.get(id)?.hint;
      return !!at && id.startsWith("file:") && isInside(at, p);
    });
  const unsaved = moving
    .flatMap(tabsIn)
    .map((id) => docs.get(id))
    .filter((d): d is Doc => !!d && isDirty(d));
  if (unsaved.length) {
    setMessage(
      `Save ${unsaved.map((d) => d.label).join(", ")} before moving ${unsaved.length === 1 ? "it" : "them"}.`,
    );
    return;
  }
  const moved: string[] = [];
  for (const from of moving) {
    const to = joinPath(dir, baseName(from));
    try {
      await fs.movePath(from, to);
    } catch (err) {
      setMessage(
        `Could not move ${baseName(from)}: ${err instanceof Error ? err.message : err}`,
      );
      continue;
    }
    moved.push(from);
    // Its tabs open again from where it is now, in the same places, and the tab that was showing stays showing.
    let showing = active;
    for (const id of tabsIn(from)) {
      const now = to + id.slice(5).slice(from.length),
        nowId = fileId(now);
      const at = tabOrder.indexOf(id);
      closeTab(id);
      await openFile({ name: baseName(now), path: now, isDir: false });
      tabOrder = tabOrder.filter((t) => t !== nowId);
      tabOrder.splice(at, 0, nowId);
      if (showing === id) showing = nowId;
    }
    if (
      showing &&
      showing !== active &&
      (docs.has(showing) || views.has(showing))
    )
      activate(showing);
    if (targetDir && isInside(targetDir, from))
      targetDir = to + targetDir.slice(from.length);
    for (const key of [...dirCache.keys()])
      if (isInside(key, from)) dirCache.delete(key);
    for (const key of [...expanded])
      if (isInside(key, from)) {
        expanded.delete(key);
        expanded.add(to + key.slice(from.length));
      }
  }
  if (!moved.length) return;
  for (const folder of new Set([dir, ...moved.map(parentOf)]))
    dirCache.set(folder, await fs.readDir(folder).catch(() => [] as Entry[]));
  if (dir !== project?.root) expanded.add(dir);
  renderTree();
  refresh();
  void scm.refresh();
  setMessage(
    `Moved ${moved.length === 1 ? baseName(moved[0]) : `${moved.length} items`} to ${baseName(dir)}`,
  );
}

/** Everything in a drop from outside: files, and folders with what's in them, by path inside the drop. */
async function droppedFiles(
  data: DataTransfer,
): Promise<{ path: string; file: File | null }[]> {
  type FsEntry = {
    isFile: boolean;
    isDirectory: boolean;
    name: string;
    file?(ok: (f: File) => void, fail: (e: unknown) => void): void;
    createReader?(): {
      readEntries(ok: (e: FsEntry[]) => void, fail: (e: unknown) => void): void;
    };
  };
  const entries = [...data.items].map(
    (i) =>
      (
        i as DataTransferItem & { webkitGetAsEntry?(): FsEntry | null }
      ).webkitGetAsEntry?.() ?? null,
  );
  if (!entries.some(Boolean))
    return [...data.files].map((file) => ({ path: file.name, file }));
  const out: { path: string; file: File | null }[] = [];
  const walk = async (entry: FsEntry, at: string): Promise<void> => {
    const path = at ? `${at}/${entry.name}` : entry.name;
    if (entry.isFile) {
      out.push({
        path,
        file: await new Promise<File>((ok, fail) => entry.file!(ok, fail)),
      });
      return;
    }
    out.push({ path, file: null });
    const reader = entry.createReader!();
    // Readers hand out a folder's entries a batch at a time, then an empty batch.
    for (;;) {
      const batch = await new Promise<FsEntry[]>((ok, fail) =>
        reader.readEntries(ok, fail),
      );
      if (!batch.length) break;
      for (const child of batch) await walk(child, path);
    }
  };
  for (const entry of entries) if (entry) await walk(entry, "");
  return out;
}

/** Copies files and folders dropped from outside into `dir`. */
async function copyInto(data: DataTransfer, dir: string) {
  const items = await droppedFiles(data);
  if (!items.length) return;
  const tops = [...new Set(items.map((i) => i.path.split("/")[0]))];
  const clash = tops.filter((name) =>
    (dirCache.get(dir) ?? []).some(
      (e) => e.name.toLowerCase() === name.toLowerCase(),
    ),
  );
  if (
    clash.length &&
    !confirm(
      `${clash.join(", ")} already ${clash.length === 1 ? "exists" : "exist"} in ${baseName(dir)}. Replace ${clash.length === 1 ? "it" : "them"}?`,
    )
  )
    return;
  try {
    for (const item of items) {
      const to = joinPath(dir, item.path);
      if (item.file)
        await fs.writeBinary(to, new Uint8Array(await item.file.arrayBuffer()));
      else await fs.createDir(to);
    }
  } catch (err) {
    setMessage(
      `Could not copy everything in: ${err instanceof Error ? err.message : err}`,
    );
  }
  for (const key of [...dirCache.keys()])
    if (isInside(key, dir))
      dirCache.set(key, await fs.readDir(key).catch(() => [] as Entry[]));
  if (dir !== project?.root) expanded.add(dir);
  renderTree();
  void scm.refresh();
  setMessage(
    `Copied ${tops.length === 1 ? tops[0] : `${tops.length} items`} into ${baseName(dir)}`,
  );
}

/** Opens a file dropped from outside TIde in a tab. Saving it asks where. */
async function openDropped(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entry: Entry = {
    name: file.name,
    path: `${DROPPED}${++droppedCount}/${file.name}`,
    isDir: false,
  };
  if (SEND_TYPES.includes(extOf(file.name)))
    return openView(await tiFileView(entry, bytes));
  const found = detect(
    bytes,
    encodingByKey(settings().fallbackEncoding) ?? ENCODINGS[4],
  );
  if (!found) return openView(unsupportedView(entry, bytes));
  openText(entry, found.text, found.encoding);
}

function setUpDragging() {
  const files = document.querySelector<HTMLElement>("#pane-files .files")!;
  const fromTree = (e: DragEvent) =>
    e.dataTransfer?.types.includes(TREE_DRAG) ?? false;
  const fromOutside = (e: DragEvent) =>
    !fromTree(e) && (e.dataTransfer?.types.includes("Files") ?? false);
  let dragged: string[] = [];

  files.addEventListener("dragstart", (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>(
      "#tree [data-path]",
    );
    if (!row || !e.dataTransfer) return;
    dragged = [row.dataset.path!];
    e.dataTransfer.setData(TREE_DRAG, dragged.join("\n"));
    e.dataTransfer.setData("text/plain", dragged.join("\n"));
    e.dataTransfer.effectAllowed = "copyMove";
    row.classList.add("dragging");
  });
  files.addEventListener("dragend", () => {
    dragged = [];
    markDropFolder(null);
    for (const row of els.tree.querySelectorAll(".dragging"))
      row.classList.remove("dragging");
  });
  // Hovering a closed folder for a moment opens it, so a drag can go deeper.
  let hover: { dir: string; timer: number } | null = null;
  files.addEventListener("dragover", (e) => {
    if (!fromTree(e) && !fromOutside(e)) return;
    const dir = dropFolder(e.target);
    const ok =
      !!dir &&
      (fromOutside(e) ||
        !dragged.some((p) => isInside(dir, p) || parentOf(p) === dir));
    markDropFolder(ok ? dir : null);
    if (!ok) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = fromTree(e) ? "move" : "copy";
    const row = (e.target as HTMLElement).closest<HTMLElement>(
      "#tree [data-path]",
    );
    const closed =
      row?.dataset.dir === "true" && !expanded.has(row.dataset.path!)
        ? row.dataset.path!
        : null;
    if (hover?.dir !== closed) {
      if (hover) window.clearTimeout(hover.timer);
      hover = closed
        ? {
            dir: closed,
            timer: window.setTimeout(
              () =>
                void toggleDir({
                  name: baseName(closed),
                  path: closed,
                  isDir: true,
                }),
              700,
            ),
          }
        : null;
    }
  });
  files.addEventListener("dragleave", (e) => {
    if (files.contains(e.relatedTarget as Node | null)) return;
    markDropFolder(null);
    if (hover) {
      window.clearTimeout(hover.timer);
      hover = null;
    }
  });
  files.addEventListener("drop", (e) => {
    const dir = dropFolder(e.target);
    markDropFolder(null);
    if (hover) {
      window.clearTimeout(hover.timer);
      hover = null;
    }
    if (!dir || !e.dataTransfer) return;
    e.preventDefault();
    e.stopPropagation();
    if (fromTree(e))
      void moveInto(
        e.dataTransfer.getData(TREE_DRAG).split("\n").filter(Boolean),
        dir,
      );
    else if (fromOutside(e)) void copyInto(e.dataTransfer, dir);
  });

  // The editor opens what's dropped on it.
  const stage = document.querySelector<HTMLElement>(".stage")!;
  stage.addEventListener("dragover", (e) => {
    if (!fromTree(e) && !fromOutside(e)) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = fromTree(e) ? "link" : "copy";
    stage.classList.add("drop-open");
  });
  stage.addEventListener("dragleave", (e) => {
    if (!stage.contains(e.relatedTarget as Node | null))
      stage.classList.remove("drop-open");
  });
  stage.addEventListener("drop", (e) => {
    stage.classList.remove("drop-open");
    if (!e.dataTransfer) return;
    e.preventDefault();
    if (fromTree(e)) {
      for (const path of e.dataTransfer
        .getData(TREE_DRAG)
        .split("\n")
        .filter(Boolean)) {
        const entry = [...dirCache.values()]
          .flat()
          .find((x) => x.path === path);
        if (entry?.isDir) void toggleDir(entry);
        else void openFile({ name: baseName(path), path, isDir: false });
      }
    } else {
      for (const file of [...e.dataTransfer.files].filter(
        (f) => !/\.tideex$/i.test(f.name),
      )) {
        void openDropped(file).catch((err) =>
          setMessage(`Can't open ${file.name}: ${err}`),
        );
      }
    }
  });
  stage.addEventListener("dragend", () => stage.classList.remove("drop-open"));
  document.addEventListener("dragend", () =>
    stage.classList.remove("drop-open"),
  );

  // Files dropped anywhere else must not replace the page with themselves.
  window.addEventListener("dragover", (e) => {
    if (fromOutside(e)) e.preventDefault();
  });
  window.addEventListener(
    "drop",
    (e) => {
      if (!e.dataTransfer?.files.length) return;
      e.preventDefault();
      // .TIdeex files install wherever they're dropped, except into the Explorer, which copies them.
      if (
        fs.desktop &&
        !(e.target instanceof Element && e.target.closest("#pane-files .files"))
      ) {
        for (const file of [...e.dataTransfer.files].filter((f) =>
          /\.tideex$/i.test(f.name),
        )) {
          void file
            .arrayBuffer()
            .then((b) =>
              extensionsView.install({
                name: file.name,
                bytes: new Uint8Array(b),
              }),
            );
        }
      }
    },
    true,
  );
}

/** Delete items for the Explorer menu: one that Shift turns permanent, or both, by the setting. */
function deleteItems(path: string, isDir: boolean): MenuItem[] {
  const trash = {
    label: "Delete",
    shortcut: "Delete",
    run: () => void deleteEntry(path, isDir, false),
  };
  const permanent = {
    label: "Delete permanently",
    shortcut: "Shift+Delete",
    run: () => void deleteEntry(path, isDir, true),
  };
  // A browser has no Recycle Bin: the web version's one Delete deletes for good, and says so.
  if (fs.web) return [{ ...permanent, label: "Delete…", shortcut: "Delete" }];
  return settings().shiftDeletes
    ? [{ ...trash, shift: permanent }]
    : [trash, permanent];
}

/** Menu items for a folder: the project's root or one inside it. */
function folderItems(path: string, isRoot: boolean): MenuItem[] {
  return [
    ...(isRoot
      ? []
      : [
          {
            label: expanded.has(path) ? "Collapse" : "Expand",
            run: () =>
              void toggleDir({ name: baseName(path), path, isDir: true }),
          },
        ]),
    { label: "New file…", run: () => void createIn(path, "file") },
    { label: "New folder…", run: () => void createIn(path, "folder") },
    "-",
    { label: "Copy path", run: () => void copy(path, "path") },
    {
      label: "Copy name",
      run: () => void copy(baseName(path), baseName(path)),
    },
    "-",
    {
      label: "Refresh",
      run: refreshWorkspace,
    },
    ...(isRoot ? [] : ["-" as const, ...deleteItems(path, true)]),
    ...(isRoot
      ? [
          "-" as const,
          {
            label: "Project settings (.tide/tide.json)",
            run: () => void openProjectFile(),
          },
          {
            label: "Open another folder…",
            shortcut: "Ctrl+Shift+O",
            run: () => void openFolder(),
          },
        ]
      : []),
  ];
}

/** What the menu offers depends on what was right-clicked. */
function menuFor(target: HTMLElement): MenuItem[] | null {
  const wsFolder = target.closest<HTMLElement>("[data-ws-folder]")?.dataset.wsFolder;
  if (wsFolder) {
    const isActive = !!project && samePath(project.root) === samePath(wsFolder);
    return [
      {
        label: "Make active folder",
        disabled: isActive,
        run: () => void useFolder(wsFolder),
      },
      ...(fs.desktop
        ? [{ label: "Open in new window", run: () => void newWindow({ folder: wsFolder }) }]
        : []),
      { label: "Remove from workspace", run: () => void removeFromWorkspace(wsFolder) },
      "-",
      ...folderItems(wsFolder, true).filter(
        (i) => i === "-" || !/^(Project settings|Open another folder)/.test(i.label),
      ),
    ];
  }
  const program =
    target.closest<HTMLElement>("[data-program]")?.dataset.program;
  if (program) {
    return [
      { label: "Open", run: () => void openProgram(program) },
      {
        label: "Run in calculator",
        shortcut: "F5",
        disabled: !fs.available,
        run: () => void openProgram(program).then(runInEmulator),
      },
      {
        label: "Build .8xp",
        shortcut: "Ctrl+E",
        run: () => void openProgram(program).then(() => exportActive()),
      },
      "-",
      { label: "Copy name", run: () => void copy(program, program) },
      "-",
      { label: "Delete…", run: () => void deleteProgram(program) },
    ];
  }
  // The project's root folder: its header, or empty space below the tree.
  if (
    project &&
    target.closest(".project-head, #tree-empty, .files") &&
    !target.closest("[data-path], [data-program], #list, #open-folder")
  ) {
    return folderItems(project.root, true);
  }
  const row = target.closest<HTMLElement>("[data-path]");
  if (row?.dataset.dir === "true") return folderItems(row.dataset.path!, false);
  if (row) {
    const path = row.dataset.path!,
      name = baseName(path),
      isDir = row.dataset.dir === "true";
    const entry: Entry = { name, path, isDir };
    const tiFile = !isDir && SEND_TYPES.includes(extOf(name));
    return [
      isDir
        ? {
            label: expanded.has(path) ? "Collapse" : "Expand",
            run: () => void toggleDir(entry),
          }
        : { label: "Open", run: () => void openFile(entry) },
      ...(tiFile
        ? [
            {
              label: "Send to calculator",
              run: () => void sendPath(path, name),
            },
          ]
        : []),
      "-",
      { label: "Copy path", run: () => void copy(path, "path") },
      { label: "Copy name", run: () => void copy(name, name) },
      "-",
      {
        label: "Refresh",
        run: () => void (project && loadProject(project.root, false)),
      },
      "-",
      ...deleteItems(path, isDir),
    ];
  }
  const tab = target.closest<HTMLElement>("[data-tab]")?.dataset.tab;
  if (tab) {
    const path = docs.get(tab)?.hint ?? views.get(tab)?.hint;
    return [
      { label: "Close", shortcut: "Ctrl+W", run: () => closeTab(tab) },
      {
        label: "Close others",
        disabled: tabOrder.length < 2,
        run: () => closeOthers(tab),
      },
      {
        label: "Close to the right",
        disabled: tabOrder.indexOf(tab) === tabOrder.length - 1,
        run: () => closeOthers(tab, true),
      },
      {
        label: "Close all",
        run: () => {
          for (const id of [...tabOrder]) closeTab(id);
        },
      },
      ...(path
        ? [
            "-" as const,
            { label: "Copy path", run: () => void copy(path, "path") },
          ]
        : []),
    ];
  }
  if (target.closest("#calc-lcd")) {
    return [
      { label: "Send files…", run: () => $("calc-send").click() },
      {
        label: "Copy screenshot",
        run: () => {
          $<HTMLCanvasElement>("calc-lcd").toBlob((blob) => {
            if (!blob) return;
            navigator.clipboard
              .write([new ClipboardItem({ "image/png": blob })])
              .then(
                () => setMessage("Copied the screen"),
                () => setMessage("Couldn't copy to the clipboard."),
              );
          });
        },
      },
      { label: "Show console", run: () => panel.show("console") },
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
  const act = (id: string) => () => {
    editor.focus();
    void editor.getAction(id)?.run();
  };
  const word = position
    ? doc.model.getWordAtPosition(position)?.word
    : undefined;
  const lang = catalogLang();
  const hasDocs =
    !!word &&
    !!lang &&
    DOCS.find((d) => d.id === lang)!.groups.some((g) =>
      g.entries.some((e) => e.name === word || e.name === `${word}(`),
    );
  const selection = !editor.getSelection()?.isEmpty();
  return [
    {
      label: "Cut",
      shortcut: "Ctrl+X",
      disabled: !selection,
      run: act("editor.action.clipboardCutAction"),
    },
    {
      label: "Copy",
      shortcut: "Ctrl+C",
      disabled: !selection,
      run: act("editor.action.clipboardCopyAction"),
    },
    {
      label: "Paste",
      shortcut: "Ctrl+V",
      run: () => {
        navigator.clipboard.readText().then(
          (text) => {
            editor.focus();
            editor.trigger("menu", "type", { text });
          },
          () => setMessage("Couldn't read the clipboard."),
        );
      },
    },
    {
      label: "Select all",
      shortcut: "Ctrl+A",
      run: act("editor.action.selectAll"),
    },
    "-",
    {
      label: "Toggle comment",
      shortcut: "Ctrl+/",
      run: act("editor.action.commentLine"),
    },
    {
      label: "Format document",
      shortcut: "Shift+Alt+F",
      disabled: !["tibasic", "c", "cpp", "python", ASM_LANG].includes(
        doc.language,
      ),
      run: act("editor.action.formatDocument"),
    },
    ...(doc.language === "tibasic"
      ? [
          {
            label: "Go to label",
            shortcut: "F12",
            run: act("editor.action.revealDefinition"),
          },
        ]
      : []),
    ...(hasDocs
      ? [
          {
            label: `Docs for ${word}`,
            run: () => {
              const name = DOCS.find((d) => d.id === lang)!
                .groups.flatMap((g) => g.entries)
                .find((e) => e.name === word || e.name === `${word}(`)!.name;
              openDocs(name);
            },
          },
        ]
      : []),
    "-",
    {
      label: "Run in calculator",
      shortcut: "F5",
      disabled: els.run.hidden,
      run: () => void runInEmulator(),
    },
    {
      label: buildLabel(),
      shortcut: "Ctrl+E",
      disabled: els.exportBtn.hidden,
      run: () => void exportActive(),
    },
    "-",
    ...extensionItems(),
  ];
}

/** Menu items for the commands extensions added. One that fails says so in the status bar. */
/** The open project's calculator and language, for which extension commands show. Null with no folder open. */
function commandContext(): CommandContext {
  if (!project) return null;
  const calculator: Target = isTarget(config.calculator) ? config.calculator : getTarget();
  return { calculator, ...(config.language ? { language: config.language } : {}) };
}
/** Extension commands for the menus: those for the open project, or with no folder open, those for no project. */
function extensionItems(): MenuItem[] {
  const at = commandContext();
  return extensionCommands().filter((c) => commandApplies(c, at)).map((c) => ({
    label: c.label,
    shortcut: c.shortcut,
    run: () => {
      Promise.resolve()
        .then(c.run)
        .catch((err) =>
          setMessage(
            `${c.label} failed: ${err instanceof Error ? err.message : err}`,
          ),
        );
    },
  }));
}

// Every right-click gets TIde's menu or none; text boxes keep their own (for spelling and paste).
document.addEventListener("contextmenu", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest("input, textarea, select, .monaco-editor")) {
    if (!target.closest(".monaco-editor")) return;
  }
  e.preventDefault();
  if (target.closest(".monaco-editor")) return; // the editor shows its own, below
  const items = menuFor(target);
  if (items) showMenu(e.clientX, e.clientY, items);
});
editor.onContextMenu((e) => {
  e.event.preventDefault();
  if (e.target.position) {
    const selection = editor.getSelection();
    if (!selection || !selection.containsPosition(e.target.position))
      editor.setPosition(e.target.position);
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
els.problems.addEventListener("click", () => {
  editor.focus();
  void editor.getAction("editor.action.marker.next")?.run();
});
els.exportBtn.addEventListener("click", () => void exportActive());
els.run.addEventListener("click", () => void runInEmulator());
// F5 runs, as in most IDEs. It also stops the webview from reloading the page.
window.addEventListener("keydown", (e) => {
  if (e.key !== "F5") return;
  e.preventDefault();
  if (!els.run.hidden) void runInEmulator();
});
$("act-files").addEventListener("click", () => showPane("files", true));
$("act-docs").addEventListener("click", () => showPane("docs", true));
$("act-scm").addEventListener("click", () => showPane("scm", true));
$("act-ext").addEventListener("click", () => showPane("ext", true));
$("act-calc").addEventListener(
  "click",
  () =>
    void (active === CALC_TAB
      ? closeTab(CALC_TAB)
      : views.has(CALC_TAB)
        ? activate(CALC_TAB)
        : calc.show()),
);
$("calc-cemu").addEventListener("click", () => void runInCemu());
$("status-branch").addEventListener("click", () => showPane("scm"));
window.addEventListener("focus", () => {
  if (settings().refreshScmOnFocus) void scm.refresh();
}); // files may have changed outside TIde
els.openFolder.addEventListener("click", () => void openFolder());
$("new-file").addEventListener(
  "click",
  () => void (project && createIn(targetDir ?? project.root, "file")),
);
$("new-folder").addEventListener(
  "click",
  () => void (project && createIn(targetDir ?? project.root, "folder")),
);
// ── The menu bar: File, Edit, View, Run, Calculator and Help across the top ──
/** Opens a web page in your browser. */
const openLink = (url: string) => {
  if (fs.desktop) void import("@tauri-apps/plugin-opener").then((o) => o.openUrl(url));
  else window.open(url, "_blank", "noopener");
};
const REPO = "https://github.com/XSamuraiCoder/TIde";
/** Runs one of the editor's own commands on the open file. */
const editorDoes = (command: string) => () => {
  editor.focus();
  editor.trigger("menu", command, null);
};

function fileMenu(): MenuItem[] {
  const doc = activeDoc();
  return [
    {
      label: "New program…",
      shortcut: "Ctrl+N",
      run: () => {
        showPane("files");
        els.find.focus();
      },
    },
    {
      label: "New file…",
      disabled: !project,
      run: () => void (project && createIn(targetDir ?? project.root, "file")),
    },
    {
      label: "New folder…",
      disabled: !project,
      run: () =>
        void (project && createIn(targetDir ?? project.root, "folder")),
    },
    ...(fs.desktop
      ? [
          "-" as const,
          { label: "New window", shortcut: "Ctrl+Shift+N", run: () => void newWindow() },
        ]
      : []),
    "-",
    {
      label: "Open folder…",
      shortcut: "Ctrl+Shift+O",
      run: () => void openFolder(),
    },
    ...(fs.desktop
      ? [{ label: "Open folder in new window…", run: () => void openFolderInNewWindow() }]
      : []),
    ...(fs.web
      ? [
          {
            label: "Open browser project…",
            run: () => void openBrowserProject(),
          },
        ]
      : []),
    "-",
    {
      label: "Add folder to workspace…",
      disabled: !fs.available,
      run: () => void addFolderToWorkspace(),
    },
    ...(fs.desktop
      ? [
          { label: "Open workspace…", run: () => void openWorkspace() },
          {
            label: workspace.file ? "Save workspace as…" : "Save workspace…",
            disabled: !workspace.folders.length,
            run: () => void saveWorkspaceAs(),
          },
        ]
      : []),
    "-",
    {
      label: "Save",
      shortcut: "Ctrl+S",
      disabled: !doc,
      run: () => void saveActive(),
    },
    {
      label: "Save all",
      disabled: ![...docs.values()].some(isDirty),
      run: () => {
        for (const d of docs.values()) if (isDirty(d)) void saveDoc(d);
      },
    },
    {
      label: "Reload from disk",
      disabled: !doc?.id.startsWith("file:") || !doc.encoding,
      run: () => {
        if (!doc) return;
        if (
          isDirty(doc) &&
          !confirm(
            `Reload ${doc.label} from disk? Your unsaved changes in it are lost.`,
          )
        )
          return;
        void reloadFromDisk(doc, true);
      },
    },
    {
      label: "Auto save",
      checked: settings().autoSave,
      run: () => {
        const on = !settings().autoSave;
        setSetting("autoSave", on);
        if (
          projectSettings().autoSave !== undefined &&
          projectSettings().autoSave !== on
        )
          setMessage(
            `This project's tide.json turns auto save ${projectSettings().autoSave ? "on" : "off"}, which wins while it's open.`,
          );
        else setMessage(on ? "Auto save is on" : "Auto save is off");
        if (settings().autoSave) autoSaveAll();
      },
    },
    "-",
    {
      label: "Project settings (.tide/tide.json)",
      disabled: !project,
      run: () => void openProjectFile(),
    },
    { label: "Settings", shortcut: "Ctrl+,", run: openSettings },
    "-",
    {
      label: "Close tab",
      shortcut: "Ctrl+W",
      disabled: !active,
      run: () => {
        if (active) closeTab(active);
      },
    },
    {
      label: "Close all tabs",
      disabled: !tabOrder.length,
      run: () => {
        for (const id of [...tabOrder]) closeTab(id);
      },
    },
    {
      label: workspace.folders.length > 1 ? "Close workspace" : "Close folder",
      disabled: !project,
      run: closeFolder,
    },
  ];
}

function editMenu(): MenuItem[] {
  const none = !activeDoc() || active === CALC_TAB;
  return [
    { label: "Undo", shortcut: "Ctrl+Z", disabled: none, run: editorDoes("undo") },
    { label: "Redo", shortcut: "Ctrl+Y", disabled: none, run: editorDoes("redo") },
    "-",
    { label: "Cut", shortcut: "Ctrl+X", disabled: none, run: editorDoes("editor.action.clipboardCutAction") },
    { label: "Copy", shortcut: "Ctrl+C", disabled: none, run: editorDoes("editor.action.clipboardCopyAction") },
    {
      label: "Paste",
      shortcut: "Ctrl+V",
      disabled: none,
      // The editor's own paste needs the keyboard; from a menu, the clipboard is read and typed in.
      run: () =>
        void navigator.clipboard
          .readText()
          .then((text) => {
            editor.focus();
            editor.trigger("menu", "type", { text });
          })
          .catch(() => setMessage(keys("TIde can't read the clipboard from the menu here: press Ctrl+V."))),
    },
    "-",
    { label: "Find", shortcut: "Ctrl+F", disabled: none, run: editorDoes("actions.find") },
    { label: "Replace", shortcut: "Ctrl+H", disabled: none, run: editorDoes("editor.action.startFindReplaceAction") },
    { label: "Go to line…", shortcut: "Ctrl+G", disabled: none, run: editorDoes("editor.action.gotoLine") },
    "-",
    { label: "Select all", shortcut: "Ctrl+A", disabled: none, run: editorDoes("editor.action.selectAll") },
    { label: "Toggle comment", shortcut: "Ctrl+/", disabled: none, run: editorDoes("editor.action.commentLine") },
    "-",
    { label: "Command palette…", shortcut: "F1", disabled: none, run: editorDoes("editor.action.quickCommand") },
  ];
}

function viewMenu(): MenuItem[] {
  const s = settings();
  const sideShown = !app.classList.contains("no-side");
  return [
    { label: "Explorer", run: () => showPane("files") },
    ...(fs.desktop ? [{ label: "Source Control", shortcut: "Ctrl+Shift+G", run: () => showPane("scm") }] : []),
    { label: "Docs", shortcut: "Ctrl+Shift+J", run: () => showPane("docs") },
    { label: "Extensions", shortcut: "Ctrl+Shift+X", run: () => showPane("ext") },
    { label: "Side bar", shortcut: "Ctrl+B", checked: sideShown, run: () => showPane(pane, true) },
    "-",
    ...(fs.desktop
      ? [{ label: "Terminal", shortcut: "Ctrl+`", run: () => panel.show("terminal", true) }]
      : []),
    {
      label: "Output",
      shortcut: "Ctrl+Shift+U",
      run: () => panel.show("output"),
    },
    "-",
    { label: "Word wrap", checked: s.wordWrap, run: () => setSetting("wordWrap", !s.wordWrap) },
    { label: "Minimap", checked: s.minimap, run: () => setSetting("minimap", !s.minimap) },
    { label: "Line numbers", checked: showNumbers, run: () => setGutter(!showNumbers) },
    "-",
    {
      label: "Light mode",
      checked: isLight(),
      run: () => {
        setSetting("theme", isLight() ? "dark" : "light");
        if (projectSettings().theme)
          setMessage(
            `This project's tide.json sets the ${projectSettings().theme} theme, which wins while it's open.`,
          );
      },
    },
  ];
}

function runMenu(): MenuItem[] {
  const doc = activeDoc();
  const extra = extensionItems();
  return [
    {
      label: buildLabel(),
      shortcut: "Ctrl+E",
      disabled: els.exportBtn.hidden,
      run: () => void exportActive(),
    },
    {
      label: "Build to…",
      shortcut: "Ctrl+Shift+E",
      disabled:
        !doc ||
        usesMake() ||
        (doc.language !== "tibasic" && !nspireScript(doc)),
      run: () => void exportActive(true),
    },
    {
      label: "Run in calculator",
      shortcut: "F5",
      disabled: els.run.hidden,
      run: () => void runInEmulator(),
    },
    // tide.json's scripts, as the status bar's list has them.
    ...[...els.scripts.options]
      .filter((o) => o.value)
      .map((o, i) => ({ label: `Script: ${o.textContent ?? o.value}`, run: () => void runScript(o.value), first: i === 0 }))
      .flatMap(({ first, ...item }) => (first ? ["-" as const, item] : [item])),
    ...(extra.length ? ["-" as const, ...extra] : []),
  ];
}

function calculatorMenu(): MenuItem[] {
  return [
    { label: "Show calculator", run: () => void calc.show() },
    {
      label: "Send files to calculator…",
      run: () => {
        void calc.show().then(() => $("calc-send").click());
      },
    },
    "-",
    { label: "Connect a calculator…", run: () => void calc.connectReal() },
    { label: "Serial cable…", run: () => openSerialTab() },
  ];
}

function helpMenu(): MenuItem[] {
  return [
    { label: "Docs for this language", shortcut: "Ctrl+Shift+J", run: () => openDocs() },
    { label: "Writing extensions", run: () => openLink("https://xsamuraicoder.github.io/TIde/docs/") },
    "-",
    { label: "Release notes", run: () => openLink(`${REPO}/releases`) },
    { label: "Report a problem…", run: () => openLink(`${REPO}/issues/new`) },
    ...(fs.desktop
      ? [
          "-" as const,
          { label: "Check for updates…", run: () => $("version").click() },
        ]
      : []),
  ];
}

/** The menu bar: a click opens a menu, hovering another name while one is open switches to it, and
 * the arrow keys move between them. */
function setUpMenubar() {
  const menus: [label: string, items: () => MenuItem[]][] = [
    ["File", fileMenu],
    ["Edit", editMenu],
    ["View", viewMenu],
    ["Run", runMenu],
    ["Calculator", calculatorMenu],
    ["Help", helpMenu],
  ];
  const bar = $("menubar");
  let openAt = -1;
  let closedAt = { index: -1, time: 0 };
  const buttons = menus.map(([label], i) => {
    const b = h("button", { type: "button", className: "menubar-item", role: "menuitem" }, label);
    b.setAttribute("aria-haspopup", "menu");
    b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", () => {
      // The click that closed this menu (on pointerdown) doesn't open it again.
      if (closedAt.index === i && performance.now() - closedAt.time < 400) return;
      show(i);
    });
    b.addEventListener("pointerenter", () => {
      if (openAt !== -1 && openAt !== i && menuIsOpen()) show(i);
    });
    return b;
  });
  bar.prepend(...buttons);
  function show(i: number) {
    const r = buttons[i].getBoundingClientRect();
    if (openAt !== -1) buttons[openAt].setAttribute("aria-expanded", "false");
    openAt = -1; // showMenu closes the one open first, which mustn't count as this one closing
    showMenu(r.left, r.bottom, menus[i][1](), () => {
      buttons[i].setAttribute("aria-expanded", "false");
      closedAt = { index: i, time: performance.now() };
      if (openAt === i) openAt = -1;
    });
    openAt = i;
    buttons[i].setAttribute("aria-expanded", "true");
  }
  document.addEventListener("keydown", (e) => {
    if (openAt === -1 || !menuIsOpen() || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    show((openAt + (e.key === "ArrowRight" ? 1 : menus.length - 1)) % menus.length);
  }, true);
}
setUpMenubar();
els.gutter.addEventListener("click", () => setGutter(!showNumbers));
els.encoding.addEventListener("change", () => {
  const [action, key] = els.encoding.value.split(":");
  const encoding = encodingByKey(key);
  if (encoding)
    void (action === "reopen" ? reopenWith(encoding) : saveWith(encoding));
});
$("act-settings").addEventListener("click", openSettings);
els.scripts.addEventListener("change", () => {
  const name = els.scripts.value;
  els.scripts.value = "";
  if (name) void runScript(name);
});
onSettingsChange((s) => {
  editor.updateOptions({
    fontSize: s.fontSize,
    lineHeight: Math.round(s.fontSize * 1.7),
    wordWrap: s.wordWrap ? "on" : "off",
    minimap: { enabled: s.minimap },
    renderWhitespace: s.renderWhitespace,
    fontLigatures: s.fontLigatures,
  });
  void applyFonts(s, editor);
  for (const doc of docs.values())
    applyIndentation(doc.model, doc.label, doc.language, s.tabSize);
  applyEditorMode();
  emit("settings", s);
});
onTargetChange(() => {
  applyEditorMode();
  refreshSettingsPage();
  refresh();
  void checkPrograms();
  setMessage(`Target: ${TARGETS[getTarget()].name}`);
});
els.find.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  // Enter opens the first match, so finding never makes a near-duplicate. Ctrl+Enter always creates.
  const query = els.find.value.toUpperCase();
  const match =
    query && !mod(e) ? names.find((n) => n.includes(query)) : undefined;
  const name = normalizeName(els.find.value);
  if (!match && !name)
    return setMessage(
      "Names start with a letter and use only letters and digits.",
    );
  els.find.value = "";
  void (match ? openProgram(match) : createProgram(name));
});

window.addEventListener("keydown", (e) => {
  // The terminal is Ctrl+` on macOS too, where Cmd+` switches windows.
  if (e.key === "`" && e.ctrlKey && !e.metaKey && fs.desktop) {
    e.preventDefault();
    panel.toggle("terminal");
    return;
  }
  if (!mod(e)) return;
  const key = e.key.toLowerCase(); // Caps Lock and Shift report capitals
  if (e.shiftKey && key === "o") {
    e.preventDefault();
    void openFolder();
  } else if (e.shiftKey && key === "n" && fs.desktop) {
    e.preventDefault();
    void newWindow();
  } else if (e.shiftKey && key === "e") {
    e.preventDefault();
    void exportActive(true);
  } else if (key === "s") {
    e.preventDefault();
    void saveActive();
  } else if (key === "e") {
    e.preventDefault();
    void exportActive();
  } else if (key === "w" && active) {
    e.preventDefault();
    closeTab(active);
  } else if (key === "n") {
    e.preventDefault();
    showPane("files");
    els.find.focus();
  } else if (e.shiftKey && key === "j") {
    e.preventDefault();
    if (active === DOCS_TAB) closeTab(DOCS_TAB);
    else openDocs();
  } else if (key === "j") {
    e.preventDefault();
    showPane("docs");
    els.docFind.select();
  } else if (key === "b") {
    e.preventDefault();
    showPane(pane, true);
  } else if (e.shiftKey && key === "g" && fs.desktop) {
    e.preventDefault();
    showPane("scm");
  } else if (e.shiftKey && key === "x") {
    e.preventDefault();
    showPane("ext");
  } else if (e.shiftKey && key === "u") {
    e.preventDefault();
    panel.toggle("output");
  } else if (key === ",") {
    e.preventDefault();
    openSettings();
  }
});

store
  .list()
  .then((list) => {
    names = list;
    refresh();
    checkPrograms();
  })
  .catch((err) => setMessage(`Could not load programs: ${err}`));
applyEditorMode();
showPane("files");
renderTree();

// Desktop builds check their update channel for an update; the status bar shows the version and
// checks on click. The web version has neither: its version button stays hidden.
if (fs.web) {
  // What only the desktop app has: the CEmu app, source control and the terminal.
  for (const id of ["calc-cemu", "act-scm", "panel-tab-terminal", "status-terminal", "panel-new-terminal"])
    $(id).hidden = true;
  // The nightly web version, built from every push to main at /TIde/nightly/, says so in its tab.
  setUpInstall(nightlyWeb);
}

/**
 * The web version's Install button, at the top right: TIde as an app from this browser (it's a PWA,
 * see vite.config.ts), or the desktop app. The browser offers installing when it can
 * (beforeinstallprompt, in Chrome and Edge); others install from their own menu, and the button
 * says how. Hidden once TIde runs as an installed app.
 */
function setUpInstall(nightly: boolean) {
  type InstallPrompt = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
  let offer: InstallPrompt | null = null;
  const name = nightly ? "TIde Nightly" : "TIde";
  const button = h("button", { type: "button", id: "install-app", className: "install-app", title: `Install ${name}` },
    h("span", { ariaHidden: "true" }, "⤓"), "Install");
  $("menubar").append(button); // at the menu bar's right end
  const installed = () => matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches;
  button.hidden = installed();
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // the button offers it instead of the browser's own bar
    offer = e as InstallPrompt;
  });
  window.addEventListener("appinstalled", () => {
    button.hidden = true;
    offer = null;
    setMessage(`Installed ${name}: it opens from your apps, and offline too.`);
  });
  const howTo = () => {
    const ua = navigator.userAgent;
    if (/Firefox\//.test(ua)) return "Firefox can't install sites as apps. Open TIde in Chrome or Edge to install it, or get the desktop app.";
    if (/Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua))
      return /iPhone|iPad/.test(ua) ? "In Safari, tap Share, then Add to Home Screen." : "In Safari, choose File → Add to Dock.";
    return "Use your browser's menu: Install TIde (or Apps → Install this site as an app).";
  };
  button.addEventListener("click", () => {
    const r = button.getBoundingClientRect();
    showMenu(r.right, r.bottom + 2, [
      {
        label: `Install ${name} in this browser`,
        run: () => {
          if (!offer) return setMessage(howTo());
          const asked = offer;
          offer = null; // a prompt can be shown only once
          void asked.prompt().then(() => asked.userChoice).then((choice) => {
            if (choice.outcome !== "accepted") setMessage("Not installed. The Install button can ask again after the page reloads.");
          });
        },
      },
      {
        label: "Download the desktop app",
        run: () => window.open("https://github.com/XSamuraiCoder/TIde/releases/latest", "_blank", "noopener"),
      },
    ]);
  });
}
if (fs.desktop) {
  const version = $<HTMLButtonElement>("version");
  version.hidden = false;
  appVersion()
    .then((v) => {
      version.textContent = `TIde ${v}`;
    })
    .catch(() => {
      version.textContent = "TIde";
    });
  version.addEventListener("click", () => void checkForUpdate(setMessage));
  if (!import.meta.env.DEV && settings().checkUpdates)
    void checkForUpdate(setMessage, true);
}

// Extensions: TIde's own, then the installed ones. The view lists them in the side bar.
const openPath = (path: string) =>
  openFile({ name: baseName(path), path, isDir: false });
const extensionsView = createExtensionsView({
  available: fs.available,
  desktop: fs.desktop,
  say: setMessage,
  openFile: openPath,
  reveal: (path) => fs.revealExtension(path),
  pickPackage: () => fs.pickFile("TIde extension", ["tideex"]),
  pickSaveFile: (name) =>
    fs.pickSaveFile(name, { name: "TIde extension", extensions: ["tideex"] }),
  readBinary: (path) => fs.readBinary(path),
  writeBinary: (path, bytes) => fs.writeBinary(path, bytes),
  show: () => showPane("ext"),
});
// Started at once, so the built-in language support is there before any file opens.
const extensionHost: ExtensionHost = {
  version: "dev",
  extensionsDir: () =>
    fs.available ? fs.extensionsDir() : Promise.resolve(null),
  readDir: (path) => fs.readDir(path),
  readFile: (path) => fs.readFile(path),
  writeFile: (path, text) => fs.writeFile(path, text),
  readBinary: (path) => fs.readBinary(path),
  writeBinary: (path, bytes) => fs.writeBinary(path, bytes),
  remove: (path) => fs.deletePath(path, false),
  run: async (line, dir) => runLine("Extension", line, dir),
  message: setMessage,
  settings,
  project: () => {
    const at = commandContext();
    return project && at && { root: project.root, name: project.name, ...at };
  },
  openFile: openPath,
  editor: {
    file: () => {
      const d = activeDoc();
      return d
        ? {
            name: d.label,
            path: d.id.startsWith("file:") ? d.id.slice(5) : null,
            language: d.language,
          }
        : null;
    },
    text: () => activeDoc()?.model.getValue() ?? "",
    setText: (text) => {
      const d = activeDoc();
      if (d)
        d.model.pushEditOperations(
          [],
          [{ range: d.model.getFullModelRange(), text }],
          () => null,
        );
    },
    selection: () => {
      const d = activeDoc(),
        sel = editor.getSelection();
      return d && sel ? d.model.getValueInRange(sel) : "";
    },
    insert: (text) => {
      const sel = editor.getSelection();
      if (activeDoc() && sel)
        editor.executeEdits("extension", [
          { range: sel, text, forceMoveMarkers: true },
        ]);
    },
  },
  calculator: {
    show: () => calc.show(),
    macro: (name, arg) => calc.macro(name, arg ?? ""),
    family: () => calc.family(),
    send: (files) =>
      calc.send(
        files.map((f) => ({
          name: f.name,
          bytes:
            f.bytes instanceof Uint8Array ? f.bytes : new Uint8Array(f.bytes),
        })),
      ),
  },
};
// The extensions that come with TIde: the folders in extensions/, built into the app as text.
const BUNDLED: BundledExtension[] = (() => {
  const files = import.meta.glob("/extensions/*/*", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;
  const byId = new Map<string, Record<string, string>>();
  for (const [path, text] of Object.entries(files)) {
    const [, , id, name] = path.split("/");
    if (!byId.has(id)) byId.set(id, {});
    byId.get(id)![name] = text;
  }
  return [...byId].flatMap(([folder, own]) => {
    const manifest = JSON.parse(
      own["extension.json"] ?? "null",
    ) as ExtensionManifest | null;
    return manifest
      ? [{ id: manifest.id ?? folder, manifest, files: own }]
      : [];
  });
})();
const extensionsReady = loadExtensions(extensionHost, BUNDLED);
// .TIdeex files install when TIde is opened with one (double-click, or Open with), or one is dropped on
// the window. They wait for the installed extensions to load, so a newer version is seen as one.
if (fs.desktop) {
  const installOpened = () =>
    fs.takeOpenedFiles().then((paths) => {
      for (const p of paths) void extensionsView.install(p);
    });
  void extensionsReady.then(installOpened);
  import("@tauri-apps/api/event")
    .then(({ listen }) =>
      listen(
        "tide://opened-files",
        () => void extensionsReady.then(installOpened),
      ),
    )
    .catch(() => {});
  // Dropped ones install from setUpDragging's drop handler.
}
setUpDragging();
if (fs.desktop)
  appVersion()
    .then((v) => {
      extensionHost.version = v;
    })
    .catch(() => {
      /* stays "dev" */
    });

// What this window opens: what another window asked for (windows.ts), or else what was open last,
// quietly: a folder that moved or was deleted is left out, and with none left TIde starts empty.
void titleWindow(null, fs.desktop, nightlyWeb);
const start = windowStart();
if (start?.folder) void loadProject(start.folder, false).catch((err) => setMessage(`Could not open ${baseName(start.folder!)}: ${err}`));
else if (start?.workspace) void openWorkspace(start.workspace);
else if (!start?.empty && fs.available) void reopenLast();

async function reopenLast() {
  let last: { file: string | null; folders: string[]; active: string | null } | null = null;
  let lastFolder: string | null = null;
  try {
    last = JSON.parse(localStorage.getItem(WORKSPACE_PREF) ?? "null");
    lastFolder = localStorage.getItem(PROJECT_PREF);
  } catch {
    /* storage unavailable */
  }
  if (last?.file && fs.desktop) return openWorkspace(last.file);
  const folders = last && Array.isArray(last.folders) && last.folders.length > 1 ? last.folders : null;
  if (!folders) {
    if (lastFolder)
      await loadProject(lastFolder, false).catch(() => {
        project = null;
        renderTree();
      });
    return;
  }
  const opened: string[] = [];
  for (const f of folders) {
    try {
      dirCache.set(f, await fs.readDir(f));
      opened.push(f);
    } catch {
      /* moved or deleted */
    }
  }
  if (!opened.length) return;
  workspace = { file: null, folders: opened };
  const active = opened.find((f) => last!.active && samePath(f) === samePath(last!.active)) ?? opened[0];
  await useFolder(active).catch(() => undefined);
  renderTree();
}
