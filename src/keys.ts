// Shortcut keys across platforms. TIde's shortcuts are written as on Windows and Linux ("Ctrl+E");
// on macOS they use Cmd, and the menus and tooltips show them the Mac way (⇧⌘E).

export const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** Whether a key event holds the shortcut modifier: Cmd on macOS, Ctrl elsewhere. */
export const mod = (e: KeyboardEvent | MouseEvent) => (isMac ? e.metaKey : e.ctrlKey);

// Keys that keep Ctrl on macOS, where Cmd with them belongs to the system or the editor differs:
// Cmd+` switches windows, and the editor's suggestions and Go to line are Ctrl+Space and Ctrl+G there.
const KEEPS_CTRL = new Set(["`", "Space", "G"]);
// The Mac's own keys for these: Cmd+Y isn't Redo there, and Cmd+H hides the app.
const MAC_KEYS: Record<string, string> = { "Ctrl+Y": "⇧⌘Z", "Ctrl+H": "⌥⌘F" };

/** Text with its shortcuts ("Ctrl+Shift+E") as this platform writes them: unchanged except on macOS. */
export function keys(text: string): string;
export function keys(text: string | undefined): string | undefined;
export function keys(text: string | undefined) {
  if (!isMac || !text) return text;
  return text.replace(/Ctrl\+(Alt\+)?(Shift\+)?(Space|Enter|F\d+|.)/g, (all, alt, shift, key: string) => {
    if (MAC_KEYS[all]) return MAC_KEYS[all];
    const ctrl = KEEPS_CTRL.has(key);
    return `${ctrl ? "⌃" : ""}${alt ? "⌥" : ""}${shift ? "⇧" : ""}${ctrl ? "" : "⌘"}${key === "Enter" ? "↩" : key}`;
  });
}
