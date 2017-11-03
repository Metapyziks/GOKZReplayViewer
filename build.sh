#!/bin/bash

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

mkdir -p "$TARGETDIR/$RESOURCEDIR"
mkdir -p "$TARGETDIR/$RESOURCEDIR/js"
mkdir -p "$TARGETDIR/$RESOURCEDIR/styles"
mkdir -p "$TARGETDIR/$RESOURCEDIR/images"

cp -r js "$TARGETDIR/$RESOURCEDIR"
cp -r styles "$TARGETDIR/$RESOURCEDIR"
cp -r images "$TARGETDIR/$RESOURCEDIR"

MIDNIGHT=$(date -d 'today 00:00:00' "+%s")
NOW=$(date "+%s")
DIFF=$(($NOW - $MIDNIGHT))

VERSION=$(git rev-parse --short HEAD)-$(printf '%x\n' $DIFF)

SED_ARGS=( 's/${VERSION}/'${VERSION}'/g;s|${RESOURCEDIR}|'${RESOURCEDIR}'|g;s|${BASEURL}|'${BASEURL}'|g;s|${MAPSURL}|'${MAPSURL}'|g' )
sed "${SED_ARGS[@]}" "${INDEXTEMPLATE}" >"${TARGETDIR}/index.html"
