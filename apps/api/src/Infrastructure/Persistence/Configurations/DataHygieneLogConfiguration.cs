using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class DataHygieneLogConfiguration : IEntityTypeConfiguration<DataHygieneLogEntity>
{
    public void Configure(EntityTypeBuilder<DataHygieneLogEntity> builder)
    {
        builder.ToTable("DataHygieneLog");
        builder.HasKey(e => e.HygieneLogID);
        builder.Property(e => e.HygieneLogID).ValueGeneratedOnAdd();
        builder.Property(e => e.CycleID).IsRequired();
        builder.Property(e => e.TableName).HasMaxLength(128).IsRequired();
        builder.Property(e => e.FindingType).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Classification).HasMaxLength(50).IsRequired();
        builder.Property(e => e.AffectedRowCount).HasDefaultValue(0);
        builder.Property(e => e.SampleData).HasMaxLength(1000);
        builder.Property(e => e.Phase).HasDefaultValue(1);
        builder.Property(e => e.ActionTaken).HasMaxLength(50).HasDefaultValue("NONE");
        builder.Property(e => e.DetectedAt).HasColumnType("datetime2");
        builder.Property(e => e.ActionedAt).HasColumnType("datetime2");
        builder.Property(e => e.Notes).HasMaxLength(2000);

        builder.HasIndex(e => e.CycleID)
            .HasDatabaseName("IX_DataHygieneLog_CycleID");

        builder.HasIndex(e => e.DetectedAt)
            .HasDatabaseName("IX_DataHygieneLog_DetectedAt");
    }
}
