## TIde 1.2.1

- **Source Control:** a new view in the activity bar (`Ctrl+Shift+G`) for the open folder's git repository. Stage and unstage files, commit (`Ctrl+Enter`), pull and push, or initialize a repository. The status bar shows the branch and how far it is ahead or behind, and the activity bar shows how many files changed.
- **Updates:** the update notice and release notes are part of the main window's layout.
- **Calculator:** a TI-84 Plus CE runs inside TIde, in a panel on the right. **▶ Run** (F5) builds the program or C project, sends it and launches it. The emulator is CEmu's core; TIde downloads it and asks for your own ROM the first time. **Open in CEmu** uses the full CEmu app instead.
- **Calculator:** fills the editor area with a sharper, larger screen and roomier keys. Send any TI file with **Send files…** or by dropping it: apps, appvars, groups, images, bundles and more. Typing uses CEmu's key bindings.
- **C projects:** Run sends the CE C libraries (`clibs.8xg`) first when TIde finds them in the project or the toolchain folder.
- **Calculator console:** shows CEmu's output, including `dbg_printf` from C programs. The screen and keypad are now the same size.
- **Sending files:** TIde waits for each transfer to really finish, shows progress, and reports when the calculator refuses a file. Groups (`.8xg`, like `clibs.8xg`) are sent to archive, which the calculator requires.
