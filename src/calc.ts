// The calculator panel. Two emulator cores, compiled to WebAssembly and built into TIde, run here:
// - CEmu's (WebCEmu) for the TI-84 Plus CE, which sends over the emulated USB link and launches
//   programs the way CEmu's --launch does;
// - Wabbitemu's (WabbitEmu) for the TI-73, 81, 82, 83, 83 Plus, 83 Plus SE, 84 Plus, 84 Plus SE, 85
//   and 86, which runs a frame at a time on TIde's timer and sends files over its link at once.
// The model menu on the calculator bar picks one: the CE, or any ROM you've added for the others.
// Both draw to the same canvas and share one keypad, relabelled for the TI-85 and 86.
import { invoke } from "@tauri-apps/api/core";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

/** Every TI file a calculator can receive. Bundles (.b84, .b83) are zips of 8x files. */
export const SEND_TYPES = ["8xp", "8xv", "8xl", "8xn", "8xm", "8xy", "8xg", "8xs", "8xd", "8xw", "8xc", "8xz", "8xt",
  "8ca", "8cg", "8ci", "8ek", "8xk", "8eu", "8pu", "8yu", "b84", "b83",
  "73p", "73l", "73n", "73g", "73k", "82p", "82l", "82n", "82m", "82g", "83p", "83l", "83n", "83m", "83g",
  "85p", "85s", "85l", "85n", "85m", "85g", "86p", "86s", "86l", "86n", "86m", "86g", "85b", "86b", "82b", "83b"];
const BUNDLE = /\.b8[34]$/i;
const SENDABLE = new RegExp(`\\.(?:${SEND_TYPES.join("|")})$`, "i");

export interface TiFile { name: string; bytes: Uint8Array }

/**
 * A copy of a TI variable file with every variable marked as archived, and its checksum updated.
 * The calculator only takes groups into archive memory ("file must be archived"), and many .8xg
 * files, clibs.8xg among them, are saved with the flag off.
 */
function archived(file: Uint8Array): Uint8Array {
  const out = file.slice();
  const view = new DataView(out.buffer);
  const end = out.length - 2; // the last two bytes are the checksum
  for (let at = 55; at + 17 <= end;) { // entries follow the 55-byte file header
    const headerLen = view.getUint16(at, true), dataLen = view.getUint16(at + 2, true);
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
  const b = bundle.bytes, view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let end = b.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--; // end of central directory
  if (end < 0) throw new Error(`${bundle.name} isn't a valid bundle.`);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const out: TiFile[] = [];
  for (let i = 0; i < count; i++) {
    const method = view.getUint16(at + 10, true), size = view.getUint32(at + 20, true);
    const nameLen = view.getUint16(at + 28, true), extra = view.getUint16(at + 30, true), comment = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = new TextDecoder().decode(b.subarray(at + 46, at + 46 + nameLen)).split("/").pop()!;
    at += 46 + nameLen + extra + comment;
    if (!SENDABLE.test(name) || BUNDLE.test(name)) continue; // skips the bundle's metadata
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const data = b.subarray(start, start + size);
    if (method === 0) out.push({ name, bytes: data.slice() });
    else if (method === 8) {
      const inflated = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      out.push({ name, bytes: new Uint8Array(await new Response(inflated).arrayBuffer()) });
    } else throw new Error(`${name} in ${bundle.name} uses an unsupported compression.`);
  }
  return out;
}

interface WebCEmu {
  FS: { writeFile(path: string, data: Uint8Array): void; unlink(path: string): void };
  callMain(args: string[]): void;
  ccall(name: string, ret: string | null, types: string[], args: unknown[]): unknown;
  _lcd_get_frame(): number;
  _emu_keypad_event(row: number, col: number, press: number): void;
  _emu_reset(): void;
  _sendKey(key: number): number;
  /** Emscripten's main loop controls. */
  pauseMainLoop?(): void;
}
interface WabbitEmu {
  FS: { writeFile(path: string, data: Uint8Array): void; unlink(path: string): void };
  ccall(name: string, ret: string | null, types: string[], args: unknown[]): unknown;
  UTF8ToString(ptr: number): string;
  HEAPU8: Uint8Array;
  _wabbit_fps(): number;
  _wabbit_frame(): void;
  _wabbit_lcd(): number;
  _wabbit_lcd_width(): number;
  _wabbit_lcd_on(): number;
  _wabbit_key(group: number, bit: number, down: number): void;
  _wabbit_reset(): void;
  _wabbit_programs(): number;
}
type Factory<T> = (options: Record<string, unknown>) => Promise<T>;

/** Wabbitemu's model numbers, as names. */
const WABBIT_MODELS = ["TI-81", "TI-82", "TI-83", "TI-85", "TI-86", "TI-73", "TI-83 Plus", "TI-83 Plus SE", "TI-84 Plus", "TI-84 Plus SE"];
const TI_85 = 3, TI_86 = 4, TI_83P = 6;

/**
 * A key: label, position and optional keyboard keys. Positions are the CE's keypad matrix (group
 * and bit); the other models use the same layout, with group 7 − row, so one keypad serves all.
 */
interface Key { label: string; row: number; col: number; kbd?: string[]; cls?: string }
const k = (label: string, row: number, col: number, kbd?: string[], cls?: string): Key => ({ label, row, col, kbd, cls });
// Keyboard bindings are CEmu's default keymap (gui/qt/keypad/keymap.cpp): letters press the key that
// types them with alpha (A is math, B is apps…), so names can be typed as on the calculator.
const KEYPAD: Key[][] = [
  [k("y=", 1, 4, ["F1"], "fn"), k("window", 1, 3, ["F2"], "fn"), k("zoom", 1, 2, ["F3"], "fn"), k("trace", 1, 1, ["F4"], "fn"), k("graph", 1, 0, ["F5"], "fn")],
  [k("2nd", 1, 5, ["Tab", ";"], "second"), k("mode", 1, 6, ["Home", "Backspace"]), k("del", 1, 7, ["Delete", "Insert"])],
  [k("alpha", 2, 7, ["'"], "alpha"), k("X,T,θ,n", 3, 7, ["_"]), k("stat", 4, 7, ["End"])],
  [k("math", 2, 6, ["=", "a"]), k("apps", 3, 6, ["PageUp", "b"]), k("prgm", 4, 6, ["PageDown", "c"]), k("vars", 5, 6, ["<", "|"]), k("clear", 6, 6, ["Escape"])],
  [k("x⁻¹", 2, 5, ["\\", "d"]), k("sin", 3, 5, ["$", "e"]), k("cos", 4, 5, ["%", "f"]), k("tan", 5, 5, ["&", "g"]), k("^", 6, 5, ["^", "h"])],
  [k("x²", 2, 4, ["@", "i"]), k(",", 3, 4, [",", "j"]), k("(", 4, 4, ["(", "{", "k"]), k(")", 5, 4, [")", "}", "l"]), k("÷", 6, 4, ["/", "m"], "op")],
  [k("log", 2, 3, ["!", "n"]), k("7", 3, 3, ["7", "o"], "num"), k("8", 4, 3, ["8", "p"], "num"), k("9", 5, 3, ["9", "q"], "num"), k("×", 6, 3, ["*", "[", "r"], "op")],
  [k("ln", 2, 2, ["`", "s"]), k("4", 3, 2, ["4", "t"], "num"), k("5", 4, 2, ["5", "u"], "num"), k("6", 5, 2, ["6", "v"], "num"), k("−", 6, 2, ["-", "]", "w"], "op")],
  [k("sto→", 2, 1, [">", "x"]), k("1", 3, 1, ["1", "y"], "num"), k("2", 4, 1, ["2", "z"], "num"), k("3", 5, 1, ["3", "#"], "num"), k("+", 6, 1, ["+", '"'], "op")],
  [k("on", 2, 0, ["F12"]), k("0", 3, 0, ["0", " "], "num"), k(".", 4, 0, [".", ":"], "num"), k("(−)", 5, 0, ["~", "?"], "num"), k("enter", 6, 0, ["Enter"], "op")],
];
const ARROWS: Key[] = [k("▲", 7, 3, ["ArrowUp"]), k("◀", 7, 1, ["ArrowLeft"]), k("▶", 7, 2, ["ArrowRight"]), k("▼", 7, 0, ["ArrowDown"])];

// The TI-85 and 86 have the same matrix with other labels, and their letters on other keys.
const RELABEL_86: Record<string, [string, string[]]> = {
  "y=": ["F1", ["F1"]], window: ["F2", ["F2"]], zoom: ["F3", ["F3"]], trace: ["F4", ["F4"]], graph: ["F5", ["F5"]],
  mode: ["exit", ["Escape", "Home"]], del: ["more", ["End", "PageDown"]], "X,T,θ,n": ["x-var", ["_", "="]], stat: ["del", ["Delete", "Backspace"]],
  math: ["graph", ["Insert"]], apps: ["stat", ["PageUp"]], prgm: ["prgm", []], vars: ["custom", ["|"]], clear: ["clear", ["\\"]],
  "x⁻¹": ["log", ["!", "a"]], sin: ["sin", ["$", "b"]], cos: ["cos", ["%", "c"]], tan: ["tan", ["&", "d"]], "^": ["^", ["^", "e"]],
  "x²": ["ln", ["`", "f"]], ",": ["EE", ["g"]], "(": ["(", ["(", "{", "h"]], ")": [")", [")", "}", "i"]], "÷": ["÷", ["/", "j"]],
  log: ["x²", ["@", "k"]], "7": ["7", ["7", "l"]], "8": ["8", ["8", "m"]], "9": ["9", ["9", "n"]], "×": ["×", ["*", "[", "o"]],
  ln: [",", [",", "p"]], "4": ["4", ["4", "q"]], "5": ["5", ["5", "r"]], "6": ["6", ["6", "s"]], "−": ["−", ["-", "]", "t"]],
  "sto→": ["sto→", [">"]], "1": ["1", ["1", "u"]], "2": ["2", ["2", "v"]], "3": ["3", ["3", "w"]], "+": ["+", ["+", "x"]],
  "0": ["0", ["0", "y"]], ".": [".", [".", "z"]], "(−)": ["(−)", ["~", " "]],
};
const KEYPAD_86: Key[][] = KEYPAD.map(row => row.map(key => {
  const [label, kbd] = RELABEL_86[key.label] ?? [key.label, key.kbd ?? []];
  return { ...key, label, kbd: key.label === "2nd" || key.label === "alpha" || key.label === "on" || key.label === "enter" ? key.kbd : kbd };
}));

interface Layout { keypad: Key[][]; byKbd: Map<string, Key>; macro: Map<string, Key> }
function layout(keypad: Key[][]): Layout {
  const all = [...keypad.flat(), ...ARROWS];
  const byLabel = (label: string) => all.find(key => key.label.toLowerCase() === label);
  const aliases: [string, string][] = [["yequ", "y="], ["sto", "sto→"], ["store", "sto→"], ["x^2", "x²"], ["square", "x²"], ["x^-1", "x⁻¹"],
    ["inverse", "x⁻¹"], ["neg", "(−)"], ["negative", "(−)"], ["-", "−"], ["*", "×"], ["/", "÷"], ["xtθn", "x,t,θ,n"], ["xton", "x,t,θ,n"],
    ["power", "^"], ["second", "2nd"], ["delete", "del"], ["up", "▲"], ["left", "◀"], ["right", "▶"], ["down", "▼"],
    ["f1", "f1"], ["f2", "f2"], ["f3", "f3"], ["f4", "f4"], ["f5", "f5"], ["xvar", "x-var"]];
  return {
    keypad,
    byKbd: new Map(all.flatMap(key => (key.kbd ?? []).map(name => [name, key] as const))),
    macro: new Map([
      ...all.map(key => [key.label.toLowerCase(), key] as [string, Key]),
      ...aliases.flatMap(([alias, label]) => { const key = byLabel(label); return key ? [[alias, key] as [string, Key]] : []; }),
    ]),
  };
}
const LAYOUT_CE = layout(KEYPAD), LAYOUT_86 = layout(KEYPAD_86);

/** How a binding reads in a tooltip. */
const keyName = (name: string) => (name === " " ? "Space" : name.length === 1 ? name.toUpperCase() : name.replace(/^Page/, "Page "));

/** CE OS key codes used to launch a program, as CEmu's --launch does: clear, prgm, the name, enter. */
const KEY_ENTER = 0x05, KEY_CLEAR = 0x09, KEY_PRGM = 0xda;
const letterKey = (c: string) => (/[0-9]/.test(c) ? 0x8e + +c : /[A-Z]/.test(c) ? 0x9a + c.charCodeAt(0) - 65 : c === "θ" ? 0xcc : 0);

/** A running emulator: the CE's (CEmu) or another model's (Wabbitemu). */
interface Engine {
  kind: "cemu" | "wabbit";
  /** The model's name, such as "TI-84 Plus". */
  model: string;
  /** "ce", "plus" (a TI-83 Plus or 84 Plus, which runs .8xp programs) or "other". */
  family: "ce" | "plus" | "other";
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
}

export interface Calc {
  /** Opens the panel; starts the emulator if its ROM is in place. */
  show(): Promise<void>;
  hide(): void;
  readonly visible: boolean;
  /** Whether the console under the calculator is shown. */
  consoleShown: boolean;
  /** Which kind of calculator is running, starting it if needed: null when it isn't set up. */
  family(): Promise<"ce" | "plus" | "other" | null>;
  /** Sends programs to the calculator and launches `launch` once they arrive. */
  /** Libraries (like clibs.8xg) are sent once per calculator session, before the programs. */
  run(files: TiFile[], launch: string, libs?: TiFile[]): Promise<void>;
  /** Runs a calculator macro from tide.json, such as key.press(enter). */
  macro(name: string, arg: string): Promise<void>;
  /** Sends any TI files, unpacking bundles. */
  send(files: TiFile[]): Promise<void>;
}

const sleep = (ms: number) => new Promise(r => window.setTimeout(r, ms));

export function createCalc(opts: {
  say: (text: string) => void;
  pickRom: () => Promise<string | null>;
  pickFiles: () => Promise<string[]>;
  readFile: (path: string) => Promise<Uint8Array>;
  layout: () => void;
}): Calc {
  const ui = {
    panel: $("calc"),
    model: $<HTMLSelectElement>("calc-model"),
    state: $("calc-state"),
    setup: $("calc-setup"),
    setupText: $("calc-setup-text"),
    rom: $<HTMLButtonElement>("calc-rom"),
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
    const atEnd = ui.log.scrollTop + ui.log.clientHeight >= ui.log.scrollHeight - 4;
    const line = document.createElement("div");
    line.className = `line ${kind}`;
    line.textContent = text;
    ui.log.append(line);
    while (ui.log.childElementCount > 2000) ui.log.firstElementChild!.remove();
    if (atEnd) ui.log.scrollTop = ui.log.scrollHeight;
  }
  /** Status bar and console. */
  const say = (text: string) => { opts.say(text); log(text, "info"); };
  function showConsole(on: boolean) {
    ui.console.hidden = !on;
    ui.consoleToggle.setAttribute("aria-pressed", String(on));
    try { localStorage.setItem(CONSOLE_PREF, on ? "1" : "0"); } catch { /* storage unavailable */ }
    if (on) ui.log.scrollTop = ui.log.scrollHeight;
  }
  let consoleOpen = true;
  try { consoleOpen = localStorage.getItem(CONSOLE_PREF) !== "0"; } catch { /* storage unavailable */ }
  showConsole(consoleOpen);
  ui.consoleToggle.addEventListener("click", () => showConsole(ui.console.hidden !== false));
  ui.consoleClear.addEventListener("click", () => ui.log.replaceChildren());

  let engine: Engine | null = null;
  let starting: Promise<boolean> | null = null;
  let drawing = false;
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
    frame.width = width; frame.height = height;
    fctx = frame.getContext("2d")!;
    image = fctx.createImageData(width, height);
    fit();
  }
  // The screen and the keypad are two panes of the same size: side by side when there is room,
  // stacked when the editor area is narrow. Each pane is as large as the space allows.
  const GAP = 24, BEZEL = 28;
  function fit() {
    if (ui.panel.hidden) return;
    const dpr = window.devicePixelRatio || 1;
    const style = getComputedStyle(body);
    const w = body.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const h = body.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const stacked = w < 680;
    const paneW = stacked ? w : (w - GAP) / 2;
    const paneH = Math.max(260, Math.min(stacked ? (h - GAP) / 2 : h, (paneW - BEZEL) * 3 / 4 + BEZEL, 760));
    const innerW = Math.floor(((paneH - BEZEL) * 4) / 3), innerH = Math.floor(paneH - BEZEL);
    body.classList.toggle("stacked", stacked);
    body.style.setProperty("--pane-w", `${innerW + BEZEL}px`);
    body.style.setProperty("--pane-h", `${Math.floor(paneH)}px`);
    // The screen keeps its own shape (4:3 on the CE, 3:2 or 2:1 on the others) inside the pane.
    const aspect = frame.width / frame.height;
    const cssW = Math.min(innerW, innerH * aspect), cssH = cssW / aspect;
    const k = Math.max(2, Math.ceil((cssW * dpr) / frame.width));
    ui.lcd.width = frame.width * k; ui.lcd.height = frame.height * k;
    ui.lcd.style.width = `${cssW}px`;
    ui.lcd.style.height = `${cssH}px`;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame, 0, 0, ui.lcd.width, ui.lcd.height);
  }
  const resize = new ResizeObserver(fit);
  resize.observe(ui.area);
  resize.observe(body);

  function drawOff() {
    // As CEmu shows it: a dark screen that says the LCD is off.
    ctx.fillStyle = "#101418";
    ctx.fillRect(0, 0, ui.lcd.width, ui.lcd.height);
    ctx.fillStyle = "#8b9cbb";
    ctx.font = `600 ${Math.round(ui.lcd.height / 12)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LCD OFF", ui.lcd.width / 2, ui.lcd.height / 2);
  }

  /** Each animation frame: copy the LCD to the canvas. */
  function draw() {
    if (!engine) { drawing = false; return; }
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
  const press = (key: Key, down: boolean) => engine?.key(key, down);
  /** Presses and releases a key, waiting for the calculator to see both. */
  const tap = async (key: Key, hold = 120, after = 180) => { press(key, true); await sleep(hold); press(key, false); await sleep(after); };
  let shownLayout: Layout | null = null;
  function buildKeypad(l: Layout) {
    if (shownLayout === l) return;
    shownLayout = l;
    const button = (key: Key) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = key.label;
      b.className = `key ${key.cls ?? ""}`;
      b.title = key.kbd?.length ? `${key.label} (${key.kbd.map(keyName).join(" or ")})` : key.label;
      const release = () => { press(key, false); window.removeEventListener("pointerup", release); };
      b.addEventListener("pointerdown", e => { e.preventDefault(); ui.lcd.focus(); press(key, true); window.addEventListener("pointerup", release); });
      return b;
    };
    const arrows = document.createElement("div");
    arrows.className = "arrows";
    arrows.append(...ARROWS.map(button));
    ui.keypad.replaceChildren(...l.keypad.map((row, i) => {
      const div = document.createElement("div");
      div.className = "keyrow";
      div.append(...row.map(button));
      if (i === 1) div.append(arrows); // the arrow pad sits beside 2nd, mode and del
      return div;
    }));
  }
  buildKeypad(LAYOUT_CE);

  // The physical keyboard drives the calculator while the screen has focus, with CEmu's bindings.
  // A key is released by its physical position, since Shift can change what it types in between.
  const held = new Map<string, Key>();
  ui.lcd.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave TIde's shortcuts alone
    const map = (engine?.layout ?? LAYOUT_CE).byKbd;
    const key = map.get(e.key) ?? map.get(e.key.toLowerCase());
    if (!key) return;
    e.preventDefault();
    e.stopPropagation(); // F5 is graph here, not Run
    if (e.repeat || held.has(e.code)) return;
    held.set(e.code, key);
    press(key, true);
  });
  ui.lcd.addEventListener("keyup", e => {
    const key = held.get(e.code);
    if (!key) return;
    e.preventDefault();
    held.delete(e.code);
    press(key, false);
  });
  ui.lcd.addEventListener("blur", () => { for (const key of held.values()) press(key, false); held.clear(); });

  // ── Models and files ──
  type Files = { rom: boolean; roms: string[] };
  const files = () => invoke<Files>("calc_files");
  const read = async (name: string) => new Uint8Array(await invoke<ArrayBuffer>("calc_read", { name }));
  const MODEL_PREF = "tide-pref-calc-model", NAMES_PREF = "tide-pref-calc-rom-models";
  /** "ce", or "rom:" and a stored ROM's file name. */
  let choice = "ce";
  try { choice = localStorage.getItem(MODEL_PREF) ?? "ce"; } catch { /* storage unavailable */ }
  /** The model each stored ROM turned out to be, for the menu. */
  let romModels: Record<string, string> = {};
  try { romModels = JSON.parse(localStorage.getItem(NAMES_PREF) ?? "{}"); } catch { /* storage unavailable or bad JSON */ }
  function remember(key: string, value: unknown) { try { localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); } catch { /* storage unavailable */ } }

  let known: Files | null = null;
  function fillMenu(have: Files | null) {
    const roms = have?.roms ?? (choice.startsWith("rom:") ? [choice.slice(4)] : []);
    const options: [string, string][] = [["ce", "TI-84 Plus CE"], ...roms.map(n => [`rom:${n}`, romModels[n] ? `${romModels[n]} (${n})` : n] as [string, string])];
    if (choice !== "ce" && !roms.includes(choice.slice(4)) && have) choice = "ce";
    options.push(["add", "Add a ROM…"]);
    if (choice.startsWith("rom:")) options.push(["remove", `Remove ${choice.slice(4)}…`]);
    ui.model.replaceChildren(...options.map(([value, label]) => Object.assign(document.createElement("option"), { value, textContent: label })));
    ui.model.value = choice;
  }
  fillMenu(null);

  function setup(text: string, rom: boolean) {
    ui.setup.hidden = !text;
    ui.setupText.textContent = text;
    ui.rom.hidden = !rom;
    ui.screen.hidden = !!text;
  }

  async function loadModule<T>(script: Uint8Array, options: Record<string, unknown>): Promise<T> {
    const url = URL.createObjectURL(new Blob([script as BlobPart], { type: "text/javascript" }));
    try { return await ((await import(/* @vite-ignore */ url)).default as Factory<T>)(options); } finally { URL.revokeObjectURL(url); }
  }

  // ── CEmu, for the TI-84 Plus CE ──
  let transfer: { resolve: () => void; reject: (e: Error) => void; progress: (value: number, total: number) => void } | null = null;
  async function startCemu(): Promise<Engine | null> {
    const [script, wasm, rom] = await Promise.all([read("WebCEmu.js"), read("WebCEmu.wasm"), read("CE.rom")]);
    // The core's main() reports through these globals, as CEmu's own web page defines them.
    const w = window as unknown as Record<string, unknown>;
    let ok = false;
    Object.assign(w, {
      emul_is_inited: false, emul_is_paused: false,
      initFuncs: () => {}, initLCD: () => {}, enableGUI: () => { ok = true; }, disableGUI: () => { ok = false; },
      // CEmu reports bytes sent out of the total while a transfer runs; that count can reach the total
      // before it is finished (a group sends several variables). The real end comes when the USB
      // transfer closes: (1, 1) when it worked, (0, 0) when it failed.
      transferProgressCallback: (value: number, total: number) => {
        if (!transfer) return;
        if (value === 1 && total === 1) { transfer.resolve(); transfer = null; }
        else if (value === 0 && total === 0) { transfer.reject(new Error("The calculator refused the file.")); transfer = null; }
        else transfer.progress(value, total);
      },
      transferErrorCallback: () => { transfer?.reject(new Error("The calculator refused the file.")); transfer = null; },
    });
    let memory: WebAssembly.Memory | null = null;
    const emu = await loadModule<WebCEmu>(script, {
      print: (t: string) => log(t, "out"),
      // CEmu reports its own status on stderr too; only real errors get the warning color.
      printErr: (t: string) => log(t, /\b(?:error|fail|bad|couldn't|invalid)/i.test(t) ? "err" : "emu"),
      // Instantiate the WebAssembly ourselves to keep its memory, which holds the LCD.
      instantiateWasm(imports: WebAssembly.Imports, done: (instance: WebAssembly.Instance) => void) {
        WebAssembly.instantiate(wasm as BufferSource, imports).then(({ instance }) => {
          memory = (Object.values(instance.exports).find(e => e instanceof WebAssembly.Memory) as WebAssembly.Memory) ?? null;
          done(instance);
        });
        return {};
      },
    });
    emu.FS.writeFile("CE.rom", rom);
    try { emu.callMain([]); } catch { /* main() hands over to the browser's frame loop by throwing */ }
    if (!ok) return null;
    // Run on a 16 ms timer rather than animation frames, so emulation keeps its speed when the
    // page draws slowly or the window is behind another one. Drawing still follows the frames.
    emu.ccall("emsc_set_main_loop_timing", "number", ["number", "number"], [0, 16]);
    // The OS takes one key code at a time; sendKey refuses until it has read the last one.
    const keyQueue: number[] = [];
    const feeding = window.setInterval(() => { if (keyQueue.length && emu._sendKey(keyQueue[0])) keyQueue.shift(); }, 20);
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
      const first = px[0], rgb = first & 0xffffff;
      let blank = rgb !== 0 && rgb !== 0xffffff && (rgb & 0xff) === (rgb >> 8 & 0xff) && (rgb & 0xff) === (rgb >> 16);
      for (let i = 1; blank && i < px.length; i++) if (px[i] !== first) blank = false;
      if (!blank) { blankSince = 0; return false; }
      blankSince ||= performance.now();
      return performance.now() - blankSince > 500;
    };
    return {
      kind: "cemu", model: "TI-84 Plus CE", family: "ce", layout: LAYOUT_CE, width: 320, height: 240,
      frame(out) {
        if (!memory) return true;
        const ptr = emu._lcd_get_frame();
        if (lcdOff(new Uint32Array(memory.buffer, ptr, 320 * 240))) return false;
        const src = new Uint8Array(memory.buffer, ptr, 320 * 240 * 4), dst = out.data;
        for (let i = 0; i < dst.length; i += 4) { // 0x00RRGGBB, little-endian
          dst[i] = src[i + 2]; dst[i + 1] = src[i + 1]; dst[i + 2] = src[i]; dst[i + 3] = 255;
        }
        return true;
      },
      key: (key, down) => emu._emu_keypad_event(key.row, key.col, down ? 1 : 0),
      async send(file, label) {
        const bytes = /\.8xg$/i.test(file.name) ? archived(file.bytes) : file.bytes;
        const path = `/send.${file.name.split(".").pop()}`;
        emu.FS.writeFile(path, bytes);
        try {
          let timer = 0, shown = -1;
          await new Promise<void>((resolve, reject) => {
            // Give up only when the transfer stalls: no progress for 15 seconds. Large apps, groups
            // and OS files keep reporting progress, so they can take as long as they need.
            const stall = () => {
              window.clearTimeout(timer);
              timer = window.setTimeout(() => {
                if (!transfer) return;
                transfer = null;
                reject(new Error("The calculator stopped taking the file. Is it on the home screen?"));
              }, 15000);
            };
            transfer = {
              resolve: () => { window.clearTimeout(timer); resolve(); },
              reject: e => { window.clearTimeout(timer); reject(e); },
              progress: (value, total) => {
                stall();
                const percent = total ? Math.min(99, Math.floor((value / total) * 100)) : 0;
                if (percent >= shown + 10) { shown = percent - (percent % 10); opts.say(`${label}… ${shown}%`); }
              },
            };
            stall();
            emu.ccall("set_file_to_send", null, ["string"], [path]);
          });
        } finally {
          try { emu.FS.unlink(path); } catch { /* already gone */ }
        }
      },
      reset: () => emu._emu_reset(),
      stop() {
        window.clearInterval(feeding);
        try { emu.pauseMainLoop?.(); } catch { /* already stopped */ }
        transfer?.reject(new Error("The calculator was stopped."));
        transfer = null;
      },
      launch: name => typed([KEY_CLEAR, KEY_PRGM, ...[...name.toUpperCase()].map(letterKey).filter(Boolean), KEY_ENTER]),
      type: text => typed([...text.toUpperCase()].map(letterKey).filter(Boolean)),
      async openApp(name) {
        // The apps menu jumps to the first app starting with a letter; Enter opens the selected one.
        await tap(LAYOUT_CE.macro.get("apps")!, 120, 400);
        const first = letterKey(name.charAt(0).toUpperCase());
        if (first) await typed([first]);
        await typed([KEY_ENTER]);
      },
    };
  }

  // ── Wabbitemu, for the TI-73, 81, 82, 83, 83 Plus, 84 Plus, 85 and 86 ──
  const LINK_ERRORS: Record<number, string> = {
    1: "The link failed.", 2: "The calculator didn't answer in time. Is it on the home screen?", 3: "The calculator couldn't load the app.",
    4: "The file was damaged on the way.", 5: "The link wasn't ready.", 6: "There isn't enough memory on the calculator.",
    7: "That file is for a different calculator.", 8: "That isn't a TI file this calculator can read.", 9: "The emulator had a problem.",
  };
  async function startWabbit(name: string): Promise<Engine | null> {
    const [script, wasm, rom] = await Promise.all([read("WabbitEmu.js"), read("WabbitEmu.wasm"), read(`roms/${name}`)]);
    const emu = await loadModule<WabbitEmu>(script, {
      wasmBinary: wasm,
      locateFile: (file: string) => file, // the script is a blob URL, which file names can't be resolved against
      // The core names each file it opens; that is noise here.
      print: (t: string) => { if (!/^(Filename|pext):/.test(t)) log(t, "emu"); },
      printErr: (t: string) => log(t, "err"),
    });
    // The core tells ROMs from saved states by the extension.
    const path = /\.sav$/i.test(name) ? "/calc.sav" : "/calc.rom";
    emu.FS.writeFile(path, rom);
    const id = emu.ccall("wabbit_load", "number", ["string"], [path]) as number;
    if (id < 0 || id >= WABBIT_MODELS.length) return null;
    const model = WABBIT_MODELS[id];
    if (romModels[name] !== model) { romModels[name] = model; remember(NAMES_PREF, romModels); fillMenu(known); }
    const running = window.setInterval(() => emu._wabbit_frame(), 1000 / emu._wabbit_fps());
    // The OS is still settling just after it turns on, and doesn't answer the link yet.
    await sleep(1500);
    const l = id === TI_85 || id === TI_86 ? LAYOUT_86 : LAYOUT_CE;
    const key = (k: Key, down: boolean) => emu._wabbit_key(7 - k.row, k.col, down ? 1 : 0);
    const keyFor = (label: string) => l.macro.get(label)!;
    /** Letters with alpha, digits as they are, from the keys' alpha letters. */
    const typeChar = async (c: string) => {
      const lower = c === "θ" ? "#" : c.toLowerCase();
      if (/[0-9]/.test(c)) return tap(l.byKbd.get(c)!, 100, 120);
      const letter = l.byKbd.get(lower);
      if (!letter) return;
      await tap(keyFor("alpha"), 100, 120);
      await tap(letter, 100, 120);
    };
    const plus = id >= TI_83P;
    return {
      kind: "wabbit", model, family: plus ? "plus" : "other", layout: l, width: emu._wabbit_lcd_width(), height: 64,
      frame(out) {
        if (!emu._wabbit_lcd_on()) return false;
        const width = out.width, ptr = emu._wabbit_lcd(), src = emu.HEAPU8, dst = out.data;
        // The LCD's greens, from clear to dark, as on the real screen.
        for (let y = 0; y < 64; y++) for (let x = 0; x < width; x++) {
          const v = src[ptr + y * 128 + x] / 255, i = (y * width + x) * 4;
          dst[i] = 168 - v * 148; dst[i + 1] = 181 - v * 153; dst[i + 2] = 146 - v * 126; dst[i + 3] = 255;
        }
        return true;
      },
      key,
      async send(file) {
        const path = `/send.${file.name.split(".").pop()!.toLowerCase()}`;
        emu.FS.writeFile(path, file.bytes);
        try {
          // A busy calculator times out (2) or drops the link mid-packet (9); give it a moment and try again.
          for (let attempt = 0; ; attempt++) {
            const err = emu.ccall("wabbit_send", "number", ["string", "number"], [path, /\.8xg$/i.test(file.name) ? 1 : 0]) as number;
            if (!err) break;
            if ((err !== 2 && err !== 9) || attempt === 3) throw new Error(LINK_ERRORS[err] ?? `Link error ${err}.`);
            await sleep(700);
          }
        } finally {
          try { emu.FS.unlink(path); } catch { /* already gone */ }
        }
      },
      reset: () => emu._wabbit_reset(),
      stop: () => window.clearInterval(running),
      async launch(name) {
        if (!plus) throw new Error(`Run it from the PRGM menu: TIde starts programs on the TI-83 Plus and 84 Plus.`);
        // The PRGM menu lists programs by name and jumps to the first one starting with a letter
        // that's pressed; the arrows go on from there to the right one. Enter pastes it, Enter runs it.
        const names = emu.UTF8ToString(emu._wabbit_programs()).split("\n").filter(Boolean).sort();
        const target = name.toUpperCase().replace(/θ/g, "["); // θ is "[" in a name
        if (!names.includes(target)) throw new Error(`${target} isn't on the calculator.`);
        const before = names.filter(n => n[0] === target[0] && n < target).length;
        await tap(keyFor("clear"));
        await tap(keyFor("prgm"), 120, 400);
        const first = l.byKbd.get(target[0] === "[" ? "#" : target[0].toLowerCase());
        if (first) await tap(first, 100, 200);
        for (let i = 0; i < before; i++) await tap(keyFor("▼"), 80, 100);
        await tap(keyFor("enter"), 120, 250);
        await tap(keyFor("enter"));
      },
      async type(text) { for (const c of text.toUpperCase()) await typeChar(c); },
      async openApp(name) {
        if (!plus) throw new Error("app.open works on the TI-83 Plus and 84 Plus.");
        await tap(keyFor("apps"), 120, 400);
        const first = l.byKbd.get(name.charAt(0).toLowerCase());
        if (first) await tap(first, 100, 200);
        await tap(keyFor("enter"), 120, 400);
      },
    };
  }

  async function start(): Promise<boolean> {
    const have = known = await files();
    fillMenu(have);
    const rom = choice.startsWith("rom:") ? choice.slice(4) : null;
    if (!rom && !have.rom) {
      setup("Choose a ROM dumped from your own calculator: a TI-84 Plus CE, or a TI-73, 81, 82, 83, 83 Plus, 84 Plus, 85 or 86. TIde keeps a copy in its data folder.", true);
      return false;
    }
    setup("", false);
    ui.state.textContent = "starting…";
    let next: Engine | null;
    try {
      next = rom ? await startWabbit(rom) : await startCemu();
    } catch (err) {
      log(String(err), "err");
      next = null;
    }
    if (!next) {
      setup(rom ? `Wabbitemu couldn't start with ${rom}. Choose another ROM, or pick a different calculator above.`
        : "CEmu couldn't start with that ROM. Choose a TI-84 Plus CE ROM.", true);
      ui.state.textContent = "";
      return false;
    }
    engine = next;
    const credit = $<HTMLAnchorElement>("calc-credit");
    credit.textContent = engine.kind === "cemu" ? "CEmu" : "Wabbitemu";
    credit.href = engine.kind === "cemu" ? "https://github.com/CE-Programming/CEmu" : "https://github.com/marwatk/wasmwabbitemu";
    $("calc-license").textContent = engine.kind === "cemu" ? "GPLv3" : "GPLv2+";
    buildKeypad(engine.layout);
    setScreenSize(engine.width, engine.height);
    ui.state.textContent = "running";
    if (rom) log(`Started a ${engine.model} from ${rom}.`, "info");
    if (!drawing) { drawing = true; requestAnimationFrame(draw); }
    return true;
  }

  const ready = () => (engine ? Promise.resolve(true) : (starting ??= start().finally(() => { starting = null; })));

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
  }

  async function addRom() {
    const path = await opts.pickRom();
    if (!path) return;
    try {
      const stored = await invoke<string>("calc_set_rom", { path });
      say(stored === "ce" ? "Saved the TI-84 Plus CE ROM." : `Saved ${stored.slice(4)}.`);
      known = await files();
      await choose(stored);
    } catch (err) {
      say(String(err));
    }
  }

  ui.model.addEventListener("change", async () => {
    const value = ui.model.value;
    ui.model.value = choice; // until the choice is made
    if (value === "add") return addRom();
    if (value === "remove") {
      const name = choice.slice(4);
      if (!confirm(`Remove ${name} from TIde? The file you added it from stays where it is.`)) return;
      try {
        await invoke("calc_remove_rom", { name });
        delete romModels[name];
        remember(NAMES_PREF, romModels);
        known = await files();
        await choose("ce");
      } catch (err) { say(`Could not remove ${name}: ${err}`); }
      return;
    }
    if (value !== choice) await choose(value);
  });
  ui.rom.addEventListener("click", () => void addRom());
  ui.reset.addEventListener("click", () => { engine?.reset(); sentLibs.clear(); say("Reset the calculator."); });
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
    get visible() { return !ui.panel.hidden; },
    get consoleShown() { return !ui.console.hidden; },
    set consoleShown(on: boolean) { showConsole(on); },
    async show() {
      ui.panel.hidden = false;
      opts.layout();
      if (await ready()) ui.lcd.focus();
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
      if (!engine) { say("Set up the calculator to send files to it."); return; }
      const all = (await Promise.all(files.map(f => (BUNDLE.test(f.name) ? unbundle(f) : [f])))).flat();
      const skipped = all.filter(f => !SENDABLE.test(f.name));
      const sendable = all.filter(f => SENDABLE.test(f.name));
      for (const [i, file] of sendable.entries()) {
        const label = `Sending ${file.name}${sendable.length > 1 ? ` (${i + 1} of ${sendable.length})` : ""}`;
        say(`${label}…`);
        try {
          await engine.send(file, label);
        } catch (err) {
          throw new Error(`${file.name}: ${err instanceof Error ? err.message : err}`);
        }
      }
      if (skipped.length) say(`Skipped ${skipped.map(f => f.name).join(", ")}: not a TI file a calculator can receive.`);
      else if (sendable.length) say(`Sent ${sendable.length === 1 ? sendable[0].name : `${sendable.length} files`} to the ${engine.model}.`);
    },
    async macro(name, arg) {
      await view.show();
      if (!engine) throw new Error("Set up the calculator to run macros.");
      switch (name) {
        case "key.press": {
          const key = engine.layout.macro.get(arg.toLowerCase());
          if (!key) throw new Error(`key.press doesn't know "${arg}". Use a key name such as enter, clear, 2nd, alpha, up or 5.`);
          await tap(key);
          break;
        }
        case "key.type": await engine.type(arg); break;
        case "program.run": case "program.open": await engine.launch(arg); break;
        case "app.open": await engine.openApp(arg); break;
        case "wait": await sleep(Math.max(0, Number(arg) || 0)); break;
        default: throw new Error(`Unknown macro ${name}.`);
      }
      say(`${name}(${arg})`);
    },
    async run(programs, launch, libs = []) {
      await view.show();
      // The CE C libraries are only for the CE.
      const wanted = engine?.family === "ce" ? libs : [];
      const newLibs = wanted.filter(l => !sentLibs.has(`${l.name}:${l.bytes.length}`));
      await view.send([...newLibs, ...programs]);
      if (!engine) return;
      for (const l of newLibs) sentLibs.add(`${l.name}:${l.bytes.length}`);
      if (launch) {
        try {
          await engine.launch(launch);
          say(`Running ${launch}`);
        } catch (err) {
          say(`Sent to the ${engine.model}. ${err instanceof Error ? err.message : err}`);
        }
      } else say(`Sent to the ${engine.model}`);
      ui.lcd.focus();
    },
  };
  ui.close.addEventListener("click", () => view.hide());

  // Send files…, or drop them on the calculator.
  async function sendPaths(paths: string[]) {
    if (!paths.length) return;
    try {
      const files = await Promise.all(paths.map(async p => ({ name: p.split(/[\\/]/).pop()!, bytes: await opts.readFile(p) })));
      await view.send(files);
    } catch (err) {
      say(`Could not send: ${err instanceof Error ? err.message : err}`);
    }
  }
  ui.send.addEventListener("click", async () => sendPaths(await opts.pickFiles()));
  const dropping = (on: boolean) => { ui.drop.hidden = !on; };
  // In the desktop app the window gets the drop and reports file paths.
  import("@tauri-apps/api/webview").then(({ getCurrentWebview }) => getCurrentWebview().onDragDropEvent(e => {
    if (ui.panel.hidden) return;
    if (e.payload.type === "enter" || e.payload.type === "over") dropping(true);
    else if (e.payload.type === "leave") dropping(false);
    else { dropping(false); void sendPaths(e.payload.paths.filter(p => !/\.tideex$/i.test(p))); } // extensions install instead
  })).catch(() => { /* not in the desktop app */ });
  // In a browser the page gets the files themselves.
  ui.panel.addEventListener("dragover", e => { if (e.dataTransfer?.types.includes("Files")) { e.preventDefault(); dropping(true); } });
  ui.panel.addEventListener("dragleave", e => { if (!ui.panel.contains(e.relatedTarget as Node | null)) dropping(false); });
  ui.panel.addEventListener("drop", async e => {
    e.preventDefault();
    dropping(false);
    const list = [...(e.dataTransfer?.files ?? [])];
    if (!list.length) return;
    try {
      await view.send(await Promise.all(list.map(async f => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) }))));
    } catch (err) {
      say(`Could not send: ${err instanceof Error ? err.message : err}`);
    }
  });
  return view;
}
