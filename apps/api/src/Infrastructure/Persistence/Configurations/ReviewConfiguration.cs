using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<ReviewEntity>
{
    public void Configure(EntityTypeBuilder<ReviewEntity> builder)
    {
        builder.ToTable("Reviews");
        builder.HasKey(e => e.ReviewID);
        builder.Property(e => e.ReviewID).ValueGeneratedOnAdd();
        builder.Property(e => e.Comment).HasMaxLength(4000);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);
        
        builder.HasIndex(e => new { e.ReviewerID, e.ReviewedUserID })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0")
            .HasDatabaseName("UQ_Reviews_Reviewer_Reviewed");
        
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
