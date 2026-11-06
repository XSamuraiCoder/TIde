// Which calculator TI-BASIC programs are written for. The .8xp format is the same on both;
// the screen and the available tokens differ. No Monaco dependency, so it is easy to test.

export type Target = "ce" | "plus";

export const TARGETS: Record<Target, { label: string; cols: number; rows: number; pixelRows: number; pixelCols: number }> = {
  ce: { label: "CE", cols: 26, rows: 10, pixelRows: 165, pixelCols: 265 },
  plus: { label: "Plus", cols: 16, rows: 8, pixelRows: 63, pixelCols: 95 },
};

const PREF = "tide-pref-target"; // must not start with "tide:" or the browser store lists it as a program
const listeners = new Set<() => void>();

let current: Target = "ce";
try { if (localStorage.getItem(PREF) === "plus") current = "plus"; } catch { /* storage unavailable */ }

export const getTarget = (): Target => current;

export function setTarget(target: Target): void {
  current = target;
  try { localStorage.setItem(PREF, target); } catch { /* storage unavailable */ }
  listeners.forEach(fn => fn());
}

/** Calls `fn` whenever the target changes. Returns a function that stops listening. */
export function onTargetChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// From the TI-Toolkit token sheet (8X.xml): tokens first added on the TI-84 Plus C Silver Edition or CE.
const CE_ONLY_EF: [number, number][] = [[0x41, 0x5b], [0x64, 0x68], [0x6a, 0x6c], [0x73, 0x75], [0x79, 0x7a], [0x81, 0x98], [0x9e, 0xa6]];

/** True for token bytes that a monochrome TI-84 Plus doesn't have. */
export function ceOnly(bytes: number[]): boolean {
  if (bytes.length !== 2) return false;
  const [high, low] = bytes;
  if (high === 0x63) return low === 0x38; // TraceStep
  return high === 0xef && CE_ONLY_EF.some(([from, to]) => low >= from && low <= to);
}
