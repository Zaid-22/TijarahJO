using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class UserExternalIdentityConfiguration : IEntityTypeConfiguration<UserExternalIdentityEntity>
{
    public void Configure(EntityTypeBuilder<UserExternalIdentityEntity> builder)
    {
        builder.ToTable("UserExternalIdentities");
        builder.HasKey(e => e.UserExternalIdentityID);
        builder.Property(e => e.UserExternalIdentityID).ValueGeneratedOnAdd();
        builder.Property(e => e.Provider).HasMaxLength(50).IsRequired();
        builder.Property(e => e.ProviderSubject).HasMaxLength(255).IsRequired();
        builder.Property(e => e.ProviderEmail).HasMaxLength(255);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);

        builder.HasIndex(e => new { e.Provider, e.ProviderSubject })
            .IsUnique()
            .HasDatabaseName("UQ_UserExternalIdentities_Provider_Subject");
        builder.HasIndex(e => new { e.UserID, e.Provider })
            .IsUnique()
            .HasDatabaseName("UQ_UserExternalIdentities_User_Provider");

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.UserID)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
