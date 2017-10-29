#!/bin/bash

TARGETDIR=
BASEURL=
MAPSURL=
INDEXTEMPLATE=index.template.html

CONFIGPATH=config.sh

if [ -f "$CONFIGPATH" ]; then
    echo "Reading $CONFIGPATH"
    source "$CONFIGPATH"
fi

tsc -p tsconfig.json

if [ -z "$TARGETDIR" ]; then
    exit 0
fi

echo "Copying to $TARGETDIR"

mkdir -p "$TARGETDIR"
mkdir -p "$TARGETDIR/js"
mkdir -p "$TARGETDIR/styles"

cp -r js "${TARGETDIR}"
cp -r styles "${TARGETDIR}"

VERSION=$(git rev-parse --short HEAD)

SED_ARGS=( 's/${VERSION}/'${VERSION}'/g;s|${BASEURL}|'${BASEURL}'|g;s|${MAPSURL}|'${MAPSURL}'|g' )
sed "${SED_ARGS[@]}" "${INDEXTEMPLATE}" >"${TARGETDIR}/index.html"
