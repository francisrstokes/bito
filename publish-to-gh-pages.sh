#!/usr/bin/env bash

set -e

npm run build
git checkout gh-pages

rm index.*
rm src.*
mv dist/* .
git add .
git commit
git push origin gh-pages
