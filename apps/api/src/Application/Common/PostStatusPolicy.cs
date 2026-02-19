namespace TijarahJoDB.Application.Common;

public static class PostStatusPolicy
{
    public const int Active = 0;
    public const int Blocked = 1;
    public const int Deleted = 2;
    public const int Sold = 3;
    public const string AllowedApiStatuses = "ACTIVE, BLOCKED, DELETED, SOLD";

    public static string ToClientStatus(int dbStatus, bool isDeleted)
    {
        if (isDeleted || dbStatus == Blocked || dbStatus == Deleted)
        {
            return "DELETED";
        }

        return dbStatus == Sold ? "SOLD" : "ACTIVE";
    }

    public static bool TryNormalizeClientStatus(string? rawStatus, out string normalizedStatus)
    {
        normalizedStatus = (rawStatus ?? string.Empty).Trim().ToUpperInvariant();
        return normalizedStatus is "ACTIVE" or "SOLD" or "DELETED";
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
            case "INACTIVE":
            case "DELETED":
                dbStatus = Deleted;
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
        return dbStatus is Blocked or Deleted;
    }

    public static string ToSqlCaseExpression(string postAlias)
    {
        string alias = string.IsNullOrWhiteSpace(postAlias) ? "p" : postAlias.Trim();
        return $"CASE WHEN {alias}.IsDeleted = 1 OR {alias}.Status IN ({Blocked}, {Deleted}) THEN 'DELETED' WHEN {alias}.Status = {Sold} THEN 'SOLD' ELSE 'ACTIVE' END";
    }
}
