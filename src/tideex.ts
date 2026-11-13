// .TIdeex: one file that holds a TIde extension, to share and install it, as .vsix does for VS Code.
//
// The format is a zip archive:
// - extension.json at the root (the manifest, the same as in an installed extension's folder);
// - the files it uses, such as main.js, in the same layout as the extension's folder;
// - the archive comment "TIdeex 1", the format's version.
// Entries are stored or deflated. Paths use "/", are relative, and never contain "..". Installing
// unpacks it into the extensions folder, under the manifest's "id" or a name made from its "name".

export interface PackedFile { path: string; bytes: Uint8Array }

export const TIDEEX_VERSION = 1;
const COMMENT = `TIdeex ${TIDEEX_VERSION}`;
const MAX_FILES = 1000, MAX_BYTES = 32 * 1024 * 1024;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function through(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream)).arrayBuffer());
}

/** A path that is safe to unpack: relative, "/"-separated, no "." or ".." parts. Null if it isn't. */
export function safePath(path: string): string | null {
  const parts = path.replace(/\\/g, "/").split("/").filter(p => p !== "");
  if (!parts.length || /^[a-z]:$/i.test(parts[0]) || path.startsWith("/")) return null;
  if (parts.some(p => p === "." || p === ".." || /[<>:"|?*\x00-\x1f]/.test(p))) return null;
  return parts.join("/");
}

/** Packs files into a .TIdeex (a zip). Each is deflated unless that makes it bigger. */
export async function packTideex(files: PackedFile[]): Promise<Uint8Array> {
  if (!files.some(f => f.path === "extension.json")) throw new Error("An extension needs an extension.json.");
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [], centrals: Uint8Array[] = [];
  let offset = 0;
  // DOS date and time for the entries: now.
  const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const file of files) {
    const path = safePath(file.path);
    if (!path) throw new Error(`${file.path} can't go in an extension.`);
    const name = enc.encode(path);
    const deflated = await through(file.bytes, new CompressionStream("deflate-raw"));
    const store = deflated.length >= file.bytes.length;
    const data = store ? file.bytes : deflated;
    const crc = crc32(file.bytes);
    const header = (sig: number, central: boolean) => {
      const h = new DataView(new ArrayBuffer(central ? 46 : 30));
      let at = 0;
      const u16 = (v: number) => { h.setUint16(at, v, true); at += 2; };
      const u32 = (v: number) => { h.setUint32(at, v, true); at += 4; };
      u32(sig);
      if (central) u16(20); // made by
      u16(20); u16(0x0800); u16(store ? 0 : 8); u16(time); u16(date); // version, UTF-8 names, method, time, date
      u32(crc); u32(data.length); u32(file.bytes.length); u16(name.length); u16(0);
      if (central) { u16(0); u16(0); u16(0); u32(0); u32(offset); } // comment, disk, attributes, local header
      return new Uint8Array(h.buffer);
    };
    const local = header(0x04034b50, false);
    locals.push(local, name, data);
    centrals.push(header(0x02014b50, true), name);
    offset += local.length + name.length + data.length;
  }
  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const comment = enc.encode(COMMENT);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true); end.setUint16(20, comment.length, true);
  const parts = [...locals, ...centrals, new Uint8Array(end.buffer), comment];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

/**
 * Unpacks a .TIdeex. If every file sits in one top folder (as when a folder was zipped), that folder
 * is taken off. Throws if it isn't a zip, a path is unsafe, a file is damaged, or there's no extension.json.
 */
export async function unpackTideex(bytes: Uint8Array): Promise<PackedFile[]> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error("That isn't a .TIdeex file: it isn't a zip archive.");
  const count = view.getUint16(end + 10, true);
  if (count > MAX_FILES) throw new Error(`It has ${count} files; an extension can have up to ${MAX_FILES}.`);
  let at = view.getUint32(end + 16, true), total = 0;
  const files: PackedFile[] = [];
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== 0x02014b50) throw new Error("The archive's file list is damaged.");
    const method = view.getUint16(at + 10, true), crc = view.getUint32(at + 16, true);
    const packed = view.getUint32(at + 20, true), size = view.getUint32(at + 24, true);
    const nameLen = view.getUint16(at + 28, true), extra = view.getUint16(at + 30, true), comment = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const rawName = dec.decode(bytes.subarray(at + 46, at + 46 + nameLen));
    at += 46 + nameLen + extra + comment;
    if (rawName.endsWith("/")) continue; // a folder entry
    const path = safePath(rawName);
    if (!path) throw new Error(`It has a file at "${rawName}", which isn't allowed.`);
    total += size;
    if (total > MAX_BYTES) throw new Error("It's too large: an extension can be up to 32 MB unpacked.");
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + packed);
    const out = method === 0 ? data.slice() : method === 8 ? await through(data, new DecompressionStream("deflate-raw")) : null;
    if (!out) throw new Error(`${path} uses a compression TIde can't read.`);
    if (out.length !== size || crc32(out) !== crc) throw new Error(`${path} is damaged.`);
    files.push({ path, bytes: out });
  }
  // A zipped folder: take its one top folder off.
  const tops = new Set(files.map(f => f.path.split("/")[0]));
  if (!files.some(f => f.path === "extension.json") && tops.size === 1 && files.every(f => f.path.includes("/"))) {
    const top = [...tops][0].length + 1;
    for (const f of files) f.path = f.path.slice(top);
  }
  if (!files.some(f => f.path === "extension.json")) throw new Error("That isn't a TIde extension: it has no extension.json.");
  return files;
}
