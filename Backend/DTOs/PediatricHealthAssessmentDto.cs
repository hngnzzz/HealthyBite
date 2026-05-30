namespace Backend.DTOs
{
    public class PediatricHealthAssessmentDto
    {
        public string Mode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string SummaryLabel { get; set; } = string.Empty;
        public string SummaryValue { get; set; } = string.Empty;
        public string Warning { get; set; } = string.Empty;
        public string IdealWeightText { get; set; } = string.Empty;
        public string PercentileText { get; set; } = string.Empty;
        public List<string> DetailLines { get; set; } = new();
    }
}
