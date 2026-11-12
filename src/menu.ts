// TIde's right-click menus. One menu at a time, drawn in TIde's style, with keyboard support:
// arrows move, Enter or Space picks, Escape or clicking elsewhere closes.

type Action = { label: string; shortcut?: string; run: () => void };
/** A menu item. With `shift`, holding Shift while the menu is open turns it into that other action. */
export type MenuItem = (Action & { disabled?: unknown; shift?: Action }) | "-";

let open: HTMLElement | null = null;
let shiftHeld = false;
let shiftRows: ((on: boolean) => void)[] = [];
// Shift switches items that have a Shift form, live while the menu is open.
const onShift = (e: KeyboardEvent) => {
  if (e.key !== "Shift" || shiftHeld === (e.type === "keydown")) return;
  shiftHeld = e.type === "keydown";
  for (const set of shiftRows) set(shiftHeld);
};
window.addEventListener("keydown", onShift, true);
window.addEventListener("keyup", onShift, true);
window.addEventListener("blur", () => { shiftHeld = false; });
let restoreFocus: HTMLElement | null = null;

export function closeMenu() {
  open?.remove();
  open = null;
  restoreFocus?.focus({ preventScroll: true });
  restoreFocus = null;
}

/** Shows a menu at a point (client coordinates), kept inside the window. */
export function showMenu(x: number, y: number, items: MenuItem[]) {
  closeMenu();
  shiftRows = [];
  const shown = items.filter((item, i, all) => item !== "-" || (i > 0 && all[i - 1] !== "-" && i < all.length - 1));
  if (!shown.length) return;
  restoreFocus = document.activeElement as HTMLElement | null;
  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.setAttribute("role", "menu");
  for (const item of shown) {
    if (item === "-") { menu.append(Object.assign(document.createElement("div"), { className: "sep", role: "separator" })); continue; }
    const row = document.createElement("button");
    row.type = "button";
    row.setAttribute("role", "menuitem");
    row.disabled = !!item.disabled;
    const label = Object.assign(document.createElement("span"), { textContent: item.label });
    const key = Object.assign(document.createElement("kbd"), { textContent: item.shortcut ?? "" });
    row.append(label, key);
    if (item.shift) {
      const alt = item.shift;
      shiftRows.push(on => {
        label.textContent = on ? alt.label : item.label;
        key.textContent = (on ? alt.shortcut : item.shortcut) ?? "";
        row.classList.toggle("shifted", on);
      });
    }
    row.addEventListener("click", e => { closeMenu(); (item.shift && (e.shiftKey || shiftHeld) ? item.shift : item).run(); });
    row.addEventListener("pointerenter", () => row.focus({ preventScroll: true }));
    menu.append(row);
  }
  menu.addEventListener("keydown", e => {
    const rows = [...menu.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
    const at = rows.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      rows[(at + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length]?.focus();
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      closeMenu();
    }
  });
  document.body.append(menu);
  const { width, height } = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(4, Math.min(x, window.innerWidth - width - 4))}px`;
  menu.style.top = `${Math.max(4, Math.min(y, window.innerHeight - height - 4))}px`;
  open = menu;
  for (const set of shiftRows) set(shiftHeld);
  menu.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
}

// Close on any click elsewhere, scroll, resize or when the window loses focus.
window.addEventListener("pointerdown", e => { if (open && !open.contains(e.target as Node)) closeMenu(); }, true);
window.addEventListener("resize", closeMenu);
window.addEventListener("blur", closeMenu);
document.addEventListener("scroll", e => { if (open && !open.contains(e.target as Node)) closeMenu(); }, true);
