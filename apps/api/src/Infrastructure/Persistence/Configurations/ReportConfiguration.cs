using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class ReportConfiguration : IEntityTypeConfiguration<ReportEntity>
{
    public void Configure(EntityTypeBuilder<ReportEntity> builder)
    {
        builder.ToTable("Reports");
        builder.HasKey(e => e.ReportID);
        builder.Property(e => e.ReportID).ValueGeneratedOnAdd();
        builder.Property(e => e.ReportType).HasMaxLength(20).IsRequired();
        builder.Property(e => e.Reason).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(2000);
        builder.Property(e => e.ResolutionNotes).HasMaxLength(1000);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.ResolvedAt).HasColumnType("datetime2");

        builder.HasIndex(e => new { e.Status, e.CreatedAt })
            .HasDatabaseName("IX_Reports_Status_CreatedAt");

        builder.HasOne(e => e.Reporter)
            .WithMany()
            .HasForeignKey(e => e.ReporterUserID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ResolvedBy)
            .WithMany()
            .HasForeignKey(e => e.ResolvedByUserID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => e.Reporter != null && !e.Reporter.IsDeleted);
    }
}
