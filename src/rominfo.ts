// Which calculator a ROM is from, and its OS version, for the calculator images popup, so it can
// say "TI-84 Plus, OS 2.55MP" before the ROM is ever started. It looks at the ROM's bytes as
// Wabbitemu does when it loads one (FindRomVersion, in its utilities/var.c); TilEm, which runs the
// ROM, then names the model itself, and the menu takes its name.
//   - The model comes from the size, then text only some models have: a 128 KB ROM with CATALOG
//     in it is a TI-85, not a TI-82; a 256 KB one with "Already Installed" is a TI-86, not a TI-83;
//     a 512 KB one with "GRAPH  EXPLORER  SOFTWARE" is a TI-73, not a TI-83 Plus.
//   - The version: on the TI-73 and the TI-83 Plus and 84 Plus families, at 0x64; on the TI-82
//     and 83, ten bytes after "Self Test?"; on the TI-85 and 86, the first digits after it. A TI-83
//     Plus SE whose version starts above 1 is a TI-84 Plus SE.
// Wabbitemu leaves the TI-81 to the file it came in; a bare 32 KB ROM is taken as one here.

export interface RomInfo { model: string; version: string }

const KB = 1024;
const SELF_TEST = "Self Test?", CATALOG = "CATALOG", TXT73 = "GRAPH  EXPLORER  SOFTWARE", TXT86 = "Already Installed";

/** Where `text` first is in `rom` (ignoring case, as Wabbitemu's CmpStringCase does), or -1. */
function find(rom: Uint8Array, text: string, from = 0): number {
  const want = [...text.toLowerCase()].map(c => c.charCodeAt(0));
  const last = rom.length - want.length - 10;
  outer: for (let i = from; i < last; i++) {
    for (let j = 0; j < want.length; j++) {
      let b = rom[i + j];
      if (b >= 0x41 && b <= 0x5a) b += 0x20;
      if (b !== want[j]) continue outer;
    }
    return i;
  }
  return -1;
}

/** Up to 31 bytes from `at` as text: stops at a NUL (and, for the TI-85 and 86, a space). */
function text(rom: Uint8Array, at: number, spaceEnds = false): string {
  let out = "";
  for (let b = 0; b < 31 && at + b < rom.length; b++) {
    const c = rom[at + b];
    if (c === 0 || (spaceEnds && c === 0x20)) break;
    out += c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : "";
  }
  return out.trim() || "?";
}

/** The version on a TI-85 or 86: the first digits after "Self Test?". */
function digitsAfterSelfTest(rom: Uint8Array): string {
  let i = find(rom, SELF_TEST);
  if (i < 0) i = 0;
  for (; i < rom.length - 40; i++) if (rom[i] >= 0x30 && rom[i] <= 0x39) return text(rom, i, true);
  return "?";
}

/** The calculator and OS a ROM dump is from, or null if it isn't a ROM size these calculators have. */
export function identifyRom(rom: Uint8Array): RomInfo | null {
  const size = rom.length;
  if (size === 32 * KB) return { model: "TI-81", version: rom[0] === 0xc3 ? "1.1K" : rom[1] === 0x17 ? "2.0V" : rom[5] === 0x09 ? "1.6K" : "1.8K" };
  if (size === 128 * KB) {
    if (find(rom, CATALOG) >= 0) return { model: "TI-85", version: digitsAfterSelfTest(rom) };
    const at = find(rom, SELF_TEST);
    return { model: "TI-82", version: at >= 0 && at + 64 < size ? text(rom, at + 10) : "?" };
  }
  if (size === 256 * KB) {
    if (find(rom, TXT86) >= 0) return { model: "TI-86", version: digitsAfterSelfTest(rom) };
    const at = find(rom, SELF_TEST);
    return { model: "TI-83", version: at >= 0 && at + 64 < size ? text(rom, at + 10) : "?" };
  }
  const version = size > 0x64 ? text(rom, 0x64) : "?";
  if (size >= 510 * KB && size <= 590 * KB) return { model: find(rom, TXT73) >= 0 ? "TI-73" : "TI-83 Plus", version };
  if (size >= 1016 * KB && size <= 1030 * KB) return { model: "TI-84 Plus", version };
  if (size >= 2044 * KB && size <= 2260 * KB) return { model: version.charAt(0) > "1" ? "TI-84 Plus SE" : "TI-83 Plus SE", version };
  return null;
}

// ── The TI-84 Plus CE family ──
// CEmu runs three calculators from one kind of 4 MB ROM: the TI-84 Plus CE, the TI-83 Premium CE
// (France) and the TI-82 Advanced Edition Python. It tells them apart as it loads a ROM (core/emu.c):
// the certificate at 0x20000 or 0x30000 is a 0x800F field holding, in order, 0x8012 (the model:
// 0x13 the 83/84 CE, 0x15 the 82 AEP), 0x8021, 0x8032, 0x80A1 and 0x80C2 (its second byte the
// device: 0 the 84 Plus CE, 1 the 83 Premium CE). The boot code's version (core/bootver.c) is read
// from the routines that three jumps at 0x80, 0x8C and 0x90 go to.

/** A certificate field at `at`: its big-endian id and its contents, or null (core/cert.c). */
function certField(rom: Uint8Array, at: number, end: number): { id: number; start: number; size: number } | null {
  if (end - at < 2) return null;
  const id = (rom[at] << 8) | rom[at + 1];
  if (id === 0xffff) return null;
  const extra = { 0xd: 1, 0xe: 2, 0xf: 4 }[id & 0xf] ?? 0;
  if (end - at < 2 + extra) return null;
  const size = extra === 1 ? rom[at + 2]
    : extra === 2 ? (rom[at + 2] << 8) | rom[at + 3]
    : extra === 4 ? ((rom[at + 2] << 24) | (rom[at + 3] << 16) | (rom[at + 4] << 8) | rom[at + 5]) >>> 0
    : id & 0xf;
  const start = at + 2 + extra;
  return size > end - start ? null : { id, start, size };
}

/** The model the CE ROM's certificate names, as CEmu reads it; null when it names none. */
function ceModel(rom: Uint8Array): string | null {
  for (const offset of [0x20000, 0x30000]) {
    const outer = certField(rom, offset, rom.length);
    if (!outer) return null;
    if (outer.id !== 0x800f) continue;
    const end = outer.start + outer.size;
    const fields: { id: number; start: number; size: number }[] = [];
    for (let at = outer.start; fields.length < 5;) {
      const f = certField(rom, at, end);
      if (!f) return null;
      fields.push(f);
      at = f.start + f.size;
    }
    const ids = fields.map(f => f.id);
    if (ids.join() !== [0x8012, 0x8021, 0x8032, 0x80a1, 0x80c2].join()) return null;
    const model = rom[fields[0].start], device = rom[fields[4].start + 1];
    if (model === 0x15 && device <= 1) return "TI-82 Advanced Edition Python";
    if (model === 0x13 && device === 0) return "TI-84 Plus CE";
    if (model === 0x13 && device === 1) return "TI-83 Premium CE";
    return null;
  }
  return null;
}

/** The boot code's version, as "5.3.6.0014", or null. */
function bootVersion(rom: Uint8Array): string | null {
  const BOOT = 0x20000;
  const jump = (entry: number) => entry + 4 < BOOT && rom[entry] === 0xc3 ? rom[entry + 1] | (rom[entry + 2] << 8) | (rom[entry + 3] << 16) : -1;
  const ver16 = (a: number) => a >= 0 && a + 5 < BOOT && rom[a] === 0x3e && rom[a + 2] === 0x06 && rom[a + 4] === 0xc9 ? (rom[a + 1] << 8) | rom[a + 3] : -1;
  const ver8 = (a: number) => a >= 0 && a + 3 < BOOT && rom[a] === 0x3e && rom[a + 2] === 0xc9 ? rom[a + 1] : -1;
  const majorMinor = ver16(jump(0x80)), revision = ver8(jump(0x8c)), build = ver16(jump(0x90));
  if (majorMinor < 0 || revision < 0 || build < 0) return null;
  return `${majorMinor >> 8}.${majorMinor & 0xff}.${revision}.${String(build).padStart(4, "0")}`;
}

/** Whether a file this size is a CE ROM (4 MB, with up to 256 bytes over, as CEmu allows). */
export const isCeRomSize = (size: number) => size >= 0x400000 && size <= 0x400100;

/**
 * Which CE-family calculator a 4 MB ROM is from, and its boot code's version. A ROM whose
 * certificate names no model is taken as a TI-84 Plus CE, as CEmu does.
 */
export function identifyCeRom(rom: Uint8Array): RomInfo | null {
  if (!isCeRomSize(rom.length)) return null;
  return { model: ceModel(rom) ?? "TI-84 Plus CE", version: bootVersion(rom) ?? "?" };
}
