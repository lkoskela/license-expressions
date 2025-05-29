#!/bin/bash

#
# Compile all *.peg grammars from 'src/codegen'
#

for peg_file in $(find src/codegen -name "*.peg"); do
    out_file="${peg_file/.peg/.ts}"
    echo "$peg_file --> $out_file"
    npx tspeg "$peg_file" "$out_file"
done

#
# Update `src/codegen/licenses.json` and `src/codegen/exceptions.json` from SPDX's
# Github repository if it's older than a day:
#
#npx licenses-from-spdx -l src/codegen/licenses.json -e src/codegen/exceptions.json
npx tsx scripts/codegen-license-update.ts src/codegen/licenses.json src/codegen/exceptions.json