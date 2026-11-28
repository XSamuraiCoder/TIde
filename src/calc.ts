// The calculator panel. Three emulator cores, compiled to WebAssembly and built into TIde, run here:
// - CEmu's (WebCEmu) for the TI-84 Plus CE, which sends over the emulated USB link and launches
//   programs the way CEmu's --launch does;
// - TilEm's (TilEm) for the TI-73, 81, 82, 83, 83 Plus, 83 Plus SE, 84 Plus, 84 Plus SE, 85 and 86,
//   which runs a frame at a time on TIde's timer and sends files over its link at once;
// - Firebird's (firebird) for the TI-Nspire CX, which boots from a boot1 and flash image, runs a step
//   at a time on TIde's timer, and sends files over its emulated USB link.
// The model menu on the calculator bar picks one: the CE, the Nspire, or any ROM you've added for the
// others. All draw to the same canvas and share one keypad, relabelled for the TI-85 and 86 and the
// Nspire.
import { identifyCeRom, identifyRom, type RomInfo } from "./rominfo";
import { fs, type CalcFileList } from "./store";
import { connect, type Connected, type USBDeviceLike } from "./link";
import { DbusLink, detectModel, modelFamily } from "./dbus";
import { describeDevice } from "./evo";
import { chooseConnection } from "./connections";
import { openSerialPort } from "./serial";

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

/** Every TI file a calculator can receive. Bundles (.b84, .b83) are zips of 8x files. */
export const SEND_TYPES = [
  "8xp",
  "8xv",
  "8xl",
  "8xn",
  "8xm",
  "8xy",
  "8xg",
  "8xs",
  "8xd",
  "8xw",
  "8xc",
  "8xz",
  "8xt",
  "8ca",
  "8cg",
  "8ci",
  "8ek",
  "8xk",
  "8eu",
  "8pu",
  "8yu",
  "b84",
  "b83",
  "73p",
  "73l",
  "73n",
  "73g",
  "73k",
  "82p",
  "82l",
  "82n",
  "82m",
  "82g",
  "83p",
  "83l",
  "83n",
  "83m",
  "83g",
  "85p",
  "85s",
  "85l",
  "85n",
  "85m",
  "85g",
  "86p",
  "86s",
  "86l",
  "86n",
  "86m",
  "86g",
  "85b",
  "86b",
  "82b",
  "83b",
  "tns",
  "tno",
  "tnc",
];
const BUNDLE = /\.b8[34]$/i;
const SENDABLE = new RegExp(`\\.(?:${SEND_TYPES.join("|")})$`, "i");

export interface TiFile {
  name: string;
  bytes: Uint8Array;
}

/** The drag data of files and folders dragged from the Explorer: their paths, one per line. */
export const TREE_DRAG = "application/x-tide-paths";

/**
 * A copy of a TI variable file with every variable marked as archived, and its checksum updated.
 * The calculator only takes groups into archive memory ("file must be archived"), and many .8xg
 * files, clibs.8xg among them, are saved with the flag off.
 */
function archived(file: Uint8Array): Uint8Array {
  const out = file.slice();
  const view = new DataView(out.buffer);
  const end = out.length - 2; // the last two bytes are the checksum
  for (let at = 55; at + 17 <= end;) {
    // entries follow the 55-byte file header
    const headerLen = view.getUint16(at, true),
      dataLen = view.getUint16(at + 2, true);
    if (headerLen === 13) out[at + 14] = 0x80; // the flag byte, after type, name and version
    at += 2 + headerLen + 2 + dataLen;
  }
  let sum = 0;
  for (let i = 55; i < end; i++) sum = (sum + out[i]) & 0xffff;
  view.setUint16(end, sum, true);
  return out;
}

/** The files inside a bundle (a zip): stored or deflated entries, unpacked with the browser's own inflater. */
export async function unbundle(bundle: TiFile): Promise<TiFile[]> {
  const b = bundle.bytes,
    view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let end = b.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--; // end of central directory
  if (end < 0) throw new Error(`${bundle.name} isn't a valid bundle.`);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const out: TiFile[] = [];
  for (let i = 0; i < count; i++) {
    const method = view.getUint16(at + 10, true),
      size = view.getUint32(at + 20, true);
    const nameLen = view.getUint16(at + 28, true),
      extra = view.getUint16(at + 30, true),
      comment = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = new TextDecoder()
      .decode(b.subarray(at + 46, at + 46 + nameLen))
      .split("/")
      .pop()!;
    at += 46 + nameLen + extra + comment;
    if (!SENDABLE.test(name) || BUNDLE.test(name)) continue; // skips the bundle's metadata
    const start =
      local +
      30 +
      view.getUint16(local + 26, true) +
      view.getUint16(local + 28, true);
    const data = b.subarray(start, start + size);
    if (method === 0) out.push({ name, bytes: data.slice() });
    else if (method === 8) {
      const inflated = new Blob([data as BlobPart])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));
      out.push({
        name,
        bytes: new Uint8Array(await new Response(inflated).arrayBuffer()),
      });
    } else
      throw new Error(
        `${name} in ${bundle.name} uses an unsupported compression.`,
      );
  }
  return out;
}

interface WebCEmu {
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    unlink(path: string): void;
  };
  callMain(args: string[]): void;
  ccall(
    name: string,
    ret: string | null,
    types: string[],
    args: unknown[],
  ): unknown;
  _lcd_get_frame(): number;
  _emu_keypad_event(row: number, col: number, press: number): void;
  _emu_reset(): void;
  _sendKey(key: number): number;
  /** Emscripten's main loop controls. */
  pauseMainLoop?(): void;
}
interface TilEmModule {
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    unlink(path: string): void;
  };
  ccall(
    name: string,
    ret: string | null,
    types: string[],
    args: unknown[],
  ): unknown;
  UTF8ToString(ptr: number): string;
  HEAPU8: Uint8Array;
  _tilem_fps(): number;
  _tilem_frame(): void;
  _tilem_lcd(): number;
  _tilem_lcd_width(): number;
  _tilem_lcd_on(): number;
  _tilem_key(group: number, bit: number, down: number): void;
  _tilem_reset(): void;
  _tilem_programs(): number;
}
interface FirebirdEmu {
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
    unlink(path: string): void;
    mkdirTree(path: string): void;
  };
  ccall(
    name: string,
    ret: string | null,
    types: string[],
    args: unknown[],
  ): unknown;
  callMain?(args?: string[]): void;
  HEAPU8: Uint8Array;
  canvas?: HTMLCanvasElement;
  _malloc(size: number): number;
  _free?(ptr: number): void;
  _main?(argc?: number, argv?: number): number;
  _paintLCD?(ptr: number): void;
  _fb_start?(): number;
  _fb_step?(): void;
  _fb_paint?(ptr: number): void;
  _fb_key?(row: number, col: number, down: number): void;
  _fb_touch?(x: number, y: number, contact: number, down: number): void;
  _fb_reset?(): void;
  _fb_send?(localPtr: number, remotePtr: number): void;
  _fb_flash_dirty?(): number;
  _fb_save_flash?(): number;
}

type Factory<T> = (options: Record<string, unknown>) => Promise<T>;

/** TilEm's models, by the letter it names each one with. */
const TILEM_MODELS: Record<string, string> = {
  "7": "TI-73",
  "1": "TI-81",
  "2": "TI-82",
  "3": "TI-83",
  f: "TI-76.fr",
  p: "TI-83 Plus",
  s: "TI-83 Plus SE",
  "4": "TI-84 Plus",
  z: "TI-84 Plus SE",
  n: "TI-84 Plus (TI-Nspire)",
  "5": "TI-85",
  "6": "TI-86",
};
/** The TI-83 Plus and 84 Plus family, whose keypad is the CE's and which TIde starts programs on. */
const TILEM_PLUS = "psz4n";

/**
 * A key: label, position and optional keyboard keys. Positions are the CE's keypad matrix (group
 * and bit); the other models use the same layout, with group 7 − row, so one keypad serves all.
 */
interface Key {
  label: string;
  row: number;
  col: number;
  kbd?: string[];
  cls?: string;
  /** What shift or ctrl makes of it, written small above it (the Nspire's keys). */
  top?: string;
  /** What 2nd and alpha make of it, written above it on the left and right (the TI-84's keys). */
  second?: string;
  alpha?: string;
}
const k = (
  label: string,
  row: number,
  col: number,
  kbd?: string[],
  cls?: string,
): Key => ({ label, row, col, kbd, cls });
// Keyboard bindings are CEmu's default keymap (gui/qt/keypad/keymap.cpp): letters press the key that
// types them with alpha (A is math, B is apps…), so names can be typed as on the calculator.
const KEYPAD: Key[][] = [
  [
    k("y=", 1, 4, ["F1"], "fn"),
    k("window", 1, 3, ["F2"], "fn"),
    k("zoom", 1, 2, ["F3"], "fn"),
    k("trace", 1, 1, ["F4"], "fn"),
    k("graph", 1, 0, ["F5"], "fn"),
  ],
  [
    k("2nd", 1, 5, ["Tab", ";"], "second"),
    k("mode", 1, 6, ["Home", "Backspace"]),
    k("del", 1, 7, ["Delete", "Insert"]),
  ],
  [
    k("alpha", 2, 7, ["'"], "alpha"),
    k("X,T,θ,n", 3, 7, ["_"]),
    k("stat", 4, 7, ["End"]),
  ],
  [
    k("math", 2, 6, ["=", "a"]),
    k("apps", 3, 6, ["PageUp", "b"]),
    k("prgm", 4, 6, ["PageDown", "c"]),
    k("vars", 5, 6, ["<", "|"]),
    k("clear", 6, 6, ["Escape"]),
  ],
  [
    k("x⁻¹", 2, 5, ["\\", "d"]),
    k("sin", 3, 5, ["$", "e"]),
    k("cos", 4, 5, ["%", "f"]),
    k("tan", 5, 5, ["&", "g"]),
    k("^", 6, 5, ["^", "h"]),
  ],
  [
    k("x²", 2, 4, ["@", "i"]),
    k(",", 3, 4, [",", "j"]),
    k("(", 4, 4, ["(", "{", "k"]),
    k(")", 5, 4, [")", "}", "l"]),
    k("÷", 6, 4, ["/", "m"], "op"),
  ],
  [
    k("log", 2, 3, ["!", "n"]),
    k("7", 3, 3, ["7", "o"], "num"),
    k("8", 4, 3, ["8", "p"], "num"),
    k("9", 5, 3, ["9", "q"], "num"),
    k("×", 6, 3, ["*", "[", "r"], "op"),
  ],
  [
    k("ln", 2, 2, ["`", "s"]),
    k("4", 3, 2, ["4", "t"], "num"),
    k("5", 4, 2, ["5", "u"], "num"),
    k("6", 5, 2, ["6", "v"], "num"),
    k("−", 6, 2, ["-", "]", "w"], "op"),
  ],
  [
    k("sto→", 2, 1, [">", "x"]),
    k("1", 3, 1, ["1", "y"], "num"),
    k("2", 4, 1, ["2", "z"], "num"),
    k("3", 5, 1, ["3", "#"], "num"),
    k("+", 6, 1, ["+", '"'], "op"),
  ],
  [
    k("on", 2, 0, ["F12"]),
    k("0", 3, 0, ["0", " "], "num"),
    k(".", 4, 0, [".", ":"], "num"),
    k("(−)", 5, 0, ["~", "?"], "num"),
    k("enter", 6, 0, ["Enter"], "op"),
  ],
];
const ARROWS: Key[] = [
  k("▲", 7, 3, ["ArrowUp"]),
  k("◀", 7, 1, ["ArrowLeft"]),
  k("▶", 7, 2, ["ArrowRight"]),
  k("▼", 7, 0, ["ArrowDown"]),
];

// The TI-85 and 86 have the same matrix with other labels, and their letters on other keys.
const RELABEL_86: Record<string, [string, string[]]> = {
  "y=": ["F1", ["F1"]],
  window: ["F2", ["F2"]],
  zoom: ["F3", ["F3"]],
  trace: ["F4", ["F4"]],
  graph: ["F5", ["F5"]],
  mode: ["exit", ["Escape", "Home"]],
  del: ["more", ["End", "PageDown"]],
  "X,T,θ,n": ["x-var", ["_", "="]],
  stat: ["del", ["Delete", "Backspace"]],
  math: ["graph", ["Insert"]],
  apps: ["stat", ["PageUp"]],
  prgm: ["prgm", []],
  vars: ["custom", ["|"]],
  clear: ["clear", ["\\"]],
  "x⁻¹": ["log", ["!", "a"]],
  sin: ["sin", ["$", "b"]],
  cos: ["cos", ["%", "c"]],
  tan: ["tan", ["&", "d"]],
  "^": ["^", ["^", "e"]],
  "x²": ["ln", ["`", "f"]],
  ",": ["EE", ["g"]],
  "(": ["(", ["(", "{", "h"]],
  ")": [")", [")", "}", "i"]],
  "÷": ["÷", ["/", "j"]],
  log: ["x²", ["@", "k"]],
  "7": ["7", ["7", "l"]],
  "8": ["8", ["8", "m"]],
  "9": ["9", ["9", "n"]],
  "×": ["×", ["*", "[", "o"]],
  ln: [",", [",", "p"]],
  "4": ["4", ["4", "q"]],
  "5": ["5", ["5", "r"]],
  "6": ["6", ["6", "s"]],
  "−": ["−", ["-", "]", "t"]],
  "sto→": ["sto→", [">"]],
  "1": ["1", ["1", "u"]],
  "2": ["2", ["2", "v"]],
  "3": ["3", ["3", "w"]],
  "+": ["+", ["+", "x"]],
  "0": ["0", ["0", "y"]],
  ".": [".", [".", "z"]],
  "(−)": ["(−)", ["~", " "]],
};
// What 2nd and alpha make of each key, as printed above it on the TI-84 Plus CE (and the TI-83 Plus
// and 84 Plus, which share the keypad): [2nd, alpha]. Empty where the calculator prints nothing.
const SHIFTED_84: Record<string, [string, string]> = {
  "y=": ["stat plot", "f1"], window: ["tblset", "f2"], zoom: ["format", "f3"], trace: ["calc", "f4"], graph: ["table", "f5"],
  mode: ["quit", ""], del: ["ins", ""], alpha: ["A-lock", ""], "X,T,θ,n": ["link", ""], stat: ["list", ""],
  math: ["test", "A"], apps: ["angle", "B"], prgm: ["draw", "C"], vars: ["distr", ""],
  "x⁻¹": ["matrix", "D"], sin: ["sin⁻¹", "E"], cos: ["cos⁻¹", "F"], tan: ["tan⁻¹", "G"], "^": ["π", "H"],
  "x²": ["√", "I"], ",": ["EE", "J"], "(": ["{", "K"], ")": ["}", "L"], "÷": ["e", "M"],
  log: ["10ˣ", "N"], "7": ["u", "O"], "8": ["v", "P"], "9": ["w", "Q"], "×": ["[", "R"],
  ln: ["eˣ", "S"], "4": ["L4", "T"], "5": ["L5", "U"], "6": ["L6", "V"], "−": ["]", "W"],
  "sto→": ["rcl", "X"], "1": ["L1", "Y"], "2": ["L2", "Z"], "3": ["L3", "θ"], "+": ["mem", "\""],
  on: ["off", ""], "0": ["catalog", "␣"], ".": ["i", ":"], "(−)": ["ans", "?"], enter: ["entry", "solve"],
};
for (const key of KEYPAD.flat()) {
  const [second, alpha] = SHIFTED_84[key.label] ?? ["", ""];
  if (second) key.second = second;
  if (alpha) key.alpha = alpha;
}

const KEYPAD_86: Key[][] = KEYPAD.map((row) =>
  row.map((key) => {
    const [label, kbd] = RELABEL_86[key.label] ?? [key.label, key.kbd ?? []];
    return {
      ...key,
      // The TI-85 and 86 print other things above their keys: none are shown yet.
      second: undefined,
      alpha: undefined,
      label,
      kbd:
        key.label === "2nd" ||
        key.label === "alpha" ||
        key.label === "on" ||
        key.label === "enter"
          ? key.kbd
          : kbd,
    };
  }),
);

// ── The TI-Nspire CX's keyboard, laid out as on the calculator ──
// Each key by its place in Firebird's key matrix (its keymap.h: id = row × 11 + column, the row
// and column fb_key takes), with what shift or ctrl makes of it written above it, as on the
// calculator's own keys. The regions and their keys follow Firebird's Keypad.qml.
const nk = (id: number, label: string, kbd?: string[], cls?: string, top?: string): Key =>
  ({ label, row: Math.floor(id / 11), col: id % 11, kbd, cls, top });
/** The Nspire's keys, in the regions they sit in. */
const NS = {
  /** Beside the touchpad: esc, scratchpad, tab on the left; on, doc, menu on the right. */
  left: [nk(73, "esc", ["Escape"]), nk(65, "pad", [], "", "save"), nk(75, "tab", ["Tab"])],
  right: [nk(9, "⌂ on", ["F12", "Home"]), nk(69, "doc", ["PageUp"], "", "+page"), nk(71, "menu", ["PageDown", "F1"])],
  /** Under the touchpad: ctrl, shift and var on the left, del on the right. */
  bar: [nk(86, "ctrl", [], "ctrl"), nk(85, "shift", [], "shift", "CAPS"), nk(56, "var", ["Insert"], "", "sto→")],
  del: nk(64, "del", ["Backspace", "Delete"], "", "clear"),
  /** The math keys left of the number pad, in pairs. */
  math: [
    [nk(51, "=", ["="], "", "≠≥>"), nk(20, "trig", [], "", "?")],
    [nk(53, "^", ["^"], "", "ⁿ√x"), nk(31, "x²", ["@"], "", "√")],
    [nk(42, "eˣ", [], "", "ln"), nk(21, "10ˣ", [], "", "log")],
    [nk(60, "(", ["(", "["], "", "[ ]"), nk(58, ")", [")", "]"], "", "{ }")],
  ],
  /** The number pad. */
  num: [
    [nk(40, "7", ["7"], "num"), nk(72, "8", ["8"], "num"), nk(36, "9", ["9"], "num")],
    [nk(29, "4", ["4"], "num"), nk(61, "5", ["5"], "num"), nk(25, "6", ["6"], "num")],
    [nk(18, "1", ["1"], "num"), nk(70, "2", ["2"], "num"), nk(14, "3", ["3"], "num")],
    [nk(7, "0", ["0"], "num"), nk(59, ".", ["."], "num", "capture"), nk(3, "(−)", ["~"], "num", "ans")],
  ],
  /** The operators right of the number pad, in pairs, and enter. */
  ops: [
    [nk(63, "catalog", [], "", ":="), nk(62, "templates", [], "", "∞β°")],
    [nk(52, "×", ["*"], "op", "\"□\""), nk(41, "÷", ["/"], "op")],
    [nk(68, "+", ["+"], "op"), nk(57, "−", ["-"], "op")],
  ],
  enter: nk(1, "enter", ["Enter"], "op", "≈"),
  /** The letters, nine to a row, as on the calculator. */
  alpha: [
    [nk(30, "EE"), ...[..."ABCDEFG"].map((c, i) => nk([50, 49, 48, 46, 45, 44, 39][i], c, [c.toLowerCase()])), nk(8, "?!▸", ["?", "!"])],
    [nk(19, "π▸"), ...[..."HIJKLMN"].map((c, i) => nk([38, 37, 35, 34, 33, 28, 27][i], c, [c.toLowerCase()])), nk(66, "⚑")],
    [nk(87, ",", [","]), ...[..."OPQRSTU"].map((c, i) => nk([26, 24, 23, 22, 17, 16, 15][i], c, [c.toLowerCase()])), nk(0, "↵", ["F2"])],
    [...[..."VWXYZ"].map((c, i) => nk([13, 12, 11, 6, 5][i], c, [c.toLowerCase()])), nk(4, "space", [" "])],
  ],
};
/** Every Nspire key, for the keyboard bindings and key.press (calc.ts's layout()). */
const KEYPAD_NS: Key[][] = [
  NS.left, NS.right, [...NS.bar, NS.del], ...NS.math, ...NS.num, ...NS.ops, [NS.enter], ...NS.alpha,
];
/** The touchpad, by the engine's touch keys (row 8): up, left, right, down, and a click in the middle. */
const ARROWS_NS: Key[] = [
  k("▲", 8, 0, ["ArrowUp"]),
  k("◀", 8, 1, ["ArrowLeft"]),
  k("▶", 8, 2, ["ArrowRight"]),
  k("▼", 8, 3, ["ArrowDown"]),
  k("click", 8, 4),
];

interface Layout {
  keypad: Key[][];
  arrows: Key[];
  byKbd: Map<string, Key>;
  macro: Map<string, Key>;
}
function layout(keypad: Key[][], arrows: Key[] = ARROWS): Layout {
  const all = [...keypad.flat(), ...arrows];
  const byLabel = (label: string) =>
    all.find((key) => key.label.toLowerCase() === label);
  const aliases: [string, string][] = [
    ["yequ", "y="],
    ["sto", "sto→"],
    ["store", "sto→"],
    ["x^2", "x²"],
    ["square", "x²"],
    ["x^-1", "x⁻¹"],
    ["inverse", "x⁻¹"],
    ["neg", "(−)"],
    ["negative", "(−)"],
    ["-", "−"],
    ["*", "×"],
    ["/", "÷"],
    ["xtθn", "x,t,θ,n"],
    ["xton", "x,t,θ,n"],
    ["power", "^"],
    ["second", "2nd"],
    ["delete", "del"],
    ["up", "▲"],
    ["left", "◀"],
    ["right", "▶"],
    ["down", "▼"],
    ["f1", "f1"],
    ["f2", "f2"],
    ["f3", "f3"],
    ["f4", "f4"],
    ["f5", "f5"],
    ["xvar", "x-var"],
    ["return", "enter"],
    ["escape", "esc"],
    ["click", "⬤"],
  ];
  return {
    keypad,
    arrows,
    byKbd: new Map(
      all.flatMap((key) => (key.kbd ?? []).map((name) => [name, key] as const)),
    ),
    macro: new Map([
      ...all.map((key) => [key.label.toLowerCase(), key] as [string, Key]),
      ...aliases.flatMap(([alias, label]) => {
        const key = byLabel(label);
        return key ? [[alias, key] as [string, Key]] : [];
      }),
    ]),
  };
}
// ── Each TilEm model's keypad ──
// They all share the TI-84's grid of keys (and its keyboard bindings): a model's keypad is that
// grid with the model's own printed labels. Only what TI's guidebooks confirm is printed; what
// they don't stays blank rather than guessed. (Sources: the TI-83 Guidebook, 1996; the TI-82
// Guidebook, 1993; the TI-81 Guidebook, 1990; the TI-85 Graphics Calculator Guidebook, 1993.)
type Face = { label?: string; second?: string; alpha?: string };
/** `base` with `faces` over it, by each key's TI-84 label; `keep`: whether unlisted keys keep their labels above. */
function faced(base: Key[][], faces: Record<string, Face>, keep: boolean): Key[][] {
  return base.map(row => row.map(key => {
    const face = faces[key.label] ?? {};
    return {
      ...key,
      label: face.label ?? key.label,
      second: (face.second ?? (keep ? key.second : undefined)) || undefined,
      alpha: (face.alpha ?? (keep ? key.alpha : undefined)) || undefined,
    };
  }));
}

/** The TI-83: the TI-84's keys, but MATRX where APPS is, FINANCE above x⁻¹, and no F1–F5 or SOLVE. */
const KEYPAD_83 = faced(KEYPAD, {
  "y=": { alpha: "" }, window: { alpha: "" }, zoom: { alpha: "" }, trace: { alpha: "" }, graph: { alpha: "" },
  apps: { label: "matrx", second: "angle", alpha: "B" },
  "x⁻¹": { second: "finance" },
  enter: { alpha: "" },
}, true);

/** The TI-82: the TI-83's keys, with the 2nd functions and letters its guidebook gives. */
const KEYPAD_82 = faced(KEYPAD, {
  "y=": { second: "stat plot" }, window: { second: "tblset" }, zoom: { second: "format" }, trace: { second: "calc" }, graph: { second: "table" },
  mode: { second: "quit" }, del: { second: "ins" }, alpha: { second: "A-lock" }, "X,T,θ,n": { second: "link" }, stat: { second: "list" },
  math: { second: "test", alpha: "A" }, apps: { label: "matrx", alpha: "B" }, prgm: { second: "draw", alpha: "C" }, vars: { second: "y-vars" },
  "x⁻¹": { alpha: "D" }, sin: { second: "sin⁻¹", alpha: "E" }, cos: { second: "cos⁻¹", alpha: "F" }, tan: { second: "tan⁻¹", alpha: "G" }, "^": { second: "π", alpha: "H" },
  "x²": { second: "√", alpha: "I" }, ",": { second: "EE", alpha: "J" }, "(": { second: "{", alpha: "K" }, ")": { second: "}", alpha: "L" }, "÷": { alpha: "M" },
  log: { second: "10ˣ", alpha: "N" }, "7": { alpha: "O" }, "8": { alpha: "P" }, "9": { alpha: "Q" }, "×": { second: "[", alpha: "R" },
  ln: { second: "eˣ", alpha: "S" }, "4": { second: "L4", alpha: "T" }, "5": { second: "L5", alpha: "U" }, "6": { second: "L6", alpha: "V" }, "−": { second: "]", alpha: "W" },
  "sto→": { second: "rcl", alpha: "X" }, "1": { second: "L1", alpha: "Y" }, "2": { second: "L2", alpha: "Z" }, "3": { second: "L3", alpha: "θ" }, "+": { second: "mem" },
  on: { second: "off" }, "(−)": { second: "ans" }, enter: { second: "entry" },
}, false);

/** The TI-81: RANGE and MATRX, and the 2nd functions its guidebook names. */
const KEYPAD_81 = faced(KEYPAD, {
  window: { label: "range" }, apps: { label: "matrx" },
  "x⁻¹": { second: "abs" }, sin: { second: "sin⁻¹" }, cos: { second: "cos⁻¹" }, tan: { second: "tan⁻¹" }, "^": { second: "π" },
  "+": { second: "reset" }, enter: { second: "entry" },
}, false);

/** The TI-85 and 86: their own keys (KEYPAD_86), with the 2nd functions the TI-85 guidebook gives. */
const KEYPAD_8586 = faced(KEYPAD_86, {
  F1: { second: "M1" }, F2: { second: "M2" }, F3: { second: "M3" }, F4: { second: "M4" }, F5: { second: "M5" },
  exit: { second: "quit" }, more: { second: "mode" }, del: { second: "ins" },
  "+": { second: "mem" }, enter: { second: "entry" }, on: { second: "off" },
}, false);

const LAYOUT_CE = layout(KEYPAD),
  LAYOUT_8586 = layout(KEYPAD_8586),
  LAYOUT_83 = layout(KEYPAD_83),
  LAYOUT_82 = layout(KEYPAD_82),
  LAYOUT_81 = layout(KEYPAD_81),
  LAYOUT_NS = layout(KEYPAD_NS, ARROWS_NS);

/** How a binding reads in a tooltip. */
const keyName = (name: string) =>
  name === " "
    ? "Space"
    : name.length === 1
      ? name.toUpperCase()
      : name.replace(/^Page/, "Page ");

/** CE OS key codes used to launch a program, as CEmu's --launch does: clear, prgm, the name, enter. */
const KEY_ENTER = 0x05,
  KEY_CLEAR = 0x09,
  KEY_PRGM = 0xda;
const letterKey = (c: string) =>
  /[0-9]/.test(c)
    ? 0x8e + +c
    : /[A-Z]/.test(c)
      ? 0x9a + c.charCodeAt(0) - 65
      : c === "θ"
        ? 0xcc
        : 0;

/** A running emulator: the CE's (CEmu), another model's (TilEm) or the Nspire's (Firebird). */
interface Engine {
  kind: "cemu" | "tilem" | "firebird" | "usb" | "serial";
  /** The model's name, such as "TI-84 Plus". */
  model: string;
  /** "ce", "plus" (a TI-83 Plus or 84 Plus, which runs .8xp programs), "nspire" or "other". */
  family: "ce" | "plus" | "nspire" | "other";
  layout: Layout;
  /** The screen's size in pixels. */
  width: number;
  height: number;
  /** Copies the screen into `image`. Returns false while the screen is off. */
  frame(image: ImageData): boolean;
  key(key: Key, down: boolean): void;
  send(file: TiFile, label: string): Promise<void>;
  reset(): void;
  stop(): void;
  /** Starts a program by name, from the home screen. */
  launch(name: string): Promise<void>;
  /** Types text, as key.type does. */
  type(text: string): Promise<void>;
  /** Opens an app by name, as app.open does. */
  openApp(name: string): Promise<void>;
  /** Presses a key by name, as key.press does, where the engine does it itself (a real calculator). */
  press?(name: string): Promise<void>;
}

export interface Calc {
  /** Opens the panel; starts the emulator if its ROM is in place. */
  show(): Promise<void>;
  hide(): void;
  readonly visible: boolean;
  /** Whether the console under the calculator is shown. */
  consoleShown: boolean;
  /** Which kind of calculator is running, starting it if needed: null when it isn't set up. */
  family(): Promise<"ce" | "plus" | "nspire" | "other" | null>;
  /** Sends programs to the calculator and launches `launch` once they arrive. */
  /** Libraries (like clibs.8xg) are sent once per calculator session, before the programs. */
  run(files: TiFile[], launch: string, libs?: TiFile[]): Promise<void>;
  /** Runs a calculator macro from tide.json, such as key.press(enter). */
  macro(name: string, arg: string): Promise<void>;
  /** Sends any TI files, unpacking bundles. */
  send(files: TiFile[]): Promise<void>;
  /** The open project's "link" settings from tide.json: which cable it uses. */
  setLink(
    link: { via?: "usb" | "serial"; port?: string; model?: string } | undefined,
  ): void;
  /** Opens the connections popup and connects what's picked (switching to the real calculator). */
  connectReal(): Promise<void>;
  /** Ends the real calculator's connection. */
  disconnectReal(): Promise<void>;
}

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/** A real calculator rather than an emulator: a menu choice or an engine's kind. */
const isReal = (kind: string) =>
  kind === "real" || kind === "usb" || kind === "serial";

export function createCalc(opts: {
  say: (text: string) => void;
  pickRom: (label: string, extensions: string[]) => Promise<string | null>;
  pickFiles: () => Promise<string[]>;
  readFile: (path: string) => Promise<Uint8Array>;
  layout: () => void;
  /** A serial cable connected, for the Serial tab to show and send over. */
  serialConnected?: (link: DbusLink, portName: string) => void;
  /** The serial cable's connection ended. */
  serialDropped?: () => void;
  /** Gets every console line, for the Console tab in the panel under the editor. */
  onLog?: (text: string, kind: "out" | "err" | "info" | "emu") => void;
}): Calc {
  const ui = {
    panel: $("calc"),
    model: $<HTMLSelectElement>("calc-model"),
    state: $("calc-state"),
    setup: $("calc-setup"),
    setupText: $("calc-setup-text"),
    rom: $<HTMLButtonElement>("calc-rom"),
    connect: $<HTMLButtonElement>("calc-connect"),
    disconnect: $<HTMLButtonElement>("calc-disconnect"),
    screen: $("calc-screen"),
    lcd: $<HTMLCanvasElement>("calc-lcd"),
    area: $("calc-lcd-area"),
    send: $<HTMLButtonElement>("calc-send"),
    drop: $("calc-drop"),
    keypad: $("calc-keypad"),
    reset: $<HTMLButtonElement>("calc-reset"),
    reload: $<HTMLButtonElement>("calc-reload"),
    close: $<HTMLButtonElement>("calc-close"),
    consoleToggle: $<HTMLButtonElement>("calc-console-toggle"),
    console: $("calc-console"),
    log: $("calc-console-log"),
    consoleClear: $<HTMLButtonElement>("calc-console-clear"),
  };

  // ── Console: the emulator's output (dbg_printf from C programs, emulator messages) and TIde's own steps ──
  const CONSOLE_PREF = "tide-pref-calc-console"; // not "tide:", which the browser store treats as a program
  function log(text: string, kind: "out" | "err" | "info" | "emu" = "out") {
    opts.onLog?.(text, kind);
    if (!ui.log) return;
    const atEnd =
      ui.log.scrollTop + ui.log.clientHeight >= ui.log.scrollHeight - 4;
    const line = document.createElement("div");
    line.className = `line ${kind}`;
    line.textContent = text;
    ui.log.append(line);
    while (ui.log.childElementCount > 2000) ui.log.firstElementChild!.remove();
    if (atEnd) ui.log.scrollTop = ui.log.scrollHeight;
  }
  /** Status bar and console. */
  const say = (text: string) => {
    opts.say(text);
    log(text, "info");
  };
  function showConsole(on: boolean) {
    if (ui.console) ui.console.hidden = !on;
    ui.consoleToggle.setAttribute("aria-pressed", String(on));
    try {
      localStorage.setItem(CONSOLE_PREF, on ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
    if (on && ui.log) ui.log.scrollTop = ui.log.scrollHeight;
  }
  let consoleOpen = true;
  try {
    consoleOpen = localStorage.getItem(CONSOLE_PREF) !== "0";
  } catch {
    /* storage unavailable */
  }
  showConsole(consoleOpen);
  ui.consoleToggle.addEventListener("click", () => {
    consoleOpen = !consoleOpen;
    showConsole(consoleOpen);
  });
  ui.consoleClear?.addEventListener("click", () => ui.log?.replaceChildren());

  let engine: Engine | null = null;
  let starting: Promise<boolean> | null = null;
  let drawing = false;
  // Firebird reports file-transfer progress through this global (its bridge calls it from C).
  let fbProgress: ((p: number) => void) | null = null;
  (window as unknown as Record<string, unknown>).tideFbProgress = (p: number) =>
    fbProgress?.(p);
  /** Saves the Nspire's flash image back to TIde's storage: its data folder, or the browser's. */
  const saveNspireFlash = (bytes: Uint8Array) => fs.calc.writeNspireFlash(bytes);
  // Libraries already on the calculator since it started, by name and size.
  const sentLibs = new Set<string>();

  // ── Screen ──
  // The emulator's frame goes to a small canvas the screen's own size, is blown up with hard pixel
  // edges to a whole multiple at least as large as it's shown, and the browser scales that down
  // smoothly. The LCD fills the room it has and stays sharp at any size.
  const frame = document.createElement("canvas");
  let fctx = frame.getContext("2d")!;
  let image = fctx.createImageData(320, 240);
  const ctx = ui.lcd.getContext("2d")!;
  const body = ui.screen;
  function setScreenSize(width: number, height: number) {
    if (frame.width === width && frame.height === height) return;
    frame.width = width;
    frame.height = height;
    fctx = frame.getContext("2d")!;
    image = fctx.createImageData(width, height);
    fit();
  }
  // The screen and the keypad are two panes of the same size: side by side when there is room,
  // stacked when the editor area is narrow. Each pane is as large as the space allows. When even
  // that leaves the keypad too small to use (a small window), it's hidden and the screen takes the
  // room; the computer's keyboard still drives the calculator.
  const GAP = 24,
    BEZEL = 28,
    KEYPAD_MIN = 260;
  function fit() {
    if (ui.panel.hidden) return;
    const dpr = window.devicePixelRatio || 1;
    const style = getComputedStyle(body);
    const w =
      body.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const h =
      body.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom);
    const stacked = w < 680;
    const paneW = stacked ? w : (w - GAP) / 2;
    const withKeypad = Math.min(
      stacked ? (h - GAP) / 2 : h,
      ((paneW - BEZEL) * 3) / 4 + BEZEL,
      760,
    );
    const keypad = withKeypad >= KEYPAD_MIN;
    const paneH = keypad
      ? withKeypad
      : Math.max(120, Math.min(h, ((w - BEZEL) * 3) / 4 + BEZEL, 760));
    const innerW = Math.floor(((paneH - BEZEL) * 4) / 3),
      innerH = Math.floor(paneH - BEZEL);
    body.classList.toggle("stacked", stacked);
    body.classList.toggle("no-keypad", !keypad);
    body.style.setProperty("--pane-w", `${innerW + BEZEL}px`);
    body.style.setProperty("--pane-h", `${Math.floor(paneH)}px`);
    // The screen keeps its own shape (4:3 on the CE, 3:2 or 2:1 on the others) inside the pane.
    const aspect = frame.width / frame.height;
    const cssW = Math.min(innerW, innerH * aspect),
      cssH = cssW / aspect;
    const k = Math.max(2, Math.ceil((cssW * dpr) / frame.width));
    ui.lcd.width = frame.width * k;
    ui.lcd.height = frame.height * k;
    ui.lcd.style.width = `${cssW}px`;
    ui.lcd.style.height = `${cssH}px`;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame, 0, 0, ui.lcd.width, ui.lcd.height);
  }
  const resize = new ResizeObserver(fit);
  resize.observe(ui.area);
  resize.observe(body);

  function drawOff(text = "LCD OFF") {
    // As CEmu shows it: a dark screen that says the LCD is off. Also the loading screen, while
    // an emulator core is being read, instantiated and booted (the Nspire's flash alone can be 132 MB).
    ctx.fillStyle = "#101418";
    ctx.fillRect(0, 0, ui.lcd.width, ui.lcd.height);
    ctx.fillStyle = "#8b9cbb";
    ctx.font = `600 ${Math.round(ui.lcd.height / 12)}px ${getComputedStyle(document.body).getPropertyValue("--ui")}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, ui.lcd.width / 2, ui.lcd.height / 2);
  }

  /** Each animation frame: copy the LCD to the canvas. */
  function draw() {
    if (!engine || isReal(engine.kind)) {
      drawing = false;
      return;
    }
    if (!ui.panel.hidden) {
      setScreenSize(engine.width, engine.height);
      const on = engine.frame(image);
      const state = on ? "running" : "LCD off";
      if (ui.state.textContent !== state) ui.state.textContent = state;
      if (on) {
        fctx.putImageData(image, 0, 0);
        ctx.drawImage(frame, 0, 0, ui.lcd.width, ui.lcd.height);
      } else drawOff();
    }
    requestAnimationFrame(draw);
  }

  // ── Keypad ──
  /** 2nd or alpha, pressed and waiting for the next key: the keypad lights that one's labels. */
  let armed: "2nd" | "alpha" | null = null;
  const arm = (next: "2nd" | "alpha" | null) => {
    armed = next;
    if (next) ui.keypad.dataset.armed = next;
    else delete ui.keypad.dataset.armed;
  };
  const press = (key: Key, down: boolean) => {
    if (down && shownLayout !== LAYOUT_NS) {
      // Pressing it again cancels it, as on the calculator; any other key uses it up.
      if (key.label === "2nd" || key.label === "alpha") arm(armed === key.label ? null : key.label);
      else arm(null);
    }
    engine?.key(key, down);
  };
  /** Presses and releases a key, waiting for the calculator to see both. */
  const tap = async (key: Key, hold = 120, after = 180) => {
    press(key, true);
    await sleep(hold);
    press(key, false);
    await sleep(after);
  };
  let shownLayout: Layout | null = null;
  function buildKeypad(l: Layout) {
    if (shownLayout === l) return;
    shownLayout = l;
    const button = (key: Key) => {
      const b = document.createElement("button");
      b.type = "button";
      // The Nspire's shift or ctrl function, small above its label on the key, as printed there.
      if (key.top) b.append(Object.assign(document.createElement("small"), { textContent: key.top }), Object.assign(document.createElement("span"), { textContent: key.label }));
      else b.textContent = key.label;
      b.className = `key ${key.cls ?? ""}`;
      const shifted = [key.second && `2nd: ${key.second}`, key.alpha && `alpha: ${key.alpha}`].filter(Boolean).join(", ");
      b.title = (key.kbd?.length
        ? `${key.label} (${key.kbd.map(keyName).join(" or ")})`
        : key.label) + (shifted ? ` · ${shifted}` : "");
      const release = () => {
        press(key, false);
        window.removeEventListener("pointerup", release);
      };
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        ui.lcd.focus();
        press(key, true);
        window.addEventListener("pointerup", release);
      });
      return b;
    };
    ui.keypad.classList.toggle("nspire", l === LAYOUT_NS);
    arm(null);
    if (l === LAYOUT_NS) { ui.keypad.replaceChildren(...nspireKeypad(button)); return; }
    /**
     * A key with what 2nd and alpha make of it printed on the body above it, as on the TI-84: the
     * 2nd function on the left, the alpha letter on the right. Every key gets the strip, so the
     * keys of a row line up whether or not they have labels.
     */
    const cell = (key: Key) => {
      const over = document.createElement("div");
      over.className = "key-over";
      over.append(
        Object.assign(document.createElement("span"), { className: "key-2nd", textContent: key.second ?? "" }),
        Object.assign(document.createElement("span"), { className: "key-alpha", textContent: key.alpha ?? "" }));
      const b = button(key);
      if (key.label === "2nd" || key.label === "alpha") b.dataset.modifier = key.label;
      const c = document.createElement("div");
      c.className = "key-cell";
      c.append(over, b);
      return c;
    };
    const arrows = document.createElement("div");
    arrows.className = "arrows";
    arrows.append(...l.arrows.map(button));
    ui.keypad.replaceChildren(
      ...l.keypad.map((row, i) => {
        const div = document.createElement("div");
        div.className = "keyrow";
        div.append(...row.map(cell));
        if (i === 1) div.append(arrows); // the arrow pad sits beside 2nd, mode and del
        return div;
      }),
    );
  }
  buildKeypad(LAYOUT_CE);

  /** The TI-Nspire CX's keyboard, laid out as on the calculator (NS, at the top of the file). */
  function nspireKeypad(button: (key: Key) => HTMLButtonElement): HTMLElement[] {
    const div = (className: string, ...kids: HTMLElement[]) => {
      const d = document.createElement("div");
      d.className = className;
      d.append(...kids);
      return d;
    };
    // The touchpad: a round pad, its edges up, left, right and down, its middle a click.
    const [up, left, right, down, click] = ARROWS_NS.map(key => {
      const b = button(key);
      b.classList.add(`ns-touch-${key.col}`);
      b.setAttribute("aria-label", key.col === 4 ? "Touchpad click" : `Touchpad ${["up", "left", "right", "down"][key.col]}`);
      if (key.col === 4) b.textContent = "";
      return b;
    });
    const touchpad = div("ns-touchpad", up, left, click, right, down);
    const pairs = (rows: Key[][]) => div("ns-pairs", ...rows.map(row => div("ns-pair", ...row.map(button))));
    return [
      div("ns-top", div("ns-side", ...NS.left.map(button)), touchpad, div("ns-side", ...NS.right.map(button))),
      div("ns-bar", ...NS.bar.map(button), div("ns-gap"), button(NS.del)),
      div("ns-middle",
        pairs(NS.math),
        div("ns-num", ...NS.num.flat().map(button)),
        div("ns-ops", pairs(NS.ops), (() => { const b = button(NS.enter); b.classList.add("ns-enter"); return b; })())),
      // The last row starts one place in (V under O) and ends one place short: nothing under the
      // comma or the return key, with space across the two places under T and U.
      div("ns-alpha", ...NS.alpha.flat().flatMap(key => {
        const b = button(key);
        if (key.label === "space") { b.classList.add("ns-space"); return [b, div("ns-blank")]; }
        return key.label === "V" ? [div("ns-blank"), b] : [b];
      })),
    ];
  }

  // The physical keyboard drives the calculator while its panel is open, with CEmu's bindings.
  // Keys typed into the editor or a form field still go there. A key is released by its physical
  // position, since Shift can change what it types in between.
  const held = new Map<string, Key>();
  const typingInField = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    return (
      !!t &&
      (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    );
  };
  window.addEventListener("keydown", (e) => {
    if (ui.panel.hidden || typingInField(e)) return;
    // Leave TIde's shortcuts alone, but let the Nspire's own ctrl key through.
    if ((e.ctrlKey || e.metaKey || e.altKey) && e.key !== "Control") return;
    const map = (engine?.layout ?? LAYOUT_CE).byKbd;
    const key = map.get(e.key) ?? map.get(e.key.toLowerCase());
    if (!key) return;
    e.preventDefault();
    e.stopPropagation(); // F5 is graph here, not Run
    if (e.repeat || held.has(e.code)) return;
    held.set(e.code, key);
    press(key, true);
  });
  window.addEventListener("keyup", (e) => {
    const key = held.get(e.code);
    if (!key) return;
    e.preventDefault();
    held.delete(e.code);
    press(key, false);
  });
  window.addEventListener("blur", () => {
    for (const key of held.values()) press(key, false);
    held.clear();
  });

  // ── Models and files: through fs.calc, which is the desktop app's data folder, or in the web
  // version the browser's storage ──
  type Files = CalcFileList;
  const files = () => fs.calc.files();
  const read = (name: string) => fs.calc.read(name);
  const MODEL_PREF = "tide-pref-calc-model",
    NAMES_PREF = "tide-pref-calc-rom-models";
  /** "ce:" and a CE ROM's name, "nspire", "real" (a real calculator), or "rom:" and another stored ROM's name. (A plain "ce" is from before TIde kept several CE ROMs.) */
  let choice = "ce";
  try {
    choice = localStorage.getItem(MODEL_PREF) ?? "ce";
  } catch {
    /* storage unavailable */
  }
  // 1.7.0 had a choice for each cable; one connects them all now.
  if (choice === "usb" || choice === "serial" || choice === "evo")
    choice = "real";
  /** The model each stored ROM turned out to be, for the menu. */
  let romModels: Record<string, string> = {};
  try {
    romModels = JSON.parse(localStorage.getItem(NAMES_PREF) ?? "{}");
  } catch {
    /* storage unavailable or bad JSON */
  }
  const ROM_INFO_PREF = "tide-pref-calc-rom-info";
  /** Each stored ROM's model and OS (rominfo.ts), read once from its bytes: by name, and a CE ROM by "ce/" and its name. */
  let romInfo: Record<string, RomInfo> = {};
  try { romInfo = JSON.parse(localStorage.getItem(ROM_INFO_PREF) ?? "{}"); } catch { /* storage unavailable or bad JSON */ }
  function remember(key: string, value: unknown) {
    try {
      localStorage.setItem(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    } catch {
      /* storage unavailable */
    }
  }

  let known: Files | null = null;
  /**
   * The model menu: only the calculators TIde has images for (the CE's ROM, both Nspire images, each
   * other ROM), a real calculator, and Add a ROM…, which opens the images popup. Removing an image
   * is in the popup too.
   */
  function fillMenu(have: Files | null) {
    const roms = have?.roms ?? (choice.startsWith("rom:") ? [choice.slice(4)] : []);
    const ces = have?.ces ?? (choice.startsWith("ce:") ? [choice.slice(3)] : []);
    // The CE choice from before several CE ROMs were kept: its ROM is ce/CE.rom now.
    if (choice === "ce" && ces.length) choice = `ce:${ces.includes("CE.rom") ? "CE.rom" : ces[0]}`;
    const nspireIn = have ? have.nspire.boot1 && have.nspire.flash : choice === "nspire";
    const installed: [string, string][] = [
      // A CE ROM by the model its certificate names and its boot code: "TI-83 Premium CE · boot 5.3.6.0014".
      ...ces.map(n => { const i = romInfo[`ce/${n}`]; return [`ce:${n}`, i ? `${i.model} · boot ${i.version}` : n] as [string, string]; }),
      ...(nspireIn ? [["nspire", "TI-Nspire CX"] as [string, string]] : []),
      // A ROM by its model and OS, as read from it: "TI-84 Plus · OS 2.55MP".
      ...roms.map(n => [`rom:${n}`, romInfo[n] ? `${romInfo[n].model} · OS ${romInfo[n].version}` : romModels[n] ? `${romModels[n]} (${n})` : n] as [string, string]),
    ];
    // Two ROMs of the same calculator and version: their file names tell them apart.
    for (const entry of installed) {
      if (installed.filter(([, l]) => l === entry[1]).length > 1) entry[1] += ` (${entry[0].replace(/^\w+:/, "")})`;
    }
    // A choice whose images are gone falls back to the first calculator that has them.
    if (have && choice !== "real" && !installed.some(([v]) => v === choice) && installed.length) choice = installed[0][0];
    const options: [string, string][] = [...installed, ["real", "Real calculator"], ["add", "Add a ROM…"]];
    // Nothing installed yet: the menu says so, and the panel offers the images popup.
    if (!options.some(([v]) => v === choice)) options.unshift([choice, "No calculator images yet"]);
    ui.model.replaceChildren(...options.map(([value, label]) =>
      Object.assign(document.createElement("option"), { value, textContent: label })));
    ui.model.value = choice;
  }
  fillMenu(null);

  /** A message in place of the screen, with the button that sets the calculator up, if any. */
  // ── Calculator images: one popup for every image the emulators run from ──
  // A tab per family: the TI-84 Plus CE's ROM; the TI-Nspire's boot1 and flash images; ROMs for
  // the TI-73 to 86, each named by the model and OS read from it (rominfo.ts). Every image is a
  // card: what it is, its state, and buttons to choose (or replace), start and remove it. An image
  // is stored as soon as it's chosen. Add a ROM… opens the popup, and so does the Calculator
  // images… button wherever an image is missing.
  /** Reads stored ROMs not identified yet (by name, or "ce/" and a CE ROM's name), and keeps what they are. */
  async function identifyRoms(names: string[]) {
    let found = false;
    for (const name of names.filter(n => !romInfo[n] && !/\.sav$/i.test(n))) {
      try {
        const ce = name.startsWith("ce/");
        const info = ce ? identifyCeRom(await read(name)) : identifyRom(await read(`roms/${name}`));
        if (!info) continue;
        romInfo[name] = info;
        if (!ce && !romModels[name]) romModels[name] = info.model;
        found = true;
      } catch { /* unreadable: it stays unnamed */ }
    }
    if (!found) return;
    remember(ROM_INFO_PREF, romInfo);
    remember(NAMES_PREF, romModels);
    fillMenu(known);
    if (imagesOpen) renderImages();
  }

  const imagesBody = Object.assign(document.createElement("div"), { className: "images-body" });
  const imagesTabs = Object.assign(document.createElement("div"), { className: "images-tabs", role: "tablist" });

  const mb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(bytes % (1024 * 1024) ? 1 : 0)} MB` : `${Math.round(bytes / 1024)} KB`);
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...kids: (Node | string)[]) => {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...kids);
    return node;
  };
  const action = (label: string, run: () => void, kind: "primary" | "" | "danger" = "") =>
    el("button", { type: "button", className: kind ? `image-btn ${kind}` : "image-btn", onclick: run }, label);
  /** A chip, for an image card. */
  const chipIcon = () => {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    for (const d of ["M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z", "M9 9h6v6H9z", "M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"]) {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d);
      svg.append(path);
    }
    return el("span", { className: "image-icon" }, svg);
  };

  /** One image: what it is, details, whether it's in, and what can be done with it. */
  function imageCard(title: string, meta: string, isIn: boolean, actions: HTMLElement[]) {
    return el("div", { className: `image-card ${isIn ? "in" : "missing"}` },
      chipIcon(),
      el("div", { className: "image-main" }, el("strong", {}, title), el("span", { className: "image-meta" }, meta)),
      el("span", { className: "image-pill" }, isIn ? "Installed" : "Missing"),
      el("div", { className: "image-actions" }, ...actions));
  }

  type ImageKind = "ce" | "rom" | "boot1" | "flash";
  /** Picks and stores an image of one kind; the popup shows the result. */
  async function chooseImage(kind: ImageKind, button?: HTMLButtonElement) {
    const path = await opts.pickRom(
      kind === "ce" ? "TI-84 Plus CE or TI-83 Premium CE ROM (4 MB)"
        : kind === "rom" ? "Calculator ROM (TI-73 to 86)"
          : kind === "boot1" ? "TI-Nspire boot1 image (512 KB)" : "TI-Nspire flash image (33 or 132 MB)",
      kind === "ce" ? ["rom", "bin"] : kind === "rom" ? ["rom", "bin"] : kind === "boot1" ? ["img", "bin", "rom"] : ["img", "bin"],
    );
    if (!path) return;
    if (button) { button.disabled = true; button.textContent = kind === "flash" ? "Copying… (it's big)" : "Copying…"; }
    try {
      if (kind === "boot1" || kind === "flash") {
        const size = await fs.calc.setNspireImage(kind, path);
        say(`Saved the Nspire's ${kind} image (${mb(size)}).`);
      } else {
        // A CE ROM is told from the others by its size.
        const stored = await fs.calc.setRom(path);
        if (stored.startsWith("ce:")) {
          const name = stored.slice(3), key = `ce/${name}`;
          delete romInfo[key]; // a replaced ROM is read again
          await identifyRoms([key]);
          const info = romInfo[key];
          say(info ? `Saved ${name}: a ${info.model}, boot code ${info.version}.` : `Saved ${name}.`);
          if (kind === "rom") say("It's a CE ROM, so it's with the CE calculators, in CEmu.");
        } else if (stored.startsWith("rom:")) {
          const name = stored.slice(4);
          delete romInfo[name]; // a replaced ROM is read again
          await identifyRoms([name]);
          const info = romInfo[name];
          say(info ? `Saved ${name}: a ${info.model}, OS ${info.version}.` : `Saved ${name}.`);
          if (kind === "ce") say(`That isn't a CE ROM (those are 4 MB): TIde kept it as ${info ? `a ${info.model} ROM` : name}.`);
        } else say("Saved the Nspire image.");
      }
    } catch (err) {
      say(String(err instanceof Error ? err.message : err));
    }
    known = await files().catch(() => known);
    fillMenu(known);
    renderImages();
  }

  /** Removes a stored ROM: by its name, or "ce/" and a CE ROM's name. */
  async function removeRomImage(key: string) {
    const name = key.replace(/^ce\//, "");
    const value = key.startsWith("ce/") ? `ce:${name}` : `rom:${name}`;
    if (!confirm(`Remove ${name} from TIde? The file you added it from stays where it is.`)) return;
    try {
      if (choice === value) await stop();
      await fs.calc.removeRom(key);
      delete romModels[key];
      delete romInfo[key];
      remember(NAMES_PREF, romModels);
      remember(ROM_INFO_PREF, romInfo);
      if (choice === value) { choice = "ce"; remember(MODEL_PREF, choice); }
    } catch (err) {
      say(`Could not remove ${name}: ${err}`);
    }
    known = await files().catch(() => known);
    fillMenu(known);
    renderImages();
  }

  async function removeNspireImages() {
    if (!confirm("Remove the Nspire boot1 and flash images from TIde? The files you added them from stay where they are.")) return;
    try {
      if (choice === "nspire") await stop();
      await fs.calc.removeNspire();
    } catch (err) {
      say(`Could not remove the Nspire images: ${err}`);
    }
    known = await files().catch(() => known);
    fillMenu(known);
    renderImages();
  }

  type ImagesTab = "ce" | "nspire" | "roms";
  /** The popup's tab: one calculator family at a time. */
  let imagesTab: ImagesTab = "ce";
  /** The tab to open on: the calculator chosen, or else the first family missing its images. */
  function tabFor(have: Files | null): ImagesTab {
    if (choice === "nspire") return "nspire";
    if (choice.startsWith("rom:")) return "roms";
    if (choice === "ce" || choice.startsWith("ce:") || !have) return "ce";
    return !have.ces.length ? "ce" : !(have.nspire.boot1 && have.nspire.flash) ? "nspire" : "roms";
  }

  /** Draws the tabs and the chosen tab's images, from what's stored. */
  function renderImages() {
    const have = known;
    if (!have) { imagesBody.replaceChildren(el("p", { className: "images-empty" }, "Looking for stored images…")); return; }
    const ns = have.nspire;
    const start = (target: string, label = "Start") => action(label, () => { closeImages(false); void choose(target); }, "primary");
    const chooser = (kind: ImageKind, isIn: boolean) => {
      const b = action(isIn ? "Replace…" : "Choose…", () => void chooseImage(kind, b), isIn ? "" : "primary");
      return b;
    };
    const intro = (text: string) => el("p", { className: "images-intro" }, text);
    const romHelp = () => el("details", { className: "rom-help" },
      el("summary", {}, "What the heck is a ROM?"),
      el("p", {}, "A ROM (Read-Only Memory) is a digital image of the software stored inside your calculator. It contains the operating system and other low-level code that tells the calculator how to work. In order to get TIde to emulate your calculator, you'll need to provide the appropriate ROM image. The process differs for each calculator model. TIde does not provide ROMs due to copyright restrictions, so you must obtain these from your own calculator. "));
    const footer = (...kids: HTMLElement[]) => el("div", { className: "images-section-actions" }, ...kids);

    const tabs: [ImagesTab, string, boolean][] = [
      ["ce", "CE calculators", have.ces.length > 0],
      ["nspire", "TI-Nspire CX", ns.boot1 && ns.flash],
      ["roms", "TI-73 to 86", have.roms.length > 0],
    ];
    imagesTabs.replaceChildren(...tabs.map(([id, label, ready]) =>
      el("button", {
        type: "button", role: "tab", ariaSelected: String(id === imagesTab), className: `images-tab${ready ? " ready" : ""}`,
        title: ready ? `${label}: ready to start` : `${label}: images missing`,
        onclick: () => { imagesTab = id; renderImages(); },
      }, el("span", { className: "images-dot" }), label)));

    const sections: Record<ImagesTab, () => HTMLElement[]> = {
      ce: () => [
        intro("The TI-84 Plus CE, TI-83 Premium CE and TI-82 Advanced Edition Python run in CEmu, each from a ROM dumped from your own calculator. Keep as many ROMs as you like: TIde automatically detects each calculator's model and boot code."),
        romHelp(),
        ...(have.ces.length
          ? have.ces.map(name => {
              const info = romInfo[`ce/${name}`];
              return imageCard(info?.model ?? name, info ? `Boot ${info.version} · ${name}` : `${name} · identifying…`, true,
                [action("Remove…", () => void removeRomImage(`ce/${name}`), "danger"), start(`ce:${name}`)]);
            })
          : [imageCard("CE ROM", "4 MB, dumped from your TI-84 Plus CE or TI-83 Premium CE", false, [chooser("ce", false)])]),
        ...(have.ces.length ? [footer((() => { const b = action("Add a CE ROM…", () => void chooseImage("ce", b), "primary"); return b; })())] : []),
      ],
      nspire: () => [
        intro("The TI-Nspire CX runs from two images dumped from your own calculator. The flash image is its whole memory, not an OS file (.tcc, .tco, .tcc2)."),
        romHelp(),
        imageCard("Boot1 image", ns.boot1 ? `${ns.boot1_size ? mb(ns.boot1_size) : "512 KB"} · boot1.img` : "512 KB", ns.boot1, [chooser("boot1", ns.boot1)]),
        imageCard("Flash image", ns.flash ? `${ns.flash_size ? mb(ns.flash_size) : ""} · flash.img` : "132 MB (CX, CX II) or 33 MB (older models)", ns.flash, [chooser("flash", ns.flash)]),
        footer(
          ...(ns.boot1 || ns.flash ? [action("Remove both…", () => void removeNspireImages(), "danger")] : []),
          ...(ns.boot1 && ns.flash ? [start("nspire", "Start the TI-Nspire")] : [])),
      ],
      roms: () => [
        intro("ROMs for the TI-73, 81, 82, 83, 83 Plus, 84 Plus, 85 and 86 run in TilEm. TIde reads each one's model and OS."),
        romHelp(),
        ...(have.roms.length
          ? have.roms.map(name => {
              const info = romInfo[name];
              const title = info?.model ?? romModels[name] ?? name;
              const meta = info ? `OS ${info.version} · ${name}` : /\.sav$/i.test(name) ? `Wabbitemu save, which TilEm can't run · ${name}` : `${name} · identifying…`;
              return imageCard(title, meta, true, [action("Remove…", () => void removeRomImage(name), "danger"), start(`rom:${name}`)]);
            })
          : [el("p", { className: "images-empty" }, "No ROMs yet. Add one dumped from your own calculator (16 KB to 4 MB).")]),
        footer((() => { const b = action("Add a ROM…", () => void chooseImage("rom", b), "primary"); return b; })()),
      ],
    };
    imagesBody.replaceChildren(...sections[imagesTab]());
    // ROMs added before TIde read them: read them now.
    if (imagesTab === "roms") void identifyRoms(have.roms);
    if (imagesTab === "ce") void identifyRoms(have.ces.map(n => `ce/${n}`));
  }

  /** In place of the screen: what's missing, and the button that opens the images popup. */
  function showImages(text: string) {
    setup(text, "images");
  }

  // The popup, in TIde's dialog frame: header, tabs, the tab's images, and Done.
  const imagesHint = el("p", { className: "images-sub" });
  const imagesDialog = el("dialog", { className: "images-dialog", ariaLabel: "Calculator images" },
    el("header", { className: "images-head" },
      el("div", {}, el("h2", {}, "Calculator images"), imagesHint),
      el("button", { type: "button", className: "images-close", title: "Close (Esc)", ariaLabel: "Close", onclick: () => closeImages(true) }, "×")),
    imagesTabs,
    imagesBody,
    el("footer", { className: "images-foot" },
      el("span", { className: "hint" }, "TIde keeps copies in its data folder; the files you choose stay where they are."),
      action("Done", () => closeImages(true), "primary")));
  imagesDialog.addEventListener("cancel", e => { e.preventDefault(); closeImages(true); }); // Escape
  let imagesOpen = false;

  /** Opens the images popup, with `hint` under its title. */
  async function openImages(hint = "Choose or replace an image, then start its calculator.") {
    imagesHint.textContent = hint;
    known = await files().catch(() => known);
    if (!imagesOpen) imagesTab = tabFor(known);
    renderImages();
    if (!imagesDialog.isConnected) document.body.append(imagesDialog);
    if (!imagesOpen) { imagesDialog.showModal(); imagesOpen = true; }
  }

  /** Closes it. `recheck`: with nothing running, look again, so a calculator now set up starts. */
  function closeImages(recheck: boolean) {
    if (!imagesOpen) return;
    imagesOpen = false;
    imagesDialog.close();
    if (recheck && !engine && !ui.panel.hidden) void ready();
  }

  function setup(
    text: string,
    button: "rom" | "connect" | "disconnect" | "images" | null,
  ) {
    ui.setup.hidden = !text;
    ui.setupText.textContent = text;
    // Something to set up means nothing is running.
    if (text && button !== "disconnect") ui.state.textContent = "";
    // An image is needed: the button opens the images popup, one place for all of them.
    ui.rom.hidden = button !== "images" && button !== "rom";
    ui.rom.textContent = "Calculator images…";
    ui.connect.hidden = button !== "connect";
    ui.disconnect.hidden = button !== "disconnect";
    ui.screen.hidden = !!text;
    ui.reset.hidden = ui.reload.hidden = isReal(choice);
  }


  async function loadModule<T>(
    script: Uint8Array,
    options: Record<string, unknown>,
  ): Promise<T> {
    const url = URL.createObjectURL(
      new Blob([script as BlobPart], { type: "text/javascript" }),
    );
    try {
      return await (
        (
          await import(/* @vite-ignore */ url)
        ).default as Factory<T>
      )(options);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ── CEmu, for the TI-84 Plus CE ──
  let transfer: {
    resolve: () => void;
    reject: (e: Error) => void;
    progress: (value: number, total: number) => void;
  } | null = null;
  /** Starts CEmu on a stored CE ROM, by its name in ce/. */
  async function startCemu(name: string): Promise<Engine | null> {
    const [script, wasm, rom] = await Promise.all([
      read("WebCEmu.js"),
      read("WebCEmu.wasm"),
      read(`ce/${name}`),
    ]);
    // The core's main() reports through these globals, as CEmu's own web page defines them.
    const w = window as unknown as Record<string, unknown>;
    let ok = false;
    Object.assign(w, {
      emul_is_inited: false,
      emul_is_paused: false,
      initFuncs: () => {},
      initLCD: () => {},
      enableGUI: () => {
        ok = true;
      },
      disableGUI: () => {
        ok = false;
      },
      // CEmu reports bytes sent out of the total while a transfer runs; that count can reach the total
      // before it is finished (a group sends several variables). The real end comes when the USB
      // transfer closes: (1, 1) when it worked, (0, 0) when it failed.
      transferProgressCallback: (value: number, total: number) => {
        if (!transfer) return;
        if (value === 1 && total === 1) {
          transfer.resolve();
          transfer = null;
        } else if (value === 0 && total === 0) {
          transfer.reject(new Error("The calculator refused the file."));
          transfer = null;
        } else transfer.progress(value, total);
      },
      transferErrorCallback: () => {
        transfer?.reject(new Error("The calculator refused the file."));
        transfer = null;
      },
    });
    let memory: WebAssembly.Memory | null = null;
    const emu = await loadModule<WebCEmu>(script, {
      print: (t: string) => log(t, "out"),
      // CEmu reports its own status on stderr too; only real errors get the warning color.
      printErr: (t: string) =>
        log(
          t,
          /\b(?:error|fail|bad|couldn't|invalid)/i.test(t) ? "err" : "emu",
        ),
      // Instantiate the WebAssembly ourselves to keep its memory, which holds the LCD.
      instantiateWasm(
        imports: WebAssembly.Imports,
        done: (instance: WebAssembly.Instance) => void,
      ) {
        WebAssembly.instantiate(wasm as BufferSource, imports).then(
          ({ instance }) => {
            memory =
              (Object.values(instance.exports).find(
                (e) => e instanceof WebAssembly.Memory,
              ) as WebAssembly.Memory) ?? null;
            done(instance);
          },
        );
        return {};
      },
    });
    emu.FS.writeFile("CE.rom", rom);
    try {
      emu.callMain([]);
    } catch {
      /* main() hands over to the browser's frame loop by throwing */
    }
    if (!ok) return null;
    // Run on a 16 ms timer rather than animation frames, so emulation keeps its speed when the
    // page draws slowly or the window is behind another one. Drawing still follows the frames.
    emu.ccall(
      "emsc_set_main_loop_timing",
      "number",
      ["number", "number"],
      [0, 16],
    );
    // The OS takes one key code at a time; sendKey refuses until it has read the last one.
    const keyQueue: number[] = [];
    const feeding = window.setInterval(() => {
      if (keyQueue.length && emu._sendKey(keyQueue[0])) keyQueue.shift();
    }, 20);
    const typed = async (codes: number[]) => {
      keyQueue.push(...codes);
      for (let i = 0; keyQueue.length && i < 400; i++) await sleep(25);
      await sleep(150);
    };
    // Whether the screen is off. CEmu has no flag for it, but an off or sleeping panel shows one flat
    // grey (the panel's blank level) on every pixel. Full black or white screens are left alone, since
    // programs draw those, and the screen must stay blank for half a second, so a quick clear isn't "off".
    let blankSince = 0;
    const lcdOff = (px: Uint32Array) => {
      const first = px[0],
        rgb = first & 0xffffff;
      let blank =
        rgb !== 0 &&
        rgb !== 0xffffff &&
        (rgb & 0xff) === ((rgb >> 8) & 0xff) &&
        (rgb & 0xff) === rgb >> 16;
      for (let i = 1; blank && i < px.length; i++)
        if (px[i] !== first) blank = false;
      if (!blank) {
        blankSince = 0;
        return false;
      }
      blankSince ||= performance.now();
      return performance.now() - blankSince > 500;
    };
    return {
      kind: "cemu",
      model: "TI-84 Plus CE",
      family: "ce",
      layout: LAYOUT_CE,
      width: 320,
      height: 240,
      frame(out) {
        if (!memory) return true;
        const ptr = emu._lcd_get_frame();
        if (lcdOff(new Uint32Array(memory.buffer, ptr, 320 * 240)))
          return false;
        const src = new Uint8Array(memory.buffer, ptr, 320 * 240 * 4),
          dst = out.data;
        for (let i = 0; i < dst.length; i += 4) {
          // 0x00RRGGBB, little-endian
          dst[i] = src[i + 2];
          dst[i + 1] = src[i + 1];
          dst[i + 2] = src[i];
          dst[i + 3] = 255;
        }
        return true;
      },
      key: (key, down) => emu._emu_keypad_event(key.row, key.col, down ? 1 : 0),
      async send(file, label) {
        const bytes = /\.8xg$/i.test(file.name)
          ? archived(file.bytes)
          : file.bytes;
        const path = `/send.${file.name.split(".").pop()}`;
        emu.FS.writeFile(path, bytes);
        try {
          let timer = 0,
            shown = -1;
          await new Promise<void>((resolve, reject) => {
            // Give up only when the transfer stalls: no progress for 15 seconds. Large apps, groups
            // and OS files keep reporting progress, so they can take as long as they need.
            const stall = () => {
              window.clearTimeout(timer);
              timer = window.setTimeout(() => {
                if (!transfer) return;
                transfer = null;
                reject(
                  new Error(
                    "The calculator stopped taking the file. Is it on the home screen?",
                  ),
                );
              }, 15000);
            };
            transfer = {
              resolve: () => {
                window.clearTimeout(timer);
                resolve();
              },
              reject: (e) => {
                window.clearTimeout(timer);
                reject(e);
              },
              progress: (value, total) => {
                stall();
                const percent = total
                  ? Math.min(99, Math.floor((value / total) * 100))
                  : 0;
                if (percent >= shown + 10) {
                  shown = percent - (percent % 10);
                  opts.say(`${label}… ${shown}%`);
                }
              },
            };
            stall();
            emu.ccall("set_file_to_send", null, ["string"], [path]);
          });
        } finally {
          try {
            emu.FS.unlink(path);
          } catch {
            /* already gone */
          }
        }
      },
      reset: () => emu._emu_reset(),
      stop() {
        window.clearInterval(feeding);
        try {
          emu.pauseMainLoop?.();
        } catch {
          /* already stopped */
        }
        transfer?.reject(new Error("The calculator was stopped."));
        transfer = null;
      },
      launch: (name) =>
        typed([
          KEY_CLEAR,
          KEY_PRGM,
          ...[...name.toUpperCase()].map(letterKey).filter(Boolean),
          KEY_ENTER,
        ]),
      type: (text) =>
        typed([...text.toUpperCase()].map(letterKey).filter(Boolean)),
      async openApp(name) {
        // The apps menu jumps to the first app starting with a letter; Enter opens the selected one.
        await tap(LAYOUT_CE.macro.get("apps")!, 120, 400);
        const first = letterKey(name.charAt(0).toUpperCase());
        if (first) await typed([first]);
        await typed([KEY_ENTER]);
      },
    };
  }

  // ── TilEm, for the TI-73, 81, 82, 83, 83 Plus, 84 Plus, 85 and 86 ──
  // The bridge's link errors (emulator/tilem/tide_tilem.c).
  const LINK_ERRORS: Record<number, string> = {
    1: "The link failed.",
    2: "The calculator didn't answer in time. Is it on the home screen?",
    4: "The file was damaged on the way.",
    6: "There isn't enough memory on the calculator.",
    7: "That file is for a different calculator.",
    8: "That isn't a TI file this calculator can read.",
    9: "The emulator had a problem.",
  };
  async function startTilem(name: string): Promise<Engine | null> {
    if (/\.sav$/i.test(name))
      throw new Error(`${name} is a Wabbitemu save, which TilEm can't run. Add the calculator's ROM instead.`);
    const [script, wasm, rom] = await Promise.all([
      read("TilEm.js"),
      read("TilEm.wasm"),
      read(`roms/${name}`),
    ]);
    const emu = await loadModule<TilEmModule>(script, {
      wasmBinary: wasm,
      locateFile: (file: string) => file, // the script is a blob URL, which file names can't be resolved against
      print: (t: string) => log(t, "emu"),
      printErr: (t: string) => log(t, "err"),
    });
    emu.FS.writeFile("/calc.rom", rom);
    const id = emu.ccall("tilem_load", "number", ["string"], ["/calc.rom"]) as number;
    const letter = id > 0 ? String.fromCharCode(id) : "";
    const model = TILEM_MODELS[letter];
    if (!model) return null;
    if (romModels[name] !== model) {
      romModels[name] = model;
      remember(NAMES_PREF, romModels);
      fillMenu(known);
    }
    const running = window.setInterval(
      () => emu._tilem_frame(),
      1000 / emu._tilem_fps(),
    );
    // The OS is still settling just after it turns on, and doesn't answer the link yet.
    await sleep(1500);
    // Each model's own keypad: the TI-85 and 86's, the 81's, 82's and 83's (and the 76.fr, an 83),
    // and the CE's for the TI-73 and the 83 Plus and 84 Plus family.
    const l =
      letter === "5" || letter === "6" ? LAYOUT_8586
        : letter === "1" ? LAYOUT_81
          : letter === "2" ? LAYOUT_82
            : letter === "3" || letter === "f" ? LAYOUT_83
              : LAYOUT_CE;
    const key = (k: Key, down: boolean) =>
      emu._tilem_key(7 - k.row, k.col, down ? 1 : 0);
    const keyFor = (label: string) => l.macro.get(label)!;
    /** Letters with alpha, digits as they are, from the keys' alpha letters. */
    const typeChar = async (c: string) => {
      const lower = c === "θ" ? "#" : c.toLowerCase();
      if (/[0-9]/.test(c)) return tap(l.byKbd.get(c)!, 100, 120);
      const k = l.byKbd.get(lower);
      if (!k) return;
      await tap(keyFor("alpha"), 100, 120);
      await tap(k, 100, 120);
    };
    const plus = TILEM_PLUS.includes(letter);
    const width = emu._tilem_lcd_width();
    return {
      kind: "tilem",
      model,
      family: plus ? "plus" : "other",
      layout: l,
      width,
      height: 64,
      frame(out) {
        if (!emu._tilem_lcd_on()) return false;
        // A row after another, the screen's width each.
        const ptr = emu._tilem_lcd(),
          src = emu.HEAPU8,
          dst = out.data;
        // The LCD's greens, from clear to dark, as on the real screen.
        for (let i = 0; i < width * 64; i++) {
          const v = src[ptr + i] / 255,
            o = i * 4;
          dst[o] = 168 - v * 148;
          dst[o + 1] = 181 - v * 153;
          dst[o + 2] = 146 - v * 126;
          dst[o + 3] = 255;
        }
        return true;
      },
      key,
      async send(file) {
        const path = `/send.${file.name.split(".").pop()!.toLowerCase()}`;
        emu.FS.writeFile(path, file.bytes);
        try {
          // A calculator busy with something else doesn't answer (2); give it a moment and try again.
          for (let attempt = 0; ; attempt++) {
            const err = emu.ccall(
              "tilem_send",
              "number",
              ["string", "number"],
              [path, /\.8xg$/i.test(file.name) ? 1 : 0],
            ) as number;
            if (!err) break;
            if (err !== 2 || attempt === 3)
              throw new Error(LINK_ERRORS[err] ?? `Link error ${err}.`);
            await sleep(700);
          }
        } finally {
          try {
            emu.FS.unlink(path);
          } catch {
            /* already gone */
          }
        }
      },
      reset: () => emu._tilem_reset(),
      stop: () => window.clearInterval(running),
      async launch(name) {
        if (!plus)
          throw new Error(
            `Run it from the PRGM menu: TIde starts programs on the TI-83 Plus and 84 Plus.`,
          );
        // The PRGM menu lists programs by name and jumps to the first one starting with a letter
        // that's pressed; the arrows go on from there to the right one. Enter pastes it, Enter runs it.
        const names = emu
          .UTF8ToString(emu._tilem_programs())
          .split("\n")
          .filter(Boolean)
          .sort();
        const target = name.toUpperCase().replace(/θ/g, "["); // θ is "[" in a name
        if (!names.includes(target))
          throw new Error(`${target} isn't on the calculator.`);
        const before = names.filter(
          (n) => n[0] === target[0] && n < target,
        ).length;
        await tap(keyFor("clear"));
        await tap(keyFor("prgm"), 120, 400);
        const first = l.byKbd.get(
          target[0] === "[" ? "#" : target[0].toLowerCase(),
        );
        if (first) await tap(first, 100, 200);
        for (let i = 0; i < before; i++) await tap(keyFor("▼"), 80, 100);
        await tap(keyFor("enter"), 120, 250);
        await tap(keyFor("enter"));
      },
      async type(text) {
        for (const c of text.toUpperCase()) await typeChar(c);
      },
      async openApp(name) {
        if (!plus)
          throw new Error("app.open works on the TI-83 Plus and 84 Plus.");
        await tap(keyFor("apps"), 120, 400);
        const first = l.byKbd.get(name.charAt(0).toLowerCase());
        if (first) await tap(first, 100, 200);
        await tap(keyFor("enter"), 120, 400);
      },
    };
  }

  // ── A real calculator, over USB ──
  /** The calculator's family, from libticalcs's name for it ("TI84+CE", "TI83+", "TI84+ USB"…). */
  const familyOf = (model: string): Engine["family"] =>
    /CE|PCE/i.test(model)
      ? "ce"
      : /^TI-?8[34]\+|^TI-?82A/i.test(model)
        ? "plus"
        : "other";
  const nameOf = (model: string) =>
    model.replace(/^TI-?/i, "TI-").replace(/ USB$/i, "");
  let link: Connected | null = null;

  function usbEngine(l: Connected): Engine {
    const notHere = (what: string) => async () => {
      throw new Error(
        `${what} works in the emulator. On a real calculator, use its keys.`,
      );
    };
    return {
      kind: "usb",
      model: nameOf(l.model),
      family: familyOf(l.model),
      layout: LAYOUT_CE,
      width: 320,
      height: 240,
      frame: () => false,
      key: () => {},
      // Groups only go into archive memory, as on the emulator.
      send: (file) =>
        l.send(
          file.name,
          /\.8xg$/i.test(file.name) ? archived(file.bytes) : file.bytes,
        ),
      reset: () => {},
      stop: () => {
        if (link === l) link = null;
        void l.close();
      },
      async launch(name) {
        throw new Error(
          `Start it on the calculator: prgm, then ${name.toUpperCase()}.`,
        );
      },
      type: notHere("key.type"),
      openApp: notHere("app.open"),
    };
  }

  function showLinked() {
    if (!engine || !isReal(engine.kind)) return;
    const serial = engine.kind === "serial";
    const runs =
      serial && serialLink?.remote
        ? "Run sends the program and starts it on the calculator, pressing its keys over the cable; key.press, key.type and app.open in tide.json do too."
        : "Run sends the program; start it from the calculator's prgm menu.";
    setup(
      `Connected to the ${engine.model} over ${serial ? `the serial cable (${serialName})` : "USB"}.\nSend files to it, or build and run. ${runs}\nKeep it on the home screen while files are sent.`,
      "disconnect",
    );
    ui.state.textContent = "connected";
  }

  /** From a click on Connect: the browser only asks which device to use during one. */
  async function connectUsb(device: USBDeviceLike) {
    ui.connect.disabled = true;
    ui.state.textContent = "connecting…";
    try {
      if (engine) await stop();
      const l = await connect(
        (text, err) => log(text.replace(/\n$/, ""), err ? "err" : "info"),
        device,
      );
      link = l;
      engine = usbEngine(l);
      sentLibs.clear();
      l.onLost(() => {
        if (link !== l) return;
        link = null;
        if (engine && isReal(engine.kind)) engine = null;
        say("The calculator was unplugged.");
        if (choice === "real") void ready();
      });
      setCredit();
      showLinked();
      say(`Connected to the ${engine.model}.`);
    } catch (err) {
      ui.state.textContent = "";
      say(err instanceof Error ? err.message : String(err));
    } finally {
      ui.connect.disabled = false;
    }
  }

  // ── A real calculator, over a serial cable: TIde's own link protocol (dbus.ts), connected in
  // the Serial tab (serial-view.ts), which hands the connection over with attachSerial() ──
  let serialName = "";
  let serialLink: DbusLink | null = null;

  function serialEngine(l: DbusLink): Engine {
    // Over the cable, TIde presses the calculator's keys itself (remote control, as TILP does).
    return {
      kind: "serial",
      model: l.model,
      family: modelFamily(l.model),
      layout: LAYOUT_CE,
      width: 320,
      height: 240,
      frame: () => false,
      key: (k, down) => {
        if (down)
          l.press(k.label).catch((err) =>
            say(String(err instanceof Error ? err.message : err)),
          );
      },
      press: (name) => l.press(name),
      send: (file) => l.sendFile(file.name, file.bytes),
      reset: () => {},
      stop: () => {
        if (serialLink === l) {
          serialLink = null;
          void l.close();
          opts.serialDropped?.();
        }
      },
      launch: (name) => l.run(name),
      type: (text) => l.type(text),
      openApp: (name) => l.openApp(name),
    };
  }

  /** tide.json's "link": the row the connections popup starts on. */
  let prefer: { via?: "usb" | "serial"; port?: string; model?: string } = {};

  /** From a click on Connect: the connections popup, then whichever was picked. */
  async function connectReal() {
    const picked = await chooseConnection(prefer, (text) => log(text, "info"));
    if (!picked) return;
    if (picked.kind === "usb") return connectUsb(picked.device);
    if (picked.kind === "evo") {
      try {
        say(
          await describeDevice(picked.device as never, (line) =>
            log(line, "info"),
          ),
        );
      } catch (err) {
        say(err instanceof Error ? err.message : String(err));
      }
      return;
    }
    ui.connect.disabled = true;
    ui.state.textContent = "connecting…";
    try {
      if (engine) await stop();
      const byteLink = await openSerialPort(picked.port);
      // "Find out": ask the calculator which it is, as TILP's probe does.
      let model = picked.model;
      if (model === "auto") {
        ui.state.textContent = "asking which calculator…";
        const answered = await detectModel(byteLink, (text) =>
          log(text, "info"),
        ).catch(async (err) => {
          await byteLink.close().catch(() => {});
          throw err;
        });
        if (!answered) {
          await byteLink.close().catch(() => {});
          throw new Error(
            `No calculator answered on ${byteLink.name}. Is it on, and is the cable in all the way? A TI-82 only answers with Link > Receive started; or pick the calculator in the list instead of Find out.`,
          );
        }
        model = answered;
      }
      const l = new DbusLink(byteLink, model, (text) => log(text, "info"));
      try {
        await l.check();
      } catch (err) {
        await l.close().catch(() => {});
        throw err;
      }
      serialLink = l;
      serialName = byteLink.name;
      engine = serialEngine(l);
      sentLibs.clear();
      setCredit();
      showLinked();
      opts.serialConnected?.(l, byteLink.name);
      say(
        model === "TI-82"
          ? `Ready to send to the TI-82 on ${byteLink.name}. Start Link > Receive on it before each send.`
          : `Connected to the ${model} on ${byteLink.name}.`,
      );
    } catch (err) {
      ui.state.textContent = "";
      say(err instanceof Error ? err.message : String(err));
    } finally {
      ui.connect.disabled = false;
    }
  }

  /** The line under the calculator: whose emulator (or link) it is, with its link and license. */
  function setCredit() {
    const kind =
      engine?.kind ??
      (choice === "real"
        ? "usb"
        : choice === "nspire"
          ? "firebird"
          : choice.startsWith("rom:")
            ? "tilem"
            : "cemu");
    const credits: Record<string, [string, string, string]> = {
      cemu: ["CEmu", "https://github.com/CE-Programming/CEmu", "GPLv3"],
      tilem: ["TilEm", "https://sourceforge.net/projects/tilem/", "GPLv3+"],
      firebird: ["Firebird", "https://github.com/nspire-emus/firebird", "GPLv3"],
      usb: ["TILP's libraries (WebTILP)", "https://github.com/debrouxl/tilibs", "GPLv2+"],
      // The serial link is TIde's own, from the TI Link Protocol Guide.
      serial: ["TIde, after the TI Link Protocol Guide", "https://merthsoft.com/linkguide/", "TIde's license"],
    };
    const [name, href, license] = credits[kind] ?? credits.cemu;
    const credit = $<HTMLAnchorElement>("calc-credit");
    $("calc-credit-what").textContent = isReal(kind) ? "The link" : "Emulation";
    credit.textContent = name;
    credit.href = href;
    $("calc-license").textContent = license;
  }

  // ── Firebird, for the TI-Nspire CX ──
  async function startFirebird(): Promise<Engine | null> {
    const [script, wasm, boot1, flash] = await Promise.all([
      read("firebird.js"),
      read("firebird.wasm"),
      read("nspire/boot1.img"),
      read("nspire/flash.img"),
    ]);

    if (boot1.byteLength !== 524288) {
      throw new Error(
        `Invalid boot1 size: ${boot1.byteLength} bytes (expected 524,288 bytes).`,
      );
    }
    if (flash.byteLength === 0) {
      throw new Error("Flash image is empty (0 bytes).");
    }

    const fbErrors: string[] = [];
    let domCanvas = document.getElementById(
      "canvas",
    ) as HTMLCanvasElement | null;
    const createdCanvas = !domCanvas;
    if (!domCanvas) {
      domCanvas = document.createElement("canvas");
      domCanvas.id = "canvas";
      domCanvas.width = 320;
      domCanvas.height = 240;
      domCanvas.style.display = "none";
      document.body.appendChild(domCanvas);
    }

    const g = globalThis as Record<string, unknown>;
    let lcdWidth = 320;
    let lcdHeight = 240;
    const latestFrame = new Uint8ClampedArray(320 * 240 * 4);

    g.initLCD = (w?: number, h?: number) => {
      if (typeof w === "number" && w > 0) lcdWidth = w;
      if (typeof h === "number" && h > 0) lcdHeight = h;
      if (domCanvas) {
        domCanvas.width = lcdWidth;
        domCanvas.height = lcdHeight;
      }
    };

    g.paintLCD = (...args: unknown[]) => {
      const first = args;
      if (first instanceof Uint8ClampedArray || first instanceof Uint8Array) {
        latestFrame.set(first.subarray(0, latestFrame.length));
        return;
      }
      const ptr = typeof first === "number" ? first : 0;
      if (ptr > 0 && emu?.HEAPU8) {
        const pixels = lcdWidth * lcdHeight;
        if (emu.HEAPU8[ptr + 3] === 255 && emu.HEAPU8[ptr + 7] === 255) {
          latestFrame.set(emu.HEAPU8.subarray(ptr, ptr + pixels * 4));
        } else {
          const view = new DataView(emu.HEAPU8.buffer, ptr, pixels * 2);
          for (let i = 0; i < pixels; i++) {
            const rgb565 = view.getUint16(i * 2, true);
            latestFrame[i * 4] = (((rgb565 >> 11) & 0x1f) * 255) / 31;
            latestFrame[i * 4 + 1] = (((rgb565 >> 5) & 0x3f) * 255) / 63;
            latestFrame[i * 4 + 2] = ((rgb565 & 0x1f) * 255) / 31;
            latestFrame[i * 4 + 3] = 255;
          }
        }
      }
    };

    g.fbProgress = (p: number) => {
      fbProgress?.(p);
    };
    g.updateStatus = (msg: string) => {
      if (msg) log(String(msg), "emu");
    };

    const emu = await loadModule<FirebirdEmu>(script, {
      locateFile: (file: string) => file,
      canvas: domCanvas,
      noInitialRun: true,
      print: (t: string) => log(t, "emu"),
      printErr: (t: string) => {
        fbErrors.push(t);
        log(
          t,
          /\b(?:error|fail|bad|couldn't|invalid)/i.test(t) ? "err" : "emu",
        );
      },
      instantiateWasm(
        imports: WebAssembly.Imports,
        done: (instance: WebAssembly.Instance) => void,
      ) {
        WebAssembly.instantiate(wasm as BufferSource, imports).then(
          ({ instance }) => done(instance),
        );
        return {};
      },
    });

    emu.FS.writeFile("/boot1.img", boot1);
    emu.FS.writeFile("/flash.img", flash);
    emu.FS.writeFile("boot1.img", boot1);
    emu.FS.writeFile("flash.img", flash);

    // The bridge's paintLCD/fb_paint writes the 320x240 RGBA frame into a buffer in the wasm heap,
    // so give it one to fill. (Calling _paintLCD with no pointer would splat the frame over address 0.)
    const framePtr =
      typeof emu._malloc === "function" ? emu._malloc(latestFrame.length) : 0;

    if (typeof emu._fb_start === "function") {
      // The rebuilt bridge boots explicitly; its _main does nothing.
      if (!emu._fb_start())
        throw new Error("Firebird couldn't boot from boot1.img and flash.img.");
    } else if (
      typeof emu.callMain === "function" ||
      typeof emu._main === "function"
    ) {
      // The stock web build's main() boots, then registers its own step loop and unwinds.
      try {
        if (typeof emu.callMain === "function")
          emu.callMain(["boot1.img", "flash.img"]);
        else emu._main!(0, 0);
      } catch (e) {
        const msg = String(e);
        if (!/unwind|SimulateInfiniteLoop/i.test(msg)) {
          const detail = fbErrors.filter(Boolean).slice(-3).join(" | ");
          throw new Error(
            detail
              ? `Firebird failed to start: ${detail}`
              : `Firebird main() threw: ${msg}`,
          );
        }
      }
    } else {
      throw new Error("firebird.wasm does not export _main.");
    }

    await sleep(1000);
    // fb_touch takes touchpad coordinates with y = 0 at the top: up is [0.5, 0], down is [0.5, 1].
    const TOUCH: [number, number][] = [
      [0.5, 0],
      [0, 0.5],
      [1, 0.5],
      [0.5, 1],
      [0.5, 0.5],
    ];

    const allocCString = (str: string): number => {
      const bytes = new TextEncoder().encode(str + "\0");
      const ptr = emu._malloc(bytes.length);
      emu.HEAPU8.set(bytes, ptr);
      return ptr;
    };

    // Auto-continue: during e.g. an Ndless install the guest takes a CPU exception and the core's
    // return_to_loop() unwinds out of fb_step (emu_restart_exception, caught inside fb_step; older
    // builds aborted the whole wasm on it). Like pressing "continue" once on a real calc, a failed
    // step must not kill the animation loop — catch it, log it once per distinct error, keep going.
    let lastStepError = "";

    return {
      kind: "firebird",
      model: "TI-Nspire CX",
      family: "nspire",
      layout: LAYOUT_NS,
      width: 320,
      height: 240,
      frame(out) {
        try {
          if (typeof emu._fb_step === "function") emu._fb_step();
          const paint = emu._fb_paint ?? emu._paintLCD;
          if (paint && framePtr) {
            paint(framePtr);
            out.data.set(
              emu.HEAPU8.subarray(framePtr, framePtr + latestFrame.length),
            );
          } else {
            out.data.set(latestFrame); // a bridge that reports through the global paintLCD instead
          }
        } catch (e) {
          const msg = String(e);
          if (msg !== lastStepError) {
            lastStepError = msg;
            log(`Firebird step auto-continued past: ${msg}`, "err");
          }
          out.data.set(latestFrame);
        }
        return true;
      },
      key: (key, down) => {
        if (key.row === 8 && typeof emu._fb_touch === "function") {
          const [x, y] = TOUCH[key.col] ?? [0.5, 0.5];
          emu._fb_touch(x, y, down ? 1 : 0, down ? 1 : 0);
        } else if (typeof emu._fb_key === "function") {
          emu._fb_key(key.row, key.col, down ? 1 : 0);
        } else if (key.kbd?.length) {
          // No fb_key export (stock web build): synthesize a DOM event so the keypad bridge
          // installed in firebird's emscripten main.cpp (window-level listeners) picks it up.
          const target = emu.canvas ?? domCanvas ?? document;
          target.dispatchEvent(
            new KeyboardEvent(down ? "keydown" : "keyup", {
              key: key.kbd[0],
              code: key.kbd[0],
              bubbles: true,
              cancelable: true,
            }),
          );
        }
      },
      async send(file, label) {
        const name = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
        // The local copy lives in the emulator's own FS. The remote path is only the file name:
        // the Nspire OS already saves incoming link files under /documents, so sending
        // "/documents/x" would make it "/documents/documents/x", whose folder doesn't exist,
        // and the put would fail with "Didn't get FF 00 or 06 XX".
        const local = `/documents/${name}`;
        const remote = name;
        try {
          emu.FS.mkdirTree("/documents");
        } catch {
          /* already exists */
        }
        emu.FS.writeFile(local, file.bytes);
        try {
          // The no-progress window scales with the file size: the emulated OS accepts a big file and
          // writes it to flash in emulated time, which runs slower than wall-clock, so a large
          // transfer can legitimately go quiet for far longer than 15 s. Every progress report
          // resets the timer, so this only bounds a real stall.
          const stallMs = 15000 + Math.ceil(file.bytes.length / 1024) * 1000;
          // Whether the core popped the queued file (progress < 0). A stalled attempt leaves it
          // queued, so retries after a stall just keep waiting instead of queueing duplicates.
          let refused = false;
          for (let attempt = 0; ; attempt++) {
            try {
              await new Promise<void>((resolve, reject) => {
                let timer = 0,
                  shown = -1;
                const stall = () => {
                  window.clearTimeout(timer);
                  timer = window.setTimeout(() => {
                    fbProgress = null;
                    reject(
                      new Error(
                        "The calculator stopped taking the file. Is it on the home screen?",
                      ),
                    );
                  }, stallMs);
                };
                fbProgress = (p) => {
                  if (p >= 100) {
                    window.clearTimeout(timer);
                    fbProgress = null;
                    resolve();
                  } else if (p < 0) {
                    window.clearTimeout(timer);
                    fbProgress = null;
                    refused = true;
                    reject(new Error("The calculator refused the file."));
                  } else {
                    stall();
                    const percent = Math.min(99, p);
                    if (percent >= shown + 10) {
                      shown = percent - (percent % 10);
                      opts.say(`${label}… ${shown}%`);
                    }
                  }
                };
                stall();
                if (typeof emu._fb_send !== "function") {
                  window.clearTimeout(timer);
                  fbProgress = null;
                  reject(
                    new Error(
                      "This Firebird WASM build does not support _fb_send.",
                    ),
                  );
                } else if (attempt === 0 || refused) {
                  refused = false;
                  const localPtr = allocCString(local);
                  const remotePtr = allocCString(remote);
                  try {
                    emu._fb_send(localPtr, remotePtr);
                  } finally {
                    emu._free?.(localPtr);
                    emu._free?.(remotePtr);
                  }
                }
                // else: the stalled attempt left the file queued in the core, whose 100 Hz throttle
                // pump starts it once the calculator is ready; just wait for progress.
              });
              break;
            } catch (err) {
              if (attempt === 4) throw err;
              log(
                `Retrying ${file.name}: the calculator wasn't ready yet.`,
                "info",
              );
              await sleep(2000);
            }
          }
        } finally {
          fbProgress = null;
          try {
            emu.FS.unlink(local);
          } catch {
            /* already gone */
          }
        }
      },
      reset: () => {
        if (typeof emu._fb_reset === "function") emu._fb_reset();
      },
      stop() {
        if (createdCanvas && domCanvas?.parentNode) {
          domCanvas.parentNode.removeChild(domCanvas);
        }
        try {
          if (
            typeof emu._fb_flash_dirty === "function" &&
            typeof emu._fb_save_flash === "function"
          ) {
            if (emu._fb_flash_dirty() && emu._fb_save_flash()) {
              const bytes = emu.FS.readFile("/flash.img");
              void saveNspireFlash(bytes).catch(() => {});
            }
          }
        } catch {
          /* ignore */
        }
      },
      async launch() {
        throw new Error(
          "Run it from the Nspire's home screen: TIde starts programs on the TI-83 Plus, 84 Plus and CE.",
        );
      },
      async type(text) {
        for (const c of text) {
          const key =
            LAYOUT_NS.byKbd.get(c) ?? LAYOUT_NS.byKbd.get(c.toLowerCase());
          if (key) await tap(key, 100, 120);
        }
      },
      async openApp() {
        throw new Error("app.open works on the TI-83 Plus, 84 Plus and CE.");
      },
    };
  }

  async function start(): Promise<boolean> {
    const have = (known = await files());
    fillMenu(have);
    if (choice === "real") {
      setCredit();
      if (engine && isReal(engine.kind)) {
        showLinked();
        return true;
      }
      setup(
        "Plug in your calculator: over USB (a calculator with a USB port, or the SilverLink cable for older ones), or on a serial port with TI's grey TI-Graph Link. Turn it on, and connect: TIde lists every connection it can find.\nOn Windows, USB needs the WinUSB driver for the calculator or cable: install it with Zadig (zadig.akeo.ie), as for TILP.",
        "connect",
      );
      ui.state.textContent = "";
      return false;
    }
    const rom = choice.startsWith("rom:") ? choice.slice(4) : null;
    const ce = choice.startsWith("ce:") ? choice.slice(3) : null;
    setCredit();
    if (choice === "nspire") {
      if (!have.nspire.boot1 || !have.nspire.flash) {
        const missing = !have.nspire.boot1 && !have.nspire.flash ? "its boot1 and flash images" : !have.nspire.flash ? "its flash image" : "its boot1 image";
        showImages(`To run the TI-Nspire CX, choose ${missing} below, dumped from your own calculator. TIde keeps copies in its data folder.`);
        return false;
      }
    } else if (!rom && !(ce && have.ces.includes(ce))) {
      showImages("To run a TI-84 Plus CE or TI-83 Premium CE, choose its ROM below, dumped from your own calculator; or start another calculator you have images for. TIde keeps copies in its data folder.");
      return false;
    }
    setup("", null);
    ui.state.textContent = "starting…";
    // The draw loop only starts once the engine is up; until then show a loading screen, not a black one.
    setScreenSize(320, 240);
    drawOff("Loading…");
    let next: Engine | null;
    let startError = "";
    try {
      next =
        choice === "nspire"
          ? await startFirebird()
          : rom
            ? await startTilem(rom)
            : await startCemu(ce!);
    } catch (err) {
      startError = err instanceof Error ? err.message : String(err);
      log(startError, "err");
      next = null;
    }
    if (!next) {
      const fallback =
        choice === "nspire"
          ? "Firebird couldn't start with those images. Choose a TI-Nspire CX boot1 and flash image, or pick a different calculator above."
          : rom
            ? `TilEm couldn't start with ${rom}. Choose another ROM, or pick a different calculator above.`
            : "CEmu couldn't start with that ROM. Choose a TI-84 Plus CE ROM.";
      showImages(startError ? `${fallback} (${startError})` : fallback);
      if (startError) opts.say(startError);
      ui.state.textContent = "";
      return false;
    }
    engine = next;
    setCredit();
    buildKeypad(engine.layout);
    setScreenSize(engine.width, engine.height);
    ui.state.textContent = "running";
    if (rom) log(`Started a ${engine.model} from ${rom}.`, "info");
    if (choice === "nspire")
      log(
        "Started a TI-Nspire CX from the stored boot1 and flash images.",
        "info",
      );
    if (!drawing) {
      drawing = true;
      requestAnimationFrame(draw);
    }
    return true;
  }

  const ready = (): Promise<boolean> => {
    if (engine) {
      if (isReal(engine.kind)) showLinked();
      return Promise.resolve(true);
    }
    return (starting ??= start().finally(() => {
      starting = null;
    }));
  };

  /** Stops the running calculator, so the next ready() starts the chosen one afresh. */
  async function stop() {
    if (starting) await starting.catch(() => false);
    engine?.stop();
    engine = null;
    sentLibs.clear();
  }

  async function choose(next: string) {
    choice = next;
    remember(MODEL_PREF, next);
    await stop();
    fillMenu(known);
    if (await ready()) say(`Switched to the ${engine!.model}.`);
    else if (next === "real")
      say("Connect your calculator to send files to it.");
  }

  /** Add a ROM… and the Calculator images… button: the images popup, for every calculator. */
  async function addRom() {
    await openImages();
  }

  ui.model.addEventListener("change", async () => {
    const value = ui.model.value;
    ui.model.value = choice; // until the choice is made
    if (value === "add") return addRom();
    // Removing an image is in the images popup.
    if (value !== choice) await choose(value);
  });
  ui.rom.addEventListener("click", () => void addRom());
  ui.connect.addEventListener("click", () => void connectReal());
  ui.disconnect.addEventListener("click", async () => {
    await stop();
    say("Disconnected the calculator.");
    await ready();
  });
  ui.reset.addEventListener("click", () => {
    engine?.reset();
    sentLibs.clear();
    say("Reset the calculator.");
  });
  // Reload ROM: stop this emulator and boot a new one from the stored ROM, as if the calculator was
  // just turned on with a fresh memory. Picks up a ROM changed with Choose ROM… too.
  ui.reload.addEventListener("click", async () => {
    ui.reload.disabled = true;
    try {
      await stop();
      log("Reloading the ROM…", "info");
      if (await ready()) say("Reloaded the ROM.");
    } catch (err) {
      say(`Could not reload the ROM: ${err}`);
    } finally {
      ui.reload.disabled = false;
    }
  });

  const view: Calc = {
    get visible() {
      return !ui.panel.hidden;
    },
    get consoleShown() {
      return consoleOpen;
    },
    set consoleShown(on: boolean) {
      showConsole(on);
    },
    async show() {
      ui.panel.hidden = false;
      opts.layout();
      if ((await ready()) && engine && !isReal(engine.kind)) ui.lcd.focus();
    },
    hide() {
      ui.panel.hidden = true;
      opts.layout();
    },
    async family() {
      // Starts the calculator without showing it, so the tab you're on stays active.
      return (await ready()) ? engine!.family : null;
    },
    async send(files) {
      await view.show();
      if (!engine) {
        say(
          isReal(choice)
            ? "Connect your calculator to send files to it."
            : "Set up the calculator to send files to it.",
        );
        return;
      }
      const all = (
        await Promise.all(
          files.map((f) => (BUNDLE.test(f.name) ? unbundle(f) : [f])),
        )
      ).flat();
      const skipped = all.filter((f) => !SENDABLE.test(f.name));
      const sendable = all.filter((f) => SENDABLE.test(f.name));
      for (const [i, file] of sendable.entries()) {
        const label = `Sending ${file.name}${sendable.length > 1 ? ` (${i + 1} of ${sendable.length})` : ""}`;
        say(`${label}…`);
        try {
          await engine.send(file, label);
        } catch (err) {
          throw new Error(
            `${file.name}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }
      if (skipped.length)
        say(
          `Skipped ${skipped.map((f) => f.name).join(", ")}: not a TI file a calculator can receive.`,
        );
      else if (sendable.length)
        say(
          `Sent ${sendable.length === 1 ? sendable[0].name : `${sendable.length} files`} to the ${engine.model}.`,
        );
    },
    setLink(cfg) {
      prefer = cfg ?? {};
      // A project that names its cable switches the calculator to a real one, unless it already is.
      if (cfg?.via && choice !== "real") void choose("real");
    },
    async connectReal() {
      // From anywhere (the Serial tab, the Calculator menu): the calculator becomes the real one, without
      // leaving the tab you're on.
      if (choice !== "real") {
        await stop();
        choice = "real";
        remember(MODEL_PREF, choice);
        fillMenu(known);
        setCredit();
      }
      await connectReal();
    },
    async disconnectReal() {
      if (engine && isReal(engine.kind)) {
        await stop();
        if (!ui.panel.hidden) void ready();
      }
    },
    async macro(name, arg) {
      await view.show();
      if (!engine) throw new Error("Set up the calculator to run macros.");
      switch (name) {
        case "key.press": {
          if (engine.press) {
            await engine.press(arg);
            break;
          }
          const key = engine.layout.macro.get(arg.toLowerCase());
          if (!key)
            throw new Error(
              `key.press doesn't know "${arg}". Use a key name such as enter, clear, 2nd, alpha, up or 5.`,
            );
          await tap(key);
          break;
        }
        case "key.type":
          await engine.type(arg);
          break;
        case "program.run":
        case "program.open":
          await engine.launch(arg);
          break;
        case "app.open":
          await engine.openApp(arg);
          break;
        case "wait":
          await sleep(Math.max(0, Number(arg) || 0));
          break;
        default:
          throw new Error(`Unknown macro ${name}.`);
      }
      say(`${name}(${arg})`);
    },
    async run(programs, launch, libs = []) {
      await view.show();
      // The CE C libraries are only for the CE.
      const wanted = engine?.family === "ce" ? libs : [];
      const newLibs = wanted.filter(
        (l) => !sentLibs.has(`${l.name}:${l.bytes.length}`),
      );
      await view.send([...newLibs, ...programs]);
      if (!engine) return;
      for (const l of newLibs) sentLibs.add(`${l.name}:${l.bytes.length}`);
      if (launch) {
        try {
          await engine.launch(launch);
          say(`Running ${launch}`);
        } catch (err) {
          say(
            `Sent to the ${engine.model}. ${err instanceof Error ? err.message : err}`,
          );
        }
      } else say(`Sent to the ${engine.model}`);
      if (!isReal(engine.kind)) ui.lcd.focus();
    },
  };
  ui.close.addEventListener("click", () => view.hide());

  // Send files…, or drop them on the calculator.
  async function sendPaths(paths: string[]) {
    if (!paths.length) return;
    try {
      const files = await Promise.all(
        paths.map(async (p) => ({
          name: p.split(/[\\/]/).pop()!,
          bytes: await opts.readFile(p),
        })),
      );
      await view.send(files);
    } catch (err) {
      say(`Could not send: ${err instanceof Error ? err.message : err}`);
    }
  }
  ui.send.addEventListener("click", async () =>
    sendPaths(await opts.pickFiles()),
  );
  const dropping = (on: boolean) => {
    ui.drop.hidden = !on;
  };
  // The page gets the files themselves, in the desktop app too (its window leaves drops to the
  // page), and files dragged from the Explorer as their paths.
  ui.panel.addEventListener("dragover", (e) => {
    const types = e.dataTransfer?.types ?? [];
    if (!types.includes("Files") && !types.includes(TREE_DRAG)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    dropping(true);
  });
  ui.panel.addEventListener("dragleave", (e) => {
    if (!ui.panel.contains(e.relatedTarget as Node | null)) dropping(false);
  });
  ui.panel.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropping(false);
    const fromTree = e.dataTransfer?.getData(TREE_DRAG);
    if (fromTree) return sendPaths(fromTree.split("\n").filter(Boolean));
    // Extensions install instead, from the window's own drop handler.
    const list = [...(e.dataTransfer?.files ?? [])].filter(
      (f) => !/\.tideex$/i.test(f.name),
    );
    if (!list.length) return;
    try {
      await view.send(
        await Promise.all(
          list.map(async (f) => ({
            name: f.name,
            bytes: new Uint8Array(await f.arrayBuffer()),
          })),
        ),
      );
    } catch (err) {
      say(`Could not send: ${err instanceof Error ? err.message : err}`);
    }
  });
  return view;
}
