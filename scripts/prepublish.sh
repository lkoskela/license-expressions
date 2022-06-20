#!/bin/bash

#
# Read the TypeScript compiler's `outDir` compiler property from package.json, make sure the outDir points
# somewhere within the current directory, and wipe the entire directory so that the "publish" step won't be
# packaging any residue from previous versions after e.g. renaming source files or something like that.
#

BUILD_DIR=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("package.json")).compilerOptions.outDir)')
CURR_DIR=$(pwd)
CURR_DIR_LENGTH=`expr "$CURR_DIR" : '.*'`
BUILD_DIR_ABS_PATH=$(node -e 'console.log(require("path").resolve(process.argv[1]))' "$BUILD_DIR")
COMMON_PART=${BUILD_DIR_ABS_PATH:0:CURR_DIR_LENGTH}
EXTRA_PART=${BUILD_DIR_ABS_PATH:CURR_DIR_LENGTH}
if [[ "$COMMON_PART" == "$CURR_DIR" ]] && ([[ "$EXTRA_PART" == "" || "${EXTRA_PART:0:1}" == "/" ]]); then
    echo "Wiping directory '$BUILD_DIR' to ensure a clean distribution build"
    rm -r "$BUILD_DIR"
else
    echo "outDir '$BUILD_DIR' is NOT within current working directory - NOT SAFE TO DELETE!"
    exit 1
fi

#
# Make sure that we're publishing the very latest stuff by running the "build" step.
#

npm run build
