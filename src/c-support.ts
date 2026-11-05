import * as monaco from "monaco-editor/editor/editor.api.js";

// Monaco already tokenizes C (and folds it by indentation). This adds the editing helpers it lacks:
// snippets for common constructs, plus starters for the CE C toolchain.
export interface Snippet { label: string; doc: string; body: string }

export const C_SNIPPETS: Snippet[] = [
  { label: "main", doc: "Program entry point.", body: "#include <stdint.h>\n\nint main(void) {\n\t$0\n\treturn 0;\n}" },
  { label: "cemain", doc: "CE program with graphx: waits for a key, then exits.",
    body: "#include <graphx.h>\n#include <ti/getcsc.h>\n\nint main(void) {\n\tgfx_Begin();\n\t$0\n\twhile (!os_GetCSC());\n\tgfx_End();\n\treturn 0;\n}" },
  { label: "cekeys", doc: "CE keypad scan loop (keypadc).",
    body: "#include <keypadc.h>\n\nwhile (!(kb_Data[6] & kb_Clear)) {\n\tkb_Scan();\n\t$0\n}" },
  { label: "for", doc: "Counted loop.", body: "for (${1:int i = 0}; ${2:i < n}; ${3:i++}) {\n\t$0\n}" },
  { label: "while", doc: "While loop.", body: "while (${1:condition}) {\n\t$0\n}" },
  { label: "if", doc: "If statement.", body: "if (${1:condition}) {\n\t$0\n}" },
  { label: "ifelse", doc: "If / else.", body: "if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}" },
  { label: "switch", doc: "Switch statement.", body: "switch (${1:value}) {\ncase ${2:0}:\n\t$0\n\tbreak;\ndefault:\n\tbreak;\n}" },
  { label: "struct", doc: "Typedef'd struct.", body: "typedef struct {\n\t$0\n} ${1:name};" },
  { label: "guard", doc: "Header include guard.", body: "#ifndef ${1:FILE_H}\n#define ${1:FILE_H}\n\n$0\n\n#endif" },
];

export function registerC(): void {
  const rules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
  monaco.languages.registerCompletionItemProvider("c", {
    provideCompletionItems(model, position) {
      const prefix = model.getValueInRange(new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column));
      if ((prefix.match(/"/g)?.length ?? 0) % 2 === 1 || prefix.includes("//")) return { suggestions: [] };

      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
      return {
        suggestions: C_SNIPPETS.map(s => ({
          label: s.label, kind: monaco.languages.CompletionItemKind.Snippet, detail: "Snippet",
          documentation: { value: s.doc }, insertText: s.body, insertTextRules: rules, range,
        })),
      };
    },
  });
}