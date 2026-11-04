// Single source of truth for TI-BASIC commands. The tokenizer, completions, hover,
// signature help, catalog and diagnostics are all derived from this table.

export type Kind = "control" | "io" | "function";
export type Group = "Control" | "Screen and input" | "Drawing" | "Math";
export interface Param { name: string; doc: string; optional?: boolean }
export interface Command {
  name: string;          // as typed, e.g. "For(" or "Disp"
  kind: Kind;
  group: Group;
  doc: string;
  usage?: string;        // for commands without parentheses, e.g. "Goto label"
  params?: Param[];      // for commands written NAME(a,b,c)
  repeat?: number;       // the last N params repeat (Menu( takes text/label pairs)
}

const p = (name: string, doc: string, optional = false): Param => ({ name, doc, optional });
const def = (group: Group, kind: Kind) =>
  (name: string, doc: string, extra: Partial<Command> = {}): Command => ({ name, group, kind, doc, ...extra });
const ctl = def("Control", "control");
const io = def("Screen and input", "io");
const draw = def("Drawing", "io");
const fn = def("Math", "function");

export const COMMANDS: Command[] = [
  ctl("If", "Runs the next statement only when the condition is true. Followed by Then, it runs a block up to End.", { usage: "If condition" }),
  ctl("Then", "Opens a block after If. Close it with End."),
  ctl("Else", "Runs the other half of an If … Then block."),
  ctl("For(", "Counts the variable from start to end, running the loop body each time. Close with End.",
    { params: [p("variable", "Loop counter"), p("start", "First value"), p("end", "Last value"), p("step", "Amount added each time (default 1)", true)] }),
  ctl("While", "Repeats the block while the condition is true. Close with End.", { usage: "While condition" }),
  ctl("Repeat", "Repeats the block until the condition is true. Always runs once. Close with End.", { usage: "Repeat condition" }),
  ctl("End", "Closes a Then, For, While, or Repeat block."),
  ctl("Lbl", "Names a spot that Goto and Menu( can jump to. Labels are 1–2 characters.", { usage: "Lbl label" }),
  ctl("Goto", "Jumps to a Lbl in the same program.", { usage: "Goto label" }),
  ctl("Menu(", "Shows a menu and jumps to the label of the chosen item.",
    { params: [p("title", "Menu heading"), p("text", "Item text"), p("label", "Lbl to jump to")], repeat: 2 }),
  ctl("Pause", "Waits for Enter. With a value, shows it first.", { usage: "Pause [value]" }),
  ctl("Return", "Leaves this program and goes back to the caller."),
  ctl("Stop", "Ends this program and any program that called it."),
  ctl("DelVar", "Deletes a variable to free memory.", { usage: "DelVar variable" }),

  io("Disp", "Prints values on the home screen, one per line.", { usage: "Disp value[,value…]" }),
  io("Output(", "Prints at a position on the home screen.", { params: [p("row", "1–10"), p("column", "1–26"), p("value", "Text or number")] }),
  io("Input", "Asks for a value and stores it in the variable.", { usage: 'Input ["text",]variable' }),
  io("Prompt", "Asks for each listed variable, one at a time.", { usage: "Prompt variable[,variable…]" }),
  io("ClrHome", "Clears the home screen."),
  io("getKey", "The code of the key pressed, or 0 if none."),
  io("DispGraph", "Shows the graph screen."),

  draw("Line(", "Draws a line between two points.", { params: [p("x1", "Start x"), p("y1", "Start y"), p("x2", "End x"), p("y2", "End y"), p("erase", "0 erases the line", true)] }),
  draw("Circle(", "Draws a circle.", { params: [p("x", "Center x"), p("y", "Center y"), p("radius", "Radius")] }),
  draw("Text(", "Draws text at a pixel position.", { params: [p("row", "Pixel row"), p("column", "Pixel column"), p("text", "Text or number")] }),
  draw("Pxl-On(", "Turns a pixel on.", { params: [p("row", "Pixel row"), p("column", "Pixel column")] }),
  draw("Pxl-Off(", "Turns a pixel off.", { params: [p("row", "Pixel row"), p("column", "Pixel column")] }),
  draw("Pt-On(", "Plots a point in graph coordinates.", { params: [p("x", "X"), p("y", "Y"), p("mark", "1 dot, 2 box, 3 cross", true)] }),
  draw("ClrDraw", "Clears the graph screen."),

  fn("abs(", "Absolute value.", { params: [p("value", "Number")] }),
  fn("int(", "Rounds down to a whole number.", { params: [p("value", "Number")] }),
  fn("iPart(", "Drops the fractional part.", { params: [p("value", "Number")] }),
  fn("fPart(", "Keeps only the fractional part.", { params: [p("value", "Number")] }),
  fn("round(", "Rounds to a number of decimal places.", { params: [p("value", "Number"), p("digits", "Decimal places (default 9)", true)] }),
  fn("min(", "The smaller of two values.", { params: [p("a", "First value"), p("b", "Second value")] }),
  fn("max(", "The larger of two values.", { params: [p("a", "First value"), p("b", "Second value")] }),
  fn("randInt(", "A random whole number between two limits, inclusive.", { params: [p("lower", "Lowest"), p("upper", "Highest"), p("count", "How many numbers", true)] }),
  fn("sum(", "Adds up the items of a list.", { params: [p("list", "List"), p("start", "First item", true), p("end", "Last item", true)] }),
  fn("mean(", "Average of a list.", { params: [p("list", "List")] }),
  fn("length(", "Number of characters in a string.", { params: [p("string", "String")] }),
  fn("sub(", "Part of a string.", { params: [p("string", "String"), p("start", "First character (1 is the first)"), p("length", "Characters to take")] }),
  fn("inString(", "Position of a substring, or 0 if absent.", { params: [p("string", "String to search"), p("find", "Substring"), p("start", "Where to begin", true)] }),
  fn("expr(", "Evaluates a string as an expression.", { params: [p("string", "Expression text")] }),
  fn("dim(", "Size of a list or matrix.", { params: [p("list", "List or matrix")] }),
  fn("Fill(", "Sets every item of a list to one value.", { params: [p("value", "Value"), p("list", "List")] }),
  fn("augment(", "Joins two lists or matrices.", { params: [p("a", "First"), p("b", "Second")] }),
];

export const BLOCKS = [
  { label: "If … Then … End", doc: "Run several lines when a condition is true.", snippet: "If ${1:condition}\nThen\n$0\nEnd" },
  { label: "If … Then … Else … End", doc: "Choose between two blocks.", snippet: "If ${1:condition}\nThen\n$2\nElse\n$0\nEnd" },
  { label: "For( … End", doc: "Counted loop.", snippet: "For(${1:I},${2:1},${3:10})\n$0\nEnd" },
  { label: "While … End", doc: "Loop while a condition is true.", snippet: "While ${1:condition}\n$0\nEnd" },
  { label: "Repeat … End", doc: "Loop until a condition is true.", snippet: "Repeat ${1:condition}\n$0\nEnd" },
  { label: "Menu( with labels", doc: "A two-item menu and its Lbl targets.", snippet: 'Menu("${1:TITLE}","${2:ONE}",${3:A},"${4:TWO}",${5:B})\nLbl ${3:A}\n$0\nLbl ${5:B}' },
];

export const bare = (name: string) => name.replace(/\($/, "");
export const BY_NAME = new Map(COMMANDS.map(c => [bare(c.name), c]));
export const wordsOf = (kind: Kind) =>
  COMMANDS.filter(c => c.kind === kind).map(c => bare(c.name)).filter(n => /^[A-Za-z]+$/.test(n));

/** Command names with a hyphen can't be matched by a plain word rule. */
export const TOKEN_RE = /Pxl-(?:On|Off|Change)|Pt-(?:On|Off|Change)|[A-Za-zθ][A-Za-z0-9θ]*/g;

/** Blank out string contents so keywords inside "text" are ignored, keeping column positions. */
export const mask = (line: string) => line.replace(/"[^"]*"?/g, m => " ".repeat(m.length));

export function signature(c: Command) {
  let label = c.name;
  const ranges: [number, number][] = [];
  c.params?.forEach((param, i) => {
    const text = param.optional ? `[${param.name}]` : param.name;
    if (i > 0) label += ",";
    ranges.push([label.length, label.length + text.length]);
    label += text;
  });
  return { label: c.params ? label + (c.repeat ? ",…)" : ")") : label, ranges };
}

export const usage = (c: Command) => c.usage ?? signature(c).label;

/** Monaco snippet for a command: required parameters become tab stops. */
export function snippetFor(c: Command): string {
  const required = c.params?.filter(x => !x.optional);
  if (required?.length) return `${c.name}${required.map((x, i) => `\${${i + 1}:${x.name}}`).join(",")})`;
  return c.usage ? `${c.name} ` : c.name;
}