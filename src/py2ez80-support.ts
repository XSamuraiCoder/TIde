// Editor support for py2ez80 (https://github.com/Voblit/py2ez80): a Python-subset transpiler that
// emits C and calls CEdev. Everything here is derived from that project's README and documentation.md:
// the `graphics`, `math` and `random` modules, the built-ins, and a checker for the Python features
// the transpiler documents as unsupported. Monaco already tokenizes Python, so only the extras live here.
import * as monaco from "monaco-editor/editor/editor.api.js";
import { Severity, type Marker } from "./analysis";

export interface PyFn { name: string; sig: string; doc: string; insert: string; params: string[] }
export interface PySnippet { label: string; doc: string; body: string }
export interface CatalogEntry { name: string; insert: string; hint: string }

const SOURCE = "py2ez80";

const f = (name: string, params: string[], doc: string): PyFn => ({
  name, params, doc,
  sig: `${name}(${params.join(", ")})`,
  insert: params.length ? `${name}(${params.map((p, i) => `\${${i + 1}:${p}}`).join(", ")})` : `${name}()`,
});

export const PY_LIBRARY: { group: string; entries: PyFn[] }[] = [
  {
    group: "Built-ins",
    entries: [
      { ...f("print", ["value"], "Prints on the home screen. Several values go on one line, separated by spaces. Lines past 26 characters wrap."), sig: "print(value, …)" },
      f("input", [], "Asks for text on the home screen (shows a `:` prompt) and returns it as a string."),
      f("len", ["x"], "Length of a list, array or string. On a fixed array it only works for arrays defined at the top of the program, not ones passed into a function."),
      f("int", ["x"], "Converts to int. `int(\"12\")` parses text. Ints are 24-bit (−8,388,608 to 8,388,607) and wrap."),
      f("float", ["x"], "Converts to float (single precision, about 7 digits). Printing always shows 6 decimals."),
      f("str", ["x"], "Converts to str. Strings built with `+`, `str()` and `input()` are only freed when the program ends."),
      { ...f("range", ["start", "stop"], "Counts for a `for` loop. Takes one or two arguments; there is no step."), sig: "range([start,] stop)", insert: "range(${1:start}, ${2:stop})" },
    ],
  },
  {
    group: "math",
    entries: [f("math.sqrt", ["x"], "Square root. Needs `import math`. Returns a float.")],
  },
  {
    group: "random",
    entries: [
      f("random.seed", ["n"], "Seeds the generator. Without it you get the same numbers every run. Needs `import random`."),
      f("random.randint", ["a", "b"], "Random whole number from a to b, both ends included."),
      f("random.random", [], "Random float from 0 to 1."),
    ],
  },
  {
    group: "graphics — screen and drawing",
    entries: [
      f("graphics.init", [], "Starts palettized graphics (gfx_Begin + gfx_SetDrawBuffer)."),
      f("graphics.end", [], "Puts graphics back to normal. Call it before the program ends."),
      f("graphics.swap", [], "Swaps the draw buffer with the onscreen display (gfx_SwapDraw)."),
      f("graphics.fill", ["color"], "Fills the whole screen with a palette index (0–255)."),
      f("graphics.color", ["color"], "Sets the drawing color index for shapes and lines."),
      f("graphics.set_rgb", ["idx", "r", "g", "b"], "Assigns a custom RGB color to a palette index."),
      f("graphics.rect", ["x", "y", "w", "h"], "Draws an unfilled rectangle."),
      f("graphics.circle", ["x", "y", "r"], "Draws an unfilled circle."),
      f("graphics.line", ["x1", "y1", "x2", "y2"], "Draws a straight line."),
      f("graphics.text", ["str", "x", "y"], "Draws text at (x, y). Accepts expressions like `\"SCORE \" + str(score)`."),
      f("graphics.text_color", ["color"], "Sets the text color."),
    ],
  },
  {
    group: "graphics — sprites",
    entries: [
      f("graphics.sprite", ["w", "h", "data"], "Makes a sprite from a list variable of w*h palette indices (up to 255×255). The list must be a variable, not written inline. Make sprites once, not every frame."),
      f("graphics.draw", ["s", "x", "y"], "Draws a sprite. Clipped, so drawing partly off-screen is safe."),
      f("graphics.draw_t", ["s", "x", "y"], "Draws a sprite, skipping the transparent color."),
      f("graphics.transparent", ["color"], "Sets which palette index is see-through for `draw_t` and `scale_t`."),
      f("graphics.scale", ["s", "x", "y", "sw", "sh"], "Draws a sprite sw× wider and sh× taller. Not clipped: skipped if it won't fit."),
      f("graphics.scale_t", ["s", "x", "y", "sw", "sh"], "Like `scale`, with transparency."),
      f("graphics.flip_x", ["s"], "Returns a new sprite flipped left to right."),
      f("graphics.flip_y", ["s"], "Returns a new sprite flipped top to bottom."),
      f("graphics.rotate", ["s"], "Returns a new sprite turned 90° clockwise."),
      f("graphics.get_sprite", ["x", "y", "w", "h"], "Copies a piece of the screen into a new sprite."),
      f("graphics.free", ["s"], "Frees a sprite's memory. Never call it on a sprite from `graphics.load`."),
      f("graphics.load", ['"name"'], "A sprite made by convimg, by its name in your `gfx` folder. Must be a plain string."),
      f("graphics.palette", ['"name"'], "Switches to a convimg palette. Call it right after `graphics.init()`."),
    ],
  },
  {
    group: "TI functions",
    entries: [
      f("os_ClrHome", [], "Clears the text home screen."),
      f("os_GetCSC", [], "Polls the keypad. Returns a key code, or 0 when nothing is pressed. Does not block."),
    ],
  },
];

export const PY_SNIPPETS: PySnippet[] = [
  { label: "graphics program", doc: "Draw once, wait for a key, exit.",
    body: "import graphics\n\ngraphics.init()\ngraphics.fill(${1:255})\n$0\ngraphics.swap()\nwhile os_GetCSC() == 0:\n    pass\ngraphics.end()" },
  { label: "def", doc: "Function. Types come from the first call; always pass the same kinds of values.", body: "def ${1:name}(${2:a}, ${3:b}):\n    $0\n    return ${4:0}" },
  { label: "if / elif / else", doc: "Conditional.", body: "if ${1:condition}:\n    $2\nelif ${3:condition}:\n    $4\nelse:\n    $0" },
  { label: "for range", doc: "Counted loop. range() has no step.", body: "for ${1:i} in range(${2:0}, ${3:10}):\n    $0" },
  { label: "while", doc: "While loop.", body: "while ${1:condition}:\n    $0" },
  { label: "try / except / finally", doc: "One except per try; no nesting. `raise` takes a number.", body: "try:\n    $1\nexcept:\n    $2\nfinally:\n    $0" },
  { label: "class", doc: "Classes are only partly supported: methods and attributes are very limited.", body: "class ${1:Name}:\n    pass" },
  { label: "fixed array", doc: "A constant size at the top of the program makes a fast fixed array (max 2000 items).", body: "${1:MAX} = ${2:50}\n${3:table} = [0] * ${1:MAX}" },
  { label: "sprite from list", doc: "Sprite data must be a list variable.", body: "${1:BALL} = [${2:0, 1, 1, 0}]\n${3:ball} = graphics.sprite(${4:2}, ${5:2}, ${1:BALL})" },
  { label: "wait for key", doc: "Blocks until a key is pressed.", body: "while os_GetCSC() == 0:\n    pass" },
];

export const PY_CATALOG: { group: string; entries: CatalogEntry[] }[] = [
  { group: "Snippets", entries: PY_SNIPPETS.map(s => ({ name: s.label, insert: s.body, hint: s.doc })) },
  ...PY_LIBRARY.map(g => ({
    group: g.group,
    entries: g.entries.map(e => ({ name: e.name, insert: e.insert, hint: `${e.sig} — ${e.doc}` })),
  })),
];

const MODULES = ["graphics", "math", "random"];
const FNS = new Map(PY_LIBRARY.flatMap(g => g.entries.map(e => [e.name, e] as const)));

// ── Editor features ────────────────────────────────────────────────────────

export function registerPy2ez80(): void {
  const { CompletionItemKind: Kind, CompletionItemInsertTextRule } = monaco.languages;
  const rules = CompletionItemInsertTextRule.InsertAsSnippet;

  monaco.languages.registerCompletionItemProvider("python", {
    triggerCharacters: ["."],
    provideCompletionItems(model, position) {
      const prefix = model.getValueInRange(new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column));
      const code = maskPy(prefix);
      // Inside an open string or after a comment marker: no suggestions.
      if ((prefix.match(/"/g)?.length ?? 0) % 2 === 1 || (prefix.match(/'/g)?.length ?? 0) % 2 === 1 || code.includes("#")) return { suggestions: [] };

      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);

      const member = /\b(graphics|math|random)\.\w*$/.exec(code);
      if (member) {
        const cut = member[1].length + 1;
        return { suggestions: PY_LIBRARY.flatMap(g => g.entries).filter(e => e.name.startsWith(member[1] + ".")).map(e => ({
          label: e.name.slice(cut), kind: Kind.Function, detail: e.sig, documentation: { value: e.doc },
          insertText: e.insert.slice(cut), insertTextRules: rules, range,
        })) };
      }

      const top = PY_LIBRARY.flatMap(g => g.entries).filter(e => !e.name.includes("."));
      return { suggestions: [
        ...top.map(e => ({
          label: e.name, kind: Kind.Function, detail: e.sig, documentation: { value: e.doc },
          insertText: e.insert, insertTextRules: rules, range, sortText: "1" + e.name,
        })),
        ...MODULES.map(m => ({ label: m, kind: Kind.Module, insertText: m, range, sortText: "1" + m })),
        ...PY_SNIPPETS.map(s => ({
          label: s.label, kind: Kind.Snippet, detail: "Snippet", documentation: { value: s.doc },
          insertText: s.body, insertTextRules: rules, range, sortText: "2" + s.label,
        })),
      ] };
    },
  });

  monaco.languages.registerHoverProvider("python", {
    provideHover(model, pos) {
      const line = model.getLineContent(pos.lineNumber);
      for (const m of line.matchAll(/\b(?:(?:graphics|math|random)\.)?[A-Za-z_]\w*/g)) {
        const start = m.index! + 1, end = start + m[0].length;
        if (pos.column < start || pos.column > end) continue;
        const fn = FNS.get(m[0]);
        if (!fn) return null;
        return {
          range: new monaco.Range(pos.lineNumber, start, pos.lineNumber, end),
          contents: [{ value: "```python\n" + fn.sig + "\n```" }, { value: fn.doc }],
        };
      }
      return null;
    },
  });

  monaco.languages.registerSignatureHelpProvider("python", {
    signatureHelpTriggerCharacters: ["(", ","],
    signatureHelpRetriggerCharacters: [","],
    provideSignatureHelp(model, pos) {
      const text = maskPy(model.getLineContent(pos.lineNumber)).slice(0, pos.column - 1);
      const calls: { at: number; commas: number }[] = [];
      for (let i = 0; i < text.length; i++) {
        if (text[i] === "(") calls.push({ at: i, commas: 0 });
        else if (text[i] === ")") calls.pop();
        else if (text[i] === "," && calls.length) calls[calls.length - 1].commas++;
      }
      const call = calls[calls.length - 1];
      if (!call) return null;
      const name = /((?:graphics|math|random)\.\w+|[A-Za-z_]\w*)$/.exec(text.slice(0, call.at))?.[1];
      const fn = name ? FNS.get(name) : undefined;
      if (!fn || !fn.params.length) return null;

      const offsets: [number, number][] = [];
      let label = fn.name + "(";
      fn.params.forEach((p, i) => {
        if (i) label += ", ";
        offsets.push([label.length, label.length + p.length]);
        label += p;
      });
      label += ")";
      return {
        value: {
          signatures: [{
            label, documentation: { value: fn.doc },
            parameters: offsets.map(range => ({ label: range })),
          }],
          activeSignature: 0,
          activeParameter: Math.min(call.commas, fn.params.length - 1),
        },
        dispose() {},
      };
    },
  });
}

// ── Diagnostics ────────────────────────────────────────────────────────────

/** Blank out strings and comments, keeping column positions. */
export function maskPy(line: string): string {
  return line
    .replace(/"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?/g, m => " ".repeat(m.length))
    .replace(/#.*$/, m => " ".repeat(m.length));
}

/** Number of top-level arguments of the call whose "(" is at `open`. */
function argCount(code: string, open: number): number {
  let depth = 0, commas = 0, any = false;
  for (let i = open + 1; i < code.length; i++) {
    const ch = code[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") { if (depth === 0) return any ? commas + 1 : 0; depth--; }
    else if (ch === "," && depth === 0) commas++;
    if (!/\s/.test(ch)) any = true;
  }
  return any ? commas + 1 : 0;
}

/** Flags the Python that py2ez80's documentation lists as unsupported or surprising. */
export function analyzePy(lines: string[]): Marker[] {
  const markers: Marker[] = [];
  const report = (severity: number, line: number, start: number, length: number, message: string) =>
    markers.push({ severity, message, startLineNumber: line, startColumn: start + 1, endLineNumber: line, endColumn: start + 1 + Math.max(1, length), source: SOURCE });

  const scopes: { indent: number; kind: "def" | "class" }[] = [];
  const tries: number[] = [];

  lines.forEach((raw, i) => {
    const line = i + 1;
    const code = maskPy(raw);
    if (!code.trim()) return;
    const indent = raw.length - raw.trimStart().length;

    while (scopes.length && scopes[scopes.length - 1].indent >= indent) scopes.pop();
    const isHandler = /^\s*(?:except|finally)\b/.test(code);
    while (tries.length && (indent < tries[tries.length - 1] || (indent === tries[tries.length - 1] && !isHandler))) tries.pop();

    const def = /^\s*def\s+\w+\s*\(([^)]*)\)/.exec(code);
    if (def) {
      const open = code.indexOf("(", def.index);
      if (scopes.some(s => s.kind === "def")) report(Severity.Error, line, code.indexOf("def"), 3, "Functions inside functions aren't supported.");
      if (def[1].includes("="))
        report(Severity.Error, line, open + 1, def[1].length, "Default arguments aren't supported. Pass every argument.");
      if (def[1].includes("*"))
        report(Severity.Error, line, open + 1, def[1].length, "*args and **kwargs aren't supported.");
      scopes.push({ indent, kind: "def" });
    } else if (/^\s*class\b/.test(code)) {
      scopes.push({ indent, kind: "class" });
    } else {
      for (const m of code.matchAll(/\*\*/g)) report(Severity.Error, line, m.index!, 2, "`**` isn't supported yet. Multiply instead.");
    }

    const loop = /^\s*for\s+\w+\s+in\s+(.*?)\s*:?\s*$/.exec(code);
    if (loop) {
      if (!/^range\s*\(/.test(loop[1]))
        report(Severity.Error, line, code.lastIndexOf(loop[1]), loop[1].length, "for loops only work with range(). Use for i in range(len(x)).");
    } else {
      for (const m of code.matchAll(/\b(?:not\s+)?in\b/g)) report(Severity.Error, line, m.index!, m[0].length, "`in` isn't supported outside for … in range().");
    }

    for (const m of code.matchAll(/\bis\b/g)) report(Severity.Error, line, m.index!, 2, "`is` isn't supported. Use ==.");
    for (const m of code.matchAll(/\blambda\b/g)) report(Severity.Error, line, m.index!, 6, "lambda isn't supported.");

    if (!/^\s*(?:if|elif)\b/.test(code)) {
      const t = /\bif\b.*\belse\b/.exec(code);
      if (t) report(Severity.Error, line, t.index, t[0].length, "One-line x if y else z isn't supported yet. Use an if block.");
    }

    for (const m of code.matchAll(/\b\w+\s*\[[^\]]*\]\s*(?:\/\/|[-+*/%])=/g))
      report(Severity.Error, line, m.index!, m[0].length, "x[i] += … isn't supported. Write x[i] = x[i] + ….");

    for (const m of code.matchAll(/\brange\s*\(/g)) {
      if (argCount(code, m.index! + m[0].length - 1) > 2)
        report(Severity.Error, line, m.index!, 5, "range() takes one or two arguments. There is no step.");
    }

    const exc = /^\s*except\b(.*?):/.exec(code);
    if (exc) {
      const at = code.indexOf("except");
      if (/\bas\b/.test(exc[1])) report(Severity.Error, line, at, code.indexOf(":") - at, "except … as e isn't supported.");
      else if (exc[1].trim()) report(Severity.Info, line, at, code.indexOf(":") - at, "The exception name is ignored: every except catches everything.");
    }

    const raise = /^\s*raise\b\s*(.*)$/.exec(code);
    if (raise && !/^\d+\s*$/.test(raise[1]))
      report(Severity.Warning, line, code.indexOf("raise"), 5, "raise takes a number (an error code), like raise 1.");

    if (/^\s*try\s*:/.test(code)) {
      if (tries.length) report(Severity.Warning, line, code.indexOf("try"), 3, "Nested try blocks share one jump point and don't work reliably.");
      tries.push(indent);
    } else if (tries.length && /^\s*return\b/.test(code)) {
      report(Severity.Warning, line, code.indexOf("return"), 6, "Avoid return inside try: all try blocks share one jump point.");
    }

    const brace = /[{}]/.exec(code);
    if (brace) report(Severity.Warning, line, brace.index, 1, "dict and set only parse into stubs (NULL); they aren't real hash maps.");

    for (const m of code.matchAll(/(?<![\w.])\d+(?![\w.])/g)) {
      if (Number(m[0]) > 8_388_607)
        report(Severity.Warning, line, m.index!, m[0].length, "ints are 24-bit (up to 8,388,607) and wrap around. Use a float for bigger values.");
    }
  });

  return markers;
}

/** Re-run the checks shortly after the model stops changing. */
export function watchPython(model: monaco.editor.ITextModel): void {
  let timer: number | undefined;
  const run = () => {
    if (model.isDisposed()) return;
    monaco.editor.setModelMarkers(model, SOURCE, analyzePy(model.getLinesContent()));
  };
  model.onDidChangeContent(() => { window.clearTimeout(timer); timer = window.setTimeout(run, 250); });
  run();
}