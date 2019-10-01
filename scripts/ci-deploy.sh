#!/bin/bash

set -e

error() {
    echo $1
    exit 1
}

[ "$CI" == "true" ] || error "Set CI=true to do deploy."

[ -d "./build" ] || error "./build folder not found."

echo "Current version: $npm_package_version"
