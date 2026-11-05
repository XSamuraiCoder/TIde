import { make8xp } from "./build";
import { fs } from "./store";

/**
 * Turns tokenized program bytes into a .8xp file.
 * Desktop: save dialog, then written to disk. Returns the path, or null if cancelled.
 * Browser: a plain download. Returns the file name.
 */
export async function exportProgram(name: string, tokens: number[], previous?: string): Promise<string | null> {
  const bytes = make8xp(name, tokens);

  if (!fs.available) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    link.download = `${name}.8xp`;
    link.click();
    URL.revokeObjectURL(link.href);
    return `${name}.8xp`;
  }

  // Rebuild: the path was picked before, so overwrite it in place.
  if (previous) {
    await fs.writeBinary(previous, bytes);
    return previous;
  }

  const path = await fs.pickSaveFile(`${name}.8xp`);
  if (!path) return null;
  await fs.writeBinary(path, bytes);
  return path;
}