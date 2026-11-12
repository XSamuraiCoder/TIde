// .tide/tide.json: the file in a project's .tide folder that tells TIde how to build it, what to run
// before running, what to send to the calculator and start, which calculator it's for, a few editor
// settings, and named scripts.
import type { Settings } from "./settings";

export const CONFIG_DIR = ".tide";
export const CONFIG_FILE = "tide.json";

export interface ProjectConfig {
  calculator?: "ce" | "plus";
  /** The program Run starts, without prgm. */
  program?: string;
  /** Build command line, such as "make" or "make debug". */
  build?: string;
  /** Steps run after building and before sending: command lines and calculator macros. */
  prerun?: string | string[];
  /** Steps run on the calculator after the program starts. */
  postrun?: string | string[];
  /** Files Run sends, relative to the project. */
  send?: string[];
  libraries?: boolean | string[];
  runIn?: "calculator" | "cemu";
  /** Named command lines, run from Scripts in the status bar. */
  scripts?: Record<string, string>;
  editor?: Partial<Settings>;
}

/** Calculator macros, usable as steps in prerun and postrun. */
export const MACROS = {
  "key.press": "Presses and releases a calculator key: enter, clear, 2nd, alpha, mode, del, math, apps, prgm, vars, stat, on, y=, window, zoom, trace, graph, up, down, left, right, a digit or an operator.",
  "key.type": "Types letters and digits, as with alpha: key.type(\"HELLO\").",
  "program.run": "Runs a program from the home screen: program.run(GAME). program.open is the same.",
  "program.open": "Same as program.run.",
  "app.open": "Opens an app from the apps menu by name: app.open(CabriJr).",
  "wait": "Waits a number of milliseconds: wait(500).",
} as const;
export type MacroName = keyof typeof MACROS;
export interface Macro { macro: MacroName; arg: string }
const MACRO_HELP = `Calculator macros: ${Object.keys(MACROS).map(m => `${m}(…)`).join(", ")}. Anything else is a command line.`;
const STEPS = { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] };

/** A step: a calculator macro such as key.press(enter), or null for a command line. */
export function parseMacro(step: string): Macro | null {
  const m = /^\s*([a-z]+(?:\.[a-z]+)?)\s*\((.*)\)\s*$/i.exec(step);
  if (!m) return null;
  const name = m[1].toLowerCase() as MacroName;
  if (!(name in MACROS)) {
    if (/^(?:key|program|app)\./i.test(m[1]) || m[1].toLowerCase() === "wait") throw new Error(`Unknown macro ${m[1]}. Macros: ${Object.keys(MACROS).join(", ")}.`);
    return null;
  }
  return { macro: name, arg: m[2].trim().replace(/^(["'])(.*)\1$/, "$2") };
}
export const steps = (value: string | string[] | undefined) => (value === undefined ? [] : Array.isArray(value) ? value : [value]).filter(s => s.trim());

/** JSON Schema for the editor: completions, hover help and checking while editing tide.json. */
export const CONFIG_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "TIde project",
  type: "object",
  additionalProperties: false,
  properties: {
    calculator: { enum: ["ce", "plus"], description: "The calculator this project is for: \"ce\" for the TI-84 Plus CE, \"plus\" for the TI-84 Plus. Sets TI-BASIC's screen checks and commands." },
    program: { type: "string", description: "The program ▶ Run starts, without prgm, such as \"MYGAME\". Leave it out to start the first .8xp sent, or set \"\" to only send." },
    build: { type: "string", description: "The command line Build (Ctrl+E) runs, and Run runs first, in the project folder. Without it, a folder with a Makefile runs make.", examples: ["make", "make debug", "make V=1"] },
    prerun: { ...STEPS, description: `Steps ▶ Run takes after building and before sending: command lines run in the project folder, and calculator macros. If a step fails, nothing is sent. ${MACRO_HELP}`,
      examples: ["make gfx", ["python tools/pack.py", "app.open(AsmHook2)", "key.press(enter)"]] },
    postrun: { ...STEPS, description: `Steps ▶ Run takes after starting the program, such as pressing keys in it. ${MACRO_HELP}`,
      examples: [["wait(1000)", "key.press(2nd)", "key.type(\"HELLO\")"]] },
    send: {
      type: "array", items: { type: "string" },
      description: "Files ▶ Run sends to the calculator after building, relative to the project. * and ? match within a name, as in bin/*.8xp.",
      default: ["bin/*.8xp", "bin/*.8xv"],
    },
    libraries: {
      anyOf: [{ type: "boolean" }, { type: "array", items: { type: "string" } }],
      description: "Libraries sent first, once per calculator session: true finds clibs.8xg in the project or the CE toolchain, false sends none, or list the files.",
      default: true,
    },
    runIn: { enum: ["calculator", "cemu"], description: "Where ▶ Run goes: TIde's calculator, or the CEmu app.", default: "calculator" },
    scripts: {
      type: "object",
      description: "Command lines you can run from Scripts in the status bar, by name. Their output goes to the Output tab.",
      additionalProperties: { type: "string" },
      examples: [{ clean: "make clean", debug: "make debug" }],
    },
    editor: {
      type: "object",
      additionalProperties: false,
      description: "Editor settings for this project, used instead of yours while it's open.",
      properties: {
        fontSize: { type: "number", minimum: 9, maximum: 28, description: "Font size in pixels." },
        tabSize: { enum: [2, 4, 8], description: "Spaces per indent in C, Python and other files." },
        wordWrap: { type: "boolean", description: "Wrap long lines." },
        minimap: { type: "boolean", description: "Show the minimap." },
        renderWhitespace: { enum: ["none", "boundary", "all"], description: "Draw spaces and tabs." },
        showRuler: { type: "boolean", description: "Mark the TI-BASIC screen width." },
        fallbackEncoding: { type: "string", description: "Encoding for text that isn't UTF-8 or UTF-16, such as \"windows-1252\"." },
        sendClibs: { type: "boolean", description: "Send clibs.8xg with C projects." },
      },
    },
  },
};

export const CONFIG_TEMPLATE = `{
  // How TIde builds and runs this project. Hover a name for help, or press Ctrl+Space for options.
  "calculator": "ce",
  "build": "make",
  "prerun": [],
  "postrun": [],
  "send": ["bin/*.8xp", "bin/*.8xv"],
  "libraries": true,
  "runIn": "calculator",
  "scripts": {
    "clean": "make clean"
  }
}
`;

/** JSON that may have line and block comments and trailing commas. */
export function parseJsonc(text: string): unknown {
  let out = "", inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inString) {
      out += c;
      if (c === "\\") out += text[++i] ?? "";
      else if (c === '"') inString = false;
    } else if (c === '"') { inString = true; out += c; }
    else if (c === "/" && next === "/") { while (i < text.length && text[i] !== "\n") i++; out += "\n"; }
    else if (c === "/" && next === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++; i++; }
    else out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

/** Checks the shape loosely so a typo can't break TIde; the editor's schema gives the detailed errors. */
export function readConfig(text: string): ProjectConfig {
  const raw = parseJsonc(text);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("tide.json must be an object: { … }.");
  const c = raw as ProjectConfig;
  if (c.build !== undefined && typeof c.build !== "string") throw new Error("\"build\" is a command line, such as \"make\".");
  for (const key of ["prerun", "postrun"] as const) {
    const v = c[key];
    if (v !== undefined && typeof v !== "string" && !(Array.isArray(v) && v.every(s => typeof s === "string"))) {
      throw new Error(`"${key}" is a command line or a list of steps, such as ["app.open(AsmHook2)", "key.press(enter)"].`);
    }
    steps(v).forEach(parseMacro); // reports unknown macros now, not halfway through a run
  }
  if (c.scripts !== undefined && (typeof c.scripts !== "object" || Object.values(c.scripts).some(v => typeof v !== "string"))) {
    throw new Error("\"scripts\" maps names to command lines, such as { \"clean\": \"make clean\" }.");
  }
  return c;
}

/** Splits a command line into the program and its arguments. Double or single quotes group words. */
export function splitCommand(line: string): { command: string; args: string[] } {
  const words: string[] = [];
  for (const m of line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)) words.push(m[1] ?? m[2] ?? m[3]);
  if (!words.length) throw new Error("The command line is empty.");
  return { command: words[0], args: words.slice(1) };
}

/** A file pattern relative to the project: the folder part is literal, * and ? match within a name. */
export function splitPattern(pattern: string): { dir: string; match: RegExp } {
  const parts = pattern.replace(/\\/g, "/").split("/");
  const name = parts.pop()!;
  const re = new RegExp(`^${name.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`, "i");
  return { dir: parts.join("/"), match: re };
}
