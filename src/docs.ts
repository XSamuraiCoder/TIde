// The docs page: full documentation for every catalog, one language at a time. It covers the
// editor area and is built from the same tables as the catalogs, so the two never disagree.
import { BLOCKS, COMMANDS, usage, type Command } from "./commands";
import { OTHER_COMMANDS, SYMBOL_ENTRIES, isCeOnly } from "./language";
import { TI_CATEGORIES } from "./ti-docs";
import { C_LIBRARY, C_SNIPPETS } from "./c-support";
import { PY_LIBRARY, PY_SNIPPETS } from "./py2ez80-support";
import { ASM_LIBRARY, ASM_SNIPPETS } from "./asm-support";

export type DocLangId = "tibasic" | "c" | "python" | "ez80";
interface DocEntry { name: string; usage: string[]; doc: string; params?: Command["params"]; tags?: string[] }
interface DocGroup { group: string; entries: DocEntry[] }
interface DocLang { id: DocLangId; label: string; intro: string; groups: DocGroup[] }

/** Snippet text as it reads once inserted: ${1:name} becomes name, and a bare tab stop (where your code goes) becomes "…". */
const plain = (snippet: string) => snippet.replace(/\$\{\d+:([^}]*)\}/g, "$1").replace(/\$\d+/g, "…").replace(/\t/g, "    ").trimEnd();
const snippets = (list: { label: string; doc: string; body: string }[]): DocGroup =>
  ({ group: "Snippets", entries: list.map(s => ({ name: s.label, usage: [plain(s.body)], doc: s.doc })) });

function tiBasic(): DocLang {
  const ce = (insert: string) => (isCeOnly(insert) ? ["CE only"] : []);
  return {
    id: "tibasic", label: "TI-BASIC",
    intro: "Every command the tokenizer accepts, for the TI-84 Plus CE and the TI-84 Plus. Commands marked CE only are errors when the target is the Plus.",
    groups: [
      { group: "Blocks", entries: BLOCKS.map(b => ({ name: b.label, usage: [plain(b.snippet)], doc: b.doc })) },
      ...TI_CATEGORIES.map(group => ({
        group,
        entries: [
          ...COMMANDS.filter(c => c.group === group).map(c => ({ name: c.name, usage: [usage(c)], doc: c.doc, params: c.params, tags: ce(c.name) })),
          ...OTHER_COMMANDS.filter(c => c.doc?.category === group)
            .map(c => ({ name: c.name, usage: [c.doc!.usage], doc: c.doc!.doc, tags: ce(c.insert) })),
        ],
      })),
      { group: "Symbols", entries: SYMBOL_ENTRIES.map(s => ({ name: s.name, usage: [], doc: s.hint + "." })) },
      { group: "Other", entries: OTHER_COMMANDS.filter(c => !c.doc).map(c => ({ name: c.name, usage: [], doc: "Accepted by the tokenizer.", tags: ce(c.insert) })) },
    ].filter(g => g.entries.length),
  };
}

export const DOCS: DocLang[] = [
  tiBasic(),
  {
    id: "c", label: "C libraries",
    intro: "Every public function of the CE C toolchain's libraries, with the header's description. Include the library's header to use them.",
    groups: [snippets(C_SNIPPETS), ...C_LIBRARY.map(g => ({ group: g.group, entries: g.entries.map(e => ({ name: e.name, usage: [e.sig], doc: e.doc })) }))],
  },
  {
    id: "python", label: "py2ez80",
    intro: "The Python subset that py2ez80 turns into C: its built-ins and the graphics, math and random modules.",
    groups: [snippets(PY_SNIPPETS), ...PY_LIBRARY.map(g => ({ group: g.group, entries: g.entries.map(e => ({ name: e.name, usage: [e.sig], doc: e.doc })) }))],
  },
  {
    id: "ez80", label: "eZ80 assembly",
    intro: "The CE's eZ80 instruction set, the fasmg directives the CE toolchain uses, and common TI-OS routines and addresses from ti84pceg.inc. CE programs run in ADL mode, so register pairs and addresses are 24-bit.",
    groups: [snippets(ASM_SNIPPETS), ...ASM_LIBRARY.map(g => ({ group: g.group, entries: g.entries.map(e => ({ name: e.name, usage: e.forms, doc: e.doc })) }))],
  },
];

/** An id-safe form of a name that keeps ≠ and ≤ (and sin( and sinh) apart. */
const slug = (s: string) => s.replace(/[^A-Za-z0-9]/g, c => `_${c.codePointAt(0)!.toString(16)}`);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
}

/** Doc text with `code` spans. */
function rich(text: string): (Node | string)[] {
  return text.split(/`([^`]+)`/).map((part, i) => (i % 2 ? el("code", {}, part) : part));
}

export interface DocsView { open(lang?: DocLangId, name?: string): void; close(): void; readonly isOpen: boolean }

/** Builds the docs page inside `root`. `onClose` runs when the user closes it. */
export function createDocs(root: HTMLElement, onClose: () => void): DocsView {
  let lang: DocLangId = "tibasic";
  const tabs = el("div", { className: "docs-langs", role: "tablist" });
  const search = el("input", { type: "search", placeholder: "Search these docs…", spellcheck: false });
  const jump = el("select", { title: "Jump to a section" });
  const close = el("button", { type: "button", className: "docs-close", title: "Close (Esc)" }, "×");
  const body = el("div", { className: "docs-body", tabIndex: -1 });
  root.replaceChildren(el("div", { className: "docs-head" }, tabs, el("div", { className: "docs-tools" }, search, jump, close)), body);

  function render() {
    const page = DOCS.find(l => l.id === lang)!;
    tabs.replaceChildren(...DOCS.map(l => el("button", {
      type: "button", role: "tab", ariaSelected: String(l.id === lang),
      onclick: () => { lang = l.id; search.value = ""; render(); body.scrollTop = 0; },
    }, l.label)));

    const q = search.value.trim().toLowerCase();
    const groups = page.groups
      .map(g => ({ ...g, entries: g.entries.filter(e => !q || `${e.name} ${e.usage.join(" ")} ${e.doc}`.toLowerCase().includes(q)) }))
      .filter(g => g.entries.length);
    const count = groups.reduce((n, g) => n + g.entries.length, 0);

    jump.replaceChildren(el("option", { value: "" }, "Jump to…"), ...groups.map(g => el("option", { value: slug(g.group) }, `${g.group} (${g.entries.length})`)));
    body.replaceChildren(
      el("h1", {}, page.label),
      el("p", { className: "docs-intro" }, page.intro, " ", el("span", { className: "hint" }, q ? `${count} matching.` : `${count} entries.`)),
      ...(groups.length ? groups.map(g => el("section", { id: `docs-${slug(g.group)}` },
        el("h2", {}, g.group),
        ...g.entries.map(e => el("article", { className: "docs-entry", id: `docs-${lang}-${slug(e.name)}` },
          el("h3", {}, el("code", {}, e.name), ...(e.tags ?? []).map(t => el("span", { className: "tag" }, t))),
          ...(e.usage.length ? [el("pre", {}, e.usage.join("\n"))] : []),
          el("p", {}, ...rich(e.doc)),
          ...(e.params?.length ? [el("ul", {}, ...e.params.map(p =>
            el("li", {}, el("code", {}, p.name), p.optional ? " (optional)" : "", ": ", p.doc)))] : []),
        )),
      )) : [el("p", { className: "hint" }, "Nothing matches.")]),
    );
  }

  search.addEventListener("input", () => { render(); body.scrollTop = 0; });
  jump.addEventListener("change", () => {
    document.getElementById(`docs-${jump.value}`)?.scrollIntoView({ block: "start" });
    jump.value = "";
  });
  close.addEventListener("click", () => view.close());
  root.addEventListener("keydown", e => {
    if (e.key === "Escape" && !(e.target === search && search.value)) { e.preventDefault(); view.close(); }
  });

  const view: DocsView = {
    get isOpen() { return !root.hidden; },
    open(to, name) {
      if (to) lang = to;
      search.value = "";
      root.hidden = false;
      render();
      const target = name ? document.getElementById(`docs-${lang}-${slug(name)}`) : null;
      if (target) {
        target.scrollIntoView({ block: "start" });
        target.classList.add("flash");
        window.setTimeout(() => target.classList.remove("flash"), 1200);
        body.focus({ preventScroll: true });
      } else {
        body.scrollTop = 0;
        search.focus();
      }
    },
    close() {
      if (root.hidden) return;
      root.hidden = true;
      onClose();
    },
  };
  return view;
}
