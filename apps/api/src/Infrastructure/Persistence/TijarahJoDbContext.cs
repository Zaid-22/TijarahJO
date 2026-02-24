using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TijarahJoDB.DAL.Entities;

namespace TijarahJoDB.DAL.Persistence;

public sealed class TijarahJoDbContext : DbContext
{
    public TijarahJoDbContext(DbContextOptions<TijarahJoDbContext> options)
        : base(options)
    {
    }

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

    // Set this to the current actor's UserID before calling SaveChangesAsync on a
    // mutating operation so that AuditLog entries carry the correct ChangedByUserID.
    // Reset to null after SaveChangesAsync returns.
    public int? AuditActorUserId { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserStatusLookupEntity>(entity =>
        {
            entity.ToTable("UserStatusLookup");
            entity.HasKey(e => e.StatusID);
            entity.Property(e => e.StatusID).ValueGeneratedNever();
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.StatusName).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(200);
        });

        modelBuilder.Entity<PostStatusLookupEntity>(entity =>
        {
            entity.ToTable("PostStatusLookup");
            entity.HasKey(e => e.StatusID);
            entity.Property(e => e.StatusID).ValueGeneratedNever();
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.StatusName).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(200);
        });

        modelBuilder.Entity<CityEntity>(entity =>
        {
            entity.ToTable("Cities");
            entity.HasKey(e => e.CityID);
            entity.Property(e => e.CityName).HasMaxLength(100).IsRequired();
            entity.HasIndex(e => e.CityName).IsUnique().HasDatabaseName("UQ_Cities_CityName");
        });

        modelBuilder.Entity<AreaEntity>(entity =>
        {
            entity.ToTable("Areas");
            entity.HasKey(e => e.AreaID);
            entity.Property(e => e.AreaName).HasMaxLength(100).IsRequired();
            entity.HasIndex(new[] { "CityID", "AreaName" }).IsUnique().HasDatabaseName("UQ_Areas_City_Area");
            entity.HasOne(e => e.City)
                  .WithMany(c => c.Areas)
                  .HasForeignKey(e => e.CityID)
                  .HasConstraintName("FK_Areas_Cities")
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.UserID);
            entity.Property(e => e.UserID).ValueGeneratedOnAdd();
            entity.Property(e => e.HashedPassword).HasMaxLength(500);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.CityID);
            entity.Property(e => e.AreaID);
            entity.Property(e => e.Bio).HasMaxLength(1000);
            entity.Property(e => e.JoinDate).HasColumnType("datetime2");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime2");
            entity.Property(e => e.SearchFirstNameNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(100);
            entity.Property(e => e.SearchLastNameNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(100);
            entity.Property(e => e.SearchFullNameNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(201);
            entity.HasOne<RoleEntity>()
                .WithMany()
                .HasForeignKey(e => e.RoleID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.StatusLookup)
                .WithMany()
                .HasForeignKey(e => e.Status)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<UserExternalIdentityEntity>(entity =>
        {
            entity.ToTable("UserExternalIdentities");
            entity.HasKey(e => e.UserExternalIdentityID);
            entity.Property(e => e.UserExternalIdentityID).ValueGeneratedOnAdd();
            entity.Property(e => e.Provider).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ProviderSubject).HasMaxLength(255).IsRequired();
            entity.Property(e => e.ProviderEmail).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime2");

            entity.HasIndex(e => new { e.Provider, e.ProviderSubject })
                .IsUnique()
                .HasDatabaseName("UQ_UserExternalIdentities_Provider_Subject");
            entity.HasIndex(e => new { e.UserID, e.Provider })
                .IsUnique()
                .HasDatabaseName("UQ_UserExternalIdentities_User_Provider");

            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RoleEntity>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(e => e.RoleID);
            entity.Property(e => e.RoleID).ValueGeneratedOnAdd();
            entity.Property(e => e.RoleName).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
        });

        modelBuilder.Entity<PostEntity>(entity =>
        {
            entity.ToTable("Posts");
            entity.HasKey(e => e.PostID);
            entity.Property(e => e.PostID).ValueGeneratedOnAdd();
            entity.Property(e => e.PostTitle).HasMaxLength(200);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime2");
            entity.Property(e => e.Views).HasColumnType("bigint");
            entity.Property(e => e.CityID);
            entity.Property(e => e.AreaID);

            entity.Property(e => e.SearchTitleNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(200);
            entity.Property(e => e.SearchDescriptionPrefixNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(450);
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CategoryEntity>()
                .WithMany()
                .HasForeignKey(e => e.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.StatusLookup)
                .WithMany()
                .HasForeignKey(e => e.Status)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<CategoryEntity>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(e => e.CategoryID);
            entity.Property(e => e.CategoryID).ValueGeneratedOnAdd();
            entity.Property(e => e.CategoryName).HasMaxLength(100);
            entity.Property(e => e.NameAr).HasMaxLength(100);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.Property(e => e.Color).HasMaxLength(20);
            entity.Property(e => e.Image).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.SearchCategoryNameNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(100);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<PostImageEntity>(entity =>
        {
            entity.ToTable("PostImages");
            entity.HasKey(e => e.PostImageID);
            entity.Property(e => e.PostImageID).ValueGeneratedOnAdd();
            entity.Property(e => e.PostImageURL).HasColumnType("nvarchar(max)");
            entity.Property(e => e.UploadedAt).HasColumnType("datetime2");
            entity.HasOne<PostEntity>()
                .WithMany()
                .HasForeignKey(e => e.PostID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<FavoriteEntity>(entity =>
        {
            entity.ToTable("Favorites");
            entity.HasKey(e => e.FavoriteID);
            entity.Property(e => e.FavoriteID).ValueGeneratedOnAdd();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(e => new { e.UserID, e.PostID }).IsUnique();
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<PostEntity>()
                .WithMany()
                .HasForeignKey(e => e.PostID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Conversations table — introduced in V202602191110__chat_conversations.sql
        // Updated in V202602221300: added IsDeleted, LastMessageAt
        modelBuilder.Entity<ConversationEntity>(entity =>
        {
            entity.ToTable("Conversations");
            entity.HasKey(e => e.ConversationID);
            entity.Property(e => e.ConversationID).ValueGeneratedOnAdd();
            entity.Property(e => e.LastMessageAt).HasColumnType("datetime2");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);

            // Ensures no duplicate thread exists for the same user-pair + post
            entity.HasIndex(e => new { e.User1ID, e.User2ID, e.PostID })
                  .IsUnique()
                  .HasDatabaseName("UQ_Conversations_Pair");

            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.User1ID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.User2ID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<PostEntity>()
                .WithMany()
                .HasForeignKey(e => e.PostID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Messages — [Timestamp] renamed to CreatedAt in V202602221300; IsDeleted added
        modelBuilder.Entity<MessageEntity>(entity =>
        {
            entity.ToTable("Messages", tableBuilder =>
            {
                tableBuilder.HasTrigger("TR_Messages_SenderMustBeConversationParticipant");
            });
            entity.HasKey(e => e.MessageID);
            entity.Property(e => e.MessageID).ValueGeneratedOnAdd();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);

            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.SenderID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Conversation)
                .WithMany()
                .HasForeignKey(e => e.ConversationID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Reviews — [Timestamp] renamed to CreatedAt in V202602221300; IsDeleted added
        modelBuilder.Entity<ReviewEntity>(entity =>
        {
            entity.ToTable("Reviews");
            entity.HasKey(e => e.ReviewID);
            entity.Property(e => e.ReviewID).ValueGeneratedOnAdd();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(e => new { e.ReviewerID, e.ReviewedUserID }).IsUnique();
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.ReviewerID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.ReviewedUserID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        modelBuilder.Entity<NotificationEntity>(entity =>
        {
            entity.ToTable("Notifications");
            entity.HasKey(e => e.NotificationID);
            entity.Property(e => e.NotificationID).ValueGeneratedOnAdd();
            entity.Property(e => e.NotificationType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Body).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.RouteUrl).HasMaxLength(300);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.ReadAt).HasColumnType("datetime2");
            entity.HasIndex(e => new { e.UserID, e.IsRead, e.CreatedAt })
                .HasDatabaseName("IX_Notifications_UserID_IsRead_CreatedAt");
            entity.HasIndex(e => new { e.UserID, e.NotificationType, e.ConversationID, e.IsRead })
                .HasDatabaseName("IX_Notifications_User_Conversation_Read");

            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.SenderUserID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<ConversationEntity>()
                .WithMany()
                .HasForeignKey(e => e.ConversationID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<MessageEntity>()
                .WithMany()
                .HasForeignKey(e => e.MessageID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PushSubscriptionEntity>(entity =>
        {
            entity.ToTable("PushSubscriptions");
            entity.HasKey(e => e.PushSubscriptionID);
            entity.Property(e => e.PushSubscriptionID).ValueGeneratedOnAdd();
            entity.Property(e => e.Endpoint).HasMaxLength(1000).IsRequired();
            entity.Property<byte[]>("EndpointHash")
                .HasColumnType("binary(32)")
                .HasComputedColumnSql("CONVERT(BINARY(32), HASHBYTES('SHA2_256', LOWER(LTRIM(RTRIM([Endpoint])))))", stored: true);
            entity.Property(e => e.P256DH).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Auth).HasMaxLength(255).IsRequired();
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.LastFailureReason).HasMaxLength(400);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime2");
            entity.Property(e => e.LastSuccessAt).HasColumnType("datetime2");
            entity.Property(e => e.LastFailureAt).HasColumnType("datetime2");

            entity.HasIndex("UserID", "EndpointHash")
                .IsUnique()
                .HasDatabaseName("UQ_PushSubscriptions_User_EndpointHash");
            entity.HasIndex(e => new { e.UserID, e.IsActive })
                .HasDatabaseName("IX_PushSubscriptions_User_IsActive");

            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<AuditLogEntity>(entity =>
        {
            entity.ToTable("AuditLog");
            entity.HasKey(e => e.AuditLogID);
            entity.Property(e => e.AuditLogID).ValueGeneratedOnAdd();
            entity.Property(e => e.TableName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(10).IsRequired();
            entity.Property(e => e.ChangedAt).HasColumnType("datetime2");
            entity.Property(e => e.OldValues).HasColumnType("nvarchar(max)");
            entity.Property(e => e.NewValues).HasColumnType("nvarchar(max)");

            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.ChangedByUserID)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    // -------------------------------------------------------------------------
    // Audit interception — runs on every SaveChangesAsync call.
    // Captures INSERT/UPDATE/DELETE on audited entity types and writes
    // AuditLogEntity entries in the SAME transaction as the primary change.
    // -------------------------------------------------------------------------

    private static readonly HashSet<Type> _auditedTypes = new()
    {
        typeof(UserEntity),
        typeof(PostEntity),
        typeof(ReviewEntity),
        typeof(CategoryEntity),
        typeof(RoleEntity)
    };

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

        foreach (var entry in ChangeTracker.Entries())
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
            // Never log hashed passwords in audit records
            if (prop.Name.Contains("Password", StringComparison.OrdinalIgnoreCase)) continue;
            dict[prop.Name] = values[prop];
        }
        return JsonSerializer.Serialize(dict);
    }
}

// Extracted entities to Domain/Entities
