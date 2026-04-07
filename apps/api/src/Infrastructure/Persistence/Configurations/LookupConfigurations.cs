using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class UserStatusLookupConfiguration : IEntityTypeConfiguration<UserStatusLookupEntity>
{
    public void Configure(EntityTypeBuilder<UserStatusLookupEntity> builder)
    {
        builder.ToTable("UserStatusLookup");
        builder.HasKey(e => e.StatusID);
        builder.Property(e => e.StatusID).ValueGeneratedNever();
        builder.Property(e => e.Code).HasMaxLength(50);
        builder.Property(e => e.StatusName).HasMaxLength(50);
        builder.Property(e => e.Description).HasMaxLength(200);
    }
}

public class PostStatusLookupConfiguration : IEntityTypeConfiguration<PostStatusLookupEntity>
{
    public void Configure(EntityTypeBuilder<PostStatusLookupEntity> builder)
    {
        builder.ToTable("PostStatusLookup");
        builder.HasKey(e => e.StatusID);
        builder.Property(e => e.StatusID).ValueGeneratedNever();
        builder.Property(e => e.Code).HasMaxLength(50);
        builder.Property(e => e.StatusName).HasMaxLength(50);
        builder.Property(e => e.Description).HasMaxLength(200);
    }
}

public class CityConfiguration : IEntityTypeConfiguration<CityEntity>
{
    public void Configure(EntityTypeBuilder<CityEntity> builder)
    {
        builder.ToTable("Cities");
        builder.HasKey(e => e.CityID);
        builder.Property(e => e.CityName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.CityNameAr).HasMaxLength(100).IsRequired();
        builder.HasIndex(e => e.CityName).IsUnique().HasDatabaseName("UQ_Cities_CityName");
    }
}

public class AreaConfiguration : IEntityTypeConfiguration<AreaEntity>
{
    private static readonly string[] propertyNames = ["CityID", "AreaName"];

    public void Configure(EntityTypeBuilder<AreaEntity> builder)
    {
        builder.ToTable("Areas");
        builder.HasKey(e => e.AreaID);
        builder.Property(e => e.AreaName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.AreaNameAr).HasMaxLength(100).IsRequired();
        builder.HasIndex(propertyNames).IsUnique().HasDatabaseName("UQ_Areas_City_Area");
        builder.HasOne(e => e.City)
              .WithMany(c => c.Areas)
              .HasForeignKey(e => e.CityID)
              .HasConstraintName("FK_Areas_Cities")
              .OnDelete(DeleteBehavior.Restrict);
    }
}
