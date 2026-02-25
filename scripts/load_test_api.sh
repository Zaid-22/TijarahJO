#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5033}"
# Defaults tuned for local CI/dev machine capacity.
# Increase via env vars for higher-pressure profiling.
CONCURRENCY="${CONCURRENCY:-10}"
# Three probes run sequentially; keep default volume below typical fixed-window limits.
REQUESTS_PER_PROBE="${REQUESTS_PER_PROBE:-30}"
WARMUP_REQUESTS="${WARMUP_REQUESTS:-5}"
LOAD_MIN_SUCCESS_RATE="${LOAD_MIN_SUCCESS_RATE:-0.98}"
LOAD_MAX_P95_FEED_MS="${LOAD_MAX_P95_FEED_MS:-800}"
LOAD_MAX_P95_SEARCH_MS="${LOAD_MAX_P95_SEARCH_MS:-1000}"
LOAD_MAX_P95_TOP_SELLERS_MS="${LOAD_MAX_P95_TOP_SELLERS_MS:-900}"
FEED_PROBE_PATH="${FEED_PROBE_PATH:-/api/v1/posts/feed?page=1&limit=20}"
SEARCH_PROBE_PATH="${SEARCH_PROBE_PATH:-/api/v1/search?query=a&page=1&limit=20}"
TOP_SELLERS_PROBE_PATH="${TOP_SELLERS_PROBE_PATH:-/api/v1/sellers/top?take=10}"
REPORT_FILE="${REPORT_FILE:-/tmp/tijarahjo_api_load_report.json}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required for load testing." >&2
  exit 1
fi

if ! [[ "$CONCURRENCY" =~ ^[0-9]+$ ]] || [ "$CONCURRENCY" -lt 1 ]; then
  echo "Error: CONCURRENCY must be a positive integer." >&2
  exit 1
fi

if ! [[ "$REQUESTS_PER_PROBE" =~ ^[0-9]+$ ]] || [ "$REQUESTS_PER_PROBE" -lt 1 ]; then
  echo "Error: REQUESTS_PER_PROBE must be a positive integer." >&2
  exit 1
fi

if ! [[ "$WARMUP_REQUESTS" =~ ^[0-9]+$ ]]; then
  echo "Error: WARMUP_REQUESTS must be a non-negative integer." >&2
  exit 1
fi

if ! curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL/swagger/index.html" | grep -q '^200$'; then
  echo "Error: backend is unreachable at $BASE_URL (swagger health preflight failed)." >&2
  exit 1
fi

calc_percentile() {
  local file="$1"
  local percentile="$2"
  awk -v p="$percentile" '
    { values[NR] = $1 }
    END {
      if (NR == 0) {
        printf "0.000";
        exit;
      }
      idx = int((p / 100.0) * NR + 0.999999);
      if (idx < 1) idx = 1;
      if (idx > NR) idx = NR;
      printf "%.3f", values[idx];
    }
  ' "$file"
}

set_probe_metric() {
  local probe_name="$1"
  local metric_name="$2"
  local metric_value="$3"
  eval "PROBE_${probe_name}_${metric_name}=\"\$metric_value\""
}

get_probe_metric() {
  local probe_name="$1"
  local metric_name="$2"
  eval "printf '%s' \"\${PROBE_${probe_name}_${metric_name}:-}\""
}

get_probe_p95_threshold() {
  local probe_name="$1"
  if [ "$probe_name" = "feed" ]; then
    printf '%s' "$LOAD_MAX_P95_FEED_MS"
  elif [ "$probe_name" = "search" ]; then
    printf '%s' "$LOAD_MAX_P95_SEARCH_MS"
  else
    printf '%s' "$LOAD_MAX_P95_TOP_SELLERS_MS"
  fi
}

run_probe() {
  local probe_name="$1"
  local probe_path="$2"
  local probe_p95_limit="$3"
  local output_file="$TMP_DIR/${probe_name}.csv"
  local sorted_ms_file="$TMP_DIR/${probe_name}.ms.sorted"
  local target_url="${BASE_URL}${probe_path}"

  if [ "$WARMUP_REQUESTS" -gt 0 ]; then
    for _ in $(seq 1 "$WARMUP_REQUESTS"); do
      curl -sS -o /dev/null "$target_url" || true
    done
  fi

  seq "$REQUESTS_PER_PROBE" | xargs -P "$CONCURRENCY" -I{} sh -c '
    curl -sS -o /dev/null -w "%{http_code},%{time_total}\n" "$1" || printf "000,0\n"
  ' _ "$target_url" > "$output_file"

  local total success failure
  total="$(wc -l < "$output_file" | tr -d ' ')"
  success="$(awk -F, '$1 ~ /^2[0-9][0-9]$/ { count++ } END { print count + 0 }' "$output_file")"
  failure=$((total - success))

  local success_rate
  success_rate="$(awk -v s="$success" -v t="$total" 'BEGIN { if (t == 0) { printf "0.0000" } else { printf "%.4f", s / t } }')"

  awk -F, '{ printf "%.3f\n", ($2 + 0) * 1000 }' "$output_file" | sort -n > "$sorted_ms_file"

  local p50 p95 p99 avg max
  p50="$(calc_percentile "$sorted_ms_file" 50)"
  p95="$(calc_percentile "$sorted_ms_file" 95)"
  p99="$(calc_percentile "$sorted_ms_file" 99)"
  avg="$(awk '{ sum += $1 } END { if (NR == 0) printf "0.000"; else printf "%.3f", sum / NR }' "$sorted_ms_file")"
  max="$(tail -n 1 "$sorted_ms_file" 2>/dev/null || printf "0.000")"

  set_probe_metric "$probe_name" "total" "$total"
  set_probe_metric "$probe_name" "success" "$success"
  set_probe_metric "$probe_name" "failure" "$failure"
  set_probe_metric "$probe_name" "success_rate" "$success_rate"
  set_probe_metric "$probe_name" "p50" "$p50"
  set_probe_metric "$probe_name" "p95" "$p95"
  set_probe_metric "$probe_name" "p99" "$p99"
  set_probe_metric "$probe_name" "avg" "$avg"
  set_probe_metric "$probe_name" "max" "$max"

  local passed=true
  if ! awk -v actual="$success_rate" -v min="$LOAD_MIN_SUCCESS_RATE" 'BEGIN { exit(actual + 0 >= min + 0 ? 0 : 1) }'; then
    passed=false
  fi
  if ! awk -v actual="$p95" -v max_allowed="$probe_p95_limit" 'BEGIN { exit(actual + 0 <= max_allowed + 0 ? 0 : 1) }'; then
    passed=false
  fi
  set_probe_metric "$probe_name" "pass" "$passed"
}

echo "Running API load probes against $BASE_URL"
echo "Concurrency=$CONCURRENCY RequestsPerProbe=$REQUESTS_PER_PROBE MinSuccessRate=$LOAD_MIN_SUCCESS_RATE"
echo

run_probe "feed" "$FEED_PROBE_PATH" "$LOAD_MAX_P95_FEED_MS"
run_probe "search" "$SEARCH_PROBE_PATH" "$LOAD_MAX_P95_SEARCH_MS"
run_probe "top_sellers" "$TOP_SELLERS_PROBE_PATH" "$LOAD_MAX_P95_TOP_SELLERS_MS"

for probe in feed search top_sellers; do
  total="$(get_probe_metric "$probe" "total")"
  success="$(get_probe_metric "$probe" "success")"
  failure="$(get_probe_metric "$probe" "failure")"
  success_rate="$(get_probe_metric "$probe" "success_rate")"
  p50="$(get_probe_metric "$probe" "p50")"
  p95="$(get_probe_metric "$probe" "p95")"
  p99="$(get_probe_metric "$probe" "p99")"
  avg="$(get_probe_metric "$probe" "avg")"
  max="$(get_probe_metric "$probe" "max")"
  threshold="$(get_probe_p95_threshold "$probe")"
  result="$(get_probe_metric "$probe" "pass")"

  echo "Probe: $probe"
  echo "  Total=${total} Success=${success} Failure=${failure} SuccessRate=${success_rate}"
  echo "  LatencyMs p50=${p50} p95=${p95} p99=${p99} avg=${avg} max=${max}"
  echo "  Thresholds successRate>=${LOAD_MIN_SUCCESS_RATE} p95<=${threshold}"
  echo "  Result=${result}"
  echo
done

feed_pass="$(get_probe_metric feed pass)"
feed_total="$(get_probe_metric feed total)"
feed_success="$(get_probe_metric feed success)"
feed_failure="$(get_probe_metric feed failure)"
feed_success_rate="$(get_probe_metric feed success_rate)"
feed_p50="$(get_probe_metric feed p50)"
feed_p95="$(get_probe_metric feed p95)"
feed_p99="$(get_probe_metric feed p99)"
feed_avg="$(get_probe_metric feed avg)"
feed_max="$(get_probe_metric feed max)"

search_pass="$(get_probe_metric search pass)"
search_total="$(get_probe_metric search total)"
search_success="$(get_probe_metric search success)"
search_failure="$(get_probe_metric search failure)"
search_success_rate="$(get_probe_metric search success_rate)"
search_p50="$(get_probe_metric search p50)"
search_p95="$(get_probe_metric search p95)"
search_p99="$(get_probe_metric search p99)"
search_avg="$(get_probe_metric search avg)"
search_max="$(get_probe_metric search max)"

top_sellers_pass="$(get_probe_metric top_sellers pass)"
top_sellers_total="$(get_probe_metric top_sellers total)"
top_sellers_success="$(get_probe_metric top_sellers success)"
top_sellers_failure="$(get_probe_metric top_sellers failure)"
top_sellers_success_rate="$(get_probe_metric top_sellers success_rate)"
top_sellers_p50="$(get_probe_metric top_sellers p50)"
top_sellers_p95="$(get_probe_metric top_sellers p95)"
top_sellers_p99="$(get_probe_metric top_sellers p99)"
top_sellers_avg="$(get_probe_metric top_sellers avg)"
top_sellers_max="$(get_probe_metric top_sellers max)"

cat > "$REPORT_FILE" <<JSON
{
  "generatedAtUtc": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "baseUrl": "$BASE_URL",
  "concurrency": $CONCURRENCY,
  "requestsPerProbe": $REQUESTS_PER_PROBE,
  "warmupRequestsPerProbe": $WARMUP_REQUESTS,
  "thresholds": {
    "minSuccessRate": $LOAD_MIN_SUCCESS_RATE,
    "feedP95Ms": $LOAD_MAX_P95_FEED_MS,
    "searchP95Ms": $LOAD_MAX_P95_SEARCH_MS,
    "topSellersP95Ms": $LOAD_MAX_P95_TOP_SELLERS_MS
  },
  "probes": {
    "feed": {
      "passed": ${feed_pass},
      "total": ${feed_total},
      "success": ${feed_success},
      "failure": ${feed_failure},
      "successRate": ${feed_success_rate},
      "latencyMs": {
        "p50": ${feed_p50},
        "p95": ${feed_p95},
        "p99": ${feed_p99},
        "avg": ${feed_avg},
        "max": ${feed_max}
      }
    },
    "search": {
      "passed": ${search_pass},
      "total": ${search_total},
      "success": ${search_success},
      "failure": ${search_failure},
      "successRate": ${search_success_rate},
      "latencyMs": {
        "p50": ${search_p50},
        "p95": ${search_p95},
        "p99": ${search_p99},
        "avg": ${search_avg},
        "max": ${search_max}
      }
    },
    "topSellers": {
      "passed": ${top_sellers_pass},
      "total": ${top_sellers_total},
      "success": ${top_sellers_success},
      "failure": ${top_sellers_failure},
      "successRate": ${top_sellers_success_rate},
      "latencyMs": {
        "p50": ${top_sellers_p50},
        "p95": ${top_sellers_p95},
        "p99": ${top_sellers_p99},
        "avg": ${top_sellers_avg},
        "max": ${top_sellers_max}
      }
    }
  }
}
JSON

echo "Load test report: $REPORT_FILE"

if [ "$feed_pass" != "true" ] || [ "$search_pass" != "true" ] || [ "$top_sellers_pass" != "true" ]; then
  echo "Load test failed threshold gates." >&2
  exit 1
fi

echo "Load test passed threshold gates."
