using Backend.Data;
using Backend.DTOs;
using Backend.Helpers;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;
using System.Text;

namespace Backend.Extensions
{
    public static class ServiceCollectionExtensions
    {
        private const string AllowAllCorsPolicy = "AllowAll";

        public static IServiceCollection AddApiConfiguration(this IServiceCollection services)
        {
            services.AddControllers();
            services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                    new BadRequestObjectResult(ApiResponseFactory.ValidationError(context.ModelState));
            });

            return services;
        }

        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            var usdaSection = configuration.GetSection(UsdaOptions.SectionName);
            var usdaOptions = usdaSection.Get<UsdaOptions>() ?? new UsdaOptions();
            usdaOptions.ApiKey = ResolveUsdaApiKey(configuration, usdaOptions.ApiKey);
            var fatSecretSection = configuration.GetSection(FatSecretOptions.SectionName);
            var fatSecretOptions = fatSecretSection.Get<FatSecretOptions>() ?? new FatSecretOptions();
            fatSecretOptions.ClientId = ResolveFatSecretClientId(configuration, fatSecretOptions.ClientId);
            fatSecretOptions.ClientSecret = ResolveFatSecretClientSecret(configuration, fatSecretOptions.ClientSecret);
            var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
            jwtSettings.Key = ResolveJwtKey(configuration, jwtSettings.Key);

            services.Configure<UsdaOptions>(options =>
            {
                options.ApiKey = usdaOptions.ApiKey;
                options.BaseUrl = usdaOptions.BaseUrl;
            });
            services.Configure<FatSecretOptions>(options =>
            {
                options.ClientId = fatSecretOptions.ClientId;
                options.ClientSecret = fatSecretOptions.ClientSecret;
                options.ApiBaseUrl = fatSecretOptions.ApiBaseUrl;
                options.TokenUrl = fatSecretOptions.TokenUrl;
                options.Scope = fatSecretOptions.Scope;
                options.EnableImages = fatSecretOptions.EnableImages;
                options.Locale = fatSecretOptions.Locale;
            });
            services.Configure<JwtSettings>(options =>
            {
                options.Key = jwtSettings.Key;
                options.Issuer = jwtSettings.Issuer;
                options.Audience = jwtSettings.Audience;
                options.AccessTokenExpiryMinutes = jwtSettings.AccessTokenExpiryMinutes;
                options.RefreshTokenExpiryDays = jwtSettings.RefreshTokenExpiryDays;
                options.RefreshTokenCookieName = jwtSettings.RefreshTokenCookieName;
                options.RefreshTokenCookieSecure = jwtSettings.RefreshTokenCookieSecure;
            });
            services.AddHttpClient<UsdaFoodDataClient>((serviceProvider, client) =>
            {
                client.BaseAddress = new Uri(usdaOptions.BaseUrl);
                client.Timeout = TimeSpan.FromSeconds(15);
            });
            services.AddHttpClient<FatSecretFoodSearchClient>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(15);
            });

            services.AddScoped<CsvImportService>();
            services.AddScoped<JwtTokenService>();
            services.AddScoped<AuthService>();
            services.AddScoped<ProfileService>();
            services.AddScoped<MealLogService>();
            services.AddScoped<WeightLogService>();
            services.AddScoped<FoodItemService>();
            services.AddScoped<FoodSearchAliasService>();
            services.AddSingleton<LocalNutritionCsvService>();
            services.AddScoped<HealthAssessmentService>();
            services.AddScoped<DashboardService>();

            return services;
        }

        public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
            jwtSettings.Key = ResolveJwtKey(configuration, jwtSettings.Key);

            if (string.IsNullOrWhiteSpace(jwtSettings.Key) || Encoding.UTF8.GetByteCount(jwtSettings.Key) < 16)
            {
                throw new InvalidOperationException("Jwt:Key must be configured and at least 16 bytes long.");
            }

            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.RequireHttpsMetadata = false;
                    options.SaveToken = false;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
                        ValidateIssuer = true,
                        ValidIssuer = jwtSettings.Issuer,
                        ValidateAudience = true,
                        ValidAudience = jwtSettings.Audience,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromMinutes(1),
                        NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier,
                        RoleClaimType = System.Security.Claims.ClaimTypes.Role
                    };
                });

            services.AddAuthorization();

            return services;
        }

        private static string ResolveUsdaApiKey(IConfiguration configuration, string configuredApiKey)
        {
            if (!string.IsNullOrWhiteSpace(configuredApiKey))
            {
                return configuredApiKey;
            }

            return configuration["USDA_API_KEY"]
                ?? Environment.GetEnvironmentVariable("USDA_API_KEY")
                ?? string.Empty;
        }

        private static string ResolveFatSecretClientId(IConfiguration configuration, string configuredClientId)
        {
            if (!string.IsNullOrWhiteSpace(configuredClientId))
            {
                return configuredClientId;
            }

            return configuration["FATSECRET_CLIENT_ID"]
                ?? Environment.GetEnvironmentVariable("FATSECRET_CLIENT_ID")
                ?? string.Empty;
        }

        private static string ResolveFatSecretClientSecret(IConfiguration configuration, string configuredClientSecret)
        {
            if (!string.IsNullOrWhiteSpace(configuredClientSecret))
            {
                return configuredClientSecret;
            }

            return configuration["FATSECRET_CLIENT_SECRET"]
                ?? Environment.GetEnvironmentVariable("FATSECRET_CLIENT_SECRET")
                ?? string.Empty;
        }

        private static string ResolveJwtKey(IConfiguration configuration, string configuredJwtKey)
        {
            if (!string.IsNullOrWhiteSpace(configuredJwtKey))
            {
                return configuredJwtKey;
            }

            return configuration["JWT_KEY"]
                ?? Environment.GetEnvironmentVariable("JWT_KEY")
                ?? "CHANGE_ME_JWT_KEY";
        }

        public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = DatabaseConnectionStringValidator.ValidateOrThrow(
                configuration.GetConnectionString("DefaultConnection"));

            var serverVersion = new MySqlServerVersion(new Version(10, 4, 32));

            services.AddDbContext<AppDbContext>(options =>
                options.UseMySql(connectionString, serverVersion));

            return services;
        }

        public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
        {
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen();
            return services;
        }

        public static IServiceCollection AddCorsPolicies(this IServiceCollection services, IConfiguration configuration)
        {
            var configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
            var envOrigins = (configuration["CORS_ALLOWED_ORIGINS"] ?? Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS") ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var allowedOrigins = configuredOrigins
                .Concat(envOrigins)
                .Concat(new[] 
                {
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:8081",
                    "http://127.0.0.1:8081"
                })
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            services.AddCors(options =>
            {
                options.AddPolicy(AllowAllCorsPolicy, policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                          .AllowCredentials()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            return services;
        }
    }
}
