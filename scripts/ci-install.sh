#!/usr/bin/env bash
set -euo pipefail

install_runtyp_from_source() {
  local ref="${1:-main}"
  git clone --depth 1 --branch "$ref" https://github.com/logfoxai/runtyp.git /tmp/runtyp
  (
    cd /tmp/runtyp
    npm ci
    npm run build
    npm pack --pack-destination "$GITHUB_WORKSPACE"
  )
  npm install "$GITHUB_WORKSPACE"/runtyp-*.tgz
}

if npm view runtyp@2.5.0 version >/dev/null 2>&1; then
  npm install runtyp@2.5.0
else
  install_runtyp_from_source feat/to-json-schema || install_runtyp_from_source main
fi

npm install
