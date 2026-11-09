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

## Docs

The **Docs** view in the activity bar lists everything you can use in the active file. Click an entry to open its full page (usage, description and parameters) in the editor area, or press Enter or **+** to insert it at the cursor. Searching and pressing Enter inserts the best match.

- **TI-BASIC:** block templates, every command grouped by topic, and symbols that are hard to type, such as `→` and `≠`
- **C and C++:** snippets and the CE libraries
- **Python:** snippets and the [py2ez80](https://github.com/Voblit/py2ez80) modules
- **eZ80 assembly** (`.asm`, `.s`, `.src`, `.inc`, `.z80`, `.ez80`): snippets, the full instruction set, fasmg directives, and common TI-OS routines and addresses. Assembly files also get highlighting, completions and hover docs.

Press F1 on an entry to open its page, and Esc to close the page.

## Updates

The desktop app checks the `latest` release when it starts. If there is a newer build it offers the update, with the release notes from [RELEASE_NOTES.md](RELEASE_NOTES.md); click the version in the status bar to check at any time. Edit `RELEASE_NOTES.md` before pushing to change what the next release says. The portable exe and the zipped `.app` don't update themselves.

Each build workflow run is versioned `major.minor.<run number>` and its update files are signed. The workflow needs the signing key as the `TAURI_SIGNING_PRIVATE_KEY` repository secret (and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` if the key has one). The public key is in `tauri.conf.json`.

## Shortcuts

Use Cmd instead of Ctrl on macOS.

| Keys | Action |
|---|---|
| `Ctrl+S` | Save |
| `Ctrl+E` | Build |
| `Ctrl+Shift+E` | Build a TI-BASIC program to a new location |
| `Ctrl+J` | Search the docs |
| `Ctrl+Shift+J` | Open or close the docs page |
| `Ctrl+B` | Show or hide the side bar |
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

Claude was used to debug and fix errors in this program.
