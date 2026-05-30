namespace Backend.DTOs
{
    public class DashboardTodayResponseDto
    {
        public string GreetingName { get; set; } = string.Empty;
        public string SummaryDateLabel { get; set; } = string.Empty;
        public double CaloriesConsumed { get; set; }
        public double CaloriesTarget { get; set; }
        public double CaloriesRemaining { get; set; }
        public double CaloriesBalance { get; set; }
        public bool IsOverCalories { get; set; }
        public double? BmiValue { get; set; }
        public string BmiLabel { get; set; } = string.Empty;
        public double? WeightKg { get; set; }
        public double? HeightCm { get; set; }
        public string GoalLabel { get; set; } = string.Empty;
        public double WaterConsumedMl { get; set; }
        public double WaterGoalMl { get; set; }
        public int MealsLoggedCount { get; set; }
        public double? ExerciseMinutes { get; set; }
        public bool HasSyncedActivity { get; set; }
        public DashboardGoalProgressDto GoalProgress { get; set; } = new();
        public DashboardQuickChartsDto QuickCharts { get; set; } = new();
        public List<DashboardAlertDto> Alerts { get; set; } = new();
        public List<DashboardMacroProgressDto> MacroProgress { get; set; } = new();
        public List<DashboardMealSummaryDto> Meals { get; set; } = new();
    }
}
