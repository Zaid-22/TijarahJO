using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence;

public sealed class TijarahJoDbContext(DbContextOptions<TijarahJoDbContext> options, TotpEncryptionKey? totpKey = null) : DbContext(options)
{

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<RoleEntity> Roles => Set<RoleEntity>();
    public DbSet<PostEntity> Posts => Set<PostEntity>();
    public DbSet<CategoryEntity> Categories => Set<CategoryEntity>();
    public DbSet<PostImageEntity> PostImages => Set<PostImageEntity>();
    public DbSet<FavoriteEntity> Favorites => Set<FavoriteEntity>();
    public DbSet<ConversationEntity> Conversations => Set<ConversationEntity>();
    public DbSet<MessageEntity> Messages => Set<MessageEntity>();
    public DbSet<ReviewEntity> Reviews => Set<ReviewEntity>();
    public DbSet<NotificationEntity> Notifications => Set<NotificationEntity>();
    public DbSet<PushSubscriptionEntity> PushSubscriptions => Set<PushSubscriptionEntity>();
    public DbSet<UserExternalIdentityEntity> UserExternalIdentities => Set<UserExternalIdentityEntity>();
    public DbSet<UserStatusLookupEntity> UserStatuses => Set<UserStatusLookupEntity>();
    public DbSet<PostStatusLookupEntity> PostStatuses => Set<PostStatusLookupEntity>();
    public DbSet<CityEntity> Cities => Set<CityEntity>();
    public DbSet<AreaEntity> Areas => Set<AreaEntity>();
    public DbSet<AuditLogEntity> AuditLogs => Set<AuditLogEntity>();
    public DbSet<BlacklistedTokenEntity> BlacklistedTokens => Set<BlacklistedTokenEntity>();
    public DbSet<SystemSettingEntity> SystemSettings => Set<SystemSettingEntity>();
    public DbSet<ReportEntity> Reports => Set<ReportEntity>();
    public DbSet<PermissionEntity> Permissions => Set<PermissionEntity>();
    public DbSet<RolePermissionEntity> RolePermissions => Set<RolePermissionEntity>();
    public DbSet<VerificationChallengeEntity> VerificationChallenges => Set<VerificationChallengeEntity>();
    public DbSet<HeroBannerEntity> HeroBanners => Set<HeroBannerEntity>();
    public DbSet<PostCommentEntity> PostComments => Set<PostCommentEntity>();
    public DbSet<DataHygieneLogEntity> DataHygieneLogs => Set<DataHygieneLogEntity>();

    // Set this to the current actor's UserID before calling SaveChangesAsync on a
    // mutating operation so that AuditLog entries carry the correct ChangedByUserID.
    // Reset to null after SaveChangesAsync returns.
    public int? AuditActorUserId { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TijarahJoDbContext).Assembly);

        // Apply at-rest encryption to TOTP secret columns
        if (totpKey is not null)
        {
            var converter = new AesGcmStringConverter(totpKey.Key);
            modelBuilder.Entity<UserEntity>(builder =>
            {
                builder.Property(e => e.TwoFactorSecret)
                    .HasConversion(converter);
                builder.Property(e => e.TwoFactorPendingSecret)
                    .HasConversion(converter);
            });

            // Encrypt PushSubscription auth keys at rest (Audit O5)
            modelBuilder.Entity<PushSubscriptionEntity>(builder =>
            {
                builder.Property(e => e.Auth)
                    .HasConversion((ValueConverter)converter);
            });
        }
    }

    // -------------------------------------------------------------------------
    // Audit interception — runs on every SaveChangesAsync call.
    // Captures INSERT/UPDATE/DELETE on audited entity types and writes
    // AuditLogEntity entries in the SAME transaction as the primary change.
    // -------------------------------------------------------------------------

    private static readonly HashSet<Type> _auditedTypes =
    [
        typeof(UserEntity),
        typeof(PostEntity),
        typeof(ReviewEntity),
        typeof(CategoryEntity),
        typeof(RoleEntity)
    ];

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var auditEntries = BuildAuditEntries();
        int result = await base.SaveChangesAsync(cancellationToken);

        // For INSERT entries the PK is only available after base.SaveChangesAsync.
        // Update those entries' RecordID and persist them.
        bool hasInsertAudits = false;
        foreach (var (entry, audit) in auditEntries)
        {
            if (audit.Action == "INSERT")
            {
                audit.RecordID = GetPrimaryKey(entry);
                hasInsertAudits = true;
            }
        }

        if (auditEntries.Count > 0 && hasInsertAudits)
        {
            await base.SaveChangesAsync(cancellationToken);
        }

        AuditActorUserId = null; // Reset after each save cycle
        return result;
    }

    private List<(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry, AuditLogEntity)> BuildAuditEntries()
    {
        ChangeTracker.DetectChanges();
        var now = DateTime.UtcNow;
        var actor = AuditActorUserId;
        var results = new List<(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry, AuditLogEntity)>();
        var trackedEntries = ChangeTracker.Entries().ToList();

        foreach (var entry in trackedEntries)
        {
            if (!_auditedTypes.Contains(entry.Entity.GetType())) continue;

            string? action = entry.State switch
            {
                Microsoft.EntityFrameworkCore.EntityState.Added    => "INSERT",
                Microsoft.EntityFrameworkCore.EntityState.Modified  => "UPDATE",
                Microsoft.EntityFrameworkCore.EntityState.Deleted   => "DELETE",
                _ => null
            };

            if (action is null) continue;

            var audit = new AuditLogEntity
            {
                TableName       = entry.Metadata.GetTableName() ?? entry.Entity.GetType().Name,
                RecordID        = action == "INSERT" ? 0 : GetPrimaryKey(entry), // 0 fixed after save for INSERT
                Action          = action,
                ChangedByUserID = actor,
                ChangedAt       = now,
                OldValues       = action != "INSERT" ? SerializeValues(entry.OriginalValues) : null,
                NewValues       = action != "DELETE"  ? SerializeValues(entry.CurrentValues)  : null
            };

            AuditLogs.Add(audit);
            results.Add((entry, audit));
        }

        return results;
    }

    private static int GetPrimaryKey(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
    {
        var keyValue = entry.Metadata.FindPrimaryKey()?.Properties
            .Select(p => entry.Property(p.Name).CurrentValue)
            .FirstOrDefault();
        return keyValue is int intKey ? intKey : 0;
    }

    private static string? SerializeValues(Microsoft.EntityFrameworkCore.ChangeTracking.PropertyValues values)
    {
        var dict = new Dictionary<string, object?>();
        foreach (var prop in values.Properties)
        {
            // Never log hashed passwords or TOTP secrets in audit records
            if (prop.Name.Contains("Password", StringComparison.OrdinalIgnoreCase)) continue;
            if (prop.Name.Contains("TwoFactor", StringComparison.OrdinalIgnoreCase) &&
                prop.Name.Contains("Secret", StringComparison.OrdinalIgnoreCase)) continue;
            dict[prop.Name] = values[prop];
        }
        return JsonSerializer.Serialize(dict);
    }
}

// Extracted entities to Domain/Entities
