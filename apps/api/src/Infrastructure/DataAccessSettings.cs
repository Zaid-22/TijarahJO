using System;
using Microsoft.Extensions.Configuration;

namespace TijarahJo.Infrastructure.DataAccess
{
    /// <summary>
    /// Resolves the SQL Server connection string at startup.
    /// Priority: full connection string (env or config) > composed DB_* env vars.
    /// Called once during DI composition — no longer a cached static singleton.
    /// </summary>
    public static class DataAccessSettings
    {
        /// <summary>
        /// Builds the connection string from <paramref name="configuration"/>.
        /// </summary>
        public static string ResolveConnectionString(IConfiguration configuration)
        {
            // 1. Full connection string via environment variable or config.
            var envConnectionString = configuration["DATABASE_CONNECTION_STRING"]
                ?? configuration["ConnectionStrings:DefaultConnection"]
                ?? Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING")
                ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

            if (!string.IsNullOrEmpty(envConnectionString))
            {
                return envConnectionString;
            }

            // 2. Compose from discrete DB_* variables.
            var dataSource = configuration["DB_HOST"]
                ?? Environment.GetEnvironmentVariable("DB_HOST")
                ?? "localhost";
            var database = configuration["DB_NAME"]
                ?? Environment.GetEnvironmentVariable("DB_NAME")
                ?? "TijarahJoDB";
            var userId = configuration["DB_USER"]
                ?? Environment.GetEnvironmentVariable("DB_USER");
            var password = configuration["DB_PASSWORD"]
                ?? Environment.GetEnvironmentVariable("DB_PASSWORD");
            var environment = configuration["ASPNETCORE_ENVIRONMENT"]
                ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                ?? "Production";

            bool defaultTrustServerCertificate = string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase);

            var trustServerCertificateValue = configuration["DB_TRUST_SERVER_CERTIFICATE"]
                ?? Environment.GetEnvironmentVariable("DB_TRUST_SERVER_CERTIFICATE");
            bool trustServerCertificate = string.IsNullOrWhiteSpace(trustServerCertificateValue)
                ? defaultTrustServerCertificate
                : bool.TryParse(trustServerCertificateValue, out bool parsedTrust) && parsedTrust;

            var encryptValue = configuration["DB_ENCRYPT"]
                ?? Environment.GetEnvironmentVariable("DB_ENCRYPT");
            bool encrypt = string.IsNullOrWhiteSpace(encryptValue)
                || (bool.TryParse(encryptValue, out bool parsedEncrypt) && parsedEncrypt);

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(password))
            {
                throw new InvalidOperationException(
                    "Database credentials are not configured. Set DATABASE_CONNECTION_STRING " +
                    "or DB_USER and DB_PASSWORD environment variables."
                );
            }

            return $"Data Source={dataSource};Database={database};User Id={userId};Password={password};" +
                   $"Encrypt={encrypt};TrustServerCertificate={trustServerCertificate};";
        }
    }
}
