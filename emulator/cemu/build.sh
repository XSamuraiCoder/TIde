#!/bin/sh
# Builds WebCEmu.js and WebCEmu.wasm into dist/, which TIde builds into the app: CEmu's core,
# unmodified, at the commit dist/SOURCE.txt names, with its own core/emscripten.mk and these flags
# (CEmu's, minus --memory-init-file, which current Emscripten no longer accepts). Then commit dist/.
#   git clone https://github.com/CE-Programming/CEmu.git cemu
#   git -C cemu checkout 430510c539cce0886b60fd51c8ff1b8d0709c2f9
#   sh emulator/cemu/build.sh cemu
set -eu
SRC="$(cd "$1" && pwd)"
OUT="$(cd "$(dirname "$0")" && pwd)/dist"
docker run --rm -v "$SRC:/src" -w /src/core emscripten/emsdk:3.1.74 \
  make -f emscripten.mk -j4 \
  "EMFLAGS=-s TOTAL_MEMORY=33554432 -s ALLOW_MEMORY_GROWTH=0 -s WASM=1 -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME='WebCEmu' -s INVOKE_RUN=0 -s NO_EXIT_RUNTIME=1 -s ASSERTIONS=0"
mkdir -p "$OUT"
cp "$SRC/core/WebCEmu.js" "$SRC/core/WebCEmu.wasm" "$OUT/"
