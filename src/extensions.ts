// TIde extensions. An extension is a folder in TIde's extensions folder with an extension.json:
// its name and what it adds. A manifest alone can add snippets, completions and hover help to any
// language, and new languages with their own highlighting. With "main", a JavaScript module also runs,
// and its activate(tide) gets the API below: commands, events, the editor, the calculator, and Monaco
// itself for any IntelliSense a manifest can't describe. TIde's own extensions come built in.
//
// Writing one gets IntelliSense too: extension.json is checked against EXTENSION_SCHEMA, and main.js
// is typed by EXTENSION_TYPES.

import * as monaco from "monaco-editor/editor/editor.api.js";
import type { Settings } from "./settings";
import { parseJsonc } from "./config";
import { packTideex, unpackTideex, type PackedFile } from "./tideex";
import { builtInLanguage } from "./language-support";

const BUILT_IN_NAMES: Record<string, string> = { tibasic: "TI-BASIC", c: "CE C", ez80: "eZ80 assembly", python: "py2ez80" };

export interface Snippet { language: string; prefix: string; body: string | string[]; description?: string }
export interface Completion { language: string; label: string; detail?: string; documentation?: string; insertText?: string; kind?: string }
export interface Hover { language: string; word: string; contents: string }
export interface LanguageContribution {
  id: string;
  name?: string;
  extensions?: string[];
  filenames?: string[];
  /** A Monarch tokenizer: Monaco's highlighting rules. */
  monarch?: monaco.languages.IMonarchLanguage;
  comments?: { lineComment?: string; blockComment?: [string, string] };
  brackets?: [string, string][];
}
export interface ExtensionManifest {
  name: string;
  /** Its folder's name when installed from a .TIdeex: lower case letters, digits, "-" and ".". */
  id?: string;
  version?: string;
  description?: string;
  author?: string;
  /** A JavaScript module in the extension's folder. It exports activate(tide), and may export deactivate(). */
  main?: string;
  contributes?: {
    snippets?: Snippet[];
    completions?: Completion[];
    hovers?: Hover[];
    languages?: LanguageContribution[];
  };
}

export interface Extension {
  /** The folder's name, or "tide." and a name for a built-in one. */
  id: string;
  /** Running from TIde itself rather than a folder (in a browser, where there's no extensions folder). */
  builtIn: boolean;
  /** One of the extensions that come with TIde. */
  bundled?: boolean;
  /** Its files, when it runs from TIde itself. */
  sources?: Record<string, string>;
  dir: string | null;
  manifest: ExtensionManifest;
  enabled: boolean;
  /** Why it didn't load, if it didn't. */
  error?: string;
  /** What it added, for the Extensions view. */
  added: string[];
}



export interface ExtensionCommand { id: string; label: string; shortcut?: string; extension: string; run: () => unknown }
export type ExtensionEvent = "open" | "save" | "run" | "project" | "settings";

/** What TIde gives the extension system. */
export interface ExtensionHost {
  version: string;
  extensionsDir(): Promise<string | null>;
  readDir(path: string): Promise<{ name: string; path: string; isDir: boolean }[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, text: string): Promise<void>;
  readBinary(path: string): Promise<Uint8Array>;
  writeBinary(path: string, bytes: Uint8Array): Promise<void>;
  /** Moves a folder to the Recycle Bin. */
  remove(path: string): Promise<void>;
  message(text: string): void;
  settings(): Readonly<Settings>;
  project(): { root: string; name: string } | null;
  openFile(path: string): Promise<void>;
  editor: {
    file(): { name: string; path: string | null; language: string } | null;
    text(): string;
    setText(text: string): void;
    selection(): string;
    insert(text: string): void;
  };
  calculator: { show(): Promise<void>; macro(name: string, arg?: string): Promise<void> };
}

const OFF = "tide-pref-extensions-off";
let off = new Set<string>();
try { off = new Set(JSON.parse(localStorage.getItem(OFF) ?? "[]")); } catch { /* storage unavailable */ }

const isAbsolute = (p: string) => /^([a-z]:)?[\\/]/i.test(p);
const join = (dir: string, rel: string) => isAbsolute(rel) ? rel : `${dir.replace(/[\\/]+$/, "")}${dir.includes("\\") ? "\\" : "/"}${rel.replace(/^\.?[\\/]/, "")}`;

interface Loaded { ext: Extension; undo: (() => void)[] }
const loaded = new Map<string, Loaded>();
const commands = new Map<string, ExtensionCommand>();
const handlers = new Map<ExtensionEvent, Set<(detail: unknown) => void>>();
const listeners = new Set<() => void>();
let host: ExtensionHost;
let folder: string | null = null;

const changed = () => { for (const fn of listeners) fn(); };

/** Every extension, built-in ones first. */
export const extensions = (): Extension[] => [...loaded.values()].map(l => l.ext);
/** The commands enabled extensions added. */
export const extensionCommands = (): ExtensionCommand[] => [...commands.values()];
export function onExtensionsChange(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
/** The extensions folder, once known. */
export const extensionsFolder = () => folder;

/** Tells extensions something happened. One that throws doesn't stop the others. */
export function emit(event: ExtensionEvent, detail?: unknown) {
  for (const fn of handlers.get(event) ?? []) {
    try { fn(detail); } catch (err) { console.error(`An extension's "${event}" handler failed`, err); }
  }
}

// ── What a manifest adds ──

const KINDS: Record<string, monaco.languages.CompletionItemKind> = {
  function: monaco.languages.CompletionItemKind.Function, keyword: monaco.languages.CompletionItemKind.Keyword,
  variable: monaco.languages.CompletionItemKind.Variable, constant: monaco.languages.CompletionItemKind.Constant,
  snippet: monaco.languages.CompletionItemKind.Snippet, type: monaco.languages.CompletionItemKind.Class,
  module: monaco.languages.CompletionItemKind.Module, text: monaco.languages.CompletionItemKind.Text,
};

function contribute(ext: Extension, undo: (() => void)[]) {
  // Each registration is undone when the extension stops (dispose needs its object, so it's kept whole).
  const keep = (d: monaco.IDisposable) => { undo.push(() => d.dispose()); };
  const c = ext.manifest.contributes ?? {};
  for (const lang of c.languages ?? []) {
    if (!monaco.languages.getLanguages().some(l => l.id === lang.id)) {
      monaco.languages.register({ id: lang.id, aliases: lang.name ? [lang.name] : undefined, extensions: lang.extensions, filenames: lang.filenames });
    }
    if (lang.monarch) keep(monaco.languages.setMonarchTokensProvider(lang.id, lang.monarch));
    if (lang.comments || lang.brackets) {
      keep(monaco.languages.setLanguageConfiguration(lang.id, { comments: lang.comments, brackets: lang.brackets }));
    }
    ext.added.push(`the ${lang.name ?? lang.id} language`);
  }
  // Snippets and completions, by language: one provider per language for this extension.
  const items = new Map<string, ((range: monaco.IRange) => monaco.languages.CompletionItem)[]>();
  const add = (language: string, item: (range: monaco.IRange) => monaco.languages.CompletionItem) => {
    if (!items.has(language)) items.set(language, []);
    items.get(language)!.push(item);
  };
  for (const s of c.snippets ?? []) {
    add(s.language, range => ({
      label: s.prefix, kind: monaco.languages.CompletionItemKind.Snippet, detail: `${s.description ?? "Snippet"} (${ext.manifest.name})`,
      insertText: Array.isArray(s.body) ? s.body.join("\n") : s.body,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range,
      documentation: { value: "```\n" + (Array.isArray(s.body) ? s.body.join("\n") : s.body).replace(/\$\{\d+:?([^}]*)\}|\$\d+/g, "$1") + "\n```" },
    }));
  }
  for (const item of c.completions ?? []) {
    add(item.language, range => ({
      label: item.label, kind: KINDS[item.kind ?? "function"] ?? KINDS.function, detail: item.detail,
      documentation: item.documentation ? { value: item.documentation } : undefined,
      insertText: item.insertText ?? item.label,
      insertTextRules: item.insertText?.includes("$") ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined, range,
    }));
  }
  for (const [language, list] of items) {
    keep(monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        return { suggestions: list.map(make => make(range)) };
      },
    }));
  }
  const snippets = c.snippets?.length ?? 0, completions = c.completions?.length ?? 0;
  if (snippets) ext.added.push(`${snippets} snippet${snippets > 1 ? "s" : ""}`);
  if (completions) ext.added.push(`${completions} completion${completions > 1 ? "s" : ""}`);
  // Hover help, by language and word.
  const hovers = new Map<string, Map<string, string>>();
  for (const h of c.hovers ?? []) {
    if (!hovers.has(h.language)) hovers.set(h.language, new Map());
    hovers.get(h.language)!.set(h.word, h.contents);
  }
  for (const [language, words] of hovers) {
    keep(monaco.languages.registerHoverProvider(language, {
      provideHover(model, position) {
        const word = model.getWordAtPosition(position);
        const text = word && words.get(word.word);
        if (!word || !text) return null;
        return { contents: [{ value: text }], range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn) };
      },
    }));
  }
  const words = [...hovers.values()].reduce((n, m) => n + m.size, 0);
  if (words) ext.added.push(`hover help for ${words} word${words > 1 ? "s" : ""}`);
}

// ── The API main.js gets ──

async function runMain(ext: Extension, undo: (() => void)[]) {
  const dir = ext.dir ?? `tide:${ext.id}`;
  const main = ext.manifest.main!.replace(/^\.\//, "");
  const code = ext.sources ? ext.sources[main] : await host.readFile(join(dir, main));
  if (code === undefined) throw new Error(`${main} is missing`);
  const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  let module: { activate?: (tide: unknown) => unknown; deactivate?: () => unknown };
  try { module = await import(/* @vite-ignore */ url); } finally { URL.revokeObjectURL(url); }
  if (typeof module.activate !== "function") throw new Error(`${ext.manifest.main} doesn't export activate(tide)`);
  const track = (d: { dispose(): void }) => { undo.push(() => d.dispose()); return d; };
  const usesBuiltIn: string[] = [];
  const tide = {
    get version() { return host.version; },
    extension: { id: ext.id, dir, manifest: ext.manifest },
    monaco,
    subscriptions: { push: (...ds: { dispose(): void }[]) => { for (const d of ds) track(d); } },
    commands: {
      register(id: string, label: string, run: () => unknown, options: { shortcut?: string } = {}) {
        if (typeof run !== "function") throw new Error("commands.register needs a function to run");
        const key = `${ext.id}.${id}`;
        commands.set(key, { id: key, label: String(label), shortcut: options.shortcut, extension: ext.manifest.name, run });
        ext.added.push(`the "${label}" command`);
        changed();
        return track({ dispose: () => { commands.delete(key); changed(); } });
      },
    },
    languages: {
      completions: (language: string, provider: monaco.languages.CompletionItemProvider) => track(monaco.languages.registerCompletionItemProvider(language, provider)),
      hover: (language: string, provider: monaco.languages.HoverProvider) => track(monaco.languages.registerHoverProvider(language, provider)),
      signatureHelp: (language: string, provider: monaco.languages.SignatureHelpProvider) => track(monaco.languages.registerSignatureHelpProvider(language, provider)),
      builtIn(language: string) {
        const d = track(builtInLanguage(language));
        usesBuiltIn.push(BUILT_IN_NAMES[language] ?? language);
        return d;
      },
      markers(model: monaco.editor.ITextModel, markers: monaco.editor.IMarkerData[]) {
        monaco.editor.setModelMarkers(model, ext.id, markers);
        undo.push(() => { if (!model.isDisposed()) monaco.editor.setModelMarkers(model, ext.id, []); });
      },
    },
    on(event: ExtensionEvent, fn: (detail: unknown) => void) {
      const set = handlers.get(event) ?? new Set();
      handlers.set(event, set);
      set.add(fn);
      return track({ dispose: () => set.delete(fn) });
    },
    message: (text: string) => host.message(String(text)),
    settings: () => host.settings(),
    project: () => host.project(),
    editor: host.editor,
    calculator: host.calculator,
    files: {
      read: (path: string) => (ext.sources ? Promise.resolve(ext.sources[path.replace(/^\.\//, "")] ?? "") : host.readFile(join(dir, path))),
      open: (path: string) => host.openFile(join(host.project()?.root ?? dir, path)),
    },
  };
  if (module.deactivate) undo.push(() => void module.deactivate!());
  await module.activate(tide);
  if (usesBuiltIn.length) ext.added.unshift(`IntelliSense for ${usesBuiltIn.join(", ")}`);
}

async function start(entry: Loaded) {
  const { ext, undo } = entry;
  ext.error = undefined;
  ext.added = [];
  if (!ext.enabled) return;
  try {
    contribute(ext, undo);
    if (ext.manifest.main && (ext.dir || ext.sources)) await runMain(ext, undo);
  } catch (err) {
    ext.error = err instanceof Error ? err.message : String(err);
    console.error(`Extension ${ext.manifest.name} failed`, err);
  }
}

function stop(entry: Loaded) {
  for (const fn of entry.undo.splice(0).reverse()) {
    try { fn(); } catch (err) { console.error(`Extension ${entry.ext.manifest.name} didn't stop cleanly`, err); }
  }
  for (const [key, c] of commands) if (c.extension === entry.ext.manifest.name && key.startsWith(`${entry.ext.id}.`)) commands.delete(key);
}

async function scan(dir: string): Promise<Extension[]> {
  const found: Extension[] = [];
  for (const entry of (await host.readDir(dir).catch(() => [])).filter(e => e.isDir)) {
    const ext: Extension = { id: entry.name, builtIn: false, bundled: bundled.some(b => b.id === entry.name), dir: entry.path,
      manifest: { name: entry.name }, enabled: !off.has(entry.name), added: [] };
    try {
      // Comments are allowed, as in tide.json.
      const raw = parseJsonc(await host.readFile(join(entry.path, "extension.json"))) as ExtensionManifest | null;
      if (!raw || typeof raw !== "object" || typeof raw.name !== "string") throw new Error("extension.json needs a \"name\"");
      ext.manifest = raw;
    } catch (err) {
      ext.error = `Bad or missing extension.json: ${err instanceof Error ? err.message : err}`;
      ext.enabled = false;
    }
    found.push(ext);
  }
  return found;
}

// ── Extensions that come with TIde ──
// They're folders in TIde's source (extensions/), installed into the extensions folder the first time
// TIde runs and updated when TIde has a newer version. Once uninstalled, they stay uninstalled until
// installed again from the Extensions view.

/** An extension that comes with TIde, as its files. */
export interface BundledExtension { id: string; manifest: ExtensionManifest; files: Record<string, string> }
let bundled: BundledExtension[] = [];
const SEEN = "tide-pref-bundled-extensions"; // ids TIde has installed once

function seen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN) ?? "[]")); } catch { return new Set(); }
}
function remember(ids: Set<string>) { try { localStorage.setItem(SEEN, JSON.stringify([...ids])); } catch { /* storage unavailable */ } }

/** Whether version a is newer than b ("1.2.0" > "1.1.9"). */
function newer(a = "0", b = "0") {
  const pa = a.split(".").map(n => parseInt(n, 10) || 0), pb = b.split(".").map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  return false;
}

async function writeBundled(b: BundledExtension) {
  const dir = join(folder!, b.id), sep = folder!.includes("\\") ? "\\" : "/";
  for (const [path, text] of Object.entries(b.files)) await host.writeFile(join(dir, path.replace(/\//g, sep)), text);
}

/** Installs bundled extensions that are new, and updates ones TIde has a newer version of. */
async function seedBundled() {
  const ids = seen();
  const entries = await host.readDir(folder!).catch(() => []);
  for (const b of bundled) {
    const there = entries.find(e => e.isDir && e.name === b.id);
    if (!there && ids.has(b.id)) continue; // uninstalled: leave it that way
    if (there) {
      const installed = await host.readFile(join(there.path, "extension.json")).then(t => parseJsonc(t) as ExtensionManifest | null).catch(() => null);
      if (!newer(b.manifest.version, installed?.version)) { ids.add(b.id); continue; }
    }
    try { await writeBundled(b); ids.add(b.id); } catch (err) { console.error(`Couldn't install ${b.manifest.name}`, err); }
  }
  remember(ids);
}

/** Bundled extensions that aren't installed, to install from the Extensions view. */
export const availableExtensions = (): BundledExtension[] => (folder ? bundled.filter(b => !loaded.has(b.id)) : []);

/** Installs a bundled extension again. */
export async function installBundled(id: string) {
  const b = bundled.find(x => x.id === id);
  if (!b || !folder) throw new Error("Extensions install in the desktop app.");
  await writeBundled(b);
  const ids = seen(); ids.add(id); remember(ids);
  await reloadExtensions();
}

/** Uninstalls an extension: stops it and moves its folder to the Recycle Bin. */
export async function uninstallExtension(ext: Extension) {
  if (!ext.dir) throw new Error(`${ext.manifest.name} runs from TIde itself here, so it can only be turned off.`);
  const entry = loaded.get(ext.id);
  if (entry) { stop(entry); loaded.delete(ext.id); changed(); }
  await host.remove(ext.dir);
  await reloadExtensions();
}

async function replaceAll(list: Extension[]) {
  for (const entry of loaded.values()) stop(entry);
  loaded.clear();
  for (const ext of list) {
    const entry = { ext, undo: [] };
    loaded.set(ext.id, entry);
    await start(entry);
  }
  changed();
}

/** Starts the extensions: the installed ones, after installing or updating the ones TIde comes with. */
export async function loadExtensions(h: ExtensionHost, withTide: BundledExtension[]) {
  host = h;
  bundled = withTide;
  await reloadExtensions();
}

/** Loads every extension again, picking up new and changed ones. */
export async function reloadExtensions() {
  folder = await host.extensionsDir().catch(() => null);
  if (folder) await seedBundled();
  const installed = folder ? await scan(folder) : [];
  // Without an extensions folder (in a browser), the ones that come with TIde run from TIde itself.
  const fromTide: Extension[] = folder ? [] : bundled.map(b => ({
    id: b.id, builtIn: true, bundled: true, dir: null, manifest: b.manifest, enabled: !off.has(b.id), added: [], sources: b.files,
  }));
  await replaceAll([...fromTide, ...installed]);
}

/** Turns an extension on or off, remembered between runs. */
export async function setExtensionEnabled(ext: Extension, enabled: boolean) {
  const entry = loaded.get(ext.id);
  if (!entry || entry.ext.enabled === enabled) return;
  if (enabled) off.delete(ext.id); else off.add(ext.id);
  try { localStorage.setItem(OFF, JSON.stringify([...off])); } catch { /* storage unavailable */ }
  stop(entry);
  entry.ext.enabled = enabled;
  await start(entry);
  changed();
}

const slug = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
const ID = /^[a-z0-9][a-z0-9.-]{0,63}$/;

/** What a .TIdeex holds, before it's installed: its manifest, its files, and the folder it goes in. */
export interface TideexPackage { manifest: ExtensionManifest; files: PackedFile[]; id: string; replaces: Extension | null }

/** Reads a .TIdeex and checks it, without installing it. */
export async function readPackage(bytes: Uint8Array): Promise<TideexPackage> {
  const files = await unpackTideex(bytes);
  const manifest = parseJsonc(new TextDecoder().decode(files.find(f => f.path === "extension.json")!.bytes)) as ExtensionManifest | null;
  if (!manifest || typeof manifest !== "object" || typeof manifest.name !== "string") throw new Error("Its extension.json needs a \"name\".");
  const id = manifest.id ?? slug(manifest.name);
  if (!ID.test(id)) throw new Error(`"${id}" can't be an extension's id: use lower case letters, digits, "-" and ".".`);
  if (manifest.main && !files.some(f => f.path === manifest.main!.replace(/^\.\//, ""))) throw new Error(`Its main, ${manifest.main}, isn't in the file.`);
  const replaces = [...loaded.values()].find(l => !l.ext.builtIn && l.ext.id === id)?.ext ?? null;
  return { manifest, files, id, replaces };
}

/** Installs a read .TIdeex into the extensions folder, replacing an extension with the same id. */
export async function installPackage(pkg: TideexPackage): Promise<Extension> {
  if (!folder) throw new Error("Extensions install in the desktop app.");
  const dir = join(folder, pkg.id);
  if (pkg.replaces) {
    const entry = loaded.get(pkg.id);
    if (entry) stop(entry);
    await host.remove(dir).catch(() => { /* not there */ });
  }
  for (const file of pkg.files) await host.writeBinary(join(dir, file.path.replace(/\//g, folder.includes("\\") ? "\\" : "/")), file.bytes);
  await reloadExtensions();
  const ext = loaded.get(pkg.id)?.ext;
  if (!ext) throw new Error("It installed, but didn't load.");
  return ext;
}

/** Packs an installed extension's folder into a .TIdeex, leaving out hidden files and node_modules. */
export async function packageExtension(ext: Extension): Promise<Uint8Array> {
  if (!ext.dir) throw new Error("Built-in extensions can't be exported.");
  const files: PackedFile[] = [];
  const walk = async (dir: string, prefix: string) => {
    for (const entry of await host.readDir(dir)) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      if (entry.isDir) await walk(entry.path, `${prefix}${entry.name}/`);
      else files.push({ path: `${prefix}${entry.name}`, bytes: await host.readBinary(entry.path) });
    }
  };
  await walk(ext.dir, "");
  return packTideex(files);
}

/** Makes a new extension from the template, and returns its folder. */
export async function createExtension(name: string): Promise<string> {
  if (!folder) throw new Error("Extensions need the desktop app.");
  const id = slug(name) || "extension";
  const dir = join(folder, id);
  if ((await host.readDir(folder)).some(e => e.name.toLowerCase() === id)) throw new Error(`There's already an extension folder called ${id}.`);
  await host.writeFile(join(dir, "extension.json"), EXTENSION_TEMPLATE.replace("$NAME", name.trim().replace(/"/g, "'")));
  await host.writeFile(join(dir, "main.js"), MAIN_TEMPLATE);
  await reloadExtensions();
  return dir;
}

// ── IntelliSense for writing extensions ──

/** JSON Schema for extension.json: completions, hover help and checking while it's edited. */
export const EXTENSION_SCHEMA = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    $schema: { type: "string" },
    name: { type: "string", description: "The extension's name, shown in the Extensions view." },
    id: { type: "string", pattern: "^[a-z0-9][a-z0-9.-]{0,63}$", description: "Its folder's name when installed from a .TIdeex, such as \"yourname.snippets\". A newer .TIdeex with the same id replaces it. Defaults to the name, in lower case." },
    version: { type: "string", description: "Its version, such as \"1.0.0\"." },
    description: { type: "string", description: "One line on what it does." },
    author: { type: "string", description: "Who made it." },
    main: { type: "string", description: "A JavaScript module in this folder, such as \"main.js\". It exports activate(tide), and may export deactivate().", default: "main.js" },
    contributes: {
      type: "object",
      additionalProperties: false,
      description: "What the extension adds, without code.",
      properties: {
        snippets: {
          type: "array", description: "Snippets: type the prefix and pick it from the suggestions.",
          items: {
            type: "object", required: ["language", "prefix", "body"], additionalProperties: false,
            properties: {
              language: { $ref: "#/definitions/language" },
              prefix: { type: "string", description: "What you type to get it." },
              body: { description: "The text. $1, $2… are tab stops, ${1:name} has a placeholder, $0 is where the cursor ends.", oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
              description: { type: "string", description: "Shown beside it in the suggestions." },
            },
          },
        },
        completions: {
          type: "array", description: "Words to suggest, with their documentation.",
          items: {
            type: "object", required: ["language", "label"], additionalProperties: false,
            properties: {
              language: { $ref: "#/definitions/language" },
              label: { type: "string", description: "The word suggested." },
              kind: { enum: Object.keys(KINDS), description: "Its icon in the suggestions." },
              detail: { type: "string", description: "A short line, such as its signature." },
              documentation: { type: "string", description: "Markdown shown beside it." },
              insertText: { type: "string", description: "What's inserted, if not the label. May use $1 tab stops." },
            },
          },
        },
        hovers: {
          type: "array", description: "Help shown when the mouse is over a word.",
          items: {
            type: "object", required: ["language", "word", "contents"], additionalProperties: false,
            properties: {
              language: { $ref: "#/definitions/language" },
              word: { type: "string", description: "The word." },
              contents: { type: "string", description: "Markdown." },
            },
          },
        },
        languages: {
          type: "array", description: "New languages, with their file extensions and highlighting.",
          items: {
            type: "object", required: ["id"], additionalProperties: false,
            properties: {
              id: { type: "string", description: "The language's id, used by the other contributions." },
              name: { type: "string", description: "Its name." },
              extensions: { type: "array", items: { type: "string", pattern: "^\\." }, description: "File extensions, such as [\".axe\"]." },
              filenames: { type: "array", items: { type: "string" }, description: "Whole file names." },
              monarch: { type: "object", description: "A Monarch tokenizer for highlighting (see Monaco's Monarch docs): { \"tokenizer\": { \"root\": [[\"regex\", \"token\"]] } }." },
              comments: { type: "object", properties: { lineComment: { type: "string" }, blockComment: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } } },
              brackets: { type: "array", items: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 } },
            },
          },
        },
      },
    },
  },
  definitions: {
    language: {
      type: "string", description: "The language it's for.",
      anyOf: [{ enum: ["tibasic", "c", "cpp", "ez80", "python", "json", "markdown", "makefile", "plaintext"] }, { type: "string" }],
    },
  },
};

/** Types for main.js, so writing an extension gets completions and checking. */
export const EXTENSION_TYPES = `
/** A thing to undo when the extension stops. */
interface Disposable { dispose(): void }
type TideEvent = "open" | "save" | "run" | "project" | "settings";
/** The API a TIde extension's activate(tide) gets. */
interface Tide {
  /** TIde's version, such as "1.4.0". */
  readonly version: string;
  /** This extension: its id, folder and extension.json. */
  readonly extension: { id: string; dir: string; manifest: any };
  /** Monaco, the editor TIde is built on, for anything else: monaco.languages, monaco.editor… */
  readonly monaco: any;
  /** Add things here to undo them when the extension is turned off. Everything tide.* returns is added already. */
  readonly subscriptions: { push(...items: Disposable[]): void };
  readonly commands: {
    /** Adds a command to the File menu and the editor's right-click menu. */
    register(id: string, label: string, run: () => unknown, options?: { shortcut?: string }): Disposable;
  };
  /** IntelliSense for any language: "tibasic", "c", "ez80" (assembly), "python", or one an extension adds. */
  readonly languages: {
    /** provider.provideCompletionItems(model, position) returns { suggestions: [...] }, as in Monaco. */
    completions(language: string, provider: { provideCompletionItems(model: any, position: any): any; triggerCharacters?: string[] }): Disposable;
    /** provider.provideHover(model, position) returns { contents: [{ value: "markdown" }] }, or null. */
    hover(language: string, provider: { provideHover(model: any, position: any): any }): Disposable;
    signatureHelp(language: string, provider: { provideSignatureHelp(model: any, position: any): any; signatureHelpTriggerCharacters?: string[] }): Disposable;
    /** Turns on TIde's own IntelliSense for a language: completions, hover help, signature help and more. */
    builtIn(language: "tibasic" | "c" | "ez80" | "python"): Disposable;
    /** Shows problems in a file (squiggles and the status bar). */
    markers(model: any, markers: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number; message: string; severity: number }[]): void;
  };
  /** Runs fn when a file or program opens or is saved, a program runs, a folder opens, or settings change. */
  on(event: TideEvent, fn: (detail: any) => void): Disposable;
  /** Shows text in the status bar. */
  message(text: string): void;
  /** The settings in use. */
  settings(): Readonly<Record<string, unknown>>;
  /** The open folder, if any. */
  project(): { root: string; name: string } | null;
  readonly editor: {
    /** The open file or program: its name, path (null for programs) and language. */
    file(): { name: string; path: string | null; language: string } | null;
    text(): string;
    setText(text: string): void;
    /** The selected text. */
    selection(): string;
    /** Replaces the selection, or inserts at the cursor. */
    insert(text: string): void;
  };
  readonly calculator: {
    show(): Promise<void>;
    /** A calculator macro, as in tide.json: macro("key.press", "enter"), macro("program.run", "HELLO"). */
    macro(name: "key.press" | "key.type" | "program.run" | "program.open" | "app.open" | "wait", arg?: string): Promise<void>;
  };
  readonly files: {
    /** Reads a file as text. Relative paths are from this extension's folder. */
    read(path: string): Promise<string>;
    /** Opens a file in a tab. Relative paths are from the open folder. */
    open(path: string): Promise<void>;
  };
}
`;

const EXTENSION_TEMPLATE = `{
  // Hover a name for help, or press Ctrl+Space for options.
  "name": "$NAME",
  "version": "1.0.0",
  "description": "What it does.",
  "main": "main.js",
  "contributes": {
    "snippets": [
      {
        "language": "tibasic",
        "prefix": "hello",
        "body": ["Disp \\"\${1:HELLO}\\"", "$0"],
        "description": "Show a greeting"
      }
    ]
  }
}
`;

const MAIN_TEMPLATE = `// @ts-check
// Runs when TIde starts this extension. Save to reload it.

/** @param {Tide} tide */
export function activate(tide) {
  tide.commands.register("count", "Count lines", () => {
    tide.message(\`\${tide.editor.text().split("\\n").length} lines\`);
  });

  tide.on("save", file => tide.message(\`Saved \${file.name}\`));
}

export function deactivate() {}
`;
