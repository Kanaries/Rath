#!/usr/bin/env bash
# UI migration gates -- strict mode. Any non-zero count fails.
set -uo pipefail

SRC=packages/rath-client/src
fail=0

report_count() {
    local label="$1"
    local count="$2"
    echo "== $label =="
    echo "$count"
    if [ "$count" -ne 0 ]; then
        fail=1
    fi
}

count_matches() {
    rg -c "$1" "${@:2}" | awk -F: '{s+=$2} END {print s+0}'
}

count_ms_classes() {
    rg -n "\\bms-[A-Za-z]" "$SRC" \
        | rg -v "application/vnd\\.ms-excel|-ms-" \
        | wc -l \
        | tr -d ' '
}

report_count "fluent v8 imports" "$(rg -l "from ['\"]@fluentui/react['\"]" "$SRC" | wc -l | tr -d ' ')"
report_count "fluent v9 imports" "$(rg -l "from ['\"]@fluentui/react-components['\"]" "$SRC" | wc -l | tr -d ' ')"
report_count "iconName usages" "$(count_matches "iconName" "$SRC")"
report_count "iconProps usages" "$(count_matches "iconProps" "$SRC")"
report_count "Stack usages" "$(count_matches "<Stack" "$SRC")"
report_count "ms-* classes" "$(count_ms_classes)"
report_count "fabric css import" "$(count_matches "office-ui-fabric-core" "$SRC" packages/rath-client/package.json)"
report_count "initializeIcons" "$(count_matches "initializeIcons" "$SRC")"
report_count "fluent package references across workspaces" "$(count_matches "@fluentui/(react|react-components|react-icons)" packages --glob 'package.json' --glob '*.{ts,tsx,js,jsx}')"
report_count "fabric icon font assets" "$(find packages -type f -iname '*fabric-icon*' | wc -l | tr -d ' ')"
report_count "ali-react-table references" "$(count_matches "ali-react-table" "$SRC" packages/rath-client/package.json)"

exit "$fail"
