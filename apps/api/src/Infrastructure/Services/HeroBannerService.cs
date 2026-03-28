using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TijarahJo.Application.Abstractions.Services;
using TijarahJo.Domain.Entities;
using TijarahJo.Infrastructure.Persistence;

namespace TijarahJo.Infrastructure.Services;

public sealed class HeroBannerService(TijarahJoDbContext dbContext) : IHeroBannerService
{
    private readonly TijarahJoDbContext _dbContext = dbContext;

    public async Task<HeroBannerListResult> GetActiveBannersAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var banners = await _dbContext.HeroBanners
                .AsNoTracking()
                .Where(b => b.IsActive)
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new HeroBannerModel
                {
                    BannerID = b.BannerID,
                    Title = b.Title,
                    TitleAr = b.TitleAr,
                    Subtitle = b.Subtitle,
                    SubtitleAr = b.SubtitleAr,
                    ButtonText = b.ButtonText,
                    ButtonTextAr = b.ButtonTextAr,
                    ImageUrl = b.ImageUrl,
                    BgClass = b.BgClass,
                    TextClass = b.TextClass,
                    AltText = b.AltText,
                    AltTextAr = b.AltTextAr,
                    LinkUrl = b.LinkUrl,
                    IsActive = b.IsActive,
                    DisplayOrder = b.DisplayOrder
                })
                .ToListAsync(cancellationToken);

            return new HeroBannerListResult { Success = true, StatusCode = 200, Banners = banners };
        }
        catch
        {
            return new HeroBannerListResult { Success = false, StatusCode = 500, Message = "Failed to fetch active banners." };
        }
    }

    public async Task<HeroBannerListResult> GetAllBannersAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var banners = await _dbContext.HeroBanners
                .AsNoTracking()
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new HeroBannerModel
                {
                    BannerID = b.BannerID,
                    Title = b.Title,
                    TitleAr = b.TitleAr,
                    Subtitle = b.Subtitle,
                    SubtitleAr = b.SubtitleAr,
                    ButtonText = b.ButtonText,
                    ButtonTextAr = b.ButtonTextAr,
                    ImageUrl = b.ImageUrl,
                    BgClass = b.BgClass,
                    TextClass = b.TextClass,
                    AltText = b.AltText,
                    AltTextAr = b.AltTextAr,
                    LinkUrl = b.LinkUrl,
                    IsActive = b.IsActive,
                    DisplayOrder = b.DisplayOrder
                })
                .ToListAsync(cancellationToken);

            return new HeroBannerListResult { Success = true, StatusCode = 200, Banners = banners };
        }
        catch
        {
            return new HeroBannerListResult { Success = false, StatusCode = 500, Message = "Failed to fetch all banners." };
        }
    }

    public async Task<HeroBannerMutationResult> CreateBannerAsync(CreateHeroBannerCommand command, CancellationToken cancellationToken = default)
    {
        var entity = new HeroBannerEntity
        {
            Title = command.Title ?? "",
            TitleAr = command.TitleAr ?? "",
            Subtitle = command.Subtitle ?? "",
            SubtitleAr = command.SubtitleAr ?? "",
            ButtonText = command.ButtonText ?? "",
            ButtonTextAr = command.ButtonTextAr ?? "",
            ImageUrl = command.ImageUrl ?? "",
            BgClass = command.BgClass ?? "",
            TextClass = command.TextClass ?? "",
            AltText = command.AltText ?? "",
            AltTextAr = command.AltTextAr ?? "",
            LinkUrl = command.LinkUrl,
            IsActive = command.IsActive,
            DisplayOrder = command.DisplayOrder
        };

        _dbContext.HeroBanners.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new HeroBannerMutationResult
        {
            Success = true,
            StatusCode = 201,
            Banner = new HeroBannerModel { BannerID = entity.BannerID, IsActive = entity.IsActive, DisplayOrder = entity.DisplayOrder }
        };
    }

    public async Task<HeroBannerMutationResult> UpdateBannerAsync(int bannerId, CreateHeroBannerCommand command, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.HeroBanners.FirstOrDefaultAsync(b => b.BannerID == bannerId, cancellationToken);
        if (entity == null)
            return new HeroBannerMutationResult { Success = false, StatusCode = 404, Message = "Banner not found" };

        entity.Title = command.Title ?? "";
        entity.TitleAr = command.TitleAr ?? "";
        entity.Subtitle = command.Subtitle ?? "";
        entity.SubtitleAr = command.SubtitleAr ?? "";
        entity.ButtonText = command.ButtonText ?? "";
        entity.ButtonTextAr = command.ButtonTextAr ?? "";
        entity.ImageUrl = command.ImageUrl ?? "";
        entity.BgClass = command.BgClass ?? "";
        entity.TextClass = command.TextClass ?? "";
        entity.AltText = command.AltText ?? "";
        entity.AltTextAr = command.AltTextAr ?? "";
        entity.LinkUrl = command.LinkUrl;
        entity.IsActive = command.IsActive;
        entity.DisplayOrder = command.DisplayOrder;
        entity.UpdatedAt = System.DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new HeroBannerMutationResult { Success = true, StatusCode = 200 };
    }

    public async Task<HeroBannerMutationResult> DeleteBannerAsync(int bannerId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.HeroBanners.FirstOrDefaultAsync(b => b.BannerID == bannerId, cancellationToken);
        if (entity == null)
            return new HeroBannerMutationResult { Success = false, StatusCode = 404, Message = "Banner not found" };

        _dbContext.HeroBanners.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new HeroBannerMutationResult { Success = true, StatusCode = 200 };
    }

    public async Task<bool> ToggleBannerActiveAsync(int bannerId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.HeroBanners.FirstOrDefaultAsync(b => b.BannerID == bannerId, cancellationToken);
        if (entity == null) return false;

        entity.IsActive = !entity.IsActive;
        entity.UpdatedAt = System.DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
