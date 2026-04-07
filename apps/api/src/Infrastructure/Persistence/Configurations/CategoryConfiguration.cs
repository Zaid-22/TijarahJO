using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<CategoryEntity>
{
    public void Configure(EntityTypeBuilder<CategoryEntity> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(e => e.CategoryID);
        builder.Property(e => e.CategoryID).ValueGeneratedOnAdd();
        builder.Property(e => e.CategoryName).HasMaxLength(100);
        builder.Property(e => e.NameAr).HasMaxLength(100);
        builder.Property(e => e.Image).HasMaxLength(1000);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.SearchCategoryNameNormalized).ValueGeneratedOnAddOrUpdate().HasMaxLength(100);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
