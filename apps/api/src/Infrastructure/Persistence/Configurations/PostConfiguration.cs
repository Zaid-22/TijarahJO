using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class PostConfiguration : IEntityTypeConfiguration<PostEntity>
{
    public void Configure(EntityTypeBuilder<PostEntity> builder)
    {
        builder.ToTable("Posts");
        builder.HasKey(e => e.PostID);
        builder.Property(e => e.PostID).ValueGeneratedOnAdd();
        builder.Property(e => e.PostTitle).HasMaxLength(200);
        builder.Property(e => e.PostDescription).HasMaxLength(4000);
        builder.Property(e => e.Price).HasColumnType("decimal(18,2)");
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        builder.Property(e => e.Views).HasColumnType("bigint");
        builder.Property(e => e.CityID);
        builder.Property(e => e.AreaID);

        builder.Property(e => e.SearchTitleNormalized)
            .ValueGeneratedOnAddOrUpdate()
            .HasMaxLength(200)
            .Metadata.SetAfterSaveBehavior(Microsoft.EntityFrameworkCore.Metadata.PropertySaveBehavior.Ignore);
        builder.Property(e => e.SearchDescriptionPrefixNormalized)
            .ValueGeneratedOnAddOrUpdate()
            .HasMaxLength(450)
            .Metadata.SetAfterSaveBehavior(Microsoft.EntityFrameworkCore.Metadata.PropertySaveBehavior.Ignore);
        
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
