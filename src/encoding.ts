// Text encodings for project files. Files are read as bytes and decoded here, so TIde can open
// UTF-16 and legacy single-byte files, and save them back in the encoding they came in.

export interface Encoding { id: string; label: string; bom?: boolean }

/** Encodings TIde can open. Every one decodes; all but the multi-byte East Asian ones can be saved. */
export const ENCODINGS: Encoding[] = [
  { id: "utf-8", label: "UTF-8" },
  { id: "utf-8", label: "UTF-8 with BOM", bom: true },
  { id: "utf-16le", label: "UTF-16 LE", bom: true },
  { id: "utf-16be", label: "UTF-16 BE", bom: true },
  { id: "windows-1252", label: "Western (Windows 1252)" },
  { id: "iso-8859-1", label: "Western (ISO 8859-1)" },
  { id: "iso-8859-15", label: "Western (ISO 8859-15)" },
  { id: "macintosh", label: "Western (Mac Roman)" },
  { id: "ibm866", label: "DOS (CP 866)" },
  { id: "windows-1250", label: "Central European (Windows 1250)" },
  { id: "iso-8859-2", label: "Central European (ISO 8859-2)" },
  { id: "windows-1251", label: "Cyrillic (Windows 1251)" },
  { id: "koi8-r", label: "Cyrillic (KOI8-R)" },
  { id: "iso-8859-5", label: "Cyrillic (ISO 8859-5)" },
  { id: "windows-1253", label: "Greek (Windows 1253)" },
  { id: "iso-8859-7", label: "Greek (ISO 8859-7)" },
  { id: "windows-1254", label: "Turkish (Windows 1254)" },
  { id: "windows-1255", label: "Hebrew (Windows 1255)" },
  { id: "windows-1256", label: "Arabic (Windows 1256)" },
  { id: "windows-1257", label: "Baltic (Windows 1257)" },
  { id: "windows-1258", label: "Vietnamese (Windows 1258)" },
  { id: "windows-874", label: "Thai (Windows 874)" },
  { id: "shift_jis", label: "Japanese (Shift JIS)" },
  { id: "euc-jp", label: "Japanese (EUC-JP)" },
  { id: "gbk", label: "Simplified Chinese (GBK)" },
  { id: "gb18030", label: "Simplified Chinese (GB 18030)" },
  { id: "big5", label: "Traditional Chinese (Big5)" },
  { id: "euc-kr", label: "Korean (EUC-KR)" },
];

export const encodingKey = (e: Encoding) => `${e.id}${e.bom ? "+bom" : ""}`;
export const encodingByKey = (key: string) => ENCODINGS.find(e => encodingKey(e) === key);
const MULTI_BYTE = new Set(["shift_jis", "euc-jp", "gbk", "gb18030", "big5", "euc-kr"]);
export const canSave = (e: Encoding) => !MULTI_BYTE.has(e.id);

/** Lots of NULs or other control bytes: a binary file, not text in some encoding. */
export function looksBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, 8192);
  let control = 0;
  for (const b of sample) {
    if (b === 0) return true;
    if (b < 9 || (b > 13 && b < 32 && b !== 27)) control++;
  }
  return sample.length > 0 && control / sample.length > 0.05;
}

/** Decodes with one encoding, skipping its byte-order mark. Never throws: bad bytes become U+FFFD. */
export function decodeWith(bytes: Uint8Array, e: Encoding): string {
  return new TextDecoder(e.id).decode(bytes); // TextDecoder drops a matching BOM itself
}

/**
 * Picks the encoding for a file: a byte-order mark first, then UTF-8 if every byte is valid, then
 * the fallback for non-UTF-8 text. Binary files come back as null, to open as an unsupported tab.
 */
export function detect(bytes: Uint8Array, fallback: Encoding): { text: string; encoding: Encoding } | null {
  const [a, b, c] = bytes;
  if (a === 0xef && b === 0xbb && c === 0xbf) return { text: decodeWith(bytes, ENCODINGS[1]), encoding: ENCODINGS[1] };
  if (a === 0xff && b === 0xfe) return { text: decodeWith(bytes, ENCODINGS[2]), encoding: ENCODINGS[2] };
  if (a === 0xfe && b === 0xff) return { text: decodeWith(bytes, ENCODINGS[3]), encoding: ENCODINGS[3] };
  if (looksBinary(bytes)) return null;
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), encoding: ENCODINGS[0] };
  } catch {
    return { text: decodeWith(bytes, fallback), encoding: fallback };
  }
}

/** Byte tables for single-byte encodings, built from the browser's own decoder. */
const tables = new Map<string, Map<string, number>>();
function table(id: string): Map<string, number> {
  let t = tables.get(id);
  if (!t) {
    const all = new TextDecoder(id).decode(Uint8Array.from({ length: 256 }, (_, i) => i));
    t = new Map();
    [...all].forEach((ch, i) => { if (ch !== "�" && !t!.has(ch)) t!.set(ch, i); });
    tables.set(id, t);
  }
  return t;
}

/** Encodes text for saving. Throws if the encoding can't be written or a character doesn't fit. */
export function encode(text: string, e: Encoding): Uint8Array {
  if (e.id === "utf-8") {
    const body = new TextEncoder().encode(text);
    if (!e.bom) return body;
    const out = new Uint8Array(body.length + 3);
    out.set([0xef, 0xbb, 0xbf]);
    out.set(body, 3);
    return out;
  }
  if (e.id === "utf-16le" || e.id === "utf-16be") {
    const out = new Uint8Array(2 + text.length * 2);
    const view = new DataView(out.buffer);
    const le = e.id === "utf-16le";
    view.setUint16(0, 0xfeff, le);
    for (let i = 0; i < text.length; i++) view.setUint16(2 + i * 2, text.charCodeAt(i), le);
    return out;
  }
  if (!canSave(e)) throw new Error(`TIde can open ${e.label} but not save it. Save with another encoding.`);
  const map = table(e.id);
  const chars = [...text];
  const out = new Uint8Array(chars.length);
  chars.forEach((ch, i) => {
    const byte = map.get(ch);
    if (byte === undefined) throw new Error(`"${ch}" can't be written in ${e.label}. Save with UTF-8 instead.`);
    out[i] = byte;
  });
  return out;
}
