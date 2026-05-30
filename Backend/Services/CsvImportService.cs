using System.Globalization;
using System.Text.RegularExpressions;
using Backend.Common;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class CsvImportService
    {
        private readonly AppDbContext _context;

        public CsvImportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult<ImportResultDto>> ImportNndbAsync(string filePath)
        {
            try
            {
                var importedCount = await ImportNndbFoodAsync(filePath);

                return ServiceResult<ImportResultDto>.Ok(
                    new ImportResultDto { Imported = importedCount },
                    AppMessages.ImportSuccess);
            }
            catch (Exception ex)
            {
                return ServiceResult<ImportResultDto>.BadRequest(
                    AppMessages.ImportFailed,
                    new Dictionary<string, string[]>
                    {
                        ["import"] = new[] { ex.Message }
                    });
            }
        }

        public async Task<int> ImportNndbFoodAsync(string filePath)
        {
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException(AppMessages.FileNotFound(filePath));
            }

            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HeaderValidated = null,
                MissingFieldFound = null,
                BadDataFound = null,
                PrepareHeaderForMatch = args => args.Header.Trim()
            };

            List<FoodItem> importedFoods = new();

            using var reader = new StreamReader(filePath);
            using var csv = new CsvReader(reader, config);

            var records = csv.GetRecords<NndbFoodCsvDto>().ToList();

            foreach (var row in records)
            {
                var rawName = row.Descrip?.Trim();

                if (string.IsNullOrWhiteSpace(rawName))
                {
                    continue;
                }

                var normalizedName = NormalizeFoodName(rawName);

                if (string.IsNullOrWhiteSpace(normalizedName))
                {
                    continue;
                }

                var food = new FoodItem
                {
                    Name = normalizedName,
                    Calories = ParseDouble(row.Energ_Kcal),
                    Protein = ParseDouble(row.Protein_g),
                    Fat = ParseDouble(row.Lipid_Tot_g),
                    Carbs = ParseDouble(row.Carbohydrt_g),
                    ServingSizeValue = ParseServingSizeValue(row.GmWt_Desc1),
                    ServingUnit = ParseServingUnit(row.GmWt_Desc1),
                    Category = string.IsNullOrWhiteSpace(row.FoodGrp_Desc) ? "General" : row.FoodGrp_Desc.Trim(),
                    Source = "NNDB"
                };

                importedFoods.Add(food);
            }

            var distinctFoods = importedFoods
                .GroupBy(food => food.Name.ToLower().Trim())
                .Select(group => group.First())
                .ToList();

            var existingNames = await _context.FoodItems
                .Select(food => food.Name.ToLower().Trim())
                .ToListAsync();

            var newFoods = distinctFoods
                .Where(food => !existingNames.Contains(food.Name.ToLower().Trim()))
                .ToList();

            if (newFoods.Count == 0)
            {
                return 0;
            }

            await _context.FoodItems.AddRangeAsync(newFoods);
            await _context.SaveChangesAsync();

            return newFoods.Count;
        }

        private static double ParseDouble(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return 0;
            }

            if (double.TryParse(value.Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var result))
            {
                return result;
            }

            return 0;
        }

        private static string NormalizeFoodName(string name)
        {
            name = name.Trim();
            name = Regex.Replace(name, @"\s+", " ");
            return name;
        }

        private static double? ParseServingSizeValue(string? rawServing)
        {
            if (string.IsNullOrWhiteSpace(rawServing))
            {
                return 100;
            }

            var match = Regex.Match(rawServing, @"\d+([.,]\d+)?");
            if (!match.Success)
            {
                return null;
            }

            var normalized = match.Value.Replace(',', '.');
            return double.TryParse(normalized, NumberStyles.Any, CultureInfo.InvariantCulture, out var value)
                ? value
                : null;
        }

        private static string ParseServingUnit(string? rawServing)
        {
            if (string.IsNullOrWhiteSpace(rawServing))
            {
                return "g";
            }

            var unit = Regex.Replace(rawServing, @"\d+([.,]\d+)?", string.Empty).Trim();
            return string.IsNullOrWhiteSpace(unit) ? "g" : unit;
        }
    }
}
