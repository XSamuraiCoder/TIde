Extension development guide
===========================

This guide covers only TIde extensions: add-ons that contribute language support, themes, and
editor or calculator tools. An extension can use a manifest for static editor features and optional JavaScript
for behavior that needs code.

Create a project
----------------

In the desktop app, open the Extensions view with :kbd:`Ctrl+Shift+X` and choose
**More → New extension**. TIde creates an extension folder with ``extension.json`` and a ``main.js``
starter. You can also create those files in the extensions folder, opened with **More → Open
extensions folder**. Saving an extension file reloads extensions.

An extension is a folder. Keep every file it needs inside that folder so exporting it includes the
whole project:

.. code-block:: text

   my-extension/
   ├── extension.json
   ├── main.js          # optional
   └── data/
       └── commands.json

``main.js`` is optional for manifest-only extensions. Use ``tide.files.read("data/commands.json")``
to read a bundled text file relative to the extension folder.

The extension folder is the project root. A minimal extension needs a manifest:

.. code-block:: json

   {
     "name": "My TI-BASIC helpers",
     "id": "yourname.tibasic-helpers",
     "version": "1.0.0",
     "description": "Snippets and editor help for TI-BASIC.",
     "author": "Your name",
     "contributes": {
       "snippets": [
         {
           "language": "tibasic",
           "prefix": "hello",
           "body": ["Disp \"${1:HELLO}\"", "$0"],
           "description": "Display a greeting"
         }
       ],
       "completions": [
         {
           "language": "tibasic",
           "label": "greeting",
           "insertText": "Disp \"HELLO\"",
           "documentation": "Display a greeting."
         }
       ],
       "hovers": [
         {
           "language": "tibasic",
           "word": "greeting",
           "contents": "Displays a greeting."
         }
       ]
     }
   }

The ``id`` is 1–64 characters, starts with a lowercase letter or digit, and uses lowercase letters,
digits, periods, and hyphens. Without one, TIde makes it from the ``name`` in lower case. Keep it
stable: TIde uses it as the installed folder's name and to replace the extension when a user
installs an update. The manifest may have ``//`` comments, as ``tide.json`` can, and is checked as
you edit it; hover fields in the editor for schema help.

Contribute editor features
--------------------------

The ``contributes`` object supports five kinds of static contributions:

* **Snippets** have ``language``, ``prefix``, and ``body`` fields. ``body`` can be a string or an
  array of lines and uses Monaco snippet syntax: ``${1:name}`` creates an editable placeholder and
  ``$0`` marks the final cursor position. Use :kbd:`Ctrl+Space` in the editor to find a snippet.
* **Completions** have ``language`` and ``label`` fields, plus optional ``insertText``, ``detail``,
  ``documentation``, and ``kind``. If ``insertText`` contains ``$`` snippet markers, TIde inserts it
  using Monaco snippet syntax. Valid ``kind`` values are ``function``, ``keyword``, ``variable``,
  ``constant``, ``snippet``, ``type``, ``module``, and ``text``.
* **Hovers** have ``language``, ``word``, and ``contents`` fields. ``contents`` accepts plain text or
  Markdown.
* **Languages** register an ``id`` and can include ``name``, ``extensions``, ``filenames``,
  ``comments``, ``brackets``, and a ``monarch`` tokenizer. Tokenizer rules use
  `Monaco Monarch syntax <https://microsoft.github.io/monaco-editor/monarch.html>`_.
* **Themes** have ``id``, ``name``, and ``base`` fields, plus optional ``colors`` and ``syntax``.
  See :ref:`themes`.

The ``language`` value is the editor's (Monaco's) language ID for the file. TIde's are:

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - ID
     - Files
   * - ``tibasic``
     - TI-BASIC programs.
   * - ``c``, ``cpp``
     - C and C++, for the CE and the Nspire (Ndless).
   * - ``ez80``
     - Assembly: ``.asm``, ``.s``, ``.src``, ``.inc``, ``.ez80``.
   * - ``z80``
     - z80 assembly for the TI-83 Plus and 84 Plus: ``.z80`` files, and the assembly files above in a
       project whose ``tide.json`` language is ``z80``. The built-in *Plus Languages* extension adds
       it.
   * - ``tipython``
     - ``.py`` files: TI-Python.
   * - ``python``
     - ``.py`` files in a project whose ``tide.json`` language is ``py2ez80``. (``py2ez80`` is the
       ``tide.json`` name, not an editor ID.)
   * - ``lua``
     - Nspire Lua.
   * - ``json``, ``markdown``, ``makefile``, ``plaintext``
     - ``tide.json`` and other JSON, Markdown, makefiles, and anything else.

When you contribute a new language, use its ID for that extension's snippets, completions, hovers,
and JavaScript providers. Choose a unique ID for a new language; when adding features to an existing
language, contribute under its ID without adding a new ``languages`` entry. ``tide.editor.file()``
gives the open file's ID, which is a quick way to check one.

Prefer a manifest contribution when its fixed data is enough. Use JavaScript when suggestions or
diagnostics depend on the current text, project files, or settings. A manifest-only extension is
simpler to review and does not run JavaScript.

Here is a minimal language contribution for ``.foo`` files:

.. code-block:: json

   {
     "name": "Foo language",
     "contributes": {
       "languages": [
         {
           "id": "foo",
           "name": "Foo",
           "extensions": [".foo"],
           "comments": {"lineComment": "#"},
           "brackets": [["{", "}"], ["(", ")"]],
           "monarch": {
             "tokenizer": {
               "root": [
                 ["#.*$", "comment"],
                 ["\\b[0-9]+\\b", "number"],
                 ["[a-zA-Z_][\\w]*", "identifier"]
               ]
             }
           }
         }
       ]
     }
   }

For working examples, inspect the built-in extensions (*CE Languages*, *Plus Languages*, and
*Nspire*) in the `TIde source <https://github.com/XSamuraiCoder/TIde/tree/main/extensions>`_.
*Nspire* shows commands with ``when``, ``tide.run``, and ``tide.calculator.send``.

.. _themes:

Add a theme
-----------

A theme recolors TIde: the window, the editor's syntax, and the terminal. It appears in
**Settings → Theme** with your extension's name after it, and a project's ``tide.json`` can choose it
with ``"editor": { "theme": "<id>" }``.

.. code-block:: json

   {
     "name": "Sunset",
     "contributes": {
       "themes": [
         {
           "id": "sunset",
           "name": "Sunset",
           "base": "dark",
           "colors": {
             "navy": "#1a0f1f",
             "panel": "#22142a",
             "paper": "#2a1833",
             "ink": "#f6e7f0",
             "muted": "#b39ab8",
             "rule": "#3e2649",
             "key": "#ff9e64",
             "key-wash": "#4a2a2a"
           },
           "syntax": {
             "comment": "#9b84a3",
             "string": "#c3e88d",
             "keyword": "#ff9e64",
             "function": "#7dcfff"
           }
         }
       ]
     }
   }

``id``
   What the theme setting stores: letters, digits, ``.``, ``-`` and ``_``. It can't be one TIde's
   themes already use (``dark``, ``light``, ``dark-modern``, ``light-modern``, ``monokai``,
   ``high-contrast-dark``, ``high-contrast-light``, ``graphite``, ``lcd``) or another
   extension's.

``name``
   What Settings shows.

``base``
   ``"dark"`` or ``"light"``. Everything the theme doesn't set comes from TIde Dark or TIde Light,
   and TIde's light-mode details (such as the calculator panel's) follow a ``"light"`` base.

``colors``
   The window's colors, as ``#rrggbb``. Each is one of TIde's color tokens:

   .. list-table::
      :header-rows: 1
      :widths: 30 70

      * - Token
        - Colors
      * - ``navy``
        - The activity bar.
      * - ``panel``
        - The side bar, tabs, and popups.
      * - ``paper``
        - The editor and pages, and the terminal's background.
      * - ``body``
        - What's under the pointer.
      * - ``lcd``
        - Code blocks and fields.
      * - ``ink``
        - Text.
      * - ``muted``
        - Quieter text: hints, line numbers.
      * - ``rule``
        - Lines and borders.
      * - ``key``
        - What you can press, the cursor, and links.
      * - ``key-wash``
        - The chosen item in a list.
      * - ``warn``, ``danger``, ``ok``
        - Warnings, errors, and success.
      * - ``scroll``
        - Scroll bars.
      * - ``wave-top``, ``wave-mid``, ``wave-bot``, ``wave-end``
        - TIde's waves: the status bar's gradient and the open view's mark.
      * - ``ansi-0`` to ``ansi-15``
        - The terminal's and Output's 16 colors.
      * - ``git-m``, ``git-a``, ``git-r``, ``git-u``
        - Source Control's modified, added, renamed, and untracked files.

``syntax``
   The editor's colors, as ``#rrggbb``: ``text``, ``comment``, ``string``, ``number``, ``operator``,
   ``keyword``, ``io`` (TI-BASIC's input and output commands, and assembly directives), ``function``
   (functions and built-in names), ``type`` (types, such as C's ``int``; the ``function`` color if
   it isn't set), ``variable`` (variables and other names; the ``text`` color if it isn't set), and
   ``delimiter``. Any role you leave out is your ``base`` theme's.

A color that isn't ``#rrggbb`` or ``#rgb``, or a token TIde doesn't have, is left out. A theme TIde
can't add at all (no ``id``, say) is left out too, and the Extensions view says why. Check that text
reads on your ``paper``: aim for a contrast of 4.5:1 for text and code, and 3:1 for ``muted`` and
comments.

Add dynamic completions
-----------------------

Register a Monaco provider from ``activate`` when completion items depend on the current document.
The provider receives the model and cursor position and returns a ``suggestions`` array:

.. code-block:: javascript

   tide.languages.completions("tibasic", {
     triggerCharacters: ["@"],
     provideCompletionItems(model, position) {
       const word = model.getWordUntilPosition(position);
       const range = {
         startLineNumber: position.lineNumber,
         endLineNumber: position.lineNumber,
         startColumn: word.startColumn,
         endColumn: word.endColumn
       };
       return {
         suggestions: [{
           label: "projectName",
           detail: "Current project name",
           insertText: "${1:MyProject}",
           kind: tide.monaco.languages.CompletionItemKind.Variable,
           insertTextRules:
             tide.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
           range
         }]
       };
     }
   });

Providers follow Monaco's completion, hover, and signature-help interfaces. Register custom
providers with ``tide.languages.completions``, ``hover``, or ``signatureHelp``; TIde disposes them
when the extension is turned off or reloaded. Use ``triggerCharacters`` to request suggestions
after a character such as ``@`` or ``.``.

Add hover help and diagnostics
------------------------------

A hover provider returns Markdown for a word. A checker can use Monaco markers to underline a
problem and report it in the editor:

.. code-block:: javascript

   tide.languages.hover("foo", {
     provideHover(model, position) {
       const word = model.getWordAtPosition(position);
       if (word?.word !== "TODO") return null;
       return { contents: [{ value: "**TODO**: finish this section." }] };
     }
   });

   function checkLine(model, lineNumber) {
     const text = model.getLineContent(lineNumber);
     const column = text.indexOf("BAD");
     tide.languages.markers(model, column < 0 ? [] : [{
       startLineNumber: lineNumber,
       startColumn: column + 1,
       endLineNumber: lineNumber,
       endColumn: column + 4,
       message: "Replace BAD with a valid value.",
       severity: tide.monaco.MarkerSeverity.Error
     }]);
   }

Monaco marker columns start at 1. Clear an extension's markers with an empty array when the file
has no problems. TIde clears them when the extension stops.

Add JavaScript behavior
-----------------------

Set ``"main": "main.js"`` in the manifest when the extension needs code. ``main.js`` is an ES
module. Export ``activate(tide)``; TIde calls it when the extension starts. It can also export
``deactivate()`` for cleanup.

.. code-block:: javascript

   // @ts-check
   /** @param {Tide} tide */
   export function activate(tide) {
     tide.commands.register("count-lines", "Count lines", () => {
       const count = tide.editor.text().split("\n").length;
       tide.message(`${count} lines`);
     });

     tide.on("save", file => tide.message(`Saved ${file.name}`));
   }

   export function deactivate() {}

The ``Tide`` type is available automatically. Keep ``// @ts-check`` and the JSDoc parameter type to
get editor completions and type checking while writing ``main.js``.

Extension API
-------------

Everything that registers something (``commands.register``, ``on``, and the ``languages``
providers) returns a disposable: call its ``dispose()`` to undo it early. TIde disposes them all
when the extension stops.

About the extension
   * ``tide.version`` is the running TIde version, such as ``2.2.0``, or ``dev`` in the browser
     build and in development builds.
   * ``tide.extension`` is ``{id, dir, manifest}``: its id, its folder (``tide:<id>`` for a built-in
     extension running from TIde itself in the browser), and its parsed ``extension.json``.
   * ``tide.monaco`` is Monaco itself, for anything the rest of the API doesn't cover.
   * ``tide.subscriptions.push(disposable, ...)`` tracks registrations you make through
     ``tide.monaco`` directly, so TIde disposes them too.

Commands
   ``tide.commands.register(id, label, run, options?)`` adds a command to the **Run** menu in the
   menu bar and to the editor's right-click menu. TIde prefixes ``id`` with the extension's id, so
   two extensions can use the same one. If ``run`` throws or its promise rejects, the status bar
   shows "<label> failed" with the error. ``options`` can have:

   * ``shortcut``: a hint such as ``"Ctrl+Alt+L"`` shown beside the command in the menus. It is a
     label only; TIde doesn't bind the key.
   * ``when``: show the command only in the projects it's for. ``{ project: true }`` shows it while
     a folder is open; ``{ calculator: ["nspire"] }`` in a project for those calculators (``ce``,
     ``plus`` or ``nspire``); and ``{ language: ["c", "cpp"] }`` in one in those languages, by their
     ``tide.json`` names (``tibasic``, ``c``, ``cpp``, ``ez80``, ``z80``, ``tipython``, ``py2ez80``,
     ``lua``). A project whose ``tide.json`` doesn't name its language counts for every language. A
     command with ``when`` doesn't show with no folder open; one without it always shows.

Events
   ``tide.on(event, callback)`` calls ``callback(detail)`` when something happens:

   * ``open`` and ``save``: ``{name, path, language}`` when a file or program opens in a tab or is
     saved. ``path`` is ``null`` for calculator programs and browser-stored files; ``language`` is the
     editor's language ID.
   * ``run``: ``{programs, launch}`` after programs run in TIde's emulator: the names of the
     programs sent, and the one launched.
   * ``project``: ``{root, name}`` when a folder opens. In a workspace of several folders it fires
     again whenever another folder becomes the active one, and ``{root: null, name: null}`` when
     the folder is closed.
   * ``settings``: the settings in use, after they change.

   A handler that throws doesn't stop the others. Keep handlers quick, and do slow work
   asynchronously so the editor stays responsive.

The editor
   ``tide.editor.file()`` returns the open tab's ``{name, path, language}``, or ``null`` when no
   file or program is open. ``text()`` and ``setText(text)`` read and replace its whole contents;
   ``selection()`` returns the selected text; ``insert(text)`` replaces the selection or inserts at
   the cursor. Edits go through the editor, so :kbd:`Ctrl+Z` undoes them.

Languages
   * ``tide.languages.completions(language, provider)``, ``hover(language, provider)``, and
     ``signatureHelp(language, provider)`` register Monaco providers for an editor language ID.
   * ``builtIn(language)`` turns on TIde's own IntelliSense for a language: ``tibasic``, ``c``,
     ``ez80``, ``python`` (py2ez80), or ``tipython``. It brings completions, hover help, signature
     help, checks, quick fixes, and the outline, as each language has them. The Extensions view
     lists it as "IntelliSense for …".
   * ``markers(model, markers)`` shows problems in a file: squiggles, and the count in the status
     bar. Each call replaces this extension's markers on that model.

The project
   * ``tide.project()`` returns the open folder's ``{root, name, calculator, language?}``, or
     ``null``. In a workspace it's the active folder: the one builds, Source Control, and
     ``tide.json`` follow. ``calculator`` is ``tide.json``'s, or the calculator chosen in the status
     bar; ``language`` is there only when ``tide.json`` names it.
   * ``tide.run(command, directory?)`` runs a command line in ``directory`` (by default the open
     folder), as ``tide.json``'s ``build`` would, with the toolchain folders from Settings on
     ``PATH``. Its output streams to the Output tab, and it resolves to ``{ok, output}``. It
     rejects when there's no folder open and no ``directory``. Commands run only in the desktop
     app.
   * ``tide.settings()`` returns the settings in use: yours, with the project's ``tide.json``
     ``editor`` values over them.
   * ``tide.message(text)`` shows a message in the status bar.

Files
   * ``tide.files.read(path)`` reads a text file. A relative path is from the extension's folder,
     for files it bundles.
   * ``readBinary(path)``, ``write(path, text)``, and ``open(path)`` (which opens it in a tab) take
     paths relative to the open folder, or absolute paths. With no folder open, relative paths are
     from the extension's folder.

The calculator
   * ``tide.calculator.show()`` opens the calculator panel.
   * ``family()`` starts the calculator if needed and resolves to ``ce``, ``plus``, ``nspire``,
     ``other``, or ``null`` when no calculator is set up.
   * ``macro(name, argument?)`` runs a calculator macro, as ``tide.json``'s steps do:
     ``key.press``, ``key.type``, ``program.run``, ``program.open``, ``app.open``, or ``wait``. For
     example, ``macro("program.run", "HELLO")``.
   * ``send(files)`` sends ``[{name, bytes}]`` (``bytes`` a ``Uint8Array``) to the calculator, such
     as a built ``.8xp`` or ``.tns``.

Here is a command that opens a project file and handles the case where no project is open:

.. code-block:: javascript

   tide.commands.register("open-notes", "Open project notes", async () => {
     if (!tide.project()) {
       tide.message("Open a project first.");
       return;
     }
     await tide.files.open("notes.md");
   });

An extension can turn on TIde's existing IntelliSense for a supported language instead of
registering a second provider for the same feature:

.. code-block:: javascript

   tide.languages.builtIn("c");

You can also add commands for project artifacts. This example sends a built program to the
calculator:

.. code-block:: javascript

   tide.commands.register("send-program", "Send built program", async () => {
     if (!tide.project()) {
       tide.message("Open a project first.");
       return;
     }
     const bytes = await tide.files.readBinary("dist/HELLO.8xp");
     await tide.calculator.send([{ name: "HELLO.8xp", bytes }]);
     tide.message("Program sent.");
   });

Registrations are removed when an extension is disabled or reloaded. Extensions with ``main.js`` run
inside TIde and can access the APIs above. Only install code from sources you trust.

Each TIde window (**File → New window**) runs its own copy of every extension, so module-level state
in ``main.js`` isn't shared between windows. Saving an extension's files reloads it in the window you
saved from; other windows pick up the change when they're opened again.

Test and package
----------------

Try the extension in the desktop app. Use the Extensions view to enable or disable it, inspect its
contributions and errors, reload it, or uninstall it. Saving extension files reloads them, so iterate
by editing the manifest or JavaScript and trying the change again. Use this check before exporting:

* Does the extension activate with no error in the Extensions view?
* Do snippets, completions, and hovers appear for the intended language ID?
* Do commands work with and without an open project or file, as applicable, and does ``when`` show
  them only in the projects they're for?
* With themes, does each one appear in **Settings → Theme**, and does text read well on it?
* Does disabling or reloading the extension remove its providers and commands?
* Does the exported package include every file the extension reads?

Troubleshoot common issues
--------------------------

* **The extension is missing:** check that it is enabled in the desktop Extensions view and that
  the folder contains a valid ``extension.json``.
* **A contribution does not appear:** compare its ``language`` value with the editor's language ID.
  Use :kbd:`Ctrl+Space` to open suggestions and verify the prefix or completion label.
* **JavaScript does not start:** confirm the manifest's ``main`` path is relative to the extension
  folder and that the module exports ``activate(tide)``. Read the error shown in the Extensions
  view.
* **The API has no type help:** add ``// @ts-check`` and ``/** @param {Tide} tide */`` above the
  activation function.
* **The package will not install:** put ``extension.json`` at the zip root (or in one top-level
  folder), keep the package below 32 MB unpacked, and use the same stable ``id`` for updates.

When it is ready, select **Export as .TIdeex…** for the installed extension. A ``.TIdeex`` is a zip
containing ``extension.json`` at its root and the files the extension uses, such as ``main.js``.
Regular zip archives are accepted too; a single top-level extension folder is stripped. TIde rejects
unsafe paths and packages larger than 32 MB unpacked.

Install a package by opening it, dropping it on TIde, or choosing
**More → Install from .TIdeex…**.
TIde displays the extension details and whether it runs code before installation. A package with the
same ``id`` replaces the installed extension, so users can install future versions as updates.

User-installed extensions are currently supported in the desktop app. The browser build runs its
built-in extensions from TIde itself and has no writable extensions folder.
