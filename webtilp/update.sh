#!/bin/sh
# Replaces webtilp.js and webtilp.wasm with those of a newer WebTILP build: the GitHub Pages site that
# adriweb/tilibs' "Build WebTILP" workflow makes on each push. Give the workflow run's number:
#   sh public/webtilp/update.sh 44204684450
# Then update SOURCE.txt (the run's commit is in the site's build-sources.json) and commit.
set -eu
RUN="$1"
DIR="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
gh run download "$RUN" --repo adriweb/tilibs --name github-pages --dir "$TMP"
mkdir "$TMP/site" && tar -xf "$TMP/artifact.tar" -C "$TMP/site"
cp "$TMP/site/webtilp.js" "$TMP/site/webtilp.wasm" "$DIR/"
cat "$TMP/site/build-sources.json"
rm -rf "$TMP"
