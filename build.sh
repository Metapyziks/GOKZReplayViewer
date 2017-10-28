#!/bin/sh

tsc -p tsconfig.json

VERSION=$(git rev-parse --short HEAD)

SED_ARGS=( 's/${VERSION}/'${VERSION}'/g' )
sed "${SED_ARGS[@]}" index.template.html >index.html
