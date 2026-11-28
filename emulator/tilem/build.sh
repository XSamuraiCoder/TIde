#!/bin/sh
# Builds TilEm.js and TilEm.wasm into dist/, which TIde builds into the app: TilEm's core
# (libtilemcore, and the TI-81 program loader from its GUI, of the release dist/SOURCE.txt names)
# with TIde's bridge, tide_tilem.c. Run inside an Emscripten container, then commit dist/:
#   docker run --rm -v "$PWD:/w" -w /w emscripten/emsdk:3.1.74 sh emulator/tilem/build.sh <tilem-2.0 folder> emulator/tilem/dist
set -eu
SRC="$1"
OUT="$2"
HERE="$(dirname "$0")"
mkdir -p "$OUT"
CORE=""
for f in calcs z80 state rom flash link keypad lcd cert md5 timers monolcd graylcd grayimage graycolor; do
  CORE="$CORE $SRC/emu/$f.c"
done
for m in x7 x1 x2 x3 xp xs x4 xz xn x5 x6; do
  for f in init io memory subcore; do CORE="$CORE $SRC/emu/$m/${m}_$f.c"; done
done
# shellcheck disable=SC2086
emcc -O3 -w -DHAVE_CONFIG_H -I"$HERE" -I"$SRC/emu" -I"$SRC/gui" \
  $CORE "$SRC/gui/ti81prg.c" "$HERE/tide_tilem.c" \
  -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=TilEm -s INVOKE_RUN=0 -s ALLOW_MEMORY_GROWTH=1 \
  -s ENVIRONMENT=web -s ASSERTIONS=0 \
  -s EXPORTED_FUNCTIONS=_main,_tilem_load,_tilem_fps,_tilem_frame,_tilem_lcd,_tilem_lcd_width,_tilem_lcd_on,_tilem_key,_tilem_send,_tilem_reset,_tilem_programs \
  -s EXPORTED_RUNTIME_METHODS=FS,ccall,UTF8ToString,HEAPU8 \
  -o "$OUT/TilEm.js"
