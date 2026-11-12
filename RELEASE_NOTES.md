## TIde 1.3.0

- **File menu:** File ▾ in the Explorer for new programs, files and folders, opening folders, saving, building, running and settings. The Explorer has New file and New folder buttons.
- **Right-click menus:** for programs, Explorer files and folders (with New file and New folder, including on the project folder), tabs, the editor (including docs for the word under the mouse) and the calculator screen (including copying a screenshot).
- **Project file:** `.tide/tide.json` sets a folder's build command, prerun and postrun steps (command lines or calculator macros like `key.press(enter)` and `app.open(Name)`), the files Run sends and the program it starts, libraries, the calculator, editor settings, and scripts you run from the status bar. The editor completes and checks it, and output goes to a new Output tab.
- **Settings:** a Settings tab (the gear at the bottom of the activity bar, or `Ctrl+,`) for the editor, TI-BASIC, file encodings, the calculator, source control and updates.
- **Encodings:** files open in UTF-8, UTF-16 or over 20 other encodings, and save back in the same one. Pick an encoding in the status bar to reopen or save a file in it. Binary files open in a tab that says the encoding isn't supported.
- **TI files:** opening a `.8xp`, `.8xg`, `.8ek`, bundle or other TI file shows its details: variables, types, sizes, archive flags and checksum. Programs show their TI-BASIC and can be opened as a program.
- **New and delete:** New file and New folder type the name right in the tree, and a path like `gfx/x.c` makes the folders too. Delete moves to the Recycle Bin; hold Shift for Delete permanently (or show both, in Settings).
