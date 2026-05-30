using Backend.DTOs;
using Backend.Models;

namespace Backend.Mappings
{
    public static class FoodItemMappings
    {
        public static FoodItemResponseDto ToResponseDto(this FoodItem food)
        {
            return new FoodItemResponseDto
            {
                Id = food.Id,
                Name = food.Name,
                Calories = food.Calories,
                Protein = food.Protein,
                Fat = food.Fat,
                Carbs = food.Carbs,
                ServingSize = food.ServingSize,
                Category = string.IsNullOrWhiteSpace(food.Category) ? "General" : food.Category,
                Source = string.IsNullOrWhiteSpace(food.Source) ? "local" : food.Source
            };
        }
    }
}
