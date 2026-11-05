import * as monaco from "monaco-editor/editor/editor.api.js";
import { COMMANDS, bare, wordsOf, type Group } from "./commands";

const COMMAND_SET = new Set(COMMANDS.map(c => bare(c.name)));

const GROUPS: Group[] = ["Control", "Screen and input", "Drawing", "Math"];
export const CATALOG = GROUPS.map(group => ({
  group,
  entries: COMMANDS.filter(c => c.group === group).map(c => ({
    name: c.name,
    insert: c.name.endsWith("(") || !c.usage ? c.name : c.name + " ",
    hint: c.doc.split(". ")[0],
  })),
}));

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

  monaco.editor.defineTheme("tide", {
    base: "vs",
    inherit: false,
    rules: [
      { token: "", foreground: "1d232b" },
      { token: "comment", foreground: "667080", fontStyle: "italic" },
      { token: "string", foreground: "2f6b3a" },
      { token: "number", foreground: "8a4b0f" },
      { token: "operator", foreground: "2a5ea8" },
      { token: "keyword.control", foreground: "2a5ea8", fontStyle: "bold" },
      { token: "keyword.io", foreground: "7b3f8c" },
      { token: "support.function", foreground: "1d6a72" },
      { token: "variable", foreground: "1d232b" },
      { token: "delimiter", foreground: "667080" },
      // Other languages (C and friends) use Monaco's own tokenizers; these prefixes cover them.
      { token: "keyword", foreground: "2a5ea8", fontStyle: "bold" },
      { token: "keyword.directive", foreground: "7b3f8c", fontStyle: "" },
      { token: "type", foreground: "1d6a72" },
      { token: "predefined", foreground: "1d6a72" },
      { token: "identifier", foreground: "1d232b" },
    ],
    colors: {
      "editor.background": "#fbfbf9",
      "editor.foreground": "#1d232b",
      "editor.lineHighlightBackground": "#f0f1ee",
      "editorLineNumber.foreground": "#667080",
      "editorLineNumber.activeForeground": "#1d232b",
      "editorCursor.foreground": "#2a5ea8",
      "editor.selectionBackground": "#c6d6ee",
      "editorRuler.foreground": "#d7a574",
      "editorWidget.background": "#f3f4f1",
      "editorWidget.border": "#c3c8ce",
      "editorSuggestWidget.background": "#fbfbf9",
      "editorSuggestWidget.border": "#c3c8ce",
      "editorSuggestWidget.selectedBackground": "#dbe5f3",
      "editorSuggestWidget.highlightForeground": "#2a5ea8",
      "editorHoverWidget.background": "#fbfbf9",
      "editorHoverWidget.border": "#c3c8ce",
      "editorError.foreground": "#a8322b",
      "editorWarning.foreground": "#a85d12",
    },
  });
}