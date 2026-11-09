// Auto-update: checks the "latest" GitHub release (latest.json, written by the build workflow),
// shows its Markdown release notes, and installs and restarts on request. Desktop builds only.
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

const SKIP_PREF = "tide-pref-skip-update"; // not "tide:", which the browser store treats as a program

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
}

/** Inline Markdown: `code`, **bold**, *italic* and [links](url). Text is never parsed as HTML. */
function inline(text: string): (Node | string)[] {
  const out: (Node | string)[] = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    out.push(text.slice(last, m.index));
    if (m[1]) out.push(el("code", {}, m[1]));
    else if (m[2]) out.push(el("strong", {}, m[2]));
    else if (m[3]) out.push(el("em", {}, m[3]));
    else {
      const url = m[5];
      // Links open in the browser; navigating the app window would replace the editor.
      out.push(el("a", { href: url, onclick: (e: Event) => { e.preventDefault(); if (/^https?:/.test(url)) void openUrl(url); } }, m[4]));
    }
    last = m.index! + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

/** Block Markdown: headings, bullet and numbered lists, code fences and paragraphs. */
export function renderMarkdown(source: string): HTMLElement {
  const root = el("div", { className: "md" });
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let list: HTMLElement | null = null;
  let para: string[] = [];
  const flush = () => {
    if (para.length) root.append(el("p", {}, ...inline(para.join(" "))));
    para = [];
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpExecArray | null;
    if (line.startsWith("```")) {
      flush();
      const code: string[] = [];
      while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
      root.append(el("pre", {}, code.join("\n")));
    } else if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) {
      flush();
      root.append(el(`h${Math.min(m[1].length + 1, 4)}` as "h2", {}, ...inline(m[2])));
    } else if ((m = /^\s*(?:[-*]|(\d+)\.)\s+(.*)$/.exec(line))) {
      if (para.length) flush();
      const tag = m[1] ? "ol" : "ul";
      if (!list || list.tagName.toLowerCase() !== tag) root.append(list = el(tag));
      list.append(el("li", {}, ...inline(m[2])));
    } else if (!line.trim()) {
      flush();
    } else if (list && /^\s+/.test(line)) {
      list.lastElementChild?.append(" ", ...inline(line.trim())); // a list item continued on the next line
    } else {
      list = null;
      para.push(line.trim());
    }
  }
  flush();
  return root;
}

// The notice and the dialog are in index.html; this fills them in for the update that was found.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const ui = {
  toast: $("update-toast"),
  version: $("update-version"),
  skip: $<HTMLButtonElement>("update-skip"),
  notesButton: $<HTMLButtonElement>("update-notes-button"),
  now: $<HTMLButtonElement>("update-now"),
  dialog: $<HTMLDialogElement>("update-dialog"),
  title: $("update-title"),
  current: $("update-current"),
  notes: $("update-notes"),
  later: $<HTMLButtonElement>("update-later"),
  install: $<HTMLButtonElement>("update-install"),
};

let found: Update | null = null;
let say: (text: string) => void = () => {};

async function installUpdate() {
  if (!found) return;
  const update = found;
  ui.toast.hidden = true;
  ui.install.disabled = ui.now.disabled = true;
  ui.install.textContent = "Downloading…";
  let total = 0, done = 0;
  try {
    await update.downloadAndInstall(event => {
      if (event.event === "Started") total = event.data.contentLength ?? 0;
      else if (event.event === "Progress") {
        done += event.data.chunkLength;
        if (total) say(`Downloading TIde ${update.version}: ${Math.round((done / total) * 100)}%`);
      } else say(`Installing TIde ${update.version}…`);
    });
    await relaunch();
  } catch (err) {
    say(`Update failed: ${err}`);
    ui.install.disabled = ui.now.disabled = false;
    ui.install.textContent = "Update and restart";
  }
}

function showNotes() {
  if (!found) return;
  ui.title.textContent = `TIde ${found.version}`;
  ui.current.textContent = `You have ${found.currentVersion}.`;
  ui.notes.replaceChildren(...renderMarkdown(found.body?.trim() || "No release notes.").childNodes);
  if (!ui.dialog.open) ui.dialog.showModal();
}

ui.skip.addEventListener("click", () => {
  ui.toast.hidden = true;
  if (found) try { localStorage.setItem(SKIP_PREF, found.version); } catch { /* storage unavailable */ }
});
ui.notesButton.addEventListener("click", showNotes);
ui.now.addEventListener("click", () => void installUpdate());
ui.later.addEventListener("click", () => ui.dialog.close());
ui.install.addEventListener("click", () => void installUpdate());

/**
 * Checks for an update. On start-up (`quiet`) it says nothing unless one is found and skips a version
 * the user chose to skip; asked from the status bar it always reports the result.
 */
export async function checkForUpdate(report: (text: string) => void, quiet = false): Promise<void> {
  say = report;
  if (!quiet) say("Checking for updates…");
  try {
    const update = await check();
    if (!update) { if (!quiet) say(`TIde ${await getVersion()} is up to date.`); return; }
    let skipped: string | null = null;
    try { skipped = localStorage.getItem(SKIP_PREF); } catch { /* storage unavailable */ }
    if (quiet && skipped === update.version) return;
    found = update;
    ui.version.textContent = `TIde ${update.version}`;
    ui.toast.hidden = false;
  } catch (err) {
    if (!quiet) say(`Could not check for updates: ${err}`);
  }
}

export const appVersion = () => getVersion();
