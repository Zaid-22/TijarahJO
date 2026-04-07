using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<RoleEntity>
{
    public void Configure(EntityTypeBuilder<RoleEntity> builder)
    {
        builder.ToTable("Roles");
        builder.HasKey(e => e.RoleID);
        builder.Property(e => e.RoleID).ValueGeneratedOnAdd();
        builder.Property(e => e.RoleName).HasMaxLength(50);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
    }
}
