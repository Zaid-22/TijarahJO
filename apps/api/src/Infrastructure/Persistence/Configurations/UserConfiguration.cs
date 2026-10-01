using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(e => e.UserID);
        builder.Property(e => e.UserID).ValueGeneratedOnAdd();
        builder.Property(e => e.HashedPassword).HasMaxLength(500);
        builder.Property(e => e.Email).HasMaxLength(255);
        builder.Property(e => e.FirstName).HasMaxLength(100);
        builder.Property(e => e.LastName).HasMaxLength(100);
        builder.Property(e => e.Phone).HasMaxLength(20);
        builder.Property(e => e.CityID);
        builder.Property(e => e.AreaID);
        builder.Property(e => e.Bio).HasMaxLength(1000);
        builder.Property(e => e.Avatar).HasMaxLength(1000);
        builder.Property(e => e.JoinDate).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        builder.Property(e => e.SuspendedUntil).HasColumnType("datetime2");
        builder.Property(e => e.TwoFactorEnabled).HasDefaultValue(false);
        builder.Property(e => e.TwoFactorSecret).HasMaxLength(512);
        builder.Property(e => e.TwoFactorPendingSecret).HasMaxLength(512);
        builder.Property(e => e.IsEmailVerified).HasDefaultValue(false);
        builder.Property(e => e.SearchFirstNameNormalized)
            .ValueGeneratedOnAddOrUpdate()
            .HasMaxLength(100)
            .Metadata.SetAfterSaveBehavior(Microsoft.EntityFrameworkCore.Metadata.PropertySaveBehavior.Ignore);
        builder.Property(e => e.SearchLastNameNormalized)
            .ValueGeneratedOnAddOrUpdate()
            .HasMaxLength(100)
            .Metadata.SetAfterSaveBehavior(Microsoft.EntityFrameworkCore.Metadata.PropertySaveBehavior.Ignore);
        builder.Property(e => e.SearchFullNameNormalized)
            .ValueGeneratedOnAddOrUpdate()
            .HasMaxLength(201)
            .Metadata.SetAfterSaveBehavior(Microsoft.EntityFrameworkCore.Metadata.PropertySaveBehavior.Ignore);
        
        builder.HasOne<RoleEntity>()
            .WithMany()
            .HasForeignKey(e => e.RoleID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne(e => e.StatusLookup)
            .WithMany()
            .HasForeignKey(e => e.Status)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
