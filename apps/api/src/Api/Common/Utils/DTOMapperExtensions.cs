using TijarahJo.Domain.Models;
using TijarahJoDB.Application.Abstractions.Services;
using TijarahJoDBAPI.Contracts.Responses;

namespace TijarahJoDBAPI.Common.Utils;

/// <summary>
/// Extension-method wrappers around <see cref="DTOMapper"/> for cleaner call sites.
/// Usage: <c>var dto = userModel.ToDTO();</c> instead of <c>DTOMapper.ToUserResponseDTO(userModel)</c>.
/// </summary>
public static class DTOMapperExtensions
{
    public static UserResponseDTO ToDTO(this UserModel model)
        => DTOMapper.ToUserResponseDTO(model);

    public static CategoryResponseDTO ToDTO(this CategoryModel model)
        => DTOMapper.ToCategoryResponseDTO(model);

    public static RoleResponseDTO ToDTO(this RoleModel model)
        => DTOMapper.ToRoleResponseDTO(model);

    public static PostResponseDTO ToDTO(this PostModel model)
        => DTOMapper.ToPostResponseDTO(model);

    public static PostImageResponseDTO ToDTO(this PostImageModel model)
        => DTOMapper.ToPostImageResponseDTO(model);

    public static ReviewResponseDTO ToDTO(this ReviewModel model)
        => DTOMapper.ToReviewResponseDTO(model);

    public static MessageResponseDTO ToDTO(this MessageModel model)
        => DTOMapper.ToMessageResponseDTO(model);

    public static MessageResponseDTO ToDTO(this MessageModel model, int receiverId, int? postId = null)
        => DTOMapper.ToMessageResponseDTO(model, receiverId, postId);

    public static SearchResponseDTO ToDTO(this SearchReadResult result)
        => DTOMapper.ToSearchResponseDTO(result);

    public static TopSellerResponseDTO ToDTO(this TopSellerReadModel model)
        => DTOMapper.ToTopSellerResponseDTO(model);

    public static SellerProfileResponseDTO ToDTO(this SellerProfileReadModel model)
        => DTOMapper.ToSellerProfileResponseDTO(model);

    public static NotificationResponseDTO ToDTO(this NotificationEnvelope model)
        => DTOMapper.ToNotificationResponseDTO(model);

    // List extensions for convenience
    public static IReadOnlyList<UserResponseDTO> ToDTOs(this IEnumerable<UserModel> models)
        => models.Select(m => m.ToDTO()).ToList();

    public static IReadOnlyList<CategoryResponseDTO> ToDTOs(this IEnumerable<CategoryModel> models)
        => models.Select(m => m.ToDTO()).ToList();

    public static IReadOnlyList<RoleResponseDTO> ToDTOs(this IEnumerable<RoleModel> models)
        => models.Select(m => m.ToDTO()).ToList();

    public static IReadOnlyList<PostResponseDTO> ToDTOs(this IEnumerable<PostModel> models)
        => models.Select(m => m.ToDTO()).ToList();

    public static IReadOnlyList<PostImageResponseDTO> ToDTOs(this IEnumerable<PostImageModel> models)
        => models.Select(m => m.ToDTO()).ToList();

    public static IReadOnlyList<ReviewResponseDTO> ToDTOs(this IEnumerable<ReviewModel> models)
        => models.Select(m => m.ToDTO()).ToList();

    public static IReadOnlyList<MessageResponseDTO> ToDTOs(this IEnumerable<MessageModel> models)
        => models.Select(m => m.ToDTO()).ToList();

    public static IReadOnlyList<NotificationResponseDTO> ToDTOs(this IEnumerable<NotificationEnvelope> models)
        => models.Select(m => m.ToDTO()).ToList();
}
