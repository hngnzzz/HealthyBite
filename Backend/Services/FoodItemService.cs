using Backend.Common;
using Backend.Data;
using Backend.DTOs;
using Backend.Helpers;
using Backend.Mappings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Services
{
    public class FoodItemService
    {
        private const int DefaultPage = 1;
        private const int DefaultPageSize = 20;
        private const int MaxSearchResults = 50;

        private readonly AppDbContext _context;
        private readonly UsdaFoodDataClient _usdaFoodDataClient;
        private readonly FatSecretFoodSearchClient _fatSecretFoodSearchClient;
        private readonly FoodSearchAliasService _foodSearchAliasService;
        private readonly LocalNutritionCsvService _localNutritionCsvService;
        private readonly ILogger<FoodItemService> _logger;

        public FoodItemService(
            AppDbContext context,
            UsdaFoodDataClient usdaFoodDataClient,
            FatSecretFoodSearchClient fatSecretFoodSearchClient,
            FoodSearchAliasService foodSearchAliasService,
            LocalNutritionCsvService localNutritionCsvService,
            ILogger<FoodItemService> logger)
        {
            _context = context;
            _usdaFoodDataClient = usdaFoodDataClient;
            _fatSecretFoodSearchClient = fatSecretFoodSearchClient;
            _foodSearchAliasService = foodSearchAliasService;
            _localNutritionCsvService = localNutritionCsvService;
            _logger = logger;
        }

        public async Task<ServiceResult<List<FoodItemResponseDto>>> GetAllAsync(int page, int pageSize)
        {
            page = page <= 0 ? DefaultPage : page;
            pageSize = pageSize <= 0 ? DefaultPageSize : pageSize;

            var foods = await _context.FoodItems
                .AsNoTracking()
                .OrderBy(food => food.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return ServiceResult<List<FoodItemResponseDto>>.Ok(
                foods.Select(food => food.ToResponseDto()).ToList(),
                AppMessages.GetFoodsSuccess);
        }

        public async Task<ServiceResult<List<FoodItemResponseDto>>> SearchAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return ServiceResult<List<FoodItemResponseDto>>.BadRequest(AppMessages.MissingKeyword);
            }

            var normalizedKeyword = keyword.Trim();

            var foods = await _context.FoodItems
                .AsNoTracking()
                .Where(food => food.Name.Contains(normalizedKeyword))
                .OrderBy(food => food.Name)
                .Take(MaxSearchResults)
                .ToListAsync();

            return ServiceResult<List<FoodItemResponseDto>>.Ok(
                foods.Select(food => food.ToResponseDto()).ToList(),
                AppMessages.SearchFoodsSuccess);
        }

        public async Task<ServiceResult<FoodItemResponseDto>> GetByIdAsync(int id)
        {
            var food = await _context.FoodItems
                .AsNoTracking()
                .Where(food => food.Id == id)
                .FirstOrDefaultAsync();

            return food == null
                ? ServiceResult<FoodItemResponseDto>.NotFound(AppMessages.FoodNotFound)
                : ServiceResult<FoodItemResponseDto>.Ok(food.ToResponseDto(), AppMessages.GetFoodSuccess);
        }

        public Task<ServiceResult<List<UsdaFoodItemResponseDto>>> SearchUsdaAsync(string keyword, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return Task.FromResult(ServiceResult<List<UsdaFoodItemResponseDto>>.BadRequest(AppMessages.MissingKeyword));
            }

            return _usdaFoodDataClient.SearchFoodsAsync(keyword, cancellationToken);
        }

        public async Task<ServiceResult<List<UsdaFoodItemResponseDto>>> SearchSmartAsync(
            string keyword,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return ServiceResult<List<UsdaFoodItemResponseDto>>.BadRequest(AppMessages.MissingKeyword);
            }

            var expandedKeywords = _foodSearchAliasService.ExpandKeyword(keyword);
            if (expandedKeywords.Count == 0)
            {
                expandedKeywords = [keyword.Trim()];
            }

            var usdaResults = await SearchUsdaCandidatesAsync(expandedKeywords, cancellationToken);
            var fatSecretResults = await SearchFatSecretCandidatesAsync(expandedKeywords, cancellationToken);
            var localCsvResults = _localNutritionCsvService.Search(expandedKeywords, MaxSearchResults);

            var enrichedUsdaResults = usdaResults
                .Select(food => EnrichWithFatSecretMatch(food, fatSecretResults));
            var mergedResults = new List<UsdaFoodItemResponseDto>();

            foreach (var food in enrichedUsdaResults.Concat(localCsvResults))
            {
                AddUniqueFood(mergedResults, food);
            }

            _logger.LogInformation(
                "Food smart search query='{Query}' normalized='{NormalizedQuery}' sources: USDA={UsdaCount}, FatSecret={FatSecretCount}, LocalCsv={LocalCsvCount}/{LoadedCount}, fallback={FallbackSource}.",
                keyword,
                SearchTextNormalizer.Normalize(keyword),
                usdaResults.Count,
                fatSecretResults.Count,
                localCsvResults.Count,
                _localNutritionCsvService.LoadedCount,
                usdaResults.Count == 0 ? "LocalCsv" : "ExternalWithLocalCsv");

            mergedResults = mergedResults
                .OrderByDescending(food => !string.IsNullOrWhiteSpace(food.ImageUrl))
                .ThenByDescending(food => string.Equals(food.SearchSource, "LocalCsv", StringComparison.OrdinalIgnoreCase) && usdaResults.Count == 0)
                .ThenBy(food => food.Name)
                .Take(MaxSearchResults)
                .ToList();

            return ServiceResult<List<UsdaFoodItemResponseDto>>.Ok(mergedResults, AppMessages.SearchSmartFoodsSuccess);
        }

        public async Task<ServiceResult<UsdaFoodItemResponseDto>> GetUsdaByIdAsync(int fdcId, CancellationToken cancellationToken = default)
        {
            var localFood = _localNutritionCsvService.GetByFdcId(fdcId);
            if (localFood != null)
            {
                return ServiceResult<UsdaFoodItemResponseDto>.Ok(localFood, AppMessages.GetUsdaFoodSuccess);
            }

            return await _usdaFoodDataClient.GetFoodByIdAsync(fdcId, cancellationToken);
        }

        private async Task<List<UsdaFoodItemResponseDto>> SearchUsdaCandidatesAsync(
            IReadOnlyList<string> keywords,
            CancellationToken cancellationToken)
        {
            var collected = new Dictionary<int, UsdaFoodItemResponseDto>();

            foreach (var candidateKeyword in keywords.Take(4))
            {
                var searchResult = await _usdaFoodDataClient.SearchFoodsAsync(candidateKeyword, cancellationToken);
                if (searchResult.Status != ResultStatus.Ok || searchResult.Data == null)
                {
                    continue;
                }

                foreach (var item in searchResult.Data)
                {
                    if (collected.ContainsKey(item.FdcId))
                    {
                        continue;
                    }

                    item.MatchedKeyword = candidateKeyword;
                    item.SearchSource = "USDA";
                    collected[item.FdcId] = item;

                    if (collected.Count >= MaxSearchResults)
                    {
                        return collected.Values.ToList();
                    }
                }
            }

            return collected.Values.ToList();
        }

        private async Task<IReadOnlyList<FatSecretSearchFood>> SearchFatSecretCandidatesAsync(
            IReadOnlyList<string> keywords,
            CancellationToken cancellationToken)
        {
            var collected = new Dictionary<string, FatSecretSearchFood>(StringComparer.OrdinalIgnoreCase);

            foreach (var candidateKeyword in keywords.Take(3))
            {
                var searchResults = await _fatSecretFoodSearchClient.SearchFoodsAsync(candidateKeyword, cancellationToken);

                foreach (var item in searchResults)
                {
                    if (!collected.ContainsKey(item.FoodId))
                    {
                        collected[item.FoodId] = item;
                    }
                }
            }

            return collected.Values.ToList();
        }

        private static UsdaFoodItemResponseDto EnrichWithFatSecretMatch(
            UsdaFoodItemResponseDto food,
            IReadOnlyList<FatSecretSearchFood> fatSecretResults)
        {
            var bestMatch = fatSecretResults
                .Select(result => new
                {
                    Result = result,
                    Score = CalculateNameMatchScore(food.Name, result.Name)
                })
                .Where(item => item.Score >= 0.45)
                .OrderByDescending(item => item.Score)
                .FirstOrDefault();

            if (bestMatch == null)
            {
                return food;
            }

            food.ImageUrl = bestMatch.Result.ImageUrl;
            food.FatSecretFoodId = bestMatch.Result.FoodId;
            food.SearchSource = string.IsNullOrWhiteSpace(bestMatch.Result.ImageUrl) ? "USDA + FatSecret Search" : "USDA + FatSecret";

            return food;
        }

        private static void AddUniqueFood(List<UsdaFoodItemResponseDto> foods, UsdaFoodItemResponseDto candidate)
        {
            var normalizedName = SearchTextNormalizer.Normalize(candidate.Name);
            var isDuplicate = foods.Any(food =>
                food.FdcId == candidate.FdcId ||
                (!string.IsNullOrWhiteSpace(normalizedName) &&
                    string.Equals(SearchTextNormalizer.Normalize(food.Name), normalizedName, StringComparison.OrdinalIgnoreCase)));

            if (!isDuplicate)
            {
                foods.Add(candidate);
            }
        }

        private static double CalculateNameMatchScore(string left, string right)
        {
            var leftTokens = SearchTextNormalizer.Normalize(left)
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            var rightTokens = SearchTextNormalizer.Normalize(right)
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (leftTokens.Count == 0 || rightTokens.Count == 0)
            {
                return 0;
            }

            var intersectionCount = leftTokens.Intersect(rightTokens, StringComparer.OrdinalIgnoreCase).Count();
            var unionCount = leftTokens.Union(rightTokens, StringComparer.OrdinalIgnoreCase).Count();

            return unionCount == 0 ? 0 : (double)intersectionCount / unionCount;
        }
    }
}
