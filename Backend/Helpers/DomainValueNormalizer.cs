namespace Backend.Helpers
{
    public static class DomainValueNormalizer
    {
        public const string DefaultGender = "other";
        public const string DefaultGoal = "maintain";
        public const string DefaultActivityLevel = "moderate";
        public const string DefaultDietPlan = "balanced-maintain";
        public const string DefaultMealType = "snack";

        public static string NormalizeGender(string? value)
        {
            return Normalize(value) switch
            {
                "nam" or "male" => "male",
                "nu" or "female" => "female",
                _ => DefaultGender
            };
        }

        public static string NormalizeGoal(string? value)
        {
            return Normalize(value) switch
            {
                "giam can" or "lose_weight" => "lose_weight",
                "tang can" or "gain_weight" => "gain_weight",
                "tang co" or "build_muscle" => "build_muscle",
                "giu dang" or "maintain" => "maintain",
                _ => DefaultGoal
            };
        }

        public static string NormalizeActivityLevel(string? value)
        {
            return Normalize(value) switch
            {
                "it van dong" or "sedentary" => "sedentary",
                "van dong nhe" or "light" => "light",
                "van dong vua" or "moderate" => "moderate",
                "van dong nhieu" or "active" => "active",
                "rat nang dong" or "very_active" => "very_active",
                _ => DefaultActivityLevel
            };
        }

        public static string NormalizeDietPlan(string? value)
        {
            var normalized = Normalize(value);

            if (TryNormalizeCustomDietPlan(normalized, out var customDietPlan))
            {
                return customDietPlan;
            }

            return normalized switch
            {
                "high protein cut" or "high-protein-cut" => "high-protein-cut",
                "balanced cut" or "balanced-cut" => "balanced-cut",
                "mediterranean" => "mediterranean",
                "balanced" or "balanced maintain" or "balanced-maintain" => "balanced-maintain",
                "lower carb" or "lower-carb" => "lower-carb",
                "clean bulk" or "clean-bulk" => "clean-bulk",
                "lean bulk" or "lean-bulk" => "lean-bulk",
                "performance" => "performance",
                "plant forward" or "plant-forward" => "plant-forward",
                _ => DefaultDietPlan
            };
        }

        public static string NormalizeMealType(string? value)
        {
            var normalized = Normalize(value);

            if (normalized.StartsWith("custom:", StringComparison.Ordinal))
            {
                return normalized;
            }

            return normalized switch
            {
                "breakfast" or "bua sang" => "breakfast",
                "lunch" or "bua trua" => "lunch",
                "dinner" or "bua toi" => "dinner",
                "pre workout" or "pre-workout" => "pre-workout",
                "post workout" or "post-workout" => "post-workout",
                _ => DefaultMealType
            };
        }

        private static string Normalize(string? value)
        {
            return SearchTextNormalizer.Normalize(value);
        }

        private static bool TryNormalizeCustomDietPlan(string normalized, out string customDietPlan)
        {
            customDietPlan = string.Empty;

            if (!normalized.StartsWith("custom:p", StringComparison.Ordinal))
            {
                return false;
            }

            var parts = normalized.Split('-');
            if (parts.Length != 3)
            {
                return false;
            }

            if (!TryParseMacroPart(parts[0], "custom:p", out var protein)
                || !TryParseMacroPart(parts[1], "c", out var carbs)
                || !TryParseMacroPart(parts[2], "f", out var fat))
            {
                return false;
            }

            if (protein < 0 || carbs < 0 || fat < 0 || protein + carbs + fat != 100)
            {
                return false;
            }

            customDietPlan = $"custom:p{protein}-c{carbs}-f{fat}";
            return true;
        }

        private static bool TryParseMacroPart(string part, string prefix, out int value)
        {
            value = 0;

            if (!part.StartsWith(prefix, StringComparison.Ordinal))
            {
                return false;
            }

            return int.TryParse(part[prefix.Length..], out value);
        }
    }
}
