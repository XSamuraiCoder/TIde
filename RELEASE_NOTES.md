## TIde 1.2.1

- **Calculator:** fills the editor area, with the screen and keypad the same size, a sharper screen at any size, and roomier keys. Typing uses CEmu's key bindings.
- **Send any TI file:** **Send files…** or drop files on the calculator: programs, appvars, lists, matrices, groups, images, apps (`.8ek`), OS files and bundles (`.b84`, `.b83`).
- **Console:** shows CEmu's output, including `dbg_printf` from C programs, and each step of sending and running.
- **C projects:** Run sends the CE C libraries (`clibs.8xg`) first when TIde finds them in the project or the toolchain folder.
- **Fixed:** groups (`.8xg`) were reported as sent when the calculator had refused them. TIde now waits for each transfer to really finish, shows progress, reports refusals, and sends groups to archive as the calculator requires.
