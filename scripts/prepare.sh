#!/bin/bash
set -ex

mkdir -p ./public/static/js
cp ./node_modules/@ryukina/kissfft-wasm/lib/kissfft.wasm ./public/static/js
