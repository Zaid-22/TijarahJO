#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
THRESHOLDS_FILE="$SCRIPT_DIR/performance_thresholds.env"

CONTAINER_NAME="${CONTAINER_NAME:-tijarahjo-db}"
SQLCMD_IN_CONTAINER="${SQLCMD_IN_CONTAINER:-/opt/mssql-tools18/bin/sqlcmd}"
SQLCMD_UTF8_FLAGS=(-f 65001)
PERF_REPORT_FILE="${PERF_REPORT_FILE:-/tmp/tijarahjo_performance_baseline.json}"

if [[ -z "${MSSQL_SA_PASSWORD:-}" ]]; then
  echo "Error: MSSQL_SA_PASSWORD is required to run SQL performance baselines." >&2
  exit 1
fi

if [[ -f "$THRESHOLDS_FILE" ]]; then
  # shellcheck disable=SC1091
  source "$THRESHOLDS_FILE"
fi

PERF_MAX_FEED_MS="${PERF_MAX_FEED_MS:-400}"
PERF_MAX_SEARCH_MS="${PERF_MAX_SEARCH_MS:-500}"
PERF_MAX_TOP_SELLERS_MS="${PERF_MAX_TOP_SELLERS_MS:-450}"
PERF_MAX_CHAT_HISTORY_MS="${PERF_MAX_CHAT_HISTORY_MS:-300}"

if ! docker ps --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  echo "Error: SQL container '$CONTAINER_NAME' is not running." >&2
  exit 1
fi

run_probe() {
  local probe_name="$1"
  local threshold_ms="$2"
  local sql_payload="$3"

  local raw_output
  if ! raw_output="$(
    printf "%s\n" "$sql_payload" \
      | docker exec -i "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" "${SQLCMD_UTF8_FLAGS[@]}" \
        -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -W -h -1 2>&1
  )"; then
    echo "::error::${probe_name} probe execution failed." >&2
    echo "$raw_output" >&2
    return 1
  fi

  local duration_ms_raw
  duration_ms_raw="$(printf "%s\n" "$raw_output" | awk '/^-?[0-9]+$/ { value=$1 } END { print value }')"
  if [[ -z "$duration_ms_raw" ]]; then
    echo "::error::${probe_name} probe did not return a numeric duration." >&2
    echo "$raw_output" >&2
    return 1
  fi

  local duration_ms="$duration_ms_raw"
  if (( duration_ms < 0 )); then
    duration_ms=0
  fi

  if (( duration_ms > threshold_ms )); then
    echo "::error::${probe_name} query exceeded threshold (${duration_ms}ms > ${threshold_ms}ms)." >&2
    return 1
  fi

  printf "%s" "$duration_ms"
}

feed_sql=$(cat <<'SQL'
USE TijarahJoDB;
SET NOCOUNT ON;
DECLARE @StartedAt DATETIME2(3) = SYSUTCDATETIME();
DECLARE @Rows INT = 0;
SELECT @Rows = COUNT(1)
FROM (
    SELECT TOP (20)
        p.PostID
    FROM dbo.Posts AS p
    LEFT JOIN dbo.Categories AS c ON c.CategoryID = p.CategoryID
    WHERE p.IsDeleted = 0
    ORDER BY p.CreatedAt DESC, p.PostID DESC
) AS feed_probe;
SELECT CASE WHEN DATEDIFF(MILLISECOND, @StartedAt, SYSUTCDATETIME()) < 0 THEN 0 ELSE CAST(DATEDIFF(MILLISECOND, @StartedAt, SYSUTCDATETIME()) AS INT) END;
SQL
)

search_sql=$(cat <<'SQL'
USE TijarahJoDB;
SET NOCOUNT ON;
DECLARE @StartedAt DATETIME2(3) = SYSUTCDATETIME();
DECLARE @SearchPrefix NVARCHAR(64) = N'A%';
DECLARE @Rows INT = 0;
SELECT @Rows = COUNT(1)
FROM (
    SELECT TOP (20)
        p.PostID
    FROM dbo.Posts AS p
    INNER JOIN dbo.Categories AS c ON c.CategoryID = p.CategoryID
    INNER JOIN dbo.Users AS u ON u.UserID = p.UserID
    LEFT JOIN dbo.Cities AS ct ON ct.CityID = p.CityID
    LEFT JOIN dbo.Areas AS a ON a.AreaID = p.AreaID
    WHERE p.IsDeleted = 0
      AND p.Status IN (0, 3)
      AND
      (
        p.SearchTitleNormalized LIKE @SearchPrefix ESCAPE '\'
        OR p.SearchDescriptionPrefixNormalized LIKE @SearchPrefix ESCAPE '\'
        OR c.SearchCategoryNameNormalized LIKE @SearchPrefix ESCAPE '\'
        OR u.SearchFirstNameNormalized LIKE @SearchPrefix ESCAPE '\'
        OR u.SearchLastNameNormalized LIKE @SearchPrefix ESCAPE '\'
        OR u.SearchFullNameNormalized LIKE @SearchPrefix ESCAPE '\'
        OR ct.CityName LIKE @SearchPrefix ESCAPE '\'
        OR a.AreaName LIKE @SearchPrefix ESCAPE '\'
      )
    ORDER BY p.CreatedAt DESC, p.PostID DESC
) AS search_probe;
SELECT CASE WHEN DATEDIFF(MILLISECOND, @StartedAt, SYSUTCDATETIME()) < 0 THEN 0 ELSE CAST(DATEDIFF(MILLISECOND, @StartedAt, SYSUTCDATETIME()) AS INT) END;
SQL
)

top_sellers_sql=$(cat <<'SQL'
USE TijarahJoDB;
SET NOCOUNT ON;
DECLARE @StartedAt DATETIME2(3) = SYSUTCDATETIME();
DECLARE @Rows INT = 0;
SELECT @Rows = COUNT(1)
FROM (
    SELECT TOP (10)
        u.UserID
    FROM dbo.Users AS u
    INNER JOIN dbo.Posts AS p ON p.UserID = u.UserID
    LEFT JOIN dbo.Cities AS ct ON ct.CityID = u.CityID
    LEFT JOIN dbo.Areas AS a ON a.AreaID = u.AreaID
    WHERE u.IsDeleted = 0
      AND p.IsDeleted = 0
    GROUP BY
        u.UserID,
        u.FirstName,
        u.LastName,
        u.Email,
        u.JoinDate,
        ct.CityName,
        a.AreaName
    ORDER BY
        COUNT(CASE WHEN p.Status = 3 THEN 1 END) DESC,
        COUNT(CASE WHEN p.Status IN (0, 3) THEN 1 END) DESC,
        SUM(ISNULL(p.Views, 0)) DESC,
        u.UserID ASC
) AS top_sellers_probe;
SELECT CASE WHEN DATEDIFF(MILLISECOND, @StartedAt, SYSUTCDATETIME()) < 0 THEN 0 ELSE CAST(DATEDIFF(MILLISECOND, @StartedAt, SYSUTCDATETIME()) AS INT) END;
SQL
)

chat_history_sql=$(cat <<'SQL'
USE TijarahJoDB;
SET NOCOUNT ON;
DECLARE @StartedAt DATETIME2(3) = SYSUTCDATETIME();
DECLARE @Rows INT = 0;
SELECT @Rows = COUNT(1)
FROM (
    SELECT TOP (50)
        m.MessageID
    FROM dbo.Messages AS m
    INNER JOIN dbo.Conversations AS c ON c.ConversationID = m.ConversationID
    ORDER BY m.CreatedAt DESC, m.MessageID DESC
) AS chat_probe;
SELECT CASE WHEN DATEDIFF(MILLISECOND, @StartedAt, SYSUTCDATETIME()) < 0 THEN 0 ELSE CAST(DATEDIFF(MILLISECOND, @StartedAt, SYSUTCDATETIME()) AS INT) END;
SQL
)

feed_ms="$(run_probe "Feed listing" "$PERF_MAX_FEED_MS" "$feed_sql")"
search_ms="$(run_probe "Search listing" "$PERF_MAX_SEARCH_MS" "$search_sql")"
top_sellers_ms="$(run_probe "Top sellers" "$PERF_MAX_TOP_SELLERS_MS" "$top_sellers_sql")"
chat_history_ms="$(run_probe "Chat history" "$PERF_MAX_CHAT_HISTORY_MS" "$chat_history_sql")"

cat > "$PERF_REPORT_FILE" <<JSON
{
  "generatedAtUtc": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "workspace": "$ROOT_DIR",
  "thresholdsMs": {
    "feed": $PERF_MAX_FEED_MS,
    "search": $PERF_MAX_SEARCH_MS,
    "topSellers": $PERF_MAX_TOP_SELLERS_MS,
    "chatHistory": $PERF_MAX_CHAT_HISTORY_MS
  },
  "durationsMs": {
    "feed": $feed_ms,
    "search": $search_ms,
    "topSellers": $top_sellers_ms,
    "chatHistory": $chat_history_ms
  }
}
JSON

echo "Performance baseline report: $PERF_REPORT_FILE"
echo "Feed=${feed_ms}ms (threshold ${PERF_MAX_FEED_MS}ms)"
echo "Search=${search_ms}ms (threshold ${PERF_MAX_SEARCH_MS}ms)"
echo "TopSellers=${top_sellers_ms}ms (threshold ${PERF_MAX_TOP_SELLERS_MS}ms)"
echo "ChatHistory=${chat_history_ms}ms (threshold ${PERF_MAX_CHAT_HISTORY_MS}ms)"
