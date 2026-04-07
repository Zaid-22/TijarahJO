using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class FavoriteConfiguration : IEntityTypeConfiguration<FavoriteEntity>
{
    public void Configure(EntityTypeBuilder<FavoriteEntity> builder)
    {
        builder.ToTable("Favorites");
        builder.HasKey(e => e.FavoriteID);
        builder.Property(e => e.FavoriteID).ValueGeneratedOnAdd();
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);
        
        // Filtered unique index: allows re-favoriting after soft-delete
        builder.HasIndex(e => new { e.UserID, e.PostID })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0")
            .HasDatabaseName("UQ_Favorites_User_Post");
        
        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.UserID)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasOne<PostEntity>()
            .WithMany()
            .HasForeignKey(e => e.PostID)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}
