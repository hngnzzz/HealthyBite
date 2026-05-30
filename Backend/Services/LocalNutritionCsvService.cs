using System.Globalization;
using Backend.DTOs;
using Backend.Helpers;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class LocalNutritionCsvService
    {
        private const int LocalCsvFdcIdBase = 8_000_000;

        private readonly IHostEnvironment _hostEnvironment;
        private readonly ILogger<LocalNutritionCsvService> _logger;
        private readonly Lazy<IReadOnlyList<IndexedLocalFood>> _foods;

        public LocalNutritionCsvService(IHostEnvironment hostEnvironment, ILogger<LocalNutritionCsvService> logger)
        {
            _hostEnvironment = hostEnvironment;
            _logger = logger;
            _foods = new Lazy<IReadOnlyList<IndexedLocalFood>>(LoadFoods);
        }

        public int LoadedCount => _foods.Value.Count;

        public IReadOnlyList<UsdaFoodItemResponseDto> Search(IReadOnlyList<string> keywords, int maxResults)
        {
            var normalizedQueries = keywords
                .Select(SearchTextNormalizer.Normalize)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (normalizedQueries.Length == 0)
            {
                return [];
            }

            return _foods.Value
                .Select(food => new
                {
                    Food = food,
                    Score = CalculateScore(food, normalizedQueries),
                    MatchedKeyword = FindMatchedKeyword(food, normalizedQueries)
                })
                .Where(item => item.Score > 0)
                .OrderByDescending(item => item.Score)
                .ThenBy(item => item.Food.Name)
                .Take(maxResults)
                .Select(item => item.Food.ToResponseDto(item.MatchedKeyword))
                .ToList();
        }

        public UsdaFoodItemResponseDto? GetByFdcId(int fdcId)
        {
            return _foods.Value.FirstOrDefault(food => food.FdcId == fdcId)?.ToResponseDto("local");
        }

        private IReadOnlyList<IndexedLocalFood> LoadFoods()
        {
            var csvPath = ResolveCsvPath();
            if (csvPath == null)
            {
                _logger.LogWarning("LocalCsv food search dataset was not found under Data/cleaned_nutrition_dataset.csv.");
                return [];
            }

            try
            {
                using var reader = new StreamReader(csvPath);
                using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    BadDataFound = null,
                    HeaderValidated = null,
                    MissingFieldFound = null,
                    PrepareHeaderForMatch = args => SearchTextNormalizer.Normalize(args.Header).Replace(" ", string.Empty)
                });

                var foods = csv.GetRecords<LocalNutritionCsvRow>()
                    .Select((row, index) => MapRow(row, index))
                    .Where(food => food != null)
                    .Cast<IndexedLocalFood>()
                    .ToList();

                _logger.LogInformation("LocalCsv food search dataset loaded {Count} foods from {Path}.", foods.Count, csvPath);
                return foods;
            }
            catch (Exception ex) when (ex is IOException or CsvHelperException)
            {
                _logger.LogWarning(ex, "LocalCsv food search dataset could not be loaded from {Path}.", csvPath);
                return [];
            }
        }

        private string? ResolveCsvPath()
        {
            var candidates = new[]
            {
                Path.Combine(_hostEnvironment.ContentRootPath, "Data", "cleaned_nutrition_dataset.csv"),
                Path.Combine(AppContext.BaseDirectory, "Data", "cleaned_nutrition_dataset.csv")
            };

            return candidates.FirstOrDefault(File.Exists);
        }

        private static IndexedLocalFood? MapRow(LocalNutritionCsvRow row, int index)
        {
            var name = FirstNonBlank(row.Name, row.EnglishName);
            if (string.IsNullOrWhiteSpace(name))
            {
                return null;
            }

            var servingSize = BuildServingSize(row.ServingSizeValue, row.ServingUnit);
            var searchableText = string.Join(' ', new[]
            {
                row.Name,
                row.EnglishName,
                row.Category,
                row.Source
            }.Where(value => !string.IsNullOrWhiteSpace(value)));

            return new IndexedLocalFood(
                LocalCsvFdcIdBase + index,
                name.Trim(),
                row.Category?.Trim() ?? string.Empty,
                ParseDouble(row.Calories),
                ParseDouble(row.Protein),
                ParseDouble(row.Fat),
                ParseDouble(row.Carbs),
                servingSize,
                row.Source?.Trim() ?? "LocalCsv",
                SearchTextNormalizer.Normalize(searchableText));
        }

        private static int CalculateScore(IndexedLocalFood food, IReadOnlyList<string> normalizedQueries)
        {
            var bestScore = 0;

            foreach (var query in normalizedQueries)
            {
                if (food.NormalizedName == query)
                {
                    bestScore = Math.Max(bestScore, 100);
                }
                else if (food.NormalizedName.Contains(query, StringComparison.OrdinalIgnoreCase))
                {
                    bestScore = Math.Max(bestScore, 80);
                }
                else if (food.SearchableText.Contains(query, StringComparison.OrdinalIgnoreCase))
                {
                    bestScore = Math.Max(bestScore, 60);
                }
            }

            return bestScore;
        }

        private static string FindMatchedKeyword(IndexedLocalFood food, IReadOnlyList<string> normalizedQueries)
        {
            return normalizedQueries.FirstOrDefault(query =>
                food.NormalizedName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                food.SearchableText.Contains(query, StringComparison.OrdinalIgnoreCase)) ?? "local";
        }

        private static string FirstNonBlank(params string?[] values)
        {
            return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)) ?? string.Empty;
        }

        private static double ParseDouble(string? value)
        {
            return double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var number) ? number : 0;
        }

        private static string BuildServingSize(string? value, string? unit)
        {
            var number = ParseDouble(value);
            if (number <= 0)
            {
                return "100 g";
            }

            var displayValue = number.ToString("0.##", CultureInfo.InvariantCulture);
            return string.IsNullOrWhiteSpace(unit) ? displayValue : $"{displayValue} {unit.Trim()}";
        }

        private sealed class LocalNutritionCsvRow
        {
            public string? Name { get; set; }
            public string? EnglishName { get; set; }
            public string? Category { get; set; }
            public string? Calories { get; set; }
            public string? Protein { get; set; }
            public string? Fat { get; set; }
            public string? Carbs { get; set; }
            public string? ServingSizeValue { get; set; }
            public string? ServingUnit { get; set; }
            public string? Source { get; set; }
        }

        private sealed record IndexedLocalFood(
            int FdcId,
            string Name,
            string Category,
            double Calories,
            double Protein,
            double Fat,
            double Carbs,
            string ServingSize,
            string Source,
            string SearchableText)
        {
            public string NormalizedName { get; } = SearchTextNormalizer.Normalize(Name);

            public UsdaFoodItemResponseDto ToResponseDto(string matchedKeyword)
            {
                return new UsdaFoodItemResponseDto
                {
                    FdcId = FdcId,
                    Name = Name,
                    DataType = "LocalCsv",
                    Calories = Calories,
                    Protein = Protein,
                    Fat = Fat,
                    Carbs = Carbs,
                    ServingSize = ServingSize,
                    Category = Category,
                    Source = Source,
                    MatchedKeyword = matchedKeyword,
                    SearchSource = "LocalCsv"
                };
            }
        }
    }
}
