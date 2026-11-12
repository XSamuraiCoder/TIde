## Unreleased

- **File menu:** File ▾ in the Explorer for new programs, files and folders, opening folders, saving, building, running and settings. The Explorer has New file and New folder buttons.
- **Right-click menus:** for programs, Explorer files and folders (with New file and New folder, including on the project folder), tabs, the editor (including docs for the word under the mouse) and the calculator screen (including copying a screenshot).
- **Project file:** `.tide/tide.json` sets a folder's build command, prerun and postrun steps (command lines or calculator macros like `key.press(enter)` and `app.open(Name)`), the files Run sends and the program it starts, libraries, the calculator, editor settings, and scripts you run from the status bar. The editor completes and checks it, and output goes to a new Output tab.
- **Settings:** a Settings tab (the gear at the bottom of the activity bar, or `Ctrl+,`) for the editor, TI-BASIC, file encodings, the calculator, source control and updates.
- **Encodings:** files open in UTF-8, UTF-16 or over 20 other encodings, and save back in the same one. Pick an encoding in the status bar to reopen or save a file in it. Binary files open in a tab that says the encoding isn't supported.
- **TI files:** opening a `.8xp`, `.8xg`, `.8ek`, bundle or other TI file shows its details: variables, types, sizes, archive flags and checksum. Programs show their TI-BASIC and can be opened as a program.

## TIde 1.2.1

- **Calculator:** fills the editor area, with the screen and keypad the same size, a sharper screen at any size, and roomier keys. Typing uses CEmu's key bindings.
- **Send any TI file:** **Send files…** or drop files on the calculator: programs, appvars, lists, matrices, groups, images, apps (`.8ek`), OS files and bundles (`.b84`, `.b83`).
- **Console:** shows CEmu's output, including `dbg_printf` from C programs, and each step of sending and running.
- **C projects:** Run sends the CE C libraries (`clibs.8xg`) first when TIde finds them in the project or the toolchain folder.
- **Fixed:** groups (`.8xg`) were reported as sent when the calculator had refused them. TIde now waits for each transfer to really finish, shows progress, reports refusals, and sends groups to archive as the calculator requires.
