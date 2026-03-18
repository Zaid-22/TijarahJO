using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace TijarahJo.Application.Abstractions.Services;

/// <summary>
/// Abstraction for file storage operations so the application can swap
/// between local, Azure Blob, AWS S3, etc. without code changes.
/// </summary>
public interface IFileStorageService
{
    /// <summary>Upload a file and return the public URL.</summary>
    Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);

    /// <summary>Delete a previously uploaded file by its URL or key.</summary>
    Task<bool> DeleteAsync(string fileUrl, CancellationToken cancellationToken = default);

    /// <summary>Get the public URL for a file by its key/path.</summary>
    string GetUrl(string fileKey);
}
