namespace Backend.DTOs
{
    public class DashboardGoalProgressDto
    {
        public string GoalLabel { get; set; } = string.Empty;
        public double CurrentWeightKg { get; set; }
        public double? TargetWeightKg { get; set; }
        public double RemainingKg { get; set; }
        public int DaysOnPlan { get; set; }
        public int CompletionPercent { get; set; }
    }
}
