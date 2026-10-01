using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSettingEntity>
{
    public void Configure(EntityTypeBuilder<SystemSettingEntity> builder)
    {
        builder.ToTable("SystemSettings");
        builder.HasKey(e => e.SettingID);
        builder.Property(e => e.SettingID).ValueGeneratedOnAdd();
        builder.Property(e => e.SettingKey).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Label).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Value).HasMaxLength(4000).IsRequired();
        builder.Property(e => e.ValueType).HasMaxLength(20).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");

        builder.HasIndex(e => e.SettingKey)
            .IsUnique()
            .HasDatabaseName("UQ_SystemSettings_Key");
    }
}
