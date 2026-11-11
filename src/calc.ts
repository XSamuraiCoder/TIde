// The calculator panel: CEmu's core (WebCEmu, compiled to WebAssembly) running inside TIde.
// The page loads the stored core and ROM, draws the LCD on a canvas, drives the keypad matrix,
// and sends programs over the emulated USB link, then launches them the way CEmu's --launch does.
import { invoke } from "@tauri-apps/api/core";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

/** Every TI file the calculator can receive, as CEmu accepts them. Bundles (.b84, .b83) are zips of these. */
export const SEND_TYPES = ["8xp", "8xv", "8xl", "8xn", "8xm", "8xy", "8xg", "8xs", "8xd", "8xw", "8xc", "8xz", "8xt",
  "8ca", "8cg", "8ci", "8ek", "8xk", "8eu", "8pu", "8yu", "b84", "b83"];
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
async function unbundle(bundle: TiFile): Promise<TiFile[]> {
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
}
type Factory = (options: Record<string, unknown>) => Promise<WebCEmu>;

/** TI-84 Plus CE keys: label, keypad group (row) and bit (column), and an optional keyboard key. */
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
const BY_KBD = new Map<string, Key>([...KEYPAD.flat(), ...ARROWS].flatMap(key => (key.kbd ?? []).map(name => [name, key] as const)));
/** How a binding reads in a tooltip. */
const keyName = (name: string) => (name === " " ? "Space" : name.length === 1 ? name.toUpperCase() : name.replace(/^Page/, "Page "));

/** OS key codes used to launch a program, as CEmu's --launch does: clear, prgm, the name, enter. */
const KEY_ENTER = 0x05, KEY_CLEAR = 0x09, KEY_PRGM = 0xda;
const letterKey = (c: string) => (/[0-9]/.test(c) ? 0x8e + +c : /[A-Z]/.test(c) ? 0x9a + c.charCodeAt(0) - 65 : c === "θ" ? 0xcc : 0);

export interface Calc {
  /** Opens the panel; starts the emulator if the core and ROM are ready. */
  show(): Promise<void>;
  hide(): void;
  readonly visible: boolean;
  /** Sends programs to the calculator and launches `launch` once they arrive. */
  /** Libraries (like clibs.8xg) are sent once per calculator session, before the programs. */
  run(files: TiFile[], launch: string, libs?: TiFile[]): Promise<void>;
  /** Sends any TI files, unpacking bundles. */
  send(files: TiFile[]): Promise<void>;
}

export function createCalc(opts: {
  say: (text: string) => void;
  pickRom: () => Promise<string | null>;
  pickFiles: () => Promise<string[]>;
  readFile: (path: string) => Promise<Uint8Array>;
  layout: () => void;
}): Calc {
  const ui = {
    panel: $("calc"),
    state: $("calc-state"),
    setup: $("calc-setup"),
    setupText: $("calc-setup-text"),
    download: $<HTMLButtonElement>("calc-download"),
    rom: $<HTMLButtonElement>("calc-rom"),
    screen: $("calc-screen"),
    lcd: $<HTMLCanvasElement>("calc-lcd"),
    area: $("calc-lcd-area"),
    send: $<HTMLButtonElement>("calc-send"),
    drop: $("calc-drop"),
    keypad: $("calc-keypad"),
    reset: $<HTMLButtonElement>("calc-reset"),
    close: $<HTMLButtonElement>("calc-close"),
    consoleToggle: $<HTMLButtonElement>("calc-console-toggle"),
    console: $("calc-console"),
    log: $("calc-console-log"),
    consoleClear: $<HTMLButtonElement>("calc-console-clear"),
  };

  // ── Console: CEmu's output (dbg_printf from C programs, emulator messages) and TIde's own steps ──
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
  // The emulator's 320×240 frame goes to a small canvas, is blown up with hard pixel edges to a whole
  // multiple at least as large as the screen's real size, and the browser scales that down smoothly.
  // The LCD fills the room it has and stays sharp at any size.
  const frame = document.createElement("canvas");
  frame.width = 320; frame.height = 240;
  const fctx = frame.getContext("2d")!;
  const image = fctx.createImageData(320, 240);
  const ctx = ui.lcd.getContext("2d")!;
  const body = ui.screen;
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
    body.classList.toggle("stacked", stacked);
    body.style.setProperty("--pane-w", `${Math.floor(((paneH - BEZEL) * 4) / 3 + BEZEL)}px`);
    body.style.setProperty("--pane-h", `${Math.floor(paneH)}px`);
    const css = Math.floor(((paneH - BEZEL) * 4) / 3);
    const k = Math.max(2, Math.ceil((css * dpr) / 320));
    ui.lcd.width = 320 * k; ui.lcd.height = 240 * k;
    ui.lcd.style.width = `${css}px`;
    ui.lcd.style.height = `${(css * 3) / 4}px`;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame, 0, 0, ui.lcd.width, ui.lcd.height);
  }
  const resize = new ResizeObserver(fit);
  resize.observe(ui.area);
  resize.observe(body);

  let emu: WebCEmu | null = null;
  let memory: WebAssembly.Memory | null = null;
  let starting: Promise<boolean> | null = null;
  const keyQueue: number[] = [];
  // Libraries already on the calculator since it started, by name and size.
  const sentLibs = new Set<string>();
  let transfer: { resolve: () => void; reject: (e: Error) => void; progress: (value: number, total: number) => void } | null = null;

  // ── Keypad ──
  const press = (key: Key, down: boolean) => emu?._emu_keypad_event(key.row, key.col, down ? 1 : 0);
  const button = (key: Key) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = key.label;
    b.className = `key ${key.cls ?? ""}`;
    b.title = key.kbd ? `${key.label} (${key.kbd.map(keyName).join(" or ")})` : key.label;
    const release = () => { press(key, false); window.removeEventListener("pointerup", release); };
    b.addEventListener("pointerdown", e => { e.preventDefault(); ui.lcd.focus(); press(key, true); window.addEventListener("pointerup", release); });
    return b;
  };
  const arrows = document.createElement("div");
  arrows.className = "arrows";
  arrows.append(...ARROWS.map(button));
  ui.keypad.replaceChildren(...KEYPAD.map((row, i) => {
    const div = document.createElement("div");
    div.className = "keyrow";
    div.append(...row.map(button));
    if (i === 1) div.append(arrows); // the arrow pad sits beside 2nd, mode and del
    return div;
  }));

  // The physical keyboard drives the calculator while the screen has focus, with CEmu's bindings.
  // A key is released by its physical position, since Shift can change what it types in between.
  const held = new Map<string, Key>();
  ui.lcd.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave TIde's shortcuts alone
    const key = BY_KBD.get(e.key) ?? BY_KBD.get(e.key.toLowerCase());
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

  // ── Emulator ──
  const files = () => invoke<{ core: boolean; rom: boolean }>("calc_files");
  const read = async (name: string) => new Uint8Array(await invoke<ArrayBuffer>("calc_read", { name }));

  function setup(text: string, download: boolean, rom: boolean) {
    ui.setup.hidden = !text;
    ui.setupText.textContent = text;
    ui.download.hidden = !download;
    ui.rom.hidden = !rom;
    ui.screen.hidden = !!text;
  }

  /** Each animation frame: copy the LCD to the canvas. */
  function draw() {
    if (!emu || !memory) return;
    if (!ui.panel.hidden) {
      const src = new Uint8Array(memory.buffer, emu._lcd_get_frame(), 320 * 240 * 4);
      const dst = image.data;
      for (let i = 0; i < dst.length; i += 4) { // 0x00RRGGBB, little-endian
        dst[i] = src[i + 2]; dst[i + 1] = src[i + 1]; dst[i + 2] = src[i]; dst[i + 3] = 255;
      }
      fctx.putImageData(image, 0, 0);
      ctx.drawImage(frame, 0, 0, ui.lcd.width, ui.lcd.height);
    }
    requestAnimationFrame(draw);
  }

  /** The OS takes one key at a time; sendKey refuses until it has read the last one. */
  function feedKeys() {
    if (emu && keyQueue.length && emu._sendKey(keyQueue[0])) keyQueue.shift();
  }

  async function start(): Promise<boolean> {
    const have = await files();
    if (!have.core) { setup("The calculator needs CEmu's emulator core (about 300 KB), built from CEmu's source.", true, false); return false; }
    if (!have.rom) { setup("Choose a ROM dumped from your own TI-84 Plus CE. TIde keeps a copy in its data folder.", false, true); return false; }
    setup("", false, false);
    ui.state.textContent = "starting…";
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

    const url = URL.createObjectURL(new Blob([script as BlobPart], { type: "text/javascript" }));
    const factory = (await import(/* @vite-ignore */ url)).default as Factory;
    URL.revokeObjectURL(url);
    emu = await factory({
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
    if (!ok) {
      emu = null;
      setup("CEmu couldn't start with that ROM. Choose a TI-84 Plus CE ROM.", false, true);
      ui.state.textContent = "";
      return false;
    }
    ui.state.textContent = "running";
    // Run on a 16 ms timer rather than animation frames, so emulation keeps its speed when the
    // page draws slowly or the window is behind another one. Drawing still follows the frames.
    emu.ccall("emsc_set_main_loop_timing", "number", ["number", "number"], [0, 16]);
    window.setInterval(feedKeys, 20);
    requestAnimationFrame(draw);
    return true;
  }

  const ready = () => (emu ? Promise.resolve(true) : (starting ??= start().finally(() => { starting = null; })));

  ui.download.addEventListener("click", async () => {
    ui.download.disabled = true;
    say("Downloading the emulator core…");
    try {
      await invoke("calc_install_core");
      say("Downloaded the emulator core.");
      await ready();
    } catch (err) {
      say(`Could not download the emulator core: ${err}`);
    } finally {
      ui.download.disabled = false;
    }
  });
  ui.rom.addEventListener("click", async () => {
    const path = await opts.pickRom();
    if (!path) return;
    try {
      await invoke("calc_set_rom", { path });
      say("Saved the ROM.");
      await ready();
    } catch (err) {
      say(String(err));
    }
  });
  ui.reset.addEventListener("click", () => { emu?._emu_reset(); sentLibs.clear(); say("Reset the calculator."); });

  const view: Calc = {
    get visible() { return !ui.panel.hidden; },
    async show() {
      ui.panel.hidden = false;
      opts.layout();
      if (await ready()) ui.lcd.focus();
    },
    hide() {
      ui.panel.hidden = true;
      opts.layout();
    },
    async send(files) {
      await view.show();
      if (!emu) { say("Set up the calculator to send files to it."); return; }
      const all = (await Promise.all(files.map(f => (BUNDLE.test(f.name) ? unbundle(f) : [f])))).flat();
      const skipped = all.filter(f => !SENDABLE.test(f.name));
      const sendable = all.filter(f => SENDABLE.test(f.name)).map(f => (/\.8xg$/i.test(f.name) ? { ...f, bytes: archived(f.bytes) } : f));
      for (const [i, file] of sendable.entries()) {
        const path = `/send${i}.${file.name.split(".").pop()}`;
        emu.FS.writeFile(path, file.bytes);
        say(`Sending ${file.name}${sendable.length > 1 ? ` (${i + 1} of ${sendable.length})` : ""}…`);
        try {
          const label = `Sending ${file.name}${sendable.length > 1 ? ` (${i + 1} of ${sendable.length})` : ""}`;
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
            emu!.ccall("set_file_to_send", null, ["string"], [path]);
          });
        } finally {
          try { emu.FS.unlink(path); } catch { /* already gone */ }
        }
      }
      if (skipped.length) say(`Skipped ${skipped.map(f => f.name).join(", ")}: not a TI file the calculator can receive.`);
      else if (sendable.length) say(`Sent ${sendable.length === 1 ? sendable[0].name : `${sendable.length} files`} to the calculator.`);
    },
    async run(programs, launch, libs = []) {
      const newLibs = libs.filter(l => !sentLibs.has(`${l.name}:${l.bytes.length}`));
      await view.send([...newLibs, ...programs]);
      if (emu) for (const l of newLibs) sentLibs.add(`${l.name}:${l.bytes.length}`);
      if (!emu) return;
      if (launch) keyQueue.push(KEY_CLEAR, KEY_PRGM, ...[...launch.toUpperCase()].map(letterKey).filter(Boolean), KEY_ENTER);
      say(launch ? `Running ${launch}` : "Sent to the calculator");
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
    else { dropping(false); void sendPaths(e.payload.paths); }
  })).catch(() => { /* not in the desktop app */ });
  // In a browser the page gets the files themselves.
  ui.panel.addEventListener("dragover", e => { if (e.dataTransfer?.types.includes("Files")) { e.preventDefault(); dropping(true); } });
  ui.panel.addEventListener("dragleave", e => { if (!ui.panel.contains(e.relatedTarget as Node | null)) dropping(false); });
  ui.panel.addEventListener("drop", async e => {
    e.preventDefault();
    dropping(false);
    const list = [...(e.dataTransfer?.files ?? [])];
    if (list.length) await view.send(await Promise.all(list.map(async f => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) }))));
  });
  return view;
}
