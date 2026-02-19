using Microsoft.EntityFrameworkCore;

namespace TijarahJoDB.DAL.Persistence;

public sealed class TijarahJoDbContext : DbContext
{
    public TijarahJoDbContext(DbContextOptions<TijarahJoDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<RoleEntity> Roles => Set<RoleEntity>();
    public DbSet<PostEntity> Posts => Set<PostEntity>();
    public DbSet<CategoryEntity> Categories => Set<CategoryEntity>();
    public DbSet<PostImageEntity> PostImages => Set<PostImageEntity>();
    public DbSet<FavoriteEntity> Favorites => Set<FavoriteEntity>();
    public DbSet<MessageEntity> Messages => Set<MessageEntity>();
    public DbSet<ReviewEntity> Reviews => Set<ReviewEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.ToTable("TbUsers");
            entity.HasKey(e => e.UserID);
            entity.Property(e => e.UserID).ValueGeneratedOnAdd();
            entity.Property(e => e.HashedPassword).HasMaxLength(255);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Area).HasMaxLength(100);
            entity.Property(e => e.Bio).HasMaxLength(1000);
            entity.Property(e => e.JoinDate).HasColumnType("datetime2");
            entity.HasOne<RoleEntity>()
                .WithMany()
                .HasForeignKey(e => e.RoleID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RoleEntity>(entity =>
        {
            entity.ToTable("TbRoles");
            entity.HasKey(e => e.RoleID);
            entity.Property(e => e.RoleID).ValueGeneratedOnAdd();
            entity.Property(e => e.RoleName).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
        });

        modelBuilder.Entity<PostEntity>(entity =>
        {
            entity.ToTable("TbPosts");
            entity.HasKey(e => e.PostID);
            entity.Property(e => e.PostID).ValueGeneratedOnAdd();
            entity.Property(e => e.PostTitle).HasMaxLength(200);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Area).HasMaxLength(100);
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CategoryEntity>()
                .WithMany()
                .HasForeignKey(e => e.CategoryID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CategoryEntity>(entity =>
        {
            entity.ToTable("TbItemCategories");
            entity.HasKey(e => e.CategoryID);
            entity.Property(e => e.CategoryID).ValueGeneratedOnAdd();
            entity.Property(e => e.CategoryName).HasMaxLength(100);
            entity.Property(e => e.NameAr).HasMaxLength(100);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.Property(e => e.Color).HasMaxLength(20);
            entity.Property(e => e.Image).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
        });

        modelBuilder.Entity<PostImageEntity>(entity =>
        {
            entity.ToTable("TbPostImages");
            entity.HasKey(e => e.PostImageID);
            entity.Property(e => e.PostImageID).ValueGeneratedOnAdd();
            entity.Property(e => e.PostImageURL).HasColumnType("nvarchar(max)");
            entity.Property(e => e.UploadedAt).HasColumnType("datetime2");
            entity.HasOne<PostEntity>()
                .WithMany()
                .HasForeignKey(e => e.PostID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FavoriteEntity>(entity =>
        {
            entity.ToTable("TbFavorites");
            entity.HasKey(e => e.FavoriteID);
            entity.Property(e => e.FavoriteID).ValueGeneratedOnAdd();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.HasIndex(e => new { e.UserID, e.PostID }).IsUnique();
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.UserID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<PostEntity>()
                .WithMany()
                .HasForeignKey(e => e.PostID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MessageEntity>(entity =>
        {
            entity.ToTable("TbMessages");
            entity.HasKey(e => e.MessageID);
            entity.Property(e => e.MessageID).ValueGeneratedOnAdd();
            entity.Property(e => e.Timestamp).HasColumnName("Timestamp").HasColumnType("datetime2");
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.SenderID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.ReceiverID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<PostEntity>()
                .WithMany()
                .HasForeignKey(e => e.PostID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ReviewEntity>(entity =>
        {
            entity.ToTable("TbReviews");
            entity.HasKey(e => e.ReviewID);
            entity.Property(e => e.ReviewID).ValueGeneratedOnAdd();
            entity.Property(e => e.Timestamp).HasColumnName("Timestamp").HasColumnType("datetime2");
            entity.HasIndex(e => new { e.ReviewerID, e.ReviewedUserID }).IsUnique();
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.ReviewerID)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<UserEntity>()
                .WithMany()
                .HasForeignKey(e => e.ReviewedUserID)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}

public sealed class UserEntity
{
    public int UserID { get; set; }
    public string HashedPassword { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? Area { get; set; }
    public string? Bio { get; set; }
    public string? Avatar { get; set; }
    public DateTime JoinDate { get; set; }
    public int Status { get; set; }
    public int RoleID { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class RoleEntity
{
    public int RoleID { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class PostEntity
{
    public int PostID { get; set; }
    public int UserID { get; set; }
    public int CategoryID { get; set; }
    public string PostTitle { get; set; } = string.Empty;
    public string? PostDescription { get; set; }
    public decimal? Price { get; set; }
    public int Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public int Views { get; set; }
    public string? City { get; set; }
    public string? Area { get; set; }
}

public sealed class CategoryEntity
{
    public int CategoryID { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public string? Image { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class PostImageEntity
{
    public int PostImageID { get; set; }
    public int PostID { get; set; }
    public string PostImageURL { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public DateTime UploadedAt { get; set; }
}

public sealed class FavoriteEntity
{
    public int FavoriteID { get; set; }
    public int UserID { get; set; }
    public int PostID { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeleted { get; set; }
}

public sealed class MessageEntity
{
    public int MessageID { get; set; }
    public int SenderID { get; set; }
    public int ReceiverID { get; set; }
    public int? PostID { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool IsRead { get; set; }
}

public sealed class ReviewEntity
{
    public int ReviewID { get; set; }
    public int ReviewerID { get; set; }
    public int ReviewedUserID { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
