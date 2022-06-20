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

license_file="src/codegen/licenses.json"
exceptions_file="src/codegen/exceptions.json"
node scripts/codegen-license-update.js "$license_file" "$exceptions_file"
