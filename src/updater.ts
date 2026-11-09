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

/** The release notes and an install button, in a modal dialog. */
function showNotes(update: Update, say: (text: string) => void) {
  const dialog = el("dialog", { className: "update-dialog" });
  const install = el("button", { type: "button", className: "primary", onclick: () => void installUpdate(update, say, install) }, "Update and restart");
  dialog.append(
    el("h2", {}, `TIde ${update.version}`),
    el("p", { className: "hint" }, `You have ${update.currentVersion}.`),
    renderMarkdown(update.body?.trim() || "No release notes."),
    el("div", { className: "actions" }, el("button", { type: "button", onclick: () => dialog.close() }, "Later"), install),
  );
  dialog.addEventListener("close", () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

async function installUpdate(update: Update, say: (text: string) => void, button?: HTMLButtonElement) {
  if (button) { button.disabled = true; button.textContent = "Downloading…"; }
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
    if (button) { button.disabled = false; button.textContent = "Update and restart"; }
  }
}

/** A notice in the corner, as in VS Code: release notes, update, or skip this version. */
function showToast(update: Update, say: (text: string) => void) {
  document.querySelector(".toast")?.remove();
  const toast = el("div", { className: "toast", role: "status" },
    el("p", {}, el("strong", {}, `TIde ${update.version}`), " is available."),
    el("div", { className: "actions" },
      el("button", { type: "button", onclick: () => { toast.remove(); try { localStorage.setItem(SKIP_PREF, update.version); } catch { /* storage unavailable */ } } }, "Skip"),
      el("button", { type: "button", onclick: () => showNotes(update, say) }, "Release notes"),
      el("button", { type: "button", className: "primary", onclick: () => { toast.remove(); void installUpdate(update, say); } }, "Update"),
    ));
  document.body.append(toast);
}

/**
 * Checks for an update. On start-up (`quiet`) it says nothing unless one is found and skips a version
 * the user chose to skip; asked from the status bar it always reports the result.
 */
export async function checkForUpdate(say: (text: string) => void, quiet = false): Promise<void> {
  if (!quiet) say("Checking for updates…");
  try {
    const update = await check();
    if (!update) { if (!quiet) say(`TIde ${await getVersion()} is up to date.`); return; }
    let skipped: string | null = null;
    try { skipped = localStorage.getItem(SKIP_PREF); } catch { /* storage unavailable */ }
    if (quiet && skipped === update.version) return;
    showToast(update, say);
  } catch (err) {
    if (!quiet) say(`Could not check for updates: ${err}`);
  }
}

export const appVersion = () => getVersion();
