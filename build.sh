#!/bin/sh

tsc -p tsconfig.json

VERSION=$(git rev-parse --short HEAD)

REPLAYHTML=""

for MAPDIR in `find maps -mindepth 1 -maxdepth 1 -type d`; do
    MAPNAME=${MAPDIR:5}
    REPLAYHTML+="<h3>${MAPNAME}</h3><ul>"
    
    for REPLAYPATH in `find replays/${MAPNAME} -path *.replay -type f`; do
        REPLAYFILE=$(basename $REPLAYPATH)
        REPLAYNAME=${REPLAYFILE%.replay}
        
        HTMLPATH="replays/${MAPNAME}/${REPLAYNAME}.html"

        REPLAYHTML+='<li><a href="/GOKZReplayViewer/'${HTMLPATH}'">'${REPLAYNAME}'</a></li>'

        SED_ARGS=( 's/${VERSION}/'${VERSION}'/g;s/${MAPNAME}/'${MAPNAME}'/g;s/${REPLAYNAME}/'${REPLAYNAME}'/g' )
        sed "${SED_ARGS[@]}" replay.template.html >${HTMLPATH}
    done
    
    REPLAYHTML+="</ul>"
done

SED_ARGS=( 's|${REPLAYHTML}|'"${REPLAYHTML}"'|g' )
sed "${SED_ARGS[@]}" index.template.html >index.html
