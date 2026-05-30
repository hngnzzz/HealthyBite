using Backend.Common;
using Backend.DTOs;

namespace Backend.Services
{
    public class HealthAssessmentService
    {
        public Task<ServiceResult<PediatricHealthAssessmentDto>> AssessPediatricGrowthAsync(HealthAssessmentRequestDto dto)
        {
            var bmi = dto.HeightCm > 0 ? dto.WeightKg / Math.Pow(dto.HeightCm / 100d, 2) : 0d;
            var ageMonths = dto.AgeMonths ?? 0;
            var totalMonths = dto.AgeYears * 12 + ageMonths;

            string mode;
            string status;
            string summaryLabel;
            string warning;

            if (totalMonths < 24)
            {
                mode = "who-growth";
                summaryLabel = "WHO growth assessment (0-2 years)";

                if (bmi < 14)
                {
                    status = "Underweight";
                    warning = "The child may be underweight and should be monitored more closely.";
                }
                else if (bmi > 18)
                {
                    status = "Overweight";
                    warning = "The child may be gaining weight quickly and should be monitored.";
                }
                else
                {
                    status = "Normal";
                    warning = "The child is currently within an acceptable WHO growth range.";
                }
            }
            else
            {
                mode = "bmi-age-percentile";
                summaryLabel = "BMI-for-age assessment (2-18 years)";

                if (bmi < 14.5)
                {
                    status = "Underweight";
                    warning = "BMI-for-age is low and growth should be monitored.";
                }
                else if (bmi >= 21)
                {
                    status = "Obese";
                    warning = "BMI-for-age is high and nutrition and activity should be reviewed.";
                }
                else if (bmi >= 18.5)
                {
                    status = "Overweight";
                    warning = "BMI-for-age is elevated and the nutrition plan may need adjustment.";
                }
                else
                {
                    status = "Healthy weight";
                    warning = "The child is currently within the normal BMI-for-age range.";
                }
            }

            var heightM = dto.HeightCm / 100d;
            var idealWeightMin = 18.5 * heightM * heightM;
            var idealWeightMax = 24.9 * heightM * heightM;

            var response = new PediatricHealthAssessmentDto
            {
                Mode = mode,
                Status = status,
                SummaryLabel = summaryLabel,
                SummaryValue = status,
                Warning = warning,
                IdealWeightText = $"{idealWeightMin:F1} - {idealWeightMax:F1} kg at the current height",
                PercentileText = $"Estimated current BMI: {bmi:F1}",
                DetailLines = new List<string>
                {
                    $"Current BMI: {bmi:F1}",
                    $"Age: {dto.AgeYears} years{(ageMonths > 0 ? $" {ageMonths} months" : string.Empty)}",
                    $"Primary assessment: {status}",
                    $"Reference weight range at the current height: {idealWeightMin:F1} - {idealWeightMax:F1} kg"
                }
            };

            return Task.FromResult(ServiceResult<PediatricHealthAssessmentDto>.Ok(response, AppMessages.HealthAssessmentSuccess));
        }
    }
}
