// Editor support for eZ80 assembly, the CE's CPU: the CE C toolchain's .asm files (fasmg syntax)
// and standalone programs. Monaco has no eZ80 language, so this adds highlighting, completions,
// hover docs and a catalog: every instruction, the assembler directives, and common TI-OS routines.
import * as monaco from "monaco-editor/editor/editor.api.js";

export const ASM_LANG = "ez80";
/** Extensions opened as eZ80 assembly. ".s" would otherwise be MIPS in Monaco. */
export const ASM_EXTENSIONS = [".asm", ".s", ".src", ".inc", ".z80", ".ez80"];

export interface AsmEntry { name: string; forms: string[]; doc: string; insert: string }
export interface CatalogEntry { name: string; insert: string; hint: string; detail?: string }

const op = (name: string, forms: string[], doc: string, insert = name): AsmEntry => ({ name, forms, doc, insert });
/** A mnemonic with operands: the snippet inserts a tab, then the operand tab stops. */
const op2 = (name: string, operands: string[], forms: string[], doc: string): AsmEntry =>
  op(name, forms, doc, `${name}\t${operands.map((o, i) => `\${${i + 1}:${o}}`).join(", ")}`);

export const ASM_LIBRARY: { group: string; entries: AsmEntry[] }[] = [
  {
    group: "Load and exchange",
    entries: [
      op2("ld", ["dest", "src"], ["ld r, r'", "ld r, n", "ld rr, nn", "ld r, (hl)", "ld (hl), r", "ld a, (nn)", "ld rr, (nn)", "ld (nn), rr", "ld rr, (ix+d)", "ld sp, hl"],
        "Copies a value. 8-bit registers are a b c d e h l; 16/24-bit pairs are bc de hl ix iy sp. In ADL mode pairs are 24-bit and (nn) addresses are 24-bit. Changes no flags (except ld a,i and ld a,r)."),
      op2("push", ["rr"], ["push rr", "push af"], "Pushes a register pair onto the stack: 3 bytes in ADL mode, 2 otherwise."),
      op2("pop", ["rr"], ["pop rr", "pop af"], "Pops a register pair from the stack: 3 bytes in ADL mode, 2 otherwise."),
      op2("ex", ["a", "b"], ["ex de, hl", "ex af, af'", "ex (sp), hl", "ex (sp), ix"], "Swaps two registers, or a register with the top of the stack."),
      op("exx", ["exx"], "Swaps bc, de and hl with their shadow registers bc', de', hl'. The OS uses the shadows, so interrupts must be off."),
      op2("lea", ["rr", "ix+d"], ["lea rr, ix+d", "lea rr, iy+d"], "eZ80: loads ix or iy plus a signed offset (−128…127) into a register pair, without changing flags."),
      op2("pea", ["ix+d"], ["pea ix+d", "pea iy+d"], "eZ80: pushes ix or iy plus a signed offset onto the stack."),
    ],
  },
  {
    group: "Arithmetic",
    entries: [
      op2("add", ["a", "src"], ["add a, r", "add a, n", "add a, (hl)", "add hl, rr", "add ix, rr"], "Adds to a, or adds a pair to hl/ix/iy. The 16/24-bit form only sets the carry flag."),
      op2("adc", ["a", "src"], ["adc a, r", "adc a, n", "adc hl, rr"], "Adds with the carry flag."),
      op2("sub", ["src"], ["sub a, r", "sub a, n", "sub a, (hl)"], "Subtracts from a. fasmg also accepts the short form sub r."),
      op2("sbc", ["a", "src"], ["sbc a, r", "sbc a, n", "sbc hl, rr"], "Subtracts with the carry flag (borrow). or a then sbc hl,de is the usual 24-bit subtract."),
      op2("inc", ["dest"], ["inc r", "inc rr", "inc (hl)", "inc (ix+d)"], "Adds 1. Pairs don't change flags; 8-bit forms set every flag except carry."),
      op2("dec", ["dest"], ["dec r", "dec rr", "dec (hl)", "dec (ix+d)"], "Subtracts 1. Pairs don't change flags; 8-bit forms set every flag except carry."),
      op2("cp", ["src"], ["cp r", "cp n", "cp (hl)"], "Compares with a by subtracting without storing. z: equal. c: a is lower (unsigned)."),
      op2("mlt", ["rr"], ["mlt bc", "mlt de", "mlt hl", "mlt sp"], "eZ80: multiplies the two 8-bit halves of a pair (b×c, d×e, h×l) into the low 16 bits of the pair."),
      op("neg", ["neg"], "Negates a (two's complement)."),
      op("cpl", ["cpl"], "Inverts every bit of a."),
      op("daa", ["daa"], "Adjusts a for binary-coded decimal after an add or subtract."),
      op("scf", ["scf"], "Sets the carry flag."),
      op("ccf", ["ccf"], "Inverts the carry flag."),
    ],
  },
  {
    group: "Logic",
    entries: [
      op2("and", ["src"], ["and r", "and n", "and (hl)"], "Bitwise AND with a. Clears carry."),
      op2("or", ["src"], ["or r", "or n", "or (hl)"], "Bitwise OR with a. Clears carry; or a is the usual way to clear carry and test a for zero."),
      op2("xor", ["src"], ["xor r", "xor n", "xor (hl)"], "Bitwise XOR with a. xor a sets a to 0 in one byte."),
      op2("tst", ["a", "src"], ["tst a, r", "tst a, n", "tst a, (hl)"], "eZ80: ANDs with a to set the flags, without storing the result."),
    ],
  },
  {
    group: "Rotate and shift",
    entries: [
      op("rlca", ["rlca"], "Rotates a left; bit 7 goes to carry and bit 0."),
      op("rrca", ["rrca"], "Rotates a right; bit 0 goes to carry and bit 7."),
      op("rla", ["rla"], "Rotates a left through carry."),
      op("rra", ["rra"], "Rotates a right through carry."),
      op2("rlc", ["dest"], ["rlc r", "rlc (hl)"], "Rotates left; bit 7 goes to carry and bit 0."),
      op2("rrc", ["dest"], ["rrc r", "rrc (hl)"], "Rotates right; bit 0 goes to carry and bit 7."),
      op2("rl", ["dest"], ["rl r", "rl (hl)"], "Rotates left through carry."),
      op2("rr", ["dest"], ["rr r", "rr (hl)"], "Rotates right through carry."),
      op2("sla", ["dest"], ["sla r", "sla (hl)"], "Shifts left; bit 7 goes to carry, 0 comes in. Doubles an unsigned value."),
      op2("sra", ["dest"], ["sra r", "sra (hl)"], "Shifts right keeping the sign bit. Halves a signed value."),
      op2("srl", ["dest"], ["srl r", "srl (hl)"], "Shifts right; 0 comes in. Halves an unsigned value."),
      op("rld", ["rld"], "Rotates a BCD digit left between a and (hl)."),
      op("rrd", ["rrd"], "Rotates a BCD digit right between a and (hl)."),
    ],
  },
  {
    group: "Bits",
    entries: [
      op2("bit", ["n", "src"], ["bit n, r", "bit n, (hl)", "bit n, (iy+d)"], "Tests bit n (0–7): z is set when the bit is 0."),
      op2("set", ["n", "dest"], ["set n, r", "set n, (hl)", "set n, (iy+d)"], "Sets bit n to 1. The OS keeps its flags at (iy+offset)."),
      op2("res", ["n", "dest"], ["res n, r", "res n, (hl)", "res n, (iy+d)"], "Resets bit n to 0."),
    ],
  },
  {
    group: "Jumps and calls",
    entries: [
      op2("jp", ["target"], ["jp nn", "jp cc, nn", "jp (hl)", "jp (ix)"], "Jumps to an address, or if the condition holds. Conditions: z nz c nc pe po p m."),
      op2("jr", ["label"], ["jr label", "jr cc, label"], "Relative jump within −126…129 bytes. Conditions: z nz c nc only. One byte shorter than jp."),
      op2("djnz", ["label"], ["djnz label"], "Decrements b and jumps if it isn't 0. The classic counted loop."),
      op2("call", ["target"], ["call nn", "call cc, nn"], "Pushes the return address and jumps. TI-OS routines are called this way."),
      op("ret", ["ret", "ret cc"], "Returns to the caller, optionally only if a condition holds."),
      op("reti", ["reti"], "Returns from an interrupt."),
      op("retn", ["retn"], "Returns from a non-maskable interrupt."),
      op2("rst", ["n"], ["rst 00h … rst 38h"], "One-byte call to a fixed address (00h, 08h … 38h)."),
    ],
  },
  {
    group: "Block transfer and search",
    entries: [
      op("ldir", ["ldir"], "Copies bc bytes from (hl) to (de), counting up. The usual memcpy."),
      op("lddr", ["lddr"], "Copies bc bytes from (hl) to (de), counting down. For overlapping copies to a higher address."),
      op("ldi", ["ldi"], "Copies one byte from (hl) to (de), increments both and decrements bc."),
      op("ldd", ["ldd"], "Copies one byte from (hl) to (de), decrements all three."),
      op("cpir", ["cpir"], "Searches bc bytes from (hl) upward for the value in a. z is set when found."),
      op("cpdr", ["cpdr"], "Searches bc bytes from (hl) downward for the value in a."),
      op("cpi", ["cpi"], "Compares (hl) with a, increments hl, decrements bc."),
      op("cpd", ["cpd"], "Compares (hl) with a, decrements hl and bc."),
    ],
  },
  {
    group: "Input and output",
    entries: [
      op2("in", ["r", "(bc)"], ["in r, (bc)", "in a, (n)"], "Reads from an I/O port. On the CE the port address is the full bc."),
      op2("out", ["(bc)", "r"], ["out (bc), r", "out (n), a"], "Writes to an I/O port."),
      op2("in0", ["r", "(n)"], ["in0 r, (n)"], "eZ80: reads from an internal port 00h–FFh."),
      op2("out0", ["(n)", "r"], ["out0 (n), r"], "eZ80: writes to an internal port 00h–FFh."),
      op2("tstio", ["n"], ["tstio n"], "eZ80: ANDs the port at c with n to set flags."),
      op("ini", ["ini", "inir", "ind", "indr"], "Block input: reads port bc into (hl), stepping hl and counting b down. The r forms repeat."),
      op("outi", ["outi", "otir", "outd", "otdr"], "Block output: writes (hl) to port bc, stepping hl and counting b down. The r forms repeat."),
      op("otimr", ["otim", "otimr", "otdm", "otdmr"], "eZ80: block output to internal ports at c, stepping c with hl."),
      op("inimr", ["inim", "inimr", "indm", "indmr"], "eZ80: block input from internal ports at c, stepping c with hl."),
    ],
  },
  {
    group: "CPU control",
    entries: [
      op("nop", ["nop"], "Does nothing for one cycle."),
      op("halt", ["halt"], "Stops until the next interrupt. Hangs if interrupts are off."),
      op("di", ["di"], "Disables interrupts. Needed before using the shadow registers or iy freely."),
      op("ei", ["ei"], "Enables interrupts, after the next instruction."),
      op2("im", ["n"], ["im 0", "im 1", "im 2"], "Sets the interrupt mode. The CE OS uses mode 1."),
      op("slp", ["slp"], "eZ80: enters sleep mode until an interrupt."),
      op("stmix", ["stmix"], "eZ80: turns on mixed-memory mode (calls between ADL and Z80 code save the mode)."),
      op("rsmix", ["rsmix"], "eZ80: turns off mixed-memory mode."),
      op2("ld mb", ["a"], ["ld mb, a", "ld a, mb"], "eZ80: sets or reads MBASE, the upper byte of addresses in Z80 mode. ADL mode only."),
    ],
  },
  {
    group: "Mode suffixes",
    entries: [
      op(".sis", ["call.sis nn"], "eZ80: short data and immediate (16-bit). Runs one instruction in Z80 mode from ADL code."),
      op(".lil", ["call.lil nn"], "eZ80: long data and immediate (24-bit). Runs one instruction in ADL mode from Z80 code."),
      op(".sil", ["ld.sil hl, (nn)"], "eZ80: short data, long immediate."),
      op(".lis", ["ld.lis hl, (nn)"], "eZ80: long data, short immediate."),
      op(".s", ["ld.s hl, (ix)"], "eZ80: short (16-bit) data for this instruction."),
      op(".l", ["ld.l hl, (ix)"], "eZ80: long (24-bit) data for this instruction."),
    ],
  },
  {
    group: "Directives (fasmg)",
    entries: [
      op("assume", ["assume adl=1"], "Tells the assembler the code runs in ADL (24-bit) mode, as all CE programs do.", "assume\tadl=1"),
      op("section", ["section .text", "section .data", "section .rodata", "section .bss"], "Starts a section for the linker (CE C toolchain).", "section\t.${1:text}"),
      op("public", ["public _name"], "Exports a label so C code can call it. C names get a leading underscore.", "public\t_${1:name}"),
      op("extern", ["extern _name"], "Uses a label defined in another file, such as a C function.", "extern\t_${1:name}"),
      op("private", ["private name"], "Keeps a label local to this file.", "private\t${1:name}"),
      op("include", ["include 'file.inc'"], "Inserts another source file.", "include\t'${1:file.inc}'"),
      op("equ", ["name equ value", "name := value"], "Defines a constant. := is fasmg's constant form; = can be redefined.", "${1:name} equ ${2:value}"),
      op("db", ["db 1, 2, 'text', 0"], "Defines bytes: numbers or quoted text.", "db\t${1:0}"),
      op("dw", ["dw 1234h"], "Defines 16-bit words.", "dw\t${1:0}"),
      op("dl", ["dl label"], "Defines 24-bit values, the size of an ADL pointer.", "dl\t${1:0}"),
      op("dd", ["dd 12345678h"], "Defines 32-bit values.", "dd\t${1:0}"),
      op("rb", ["rb 10"], "Reserves bytes without setting them.", "rb\t${1:1}"),
      op("rl", ["rl 4"], "Reserves 24-bit values.", "rl\t${1:1}"),
      op("org", ["org address"], "Sets the address the following code is assembled for.", "org\t${1:address}"),
      op("align", ["align 256"], "Pads to a multiple of the given size.", "align\t${1:256}"),
      op("if", ["if condition … else … end if"], "Assembles a part only when a condition holds.", "if ${1:condition}\n\t$0\nend if"),
      op("repeat", ["repeat count … end repeat"], "Assembles a part several times. % is the 1-based index.", "repeat ${1:count}\n\t$0\nend repeat"),
      op("macro", ["macro name args … end macro"], "Defines a macro.", "macro ${1:name} ${2:args}\n\t$0\nend macro"),
    ],
  },
  {
    group: "TI-OS routines (ti84pceg.inc)",
    entries: [
      op("_ClrScrnFull", ["call _ClrScrnFull"], "Clears the home screen and its text buffer.", "call\t_ClrScrnFull"),
      op("_ClrLCDFull", ["call _ClrLCDFull"], "Clears the whole LCD, leaving the text buffer.", "call\t_ClrLCDFull"),
      op("_HomeUp", ["call _HomeUp"], "Moves the text cursor to the top left (curRow and curCol to 0).", "call\t_HomeUp"),
      op("_PutS", ["ld hl, string", "call _PutS"], "Prints the zero-terminated string at hl at the cursor.", "ld\thl, ${1:string}\n\tcall\t_PutS"),
      op("_PutC", ["ld a, char", "call _PutC"], "Prints the character in a and moves the cursor.", "call\t_PutC"),
      op("_PutMap", ["call _PutMap"], "Draws the character in a at the cursor without moving it.", "call\t_PutMap"),
      op("_DispHL", ["call _DispHL"], "Prints hl as a decimal number.", "call\t_DispHL"),
      op("_NewLine", ["call _NewLine"], "Moves the cursor to the start of the next line, scrolling if needed.", "call\t_NewLine"),
      op("_VPutS", ["call _VPutS"], "Draws the zero-terminated string at hl in the small font at penRow, penCol.", "call\t_VPutS"),
      op("_GetCSC", ["call _GetCSC"], "Scans the keypad: a is the scan code of a newly pressed key, or 0.", "call\t_GetCSC"),
      op("_GetKey", ["call _GetKey"], "Waits for a key and returns its key code in a. Handles 2nd, alpha and power-off.", "call\t_GetKey"),
      op("_RunIndicOff", ["call _RunIndicOff"], "Hides the busy indicator in the corner.", "call\t_RunIndicOff"),
      op("_RunIndicOn", ["call _RunIndicOn"], "Shows the busy indicator.", "call\t_RunIndicOn"),
      op("_DrawStatusBar", ["call _DrawStatusBar"], "Redraws the status bar at the top of the screen.", "call\t_DrawStatusBar"),
      op("_Mov9ToOP1", ["ld hl, name", "call _Mov9ToOP1"], "Copies 9 bytes from hl to OP1, usually a variable name.", "ld\thl, ${1:name}\n\tcall\t_Mov9ToOP1"),
      op("_ChkFindSym", ["call _ChkFindSym"], "Looks up the variable named in OP1. Carry is set if it doesn't exist; otherwise de points to its data.", "call\t_ChkFindSym"),
      op("_CreateProg", ["call _CreateProg"], "Creates a program named in OP1 with hl bytes. de points to its data.", "call\t_CreateProg"),
      op("_DelVarArc", ["call _DelVarArc"], "Deletes the variable found by _ChkFindSym, archived or not.", "call\t_DelVarArc"),
      op("_Arc_Unarc", ["call _Arc_Unarc"], "Archives or unarchives the variable named in OP1.", "call\t_Arc_Unarc"),
      op("_EnoughMem", ["call _EnoughMem"], "Checks for hl bytes of free RAM. Carry is set if there isn't enough.", "call\t_EnoughMem"),
      op("_SetxxOP1", ["call _SetxxOP1"], "Sets OP1 to the floating-point value of a.", "call\t_SetxxOP1"),
      op("_ConvOP1", ["call _ConvOP1"], "Converts the floating-point number in OP1 to an integer in de (and a).", "call\t_ConvOP1"),
      op("_DispOP1A", ["call _DispOP1A"], "Prints the floating-point number in OP1, using at most a characters.", "call\t_DispOP1A"),
      op("_OP1ToOP2", ["call _OP1ToOP2"], "Copies OP1 to OP2.", "call\t_OP1ToOP2"),
    ],
  },
  {
    group: "TI-OS addresses (ti84pceg.inc)",
    entries: [
      op("vRam", ["vRam = 0D40000h"], "Start of the screen memory: 320×240 pixels, 16 bits each by default."),
      op("lcdWidth", ["lcdWidth = 320"], "Screen width in pixels."),
      op("lcdHeight", ["lcdHeight = 240"], "Screen height in pixels."),
      op("userMem", ["userMem"], "Where the running program is loaded."),
      op("curRow", ["curRow"], "Home screen cursor row (byte)."),
      op("curCol", ["curCol"], "Home screen cursor column (byte)."),
      op("penRow", ["penRow"], "Small-font pen row, for _VPutS."),
      op("penCol", ["penCol"], "Small-font pen column, for _VPutS."),
      op("OP1", ["OP1"], "The OS's first 11-byte floating-point register, also used for variable names."),
      op("OP2", ["OP2"], "The OS's second floating-point register."),
      op("pixelShadow", ["pixelShadow"], "A large RAM area that programs can use as scratch space when the OS doesn't need it."),
      op("flags", ["ld iy, flags"], "Base of the OS flags. iy must hold this when calling the OS."),
    ],
  },
];

export const ASM_SNIPPETS = [
  {
    label: "C-callable function", doc: "An assembly function for a CE C project. Arguments are on the stack, 3 bytes each, the first at (sp+3); return a value in hl (or a for 8-bit).",
    body: "\tassume\tadl=1\n\n\tsection\t.text\n\n\tpublic\t_${1:name}\n_${1:name}:\n\tld\tiy, 0\n\tadd\tiy, sp\n\tld\thl, (iy + 3)\t; first argument\n\t$0\n\tret\n",
  },
  {
    label: "Standalone program", doc: "A program built with fasmg and the fasmg-ez80 includes: prints a message and returns.",
    body: "include 'include/ez80.inc'\ninclude 'include/tiformat.inc'\nformat ti executable '${1:HELLO}'\ninclude 'include/ti84pceg.inc'\n\n\tcall\t_ClrScrnFull\n\tcall\t_HomeUp\n\tld\thl, message\n\tcall\t_PutS\n\t$0\n\tret\n\nmessage:\n\tdb\t'${2:Hello}', 0\n",
  },
  { label: "Counted loop", doc: "Repeats b times with djnz.", body: "\tld\tb, ${1:10}\n${2:loop}:\n\t$0\n\tdjnz\t${2:loop}" },
  { label: "Key wait", doc: "Waits until a key is pressed, using _GetCSC.", body: "${1:wait}:\n\tcall\t_GetCSC\n\tor\ta, a\n\tjr\tz, ${1:wait}" },
  { label: "24-bit compare", doc: "Compares hl with de without changing them: z if equal, c if hl is lower.", body: "\tor\ta, a\n\tsbc\thl, de\n\tadd\thl, de" },
];

export const ASM_CATALOG: { group: string; entries: CatalogEntry[] }[] = [
  { group: "Snippets", entries: ASM_SNIPPETS.map(s => ({ name: s.label, insert: s.body, hint: s.doc })) },
  ...ASM_LIBRARY.map(g => ({
    group: g.group,
    entries: g.entries.map(e => ({ name: e.name, insert: e.insert, hint: e.doc, detail: e.forms.join("\n") })),
  })),
];

const BY_NAME = new Map(ASM_LIBRARY.flatMap(g => g.entries.map(e => [e.name.toLowerCase(), e] as const)));
const MNEMONICS = ASM_LIBRARY.slice(0, 9).flatMap(g => g.entries.flatMap(e => e.forms.map(f => f.split(/[\s.]/)[0])));
const DIRECTIVES = ASM_LIBRARY.find(g => g.group.startsWith("Directives"))!.entries.map(e => e.name)
  .concat(["end", "else", "format", "namespace", "label", "virtual", "load", "store", "display", "err"]);

export function registerAsm(): void {
  monaco.languages.register({ id: ASM_LANG, extensions: ASM_EXTENSIONS, aliases: ["eZ80 assembly", "ez80"] });

  monaco.languages.setMonarchTokensProvider(ASM_LANG, {
    ignoreCase: true,
    mnemonics: [...new Set(MNEMONICS)],
    directives: DIRECTIVES,
    registers: ["a", "b", "c", "d", "e", "h", "l", "i", "r", "f", "af", "bc", "de", "hl", "ix", "iy", "ixh", "ixl", "iyh", "iyl", "sp", "mb",
      "z", "nz", "nc", "po", "pe", "p", "m"],
    tokenizer: {
      root: [
        [/;.*$/, "comment"],
        [/^\s*[A-Za-z_.?$@][\w.?$@]*:/, "type.identifier"],               // label
        [/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/, "string"],
        [/\$[0-9a-f]+|%[01]+\b|\b(?:0x[0-9a-f]+|[0-9][0-9a-f]*h|[01]+b|\d+)\b/i, "number"],
        [/\b(?:af')/, "variable.predefined"],
        [/[A-Za-z_.][\w.]*/, { cases: {
          "@mnemonics": "keyword",
          "@directives": "keyword.directive",
          "@registers": "variable.predefined",
          "@default": "identifier",
        } }],
        [/[()[\],+\-*/=<>&|^~%]/, "delimiter"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration(ASM_LANG, {
    comments: { lineComment: ";" },
    brackets: [["(", ")"]],
    autoClosingPairs: [{ open: "(", close: ")" }, { open: "'", close: "'", notIn: ["string", "comment"] }, { open: '"', close: '"', notIn: ["string", "comment"] }],
    wordPattern: /[A-Za-z_.?$@][\w.?$@]*/g,
  });

  const rules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
  monaco.languages.registerCompletionItemProvider(ASM_LANG, {
    provideCompletionItems(model, position) {
      const prefix = model.getValueInRange(new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column));
      if (prefix.includes(";")) return { suggestions: [] };
      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
      const { Function, Keyword, Constant, Snippet } = monaco.languages.CompletionItemKind;
      return {
        suggestions: [
          ...ASM_LIBRARY.flatMap(g => g.entries.map(e => ({
            label: e.name, detail: e.forms.join("  |  "), documentation: { value: e.doc }, insertText: e.insert, insertTextRules: rules, range,
            kind: g.group.startsWith("TI-OS routines") ? Function : g.group.startsWith("TI-OS addresses") ? Constant : Keyword,
            sortText: (g.group.startsWith("TI-OS") ? "2" : "1") + e.name,
          }))),
          ...ASM_SNIPPETS.map(s => ({
            label: s.label, kind: Snippet, detail: "Snippet", documentation: { value: s.doc }, insertText: s.body, insertTextRules: rules, range, sortText: "3" + s.label,
          })),
        ],
      };
    },
  });

  monaco.languages.registerHoverProvider(ASM_LANG, {
    provideHover(model, pos) {
      const word = model.getWordAtPosition(pos);
      if (!word) return null;
      const entry = BY_NAME.get(word.word.toLowerCase()) ?? BY_NAME.get(word.word.toLowerCase().split(".")[0]);
      if (!entry) return null;
      return {
        range: new monaco.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn),
        contents: [{ value: "```\n" + entry.forms.join("\n") + "\n```" }, { value: entry.doc }],
      };
    },
  });
}
