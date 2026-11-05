// TI-BASIC source -> tokens -> .8xp file. Pure functions, no Monaco or Tauri dependency.
import { TOKEN_TABLE } from "./tokens";

export interface TokenError { line: number; column: number; text: string }
export interface Tokenized { bytes: number[]; errors: TokenError[] }

const fromHex = (hex: string) => hex.match(/../g)!.map(b => parseInt(b, 16));

const TOKENS = new Map<string, number[]>(TOKEN_TABLE.map(([name, hex]) => [name, fromHex(hex)]));
// Commands carry a trailing space in the table ("Disp "); also accept them written without it, as in Disp"HI".
for (const [name, bytes] of [...TOKENS]) {
  const bare = name.trimEnd();
  if (bare !== name && !name.startsWith(" ") && bare.length > 1 && !TOKENS.has(bare)) TOKENS.set(bare, bytes);
}
// Characters the editor and the catalog use that the token sheets spell differently.
TOKENS.set("π", [0xac]);
const LONGEST = Math.max(...[...TOKENS.keys()].map(k => k.length));

/**
 * Greedy longest-match tokenizer. Inside a string literal only single characters are matched, so
 * "RED" or "LEFT" stays letters instead of becoming a color or alignment token.
 */
export function tokenize(source: string): Tokenized {
  const text = source.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
  const bytes: number[] = [];
  const errors: TokenError[] = [];
  let line = 1, lineStart = 0, inString = false;

  for (let i = 0; i < text.length;) {
    let hit: number[] | undefined;
    let length = 1;
    if (inString) {
      length = String.fromCodePoint(text.codePointAt(i)!).length;
      hit = TOKENS.get(text.slice(i, i + length));
    } else {
      for (let n = Math.min(LONGEST, text.length - i); n >= 1; n--) {
        hit = TOKENS.get(text.slice(i, i + n));
        if (hit) { length = n; break; }
      }
    }

    if (!hit) {
      length = String.fromCodePoint(text.codePointAt(i)!).length;
      if (errors.length < 50) errors.push({ line, column: i - lineStart + 1, text: text.slice(i, i + length) });
    } else {
      bytes.push(...hit);
      const matched = text.slice(i, i + length);
      if (matched === '"') inString = !inString;
      else if (matched === "\n" || matched === "→") inString = false;
    }

    if (text[i] === "\n") { line++; lineStart = i + 1; }
    i += length;
  }
  return { bytes, errors };
}

/** A TI-83+ family .8xp file (program, unprotected) holding the given tokens. */
export function make8xp(name: string, tokens: number[], comment = "Created with TIDE"): Uint8Array {
  const u16 = (n: number) => [n & 0xff, (n >> 8) & 0xff];
  const padded = (s: string, size: number) => {
    const out = new Array<number>(size).fill(0);
    for (let i = 0; i < Math.min(s.length, size); i++) out[i] = s.charCodeAt(i) & 0xff;
    return out;
  };

  const data = [...u16(tokens.length), ...tokens];
  const entry = [
    ...u16(13), ...u16(data.length), 0x05, ...padded(name, 8), 0x00, 0x00, ...u16(data.length), ...data,
  ];
  const checksum = entry.reduce((sum, b) => (sum + b) & 0xffff, 0);
  return Uint8Array.from([
    ...padded("**TI83F*", 8), 0x1a, 0x0a, 0x13, ...padded(comment, 42),
    ...u16(entry.length), ...entry, ...u16(checksum),
  ]);
}