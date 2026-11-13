#!/bin/sh
# Builds WabbitEmu.js and WabbitEmu.wasm into dist/, which TIde builds into the app: Wabbitemu's core
# (wasmWabbitemu, at the commit dist/SOURCE.txt names) with TIde's bridge, tide_wabbit.cpp.
# Run inside an Emscripten container, then commit dist/:
#   docker run --rm -v "$PWD:/w" -w /w emscripten/emsdk:3.1.74 sh emulator/wabbit/build.sh <wasmWabbitemu checkout> emulator/wabbit/dist
set -eu
SRC="$1"
OUT="$2"
HERE="$(dirname "$0")"
mkdir -p "$OUT"
em++ -O3 -w -x c++ -D_LINUX -DHIGH_SHADE_GIF \
  -I"$SRC" -I"$SRC/core" -I"$SRC/hardware" -I"$SRC/interface" -I"$SRC/utilities" \
  "$SRC/core/core.c" "$SRC/core/alu.c" "$SRC/core/control.c" "$SRC/core/device.c" "$SRC/core/indexcb.c" \
  "$SRC/interface/calc.c" "$SRC/interface/state.c" \
  "$SRC/utilities/label.c" "$SRC/utilities/savestate.c" "$SRC/utilities/sendfile.c" "$SRC/utilities/var.c" \
  "$SRC/hardware/81hw.c" "$SRC/hardware/83hw.c" "$SRC/hardware/83phw.c" "$SRC/hardware/83psehw.c" "$SRC/hardware/86hw.c" \
  "$SRC/hardware/keys.c" "$SRC/hardware/lcd.c" "$SRC/hardware/link.c" \
  -x none "$HERE/tide_wabbit.cpp" \
  -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME=WabbitEmu -s INVOKE_RUN=0 -s ALLOW_MEMORY_GROWTH=1 \
  -s ENVIRONMENT=web -s ASSERTIONS=0 \
  -s EXPORTED_FUNCTIONS=_main,_wabbit_load,_wabbit_fps,_wabbit_frame,_wabbit_lcd,_wabbit_lcd_width,_wabbit_lcd_on,_wabbit_key,_wabbit_send,_wabbit_reset,_wabbit_programs \
  -s EXPORTED_RUNTIME_METHODS=FS,ccall,UTF8ToString,HEAPU8 \
  -o "$OUT/WabbitEmu.js"
