// Pure analysis of a TI-BASIC program: block structure, labels, and problems.
// No Monaco runtime dependency, so it is easy to test.
import { COMMANDS, TOKEN_RE, bare, mask } from "./commands";
import { TARGETS, getTarget } from "./target";

export const Severity = { Hint: 1, Info: 2, Warning: 4, Error: 8 } as const;

export interface Marker {
  severity: number; message: string;
  startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number;
  source: string;
}
export interface Block { open: number; close: number; kind: string }
export interface Ref { name: string; line: number; column: number }
export interface Analysis { markers: Marker[]; blocks: Block[]; labels: Ref[]; gotos: Ref[] }

const KNOWN = [...new Set(COMMANDS.map(c => bare(c.name)))];
// Real commands that aren't in the command table yet. They are accepted, never flagged as typos.
const ALSO_VALID = `sin cos tan sinh cosh tanh ln log rand randM randNorm randBin cumSum prod median stdDev variance gcd lcm
det identity rowSwap conj real imag angle sqrt cubert nCr nPr solve nDeriv fnInt fMin fMax seq SortA SortD ClrList ClrAllLists
Horizontal Vertical Shade DrawF DrawInv Table DispTable Send Get getDate getTime Archive UnArchive Func Param Pol Full Float
Fix Radian Degree Normal Sci Eng Connected Dot Sequential Simul ExprOn ExprOff ZStandard ZoomFit ZoomStd ZSquare GridOn GridOff
AxesOn AxesOff LabelOn LabelOff StoreGDB RecallGDB StorePic RecallPic Equ String ClrTable Asm Real Matr List`.split(/\s+/);
const KNOWN_SET = new Set([...KNOWN, ...ALSO_VALID]);
const VARIABLE = /^[A-Zθ0-9]+$/;                  // A–Z, θ, L1, Y1…, and implicit products like AB
const BUILTIN = /^(?:Ans|[eni]|Xmin|Xmax|Ymin|Ymax|Xscl|Yscl|Str[0-9]|Pic[0-9]|GDB[0-9]|prgm.+)$/;
const LABEL = /^\s*([A-Zθ0-9]+)/;
const OPENERS = new Set(["For", "While", "Repeat", "Then"]);

function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** A known command within a small edit distance, so real-but-unlisted commands aren't flagged. */
function nearest(word: string): string | undefined {
  if (word.length < 3) return undefined;
  const limit = Math.max(1, Math.floor(word.length / 4));
  return KNOWN.find(k => distance(word, k) <= limit);
}

/** Top-level comma-separated arguments of the call that starts at `from` (just after "("). */
function splitArgs(raw: string, from: number): { text: string; start: number }[] {
  const args: { text: string; start: number }[] = [];
  let depth = 0, quoted = false, start = from;
  for (let i = from; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') quoted = !quoted;
    if (quoted) continue;
    if (ch === "(") depth++;
    else if (ch === ")") {
      if (depth === 0) { args.push({ text: raw.slice(start, i), start }); return args; }
      depth--;
    } else if (ch === "," && depth === 0) {
      args.push({ text: raw.slice(start, i), start });
      start = i + 1;
    }
  }
  args.push({ text: raw.slice(start), start });
  return args;
}

/** The allowed [first, last] of each leading screen-position argument, for the current target. */
function positionLimits(word: string): [string, number, number][] | undefined {
  const t = TARGETS[getTarget()];
  if (word === "Output") return [["Row", 1, t.rows], ["Column", 1, t.cols]];
  if (word === "Text" || word === "Pxl-On" || word === "Pxl-Off" || word === "Pxl-Change") {
    return [["Pixel row", 0, t.pixelRows - 1], ["Pixel column", 0, t.pixelCols - 1]];
  }
  return undefined;
}

export function analyze(lines: string[]): Analysis {
  const markers: Marker[] = [];
  const blocks: Block[] = [];
  const labels: Ref[] = [];
  const gotos: Ref[] = [];
  const stack: { kind: string; line: number; column: number; end: number }[] = [];

  const report = (severity: number, line: number, column: number, end: number, message: string) =>
    markers.push({ severity, message, startLineNumber: line, startColumn: column, endLineNumber: line, endColumn: end, source: "TIde" });

  lines.forEach((raw, i) => {
    const line = i + 1;
    const code = mask(raw);

    let depth = 0;
    for (let c = 0; c < code.length; c++) {
      if (code[c] === "(") depth++;
      else if (code[c] === ")") {
        if (depth === 0) report(Severity.Error, line, c + 1, c + 2, "Closing parenthesis without an opening one.");
        else depth--;
      }
    }

    for (const m of code.matchAll(TOKEN_RE)) {
      const word = m[0], col = m.index! + 1, end = col + word.length;
      const after = code.slice(m.index! + word.length);

      if (OPENERS.has(word)) { stack.push({ kind: word, line, column: col, end }); continue; }

      // Only plain numbers can be checked. Text(-1,… (the CE's large font) shifts its arguments, so it is skipped.
      const limits = after.startsWith("(") ? positionLimits(word) : undefined;
      if (limits) {
        const args = splitArgs(raw, m.index! + word.length + 1);
        if (!args[0]?.text.trim().startsWith("-")) limits.forEach(([what, first, last], a) => {
          const text = args[a]?.text.trim() ?? "";
          if (!/^\d+$/.test(text) || (+text >= first && +text <= last)) return;
          const at = args[a].start + args[a].text.indexOf(text) + 1;
          report(Severity.Warning, line, at, at + text.length, `${what} ${text} is off screen on the ${TARGETS[getTarget()].label} (${first}–${last}).`);
        });
      }

      switch (word) {
        case "Else":
          if (stack[stack.length - 1]?.kind !== "Then") report(Severity.Error, line, col, end, "Else belongs inside an If … Then block.");
          break;
        case "End": {
          const open = stack.pop();
          if (!open) report(Severity.Error, line, col, end, "End has no matching Then, For, While or Repeat.");
          else blocks.push({ open: open.line, close: line, kind: open.kind });
          break;
        }
        case "Lbl": case "Goto": {
          const name = LABEL.exec(after);
          if (!name) { report(Severity.Error, line, col, end, `${word} needs a label name.`); break; }
          const column = end + after.indexOf(name[1]);
          const ref = { name: name[1], line, column };
          if (word === "Goto") { gotos.push(ref); break; }
          if (name[1].length > 2) report(Severity.Error, line, column, column + name[1].length, "Labels are 1–2 characters.");
          if (labels.some(l => l.name === ref.name)) report(Severity.Warning, line, column, column + name[1].length, `Label ${ref.name} is already defined.`);
          labels.push(ref);
          break;
        }
        case "Menu": {
          if (!after.startsWith("(")) break;
          const args = splitArgs(raw, m.index! + word.length + 1);
          for (let a = 2; a < args.length; a += 2) {
            const text = args[a].text.trim();
            if (!text) continue;
            gotos.push({ name: text, line, column: args[a].start + (args[a].text.length - args[a].text.trimStart().length) + 1 });
          }
          break;
        }
        default:
          if (KNOWN_SET.has(word) || VARIABLE.test(word) || BUILTIN.test(word)) break;
          { const guess = nearest(word);
            if (guess) report(Severity.Warning, line, col, end, `Unknown name "${word}". Did you mean ${guess}?`); }
      }
    }
  });

  for (const open of stack) report(Severity.Error, open.line, open.column, open.end, `${open.kind} block is never closed. Add End.`);
  for (const g of gotos) {
    if (!labels.some(l => l.name === g.name)) report(Severity.Error, g.line, g.column, g.column + g.name.length, `There is no Lbl ${g.name} in this program.`);
  }
  return { markers, blocks, labels, gotos };
}