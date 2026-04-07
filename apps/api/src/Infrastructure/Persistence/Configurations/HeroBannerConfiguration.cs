using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class HeroBannerConfiguration : IEntityTypeConfiguration<HeroBannerEntity>
{
    public void Configure(EntityTypeBuilder<HeroBannerEntity> builder)
    {
        builder.ToTable("HeroBanners");
        builder.HasKey(e => e.BannerID);
        builder.Property(e => e.BannerID).ValueGeneratedOnAdd();
        builder.Property(e => e.Title).HasMaxLength(200).IsRequired();
        builder.Property(e => e.TitleAr).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Subtitle).HasMaxLength(400).IsRequired();
        builder.Property(e => e.SubtitleAr).HasMaxLength(400).IsRequired();
        builder.Property(e => e.ButtonText).HasMaxLength(100).IsRequired();
        builder.Property(e => e.ButtonTextAr).HasMaxLength(100).IsRequired();
        builder.Property(e => e.ImageUrl).HasMaxLength(2048).IsRequired();
        builder.Property(e => e.BgClass).HasMaxLength(200).IsRequired();
        builder.Property(e => e.TextClass).HasMaxLength(200).IsRequired();
        builder.Property(e => e.AltText).HasMaxLength(200).IsRequired();
        builder.Property(e => e.AltTextAr).HasMaxLength(200).IsRequired();
        builder.Property(e => e.LinkUrl).HasMaxLength(500);
        builder.Property(e => e.IsActive).HasDefaultValue(true);
        builder.Property(e => e.DisplayOrder).HasDefaultValue(0);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
    }
}
