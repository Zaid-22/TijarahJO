using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Configuration;

namespace TijarahJo.Api.Common.Health;

public sealed class DatabaseConnectivityHealthCheck(IConfiguration configuration) : IHealthCheck
{

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new SqlConnection(GetConnectionString());
            await connection.OpenAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandType = CommandType.Text;
            command.CommandText = "SELECT 1";
            await command.ExecuteScalarAsync(cancellationToken);
            return HealthCheckResult.Healthy("Database connectivity check passed.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connectivity check failed.", ex);
        }
    }

    private string GetConnectionString()
    {
        string? connectionString =
            configuration["DATABASE_CONNECTION_STRING"] ??
            configuration.GetConnectionString("DefaultConnection") ??
            Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING") ??
            Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        string dataSource = configuration["DB_HOST"] ?? Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
        string database = configuration["DB_NAME"] ?? Environment.GetEnvironmentVariable("DB_NAME") ?? "TijarahJoDB";
        string? userId = configuration["DB_USER"] ?? Environment.GetEnvironmentVariable("DB_USER");
        string? password = configuration["DB_PASSWORD"] ?? Environment.GetEnvironmentVariable("DB_PASSWORD");
        string environment = configuration["ASPNETCORE_ENVIRONMENT"] ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";

        bool defaultTrustServerCertificate = string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase);
        string? trustServerCertificateValue = configuration["DB_TRUST_SERVER_CERTIFICATE"] ?? Environment.GetEnvironmentVariable("DB_TRUST_SERVER_CERTIFICATE");
        bool trustServerCertificate = string.IsNullOrWhiteSpace(trustServerCertificateValue)
            ? defaultTrustServerCertificate
            : bool.TryParse(trustServerCertificateValue, out bool parsedTrustServerCertificate) && parsedTrustServerCertificate;

        string? encryptValue = configuration["DB_ENCRYPT"] ?? Environment.GetEnvironmentVariable("DB_ENCRYPT");
        bool encrypt = string.IsNullOrWhiteSpace(encryptValue) || (bool.TryParse(encryptValue, out bool parsedEncrypt) && parsedEncrypt);

        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                "Database connection is not configured. Set DATABASE_CONNECTION_STRING or DB_USER and DB_PASSWORD environment variables."
            );
        }

        return $"Data Source={dataSource};Database={database};User Id={userId};Password={password};Encrypt={encrypt};TrustServerCertificate={trustServerCertificate};";
    }
}
