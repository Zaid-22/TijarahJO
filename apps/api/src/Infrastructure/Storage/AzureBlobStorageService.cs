using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TijarahJoDB.Application.Abstractions.Services;

namespace TijarahJoDB.Infrastructure.Storage;

/// <summary>
/// Placeholder implementation for Azure Blob Storage.
/// Replace with real Azure.Storage.Blobs SDK calls when ready.
/// </summary>
public class AzureBlobStorageService : IFileStorageService
{
    private readonly ILogger<AzureBlobStorageService> _logger;

    public AzureBlobStorageService(ILogger<AzureBlobStorageService> logger)
    {
        _logger = logger;
    }

    public Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        // TODO: Implement using Azure.Storage.Blobs BlobContainerClient
        _logger.LogWarning("AzureBlobStorageService.UploadAsync is not yet implemented.");
        throw new NotImplementedException("Azure Blob Storage is not configured. Set 'FileStorage:Provider' to 'Local' or configure Azure credentials.");
    }

    public Task<bool> DeleteAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("AzureBlobStorageService.DeleteAsync is not yet implemented.");
        throw new NotImplementedException("Azure Blob Storage is not configured.");
    }

    public string GetUrl(string fileKey)
    {
        throw new NotImplementedException("Azure Blob Storage is not configured.");
    }
}
