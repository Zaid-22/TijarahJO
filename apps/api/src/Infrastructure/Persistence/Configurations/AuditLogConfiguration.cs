using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLogEntity>
{
    public void Configure(EntityTypeBuilder<AuditLogEntity> builder)
    {
        builder.ToTable("AuditLog");
        builder.HasKey(e => e.AuditLogID);
        builder.Property(e => e.AuditLogID).ValueGeneratedOnAdd();
        builder.Property(e => e.TableName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Action).HasMaxLength(10).IsRequired();
        builder.Property(e => e.ChangedAt).HasColumnType("datetime2");
        builder.Property(e => e.OldValues).HasColumnType("nvarchar(max)");
        builder.Property(e => e.NewValues).HasColumnType("nvarchar(max)");

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.ChangedByUserID)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
