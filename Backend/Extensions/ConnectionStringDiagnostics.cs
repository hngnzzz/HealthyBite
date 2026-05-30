using Microsoft.Extensions.Configuration;
using MySqlConnector;
using System.Reflection;

namespace Backend.Extensions
{
    internal static class ConnectionStringDiagnostics
    {
        internal static string Summarize(string? connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return "missing";
            }

            try
            {
                var builder = new MySqlConnectionStringBuilder(connectionString);
                return $"Server={builder.Server};Port={builder.Port};Database={builder.Database};User={builder.UserID};Password={(string.IsNullOrWhiteSpace(builder.Password) ? "missing" : "***")}";
            }
            catch
            {
                return "invalid connection string";
            }
        }

        internal static string GetConnectionStringSource(IConfiguration configuration, string key = "ConnectionStrings:DefaultConnection")
        {
            var effectiveValue = configuration[key];

            if (configuration is IConfigurationRoot root)
            {
                foreach (var provider in root.Providers)
                {
                    if (!provider.TryGet(key, out var providerValue))
                    {
                        continue;
                    }

                    if (string.Equals(providerValue, effectiveValue, StringComparison.Ordinal))
                    {
                        return DescribeProvider(provider);
                    }
                }
            }

            return "unknown";
        }

        private static string DescribeProvider(IConfigurationProvider provider)
        {
            var providerName = provider.GetType().Name;

            if (providerName.Contains("UserSecrets", StringComparison.OrdinalIgnoreCase))
            {
                return "user-secrets";
            }

            if (providerName.Contains("EnvironmentVariables", StringComparison.OrdinalIgnoreCase))
            {
                return IsDockerContainer() ? "docker" : "env";
            }

            if (providerName.Contains("Json", StringComparison.OrdinalIgnoreCase))
            {
                var path = GetJsonSourcePath(provider);

                if (!string.IsNullOrWhiteSpace(path))
                {
                    if (path.Contains("secrets", StringComparison.OrdinalIgnoreCase))
                    {
                        return "user-secrets";
                    }

                    if (path.Contains("appsettings", StringComparison.OrdinalIgnoreCase))
                    {
                        return "appsettings";
                    }
                }

                return "appsettings";
            }

            return providerName;
        }

        private static string? GetJsonSourcePath(IConfigurationProvider provider)
        {
            var sourceProperty = provider.GetType().GetProperty("Source", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            var source = sourceProperty?.GetValue(provider);
            var pathProperty = source?.GetType().GetProperty("Path", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);
            return pathProperty?.GetValue(source) as string;
        }

        private static bool IsDockerContainer()
        {
            return string.Equals(Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"), "true", StringComparison.OrdinalIgnoreCase)
                || string.Equals(Environment.GetEnvironmentVariable("RUNNING_IN_CONTAINER"), "true", StringComparison.OrdinalIgnoreCase);
        }
    }
}
