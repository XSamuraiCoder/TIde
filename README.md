# Tide

A small desktop IDE for TI-84 calculators, built with Tauri and the Monaco editor. Write TI-BASIC and build real `.8xp` files, or work on CE C and py2ez80 projects.

Installers for Windows, Linux and macOS are published on the `latest` release by the build workflow.

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

## Catalog

The **Catalog** tab lists what you can insert for the active file. Click an entry, or search and press Enter, to add it at the cursor.

- **TI-BASIC:** block templates, commands and symbols that are hard to type, such as `→` and `≠`
- **C and C++:** snippets and the CE libraries
- **Python:** snippets and the [py2ez80](https://github.com/Voblit/py2ez80) modules

## Shortcuts

Use Cmd instead of Ctrl on macOS.

| Keys | Action |
|---|---|
| `Ctrl+S` | Save |
| `Ctrl+E` | Build |
| `Ctrl+Shift+E` | Build a TI-BASIC program to a new location |
| `Ctrl+J` | Open the catalog |
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
