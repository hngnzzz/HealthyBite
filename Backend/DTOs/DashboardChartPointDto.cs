namespace Backend.DTOs
{
    public class DashboardChartPointDto
    {
        public string Label { get; set; } = string.Empty;
        public double? Value { get; set; }
        public double? Target { get; set; }
    }
}
