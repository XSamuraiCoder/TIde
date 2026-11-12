# TIde

A small desktop IDE for TI-84 calculators, built with Tauri and the Monaco editor. Write TI-BASIC and build real `.8xp` files, or work on CE C and py2ez80 projects.

Installers for Windows, Linux and macOS are published on the `latest` release by the build workflow, along with two versions that don't need installing:

- **Windows:** `TIde_<version>_x64-portable.exe` runs on its own. It needs WebView2, which Windows 11 already includes, and it still saves programs in your user folder rather than next to the exe.
- **macOS:** `TIde_<version>_aarch64.app.zip` (Apple Silicon) or `TIde_<version>_x64.app.zip` (Intel) contains `TIde.app`. The app isn't signed, so if macOS says it is damaged, run `xattr -cr TIde.app` once.

## TI-BASIC

Programs live in the list under **Programs**, separate from any folder you open.

- Completions, signature help, hover docs and block folding
- Checks for unclosed blocks, missing labels, off-screen positions and likely typos
- The tokenized size in the status bar, which is what the calculator will store
- **Build .8xp** writes a program the calculator accepts. It asks where to save the first time, then rebuilds to the same file

### Targets

The **Target** button in the status bar sets which calculator your TI-BASIC programs are for. The choice applies to all programs.

| | TI-84 Plus CE | TI-84 Plus |
|---|---|---|
| Home screen | 26 × 10 | 16 × 8 |
| Graph screen | 265 × 165 | 95 × 63 |
| Color and other CE-only commands | Available | Marked as errors and left out of the `.8xp` |

## C projects

Opening a folder with a `Makefile`, `makefile` or `GNUmakefile` in its root treats it as a C project. Files other than TI-BASIC programs then get a **Build** button that saves your changes and runs `make` in that folder. The result appears in the status bar; hover over it for the full output.

Building needs the [CE C toolchain](https://github.com/CE-Programming/toolchain) with `make` on your `PATH`. The toolchain only targets the CE.

## Calculator

The **Calculator** (the calculator icon in the activity bar) runs a TI-84 Plus CE inside TIde, in its own Calculator tab. **Reset** restarts it; **Reload ROM** boots a fresh calculator from the ROM, with empty memory. **▶ Run** in the status bar (F5) builds the active TI-BASIC program, or the C project with `make`, sends it to the calculator and launches it. **Send files…**, or dropping files on the calculator, sends any TI file: programs, appvars, lists, matrices, groups, pictures and images, apps (`.8ek`), OS files and bundles (`.b84`, `.b83`). The screen and the keypad are the same size, side by side or stacked in a narrow window. The **Console** below them shows CEmu's output, including `dbg_printf` from C programs, and each step TIde takes when sending and running. For a C project, Run also sends the CE C libraries (`clibs.8xg`, from the [CE toolchain releases](https://github.com/CE-Programming/toolchain/releases)) the first time in each calculator session, if TIde finds them in the project (its root, `bin/` or `lib/`), in `$CEDEV`, or in the default toolchain folder. Click the screen to type with CEmu's default keys (letters type their alpha key, Tab is 2nd, `'` is alpha, Esc is clear, F1–F5 are the graph keys, F12 is on; hover a key to see its bindings), or click the keys.

The first time, the panel downloads the emulator core (about 300 KB) and asks for a ROM dumped from your own calculator. TIde keeps both in its data folder; it never ships or downloads a ROM. CEmu only emulates the CE, so set the target to CE to run TI-BASIC. C and assembly programs need an OS that allows them: TI blocks them on OS 5.5 and later.

The emulator is [CEmu](https://github.com/CE-Programming/CEmu)'s core, compiled to WebAssembly by the release workflow from a pinned CEmu commit and published next to the installers (GPLv3; see `WebCEmu-SOURCE.txt` on the release). TIde downloads it separately rather than including it. **Open in CEmu** in the panel runs the program in the full CEmu app instead, which TIde downloads the same way.

## Source Control

The **Source Control** view (`Ctrl+Shift+G`) shows the git status of the open folder: staged changes and changes, with **+** and **−** to stage and unstage a file or all of them. Type a message and press **Commit** or `Ctrl+Enter`; with nothing staged it commits every change. **Pull** (fast-forward only) and **Push** work once the branch has an upstream. The status bar shows the branch and how far it is ahead or behind, and the activity bar shows how many files changed. It uses your own `git`, so your config, credentials and hooks apply.

## Docs

The **Docs** view in the activity bar lists everything you can use in the active file. Click an entry to open its full page (usage, description and parameters) in the editor area, or press Enter or **+** to insert it at the cursor. Searching and pressing Enter inserts the best match.

- **TI-BASIC:** block templates, every command grouped by topic, and symbols that are hard to type, such as `→` and `≠`
- **C and C++:** snippets and the CE libraries
- **Python:** snippets and the [py2ez80](https://github.com/Voblit/py2ez80) modules
- **eZ80 assembly** (`.asm`, `.s`, `.src`, `.inc`, `.z80`, `.ez80`): snippets, the full instruction set, fasmg directives, and common TI-OS routines and addresses. Assembly files also get highlighting, completions and hover docs.

Press F1 on an entry to open its page, and Esc to close the page.

## Updates

The desktop app checks the `latest` release when it starts. If there is a newer build it offers the update, with the release notes from [RELEASE_NOTES.md](RELEASE_NOTES.md); click the version in the status bar to check at any time. Edit `RELEASE_NOTES.md` before pushing to change what the next release says. The portable exe and the zipped `.app` don't update themselves.

Releases use the version in `src-tauri/tauri.conf.json` (also set it in `package.json` and `Cargo.toml`); installed apps are offered an update only when it goes up, so bump it to ship one. Update files are signed. The workflow needs the signing key as the `TAURI_SIGNING_PRIVATE_KEY` repository secret (and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` if the key has one). The public key is in `tauri.conf.json`.

## Files and settings

Project files open in the encoding they're in: UTF-8, UTF-16 (from its byte-order mark), or, for other text, the encoding set in Settings (Windows 1252 to start with). The status bar shows a file's encoding; pick one there to reopen the file in it or save it in it. TIde reads over 25 encodings and saves all but the multi-byte East Asian ones. A binary file opens in a tab that says so, with a hex preview and an option to open it as text anyway.

TI files (`.8xp`, `.8xv`, `.8xg`, `.8ek`, `.b84` and the rest) open as a summary: the comment, each variable's name, type, size, archive flag and version, and whether the checksum is valid. Programs show their TI-BASIC, with **Open as program** to copy one into your programs; Flash apps and OS files show their header, and bundles list their contents. **Send to calculator** sends the file.

**Settings** (the gear at the bottom of the activity bar, or `Ctrl+,`) covers the editor (font size, tab size, word wrap, minimap, whitespace), TI-BASIC (calculator, gutter, screen-width ruler), the encoding for other text, the calculator console and `clibs.8xg`, source control and update checks.

## Project file

A folder can have `.tide/tide.json` (**Settings → Project** creates one) with `calculator`, `build` (a command line instead of `make`), `prerun` (steps after building and before sending), `postrun` (steps after the program starts), `send` (files to send, such as `bin/*.8xp`), `program` (what to start), `libraries`, `runIn` (`calculator` or `cemu`), `scripts` (named command lines in the status bar's Scripts menu) and `editor` (settings for this project). Steps are command lines or calculator macros, such as `["app.open(AsmHook2)", "key.press(enter)"]`: `key.press(key)`, `key.type("TEXT")`, `program.run(NAME)` (or `program.open`), `app.open(NAME)` and `wait(ms)`. Comments are allowed, and the editor completes and checks it. Build, prerun and script output goes to the Output tab.

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
| `Ctrl+N` | Find or create a program |
| `Ctrl+Shift+O` | Open a folder |
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

- [CEmu](https://github.com/CE-Programming/CEmu) by the CE Programming team: its core runs the calculator panel, downloaded on first use.
