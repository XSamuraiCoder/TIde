import * as monaco from "monaco-editor/editor/editor.api.js";
import { BLOCKS, BY_NAME, COMMANDS, TOKEN_RE, mask, signature, snippetFor, usage, type Command } from "./commands";
import { analyze } from "./analysis";
import { tokenize } from "./build";
import { onTargetChange } from "./target";

const LANG = "tibasic";
const analyzeModel = (model: monaco.editor.ITextModel) => analyze(model.getLinesContent());

/** The word under the cursor, treating Pxl-On and friends as one word. */
function wordAt(model: monaco.editor.ITextModel, pos: monaco.Position) {
  const code = mask(model.getLineContent(pos.lineNumber));
  for (const m of code.matchAll(TOKEN_RE)) {
    const start = m.index! + 1, end = start + m[0].length;
    if (pos.column >= start && pos.column <= end) return { word: m[0], start, end };
  }
  return null;
}

function docsFor(c: Command): monaco.IMarkdownString[] {
  const params = c.params?.map(x => `- \`${x.name}\`${x.optional ? " (optional)" : ""}: ${x.doc}`).join("\n");
  return [
    { value: "```tibasic\n" + usage(c) + "\n```" },
    { value: c.doc + (params ? "\n\n" + params : "") },
  ];
}

export function registerIntellisense(): void {
  const { CompletionItemKind: Kind, CompletionItemInsertTextRule } = monaco.languages;

  monaco.languages.registerCompletionItemProvider(LANG, {
    provideCompletionItems(model, position) {
      const prefix = model.getValueInRange(new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column));
      if ((prefix.match(/"/g)?.length ?? 0) % 2 === 1) return { suggestions: [] };   // inside a string

      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);

      if (/\bLbl\s+[A-Zθ0-9]*$/.test(prefix)) return { suggestions: [] };            // naming a new label
      if (/\bGoto\s+[A-Zθ0-9]*$/.test(prefix)) {
        const seen = new Set<string>();
        return { suggestions: analyzeModel(model).labels.filter(l => !seen.has(l.name) && seen.add(l.name)).map(l => ({
          label: l.name, kind: Kind.Reference, insertText: l.name, range, detail: `Lbl on line ${l.line}`,
        })) };
      }

      const rules = CompletionItemInsertTextRule.InsertAsSnippet;
      return { suggestions: [
        ...COMMANDS.map(c => ({
          label: c.name, kind: c.kind === "control" ? Kind.Keyword : Kind.Function,
          detail: usage(c), documentation: { value: c.doc }, insertText: snippetFor(c), insertTextRules: rules, range,
          sortText: "1" + c.name,
        })),
        ...BLOCKS.map(b => ({
          label: b.label, kind: Kind.Snippet, detail: "Block", documentation: { value: b.doc },
          insertText: b.snippet, insertTextRules: rules, range, filterText: b.label.split(" ")[0], sortText: "2" + b.label,
        })),
      ] };
    },
  });

  monaco.languages.registerSignatureHelpProvider(LANG, {
    signatureHelpTriggerCharacters: ["(", ","],
    signatureHelpRetriggerCharacters: [","],
    provideSignatureHelp(model, pos) {
      const text = mask(model.getLineContent(pos.lineNumber)).slice(0, pos.column - 1);
      const calls: { at: number; commas: number }[] = [];
      for (let i = 0; i < text.length; i++) {
        if (text[i] === "(") calls.push({ at: i, commas: 0 });
        else if (text[i] === ")") calls.pop();
        else if (text[i] === "," && calls.length) calls[calls.length - 1].commas++;
      }
      const call = calls[calls.length - 1];
      if (!call) return null;
      const name = /(Pxl-(?:On|Off|Change)|Pt-(?:On|Off|Change)|[A-Za-z][A-Za-z0-9]*)$/.exec(text.slice(0, call.at))?.[1];
      const cmd = name ? BY_NAME.get(name) : undefined;
      if (!cmd?.params) return null;

      const { label, ranges } = signature(cmd);
      let active = call.commas;
      if (cmd.repeat && active >= cmd.params.length - cmd.repeat) {
        const first = cmd.params.length - cmd.repeat;
        active = first + ((active - first) % cmd.repeat);
      }
      return {
        value: {
          signatures: [{
            label, documentation: { value: cmd.doc },
            parameters: cmd.params.map((x, i) => ({ label: ranges[i], documentation: { value: x.doc } })),
          }],
          activeSignature: 0,
          activeParameter: Math.min(active, cmd.params.length - 1),
        },
        dispose() {},
      };
    },
  });

  monaco.languages.registerHoverProvider(LANG, {
    provideHover(model, pos) {
      const hit = wordAt(model, pos);
      if (!hit) return null;
      const range = new monaco.Range(pos.lineNumber, hit.start, pos.lineNumber, hit.end);
      const cmd = BY_NAME.get(hit.word);
      if (cmd) return { range, contents: docsFor(cmd) };

      const a = analyzeModel(model);
      if (a.gotos.some(g => g.line === pos.lineNumber && g.name === hit.word)) {
        const target = a.labels.find(l => l.name === hit.word);
        return { range, contents: [{ value: target ? `Label \`${hit.word}\`, defined on line ${target.line}.` : `No label \`${hit.word}\`.` }] };
      }
      return null;
    },
  });

  monaco.languages.registerDefinitionProvider(LANG, {
    provideDefinition(model, pos) {
      const a = analyzeModel(model);
      const jump = a.gotos.find(g => g.line === pos.lineNumber && pos.column >= g.column && pos.column <= g.column + g.name.length);
      const target = jump && a.labels.find(l => l.name === jump.name);
      return target
        ? { uri: model.uri, range: new monaco.Range(target.line, target.column, target.line, target.column + target.name.length) }
        : null;
    },
  });

  monaco.languages.registerFoldingRangeProvider(LANG, {
    provideFoldingRanges: model =>
      analyzeModel(model).blocks.filter(b => b.close - 1 > b.open).map(b => ({ start: b.open, end: b.close - 1 })),
  });
}

/** Re-run diagnostics shortly after the model stops changing. */
export function watchModel(model: monaco.editor.ITextModel): void {
  let timer: number | undefined;
  const run = () => {
    if (model.isDisposed()) return;
    const { markers } = analyzeModel(model);
    // Characters the tokenizer can't turn into tokens are build errors too: they'd be skipped in the .8xp.
    const { errors } = tokenize(model.getValue());
    const noToken = errors.map(e => ({
      severity: monaco.MarkerSeverity.Error,
      message: `"${e.text}" has no token on this calculator — it will be skipped in the .8xp.`,
      startLineNumber: e.line, startColumn: e.column,
      endLineNumber: e.line, endColumn: e.column + e.text.length,
      source: "TIde",
    }));
    monaco.editor.setModelMarkers(model, "tide", [...markers, ...noToken]);
  };
  model.onDidChangeContent(() => { window.clearTimeout(timer); timer = window.setTimeout(run, 250); });
  model.onWillDispose(onTargetChange(run));
  run();
}