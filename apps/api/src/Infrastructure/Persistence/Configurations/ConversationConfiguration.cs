using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

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
