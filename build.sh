#!/bin/bash

TARGETDIR=
BASEURL=
MAPSURL=
INDEXTEMPLATE=index.template.html

CONFIGPATH=config.sh
CONFIGTEMPALTE=config.template.sh

if [ ! -f "$CONFIGPATH" ]; then
    echo "Creating $CONFIGPATH"
    cp "$CONFIGTEMPALTE" "$CONFIGPATH"
fi

source "$CONFIGPATH"

tsc -p tsconfig.json

if [ -z "$TARGETDIR" ]; then
    exit 0
fi

echo "Copying to $TARGETDIR"

mkdir -p "$TARGETDIR"
mkdir -p "$TARGETDIR/js"
mkdir -p "$TARGETDIR/styles"
mkdir -p "$TARGETDIR/images"

cp -r js "${TARGETDIR}"
cp -r styles "${TARGETDIR}"
cp -r images "${TARGETDIR}"

MIDNIGHT=$(date -d 'today 00:00:00' "+%s")
NOW=$(date "+%s")
DIFF=$(($NOW - $MIDNIGHT))

VERSION=$(git rev-parse --short HEAD)-$(printf '%x\n' $DIFF)

SED_ARGS=( 's/${VERSION}/'${VERSION}'/g;s|${BASEURL}|'${BASEURL}'|g;s|${MAPSURL}|'${MAPSURL}'|g' )
sed "${SED_ARGS[@]}" "${INDEXTEMPLATE}" >"${TARGETDIR}/index.html"
