using System.Security.Claims;

namespace Backend.Helpers
{
    public static class ClaimsPrincipalExtensions
    {
        public static int? GetUserId(this ClaimsPrincipal principal)
        {
            var value = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue("sub");

            return int.TryParse(value, out var userId) ? userId : null;
        }
    }
}
