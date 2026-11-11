// The calculator panel: CEmu's core (WebCEmu, compiled to WebAssembly) running inside TIde.
// The page loads the stored core and ROM, draws the LCD on a canvas, drives the keypad matrix,
// and sends programs over the emulated USB link, then launches them the way CEmu's --launch does.
import { invoke } from "@tauri-apps/api/core";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

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
const KEYPAD: Key[][] = [
  [k("y=", 1, 4, ["F1"], "fn"), k("window", 1, 3, ["F2"], "fn"), k("zoom", 1, 2, ["F3"], "fn"), k("trace", 1, 1, ["F4"], "fn"), k("graph", 1, 0, ["F6"], "fn")],
  [k("2nd", 1, 5, ["Shift"], "second"), k("mode", 1, 6, ["Home"]), k("del", 1, 7, ["Backspace", "Delete"])],
  [k("alpha", 2, 7, ["Control"], "alpha"), k("X,T,θ,n", 3, 7), k("stat", 4, 7)],
  [k("math", 2, 6), k("apps", 3, 6), k("prgm", 4, 6), k("vars", 5, 6), k("clear", 6, 6, ["Escape"])],
  [k("x⁻¹", 2, 5), k("sin", 3, 5), k("cos", 4, 5), k("tan", 5, 5), k("^", 6, 5, ["^"])],
  [k("x²", 2, 4), k(",", 3, 4, [","]), k("(", 4, 4, ["("]), k(")", 5, 4, [")"]), k("÷", 6, 4, ["/"], "op")],
  [k("log", 2, 3), k("7", 3, 3, ["7"], "num"), k("8", 4, 3, ["8"], "num"), k("9", 5, 3, ["9"], "num"), k("×", 6, 3, ["*"], "op")],
  [k("ln", 2, 2), k("4", 3, 2, ["4"], "num"), k("5", 4, 2, ["5"], "num"), k("6", 5, 2, ["6"], "num"), k("−", 6, 2, ["-"], "op")],
  [k("sto→", 2, 1), k("1", 3, 1, ["1"], "num"), k("2", 4, 1, ["2"], "num"), k("3", 5, 1, ["3"], "num"), k("+", 6, 1, ["+"], "op")],
  [k("on", 2, 0, ["F12"]), k("0", 3, 0, ["0"], "num"), k(".", 4, 0, ["."], "num"), k("(−)", 5, 0, ["~"], "num"), k("enter", 6, 0, ["Enter"], "op")],
];
const ARROWS: Key[] = [k("▲", 7, 3, ["ArrowUp"]), k("◀", 7, 1, ["ArrowLeft"]), k("▶", 7, 2, ["ArrowRight"]), k("▼", 7, 0, ["ArrowDown"])];
const BY_KBD = new Map<string, Key>([...KEYPAD.flat(), ...ARROWS].flatMap(key => (key.kbd ?? []).map(name => [name, key] as const)));

/** OS key codes used to launch a program, as CEmu's --launch does: clear, prgm, the name, enter. */
const KEY_ENTER = 0x05, KEY_CLEAR = 0x09, KEY_PRGM = 0xda;
const letterKey = (c: string) => (/[0-9]/.test(c) ? 0x8e + +c : /[A-Z]/.test(c) ? 0x9a + c.charCodeAt(0) - 65 : c === "θ" ? 0xcc : 0);

export interface Calc {
  /** Opens the panel; starts the emulator if the core and ROM are ready. */
  show(): Promise<void>;
  hide(): void;
  readonly visible: boolean;
  /** Sends programs to the calculator and launches `launch` once they arrive. */
  run(files: { name: string; bytes: Uint8Array }[], launch: string): Promise<void>;
}

export function createCalc(opts: { say: (text: string) => void; pickRom: () => Promise<string | null>; layout: () => void }): Calc {
  const ui = {
    panel: $("calc"),
    state: $("calc-state"),
    setup: $("calc-setup"),
    setupText: $("calc-setup-text"),
    download: $<HTMLButtonElement>("calc-download"),
    rom: $<HTMLButtonElement>("calc-rom"),
    screen: $("calc-screen"),
    lcd: $<HTMLCanvasElement>("calc-lcd"),
    keypad: $("calc-keypad"),
    reset: $<HTMLButtonElement>("calc-reset"),
    close: $<HTMLButtonElement>("calc-close"),
  };
  const ctx = ui.lcd.getContext("2d")!;
  const image = ctx.createImageData(320, 240);

  let emu: WebCEmu | null = null;
  let memory: WebAssembly.Memory | null = null;
  let starting: Promise<boolean> | null = null;
  const keyQueue: number[] = [];
  let transfer: { resolve: () => void; reject: (e: Error) => void } | null = null;

  // ── Keypad ──
  const press = (key: Key, down: boolean) => emu?._emu_keypad_event(key.row, key.col, down ? 1 : 0);
  const button = (key: Key) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = key.label;
    b.className = `key ${key.cls ?? ""}`;
    b.title = key.kbd ? `${key.label} (${key.kbd[0].replace("Control", "Ctrl")})` : key.label;
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

  // The physical keyboard drives the calculator while the screen has focus.
  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    const key = BY_KBD.get(e.key) ?? BY_KBD.get(e.key.length === 1 ? e.key : "");
    if (!key || e.ctrlKey && e.key !== "Control" || e.metaKey) return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) press(key, down);
  };
  ui.lcd.addEventListener("keydown", onKey(true));
  ui.lcd.addEventListener("keyup", onKey(false));

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
      ctx.putImageData(image, 0, 0);
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
      transferProgressCallback: (value: number, total: number) => { if (value >= total && transfer) { transfer.resolve(); transfer = null; } },
      transferErrorCallback: () => { transfer?.reject(new Error("The calculator refused the file.")); transfer = null; },
    });

    const url = URL.createObjectURL(new Blob([script as BlobPart], { type: "text/javascript" }));
    const factory = (await import(/* @vite-ignore */ url)).default as Factory;
    URL.revokeObjectURL(url);
    emu = await factory({
      print: (t: string) => console.log("[CEmu]", t),
      printErr: (t: string) => console.warn("[CEmu]", t),
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
    opts.say("Downloading the emulator core…");
    try {
      await invoke("calc_install_core");
      opts.say("Downloaded the emulator core.");
      await ready();
    } catch (err) {
      opts.say(`Could not download the emulator core: ${err}`);
    } finally {
      ui.download.disabled = false;
    }
  });
  ui.rom.addEventListener("click", async () => {
    const path = await opts.pickRom();
    if (!path) return;
    try {
      await invoke("calc_set_rom", { path });
      opts.say("Saved the ROM.");
      await ready();
    } catch (err) {
      opts.say(String(err));
    }
  });
  ui.reset.addEventListener("click", () => { emu?._emu_reset(); opts.say("Reset the calculator."); });

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
    async run(programs, launch) {
      await view.show();
      if (!emu) { opts.say("Set up the calculator panel to run programs."); return; }
      for (const [i, program] of programs.entries()) {
        const path = `/send${i}.8xp`;
        emu.FS.writeFile(path, program.bytes);
        opts.say(`Sending ${program.name}…`);
        await new Promise<void>((resolve, reject) => {
          transfer = { resolve, reject };
          emu!.ccall("set_file_to_send", null, ["string"], [path]);
          window.setTimeout(() => { if (transfer) { transfer = null; reject(new Error("The calculator didn't take the file. Is it on the home screen?")); } }, 15000);
        });
      }
      if (launch) keyQueue.push(KEY_CLEAR, KEY_PRGM, ...[...launch.toUpperCase()].map(letterKey).filter(Boolean), KEY_ENTER);
      opts.say(launch ? `Running ${launch}` : "Sent to the calculator");
      ui.lcd.focus();
    },
  };
  ui.close.addEventListener("click", () => view.hide());
  return view;
}
