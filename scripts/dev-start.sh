#!/usr/bin/env bash
set -e

yarn install
yarn build:utils
yarn build:scenegraph
yarn build:renderer
yarn workspace rath-client start
