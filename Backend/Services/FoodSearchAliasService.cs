using System.Text.Json;
using Backend.Helpers;
using Microsoft.Extensions.Hosting;

namespace Backend.Services
{
    public class FoodSearchAliasService
    {
        private static readonly AliasEntry[] DefaultEntries =
        [
            new(["com", "com trang", "gao", "gao trang"], ["rice", "white rice", "cooked rice"]),
            new(["banh mi", "banh my"], ["bread", "baguette"]),
            new(["pho bo", "pho"], ["beef pho", "rice noodle soup"]),
            new(["bun bo"], ["beef noodle soup"]),
            new(["mi goi", "mi tom"], ["instant noodles"]),
            new(["keo"], ["candy"]),
            new(["ga", "thit ga", "ga ran"], ["chicken", "fried chicken"]),
            new(["thit", "thit heo", "heo", "lon", "thit lon"], ["pork", "lean pork", "meat"]),
            new(["ca hoi"], ["salmon"]),
            new(["trung ga", "trung"], ["egg", "chicken egg"]),
            new(["sua chua"], ["yogurt"]),
            new(["tao"], ["apple"]),
            new(["chuoi"], ["banana"]),
            new(["bo", "qua bo"], ["avocado"]),
        ];

        private readonly IReadOnlyList<AliasEntry> _entries;

        public FoodSearchAliasService(IHostEnvironment hostEnvironment)
        {
            _entries = LoadEntries(hostEnvironment.ContentRootPath);
        }

        public IReadOnlyList<string> ExpandKeyword(string keyword)
        {
            var normalizedKeyword = SearchTextNormalizer.Normalize(keyword);
            if (string.IsNullOrWhiteSpace(normalizedKeyword))
            {
                return [];
            }

            var expanded = new List<string> { keyword.Trim() };

            foreach (var entry in _entries)
            {
                if (!entry.Keywords.Any(alias => normalizedKeyword.Contains(alias) || alias.Contains(normalizedKeyword)))
                {
                    continue;
                }

                foreach (var alias in entry.Aliases)
                {
                    if (!expanded.Any(existing => string.Equals(existing, alias, StringComparison.OrdinalIgnoreCase)))
                    {
                        expanded.Add(alias);
                    }
                }
            }

            return expanded;
        }

        private static IReadOnlyList<AliasEntry> LoadEntries(string contentRootPath)
        {
            var filePath = Path.Combine(contentRootPath, "Data", "food-search-aliases.json");
            if (!File.Exists(filePath))
            {
                return DefaultEntries;
            }

            try
            {
                using var stream = File.OpenRead(filePath);
                var fileEntries = JsonSerializer.Deserialize<List<AliasFileEntry>>(stream) ?? [];
                var parsedEntries = fileEntries
                    .Select(entry => new AliasEntry(
                        entry.Keywords.Select(SearchTextNormalizer.Normalize).Where(value => !string.IsNullOrWhiteSpace(value)).Distinct().ToArray(),
                        entry.Aliases.Where(value => !string.IsNullOrWhiteSpace(value)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray()))
                    .Where(entry => entry.Keywords.Length > 0 && entry.Aliases.Length > 0)
                    .ToList();

                return parsedEntries.Count > 0 ? parsedEntries : DefaultEntries;
            }
            catch (JsonException)
            {
                return DefaultEntries;
            }
            catch (IOException)
            {
                return DefaultEntries;
            }
        }

        private sealed record AliasEntry(string[] Keywords, string[] Aliases);

        private sealed class AliasFileEntry
        {
            public string[] Keywords { get; set; } = [];
            public string[] Aliases { get; set; } = [];
        }
    }
}
