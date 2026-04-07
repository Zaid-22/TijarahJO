using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class PostCommentConfiguration : IEntityTypeConfiguration<PostCommentEntity>
{
    public void Configure(EntityTypeBuilder<PostCommentEntity> builder)
    {
        builder.ToTable("PostComments");
        builder.HasKey(e => e.CommentID);
        builder.Property(e => e.CommentID).ValueGeneratedOnAdd();
        builder.Property(e => e.Content).HasMaxLength(2000).IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);

        builder.HasOne<PostEntity>()
            .WithMany()
            .HasForeignKey(e => e.PostID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.UserID)
            .OnDelete(DeleteBehavior.Restrict);

        // Self-referencing FK for nested replies
        builder.HasOne<PostCommentEntity>()
            .WithMany()
            .HasForeignKey(e => e.ParentCommentID)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(e => new { e.PostID, e.CreatedAt })
            .HasDatabaseName("IX_PostComments_PostID_CreatedAt");

        builder.HasIndex(e => e.ParentCommentID)
            .HasDatabaseName("IX_PostComments_ParentCommentID");

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
