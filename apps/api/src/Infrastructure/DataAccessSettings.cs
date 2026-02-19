using System;

namespace TijarahJoDB_DataAccess
{
    public static class DataAccessSettings
    {
        // Connection string must come from environment variables.
        // Priority: full connection string variable > composed DB_* variables.
        
        private static string? _connectionString;
        
        public static string ConnectionString
        {
            get
            {
                if (_connectionString != null)
                    return _connectionString;

                // Full connection string via environment variable.
                var envConnectionString = Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING")
                    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
                if (!string.IsNullOrEmpty(envConnectionString))
                {
                    _connectionString = envConnectionString;
                    return _connectionString;
                }

                // Compose connection string from discrete DB environment variables.
                var dataSource = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
                var database = Environment.GetEnvironmentVariable("DB_NAME") ?? "TijarahJoDB";
                var userId = Environment.GetEnvironmentVariable("DB_USER");
                var password = Environment.GetEnvironmentVariable("DB_PASSWORD");
                var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
                bool defaultTrustServerCertificate = string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase);

                var trustServerCertificateValue = Environment.GetEnvironmentVariable("DB_TRUST_SERVER_CERTIFICATE");
                bool trustServerCertificate = string.IsNullOrWhiteSpace(trustServerCertificateValue)
                    ? defaultTrustServerCertificate
                    : bool.TryParse(trustServerCertificateValue, out bool parsedTrustServerCertificate) && parsedTrustServerCertificate;

                var encryptValue = Environment.GetEnvironmentVariable("DB_ENCRYPT");
                bool encrypt = string.IsNullOrWhiteSpace(encryptValue)
                    ? true
                    : bool.TryParse(encryptValue, out bool parsedEncrypt) && parsedEncrypt;

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(password))
                {
                    throw new InvalidOperationException(
                        "Database credentials are not configured. Set DATABASE_CONNECTION_STRING " +
                        "or DB_USER and DB_PASSWORD environment variables."
                    );
                }

                _connectionString =
                    $"Data Source={dataSource};Database={database};User Id={userId};Password={password};" +
                    $"Encrypt={encrypt};TrustServerCertificate={trustServerCertificate};";
                return _connectionString;
            }
        }
    }

}
