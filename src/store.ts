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
export interface GitResult { ok: boolean; output: string }
export interface GitFile { path: string; index: string; worktree: string }
export interface GitStatus { repo: boolean; branch: string; upstream: boolean; ahead: number; behind: number; files: GitFile[] }
export interface Git {
  status(dir: string): Promise<GitStatus>;
  stage(dir: string, paths: string[]): Promise<GitResult>;
  unstage(dir: string, paths: string[]): Promise<GitResult>;
  commit(dir: string, message: string): Promise<GitResult>;
  push(dir: string): Promise<GitResult>;
  pull(dir: string): Promise<GitResult>;
  init(dir: string): Promise<GitResult>;
}

export interface Fs {
  available: boolean;
  pickFolder(): Promise<string | null>;
  pickSaveFile(defaultName: string): Promise<string | null>;
  pickFile(label: string, extensions: string[]): Promise<string | null>;
  pickFiles(label: string, extensions: string[]): Promise<string[]>;
  readBinary(path: string): Promise<Uint8Array>;
  /** The CE C libraries (clibs.8xg) from the project or the toolchain, if they are anywhere TIde looks. */
  findClibs(projectRoot: string | null): Promise<string | null>;
  readDir(path: string): Promise<Entry[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, contents: string): Promise<void>;
  writeBinary(path: string, bytes: Uint8Array): Promise<void>;
  runMake(dir: string): Promise<{ ok: boolean; output: string }>;
  runCommand(dir: string, command: string, args: string[]): Promise<{ ok: boolean; output: string }>;
  createDir(path: string): Promise<void>;
  deletePath(path: string, permanent: boolean): Promise<void>;
  git: Git;
  emulator: Emulator;
}

/** CEmu, downloaded on first use and started as its own program. */
export interface Emulator {
  status(): Promise<string | null>;
  install(): Promise<string>;
  stage(name: string, bytes: number[]): Promise<string>;
  run(files: string[], launch?: string): Promise<void>;
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
      async pickFile(label, extensions) {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const picked = await open({ multiple: false, filters: [{ name: label, extensions }] });
        return typeof picked === "string" ? picked : null;
      },
      async pickFiles(label, extensions) {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const picked = await open({ multiple: true, filters: [{ name: label, extensions }] });
        return Array.isArray(picked) ? picked : typeof picked === "string" ? [picked] : [];
      },
      findClibs: projectRoot => invoke<string | null>("find_clibs", { projectRoot }),
      readBinary: async path => new Uint8Array(await invoke<ArrayBuffer>("read_binary_file", { path })),
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
      createDir: path => invoke<void>("create_dir", { path }),
      deletePath: (path, permanent) => invoke<void>("delete_path", { path, permanent }),
      runCommand: (dir, command, args) => invoke<{ ok: boolean; output: string }>("run_command", { dir, command, args }),
      git: {
        status: dir => invoke<GitStatus>("git_status", { dir }),
        stage: (dir, paths) => invoke<GitResult>("git_stage", { dir, paths }),
        unstage: (dir, paths) => invoke<GitResult>("git_unstage", { dir, paths }),
        commit: (dir, message) => invoke<GitResult>("git_commit", { dir, message }),
        push: dir => invoke<GitResult>("git_push", { dir }),
        pull: dir => invoke<GitResult>("git_pull", { dir }),
        init: dir => invoke<GitResult>("git_init", { dir }),
      },
      emulator: {
        status: () => invoke<string | null>("emulator_status"),
        install: () => invoke<string>("emulator_install"),
        stage: (name, bytes) => invoke<string>("emulator_stage", { name, bytes }),
        run: (files, launch) => invoke<void>("emulator_run", { files, launch: launch ?? null }),
      },
    }
  : {
      available: false,
      pickFolder: unavailable,
      pickSaveFile: unavailable,
      pickFile: unavailable,
      pickFiles: unavailable,
      readBinary: unavailable,
      findClibs: unavailable,
      readDir: unavailable,
      readFile: unavailable,
      writeFile: unavailable,
      writeBinary: unavailable,
      runMake: unavailable,
      runCommand: unavailable,
      createDir: unavailable,
      deletePath: unavailable,
      emulator: { status: unavailable, install: unavailable, stage: unavailable, run: unavailable },
      git: { status: unavailable, stage: unavailable, unstage: unavailable, commit: unavailable, push: unavailable, pull: unavailable, init: unavailable },
    };