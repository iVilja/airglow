#!/bin/bash

set -e

error() {
    echo $1
    exit 1
}

[ "$CI" == "true" ] || error "Set CI=true to do deploy."

[ -d "./build" ] || error "./build folder not found."

if [[ "$1" == "--release" ]]
then
    TAGS=`git tag`
    STABLE_VERSION=`git describe --tags --abbrev=0 2>/dev/null` || echo "No stable version found."
fi

VERSION="v$npm_package_version"
echo "Current version: $VERSION"

[ -d "./gh-pages" ] && rm -rf ./gh-pages
mkdir ./gh-pages && cd ./gh-pages
git clone --single-branch --branch=gh-pages --depth=1 https://github.com/ryukina/airglow.git .
if [[ "$1" == "--release" ]]
then
    SUBVERSION=`echo $VERSION | sed -r 's/\.[[:digit:]]+$//'`
    rm -rf ./$SUBVERSION*
    cp ../build "./$VERSION" -r
    ln -s "./$VERSION" "./$SUBVERSION"
    echo "dev" > ./VERSIONS
    echo "$TAGS" >> ./VERSIONS
    if [[ -n $STABLE_VERSION ]]
    then
        [ -h "./stable" ] && rm "./stable"
        ln -s "./$STABLE_VERSION" "./stable"
    fi
    git add . && git commit -m "Auto deploy: $VERSION (`git rev-parse --short HEAD`)." \
        || echo "Nothing to commit."
else
    [ -d "./dev" ] && rm -rf ./dev
    cp ../build ./dev -r
    git add . && git commit -m "Auto deploy: `git rev-parse --short HEAD`." \
        || echo "Nothing to commit."
fi
git remote set-url --push origin https://${GITHUB_TOKEN}@github.com/ryukina/airglow.git
git push
