using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJoDB.DAL.Entities;

namespace TijarahJoDB.DAL.Persistence.Configurations;

public class BlacklistedTokenConfiguration : IEntityTypeConfiguration<BlacklistedTokenEntity>
{
    public void Configure(EntityTypeBuilder<BlacklistedTokenEntity> builder)
    {
        builder.ToTable("BlacklistedTokens");
        builder.HasKey(e => e.Jti);
        builder.Property(e => e.Jti).HasMaxLength(100).IsRequired();
        builder.Property(e => e.ExpiresAt).HasColumnType("datetime2");

        builder.HasIndex(e => e.ExpiresAt)
            .HasDatabaseName("IX_BlacklistedTokens_ExpiresAt");
    }
}
