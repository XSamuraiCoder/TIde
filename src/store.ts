import { invoke } from "@tauri-apps/api/core";

export interface Store {
  list(): Promise<string[]>;
  load(name: string): Promise<string>;
  save(name: string, source: string): Promise<void>;
  remove(name: string): Promise<void>;
}

/** TI-OS program names: 1–8 chars, A–Z/0–9, first char a letter. Returns "" if nothing usable. */
export function normalizeName(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.replace(/^[0-9]+/, "").slice(0, 8);
}

const tauriStore: Store = {
  list: () => invoke<string[]>("list_programs"),
  load: name => invoke<string>("load_program", { name }),
  save: (name, source) => invoke<void>("save_program", { name, source }),
  remove: name => invoke<void>("delete_program", { name }),
};

const PREFIX = "tide:";
const browserStore: Store = {
  async list() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .map(k => k.slice(PREFIX.length))
      .sort();
  },
  async load(name) { return localStorage.getItem(PREFIX + name) ?? ""; },
  async save(name, source) { localStorage.setItem(PREFIX + name, source); },
  async remove(name) { localStorage.removeItem(PREFIX + name); },
};

const isTauri = "__TAURI_INTERNALS__" in window;
export const store: Store = isTauri ? tauriStore : browserStore;

// ── Project folders and file IO (desktop app only) ─────────────────────────

export interface Entry { name: string; path: string; isDir: boolean }

export interface Fs {
  available: boolean;
  pickFolder(): Promise<string | null>;
  pickSaveFile(defaultName: string): Promise<string | null>;
  readDir(path: string): Promise<Entry[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, contents: string): Promise<void>;
  writeBinary(path: string, bytes: Uint8Array): Promise<void>;
  runMake(dir: string): Promise<{ ok: boolean; output: string }>;
}

const unavailable = () => Promise.reject(new Error("Opening folders needs the desktop app."));

export const fs: Fs = isTauri
  ? {
      available: true,
      async pickFolder() {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const picked = await open({ directory: true, multiple: false });
        return typeof picked === "string" ? picked : null;
      },
      async pickSaveFile(defaultName) {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const picked = await save({
          defaultPath: defaultName,
          filters: [{ name: "TI-84 program", extensions: ["8xp"] }],
        });
        return typeof picked === "string" ? picked : null;
      },
      readDir: path => invoke<Entry[]>("list_dir", { path }),
      readFile: path => invoke<string>("read_text_file", { path }),
      writeFile: (path, contents) => invoke<void>("write_text_file", { path, contents }),
      writeBinary: (path, bytes) => invoke<void>("write_binary_file", { path, bytes: Array.from(bytes) }),
      runMake: dir => invoke<{ ok: boolean; output: string }>("run_make", { dir }),
    }
  : {
      available: false,
      pickFolder: unavailable,
      pickSaveFile: unavailable,
      readDir: unavailable,
      readFile: unavailable,
      writeFile: unavailable,
      writeBinary: unavailable,
      runMake: unavailable,
    };