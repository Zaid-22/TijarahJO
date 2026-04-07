using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermissionEntity>
{
    public void Configure(EntityTypeBuilder<RolePermissionEntity> builder)
    {
        builder.ToTable("RolePermissions");
        builder.HasKey(e => e.RolePermissionID);
        builder.Property(e => e.RolePermissionID).ValueGeneratedOnAdd();

        builder.HasIndex(e => new { e.RoleID, e.PermissionID })
            .IsUnique()
            .HasDatabaseName("UQ_RolePermissions_Role_Perm");

        builder.HasOne(e => e.Role)
            .WithMany()
            .HasForeignKey(e => e.RoleID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Permission)
            .WithMany()
            .HasForeignKey(e => e.PermissionID)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
