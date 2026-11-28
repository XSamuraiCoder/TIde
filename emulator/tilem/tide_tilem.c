// TIde's bridge to TilEm's core (libtilemcore), for the calculator panel's TI-73, 81, 82, 83,
// 83 Plus, 84 Plus, 85 and 86. Compiled to WebAssembly with the core's sources (see build.sh): the
// page loads a ROM, runs one frame at a time on its own timer, reads the screen, presses keys and
// sends files.
//
// TilEm's own program sends files through TILP's libraries; this bridge speaks the calculators'
// link protocol itself, over the core's virtual gray link: silent transfers (RTS) on the TI-73, 83,
// 83 Plus, 84 Plus and 86, and on the TI-82 and 85, which have no silent link, it opens the link
// menu's receive screen first, as TilEm does. Flash apps go to the 83 Plus and 84 Plus family, and
// TI-81 programs straight into memory (TilEm's ti81prg.c).
//
// libtilemcore is LGPLv2.1 or later and ti81prg.c GPLv3 or later; this file is GPLv3 or later.
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <emscripten.h>
#include "tilem.h"
#include "scancodes.h"
#include "ti81prg.h"

// ── What libtilemcore leaves to the program that uses it: memory, and its messages ──

static void *must(void *p) {
	if (!p) abort();
	return p;
}
void *tilem_malloc(size_t size) { return must(malloc(size ? size : 1)); }
void *tilem_malloc0(size_t size) { return must(calloc(1, size ? size : 1)); }
void *tilem_malloc_atomic(size_t size) { return tilem_malloc(size); }
void *tilem_try_malloc(size_t size) { return malloc(size ? size : 1); }
void *tilem_try_malloc0(size_t size) { return calloc(1, size ? size : 1); }
void *tilem_try_malloc_atomic(size_t size) { return tilem_try_malloc(size); }
void *tilem_realloc(void *ptr, size_t size) { return must(realloc(ptr, size ? size : 1)); }
void tilem_free(void *ptr) { free(ptr); }

// Messages and warnings are about the calculator's software (an invalid port, Flash protection):
// noise for the panel. Only TilEm's internal errors go to the console.
void tilem_message(TilemCalc *calc, const char *msg, ...) { (void)calc; (void)msg; }
void tilem_warning(TilemCalc *calc, const char *msg, ...) { (void)calc; (void)msg; }
void tilem_internal(TilemCalc *calc, const char *msg, ...) {
	va_list ap;
	(void)calc;
	va_start(ap, msg);
	fputs("TilEm: ", stderr);
	vfprintf(stderr, msg, ap);
	fputc('\n', stderr);
	va_end(ap);
}

#define FPS 60
#define FRAME_US (1000000 / FPS)

static TilemCalc *calc = NULL;
static TilemGrayLCD *glcd = NULL;
static TilemLCDBuffer *lcdbuf = NULL;
/** The screen, a row after another of the screen's width: 0 for a clear pixel up to 255 for a dark one. */
static byte screen[128 * 64];

// ── Running ──

/** Runs the calculator for `us` microseconds, stopping early for any of `events`. Returns those that happened. */
static dword run(int us, int linkmode, dword events, int *elapsed) {
	int rem = 0;
	calc->linkport.linkemu = linkmode;
	calc->z80.stop_mask = ~events;
	tilem_z80_run_time(calc, us, &rem);
	if (elapsed) *elapsed = us - rem;
	return calc->z80.stop_reason & events;
}

static void delay(int us) {
	while (us > 0) {
		int t = us < 10000 ? us : 10000, done;
		run(t, TILEM_LINK_EMULATOR_NONE, 0, &done);
		us -= done > 0 ? done : t;
	}
}

static int asleep(void) {
	return calc->z80.halted && !calc->z80.interrupts && !calc->poweronhalt;
}

static void tap(int key) {
	delay(50000);
	tilem_keypad_press_key(calc, key);
	delay(50000);
	tilem_keypad_release_key(calc, key);
	delay(50000);
}

/** Turns the calculator on if it's off, as TilEm's emulator does before a transfer. */
static void wake(void) {
	delay(200000);
	if (!asleep()) return;
	tilem_keypad_press_key(calc, TILEM_KEY_ON);
	delay(500000);
	tilem_keypad_release_key(calc, TILEM_KEY_ON);
	delay(500000);
}

static void free_calc(void) {
	if (glcd) tilem_gray_lcd_free(glcd);
	if (lcdbuf) tilem_lcd_buffer_free(lcdbuf);
	if (calc) tilem_calc_free(calc);
	glcd = NULL;
	lcdbuf = NULL;
	calc = NULL;
}

/**
 * Draws the screen as it is now into `screen`, its rows the screen's own width apart: TilEm's
 * contrast pass runs over width × height bytes in a row, whatever row stride it's given.
 */
static void capture(void) {
	tilem_gray_lcd_get_frame(glcd, lcdbuf);
	tilem_draw_lcd_image_indexed(lcdbuf, screen, calc->hw.lcdwidth, calc->hw.lcdheight,
	                             calc->hw.lcdwidth, TILEM_SCALE_FAST);
}

/** Turns a new or reset calculator on: it starts off, as with fresh batteries. */
static void power_on(void) {
	delay(1000000);
	tilem_keypad_press_key(calc, TILEM_KEY_ON);
	delay(500000);
	tilem_keypad_release_key(calc, TILEM_KEY_ON);
	delay(200000);
}

// ── Link: bytes, packets and the transfer protocol ──

enum {
	LERR_OK = 0,
	LERR_LINK = 1,
	LERR_TIMEOUT = 2,
	LERR_CHECKSUM = 4,
	LERR_MEMORY = 6,
	LERR_MODEL = 7,
	LERR_FILE = 8,
	LERR_EMULATOR = 9,
};

#define LINK_EVENTS (TILEM_STOP_LINK_READ_BYTE | TILEM_STOP_LINK_WRITE_BYTE | TILEM_STOP_LINK_ERROR)
/** How long the calculator may take for each byte, in its own time: archiving can take seconds. */
#define BYTE_TIMEOUT 8000000

static int until_ready(int timeout) {
	while (timeout > 0) {
		if (tilem_linkport_graylink_ready(calc)) return 0;
		int t = timeout < 10000 ? timeout : 10000, done;
		dword ev = run(t, TILEM_LINK_EMULATOR_GRAY, LINK_EVENTS, &done);
		timeout -= done > 0 ? done : t;
		if (ev & TILEM_STOP_LINK_ERROR) break;
	}
	return -1;
}

/** Runs the calculator with the cable still connected, so what it starts to send isn't lost. */
static void link_wait(int us) {
	while (us > 0) {
		int t = us < 10000 ? us : 10000, done;
		run(t, TILEM_LINK_EMULATOR_GRAY, 0, &done);
		us -= done > 0 ? done : t;
	}
}

static int send_byte(byte value) {
	if (until_ready(BYTE_TIMEOUT)) return -1;
	if (tilem_linkport_graylink_send_byte(calc, value)) return -1;
	if (until_ready(BYTE_TIMEOUT)) return -1;
	return 0;
}

static int get_byte(void) {
	int timeout = BYTE_TIMEOUT;
	while (timeout > 0) {
		int v = tilem_linkport_graylink_get_byte(calc);
		if (v >= 0) return v;
		int t = timeout < 10000 ? timeout : 10000, done;
		dword ev = run(t, TILEM_LINK_EMULATOR_GRAY, LINK_EVENTS, &done);
		timeout -= done > 0 ? done : t;
		if (ev & TILEM_STOP_LINK_ERROR) break;
	}
	return -1;
}

// Commands, as TI's link protocol numbers them.
enum {
	CMD_VAR = 0x06, CMD_CTS = 0x09, CMD_DATA = 0x15, CMD_SKIP = 0x36, CMD_ACK = 0x56,
	CMD_ERR = 0x5A, CMD_EOT = 0x92, CMD_RTS = 0xC9,
};

/** The machine id the computer sends as, for each model. */
static byte machine_id(void) {
	switch (calc->hw.model_id) {
	case TILEM_CALC_TI73: return 0x07;
	case TILEM_CALC_TI82: return 0x02;
	case TILEM_CALC_TI83: return 0x03;
	case TILEM_CALC_TI85: return 0x05;
	case TILEM_CALC_TI86: return 0x06;
	default: return 0x23; // the 83 Plus and 84 Plus family, and the 76.fr
	}
}

static int send_packet(byte cmd, const byte *data, int len) {
	byte head[4] = { machine_id(), cmd, (byte)(len & 0xff), (byte)(len >> 8) };
	for (int i = 0; i < 4; i++)
		if (send_byte(head[i])) return LERR_TIMEOUT;
	if (!data) return LERR_OK;
	unsigned sum = 0;
	for (int i = 0; i < len; i++) {
		sum += data[i];
		if (send_byte(data[i])) return LERR_TIMEOUT;
	}
	if (send_byte(sum & 0xff) || send_byte((sum >> 8) & 0xff)) return LERR_TIMEOUT;
	return LERR_OK;
}

/** Reads a packet from the calculator: its command and, for those that carry one, its data. */
static int recv_packet(byte *cmd, byte *data, int max, int *len) {
	byte head[4];
	for (int i = 0; i < 4; i++) {
		int v = get_byte();
		if (v < 0) return LERR_TIMEOUT;
		head[i] = (byte)v;
	}
	*cmd = head[1];
	int n = head[2] | (head[3] << 8);
	if (len) *len = 0;
	if (*cmd != CMD_VAR && *cmd != CMD_DATA && *cmd != CMD_SKIP && *cmd != CMD_RTS) {
		link_wait(10000);
		return LERR_OK;
	}
	unsigned sum = 0;
	for (int i = 0; i < n + 2; i++) {
		int v = get_byte();
		if (v < 0) return LERR_TIMEOUT;
		if (i < n) {
			sum += (unsigned)v;
			if (data && i < max) data[i] = (byte)v;
		} else if (((sum >> (8 * (i - n))) & 0xff) != (unsigned)v)
			return LERR_CHECKSUM;
	}
	if (len) *len = n;
	// The calculator needs a moment after it sends before it listens again (TilEm's cable waits too).
	link_wait(10000);
	return LERR_OK;
}

/** Waits for the calculator's ACK. */
static int expect_ack(void) {
	byte cmd;
	int err = recv_packet(&cmd, NULL, 0, NULL);
	if (err) return err;
	if (cmd == CMD_ERR) return LERR_CHECKSUM;
	return cmd == CMD_ACK ? LERR_OK : LERR_LINK;
}

/** Waits for the calculator to ask for the data (CTS), or to refuse it (SKIP: out of memory, or cancelled). */
static int expect_cts(void) {
	byte cmd, reason[4] = { 0 };
	int len, err = recv_packet(&cmd, reason, sizeof reason, &len);
	if (err) return err;
	if (cmd == CMD_CTS) return LERR_OK;
	if (cmd == CMD_SKIP) return len > 0 && reason[0] == 3 ? LERR_MEMORY : LERR_LINK;
	if (cmd == CMD_ERR) return LERR_CHECKSUM;
	return LERR_LINK;
}

static int is_silent(void) {
	return calc->hw.model_id != TILEM_CALC_TI82 && calc->hw.model_id != TILEM_CALC_TI85;
}

/** The TI-82 and 85 take files only on the link menu's receive screen: open it, as TilEm does. */
static void open_receive_screen(void) {
	if (calc->hw.model_id == TILEM_CALC_TI82) {
		tap(TILEM_KEY_2ND); tap(TILEM_KEY_MODE); // quit to the home screen
		tap(TILEM_KEY_2ND); tap(TILEM_KEY_GRAPHVAR); // LINK
		tap(TILEM_KEY_RIGHT); tap(TILEM_KEY_ENTER); // RECEIVE
	} else if (calc->hw.model_id == TILEM_CALC_TI85) {
		tap(TILEM_KEY_MODE); tap(TILEM_KEY_MODE); tap(TILEM_KEY_MODE); // EXIT, to the home screen
		tap(TILEM_KEY_2ND); tap(TILEM_KEY_GRAPHVAR); // LINK
		tap(TILEM_KEY_WINDOW); // RECV
	}
}

/** Sends one variable: its header (RTS, or VAR on the 82 and 85), then its data once the calculator asks. */
static int send_var(byte type, const byte *name, int namelen, const byte *data, int size,
                    byte version, int archived) {
	byte head[16];
	int n = 0;
	head[n++] = size & 0xff;
	head[n++] = (size >> 8) & 0xff;
	head[n++] = type;
	char model = calc->hw.model_id;
	if (model == TILEM_CALC_TI85 || model == TILEM_CALC_TI86) {
		head[n++] = (byte)namelen;
		for (int i = 0; i < namelen && i < 8; i++) head[n++] = name[i];
		if (model == TILEM_CALC_TI86) // padded with spaces to 8
			for (int i = namelen; i < 8; i++) head[n++] = ' ';
	} else {
		for (int i = 0; i < 8; i++) head[n++] = i < namelen ? name[i] : 0;
		if (model != TILEM_CALC_TI82 && model != TILEM_CALC_TI83) { // the 73 and 83 Plus family
			head[n++] = version;
			head[n++] = archived ? 0x80 : 0x00;
		}
	}
	int err = send_packet(is_silent() ? CMD_RTS : CMD_VAR, head, n);
	if (!err) err = expect_ack();
	if (!err) err = expect_cts();
	if (!err) err = send_packet(CMD_ACK, NULL, 0);
	if (!err) err = send_packet(CMD_DATA, data, size);
	if (!err) err = expect_ack();
	return err;
}

static int send_eot(void) {
	int err = send_packet(CMD_EOT, NULL, 0);
	return err ? err : expect_ack();
}

static unsigned rd16(const byte *p) { return p[0] | (p[1] << 8); }

/** Which variable files this calculator reads, by their signature. */
static int file_fits(const byte *sig) {
	switch (calc->hw.model_id) {
	case TILEM_CALC_TI73: return !memcmp(sig, "**TI73**", 8);
	case TILEM_CALC_TI82: return !memcmp(sig, "**TI82**", 8);
	case TILEM_CALC_TI83: return !memcmp(sig, "**TI83**", 8);
	case TILEM_CALC_TI85: return !memcmp(sig, "**TI85**", 8);
	case TILEM_CALC_TI86: return !memcmp(sig, "**TI86**", 8) || !memcmp(sig, "**TI85**", 8);
	default: return !memcmp(sig, "**TI83F*", 8) || !memcmp(sig, "**TI83**", 8);
	}
}

/** Sends a variable file (a program, a group of variables…): every variable in it, in order. */
static int send_vars(const byte *f, long size, int archive) {
	if (size < 57 || !file_fits(f)) return memcmp(f, "**TI", 4) ? LERR_FILE : LERR_MODEL;
	long end = 55 + rd16(f + 53);
	if (end > size) end = size;
	char model = calc->hw.model_id;
	int long_names = model == TILEM_CALC_TI85 || model == TILEM_CALC_TI86;
	if (!is_silent()) open_receive_screen();
	int sent = 0;
	for (long p = 55; p + 4 <= end;) {
		unsigned hlen = rd16(f + p);
		const byte *h = f + p + 2;
		long at = p + 2 + hlen;
		if (hlen < 4 || at + 2 > end) return LERR_FILE;
		unsigned dlen = rd16(f + at);
		const byte *data = f + at + 2;
		if (at + 2 + dlen > (unsigned long)end) return LERR_FILE;
		byte type = h[2];
		const byte *name;
		int namelen;
		byte version = 0;
		int archived = archive;
		if (long_names) {
			namelen = h[3] > 8 ? 8 : h[3];
			name = h + 4;
			if (model == TILEM_CALC_TI86) // an 86 file's names are padded with spaces
				while (namelen > 0 && name[namelen - 1] == ' ') namelen--;
		} else {
			name = h + 3;
			namelen = 0;
			while (namelen < 8 && name[namelen]) namelen++;
			if (hlen >= 13) {
				version = h[11];
				if (h[12] & 0x80) archived = 1;
			}
		}
		// Between variables the OS needs its link lines idle for a moment, or it never answers the
		// next one's header: let half a second pass with the cable out, as between two files.
		if (sent) delay(500000);
		int err = send_var(type, name, namelen, data, (int)dlen, version, archived);
		if (err) return err;
		sent++;
		p = at + 2 + dlen;
	}
	if (!sent) return LERR_FILE;
	if (!is_silent()) return send_eot();
	return LERR_OK;
}

static int hexval(int c) {
	if (c >= '0' && c <= '9') return c - '0';
	if (c >= 'A' && c <= 'F') return c - 'A' + 10;
	if (c >= 'a' && c <= 'f') return c - 'a' + 10;
	return -1;
}

/** Sends a Flash app (.8xk, .73k): its Intel HEX pages, in blocks of 128 bytes, as TILP does. */
static int send_app(const byte *f, long size) {
	char model = calc->hw.model_id;
	if (!(calc->hw.flags & TILEM_CALC_HAS_FLASH) || model == TILEM_CALC_TI76) return LERR_MODEL;
	if (size < 78) return LERR_FILE;
	byte type = f[49];
	if (type != 0x24) return LERR_FILE; // apps only: not an OS or a certificate
	if ((model == TILEM_CALC_TI73) != (f[48] == 0x74)) return LERR_MODEL;
	long end = 78 + (long)(f[74] | (f[75] << 8) | (f[76] << 16) | ((unsigned long)f[77] << 24));
	if (end > size) end = size;
	byte block[128];
	int fill = 0, page = 0;
	unsigned start = 0;
	int err = LERR_OK;
	// Each Intel HEX line has up to 32 bytes; lines with the same page and running addresses are
	// joined into blocks of 128.
#define FLUSH() do { if (fill) { \
		byte head[10] = { (byte)fill, 0, type, 0, 0, 0x80, (byte)(start & 0xff), (byte)(start >> 8), \
		                  (byte)(page & 0xff), (byte)(page >> 8) }; \
		err = send_packet(CMD_VAR, head, 10); \
		if (!err) err = expect_ack(); \
		if (!err) err = expect_cts(); \
		if (!err) err = send_packet(CMD_ACK, NULL, 0); \
		if (!err) err = send_packet(CMD_DATA, block, fill); \
		if (!err) err = expect_ack(); \
		fill = 0; \
		if (err) return err; } } while (0)
	for (long p = 78; p < end;) {
		while (p < end && f[p] != ':') p++;
		if (p + 11 > end) break;
		byte rec[260];
		int n = 0;
		for (p++; p + 1 < end && hexval(f[p]) >= 0 && hexval(f[p + 1]) >= 0 && n < 260; p += 2)
			rec[n++] = (byte)(hexval(f[p]) * 16 + hexval(f[p + 1]));
		if (n < 5 || n < 5 + rec[0]) return LERR_FILE;
		int count = rec[0];
		unsigned addr = (rec[1] << 8) | rec[2];
		byte kind = rec[3];
		if (kind == 0x01) break; // end of file
		if (kind == 0x02) { // a new page
			FLUSH();
			page = (rec[4] << 8) | rec[5];
			continue;
		}
		if (kind != 0x00) continue;
		for (int i = 0; i < count; i++) {
			if (fill && start + fill != addr + i) FLUSH();
			if (!fill) start = addr + i;
			block[fill++] = rec[4 + i];
			if (fill == 128) FLUSH();
		}
	}
	FLUSH();
#undef FLUSH
	return send_eot();
}

static int send_ti81(const char *path) {
	FILE *fp = fopen(path, "rb");
	if (!fp) return LERR_FILE;
	TI81Program *prgm = NULL;
	int bad = ti81_read_prg_file(fp, &prgm);
	fclose(fp);
	if (bad || !prgm) return LERR_FILE;
	prgm->info.slot = TI81_SLOT_AUTO;
	int err = ti81_load_program(calc, prgm);
	ti81_program_free(prgm);
	switch (err) {
	case 0: return LERR_OK;
	case TI81_ERR_MEMORY: case TI81_ERR_SLOTS_FULL: return LERR_MEMORY;
	case TI81_ERR_BUSY: return LERR_TIMEOUT;
	case TI81_ERR_INVALID_FILE: return LERR_FILE;
	default: return LERR_EMULATOR;
	}
}

// ── What the page calls ──

EMSCRIPTEN_KEEPALIVE int tilem_load(const char *path) {
	free_calc();
	FILE *fp = fopen(path, "rb");
	if (!fp) return -1;
	char id = tilem_guess_rom_type(fp);
	if (!id) {
		fclose(fp);
		return -1;
	}
	fseek(fp, 0L, SEEK_SET);
	calc = tilem_calc_new(id);
	if (!calc || tilem_calc_load_state(calc, fp, NULL)) {
		fclose(fp);
		free_calc();
		return -1;
	}
	fclose(fp);
	glcd = tilem_gray_lcd_new(calc, 4, 200);
	lcdbuf = tilem_lcd_buffer_new();
	power_on();
	capture();
	return (unsigned char)id;
}

/** Frames per second the core runs at: call tilem_frame this often. */
EMSCRIPTEN_KEEPALIVE int tilem_fps(void) { return FPS; }

/** Runs one frame (1/FPS of a second) of emulation, and takes the screen. */
EMSCRIPTEN_KEEPALIVE void tilem_frame(void) {
	if (!calc) return;
	delay(FRAME_US);
	capture();
}

/** The screen: 64 rows of tilem_lcd_width() bytes, 0 for a clear pixel up to 255 for a dark one. */
EMSCRIPTEN_KEEPALIVE byte *tilem_lcd(void) { return screen; }

/** How many of the 128 columns the model's screen shows: 96, or 128 on the TI-85 and 86. */
EMSCRIPTEN_KEEPALIVE int tilem_lcd_width(void) { return calc ? calc->hw.lcdwidth : 96; }

/** Whether the screen is on. */
EMSCRIPTEN_KEEPALIVE int tilem_lcd_on(void) { return calc && calc->lcd.active && !asleep(); }

/** Presses or releases a key by its keypad group and bit. Group 5, bit 0 is ON. */
EMSCRIPTEN_KEEPALIVE void tilem_key(int group, int bit, int down) {
	if (!calc || group < 0 || group > 7 || bit < 0 || bit > 7) return;
	int scancode = group * 8 + bit + 1;
	if (down) tilem_keypad_press_key(calc, scancode);
	else tilem_keypad_release_key(calc, scancode);
}

/** Sends a TI file. Returns 0 when it worked, or a link error (LERR_*). */
EMSCRIPTEN_KEEPALIVE int tilem_send(const char *path, int archive) {
	if (!calc) return LERR_EMULATOR;
	if (calc->hw.model_id == TILEM_CALC_TI81) {
		wake();
		return send_ti81(path);
	}
	if (!(calc->hw.flags & TILEM_CALC_HAS_LINK)) return LERR_MODEL;
	FILE *fp = fopen(path, "rb");
	if (!fp) return LERR_FILE;
	fseek(fp, 0L, SEEK_END);
	long size = ftell(fp);
	fseek(fp, 0L, SEEK_SET);
	byte *f = size > 0 && size < 8 * 1024 * 1024 ? malloc(size) : NULL;
	if (!f || fread(f, 1, size, fp) != (size_t)size) {
		fclose(fp);
		free(f);
		return LERR_FILE;
	}
	fclose(fp);
	wake();
	tilem_linkport_graylink_reset(calc);
	int err = size >= 8 && !memcmp(f, "**TIFL**", 8) ? send_app(f, size) : send_vars(f, size, archive);
	free(f);
	calc->linkport.linkemu = TILEM_LINK_EMULATOR_NONE;
	// After a transfer the OS waits about a second and a half for more before it reads the keys
	// again; let that pass here (it runs much faster than real time), so the next key counts.
	delay(2000000);
	return err;
}

/**
 * The programs on a TI-83 Plus or 84 Plus, one name per line, in the order the VAT holds them.
 * Empty on other models.
 */
EMSCRIPTEN_KEEPALIVE const char *tilem_programs(void) {
	static char names[1024 * 10];
	names[0] = '\0';
	if (!calc) return names;
	char model = calc->hw.model_id;
	if (model != TILEM_CALC_TI83P && model != TILEM_CALC_TI83P_SE && model != TILEM_CALC_TI84P &&
	    model != TILEM_CALC_TI84P_SE && model != TILEM_CALC_TI84P_NSPIRE)
		return names;
#define RD(a) calc->hw.z80_rdmem(calc, (dword)((a) & 0xffff))
	// The program VAT runs down from progPtr (9830h) to pTemp (982Eh): each entry is its type,
	// two more bytes, its data's address and page, then its name's length and the name, downwards.
	unsigned at = RD(0x9830) | (RD(0x9831) << 8);
	unsigned bottom = RD(0x982E) | (RD(0x982F) << 8);
	size_t out = 0;
	for (int guard = 0; at > bottom && at >= 0x8000 && guard < 2000; guard++) {
		byte type = RD(at) & 0x1f;
		int nl = RD(at - 6);
		if (nl < 1 || nl > 8) break;
		// 5 is a program, 6 a locked one; both are in the PRGM menu, unless the name starts with
		// something other than a letter or θ (the OS's own, such as "#" and "!", and hidden ones).
		byte first = RD(at - 7);
		if ((type == 5 || type == 6) && first >= 'A' && first <= '[' && out + nl + 2 < sizeof names) {
			for (int i = 0; i < nl; i++) names[out++] = (char)RD(at - 7 - i);
			names[out++] = '\n';
		}
		at -= 7 + nl;
	}
#undef RD
	names[out] = '\0';
	return names;
}

/** Resets the calculator and turns it back on. */
EMSCRIPTEN_KEEPALIVE void tilem_reset(void) {
	if (!calc) return;
	tilem_calc_reset(calc);
	power_on();
}

int main(void) { return 0; }
