// The Extensions view in the side bar: every extension with its switch, what it adds and any error,
// plus New extension, the extensions folder and Reload in its menu.
import { availableExtensions, createExtension, extensions, extensionsFolder, installBundled, installPackage, onExtensionsChange, packageExtension, readPackage, reloadExtensions,
  setExtensionEnabled, uninstallExtension, type BundledExtension, type Extension } from "./extensions";
import { showMenu } from "./menu";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fileName = (path: string) => path.split(/[\\/]/).pop() ?? path;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
}

export function createExtensionsView(opts: {
  available: boolean;
  say: (text: string) => void;
  openFile: (path: string) => Promise<void>;
  reveal: (path?: string) => Promise<void>;
  pickPackage: () => Promise<string | null>;
  pickSaveFile: (name: string) => Promise<string | null>;
  readBinary: (path: string) => Promise<Uint8Array>;
  writeBinary: (path: string, bytes: Uint8Array) => Promise<void>;
  /** Shows the Extensions view. */
  show: () => void;
}) {
  const list = $("ext-list"), find = $<HTMLInputElement>("ext-find");
  let naming = false;

  function card(ext: Extension): HTMLElement {
    const m = ext.manifest;
    const toggle = el("input", { type: "checkbox", checked: ext.enabled, ariaLabel: `${m.name} on or off` });
    toggle.addEventListener("change", () => void setExtensionEnabled(ext, toggle.checked)
      .then(() => opts.say(`${m.name} is ${toggle.checked ? "on" : "off"}.`)));
    const row = el("div", { className: `ext${ext.enabled ? "" : " off"}`, title: ext.dir ?? "Runs from TIde itself" },
      el("div", { className: "ext-name" }, m.name, el("small", {}, [m.version && `v${m.version}`, m.author, ext.bundled && "comes with TIde"].filter(Boolean).join(" · "))),
      el("label", { className: "switch-toggle" }, toggle, el("span")),
      ...(m.description ? [el("div", { className: "ext-desc" }, m.description)] : []),
      ...(ext.enabled && ext.added.length ? [el("div", { className: "ext-adds" }, `Adds ${ext.added.join(", ")}.`)] : []),
      ...(ext.error ? [el("div", { className: "ext-error" }, ext.error)] : []),
      ...(ext.dir ? [el("div", { className: "ext-actions" }, el("button", { type: "button", onclick: () => void uninstall(ext) }, "Uninstall"))] : []));
    if (ext.dir) {
      const dir = ext.dir;
      const sep = dir.includes("\\") ? "\\" : "/";
      row.addEventListener("contextmenu", e => {
        e.preventDefault();
        e.stopPropagation();
        showMenu(e.clientX, e.clientY, [
          { label: "Edit extension.json", run: () => void opts.openFile(`${dir}${sep}extension.json`) },
          ...(m.main ? [{ label: `Edit ${m.main}`, run: () => void opts.openFile(`${dir}${sep}${m.main}`) }] : []),
          { label: "Show in folder", run: () => void opts.reveal(dir) },
          "-",
          { label: "Export as .TIdeex…", run: () => void exportPackage(ext) },
          { label: "Uninstall…", run: () => void uninstall(ext) },
        ]);
      });
      row.addEventListener("dblclick", () => void opts.openFile(`${dir}${sep}extension.json`));
    }
    return row;
  }

  async function uninstall(ext: Extension) {
    const m = ext.manifest;
    const again = ext.bundled ? " It comes with TIde, so you can install it again from Available." : "";
    if (!confirm(`Uninstall ${m.name}? Its folder goes to the Recycle Bin.${again}`)) return;
    try {
      await uninstallExtension(ext);
      opts.say(`Uninstalled ${m.name}.`);
    } catch (err) {
      opts.say(`Could not uninstall ${m.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  /** A card for a bundled extension that isn't installed, with an Install button. */
  function availableCard(b: BundledExtension): HTMLElement {
    const m = b.manifest;
    const button = el("button", { type: "button" }, "Install");
    button.addEventListener("click", () => {
      button.disabled = true;
      void installBundled(b.id).then(() => opts.say(`Installed ${m.name}.`), err => {
        button.disabled = false;
        opts.say(`Could not install ${m.name}: ${err instanceof Error ? err.message : err}`);
      });
    });
    return el("div", { className: "ext off" },
      el("div", { className: "ext-name" }, m.name, el("small", {}, [m.version && `v${m.version}`, "comes with TIde"].filter(Boolean).join(" · "))),
      ...(m.description ? [el("div", { className: "ext-desc" }, m.description)] : []),
      el("div", { className: "ext-actions" }, button));
  }

  function nameBox(): HTMLElement {
    const input = el("input", { className: "name-input", placeholder: "Extension name, then Enter", spellcheck: false });
    input.style.margin = "4px 14px 8px";
    input.style.width = "calc(100% - 28px)";
    let done = false;
    const finish = async (make: boolean) => {
      if (done) return;
      done = true;
      naming = false;
      const name = input.value.trim();
      render();
      if (!make || !name) return;
      try {
        const dir = await createExtension(name);
        const sep = dir.includes("\\") ? "\\" : "/";
        opts.say(`Made ${name}. Edit it, save, and it reloads.`);
        await opts.openFile(`${dir}${sep}main.js`);
        await opts.openFile(`${dir}${sep}extension.json`);
      } catch (err) {
        opts.say(`Could not make the extension: ${err instanceof Error ? err.message : err}`);
      }
    };
    input.addEventListener("keydown", e => {
      e.stopPropagation();
      if (e.key === "Enter") void finish(true);
      else if (e.key === "Escape") void finish(false);
    });
    input.addEventListener("blur", () => void finish(!!input.value.trim()));
    queueMicrotask(() => input.focus());
    return input;
  }

  /** Installs a .TIdeex file, after showing what it is and asking. */
  async function install(path: string) {
    opts.show();
    try {
      const pkg = await readPackage(await opts.readBinary(path));
      const m = pkg.manifest;
      const lines = [
        `Install ${m.name}${m.version ? ` ${m.version}` : ""}${m.author ? ` by ${m.author}` : ""}?`,
        ...(m.description ? ["", m.description] : []),
        ...(pkg.replaces ? ["", `It replaces the installed ${pkg.replaces.manifest.name}${pkg.replaces.manifest.version ? ` ${pkg.replaces.manifest.version}` : ""}.`] : []),
        ...(m.main ? ["", "It runs its own code in TIde, with TIde's access to your files. Only install extensions you trust."] : []),
      ];
      if (!confirm(lines.join("\n"))) return;
      const ext = await installPackage(pkg);
      opts.say(ext.error ? `Installed ${m.name}, but it has a problem: ${ext.error}` : `Installed ${m.name}.`);
    } catch (err) {
      opts.say(`Could not install ${fileName(path)}: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function exportPackage(ext: Extension) {
    const m = ext.manifest;
    const path = await opts.pickSaveFile(`${ext.id}${m.version ? `-${m.version}` : ""}.tideex`);
    if (!path) return;
    try {
      await opts.writeBinary(path, await packageExtension(ext));
      opts.say(`Exported ${m.name} to ${fileName(path)}.`);
    } catch (err) {
      opts.say(`Could not export ${m.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  function render() {
    const q = find.value.trim().toLowerCase();
    const all = extensions().filter(x => !q || `${x.manifest.name} ${x.manifest.description ?? ""} ${x.manifest.author ?? ""}`.toLowerCase().includes(q));
    const installed = all.filter(x => !x.builtIn), builtIn = all.filter(x => x.builtIn);
    const available = availableExtensions().filter(b => !q || `${b.manifest.name} ${b.manifest.description ?? ""}`.toLowerCase().includes(q));
    list.replaceChildren(
      ...(naming ? [nameBox()] : []),
      el("h3", {}, "Installed"),
      ...(installed.length ? installed.map(card) : [el("p", { className: "hint" }, opts.available
        ? (q ? "None match." : "None. More ▾ → New extension makes one; Install from .TIdeex adds one.")
        : "Installed extensions load in the desktop app.")]),
      ...(available.length ? [el("h3", {}, "Available"), ...available.map(availableCard)] : []),
      ...(builtIn.length ? [el("h3", {}, "Comes with TIde"), ...builtIn.map(card)] : []),
    );
  }

  find.addEventListener("input", render);
  onExtensionsChange(render);
  $("ext-menu").addEventListener("click", e => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    showMenu(r.left, r.bottom + 2, [
      { label: "New extension…", disabled: !opts.available, run: () => { naming = true; render(); } },
      { label: "Install from .TIdeex…", disabled: !opts.available, run: () => void opts.pickPackage().then(p => { if (p) void install(p); }) },
      { label: "Open extensions folder", disabled: !opts.available, run: () => void opts.reveal() },
      { label: "Reload extensions", disabled: !opts.available, run: () => void reloadExtensions().then(() => opts.say(`Reloaded ${extensions().filter(x => !x.builtIn).length} installed extensions.`)) },
    ]);
  });
  render();
  return { render, folder: extensionsFolder, install };
}
