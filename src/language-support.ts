// TIde's own IntelliSense for each language: completions, hover help, signature help, go to label,
// folding, and assembly highlighting. Extensions turn it on with tide.languages.builtIn(id); the
// bundled CE Languages extension does that for all four, so uninstalling it turns them off.
import * as monaco from "monaco-editor/editor/editor.api.js";
import { registerIntellisense } from "./intellisense";
import { registerC } from "./c-support";
import { registerPy2ez80 } from "./py2ez80-support";
import { registerAsm } from "./asm-support";

/** The languages with built-in support, by id. */
export const BUILT_IN_LANGUAGES: Record<string, () => void> = {
  tibasic: registerIntellisense,
  c: registerC,
  ez80: registerAsm,
  python: registerPy2ez80,
};

/**
 * Runs `register` and returns what it registered with Monaco, so it can be undone. The language
 * modules register their providers directly; this collects them without changing those modules.
 */
function collect(register: () => void): monaco.IDisposable[] {
  const languages = monaco.languages as unknown as Record<string, (...args: unknown[]) => monaco.IDisposable>;
  const names = ["registerCompletionItemProvider", "registerHoverProvider", "registerSignatureHelpProvider", "registerDefinitionProvider",
    "registerFoldingRangeProvider", "setMonarchTokensProvider", "setLanguageConfiguration"];
  const originals = names.map(n => languages[n]);
  const got: monaco.IDisposable[] = [];
  names.forEach((n, i) => { languages[n] = (...args) => { const d = originals[i].apply(monaco.languages, args); got.push(d); return d; }; });
  try { register(); } finally { names.forEach((n, i) => { languages[n] = originals[i]; }); }
  return got;
}

/** Turns on TIde's own support for a language. Returns what to dispose to turn it off. */
export function builtInLanguage(id: string): monaco.IDisposable {
  const register = BUILT_IN_LANGUAGES[id];
  if (!register) throw new Error(`TIde has no built-in support for "${id}". It has ${Object.keys(BUILT_IN_LANGUAGES).join(", ")}.`);
  const got = collect(register);
  return { dispose: () => { for (const d of got) d.dispose(); } };
}
