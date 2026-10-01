using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TijarahJo.Domain.Models;
using TijarahJo.Application.Abstractions.DataAccess;
using TijarahJo.Application.Common;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.DataAccess;

public sealed class UserDataAccessAdapter(TijarahJoDbContext dbContext, ILogger<UserDataAccessAdapter> logger) : IUserDataAccess
{
    private readonly TijarahJoDbContext _dbContext = dbContext;
    private readonly ILogger<UserDataAccessAdapter> _logger = logger;

    public async Task<UserModel?> GetUserByIDAsync(int? userId, CancellationToken cancellationToken = default)
    {
        if (!userId.HasValue || userId.Value < 1)
        {
            return null;
        }

        UserEntity? entity = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.UserID == userId.Value, cancellationToken);
        return entity is null ? null : ToPublicModel(entity);
    }

    public async Task<int> AddUserAsync(UserModel user, CancellationToken cancellationToken = default)
    {
        var entity = new UserEntity
        {
            HashedPassword = user.HashedPassword,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Phone = user.Phone,
            CityID = user.CityId,
            AreaID = user.AreaId,
            Bio = user.Bio,
            Avatar = user.Avatar,
            JoinDate = user.JoinDate == default ? DateTime.UtcNow : user.JoinDate,
            Status = user.Status,
            RoleID = user.RoleID,
            IsDeleted = user.IsDeleted,
            TwoFactorEnabled = user.TwoFactorEnabled,
            TwoFactorSecret = user.TwoFactorSecret,
            TwoFactorPendingSecret = user.TwoFactorPendingSecret,
            IsEmailVerified = user.IsEmailVerified
        };

        await _dbContext.Users.AddAsync(entity, cancellationToken);
        _dbContext.AuditActorUserId = null; // new user — no actor yet
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity.UserID;
    }

    public async Task<bool> UpdateUserFieldsAsync(
        UserModel user,
        int actorUserId,
        UserUpdateFields fields,
        CancellationToken cancellationToken = default)
    {
        return await UpdateUserCoreAsync(user, actorUserId, fields, cancellationToken);
    }

    public async Task<bool> UpdatePasswordHashForCredentialRehashAsync(
        int userId,
        string expectedHashedPassword,
        string replacementHashedPassword,
        CancellationToken cancellationToken = default)
    {
        if (userId < 1 ||
            string.IsNullOrWhiteSpace(expectedHashedPassword) ||
            string.IsNullOrWhiteSpace(replacementHashedPassword) ||
            string.Equals(expectedHashedPassword, replacementHashedPassword, StringComparison.Ordinal))
        {
            return false;
        }

        int updatedRows = await _dbContext.Users
            .Where(user =>
                user.UserID == userId &&
                user.HashedPassword == expectedHashedPassword)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    user => user.HashedPassword,
                    replacementHashedPassword),
                cancellationToken);

        return updatedRows == 1;
    }

    private async Task<bool> UpdateUserCoreAsync(
        UserModel user,
        int actorUserId,
        UserUpdateFields fields,
        CancellationToken cancellationToken)
    {
        if (!user.UserID.HasValue ||
            user.UserID.Value < 1 ||
            actorUserId < 1 ||
            fields == UserUpdateFields.None)
        {
            return false;
        }

        UserEntity? entity = await _dbContext.Users
            .FirstOrDefaultAsync(item => item.UserID == user.UserID.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        bool securityStateChanged = ApplyUserUpdateFields(entity, user, fields);
        if (securityStateChanged)
        {
            entity.LastInvalidatedAt = DateTime.UtcNow;
        }

        _dbContext.AuditActorUserId = actorUserId;
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Failed to update user {UserId}", user.UserID);
            return false;
        }
    }

    internal static bool ApplyUserUpdateFields(
        UserEntity entity,
        UserModel user,
        UserUpdateFields fields)
    {
        ArgumentNullException.ThrowIfNull(entity);
        ArgumentNullException.ThrowIfNull(user);

        string originalHashedPassword = entity.HashedPassword;
        string originalEmail = entity.Email;
        int originalStatus = entity.Status;
        int originalRoleId = entity.RoleID;
        bool originalIsDeleted = entity.IsDeleted;
        bool originalTwoFactorEnabled = entity.TwoFactorEnabled;
        string? originalTwoFactorSecret = entity.TwoFactorSecret;
        DateTime? originalSuspendedUntil = entity.SuspendedUntil;

        if (fields.HasFlag(UserUpdateFields.HashedPassword) &&
            !string.IsNullOrWhiteSpace(user.HashedPassword))
        {
            entity.HashedPassword = user.HashedPassword;
        }
        if (fields.HasFlag(UserUpdateFields.Email)) entity.Email = user.Email;
        if (fields.HasFlag(UserUpdateFields.FirstName)) entity.FirstName = user.FirstName;
        if (fields.HasFlag(UserUpdateFields.LastName)) entity.LastName = user.LastName;
        if (fields.HasFlag(UserUpdateFields.Phone)) entity.Phone = user.Phone;
        if (fields.HasFlag(UserUpdateFields.Location))
        {
            entity.CityID = user.CityId;
            entity.AreaID = user.AreaId;
        }
        if (fields.HasFlag(UserUpdateFields.Bio)) entity.Bio = user.Bio;
        if (fields.HasFlag(UserUpdateFields.Avatar)) entity.Avatar = user.Avatar;
        if (fields.HasFlag(UserUpdateFields.Status)) entity.Status = user.Status;
        if (fields.HasFlag(UserUpdateFields.Role)) entity.RoleID = user.RoleID;
        if (fields.HasFlag(UserUpdateFields.IsDeleted)) entity.IsDeleted = user.IsDeleted;
        if (fields.HasFlag(UserUpdateFields.TwoFactorEnabled)) entity.TwoFactorEnabled = user.TwoFactorEnabled;
        if (fields.HasFlag(UserUpdateFields.TwoFactorSecret)) entity.TwoFactorSecret = user.TwoFactorSecret;
        if (fields.HasFlag(UserUpdateFields.TwoFactorPendingSecret))
        {
            entity.TwoFactorPendingSecret = user.TwoFactorPendingSecret;
        }
        if (fields.HasFlag(UserUpdateFields.SuspendedUntil)) entity.SuspendedUntil = user.SuspendedUntil;
        if (fields.HasFlag(UserUpdateFields.IsEmailVerified)) entity.IsEmailVerified = user.IsEmailVerified;

        return
            !string.Equals(originalHashedPassword, entity.HashedPassword, StringComparison.Ordinal) ||
            !string.Equals(originalEmail, entity.Email, StringComparison.OrdinalIgnoreCase) ||
            originalStatus != entity.Status ||
            originalRoleId != entity.RoleID ||
            originalIsDeleted != entity.IsDeleted ||
            originalTwoFactorEnabled != entity.TwoFactorEnabled ||
            !string.Equals(originalTwoFactorSecret, entity.TwoFactorSecret, StringComparison.Ordinal) ||
            originalSuspendedUntil != entity.SuspendedUntil;
    }

    public async Task<bool> DeleteUserAsync(int? userId, int actorUserId, CancellationToken cancellationToken = default)
    {
        if (!userId.HasValue || userId.Value < 1 || actorUserId < 1)
        {
            return false;
        }

        UserEntity? entity = await _dbContext.Users
            .FirstOrDefaultAsync(item => item.UserID == userId.Value, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        if (entity.IsDeleted)
        {
            return false;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await _dbContext.Posts
                .Where(item => item.UserID == userId.Value && !item.IsDeleted)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.IsDeleted, true),
                    cancellationToken
                );

            // Audit: ExecuteUpdateAsync bypasses change tracker, so log manually
            _dbContext.AuditLogs.Add(new AuditLogEntity
            {
                TableName = "Posts",
                Action = "UPDATE",
                ChangedByUserID = actorUserId,
                ChangedAt = DateTime.UtcNow,
                OldValues = $"{{\"UserID\":{userId.Value},\"IsDeleted\":false}}",
                NewValues = $"{{\"UserID\":{userId.Value},\"IsDeleted\":true}}"
            });

            await _dbContext.Favorites
                .Where(item => item.UserID == userId.Value && !item.IsDeleted)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.IsDeleted, true),
                    cancellationToken
                );

            _dbContext.AuditLogs.Add(new AuditLogEntity
            {
                TableName = "Favorites",
                Action = "UPDATE",
                ChangedByUserID = actorUserId,
                ChangedAt = DateTime.UtcNow,
                OldValues = $"{{\"UserID\":{userId.Value},\"IsDeleted\":false}}",
                NewValues = $"{{\"UserID\":{userId.Value},\"IsDeleted\":true}}"
            });

            ApplyDeletionState(entity, DateTime.UtcNow);
            _dbContext.AuditActorUserId = actorUserId;
            bool deleted = await _dbContext.SaveChangesAsync(cancellationToken) > 0;
            if (!deleted)
            {
                await transaction.RollbackAsync(cancellationToken);
                return false;
            }

            await transaction.CommitAsync(cancellationToken);
            return true;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    internal static void ApplyDeletionState(UserEntity entity, DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(entity);
        entity.IsDeleted = true;
        entity.LastInvalidatedAt = utcNow;
    }

    public async Task<bool> DoesUserExistAsync(int? userId, CancellationToken cancellationToken = default)
    {
        return userId.HasValue
               && userId.Value > 0
               && await _dbContext.Users
                   .AsNoTracking()
                   .AnyAsync(item => item.UserID == userId.Value, cancellationToken);
    }

    public async Task<IReadOnlyList<UserModel>> GetAllUsersAsync(int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        int safePage = Math.Max(1, pageNumber);
        int safeSize = Math.Clamp(pageSize, 1, 1000);

        List<UserEntity> entities = await _dbContext.Users
            .AsNoTracking()
            .Where(item => !item.IsDeleted)
            .OrderBy(item => item.UserID)
            .Skip((safePage - 1) * safeSize)
            .Take(safeSize)
            .ToListAsync(cancellationToken);

        return [.. entities.Select(ToPublicModel)];
    }

    public async Task<UserModel?> GetUserByLoginAsync(string login, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(login))
        {
            return null;
        }

        string trimmedLogin = login.Trim();
        IQueryable<UserEntity> query = _dbContext.Users
            .AsNoTracking()
            .Where(item => !item.IsDeleted);

        if (trimmedLogin.Contains('@'))
        {
            query = query.Where(item => item.Email == trimmedLogin);
        }
        else
        {
            string? normalizedPhone = NormalizePhoneLookup(trimmedLogin);
            if (!string.IsNullOrWhiteSpace(normalizedPhone))
            {
                query = query.Where(item => item.Phone == normalizedPhone);
            }
            else
            {
                query = query.Where(item => item.Email == trimmedLogin);
            }
        }

        UserEntity? entity = await query.FirstOrDefaultAsync(cancellationToken);
        return entity is null ? null : ToModel(entity);
    }

    public async Task<UserModel?> GetUserByLoginCandidatesAsync(IReadOnlyList<string> candidates, CancellationToken cancellationToken = default)
    {
        if (candidates == null || candidates.Count == 0)
        {
            return null;
        }

        // Build a single WHERE (Email IN (...) OR Phone IN (...)) query
        var emails = new List<string>();
        var phones = new List<string>();

        foreach (string candidate in candidates)
        {
            string trimmed = candidate.Trim();
            if (string.IsNullOrWhiteSpace(trimmed)) continue;

            if (trimmed.Contains('@'))
            {
                emails.Add(trimmed);
            }
            else
            {
                string? normalizedPhone = NormalizePhoneLookup(trimmed);
                if (!string.IsNullOrWhiteSpace(normalizedPhone))
                    phones.Add(normalizedPhone);
                else
                    emails.Add(trimmed); // treat unknown format as email
            }
        }

        UserEntity? entity = await _dbContext.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted &&
                ((u.Email != null && emails.Contains(u.Email)) ||
                 (u.Phone != null && phones.Contains(u.Phone))))
            .FirstOrDefaultAsync(cancellationToken);

        return entity is null ? null : ToModel(entity);
    }

    private static string? NormalizePhoneLookup(string rawLogin)
    {
        return PhoneNumberNormalizer.NormalizeJordanPhone(rawLogin);
    }

    private static UserModel ToModel(UserEntity entity)
    {
        return new UserModel(
            entity.UserID,
            entity.HashedPassword,
            entity.Email,
            entity.FirstName,
            entity.LastName ?? string.Empty,
            entity.Phone,
            entity.CityID,
            entity.AreaID,
            entity.Bio,
            entity.Avatar,
            entity.JoinDate,
            entity.Status,
            entity.RoleID,
            entity.IsDeleted,
            entity.TwoFactorEnabled,
            entity.TwoFactorSecret,
            entity.TwoFactorPendingSecret,
            entity.SuspendedUntil,
            entity.IsEmailVerified
        );
    }

    /// <summary>
    /// Maps entity to model with HashedPassword stripped.
    /// Use for non-auth read paths (profile views, user lists).
    /// </summary>
    private static UserModel ToPublicModel(UserEntity entity)
    {
        return ToModel(entity) with { HashedPassword = string.Empty };
    }
}
