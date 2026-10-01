#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

CONTAINER_NAME="${CONTAINER_NAME:-tijarahjo-db}"
SQLCMD_IN_CONTAINER="${SQLCMD_IN_CONTAINER:-/opt/mssql-tools18/bin/sqlcmd}"
SQLCMD_UTF8_FLAGS=(-f 65001)
PLAN_OUTPUT_DIR="${PLAN_OUTPUT_DIR:-/tmp/tijarahjo_query_plans}"
PLAN_MANIFEST_FILE="${PLAN_MANIFEST_FILE:-$PLAN_OUTPUT_DIR/manifest.json}"

if [[ -z "${MSSQL_SA_PASSWORD:-}" ]]; then
  echo "Error: MSSQL_SA_PASSWORD is required to capture SQL query plans." >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  echo "Error: SQL container '$CONTAINER_NAME' is not running." >&2
  exit 1
fi

mkdir -p "$PLAN_OUTPUT_DIR"

write_plan() {
  local plan_name="$1"
  local sql_payload="$2"
  local output_file="$PLAN_OUTPUT_DIR/${plan_name}.sqlplan"

  local full_payload
  full_payload=$(cat <<SQL
SET SHOWPLAN_XML ON;
GO
$sql_payload
GO
SET SHOWPLAN_XML OFF;
GO
SQL
)

  local raw_output
  if ! raw_output="$(
    printf "%s\n" "$full_payload" \
      | docker exec -i "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" "${SQLCMD_UTF8_FLAGS[@]}" \
        -S localhost -d TijarahJoDB -U sa -P "$MSSQL_SA_PASSWORD" -C -b -w 65535 -y 0 -Y 0 2>&1
  )"; then
    echo "::error::Failed to capture query plan for '$plan_name'." >&2
    echo "$raw_output" >&2
    return 1
  fi

  printf "%s\n" "$raw_output" > "$output_file"

  if ! grep -q "<ShowPlanXML" "$output_file"; then
    echo "::error::No ShowPlan XML found for '$plan_name'." >&2
    return 1
  fi

  echo "Captured query plan: $output_file"
}

feed_sql=$(cat <<'SQL'
DECLARE @Offset INT = 0;
DECLARE @Limit INT = 20;
SELECT
    p.PostID,
    p.UserID,
    p.CategoryID,
    ISNULL(p.PostTitle, '') AS PostTitle,
    ISNULL(p.PostDescription, '') AS PostDescription,
    ISNULL(p.Price, 0) AS Price,
    ISNULL(ct.CityName, '') AS City,
    ISNULL(a.AreaName, '') AS Area,
    p.CreatedAt,
    ISNULL(p.Views, 0) AS Views,
    ISNULL(c.CategoryName, '') AS CategoryName,
    COALESCE(
        NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(u.FirstName, ''), ' ', ISNULL(u.LastName, '')))), ''),
        NULLIF(u.Email, ''),
        CONCAT('User ', p.UserID)
    ) AS SellerName,
    ISNULL(img.ImageURLs, '') AS ImageURLs
FROM dbo.Posts AS p
LEFT JOIN dbo.Categories AS c ON c.CategoryID = p.CategoryID
LEFT JOIN dbo.Users AS u ON u.UserID = p.UserID
LEFT JOIN dbo.Cities AS ct ON ct.CityID = p.CityID
LEFT JOIN dbo.Areas AS a ON a.AreaID = p.AreaID
OUTER APPLY
(
    SELECT STRING_AGG(pi.PostImageURL, NCHAR(31))
           WITHIN GROUP (ORDER BY pi.UploadedAt, pi.PostImageID) AS ImageURLs
    FROM dbo.PostImages AS pi
    WHERE pi.PostID = p.PostID
      AND ISNULL(pi.IsDeleted, 0) = 0
) AS img
WHERE p.IsDeleted = 0
  AND p.Status IN (0, 3)
ORDER BY p.CreatedAt DESC, p.PostID DESC
OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
SQL
)

search_sql=$(cat <<'SQL'
DECLARE @Offset INT = 0;
DECLARE @Limit INT = 20;
DECLARE @SearchPrefix NVARCHAR(450) = N'a%';
SELECT
    p.PostID,
    p.UserID,
    p.CategoryID,
    ISNULL(p.PostTitle, '') AS PostTitle,
    ISNULL(p.PostDescription, '') AS PostDescription,
    ISNULL(p.Price, 0) AS Price,
    ISNULL(ct.CityName, '') AS City,
    ISNULL(a.AreaName, '') AS Area,
    p.CreatedAt,
    ISNULL(p.Views, 0) AS Views,
    ISNULL(c.CategoryName, '') AS CategoryName,
    COALESCE(
        NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(u.FirstName, ''), ' ', ISNULL(u.LastName, '')))), ''),
        NULLIF(u.Email, ''),
        CONCAT('User ', p.UserID)
    ) AS SellerName,
    ISNULL(img.ImageURLs, '') AS ImageURLs
FROM dbo.Posts AS p
LEFT JOIN dbo.Categories AS c ON c.CategoryID = p.CategoryID
LEFT JOIN dbo.Users AS u ON u.UserID = p.UserID
LEFT JOIN dbo.Cities AS ct ON ct.CityID = p.CityID
LEFT JOIN dbo.Areas AS a ON a.AreaID = p.AreaID
OUTER APPLY
(
    SELECT STRING_AGG(pi.PostImageURL, NCHAR(31))
           WITHIN GROUP (ORDER BY pi.UploadedAt, pi.PostImageID) AS ImageURLs
    FROM dbo.PostImages AS pi
    WHERE pi.PostID = p.PostID
      AND ISNULL(pi.IsDeleted, 0) = 0
) AS img
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
OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
SQL
)

top_sellers_sql=$(cat <<'SQL'
DECLARE @Take INT = 10;
SELECT TOP (@Take)
    u.UserID,
    u.FirstName,
    u.LastName,
    u.Email,
    u.JoinDate,
    ct.CityName,
    a.AreaName,
    COUNT(CASE WHEN p.Status IN (0, 3) THEN 1 END) AS ActiveListingsCount,
    COUNT(CASE WHEN p.Status = 3 THEN 1 END) AS TotalSalesCount,
    SUM(ISNULL(p.Views, 0)) AS TotalViews
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
    u.UserID ASC;
SQL
)

write_plan "feed" "$feed_sql"
write_plan "search" "$search_sql"
write_plan "top_sellers" "$top_sellers_sql"

cat > "$PLAN_MANIFEST_FILE" <<JSON
{
  "generatedAtUtc": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "workspace": "$ROOT_DIR",
  "outputDirectory": "$PLAN_OUTPUT_DIR",
  "plans": {
    "feed": "$PLAN_OUTPUT_DIR/feed.sqlplan",
    "search": "$PLAN_OUTPUT_DIR/search.sqlplan",
    "topSellers": "$PLAN_OUTPUT_DIR/top_sellers.sqlplan"
  }
}
JSON

echo "Query plan manifest: $PLAN_MANIFEST_FILE"
