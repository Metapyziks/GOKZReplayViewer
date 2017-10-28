#!/bin/sh

tsc -p tsconfig.json

HASH=$(git rev-parse --short HEAD)

SED_ARGS=( '-i' '-E' 's/\?v=[0-9a-f-]+/\?v='${HASH}'/' )
sed "${SED_ARGS[@]}" index.html
