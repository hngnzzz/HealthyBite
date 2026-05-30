using Backend.Services;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace Backend.Tests
{
    public class LocalNutritionCsvServiceTests
    {
        [Theory]
        [InlineData("com")]
        [InlineData("cơm")]
        [InlineData("ga")]
        [InlineData("gà")]
        [InlineData("thit")]
        [InlineData("thịt")]
        [InlineData("trung")]
        [InlineData("trứng")]
        public void Search_FindsVietnameseAliasKeywordsInLocalCsv(string keyword)
        {
            var environment = new TestHostEnvironment(FindBackendRoot());
            var aliases = new FoodSearchAliasService(environment);
            var localCsv = new LocalNutritionCsvService(environment, NullLogger<LocalNutritionCsvService>.Instance);

            var results = localCsv.Search(aliases.ExpandKeyword(keyword), 10);

            Assert.True(localCsv.LoadedCount > 0);
            Assert.NotEmpty(results);
            Assert.All(results, food => Assert.Equal("LocalCsv", food.SearchSource));
        }

        private static string FindBackendRoot()
        {
            var directory = new DirectoryInfo(AppContext.BaseDirectory);
            while (directory != null)
            {
                if (File.Exists(Path.Combine(directory.FullName, "Backend.csproj")))
                {
                    return directory.FullName;
                }

                directory = directory.Parent;
            }

            throw new InvalidOperationException("Backend project root could not be located.");
        }

        private sealed class TestHostEnvironment : IHostEnvironment
        {
            public TestHostEnvironment(string contentRootPath)
            {
                ContentRootPath = contentRootPath;
                ContentRootFileProvider = new PhysicalFileProvider(contentRootPath);
            }

            public string EnvironmentName { get; set; } = Environments.Development;
            public string ApplicationName { get; set; } = "Backend.Tests";
            public string ContentRootPath { get; set; }
            public IFileProvider ContentRootFileProvider { get; set; }
        }
    }
}
