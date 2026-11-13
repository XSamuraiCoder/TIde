// TIde's bridge to Wabbitemu's core, for the calculator panel's TI-73, 81, 82, 83, 83 Plus, 84 Plus,
// 85 and 86. Compiled to WebAssembly with the core's sources (see build.sh): the page loads a ROM,
// runs one frame at a time on its own timer, reads the screen, presses keys and sends files.
// The core (wasmWabbitemu) is GPLv2 or later, and so is this file, which is built into it.
#include "stdafx.h"
#include "calc.h"
#include "lcd.h"
#include "keys.h"
#include "sendfile.h"
#include "state.h"
#include <string.h>
#include <emscripten.h>

static LPCALC calc = NULL;

extern "C" {

/** Loads a ROM (or saved state) and turns the calculator on. Returns its model (TI_81…TI_84PSE), or -1. */
EMSCRIPTEN_KEEPALIVE int wabbit_load(const char *path) {
	if (calc != NULL) {
		calc_slot_free(calc);
		calc = NULL;
	}
	LPCALC c = calc_slot_new();
	if (c == NULL) return -1;
	if (!rom_load(c, path)) {
		calc_slot_free(c);
		return -1;
	}
	c->running = TRUE;
	calc = c;
	calc_turn_on(calc);
	return calc->model;
}

/** Frames per second the core runs at: call wabbit_frame this often. */
EMSCRIPTEN_KEEPALIVE int wabbit_fps(void) { return FPS; }

/** Runs one frame (1/FPS of a second) of emulation. */
EMSCRIPTEN_KEEPALIVE void wabbit_frame(void) {
	if (calc != NULL) calc_run_all();
}

/** The screen: 64 rows of 128 bytes, 0 for a clear pixel up to 255 for a dark one. */
EMSCRIPTEN_KEEPALIVE uint8_t *wabbit_lcd(void) {
	return calc != NULL ? LCD_image(calc->cpu.pio.lcd) : NULL;
}

/** How many of the 128 columns the model's screen shows: 96, or 128 on the TI-85 and 86. */
EMSCRIPTEN_KEEPALIVE int wabbit_lcd_width(void) {
	return calc != NULL ? calc->cpu.pio.lcd->width : 96;
}

/** Whether the screen is on. */
EMSCRIPTEN_KEEPALIVE int wabbit_lcd_on(void) {
	return calc != NULL && calc->cpu.pio.lcd->active;
}

/** Presses or releases a key by its keypad group and bit. Group 5, bit 0 is ON. */
EMSCRIPTEN_KEEPALIVE void wabbit_key(int group, int bit, int down) {
	if (calc == NULL || group < 0 || group > 7 || bit < 0 || bit > 7) return;
	if (down) keypad_press(&calc->cpu, group, bit);
	else keypad_release(&calc->cpu, group, bit);
}

/** Sends a TI file. Returns 0 when it worked, or Wabbitemu's link error. */
EMSCRIPTEN_KEEPALIVE int wabbit_send(const char *path, int archive) {
	if (calc == NULL) return LERR_NOTINIT;
	return SendFile(calc, path, archive ? SEND_ARC : SEND_CUR);
}

/**
 * The programs on a TI-83 Plus or 84 Plus, one name per line, in the order the PRGM menu lists them.
 * Empty on other models.
 */
EMSCRIPTEN_KEEPALIVE const char *wabbit_programs(void) {
	static char names[512 * 10];
	static symlist_t list;
	names[0] = '\0';
	if (calc == NULL || calc->model < TI_83P) return names;
	memset(&list, 0, sizeof list);
	if (state_build_symlist_83P(&calc->cpu, &list) == NULL || list.last == NULL) return names;
	size_t at = 0;
	for (symbol83P_t *sym = list.programs ? list.programs : list.symbols; sym <= list.last; sym++) {
		// 5 is a program, 6 a locked one; both are in the PRGM menu.
		if ((sym->type_ID == 5 || sym->type_ID == 6) && sym->name_len > 0 && sym->name_len <= 8) {
			memcpy(names + at, sym->name, sym->name_len);
			at += sym->name_len;
			names[at++] = '\n';
		}
	}
	names[at] = '\0';
	return names;
}

/** Resets the calculator and turns it back on. */
EMSCRIPTEN_KEEPALIVE void wabbit_reset(void) {
	if (calc == NULL) return;
	calc_reset(calc);
	calc_turn_on(calc);
}

}

int main(void) { return 0; }
