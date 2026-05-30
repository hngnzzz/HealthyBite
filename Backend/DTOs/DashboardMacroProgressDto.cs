namespace Backend.DTOs
{
    public class DashboardMacroProgressDto
    {
        public string Label { get; set; } = string.Empty;
        public double Consumed { get; set; }
        public double Target { get; set; }
        public string Accent { get; set; } = string.Empty;
    }
}
