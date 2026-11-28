# TIde

A desktop and web IDE for TI calculators, built with Tauri and the Monaco editor. Write TI-BASIC and build real `.8xp` files; work on CE C and C++, eZ80 and z80 assembly, TI-Python and py2ez80 projects; or build TI-Nspire CX programs with Ndless and Lua scripts with Luna. Every calculator runs in TIde, emulated or the real one over a cable.

**Documentation:** [xsamuraicoder.github.io/TIde/docs](https://xsamuraicoder.github.io/TIde/docs/)

## Installation

Download TIde from the [latest release](https://github.com/XSamuraiCoder/TIde/releases/latest), or use it in your browser at [xsamuraicoder.github.io/TIde](https://xsamuraicoder.github.io/TIde/). In the file names below, `<version>` is the release's version, such as `2.0.1`.

### macOS

1. Download `TIde_<version>_aarch64.dmg` for a Mac with Apple Silicon (M1 and later), or `TIde_<version>_x64.dmg` for an Intel Mac. (Not sure? Apple menu → About This Mac: "Chip: Apple M…" is Apple Silicon.)
2. Open the `.dmg` and drag **TIde** into **Applications**.
3. **Run this once in Terminal before opening TIde:**

   ```sh
   xattr -cr /Applications/TIde.app
   ```

   TIde isn't signed with an Apple developer certificate, so macOS marks the downloaded app as quarantined and, when you open it, says **"TIde is damaged and can't be opened"** or that Apple can't check it for malicious software. It isn't damaged: `xattr -cr` removes the quarantine mark macOS put on it, and TIde then opens normally. You only need to do it once; TIde's own updates aren't quarantined.

The `.app.zip` files (`TIde_<version>_aarch64.app.zip`, `TIde_<version>_x64.app.zip`) hold the same `TIde.app` without an installer: unzip it, move it where you like, and run `xattr -cr` on it there (for example `xattr -cr ~/Downloads/TIde.app`).

### Windows

- **Installer:** `TIde_<version>_x64-setup.exe` (or `TIde_<version>_x64_en-US.msi`). TIde isn't signed with a code-signing certificate, so Windows may show **"Windows protected your PC"**: click **More info**, then **Run anyway**.
- **Portable:** `TIde_<version>_x64-portable.exe` runs on its own, with nothing to install. It needs WebView2, which Windows 11 already includes, and it still keeps your programs in your user folder rather than next to the exe.

### Linux

- **Debian, Ubuntu and similar:** `sudo apt install ./TIde_<version>_amd64.deb`
- **Fedora, openSUSE and similar:** `sudo dnf install ./TIde-<version>-1.x86_64.rpm`
- **Any distribution:** `TIde_<version>_amd64.AppImage`: make it executable with `chmod +x TIde_<version>_amd64.AppImage`, then run it.
- **Without installing:** `TIde_<version>_amd64.tar.gz` holds the `tide` program on its own: unpack it with `tar -xzf TIde_<version>_amd64.tar.gz` and run `TIde/tide`. It needs WebKitGTK 4.1 from your distribution. When an update can't install itself the usual way (TIde was installed some other way, or into a folder only root can change), TIde updates from this archive instead, and asks for your password if it needs to.

### In the browser

The web version needs nothing installed: open [xsamuraicoder.github.io/TIde](https://xsamuraicoder.github.io/TIde/). To keep it as an app of its own, which opens from your apps and works offline, press **Install** at the top right, or use your browser's menu: Chrome and Edge install it, Safari adds it to the Dock (or, on iPhone and iPad, Share → Add to Home Screen). Firefox can't install sites as apps. The web version leaves out what only the desktop app does: the terminal, source control, the CEmu app and updates.

### Updates and nightlies

The installed app updates itself: it checks for a new release when it starts and offers it, with its release notes. The portable exe and the `.app.zip` don't update themselves; download the new one. **Settings → Updates → Update channel** switches to **Nightly**, every build of the `main` branch, with the newest changes before they're released; the nightly installers are on the [latest build](https://github.com/XSamuraiCoder/TIde/releases/tag/latest) prerelease (on Linux, the `.deb` and the AppImage: an `.rpm` can't carry a nightly's version), and the nightly web version is at [xsamuraicoder.github.io/TIde/nightly](https://xsamuraicoder.github.io/TIde/nightly/).

## Web version

The web version ([installing it](#in-the-browser)) is published with every stable release, and its nightly with every push to `main`. It is always the one on its page, so it has no updates to check. It has the editor, IntelliSense, docs, extensions and all three calculator emulators, and builds in the browser: TI-BASIC to `.8xp`, and TI-83 Plus / 84 Plus z80 and TI-84 Plus CE eZ80 assembly with spasm-ng compiled to WebAssembly. **File → Open folder…** opens a real folder on your computer in Chrome and Edge; **File → Open browser project…** keeps a project in the browser's own storage, on any browser. Calculator ROMs stay in the browser's storage too. The terminal, source control, the CEmu app and updates are in the desktop app. To build it yourself: `npm run build:web` (into `dist-web`).

## TI-BASIC

Programs live in the list under **Programs**, separate from any folder you open.

- Completions, signature help, hover docs and block folding
- Checks for unclosed blocks, missing labels, off-screen positions and likely typos
- The tokenized size in the status bar, which is what the calculator will store
- **Build .8xp** writes a program the calculator accepts. It asks where to save the first time, then rebuilds to the same file

### Targets

In a project, its `.tide/tide.json` says which calculator it's for (`"calculator"`), and opening the folder asks when it doesn't; **Settings → Project → Set up this folder…** changes it. Outside a project, **Settings → Calculator** sets which calculator your TI-BASIC programs are for, for all of them.

| | TI-84 Plus CE | TI-84 Plus | TI-84 EVO | TI-Nspire CX |
|---|---|---|---|---|
| Home screen | 26 × 10 | 16 × 8 | 32 x 10 | Adjustable | 
| Graph screen | 265 × 165 | 95 × 63 | 319 x 209 | 320 x 240 |
| Color support | Available | Unavailable | Available | Available |
| CE-only commands | Available | Marked as errors and excluded from the `.8xp` | Available | Available |
| Output format | `.8xp` | `.8xp` | `.8xp2`| `.tns` |

## C projects

Opening a folder with a `Makefile`, `makefile` or `GNUmakefile` in its root treats it as a C project. Files other than TI-BASIC programs then get a **Build** button that saves your changes and runs `make` in that folder. The result appears in the status bar; hover over it for the full output.

Building needs the [CE C toolchain](https://github.com/CE-Programming/toolchain) with `make` on your `PATH`. The toolchain only targets the CE.

## Calculator

The **Calculator** (the calculator icon in the activity bar) runs a calculator inside TIde, in its own Calculator tab: a TI-84 Plus CE, TI-83 Premium CE or TI-82 Advanced Edition Python; a TI-73, 81, 82, 83, 83 Plus, 83 Plus SE, 84 Plus, 84 Plus SE, 85 or 86; or a TI-Nspire CX. Pick one in the model menu on the calculator bar, which lists the calculators you have images for; **Add a ROM…** there, or **Calculator images…**, opens the images popup, with a tab for the CE calculators, the TI-Nspire CX and the TI-73 to 86, and a card per ROM or image to start, replace or remove it. **Reset** restarts it; **Reload ROM** boots a fresh calculator from the ROM, with empty memory. When the calculator turns its screen off, the screen shows LCD OFF. **▶ Run** in the status bar (F5) builds the active TI-BASIC program, or the C project with `make`, sends it to the calculator and launches it. **Send files…**, or dropping files on the calculator, sends any TI file: programs, appvars, lists, matrices, groups, pictures and images, apps (`.8ek`), OS files and bundles (`.b84`, `.b83`). The screen and the keypad are the same size, side by side or stacked in a narrow window. The calculator bar's **Console** button opens the Console tab under the editor, with the emulator's output, including `dbg_printf` from C programs, and each step TIde takes when sending and running. For a C project, Run also sends the CE C libraries (`clibs.8xg`, from the [CE toolchain releases](https://github.com/CE-Programming/toolchain/releases)) the first time in each calculator session, if TIde finds them in the project (its root, `bin/` or `lib/`), in `$CEDEV`, or in the default toolchain folder. Click the screen to type with CEmu's default keys (letters type their alpha key, Tab is 2nd, `'` is alpha, Esc is clear, F1–F5 are the graph keys, F12 is on; hover a key to see its bindings), or click the keys.

The emulators are built into TIde, so the panel only asks for images dumped from your own calculator. TIde reads what each ROM is from its bytes: a CE ROM's model (TI-84 Plus CE, TI-83 Premium CE or TI-82 AEP) and boot code version, as CEmu does, and any other ROM's model and OS, as Wabbitemu does, so the menu says "TI-83 Premium CE · boot 5.3.6.0014" or "TI-84 Plus · OS 2.55MP". Keep as many ROMs as you like, several of the same calculator too. The TI-Nspire CX runs from its boot1 and flash images, and files sent to it stay in its flash for next time. TIde keeps everything in its data folder; it never ships or downloads a ROM. Run sends TI-BASIC as an `.8xp`, so it runs on the CE or a TI-83 Plus or 84 Plus, where TIde starts it from the PRGM menu, and a Nspire project's `.tns` files to the Nspire. On the other models, send files and run them yourself.

Each keypad is laid out like its calculator's: every key shows what 2nd and alpha make of it above it, lit up while 2nd or alpha waits for the next key; the TI-81, 82, 83, 85 and 86 have their own labels, and the TI-Nspire CX its own keyboard with the touchpad. C and assembly programs need an OS that allows them: TI blocks them on OS 5.5 and later.

The CE calculators run on [CEmu](https://github.com/CE-Programming/CEmu)'s core (GPLv3), the TI-73 to 86 on [Wabbitemu](https://github.com/sputt/wabbitemu)'s (GPLv2 or later, from [wasmWabbitemu](https://github.com/marwatk/wasmwabbitemu) with TIde's bridge), and the TI-Nspire CX on [Firebird](https://github.com/nspire-emus/firebird)'s (GPLv3, with TIde's bridge). All three are compiled to WebAssembly and built into the app; `emulator/cemu`, `emulator/wabbit` and `emulator/firebird` hold the builds, the scripts that make them and a `SOURCE.txt` naming the source. **Open in CEmu** in the panel runs the program in the full CEmu desktop app instead, which TIde downloads on first use.

The TI-84 Evo has no emulator in TIde. TIde recognizes an Evo over USB and can describe its USB identity in the Console; for now, use TI Connect Evo to transfer files. TI-Python editing and documentation are built in.

## Source Control

The **Source Control** view (`Ctrl+Shift+G`) shows the git status of the open folder: staged changes and changes, with **+** and **−** to stage and unstage a file or all of them. Type a message and press **Commit** or `Ctrl+Enter`; with nothing staged it commits every change. **Pull** (fast-forward only) and **Push** work once the branch has an upstream. The status bar shows the branch and how far it is ahead or behind, and the activity bar shows how many files changed. It uses your own `git`, so your config, credentials and hooks apply.

## Docs

The **Docs** view in the activity bar lists everything you can use in the active file. Click an entry to open its full page (usage, description and parameters) in the editor area, or press Enter or **+** to insert it at the cursor. Searching and pressing Enter inserts the best match.

- **TI-BASIC:** block templates, every command grouped by topic, and symbols that are hard to type, such as `→` and `≠`
- **C and C++:** snippets and the CE libraries
- **TI-Python:** Python `.py` programs for the TI-84 Plus CE Python and TI-84 Evo, with TI module completions, hover help, starter snippets and module docs. Use TI Connect CE or TI Connect Evo to transfer them.
- **py2ez80:** snippets and the [py2ez80](https://github.com/Voblit/py2ez80) modules (select Monaco's Python language for py2ez80 source files).
- **eZ80 assembly** (`.asm`, `.s`, `.src`, `.inc`, `.z80`, `.ez80`): snippets, the full instruction set, fasmg directives, and common TI-OS routines and addresses. Assembly files also get highlighting, completions and hover docs.

Press F1 on an entry to open its page, and Esc to close the page.

## Updates

The desktop app checks the newest stable release (the latest `v` tag's) when it starts. If there is a newer build it offers the update, with the release notes from [RELEASE_NOTES.md](RELEASE_NOTES.md); click the version in the status bar to check at any time. Edit `RELEASE_NOTES.md` before pushing to change what the next release says. The portable exe and the zipped `.app` don't update themselves.

**Settings → Updates → Update channel** picks which builds the app updates to: **Stable**, each tagged release, or **Nightly**, every build of `main`, with the newest changes before they're released. Every push to `main` refreshes the rolling `latest` prerelease as a nightly: it's versioned as the next patch with the build's run number (`2.0.1-75`, above 2.0.0 and below 2.0.1), and its `nightly.json` is what the Nightly channel reads. Going back to Stable keeps the nightly until the next release is newer. Pushing a version tag (`git tag v1.5.0 && git push origin v1.5.0`) builds that version as a stable release with `latest.json`, and installed apps update to it. Releases use the version in `src-tauri/tauri.conf.json`, and the tag must match it (also set it in `package.json` and `Cargo.toml`); installed apps are offered an update only when it goes up, so bump it to ship one. Update files are signed. The workflow needs the signing key as the `TAURI_SIGNING_PRIVATE_KEY` repository secret (and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` if the key has one). The public key is in `tauri.conf.json`.

## Menus, windows and workspaces

The menu bar across the top has **File** (new programs, files and windows; opening folders and workspaces; saving; settings), **Edit** (undo, the clipboard, find and replace, go to line, comments, the command palette), **View** (the side bar's views, the terminal and output, word wrap, the minimap, line numbers, light mode), **Run** (build, run, the project's `tide.json` scripts and extensions' commands), **Calculator** (show it, send files, connect a calculator or a serial cable) and **Help**. Click a name to open its menu; hover another, or use ← and →, to move between them.

In the desktop app, **File → New window** (`Ctrl+Shift+N`) opens another window, and **Open folder in new window…** opens a project in one, so you can work on several at once. Each window has its own folder, tabs, terminal and Source Control; settings are shared. TIde reopens what the first window had open last.

A **workspace** is several folders in one window: **File → Add folder to workspace…** adds one, and each shows as a heading in the Explorer. The folder of the file you're in is the active one, marked **active**: builds, Source Control, the terminal and its `tide.json` follow it, and right-clicking a folder's heading can make it the active one, open it in a new window or remove it from the workspace. **Save workspace…** keeps the folders in a `.tide-workspace` file (folders beside or below it are saved relative to it), and **Open workspace…** opens one again.

## Files and settings

Project files open in the encoding they're in: UTF-8, UTF-16 (from its byte-order mark), or, for other text, the encoding set in Settings (Windows 1252 to start with). The status bar shows a file's encoding; pick one there to reopen the file in it or save it in it. TIde reads over 25 encodings and saves all but the multi-byte East Asian ones. A binary file opens in a tab that says so, with a hex preview and an option to open it as text anyway.

Images (PNG, JPEG, GIF, BMP, WebP, AVIF, ICO and SVG) open as pictures in the editor, on a checkerboard so transparency shows. They open fitted to the editor; zoom with the − and + buttons, Ctrl+wheel or a pinch, or the + and − keys, and 0 fits the picture again. Past 100%, pixels stay sharp, for sprites.

TI files (`.8xp`, `.8xv`, `.8xg`, `.8ek`, `.b84` and the rest) open as a summary: the comment, each variable's name, type, size, archive flag and version, and whether the checksum is valid. Programs show their TI-BASIC, with **Open as program** to copy one into your programs; Flash apps and OS files show their header, and bundles list their contents. **Send to calculator** sends the file.

**Settings** (the gear at the bottom of the activity bar, or `Ctrl+,`) covers the theme (TIde Dark and Light; Dark Modern, Light Modern and Monokai, modeled on VS Code's; High Contrast Dark and Light; Graphite and LCD; any an extension adds; or the system's), the font (the default Inter and JetBrains Mono pair; JetBrains Mono, Fira Code, Source Code Pro, Roboto Mono, IBM Plex Mono, Inter, IBM Plex Sans or Source Sans 3 throughout, all bundled; the system's; or a .ttf, .otf, .woff or .woff2 file; and ligatures), the editor (font size, tab size, word wrap, minimap, whitespace), TI-BASIC (calculator, gutter, screen-width ruler), the encoding for other text, `clibs.8xg`, the TI-Nspire (Ndless SDK folder, Luna command), files (auto save), the project (when to set up a folder, and its `tide.json`), source control and update checks.

## Output, Terminal and Console

The Explorer stays up to date by itself: files a build, the terminal or another program makes, changes or deletes show at once (changes inside `.git` and `node_modules` are left out).

The panel under the editor has three tabs: Output, Terminal and Console. The status bar's **Terminal** and **Output** buttons open those two (click again to close). **Output** (`Ctrl+Shift+U`) shows the full log of every build, prerun, postrun and script as it runs: a line saying what ran and when, its output (errors in red, colors kept, progress lines updating in place), and how it ended, with the exit code and time. It opens when one starts, and **■ Stop** ends it.

**Console** shows the calculator's console: `dbg_printf` from C programs, emulator messages, and each step TIde takes when sending and running. The calculator bar's **Console** button opens it.

**Terminal** (``Ctrl+` ``) runs command lines in the system shell, starting in the open folder: type one and press Enter. `cd` moves it, `cls` or `clear` (or `Ctrl+L`) clears it, and the arrow keys bring back earlier lines. While a command runs, what you type goes to its input, and **■ Stop** (or `Ctrl+C`) ends it and anything it started. Drag the panel's top edge to resize it; **×** closes it.

## Project file

Opening a folder whose `.tide/tide.json` doesn't say which calculator it's for or what it's written in asks, page by page: the calculator and the language its files point to (with the rest a click away, in case they're wrong), then its prerun and postrun steps. A folder without a `tide.json` gets a whole one for its kind. **Settings → Project** sets when TIde asks (always, only when the files point more than one way, or never), and **Set up this folder…** there opens it again.

A folder's `.tide/tide.json` has `calculator` (`ce`, `plus` or `nspire`), `language` (`tibasic`, `c`, `cpp`, `ez80`, `z80`, `tipython`, `py2ez80` or `lua`; in a `py2ez80` project `.py` files open as py2ez80, and in a `z80` one assembly opens as z80), `build` (a command line instead of `make`), `prerun` (steps after building and before sending), `postrun` (steps after the program starts), `send` (files to send, such as `bin/*.8xp`), `program` (what to start), `libraries`, `runIn` (`calculator` or `cemu`), `scripts` (named command lines in the status bar's Scripts menu) and `editor` (settings for this project). Steps are command lines or calculator macros, such as `["app.open(AsmHook2)", "key.press(enter)"]`: `key.press(key)`, `key.type("TEXT")`, `program.run(NAME)` (or `program.open`), `app.open(NAME)` and `wait(ms)`. Comments are allowed, and the editor completes and checks it. Every command line (`build`, `prerun`, `postrun` and `scripts`) runs in the system shell, cmd on Windows and sh elsewhere, so `&&`, pipes, redirects and variables work as in a terminal: `"prerun": ["python tools/pack.py && make gfx"]`.

## Extensions

The **Extensions** view (`Ctrl+Shift+X`) lists every extension with a switch to turn it on or off, and **Uninstall** for removing it (its folder goes to the Recycle Bin). TIde's language support comes as three extensions, installed into the extensions folder the first time TIde runs and updated with TIde:

- **CE Languages**, for TI-Python on the TI-84 Plus CE Python and TI-84 Evo, and TI-BASIC, CE C, eZ80 assembly and py2ez80 on the CE. It adds completions, hover help, signature help, go to label, folding, assembly highlighting and snippets.
  Its catalogs also check code as you type, with quick fixes (`Ctrl+.`): in C, wrong argument counts for library functions, a missing `#include` (one click adds it) and misspelled library functions; in assembly, misspelled instructions, directives and OS routines; in py2ez80, names `graphics`, `math` and `random` don't have, a module used without `import`, and wrong argument counts. C also gets signature help, and hover says which header a function is in. `Ctrl+Shift+O` lists a C file's functions, an assembly file's labels (F12 goes to one) and a TI-BASIC program's `Lbl`s. Only near-misses of real names are flagged, so your own names and macros never are.
- **Plus Languages**, for the TI-83 Plus and 84 Plus: z80 assembly in `.z80` files, with highlighting, `bcall` completions and hover help for ti83plus.inc's routines and addresses (`_PutS`, `_GetCSC`, `plotSScreen`, `skClear`…), a `program` snippet for a spasm program, and TI-BASIC snippets for the Plus's screens (`plusgraph`, `plustitle`).

- **Nspire**, for the TI-Nspire CX: completions and hover help for Nspire Lua and the Ndless SDK's C and C++ API, and commands that start a Ndless project in the open folder, build it with make, pack `.lua` and `.py` scripts into `.tns` files with Luna, and send them to the calculator panel's Nspire. Settings → TI-Nspire sets the Ndless SDK folder and the Luna command.

Uninstalling one turns its support off; it stays uninstalled until you install it again from **Available** in the same view. Their sources are the folders in `extensions/`, the same as any extension's. Type a snippet's name and pick it from the suggestions (`Ctrl+Space`).

An extension is a folder in TIde's extensions folder (**More ▾ → Open extensions folder**) with an `extension.json`. **More ▾ → New extension** makes one from a template and opens it; saving its files reloads it. Right-click an extension to edit it or show its folder.

```jsonc
{
  "name": "My Snippets",
  "version": "1.0.0",
  "main": "main.js",                       // optional: code that runs
  "contributes": {
    "snippets":    [{ "language": "tibasic", "prefix": "hello", "body": ["Disp \"${1:HI}\"", "$0"] }],
    "completions": [{ "language": "c", "label": "my_func", "detail": "void my_func(int)", "documentation": "Markdown." }],
    "hovers":      [{ "language": "tibasic", "word": "Disp", "contents": "Markdown." }],
    "languages":   [{ "id": "axe", "name": "Axe", "extensions": [".axe"], "monarch": { "tokenizer": { "root": [] } } }]
  }
}
```

`main.js` exports `activate(tide)` (and optionally `deactivate()`). `tide` has `commands.register(id, label, run)` (commands go in the Run menu and the editor's right-click menu), `languages.completions`, `hover`, `signatureHelp` and `markers` for IntelliSense in any language, `languages.builtIn("tibasic" | "c" | "ez80" | "python")` to turn on TIde's own IntelliSense for one (as CE Languages does), `on("open" | "save" | "run" | "project" | "settings", fn)`, `editor` (the open file's text and selection), `calculator.macro(…)`, `files`, `message`, `settings`, `project`, and `monaco` for anything else. Everything it registers is undone when the extension is turned off.

### .TIdeex files

A `.tideex` file holds a whole extension, to share it and install it. Right-click an installed extension and choose **Export as .TIdeex…** to make one. To install one, double-click it, drop it on TIde's window, or choose **More ▾ → Install from .TIdeex…**. TIde shows its name, version, author and description first, and says so if it runs code. An extension with the same `id` is replaced, so a newer `.tideex` updates it.

The format is a zip archive, so any zip tool can make or open one:

- `extension.json` at the root, and the files it uses (such as `main.js`) laid out as in the extension's folder. A zip of the extension's folder also works: one top folder is taken off.
- Entries are stored or deflated, with `/` in paths, which must be relative and can't contain `..`.
- The archive comment is `TIdeex 1`, the format's version.
- Up to 1000 files and 32 MB unpacked.
- It installs to the extensions folder under the manifest's `id` (lower case letters, digits, `-` and `.`, such as `yourname.snippets`), or a name made from its `name`.

Writing an extension has IntelliSense too: `extension.json` gets completions, hover help and checking, and `main.js` gets typed completions for `tide` (add `/** @param {Tide} tide */` above `activate`, or `// @ts-check` for checking, as the template does).

## Shortcuts

Use Cmd instead of Ctrl on macOS.

| Keys | Action |
|---|---|
| `Ctrl+S` | Save |
| `Ctrl+E` | Build |
| `F5` | Build and run in the calculator |
| `Ctrl+Shift+E` | Build a TI-BASIC program to a new location |
| `Ctrl+J` | Search the docs |
| `Ctrl+Shift+J` | Open or close the docs page |
| `Ctrl+B` | Show or hide the side bar |
| `Ctrl+,` | Settings |
| `Ctrl+Shift+G` | Source Control |
| `Ctrl+Shift+X` | Extensions |
| ``Ctrl+` `` | Terminal |
| `Ctrl+Shift+U` | Output |
| `Ctrl+N` | Find or create a program |
| `Ctrl+Shift+O` | Open a folder |
| `Ctrl+Shift+N` | New window (desktop app) |
| `Ctrl+W` | Close the tab |

In the program search, Enter opens the first match or creates the program if nothing matches. `Ctrl+Enter` always creates it.

## Development

You need Node.js and [the Tauri prerequisites](https://tauri.app/start/prerequisites/), including Rust.

```bash
npm install
```

Run the desktop app:

```bash
npm run tauri dev
```

Run in a browser, where programs are kept in local storage and folders aren't available:

```bash
npm run dev
```

Build installers:

```bash
npm run tauri build
```

Run the backend tests from `src-tauri`:

```bash
cargo test --lib
```

## Credits

### Contributors

- [grovylestand](https://github.com/grovylestand): TI-Nspire CX support, with the Firebird emulator in the calculator panel and the Nspire extension (Nspire Lua and Ndless completions, Ndless projects, Luna packing).

### Built into TIde

- [CEmu](https://github.com/CE-Programming/CEmu) by the CE Programming team: its core runs the TI-84 Plus CE, TI-83 Premium CE and TI-82 Advanced Edition Python in the calculator panel.
- [Wabbitemu](https://github.com/sputt/wabbitemu) by Spencer Putt, Chris Shappell, James Montelongo and others, through [wasmWabbitemu](https://github.com/marwatk/wasmwabbitemu) by Marcus Watkins: its core runs the TI-73, 81, 82, 83, 83 Plus, 84 Plus, 85 and 86.
- [Firebird](https://github.com/nspire-emus/firebird) by the nspire-emus team: its core runs the TI-Nspire CX.
- [TILP's libraries](https://github.com/debrouxl/tilibs) (libticalcs2, libticables2, libtifiles2, libticonv) by Romain Liévin, Lionel Debroux and others, built for the web as WebTILP by [Adrien Bertrand](https://github.com/adriweb/tilibs): they connect real calculators over USB.
- The [CE C/C++ toolchain](https://github.com/CE-Programming/toolchain) by the CE Programming team, with [convbin](https://github.com/mateoconlechuga/convbin) and [spasm-ng](https://github.com/alberthdev/spasm-ng): TIde's toolchain for building C, C++ and assembly.
- [Monaco Editor](https://github.com/microsoft/monaco-editor) by Microsoft and [xterm.js](https://github.com/xtermjs/xterm.js): the editor and the terminal.
- [Tauri](https://tauri.app/): the desktop app.

### Also

- The serial link follows the [TI Link Protocol Guide](https://merthsoft.com/linkguide/).
- TIde works with [Ndless](https://github.com/ndless-nspire/Ndless), [Luna](https://github.com/ndless-nspire/Luna) and [py2ez80](https://github.com/Voblit/py2ez80), which you install yourself.

## License

TIde is free software under the [GNU General Public License v3.0](LICENSE) or any later version. It includes CEmu (GPLv3), Wabbitemu (GPLv2 or later) and Firebird (GPLv3), whose sources are named in `emulator/*/dist/SOURCE.txt`, and TILP's libraries (GPLv2 or later) with their dependencies, named in `public/webtilp/SOURCE.txt`.
