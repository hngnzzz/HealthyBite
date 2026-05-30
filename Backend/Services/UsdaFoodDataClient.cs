using System.Globalization;
using System.Net;
using System.Text.Json;
using Backend.Common;
using Backend.DTOs;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace Backend.Services
{
    public class UsdaFoodDataClient
    {
        private static readonly string[] CaloriesNames = ["Energy"];
        private static readonly string[] ProteinNames = ["Protein"];
        private static readonly string[] FatNames = ["Total lipid (fat)", "Total Fat"];
        private static readonly string[] CarbNames = ["Carbohydrate, by difference", "Carbohydrate"];
        private static readonly HashSet<string> CaloriesNumbers = ["208", "957"];
        private static readonly HashSet<string> ProteinNumbers = ["203"];
        private static readonly HashSet<string> FatNumbers = ["204"];
        private static readonly HashSet<string> CarbNumbers = ["205"];

        private readonly HttpClient _httpClient;
        private readonly UsdaOptions _options;

        public UsdaFoodDataClient(HttpClient httpClient, IOptions<UsdaOptions> options)
        {
            _httpClient = httpClient;
            _options = options.Value;
        }

        public async Task<ServiceResult<List<UsdaFoodItemResponseDto>>> SearchFoodsAsync(string keyword, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                return ServiceResult<List<UsdaFoodItemResponseDto>>.BadRequest(AppMessages.UsdaApiKeyMissing);
            }

            var query = new Dictionary<string, string?>
            {
                ["query"] = keyword.Trim(),
                ["pageSize"] = "20",
                ["api_key"] = _options.ApiKey
            };

            var requestUri = QueryHelpers.AddQueryString("foods/search", query);

            try
            {
                using var response = await _httpClient.GetAsync(requestUri, cancellationToken);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return ServiceResult<List<UsdaFoodItemResponseDto>>.Ok([], AppMessages.SearchUsdaFoodsSuccess);
                }

                if (!response.IsSuccessStatusCode)
                {
                    return ServiceResult<List<UsdaFoodItemResponseDto>>.BadRequest(AppMessages.UsdaLookupFailed);
                }

                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

                if (!document.RootElement.TryGetProperty("foods", out var foodsElement) || foodsElement.ValueKind != JsonValueKind.Array)
                {
                    return ServiceResult<List<UsdaFoodItemResponseDto>>.Ok([], AppMessages.SearchUsdaFoodsSuccess);
                }

                var foods = foodsElement
                    .EnumerateArray()
                    .Select(MapFood)
                    .Where(item => item != null)
                    .Cast<UsdaFoodItemResponseDto>()
                    .ToList();

                return ServiceResult<List<UsdaFoodItemResponseDto>>.Ok(foods, AppMessages.SearchUsdaFoodsSuccess);
            }
            catch (HttpRequestException)
            {
                return ServiceResult<List<UsdaFoodItemResponseDto>>.BadRequest(AppMessages.UsdaLookupFailed);
            }
            catch (JsonException)
            {
                return ServiceResult<List<UsdaFoodItemResponseDto>>.BadRequest(AppMessages.UsdaLookupFailed);
            }
        }

        public async Task<ServiceResult<UsdaFoodItemResponseDto>> GetFoodByIdAsync(int fdcId, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                return ServiceResult<UsdaFoodItemResponseDto>.BadRequest(AppMessages.UsdaApiKeyMissing);
            }

            var requestUri = QueryHelpers.AddQueryString($"food/{fdcId}", "api_key", _options.ApiKey);

            try
            {
                using var response = await _httpClient.GetAsync(requestUri, cancellationToken);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return ServiceResult<UsdaFoodItemResponseDto>.NotFound(AppMessages.FoodNotFound);
                }

                if (!response.IsSuccessStatusCode)
                {
                    return ServiceResult<UsdaFoodItemResponseDto>.BadRequest(AppMessages.UsdaLookupFailed);
                }

                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
                var food = MapFood(document.RootElement);

                return food == null
                    ? ServiceResult<UsdaFoodItemResponseDto>.NotFound(AppMessages.FoodNotFound)
                    : ServiceResult<UsdaFoodItemResponseDto>.Ok(food, AppMessages.GetUsdaFoodSuccess);
            }
            catch (HttpRequestException)
            {
                return ServiceResult<UsdaFoodItemResponseDto>.BadRequest(AppMessages.UsdaLookupFailed);
            }
            catch (JsonException)
            {
                return ServiceResult<UsdaFoodItemResponseDto>.BadRequest(AppMessages.UsdaLookupFailed);
            }
        }

        private static UsdaFoodItemResponseDto? MapFood(JsonElement foodElement)
        {
            if (!TryGetInt32(foodElement, "fdcId", out var fdcId))
            {
                return null;
            }

            var nutrients = ExtractNutrients(foodElement);
            var description = GetString(foodElement, "description");

            return new UsdaFoodItemResponseDto
            {
                FdcId = fdcId,
                Name = string.IsNullOrWhiteSpace(description) ? $"USDA Food #{fdcId}" : description,
                DataType = GetString(foodElement, "dataType"),
                Calories = FindNutrientValue(nutrients, CaloriesNames, CaloriesNumbers),
                Protein = FindNutrientValue(nutrients, ProteinNames, ProteinNumbers),
                Fat = FindNutrientValue(nutrients, FatNames, FatNumbers),
                Carbs = FindNutrientValue(nutrients, CarbNames, CarbNumbers),
                ServingSize = BuildServingSize(foodElement),
                Category = GetFoodCategory(foodElement),
                Source = "USDA"
            };
        }

        private static List<NutrientValue> ExtractNutrients(JsonElement foodElement)
        {
            var nutrients = new List<NutrientValue>();

            if (!foodElement.TryGetProperty("foodNutrients", out var nutrientsElement) || nutrientsElement.ValueKind != JsonValueKind.Array)
            {
                return nutrients;
            }

            foreach (var nutrientElement in nutrientsElement.EnumerateArray())
            {
                var nutrientName = GetString(nutrientElement, "nutrientName");
                var nutrientNumber = GetString(nutrientElement, "nutrientNumber");

                if (nutrientElement.TryGetProperty("nutrient", out var nestedNutrient) && nestedNutrient.ValueKind == JsonValueKind.Object)
                {
                    nutrientName = string.IsNullOrWhiteSpace(nutrientName) ? GetString(nestedNutrient, "name") : nutrientName;
                    nutrientNumber = string.IsNullOrWhiteSpace(nutrientNumber) ? GetString(nestedNutrient, "number") : nutrientNumber;
                }

                var value = GetDouble(nutrientElement, "value")
                    ?? GetDouble(nutrientElement, "amount");

                if (value == null)
                {
                    continue;
                }

                nutrients.Add(new NutrientValue(nutrientName, nutrientNumber, value.Value));
            }

            return nutrients;
        }

        private static double FindNutrientValue(
            IEnumerable<NutrientValue> nutrients,
            IEnumerable<string> acceptedNames,
            ISet<string> acceptedNumbers)
        {
            var matchedByNumber = nutrients.FirstOrDefault(nutrient =>
                !string.IsNullOrWhiteSpace(nutrient.Number) && acceptedNumbers.Contains(nutrient.Number));

            if (matchedByNumber != null)
            {
                return matchedByNumber.Value;
            }

            var acceptedNameSet = acceptedNames.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var matchedByName = nutrients.FirstOrDefault(nutrient =>
                !string.IsNullOrWhiteSpace(nutrient.Name) && acceptedNameSet.Contains(nutrient.Name));

            return matchedByName?.Value ?? 0;
        }

        private static string BuildServingSize(JsonElement foodElement)
        {
            var servingSize = GetDouble(foodElement, "servingSize");
            var servingUnit = GetString(foodElement, "servingSizeUnit");

            if (servingSize.HasValue)
            {
                var number = servingSize.Value.ToString("0.##", CultureInfo.InvariantCulture);
                return string.IsNullOrWhiteSpace(servingUnit) ? number : $"{number} {servingUnit}";
            }

            return "100 g";
        }

        private static string GetFoodCategory(JsonElement foodElement)
        {
            if (foodElement.TryGetProperty("foodCategory", out var foodCategory))
            {
                if (foodCategory.ValueKind == JsonValueKind.String)
                {
                    return foodCategory.GetString() ?? string.Empty;
                }

                if (foodCategory.ValueKind == JsonValueKind.Object)
                {
                    var description = GetString(foodCategory, "description");
                    if (!string.IsNullOrWhiteSpace(description))
                    {
                        return description;
                    }
                }
            }

            return GetString(foodElement, "dataType");
        }

        private static string GetString(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var property) || property.ValueKind != JsonValueKind.String)
            {
                return string.Empty;
            }

            return property.GetString() ?? string.Empty;
        }

        private static bool TryGetInt32(JsonElement element, string propertyName, out int value)
        {
            value = 0;

            if (!element.TryGetProperty(propertyName, out var property))
            {
                return false;
            }

            if (property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out value))
            {
                return true;
            }

            if (property.ValueKind == JsonValueKind.String && int.TryParse(property.GetString(), out value))
            {
                return true;
            }

            return false;
        }

        private static double? GetDouble(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var property))
            {
                return null;
            }

            if (property.ValueKind == JsonValueKind.Number && property.TryGetDouble(out var numberValue))
            {
                return numberValue;
            }

            if (property.ValueKind == JsonValueKind.String
                && double.TryParse(property.GetString(), CultureInfo.InvariantCulture, out var stringValue))
            {
                return stringValue;
            }

            return null;
        }

        private sealed record NutrientValue(string Name, string Number, double Value);
    }
}
