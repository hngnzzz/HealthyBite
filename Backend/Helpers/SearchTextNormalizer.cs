using System.Globalization;
using System.Text;

namespace Backend.Helpers
{
    public static class SearchTextNormalizer
    {
        public static string Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var lowered = value.Trim().ToLowerInvariant().Replace("\u0111", "d");
            var normalized = lowered.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);

            foreach (var character in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(character);
                }
            }

            return builder
                .ToString()
                .Normalize(NormalizationForm.FormC);
        }
    }
}
