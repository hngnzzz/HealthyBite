using Backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Backend.Extensions
{
    public static class ApplicationBuilderExtensions
    {
        private const string AllowAllCorsPolicy = "AllowAll";

        public static WebApplication UseApiConfiguration(this WebApplication app)
        {
            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            InitializeDatabase(app);

            app.UseCors(AllowAllCorsPolicy);

            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseAuthentication();
            app.UseAuthorization();
            app.MapGet("/health/live", () => Results.Text("Healthy"));
            app.MapGet("/health/ready", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
            {
                var ready = await IsDatabaseReadyAsync(dbContext, cancellationToken);
                return ready ? Results.Text("Healthy") : Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
            });
            app.MapControllers();

            return app;
        }

        private static void InitializeDatabase(WebApplication app)
        {
            try
            {
                using (var scope = app.Services.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    dbContext.Database.EnsureCreated();
                    EnsureWeightLogsTable(dbContext);
                }
            }
            catch (Exception ex)
            {
                var configuredConnection = app.Configuration.GetConnectionString("DefaultConnection");
                var connectionSource = ConnectionStringDiagnostics.GetConnectionStringSource(app.Configuration);
                app.Logger.LogError(
                    ex,
                    "Failed to initialize the database. Connection source: {ConnectionSource}. Current database target: {ConnectionSummary}. For local dotnet run use host 127.0.0.1 with the mapped DB port. For Docker backend use the compose database service name with port 3306.",
                    connectionSource,
                    ConnectionStringDiagnostics.Summarize(configuredConnection));
                throw new InvalidOperationException("Database startup failed. Fix the local MariaDB connection string or password and run again.", ex);
            }
        }

        private static void EnsureWeightLogsTable(AppDbContext dbContext)
        {
            dbContext.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS `weight_logs` (
                    `id` INT NOT NULL AUTO_INCREMENT,
                    `profile_id` INT NOT NULL,
                    `user_id` INT NOT NULL,
                    `weight_kg` DOUBLE NOT NULL,
                    `logged_date` DATETIME(6) NOT NULL,
                    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    PRIMARY KEY (`id`),
                    INDEX `ix_weight_logs_profile_date` (`profile_id`, `logged_date`),
                    INDEX `ix_weight_logs_user_id` (`user_id`),
                    CONSTRAINT `fk_weight_logs_profiles_profile_id`
                        FOREIGN KEY (`profile_id`) REFERENCES `health_profiles` (`id`) ON DELETE CASCADE,
                    CONSTRAINT `fk_weight_logs_users_user_id`
                        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
                );");
        }

        private static async Task<bool> IsDatabaseReadyAsync(AppDbContext dbContext, CancellationToken cancellationToken)
        {
            try
            {
                if (!await dbContext.Database.CanConnectAsync(cancellationToken))
                {
                    return false;
                }

                var requiredTables = new[]
                {
                    "users",
                    "health_profiles",
                    "foods",
                    "meal_logs",
                    "meal_log_items",
                    "refresh_tokens",
                    "weight_logs"
                };

                foreach (var tableName in requiredTables)
                {
                    if (!await TableExistsAsync(dbContext, tableName, cancellationToken))
                    {
                        return false;
                    }
                }

                var requiredColumns = new Dictionary<string, string[]>
                {
                    ["users"] = new[]
                    {
                        "id", "full_name", "email", "password_hash", "gender", "birth_date", "status", "created_at", "updated_at"
                    },
                    ["health_profiles"] = new[]
                    {
                        "id", "user_id", "height_cm", "weight_kg", "target_weight_kg", "goal", "activity_level", "diet_plan",
                        "target_calories", "target_protein", "target_fat", "target_carbs", "water_goal_ml", "health_status",
                        "nickname", "food_allergies", "favorite_foods", "disliked_foods", "nutrition_constraints",
                        "eating_habits", "workout_schedule", "sleep_time", "wake_time", "measurement_unit",
                        "bmi", "special_status_flag", "created_at", "updated_at"
                    },
                    ["foods"] = new[]
                    {
                        "id", "name", "calories", "protein", "fat", "carbs", "serving_size", "serving_unit"
                    },
                    ["meal_logs"] = new[]
                    {
                        "id", "user_id", "log_date", "meal_type", "total_calories", "total_protein", "total_fat", "total_carbs"
                    },
                    ["meal_log_items"] = new[]
                    {
                        "id", "meal_log_id", "food_id", "item_type", "item_name", "quantity", "calories", "protein", "fat", "carbs"
                    },
                    ["refresh_tokens"] = new[]
                    {
                        "id", "user_id", "token_hash", "expires_at", "created_at", "created_by_ip", "revoked_at", "revoked_by_ip", "replaced_by_token_hash"
                    },
                    ["weight_logs"] = new[]
                    {
                        "id", "profile_id", "user_id", "weight_kg", "logged_date", "created_at"
                    }
                };

                foreach (var (tableName, columns) in requiredColumns)
                {
                    if (!await TableHasColumnsAsync(dbContext, tableName, columns, cancellationToken))
                    {
                        return false;
                    }
                }

                return true;
            }
            catch
            {
                return false;
            }
        }

        private static async Task<bool> TableExistsAsync(AppDbContext dbContext, string tableName, CancellationToken cancellationToken)
        {
            var connection = dbContext.Database.GetDbConnection();
            await EnsureConnectionOpenAsync(connection, cancellationToken);

            await using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = @tableName;";

            var tableNameParameter = command.CreateParameter();
            tableNameParameter.ParameterName = "@tableName";
            tableNameParameter.Value = tableName;
            command.Parameters.Add(tableNameParameter);

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result) > 0;
        }

        private static async Task<bool> TableHasColumnsAsync(AppDbContext dbContext, string tableName, IEnumerable<string> columnNames, CancellationToken cancellationToken)
        {
            var connection = dbContext.Database.GetDbConnection();
            await EnsureConnectionOpenAsync(connection, cancellationToken);

            var columnList = columnNames.ToArray();
            if (columnList.Length == 0)
            {
                return true;
            }

            var placeholders = string.Join(", ", columnList.Select((_, index) => $"@column{index}"));
            await using var command = connection.CreateCommand();
            command.CommandText = $@"
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = @tableName
                    AND COLUMN_NAME IN ({placeholders});";

            var tableNameParameter = command.CreateParameter();
            tableNameParameter.ParameterName = "@tableName";
            tableNameParameter.Value = tableName;
            command.Parameters.Add(tableNameParameter);

            for (var index = 0; index < columnList.Length; index++)
            {
                var columnParameter = command.CreateParameter();
                columnParameter.ParameterName = $"@column{index}";
                columnParameter.Value = columnList[index];
                command.Parameters.Add(columnParameter);
            }

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return Convert.ToInt32(result) == columnList.Length;
        }

        private static async Task EnsureConnectionOpenAsync(System.Data.Common.DbConnection connection, CancellationToken cancellationToken)
        {
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync(cancellationToken);
            }
        }
    }
}
