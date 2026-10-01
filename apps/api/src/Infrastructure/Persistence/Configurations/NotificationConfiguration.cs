using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

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
        builder.Property(e => e.PayloadJson).HasMaxLength(2000);
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);
        
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

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
