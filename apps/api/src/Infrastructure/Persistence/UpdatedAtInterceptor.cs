using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace TijarahJo.Infrastructure.Persistence;

/// <summary>
/// EF Core interceptor that automatically sets UpdatedAt = DateTime.UtcNow
/// for any modified entity that has an UpdatedAt property.
/// Register in DI: options.AddInterceptors(new UpdatedAtInterceptor());
/// </summary>
public sealed class UpdatedAtInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
        {
            SetUpdatedAt(eventData.Context);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
        {
            SetUpdatedAt(eventData.Context);
        }

        return base.SavingChanges(eventData, result);
    }

    private static void SetUpdatedAt(DbContext context)
    {
        var now = DateTime.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State != EntityState.Modified)
                continue;

            // Convention-based: look for a property named "UpdatedAt"
            var updatedAtProp = entry.Properties
                .FirstOrDefault(p => p.Metadata.Name == "UpdatedAt"
                                  && p.Metadata.ClrType == typeof(DateTime));

            if (updatedAtProp is not null)
            {
                updatedAtProp.CurrentValue = now;
            }
        }
    }
}
