using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TijarahJo.Domain.Entities;

namespace TijarahJo.Infrastructure.Persistence.Configurations;

public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscriptionEntity>
{
    public void Configure(EntityTypeBuilder<PushSubscriptionEntity> builder)
    {
        builder.ToTable("PushSubscriptions");
        builder.HasKey(e => e.PushSubscriptionID);
        builder.Property(e => e.PushSubscriptionID).ValueGeneratedOnAdd();
        builder.Property(e => e.Endpoint).HasMaxLength(1000).IsRequired();
        
        builder.Property<byte[]>("EndpointHash")
            .HasColumnType("binary(32)")
            .HasComputedColumnSql("CONVERT(BINARY(32), HASHBYTES('SHA2_256', LOWER(LTRIM(RTRIM([Endpoint])))))", stored: true);
            
        builder.Property(e => e.P256DH).HasMaxLength(255).IsRequired();
        builder.Property(e => e.Auth).HasMaxLength(255).IsRequired();
        builder.Property(e => e.UserAgent).HasMaxLength(500);
        builder.Property(e => e.LastFailureReason).HasMaxLength(400);
        builder.Property(e => e.CreatedAt).HasColumnType("datetime2");
        builder.Property(e => e.UpdatedAt).HasColumnType("datetime2");
        builder.Property(e => e.LastSuccessAt).HasColumnType("datetime2");
        builder.Property(e => e.LastFailureAt).HasColumnType("datetime2");

        builder.HasIndex("UserID", "EndpointHash")
            .IsUnique()
            .HasDatabaseName("UQ_PushSubscriptions_User_EndpointHash");
            
        builder.HasIndex(e => new { e.UserID, e.IsActive })
            .HasDatabaseName("IX_PushSubscriptions_User_IsActive");

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(e => e.UserID)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
