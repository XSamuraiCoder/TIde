import * as monaco from "monaco-editor/editor/editor.api.js";
// The bare API ships no editor widgets, so the full entry is imported for its side effects.
import "monaco-editor"; // full entry: registers suggest, hover, parameter hints, folding and marker navigation
import editorWorker from "monaco-editor/editor/editor.worker.js?worker";
import "./style.css";
import { CATALOG, estimateBytes, registerTiBasic } from "./language";
import { registerIntellisense, watchModel } from "./intellisense";
import { normalizeName, store } from "./store";

(self as unknown as { MonacoEnvironment: object }).MonacoEnvironment = { getWorker: () => new editorWorker() };

const SCREEN_COLS = 26;

interface Doc {
  name: string;
  model: monaco.editor.ITextModel;
  savedVersion: number;
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
registerIntellisense();

// The calculator shows a ":" before every line. It is a gutter, not file content, so saved programs stay clean.
const GUTTER_PREF = "tide-pref-numbers"; // must not start with "tide:" or the browser store lists it as a program
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

const isDirty = (d: Doc) => d.model.getAlternativeVersionId() !== d.savedVersion;
const activeDoc = () => (active ? docs.get(active) : undefined);

// ── Actions ────────────────────────────────────────────────────────────────

async function openProgram(name: string, note?: string) {
  if (!docs.has(name)) {
    const source = await store.load(name);
    const model = monaco.editor.createModel(source, "tibasic");
    docs.set(name, { name, model, savedVersion: model.getAlternativeVersionId() });
    model.onDidChangeContent(refresh);
    watchModel(model);
  }
  if (!tabOrder.includes(name)) tabOrder.push(name);
  active = name;
  editor.setModel(docs.get(name)!.model);
  editor.focus();
  setMessage(note ?? `Opened ${name}`);
  refresh();
}

async function createProgram(name: string) {
  if (!names.includes(name)) {
    await store.save(name, "");
    names = [...names, name].sort();
    await openProgram(name, `Created ${name}`);
  } else {
    await openProgram(name);
  }
}

async function saveActive() {
  const doc = activeDoc();
  if (!doc) return;
  try {
    await store.save(doc.name, doc.model.getValue());
    doc.savedVersion = doc.model.getAlternativeVersionId();
    setMessage(`Saved ${doc.name}`);
  } catch (err) {
    setMessage(`Could not save ${doc.name}: ${err}`);
  }
  refresh();
}

function closeTab(name: string) {
  const doc = docs.get(name);
  if (doc && isDirty(doc) && !confirm(`${name} has unsaved changes. Close without saving?`)) return;
  const index = tabOrder.indexOf(name);
  tabOrder = tabOrder.filter(n => n !== name);
  doc?.model.dispose();
  docs.delete(name);
  if (active === name) {
    active = tabOrder[Math.min(index, tabOrder.length - 1)] ?? null;
    editor.setModel(active ? docs.get(active)!.model : null);
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
  const doc = docs.get(name);
  if (doc) { doc.savedVersion = doc.model.getAlternativeVersionId(); closeTab(name); }
  setMessage(`Deleted ${name}`);
  refresh();
}

function setMessage(text: string) { els.msg.textContent = text; }

// ── Rendering ──────────────────────────────────────────────────────────────

function renderList() {
  const query = els.find.value.toUpperCase();
  const shown = names.filter(n => n.includes(query));
  els.list.replaceChildren(...shown.map(n => {
    const doc = docs.get(n);
    const row = h("li", { role: "option", tabIndex: 0 },
      h("span", { className: "name" }, n),
      ...(doc && isDirty(doc) ? [h("span", { className: "unsaved", title: "Unsaved changes" }, "●")] : []),
      h("button", { className: "del", title: `Delete ${n}`, onclick: (e: Event) => { e.stopPropagation(); void deleteProgram(n); } }, "×"),
    );
    row.setAttribute("aria-selected", String(n === active));
    row.onclick = () => void openProgram(n);
    row.onkeydown = e => { if (e.key === "Enter") void openProgram(n); };
    return row;
  }));
  els.listEmpty.hidden = shown.length > 0 || !normalizeName(query);
}

function renderTabs() {
  els.tabs.replaceChildren(...tabOrder.map(n => {
    const doc = docs.get(n)!;
    const tab = h("div", { className: "tab", role: "tab", tabIndex: 0, onclick: () => void openProgram(n) },
      n,
      ...(isDirty(doc) ? [h("span", { className: "dirty", title: "Unsaved changes" })] : []),
      h("button", { className: "close", title: `Close ${n}`, onclick: (e: Event) => { e.stopPropagation(); closeTab(n); } }, "×"),
    );
    tab.setAttribute("aria-selected", String(n === active));
    return tab;
  }));
}

const overflow = editor.createDecorationsCollection();
/** Mark text past column 25 (column 26 is taken by the ":"), which wraps on the calculator. */
function markOverflow() {
  const doc = activeDoc();
  if (!doc) { overflow.clear(); return; }
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

function renderCatalog() {
  const q = els.catFind.value.trim().toLowerCase();
  const nodes = CATALOG.flatMap(group => {
    const entries = group.entries.filter(e => !q || `${e.name} ${e.hint}`.toLowerCase().includes(q));
    if (!entries.length) return [];
    return [
      h("h3", {}, group.group),
      ...entries.map(e => h("button", { className: "item", type: "button", title: e.hint, onclick: () => insertSnippet(e.insert) },
        h("code", {}, e.name), h("span", {}, e.hint))),
    ];
  });
  els.catalog.replaceChildren(...(nodes.length ? nodes : [h("p", { className: "hint" }, "Nothing matches.")]));
}

function insertSnippet(text: string) {
  if (!activeDoc()) { setMessage("Open a program to insert commands."); return; }
  const sel = editor.getSelection();
  if (!sel) return;
  const end = new monaco.Selection(sel.startLineNumber, sel.startColumn + text.length, sel.startLineNumber, sel.startColumn + text.length);
  editor.executeEdits("catalog", [{ range: sel, text, forceMoveMarkers: true }], [end]);
  editor.focus();
  if (text.endsWith("(")) editor.trigger("catalog", "editor.action.triggerParameterHints", null);
}

function showPane(which: "programs" | "catalog") {
  for (const k of ["programs", "catalog"] as const) {
    $(`tab-${k}`).setAttribute("aria-selected", String(k === which));
    $(`pane-${k}`).hidden = k !== which;
  }
}

function applyGutter() {
  editor.updateOptions(gutterOptions());
  els.gutter.textContent = showNumbers ? "Gutter: line numbers" : "Gutter: \":\"";
  els.gutter.setAttribute("aria-pressed", String(showNumbers));
}

function renderProblems() {
  const doc = activeDoc();
  els.problems.hidden = !doc;
  if (!doc) return;
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
  els.size.textContent = doc ? `≈ ${estimateBytes(doc.model.getValue()).toLocaleString()} bytes` : "";
}

function refresh() {
  els.empty.hidden = active !== null;
  renderList();
  renderTabs();
  renderStatus();
  renderProblems();
  markOverflow();
}

// ── Wiring ─────────────────────────────────────────────────────────────────

editor.onDidChangeCursorPosition(renderStatus);
els.find.addEventListener("input", renderList);
els.catFind.addEventListener("input", renderCatalog);
monaco.editor.onDidChangeMarkers(renderProblems);
els.problems.addEventListener("click", () => { editor.focus(); void editor.getAction("editor.action.marker.next")?.run(); });
$("tab-programs").addEventListener("click", () => { showPane("programs"); els.find.focus(); });
$("tab-catalog").addEventListener("click", () => { showPane("catalog"); els.catFind.focus(); });
els.gutter.addEventListener("click", () => {
  showNumbers = !showNumbers;
  try { localStorage.setItem(GUTTER_PREF, showNumbers ? "1" : "0"); } catch { /* storage unavailable */ }
  applyGutter();
});
els.find.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const name = normalizeName(els.find.value);
  if (!name) return setMessage("Names start with a letter and use only letters and digits.");
  els.find.value = "";
  void createProgram(name);
});

const mod = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;
window.addEventListener("keydown", e => {
  if (mod(e) && e.key === "s") { e.preventDefault(); void saveActive(); }
  else if (mod(e) && e.key === "w" && active) { e.preventDefault(); closeTab(active); }
  else if (mod(e) && e.key === "n") { e.preventDefault(); showPane("programs"); els.find.focus(); }
});

store.list().then(list => { names = list; refresh(); }).catch(err => setMessage(`Could not load programs: ${err}`));
applyGutter();
renderCatalog();