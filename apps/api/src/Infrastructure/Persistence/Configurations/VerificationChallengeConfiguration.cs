using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class VerificationChallengeConfiguration : IEntityTypeConfiguration<VerificationChallengeEntity>
{
    public void Configure(EntityTypeBuilder<VerificationChallengeEntity> builder)
    {
        builder.ToTable("VerificationChallenges");
        builder.HasKey(e => e.ChallengeId);
        builder.Property(e => e.ChallengeId)
            .HasMaxLength(128)
            .ValueGeneratedNever();
        builder.Property(e => e.ChallengeType)
            .HasMaxLength(50)
            .IsRequired();
        builder.Property(e => e.StateJson)
            .HasColumnType("nvarchar(max)")
            .IsRequired();
        builder.Property(e => e.ExpiresAt).HasColumnType("datetime2");
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");

        builder.HasIndex(e => e.ExpiresAt)
            .HasDatabaseName("IX_VerificationChallenges_ExpiresAt");

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .HasConstraintName("FK_VerificationChallenges_User")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasQueryFilter(e => e.User != null && !e.User.IsDeleted);
    }
}
