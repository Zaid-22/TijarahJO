using TijarahJo.Domain.Enums;

namespace TijarahJo.Application.Common;

public static class PostStatusPolicy
{
    // Enum-backed constants for backward compatibility
    public const int Active = (int)PostStatus.Active;
    public const int Blocked = (int)PostStatus.Blocked;
    public const int Sold = (int)PostStatus.Sold;

    public const string AllowedApiStatuses = "ACTIVE, BLOCKED, SOLD";
    public const string SoftDeleteApiAliases = "DELETED, INACTIVE";
    public const string AllowedPersistedStatusIds = "0, 1, 3";

    public static string ToClientStatus(int dbStatus, bool isDeleted)
    {
        if (isDeleted)
        {
            return "DELETED";
        }

        return (PostStatus)dbStatus switch
        {
            PostStatus.Blocked => "BLOCKED",
            PostStatus.Sold => "SOLD",
            _ => "ACTIVE"
        };
    }

    public static bool TryNormalizeClientStatus(string? rawStatus, out string normalizedStatus)
    {
        normalizedStatus = (rawStatus ?? string.Empty).Trim().ToUpperInvariant();
        return normalizedStatus is "ACTIVE" or "SOLD" or "DELETED" or "BLOCKED";
    }

    public static bool IsSoftDeleteAlias(string? rawStatus)
    {
        string normalized = (rawStatus ?? string.Empty).Trim().ToUpperInvariant();
        return normalized is "DELETED" or "INACTIVE";
    }

    public static bool TryParseApiStatus(string? rawStatus, out int dbStatus)
    {
        dbStatus = Active;
        string normalized = (rawStatus ?? string.Empty).Trim().ToUpperInvariant();
        if (normalized.Length == 0)
        {
            return false;
        }

        switch (normalized)
        {
            case "ACTIVE":
                dbStatus = Active;
                return true;
            case "BLOCKED":
                dbStatus = Blocked;
                return true;
            case "SOLD":
                dbStatus = Sold;
                return true;
            default:
                return false;
        }
    }

    public static bool IsModerationState(int dbStatus)
    {
        return (PostStatus)dbStatus == PostStatus.Blocked;
    }

    public static bool IsPubliclyVisible(int dbStatus, bool isDeleted)
    {
        return !isDeleted && dbStatus is Active or Sold;
    }

    public static bool IsAllowedPersistedStatus(int dbStatus)
    {
        return Enum.IsDefined(typeof(PostStatus), dbStatus);
    }

    public static string ToSqlCaseExpression(string postAlias)
    {
        string alias = string.IsNullOrWhiteSpace(postAlias) ? "p" : postAlias.Trim();
        return
            $"CASE WHEN {alias}.IsDeleted = 1 THEN 'DELETED' " +
            $"WHEN {alias}.Status = {Blocked} THEN 'BLOCKED' " +
            $"WHEN {alias}.Status = {Sold} THEN 'SOLD' ELSE 'ACTIVE' END";
    }
}
