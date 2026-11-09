import * as monaco from "monaco-editor/editor/editor.api.js";
import { BLOCKS, COMMANDS, bare, wordsOf } from "./commands";
import { TOKEN_TABLE } from "./tokens";
import { fromHex } from "./build";
import { ceOnly, type Target } from "./target";
import { TI_CATEGORIES, TI_DOCS } from "./ti-docs";
import { ASM_EXTENSIONS, ASM_LANG } from "./asm-support";

const COMMAND_SET = new Set(COMMANDS.map(c => bare(c.name)));

// Characters a keyboard can't type directly.
const SYMBOLS: [string, string][] = [
  ["→", "Store into a variable"], ["≠", "Not equal"], ["≤", "Less or equal"], ["≥", "Greater or equal"],
  ["√(", "Square root"], ["π", "Pi"], ["θ", "Theta variable"], ["²", "Squared"], ["⁻¹", "Inverse"], ["ᴇ", "Times ten to the power"],
];

// Commands that take no arguments, so the token table's "(" or trailing space can't identify them.
const PLAIN_COMMANDS = `prgm Ans rand getDate getTime startTmr ClrAllLists ClrTable DispTable AxesOff GridOff LabelOn LabelOff
ExprOn ExprOff Radian Degree Normal Sci Eng Float Full Func Param Polar Seq ZStandard ZoomFit ZSquare ZTrig ZDecimal`.split(/\s+/);

/** Everything else the tokenizer accepts: skips non-ASCII spellings and the arc…/^ aliases of the same token. */
function otherCommands(): string[] {
  const listed = new Set(COMMANDS.map(c => bare(c.name)));
  const names = TOKEN_TABLE.map(([name]) => name)
    .filter(n => /^[A-Za-z0-9][\x20-\x7e]*(?:\(| )$/.test(n) && !/^arc|\^/.test(n));
  const seen = new Set<string>();
  return [...names, ...PLAIN_COMMANDS]
    .filter(n => { const k = bare(n.trimEnd()); return !listed.has(k) && !seen.has(k) && !!seen.add(k); })
    .sort((a, b) => a.localeCompare(b));
}

/** The commands outside the main table, as typed (some with a trailing space), with their docs. */
export const OTHER_COMMANDS = otherCommands().map(insert => ({ name: insert.trimEnd(), insert, doc: TI_DOCS[insert.trimEnd()] }));

const CE_ONLY_NAMES = new Set(TOKEN_TABLE.filter(([, hex]) => ceOnly(fromHex(hex))).map(([name]) => name));
export const isCeOnly = (insert: string) => CE_ONLY_NAMES.has(insert);

/** The TI-BASIC catalog for a calculator: the Plus leaves out commands it doesn't have. */
export function tiCatalog(target: Target) {
  if (target === "ce") return CATALOG;
  return CATALOG.map(g => ({ ...g, entries: g.entries.filter(e => !isCeOnly(e.insert)) }));
}

export const SYMBOL_ENTRIES = SYMBOLS.map(([name, hint]) => ({ name, insert: name, hint }));

export const CATALOG = [
  { group: "Blocks", entries: BLOCKS.map(b => ({ name: b.label, insert: b.snippet, hint: b.doc })) },
  ...TI_CATEGORIES.map(group => ({
    group,
    entries: [
      ...COMMANDS.filter(c => c.group === group).map(c => ({
        name: c.name,
        insert: c.name.endsWith("(") || !c.usage ? c.name : c.name + " ",
        hint: c.doc.split(". ")[0],
      })),
      ...OTHER_COMMANDS.filter(c => c.doc?.category === group).map(c => ({ name: c.name, insert: c.insert, hint: c.doc!.doc })),
    ],
  })),
  { group: "Symbols", entries: SYMBOL_ENTRIES },
  { group: "Other", entries: OTHER_COMMANDS.filter(c => !c.doc).map(c => ({ name: c.name, insert: c.insert, hint: "" })) },
].filter(g => g.entries.length);

/** Rough token-size estimate: commands/functions ≈ 1 byte (some are 2), everything else 1 byte per char, 1 per line break. */
export function estimateBytes(source: string): number {
  if (!source) return 0;
  let bytes = 0;
  for (const line of source.split("\n")) {
    bytes += 1;
    for (const m of line.matchAll(/[A-Za-z][A-Za-z0-9]*|[^A-Za-z]/g)) {
      bytes += COMMAND_SET.has(m[0]) ? 1 : m[0].length;
    }
  }
  return bytes;
}

/** Monaco language id for a file name, using the extensions and file names Monaco already knows. */
export function languageFor(file: string): string {
  const lower = file.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot > 0 ? lower.slice(dot) : "";
  if (ASM_EXTENSIONS.includes(ext)) return ASM_LANG; // before Monaco, which reads .s as MIPS
  const langs = monaco.languages.getLanguages();
  const hit =
    langs.find(l => l.filenames?.some(f => f.toLowerCase() === lower)) ??
    (ext ? langs.find(l => l.extensions?.includes(ext)) : undefined);
  return hit?.id ?? "plaintext";
}

export function registerTiBasic(): void {
  monaco.languages.register({ id: "tibasic" });

  monaco.languages.setMonarchTokensProvider("tibasic", {
    control: wordsOf("control"),
    io: wordsOf("io"),
    functions: wordsOf("function"),
    tokenizer: {
      root: [
        // TI-BASIC has no comments; by convention a lone unterminated string is one.
        [/^\s*:?\s*"[^"\n]*$/, "comment"],
        [/"[^"\n]*"?/, "string"],
        [/Pxl-(?:On|Off|Change)|Pt-(?:On|Off|Change)/, "keyword.io"],
        [/[A-Za-zθ][A-Za-z0-9θ]*/, { cases: {
          "@control": "keyword.control",
          "@io": "keyword.io",
          "@functions": "support.function",
          "@default": "variable",
        } }],
        [/\d*\.?\d+(?:E[-+]?\d+)?/, "number"],
        [/[→+\-*/^=≠<>≤≥√]/, "operator"],
        [/:/, "delimiter"],
        [/[{}()[\],]/, "delimiter.bracket"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration("tibasic", {
    wordPattern: /[A-Za-zθ0-9]+/g,
    autoClosingPairs: [{ open: "(", close: ")" }, { open: "{", close: "}" }, { open: '"', close: '"', notIn: ["string"] }],
    comments: { lineComment: ':"' },
  });

  // Matches the app's navy; the colors are the TIde waves plus a few calm accents for syntax.
  monaco.editor.defineTheme("tide", {
    base: "vs-dark",
    inherit: false,
    rules: [
      { token: "", foreground: "e3e9f3" },
      { token: "comment", foreground: "7486a8", fontStyle: "italic" },
      { token: "string", foreground: "86d9a8" },
      { token: "number", foreground: "f5c07a" },
      { token: "operator", foreground: "7dd3fc" },
      { token: "keyword.control", foreground: "38bdf8", fontStyle: "bold" },
      { token: "keyword.io", foreground: "c4b5fd" },
      { token: "support.function", foreground: "5eead4" },
      { token: "variable", foreground: "e3e9f3" },
      { token: "delimiter", foreground: "8b9cbb" },
      // Other languages (C and friends) use Monaco's own tokenizers; these prefixes cover them.
      { token: "keyword", foreground: "38bdf8", fontStyle: "bold" },
      { token: "keyword.directive", foreground: "c4b5fd", fontStyle: "" },
      { token: "type", foreground: "5eead4" },
      { token: "predefined", foreground: "5eead4" },
      { token: "identifier", foreground: "e3e9f3" },
    ],
    colors: {
      "editor.background": "#0f1f3f",
      "editor.foreground": "#e3e9f3",
      "editor.lineHighlightBackground": "#14284f",
      "editorLineNumber.foreground": "#5d6f92",
      "editorLineNumber.activeForeground": "#e3e9f3",
      "editorCursor.foreground": "#38bdf8",
      "editor.selectionBackground": "#1e4a80",
      "editor.inactiveSelectionBackground": "#173a66",
      "editorRuler.foreground": "#5a4a2e",
      "editorIndentGuide.background1": "#1c3462",
      "editorWidget.background": "#0c1934",
      "editorWidget.border": "#213a68",
      "editorSuggestWidget.background": "#0c1934",
      "editorSuggestWidget.border": "#213a68",
      "editorSuggestWidget.foreground": "#e3e9f3",
      "editorSuggestWidget.selectedBackground": "#133a63",
      "editorSuggestWidget.highlightForeground": "#38bdf8",
      "editorHoverWidget.background": "#0c1934",
      "editorHoverWidget.border": "#213a68",
      "editorError.foreground": "#f87171",
      "editorWarning.foreground": "#f5a524",
      "scrollbarSlider.background": "#2a457980",
      "scrollbarSlider.hoverBackground": "#2a4579",
    },
  });
}