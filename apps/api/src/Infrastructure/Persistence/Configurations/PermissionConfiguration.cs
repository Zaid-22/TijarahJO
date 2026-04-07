using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

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
