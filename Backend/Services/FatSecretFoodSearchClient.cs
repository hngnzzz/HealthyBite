using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Backend.DTOs;
using Microsoft.Extensions.Options;

namespace Backend.Services
{
    public class FatSecretFoodSearchClient
    {
        private readonly HttpClient _httpClient;
        private readonly FatSecretOptions _options;

        public FatSecretFoodSearchClient(HttpClient httpClient, IOptions<FatSecretOptions> options)
        {
            _httpClient = httpClient;
            _options = options.Value;
        }

        public bool IsConfigured =>
            !string.IsNullOrWhiteSpace(_options.ClientId) &&
            !string.IsNullOrWhiteSpace(_options.ClientSecret);

        public async Task<IReadOnlyList<FatSecretSearchFood>> SearchFoodsAsync(
            string keyword,
            CancellationToken cancellationToken = default)
        {
            if (!IsConfigured || string.IsNullOrWhiteSpace(keyword))
            {
                return [];
            }

            var accessToken = await GetAccessTokenAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(accessToken))
            {
                return [];
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, _options.ApiBaseUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var formValues = new Dictionary<string, string>
            {
                ["method"] = _options.EnableImages ? "foods.search.v3" : "foods.search",
                ["search_expression"] = keyword.Trim(),
                ["format"] = "json",
                ["max_results"] = "20",
            };

            if (!string.IsNullOrWhiteSpace(_options.Locale) && _options.Locale.Contains('_'))
            {
                var parts = _options.Locale.Split('_', 2, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 2)
                {
                    formValues["language"] = parts[0];
                    formValues["region"] = parts[1];
                }
            }

            if (_options.EnableImages)
            {
                formValues["include_food_images"] = "true";
            }

            request.Content = new FormUrlEncodedContent(formValues);

            try
            {
                using var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    return [];
                }

                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
                return ParseFoods(document.RootElement);
            }
            catch (HttpRequestException)
            {
                return [];
            }
            catch (JsonException)
            {
                return [];
            }
        }

        private async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, _options.TokenUrl);
            var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["scope"] = _options.Scope,
            });

            try
            {
                using var response = await _httpClient.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    return string.Empty;
                }

                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

                return document.RootElement.TryGetProperty("access_token", out var tokenElement) &&
                       tokenElement.ValueKind == JsonValueKind.String
                    ? tokenElement.GetString() ?? string.Empty
                    : string.Empty;
            }
            catch (HttpRequestException)
            {
                return string.Empty;
            }
            catch (JsonException)
            {
                return string.Empty;
            }
        }

        private static IReadOnlyList<FatSecretSearchFood> ParseFoods(JsonElement rootElement)
        {
            if (!rootElement.TryGetProperty("foods", out var foodsWrapper) ||
                !foodsWrapper.TryGetProperty("food", out var foodsElement))
            {
                return [];
            }

            var items = new List<FatSecretSearchFood>();

            if (foodsElement.ValueKind == JsonValueKind.Object)
            {
                var item = ParseFood(foodsElement);
                if (item != null)
                {
                    items.Add(item);
                }

                return items;
            }

            if (foodsElement.ValueKind != JsonValueKind.Array)
            {
                return [];
            }

            foreach (var foodElement in foodsElement.EnumerateArray())
            {
                var item = ParseFood(foodElement);
                if (item != null)
                {
                    items.Add(item);
                }
            }

            return items;
        }

        private static FatSecretSearchFood? ParseFood(JsonElement foodElement)
        {
            var foodId = GetString(foodElement, "food_id");
            var foodName = GetString(foodElement, "food_name");

            if (string.IsNullOrWhiteSpace(foodId) || string.IsNullOrWhiteSpace(foodName))
            {
                return null;
            }

            var brandName = GetString(foodElement, "brand_name");
            var imageUrl = GetImageUrl(foodElement);

            return new FatSecretSearchFood
            {
                FoodId = foodId,
                Name = string.IsNullOrWhiteSpace(brandName) ? foodName : $"{foodName} {brandName}".Trim(),
                ImageUrl = imageUrl,
            };
        }

        private static string GetImageUrl(JsonElement foodElement)
        {
            if (!foodElement.TryGetProperty("food_images", out var imagesElement) ||
                !imagesElement.TryGetProperty("food_image", out var imageElement))
            {
                return string.Empty;
            }

            if (imageElement.ValueKind == JsonValueKind.Object)
            {
                return GetString(imageElement, "image_url");
            }

            if (imageElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in imageElement.EnumerateArray())
                {
                    var imageUrl = GetString(item, "image_url");
                    if (!string.IsNullOrWhiteSpace(imageUrl))
                    {
                        return imageUrl;
                    }
                }
            }

            return string.Empty;
        }

        private static string GetString(JsonElement element, string propertyName)
        {
            return element.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String
                ? property.GetString() ?? string.Empty
                : string.Empty;
        }
    }

    public class FatSecretSearchFood
    {
        public string FoodId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }
}
