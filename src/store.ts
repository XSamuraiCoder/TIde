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

export const store: Store = "__TAURI_INTERNALS__" in window ? tauriStore : browserStore;