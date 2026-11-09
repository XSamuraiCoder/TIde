// The Source Control view: git status of the open folder, staging, commit, push and pull.
// The markup is in index.html; this fills in the file lists and runs the git commands.
import { fs, type GitFile, type GitResult, type GitStatus } from "./store";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const ui = {
  note: $("scm-note"),
  init: $<HTMLButtonElement>("scm-init"),
  repo: $("scm-repo"),
  message: $<HTMLTextAreaElement>("scm-message"),
  commit: $<HTMLButtonElement>("scm-commit"),
  pull: $<HTMLButtonElement>("scm-pull"),
  push: $<HTMLButtonElement>("scm-push"),
  refresh: $<HTMLButtonElement>("scm-refresh"),
  lists: $("scm-lists"),
};

const LETTER_NAME: Record<string, string> = {
  M: "Modified", A: "Added", D: "Deleted", R: "Renamed", C: "Copied", U: "Conflict", "?": "Untracked",
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
}

export interface Scm { refresh(): Promise<void> }

/**
 * `root` is the open folder (or null), `open` opens a file by path, `say` writes to the status bar,
 * and `changed` hears every new status so the activity bar and status bar can show it.
 */
export function createScm(opts: {
  root: () => string | null;
  open: (path: string, name: string) => void;
  say: (text: string) => void;
  changed: (status: GitStatus | null) => void;
}): Scm {
  let busy = false;

  /** A path from git (always "/") as the OS spells it, so it matches the Explorer's paths. */
  const full = (root: string, path: string) => {
    const sep = root.includes("\\") ? "\\" : "/";
    return root.replace(/[\\/]+$/, "") + sep + path.split("/").join(sep);
  };

  /** Runs a git action, reports its result, and refreshes the view. */
  async function run(label: string, action: (root: string) => Promise<GitResult>, success: string) {
    const root = opts.root();
    if (!root || busy) return;
    busy = true;
    opts.say(`${label}…`);
    try {
      const { ok, output } = await action(root);
      const lines = output.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const why = lines.find(l => /^(?:error|fatal|hint: Updates were rejected)/i.test(l)) ?? lines[lines.length - 1] ?? "";
      opts.say(ok ? success : `${label} failed: ${why || "git exited with an error"}`);
      if (!ok) console.warn(output);
    } catch (err) {
      opts.say(`${label} failed: ${err}`);
    } finally {
      busy = false;
      await view.refresh();
    }
  }

  function row(root: string, file: GitFile, staged: boolean) {
    const letter = staged ? file.index : file.worktree === "?" ? "U" : file.worktree;
    const state = staged ? file.index : file.worktree;
    const slash = file.path.lastIndexOf("/");
    const name = file.path.slice(slash + 1), dir = slash > 0 ? file.path.slice(0, slash) : "";
    const deleted = state === "D";
    const item = el("li", { tabIndex: 0, title: `${file.path} · ${LETTER_NAME[state] ?? state}${staged ? " (staged)" : ""}`, className: deleted ? "deleted" : "" },
      el("span", { className: "name" }, name),
      el("span", { className: "dir" }, dir),
      el("button", { type: "button", className: "act", title: staged ? "Unstage" : "Stage",
        onclick: (e: Event) => {
          e.stopPropagation();
          void (staged
            ? run("Unstaging", r => fs.git.unstage(r, [file.path]), `Unstaged ${name}`)
            : run("Staging", r => fs.git.stage(r, [file.path]), `Staged ${name}`));
        } }, staged ? "−" : "+"),
      el("span", { className: `letter s-${state === "?" ? "untracked" : state}` }, letter),
    );
    const open = () => { if (!deleted) opts.open(full(root, file.path), name); };
    item.onclick = open;
    item.onkeydown = e => { if (e.key === "Enter") open(); };
    return item;
  }

  function section(title: string, files: GitFile[], root: string, staged: boolean) {
    if (!files.length) return [];
    const all = el("button", { type: "button", className: "act", title: staged ? "Unstage all" : "Stage all",
      onclick: () => void (staged
        ? run("Unstaging", r => fs.git.unstage(r, files.map(f => f.path)), "Unstaged all changes")
        : run("Staging", r => fs.git.stage(r, files.map(f => f.path)), "Staged all changes")) }, staged ? "−" : "+");
    return [
      el("h3", { className: "section scm-head" }, el("span", {}, title), el("span", { className: "count" }, String(files.length)), all),
      el("ul", { className: "scm-files" }, ...files.map(f => row(root, f, staged))),
    ];
  }

  async function commit() {
    const message = ui.message.value.trim();
    if (!message) { opts.say("Type a commit message first."); ui.message.focus(); return; }
    const root = opts.root();
    if (!root) return;
    let status: GitStatus;
    try { status = await fs.git.status(root); } catch (err) { opts.say(`Commit failed: ${err}`); return; }
    const staged = status.files.some(f => f.index !== " " && f.index !== "?");
    if (!staged && !status.files.length) { opts.say("Nothing to commit."); return; }
    // As VS Code offers: with nothing staged, commit every change.
    await run("Committing", async r => {
      if (!staged) {
        const added = await fs.git.stage(r, status.files.map(f => f.path));
        if (!added.ok) return added;
      }
      return fs.git.commit(r, message);
    }, `Committed: ${message.split("\n")[0]}`);
    // Keep the message if the commit failed, so it can be fixed and retried.
    const after = await fs.git.status(root).catch(() => null);
    if (after && !after.files.some(f => f.index !== " " && f.index !== "?")) ui.message.value = "";
  }

  ui.commit.addEventListener("click", () => void commit());
  ui.message.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void commit(); }
  });
  ui.pull.addEventListener("click", () => void run("Pulling", r => fs.git.pull(r), "Pulled"));
  ui.push.addEventListener("click", () => void run("Pushing", r => fs.git.push(r), "Pushed"));
  ui.refresh.addEventListener("click", () => void view.refresh());
  ui.init.addEventListener("click", () => void run("Initializing", r => fs.git.init(r), "Initialized a git repository"));

  const view: Scm = {
    async refresh() {
      const root = opts.root();
      const show = (note: string, repo = false, init = false) => {
        ui.note.textContent = note;
        ui.note.hidden = !note;
        ui.repo.hidden = !repo;
        ui.init.hidden = !init;
      };
      if (!fs.available) { show("Source control needs the desktop app."); opts.changed(null); return; }
      if (!root) { show("Open a folder to use source control."); opts.changed(null); return; }
      let status: GitStatus;
      try {
        status = await fs.git.status(root);
      } catch (err) {
        show(String(err));
        opts.changed(null);
        return;
      }
      if (!status.repo) { show("This folder isn't a git repository.", false, true); opts.changed(null); return; }
      show("", true);
      const staged = status.files.filter(f => f.index !== " " && f.index !== "?");
      const changes = status.files.filter(f => f.worktree !== " ");
      ui.push.textContent = status.ahead ? `Push ↑${status.ahead}` : "Push";
      ui.pull.textContent = status.behind ? `Pull ↓${status.behind}` : "Pull";
      ui.push.disabled = ui.pull.disabled = !status.upstream;
      ui.push.title = ui.pull.title = status.upstream ? "" : `${status.branch} has no upstream branch yet. Push it once from a terminal with git push -u.`;
      const nodes = [...section("Staged changes", staged, root, true), ...section("Changes", changes, root, false)];
      ui.lists.replaceChildren(...(nodes.length ? nodes : [el("p", { className: "hint scm-clean" }, "No changes.")]));
      opts.changed(status);
    },
  };
  return view;
}
