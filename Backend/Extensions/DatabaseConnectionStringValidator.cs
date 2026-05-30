using MySqlConnector;

namespace Backend.Extensions
{
    internal static class DatabaseConnectionStringValidator
    {
        internal static string ValidateOrThrow(string? connectionString, string sourceName = "ConnectionStrings:DefaultConnection")
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(BuildMissingConnectionStringMessage(sourceName));
            }

            var builder = new MySqlConnectionStringBuilder(connectionString);
            var password = builder.Password?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(password) || IsPlaceholder(password))
            {
                throw new InvalidOperationException(BuildMissingPasswordMessage(builder, sourceName));
            }

            return builder.ConnectionString;
        }

        private static string BuildMissingConnectionStringMessage(string sourceName)
        {
            return $"Missing database connection string. Set {sourceName} via user secrets or ConnectionStrings__DefaultConnection before running dotnet run. Example: dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"Server=127.0.0.1;Port=3307;Database=healthymeal;Uid=healthymeal;Pwd=YOUR_LOCAL_DB_PASSWORD;SslMode=None;AllowPublicKeyRetrieval=True;Connection Timeout=3;Default Command Timeout=5;\"";
        }

        private static string BuildMissingPasswordMessage(MySqlConnectionStringBuilder builder, string sourceName)
        {
            var user = string.IsNullOrWhiteSpace(builder.UserID) ? "(not set)" : builder.UserID;
            var summary = $"Server={builder.Server};Port={builder.Port};Database={builder.Database};Uid={user}";

            if (string.Equals(builder.UserID, "root", StringComparison.OrdinalIgnoreCase))
            {
                return $"{sourceName} is using MariaDB root without a password ({summary}). Use the real root password or create a dedicated local user such as 'healthymeal', then run: dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"Server=127.0.0.1;Port=3307;Database=healthymeal;Uid=healthymeal;Pwd=YOUR_LOCAL_DB_PASSWORD;SslMode=None;AllowPublicKeyRetrieval=True;Connection Timeout=3;Default Command Timeout=5;\"";
            }

            return $"{sourceName} is missing a real password or still contains a placeholder ({summary}). Set it before running dotnet run: dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"Server=127.0.0.1;Port=3307;Database=healthymeal;Uid={user};Pwd=YOUR_LOCAL_DB_PASSWORD;SslMode=None;AllowPublicKeyRetrieval=True;Connection Timeout=3;Default Command Timeout=5;\". You can also set ConnectionStrings__DefaultConnection as an environment variable.";
        }

        private static bool IsPlaceholder(string value)
        {
            return value.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase)
                || value.Contains("YOUR_", StringComparison.OrdinalIgnoreCase)
                || value.Contains("TODO", StringComparison.OrdinalIgnoreCase);
        }
    }
}
