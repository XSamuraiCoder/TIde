// Reads TI files for the metadata view: variable files (**TI83F*: .8xp, .8xv, .8xg, .8ca…) and Flash
// files (**TIFL**: apps and OS updates). Programs are turned back into TI-BASIC text.
import { TOKEN_TABLE } from "./tokens";

export interface TiVar {
  type: number; typeName: string; name: string; version: number | null; archived: boolean | null; size: number;
  data: Uint8Array;
  /** TI-BASIC text for programs; null for native (C/assembly) programs and other types. */
  source: string | null;
  native: boolean;
}
export type TiFileInfo =
  | { kind: "vars"; signature: string; comment: string; vars: TiVar[]; checksumOk: boolean }
  | { kind: "flash"; signature: string; name: string; version: string; device: string; type: string; date: string; size: number };

const TYPES: Record<number, string> = {
  0x00: "Real number", 0x01: "List", 0x02: "Matrix", 0x03: "Equation", 0x04: "String", 0x05: "Program",
  0x06: "Protected program", 0x07: "Picture", 0x08: "Graph database", 0x0b: "Equation", 0x0c: "Complex number",
  0x0d: "Complex list", 0x0f: "Window settings", 0x10: "Saved window", 0x11: "Table settings", 0x13: "Backup",
  0x14: "Flash app", 0x15: "AppVar", 0x16: "Temporary program", 0x17: "Group", 0x18: "Fraction", 0x1a: "Image",
  0x1b: "Exact complex fraction", 0x1c: "Exact radical", 0x1d: "Exact complex radical", 0x1e: "Exact complex π",
  0x1f: "Exact complex π fraction", 0x20: "Exact π", 0x21: "Exact π fraction", 0x23: "Operating system",
  0x24: "Flash app", 0x25: "Certificate",
};
const DEVICES: Record<number, string> = { 0x73: "TI-83 Plus / TI-84 Plus", 0x13: "TI-84 Plus CE", 0x74: "TI-73", 0x98: "TI-89" };
const FLASH_TYPES: Record<number, string> = { 0x23: "Operating system", 0x24: "Flash app", 0x25: "Certificate", 0x3e: "License" };

// Detokenizing: the first name in the token sheet for each byte sequence.
const BY_BYTES = new Map<string, string>();
for (const [name, hex] of TOKEN_TABLE) if (!BY_BYTES.has(hex)) BY_BYTES.set(hex, name);
const PREFIX = new Set([0x5c, 0x5d, 0x5e, 0x60, 0x61, 0x62, 0x63, 0x7e, 0xaa, 0xbb, 0xef]);
const hex2 = (n: number) => n.toString(16).padStart(2, "0");

export function detokenize(tokens: Uint8Array): string {
  let out = "";
  for (let i = 0; i < tokens.length;) {
    const two = i + 1 < tokens.length && PREFIX.has(tokens[i]) ? BY_BYTES.get(hex2(tokens[i]) + hex2(tokens[i + 1])) : undefined;
    if (two !== undefined) { out += two; i += 2; continue; }
    const one = BY_BYTES.get(hex2(tokens[i]));
    out += one ?? `[${hex2(tokens[i]).toUpperCase()}]`;
    i++;
  }
  return out;
}

/** The calculator's name for a variable: L1, [A], Str1, Pic1, Image1, or the letters of its name. */
function varName(raw: Uint8Array, type: number): string {
  const [a, b] = raw;
  const digit = (n: number) => String((n + 1) % 10);
  if ((type === 0x01 || type === 0x0d) && a === 0x5d) return b <= 5 ? `L${b + 1}` : "⌊" + ascii(raw.subarray(1));
  if (type === 0x02 && a === 0x5c) return `[${String.fromCharCode(65 + b)}]`;
  if (type === 0x04 && a === 0xaa) return `Str${digit(b)}`;
  if (type === 0x07 && a === 0x60) return `Pic${digit(b)}`;
  if (type === 0x08 && a === 0x61) return `GDB${digit(b)}`;
  if (type === 0x1a && a === 0x3c) return `Image${digit(b)}`;
  if ((type === 0x03 || type === 0x0b) && a === 0x5e) return BY_BYTES.get(hex2(a) + hex2(b)) ?? "Equation";
  return ascii(raw);
}
const ascii = (raw: Uint8Array) => [...raw].filter(c => c !== 0).map(c => (c === 0x5b ? "θ" : c >= 32 && c < 127 ? String.fromCharCode(c) : `\\x${hex2(c)}`)).join("");

const text = (bytes: Uint8Array) => String.fromCharCode(...bytes).replace(/\0.*$/s, "").trim();

export function parseTiFile(bytes: Uint8Array): TiFileInfo {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const signature = text(bytes.subarray(0, 8));
  if (signature === "**TIFL**") {
    const bcd = (n: number) => (n >> 4) * 10 + (n & 15);
    const nameLen = bytes[16];
    return {
      kind: "flash", signature,
      name: text(bytes.subarray(17, 17 + Math.min(nameLen, 8))),
      version: `${bcd(bytes[8])}.${bcd(bytes[9])}`,
      date: `${bcd(bytes[14])}${bcd(bytes[15]).toString().padStart(2, "0")}-${String(bcd(bytes[13])).padStart(2, "0")}-${String(bcd(bytes[12])).padStart(2, "0")}`,
      device: DEVICES[bytes[48]] ?? `Device 0x${hex2(bytes[48])}`,
      type: FLASH_TYPES[bytes[49]] ?? `Type 0x${hex2(bytes[49])}`,
      size: bytes.length >= 78 ? view.getUint32(74, true) : 0,
    };
  }
  if (!signature.startsWith("**TI8") || bytes.length < 57) throw new Error("This isn't a TI variable or Flash file.");
  const comment = text(bytes.subarray(11, 53));
  const end = bytes.length - 2;
  const vars: TiVar[] = [];
  for (let at = 55; at + 15 <= end;) {
    const headerLen = view.getUint16(at, true), size = view.getUint16(at + 2, true);
    const type = bytes[at + 4];
    const name = varName(bytes.subarray(at + 5, at + 13), type);
    const long = headerLen >= 13;
    const version = long ? bytes[at + 13] : null, archived = long ? (bytes[at + 14] & 0x80) !== 0 : null;
    const dataAt = at + 2 + headerLen + 2;
    const data = bytes.subarray(dataAt, Math.min(dataAt + size, end));
    let source: string | null = null, native = false;
    if ((type === 0x05 || type === 0x06) && data.length >= 2) {
      const tokens = data.subarray(2, 2 + view.getUint16(dataAt, true));
      native = (tokens[0] === 0xef && tokens[1] === 0x7b) || (tokens[0] === 0xbb && tokens[1] === 0x6d);
      if (!native) source = detokenize(tokens);
    }
    vars.push({ type, typeName: TYPES[type] ?? `Type 0x${hex2(type)}`, name, version, archived, size, data, source, native });
    at = dataAt + size;
  }
  let sum = 0;
  for (let i = 55; i < end; i++) sum = (sum + bytes[i]) & 0xffff;
  return { kind: "vars", signature, comment, vars, checksumOk: sum === view.getUint16(end, true) };
}

/** A few lines of hex for data that isn't text. */
export function hexDump(data: Uint8Array, max = 256): string {
  const lines: string[] = [];
  for (let i = 0; i < Math.min(data.length, max); i += 16) {
    const row = data.subarray(i, Math.min(i + 16, data.length));
    const hex = [...row].map(hex2).join(" ").padEnd(47);
    const chars = [...row].map(c => (c >= 32 && c < 127 ? String.fromCharCode(c) : ".")).join("");
    lines.push(`${i.toString(16).padStart(6, "0")}  ${hex}  ${chars}`);
  }
  if (data.length > max) lines.push(`… ${(data.length - max).toLocaleString()} more bytes`);
  return lines.join("\n");
}
