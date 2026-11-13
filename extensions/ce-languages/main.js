// @ts-check
// CE Languages: turns on TIde's own IntelliSense for the TI-84 Plus CE's languages. The snippets and
// the rest are in extension.json. Uninstalling this extension turns all of it off.

/** @param {Tide} tide */
export function activate(tide) {
  for (const language of ["tibasic", "c", "ez80", "python"]) tide.languages.builtIn(language);
}
