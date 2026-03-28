using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

public sealed class HeroBannerModel
{
    public int BannerID { get; init; }
    public string Title { get; init; } = string.Empty;
    public string TitleAr { get; init; } = string.Empty;
    public string Subtitle { get; init; } = string.Empty;
    public string SubtitleAr { get; init; } = string.Empty;
    public string ButtonText { get; init; } = string.Empty;
    public string ButtonTextAr { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public string BgClass { get; init; } = string.Empty;
    public string TextClass { get; init; } = string.Empty;
    public string AltText { get; init; } = string.Empty;
    public string AltTextAr { get; init; } = string.Empty;
    public string? LinkUrl { get; init; }
    public bool IsActive { get; init; }
    public int DisplayOrder { get; init; }
}

public sealed class HeroBannerListResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<HeroBannerModel> Banners { get; init; } = Array.Empty<HeroBannerModel>();
}

public sealed class HeroBannerMutationResult
{
    public bool Success { get; init; }
    public int StatusCode { get; init; }
    public string? Message { get; init; }
    public HeroBannerModel? Banner { get; init; }
}

public sealed class CreateHeroBannerCommand
{
    public string Title { get; init; } = string.Empty;
    public string TitleAr { get; init; } = string.Empty;
    public string Subtitle { get; init; } = string.Empty;
    public string SubtitleAr { get; init; } = string.Empty;
    public string ButtonText { get; init; } = string.Empty;
    public string ButtonTextAr { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public string BgClass { get; init; } = string.Empty;
    public string TextClass { get; init; } = string.Empty;
    public string AltText { get; init; } = string.Empty;
    public string AltTextAr { get; init; } = string.Empty;
    public string? LinkUrl { get; init; }
    public bool IsActive { get; init; }
    public int DisplayOrder { get; init; }
}

public interface IHeroBannerService
{
    Task<HeroBannerListResult> GetActiveBannersAsync(CancellationToken cancellationToken = default);
    Task<HeroBannerListResult> GetAllBannersAsync(CancellationToken cancellationToken = default);
    Task<HeroBannerMutationResult> CreateBannerAsync(CreateHeroBannerCommand command, CancellationToken cancellationToken = default);
    Task<HeroBannerMutationResult> UpdateBannerAsync(int bannerId, CreateHeroBannerCommand command, CancellationToken cancellationToken = default);
    Task<HeroBannerMutationResult> DeleteBannerAsync(int bannerId, CancellationToken cancellationToken = default);
    Task<bool> ToggleBannerActiveAsync(int bannerId, CancellationToken cancellationToken = default);
}
