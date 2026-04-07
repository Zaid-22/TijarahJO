using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

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
