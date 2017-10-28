#!/bin/sh

tsc -p tsconfig.json

VERSION=$(git rev-parse --short HEAD)

for MAPDIR in `find maps -mindepth 1 -maxdepth 1 -type d`; do
    MAPNAME=${MAPDIR:5}
    
    for REPLAYPATH in `find replays/${MAPNAME} -path *.replay -type f`; do
        REPLAYFILE=$(basename $REPLAYPATH)
        REPLAYNAME=${REPLAYFILE%.replay}

        SED_ARGS=( 's/${VERSION}/'${VERSION}'/g;s/${MAPNAME}/'${MAPNAME}'/g;s/${REPLAYNAME}/'${REPLAYNAME}'/g' )
        sed "${SED_ARGS[@]}" replay.template.html >"replays/${MAPNAME}/${REPLAYNAME}.html"
    done
done
