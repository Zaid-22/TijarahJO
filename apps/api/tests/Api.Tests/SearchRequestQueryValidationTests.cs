using System.ComponentModel.DataAnnotations;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJo.Api.Tests;

public sealed class SearchRequestQueryValidationTests
{
    [Fact]
    public void SearchRequestQuery_StatusDeleted_IsRejected_ForPublicSearch()
    {
        var request = new SearchRequestQuery
        {
            Status = "DELETED"
        };

        var validationContext = new ValidationContext(request);
        var validationResults = new List<ValidationResult>();

        bool isValid = Validator.TryValidateObject(
            request,
            validationContext,
            validationResults,
            validateAllProperties: true
        );

        Assert.False(isValid);
        Assert.Contains(validationResults, result =>
            result.MemberNames.Contains(nameof(SearchRequestQuery.Status), StringComparer.Ordinal));
    }
}
