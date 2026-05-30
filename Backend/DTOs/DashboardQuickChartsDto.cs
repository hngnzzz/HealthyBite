namespace Backend.DTOs
{
    public class DashboardQuickChartsDto
    {
        public List<DashboardChartPointDto> WeightTrend { get; set; } = new();
        public List<DashboardChartPointDto> Calories7Days { get; set; } = new();
        public int CalorieAdherencePercent { get; set; }
        public int ProteinTargetPercent { get; set; }
        public bool HasWeightHistory { get; set; }
    }
}
