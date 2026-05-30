namespace Backend.Common
{
    public static class AppMessages
    {
        public const string UnexpectedError = "C\u00f3 l\u1ed7i x\u1ea3y ra";
        public const string InvalidData = "D\u1eef li\u1ec7u kh\u00f4ng h\u1ee3p l\u1ec7";
        public const string Forbidden = "Kh\u00f4ng c\u00f3 quy\u1ec1n truy c\u1eadp d\u1eef li\u1ec7u n\u00e0y";

        public const string EmailExists = "Email \u0111\u00e3 t\u1ed3n t\u1ea1i";
        public const string InvalidCredentials = "Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang";
        public const string InvalidRefreshToken = "Phi\u00ean \u0111\u0103ng nh\u1eadp kh\u00f4ng h\u1ee3p l\u1ec7 ho\u1eb7c \u0111\u00e3 h\u1ebft h\u1ea1n";
        public const string RegisterSuccess = "\u0110\u0103ng k\u00fd th\u00e0nh c\u00f4ng";
        public const string LoginSuccess = "\u0110\u0103ng nh\u1eadp th\u00e0nh c\u00f4ng";

        public const string UserNotFound = "User kh\u00f4ng t\u1ed3n t\u1ea1i";
        public const string ProfileNotFound = "Kh\u00f4ng t\u00ecm th\u1ea5y profile";
        public const string CreateProfileSuccess = "T\u1ea1o profile th\u00e0nh c\u00f4ng";
        public const string GetProfilesSuccess = "L\u1ea5y danh s\u00e1ch profile th\u00e0nh c\u00f4ng";
        public const string GetProfileSuccess = "L\u1ea5y profile th\u00e0nh c\u00f4ng";
        public const string UpdateProfileSuccess = "C\u1eadp nh\u1eadt profile th\u00e0nh c\u00f4ng";
        public const string DeleteProfileSuccess = "X\u00f3a profile th\u00e0nh c\u00f4ng";

        public const string MissingKeyword = "Vui l\u00f2ng nh\u1eadp t\u1eeb kh\u00f3a";
        public const string FoodNotFound = "Kh\u00f4ng t\u00ecm th\u1ea5y m\u00f3n \u0103n";
        public const string GetFoodsSuccess = "L\u1ea5y danh s\u00e1ch m\u00f3n \u0103n th\u00e0nh c\u00f4ng";
        public const string SearchFoodsSuccess = "T\u00ecm ki\u1ebfm m\u00f3n \u0103n th\u00e0nh c\u00f4ng";
        public const string GetFoodSuccess = "L\u1ea5y m\u00f3n \u0103n th\u00e0nh c\u00f4ng";
        public const string SearchUsdaFoodsSuccess = "T\u00ecm ki\u1ebfm th\u1ef1c ph\u1ea9m USDA th\u00e0nh c\u00f4ng";
        public const string SearchSmartFoodsSuccess = "T\u00ecm ki\u1ebfm th\u1ef1c ph\u1ea9m k\u1ebft h\u1ee3p th\u00e0nh c\u00f4ng";
        public const string GetUsdaFoodSuccess = "L\u1ea5y chi ti\u1ebft th\u1ef1c ph\u1ea9m USDA th\u00e0nh c\u00f4ng";
        public const string UsdaApiKeyMissing = "Ch\u01b0a c\u1ea5u h\u00ecnh USDA API key";
        public const string UsdaLookupFailed = "Kh\u00f4ng th\u1ec3 l\u1ea5y d\u1eef li\u1ec7u t\u1eeb USDA";
        public const string FoodItemNotFoundPrefix = "FoodItem kh\u00f4ng t\u1ed3n t\u1ea1i: ";

        public const string MealLogNotFound = "Kh\u00f4ng t\u00ecm th\u1ea5y meal log";
        public const string ProfileDoesNotExist = "Profile kh\u00f4ng t\u1ed3n t\u1ea1i";
        public const string CreateMealLogSuccess = "T\u1ea1o meal log th\u00e0nh c\u00f4ng";
        public const string GetMealLogsSuccess = "L\u1ea5y danh s\u00e1ch meal log th\u00e0nh c\u00f4ng";
        public const string GetMealLogSuccess = "L\u1ea5y meal log th\u00e0nh c\u00f4ng";
        public const string UpdateMealLogSuccess = "C\u1eadp nh\u1eadt meal log th\u00e0nh c\u00f4ng";
        public const string DeleteMealLogSuccess = "X\u00f3a meal log th\u00e0nh c\u00f4ng";
        public const string HealthAssessmentSuccess = "\u0110\u00e1nh gi\u00e1 s\u1ee9c kh\u1ecfe th\u00e0nh c\u00f4ng";
        public const string GetDashboardSuccess = "L\u1ea5y dashboard h\u00f4m nay th\u00e0nh c\u00f4ng";

        public const string ImportSuccess = "Import th\u00e0nh c\u00f4ng";
        public const string ImportFailed = "Import th\u1ea5t b\u1ea1i";

        public static string FileNotFound(string path) => $"Kh\u00f4ng t\u00ecm th\u1ea5y file: {path}";
        public static string FoodItemsNotFound(IEnumerable<int> ids) => $"{FoodItemNotFoundPrefix}{string.Join(", ", ids)}";
    }
}
