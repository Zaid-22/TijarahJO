using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class UserStatusLookupConfiguration : IEntityTypeConfiguration<UserStatusLookupEntity>
{
    public void Configure(EntityTypeBuilder<UserStatusLookupEntity> builder)
    {
        builder.ToTable("UserStatusLookup");
        builder.HasKey(e => e.StatusID);
        builder.Property(e => e.StatusID).ValueGeneratedNever();
        builder.Property(e => e.Code).HasMaxLength(50);
        builder.Property(e => e.StatusName).HasMaxLength(50);
        builder.Property(e => e.Description).HasMaxLength(200);
    }
}

public class PostStatusLookupConfiguration : IEntityTypeConfiguration<PostStatusLookupEntity>
{
    public void Configure(EntityTypeBuilder<PostStatusLookupEntity> builder)
    {
        builder.ToTable("PostStatusLookup");
        builder.HasKey(e => e.StatusID);
        builder.Property(e => e.StatusID).ValueGeneratedNever();
        builder.Property(e => e.Code).HasMaxLength(50);
        builder.Property(e => e.StatusName).HasMaxLength(50);
        builder.Property(e => e.Description).HasMaxLength(200);
    }
}

public class CityConfiguration : IEntityTypeConfiguration<CityEntity>
{
    public void Configure(EntityTypeBuilder<CityEntity> builder)
    {
        builder.ToTable("Cities");
        builder.HasKey(e => e.CityID);
        builder.Property(e => e.CityName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.CityNameAr).HasMaxLength(100).IsRequired();
        builder.HasIndex(e => e.CityName).IsUnique().HasDatabaseName("UQ_Cities_CityName");
    }
}

public class AreaConfiguration : IEntityTypeConfiguration<AreaEntity>
{
    private static readonly string[] propertyNames = ["CityID", "AreaName"];

    public void Configure(EntityTypeBuilder<AreaEntity> builder)
    {
        builder.ToTable("Areas");
        builder.HasKey(e => e.AreaID);
        builder.Property(e => e.AreaName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.AreaNameAr).HasMaxLength(100).IsRequired();
        builder.HasIndex(propertyNames).IsUnique().HasDatabaseName("UQ_Areas_City_Area");
        builder.HasOne(e => e.City)
              .WithMany(c => c.Areas)
              .HasForeignKey(e => e.CityID)
              .HasConstraintName("FK_Areas_Cities")
              .OnDelete(DeleteBehavior.Restrict);
    }
}

public class UserConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(e => e.UserID);
        builder.Property(e => e.UserID).ValueGeneratedOnAdd();
        builder.Property(e => e.HashedPassword).HasMaxLength(500);
        builder.Property(e => e.Email).HasMaxLength(255);
        builder.Property(e => e.FirstName).HasMaxLength(100);
        builder.Property(e => e.LastName).HasMaxLength(100);
        builder.Property(e => e.Phone).HasMaxLength(20);
        builder.Property(e => e.CityID);
        builder.Property(e => e.AreaID);
        builder.Property(e => e.Bio).HasMaxLength(1000);
        builder.Property(e => e.JoinDate).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        builder.Property(e => e.TwoFactorEnabled).HasDefaultValue(false);
        builder.Property(e => e.TwoFactorSecret).HasMaxLength(512);
        builder.Property(e => e.TwoFactorPendingSecret).HasMaxLength(512);
        builder.Property(e => e.SearchFirstNameNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(100);
        builder.Property(e => e.SearchLastNameNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(100);
        builder.Property(e => e.SearchFullNameNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(201);
        
        builder.HasOne<RoleEntity>()
            .WithMany()
            .HasForeignKey(e => e.RoleID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne(e => e.StatusLookup)
            .WithMany()
            .HasForeignKey(e => e.Status)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class UserExternalIdentityConfiguration : IEntityTypeConfiguration<UserExternalIdentityEntity>
{
    public void Configure(EntityTypeBuilder<UserExternalIdentityEntity> builder)
    {
        builder.ToTable("UserExternalIdentities");
        builder.HasKey(e => e.UserExternalIdentityID);
        builder.Property(e => e.UserExternalIdentityID).ValueGeneratedOnAdd();
        builder.Property(e => e.Provider).HasMaxLength(50).IsRequired();
        builder.Property(e => e.ProviderSubject).HasMaxLength(255).IsRequired();
        builder.Property(e => e.ProviderEmail).HasMaxLength(255);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");

        builder.HasIndex(e => new { e.Provider, e.ProviderSubject })
            .IsUnique()
            .HasDatabaseName("UQ_UserExternalIdentities_Provider_Subject");
        builder.HasIndex(e => new { e.UserID, e.Provider })
            .IsUnique()
            .HasDatabaseName("UQ_UserExternalIdentities_User_Provider");

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.UserID)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class RoleConfiguration : IEntityTypeConfiguration<RoleEntity>
{
    public void Configure(EntityTypeBuilder<RoleEntity> builder)
    {
        builder.ToTable("Roles");
        builder.HasKey(e => e.RoleID);
        builder.Property(e => e.RoleID).ValueGeneratedOnAdd();
        builder.Property(e => e.RoleName).HasMaxLength(50);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
    }
}

public class PostConfiguration : IEntityTypeConfiguration<PostEntity>
{
    public void Configure(EntityTypeBuilder<PostEntity> builder)
    {
        builder.ToTable("Posts");
        builder.HasKey(e => e.PostID);
        builder.Property(e => e.PostID).ValueGeneratedOnAdd();
        builder.Property(e => e.PostTitle).HasMaxLength(200);
        builder.Property(e => e.Price).HasColumnType("decimal(18,2)");
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        builder.Property(e => e.Views).HasColumnType("bigint");
        builder.Property(e => e.CityID);
        builder.Property(e => e.AreaID);

        builder.Property(e => e.SearchTitleNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(200);
        builder.Property(e => e.SearchDescriptionPrefixNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(450);
        
        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.UserID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne<CategoryEntity>()
            .WithMany()
            .HasForeignKey(e => e.CategoryID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne(e => e.StatusLookup)
            .WithMany()
            .HasForeignKey(e => e.Status)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<CategoryEntity>
{
    public void Configure(EntityTypeBuilder<CategoryEntity> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(e => e.CategoryID);
        builder.Property(e => e.CategoryID).ValueGeneratedOnAdd();
        builder.Property(e => e.CategoryName).HasMaxLength(100);
        builder.Property(e => e.NameAr).HasMaxLength(100);
        builder.Property(e => e.Icon).HasMaxLength(100);
        builder.Property(e => e.Color).HasMaxLength(20);
        builder.Property(e => e.Image).HasMaxLength(1000);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.SearchCategoryNameNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(100);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class PostImageConfiguration : IEntityTypeConfiguration<PostImageEntity>
{
    public void Configure(EntityTypeBuilder<PostImageEntity> builder)
    {
        builder.ToTable("PostImages");
        builder.HasKey(e => e.PostImageID);
        builder.Property(e => e.PostImageID).ValueGeneratedOnAdd();
        builder.Property(e => e.PostImageURL).HasMaxLength(2048).IsRequired();
        builder.Property(e => e.UploadedAt).HasColumnType("datetime2");
        
        builder.HasOne<PostEntity>()
            .WithMany()
            .HasForeignKey(e => e.PostID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class FavoriteConfiguration : IEntityTypeConfiguration<FavoriteEntity>
{
    public void Configure(EntityTypeBuilder<FavoriteEntity> builder)
    {
        builder.ToTable("Favorites");
        builder.HasKey(e => e.FavoriteID);
        builder.Property(e => e.FavoriteID).ValueGeneratedOnAdd();
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);
        
        builder.HasIndex(e => new { e.UserID, e.PostID }).IsUnique();
        
        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.UserID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne<PostEntity>()
            .WithMany()
            .HasForeignKey(e => e.PostID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class ConversationConfiguration : IEntityTypeConfiguration<ConversationEntity>
{
    public void Configure(EntityTypeBuilder<ConversationEntity> builder)
    {
        builder.ToTable("Conversations");
        builder.HasKey(e => e.ConversationID);
        builder.Property(e => e.ConversationID).ValueGeneratedOnAdd();
        builder.Property(e => e.LastMessageAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);

        // Ensures no duplicate thread exists for the same user-pair + post
        builder.HasIndex(e => new { e.User1ID, e.User2ID, e.PostID })
              .IsUnique()
              .HasDatabaseName("UQ_Conversations_Pair");

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.User1ID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.User2ID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<PostEntity>()
            .WithMany()
            .HasForeignKey(e => e.PostID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class MessageConfiguration : IEntityTypeConfiguration<MessageEntity>
{
    public void Configure(EntityTypeBuilder<MessageEntity> builder)
    {
        builder.ToTable("Messages", tableBuilder =>
        {
            tableBuilder.HasTrigger("TR_Messages_SenderMustBeConversationParticipant");
        });
        builder.HasKey(e => e.MessageID);
        builder.Property(e => e.MessageID).ValueGeneratedOnAdd();
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.SenderID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.ReceiverID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Conversation)
            .WithMany()
            .HasForeignKey(e => e.ConversationID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<ReviewEntity>
{
    public void Configure(EntityTypeBuilder<ReviewEntity> builder)
    {
        builder.ToTable("Reviews");
        builder.HasKey(e => e.ReviewID);
        builder.Property(e => e.ReviewID).ValueGeneratedOnAdd();
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);
        
        builder.HasIndex(e => new { e.ReviewerID, e.ReviewedUserID }).IsUnique();
        
        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.ReviewerID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.ReviewedUserID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<NotificationEntity>
{
    public void Configure(EntityTypeBuilder<NotificationEntity> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(e => e.NotificationID);
        builder.Property(e => e.NotificationID).ValueGeneratedOnAdd();
        builder.Property(e => e.NotificationType).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Title).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Body).HasMaxLength(1000).IsRequired();
        builder.Property(e => e.RouteUrl).HasMaxLength(300);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.ReadAt).HasColumnType("datetime2");
        
        builder.HasIndex(e => new { e.UserID, e.IsRead, e.CreatedAt })
            .HasDatabaseName("IX_Notifications_UserID_IsRead_CreatedAt");
            
        builder.HasIndex(e => new { e.UserID, e.NotificationType, e.ConversationID, e.IsRead })
            .HasDatabaseName("IX_Notifications_User_Conversation_Read");

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.UserID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.SenderUserID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne<ConversationEntity>()
            .WithMany()
            .HasForeignKey(e => e.ConversationID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne<MessageEntity>()
            .WithMany()
            .HasForeignKey(e => e.MessageID)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscriptionEntity>
{
    public void Configure(EntityTypeBuilder<PushSubscriptionEntity> builder)
    {
        builder.ToTable("PushSubscriptions");
        builder.HasKey(e => e.PushSubscriptionID);
        builder.Property(e => e.PushSubscriptionID).ValueGeneratedOnAdd();
        builder.Property(e => e.Endpoint).HasMaxLength(1000).IsRequired();
        
        builder.Property<byte[]>("EndpointHash")
            .HasColumnType("binary(32)")
            .HasComputedColumnSql("CONVERT(BINARY(32), HASHBYTES('SHA2_256', LOWER(LTRIM(RTRIM([Endpoint])))))", stored: true);
            
        builder.Property(e => e.P256DH).HasMaxLength(255).IsRequired();
        builder.Property(e => e.Auth).HasMaxLength(255).IsRequired();
        builder.Property(e => e.UserAgent).HasMaxLength(500);
        builder.Property(e => e.LastFailureReason).HasMaxLength(400);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        builder.Property(e => e.LastSuccessAt).HasColumnType("datetime2");
        builder.Property(e => e.LastFailureAt).HasColumnType("datetime2");

        builder.HasIndex("UserID", "EndpointHash")
            .IsUnique()
            .HasDatabaseName("UQ_PushSubscriptions_User_EndpointHash");
            
        builder.HasIndex(e => new { e.UserID, e.IsActive })
            .HasDatabaseName("IX_PushSubscriptions_User_IsActive");

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.UserID)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLogEntity>
{
    public void Configure(EntityTypeBuilder<AuditLogEntity> builder)
    {
        builder.ToTable("AuditLog");
        builder.HasKey(e => e.AuditLogID);
        builder.Property(e => e.AuditLogID).ValueGeneratedOnAdd();
        builder.Property(e => e.TableName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Action).HasMaxLength(10).IsRequired();
        builder.Property(e => e.ChangedAt).HasColumnType("datetime2");
        builder.Property(e => e.OldValues).HasColumnType("nvarchar(max)");
        builder.Property(e => e.NewValues).HasColumnType("nvarchar(max)");

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.ChangedByUserID)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSettingEntity>
{
    public void Configure(EntityTypeBuilder<SystemSettingEntity> builder)
    {
        builder.ToTable("SystemSettings");
        builder.HasKey(e => e.SettingID);
        builder.Property(e => e.SettingID).ValueGeneratedOnAdd();
        builder.Property(e => e.SettingKey).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Label).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Value).IsRequired();
        builder.Property(e => e.ValueType).HasMaxLength(20).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");

        builder.HasIndex(e => e.SettingKey)
            .IsUnique()
            .HasDatabaseName("UQ_SystemSettings_Key");
    }
}

public class ReportConfiguration : IEntityTypeConfiguration<ReportEntity>
{
    public void Configure(EntityTypeBuilder<ReportEntity> builder)
    {
        builder.ToTable("Reports");
        builder.HasKey(e => e.ReportID);
        builder.Property(e => e.ReportID).ValueGeneratedOnAdd();
        builder.Property(e => e.ReportType).HasMaxLength(20).IsRequired();
        builder.Property(e => e.Reason).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.ResolutionNotes).HasMaxLength(1000);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.ResolvedAt).HasColumnType("datetime2");

        builder.HasIndex(e => new { e.Status, e.CreatedAt })
            .HasDatabaseName("IX_Reports_Status_CreatedAt");

        builder.HasOne(e => e.Reporter)
            .WithMany()
            .HasForeignKey(e => e.ReporterUserID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ResolvedBy)
            .WithMany()
            .HasForeignKey(e => e.ResolvedByUserID)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PermissionConfiguration : IEntityTypeConfiguration<PermissionEntity>
{
    public void Configure(EntityTypeBuilder<PermissionEntity> builder)
    {
        builder.ToTable("Permissions");
        builder.HasKey(e => e.PermissionID);
        builder.Property(e => e.PermissionID).ValueGeneratedOnAdd();
        builder.Property(e => e.PermissionKey).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(300).IsRequired();
        builder.Property(e => e.Category).HasMaxLength(50).IsRequired();

        builder.HasIndex(e => e.PermissionKey)
            .IsUnique()
            .HasDatabaseName("UQ_Permissions_Key");
    }
}

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermissionEntity>
{
    public void Configure(EntityTypeBuilder<RolePermissionEntity> builder)
    {
        builder.ToTable("RolePermissions");
        builder.HasKey(e => e.RolePermissionID);
        builder.Property(e => e.RolePermissionID).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.RoleID, e.PermissionID })
            .IsUnique()
            .HasDatabaseName("UQ_RolePermissions_Role_Perm");

        builder.HasOne(e => e.Role)
            .WithMany()
            .HasForeignKey(e => e.RoleID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Permission)
            .WithMany()
            .HasForeignKey(e => e.PermissionID)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class VerificationChallengeConfiguration : IEntityTypeConfiguration<VerificationChallengeEntity>
{
    public void Configure(EntityTypeBuilder<VerificationChallengeEntity> builder)
    {
        builder.ToTable("VerificationChallenges");
        builder.HasKey(e => e.ChallengeId);
        builder.Property(e => e.ChallengeId)
            .HasMaxLength(128)
            .ValueGeneratedNever();
        builder.Property(e => e.ChallengeType)
            .HasMaxLength(50)
            .IsRequired();
        builder.Property(e => e.StateJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();
        builder.Property(e => e.ExpiresAt).HasColumnType("datetime2");
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");

        builder.HasIndex(e => e.ExpiresAt)
            .HasDatabaseName("IX_VerificationChallenges_ExpiresAt");
        builder.HasIndex(e => new { e.UserId, e.ChallengeType })
            .HasDatabaseName("IX_VerificationChallenges_User_Type");

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .HasConstraintName("FK_VerificationChallenges_User")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
