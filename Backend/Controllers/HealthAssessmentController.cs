using Backend.Controllers.Base;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "User")]
    public class HealthAssessmentController : BaseApiController
    {
        private readonly HealthAssessmentService _healthAssessmentService;

        public HealthAssessmentController(HealthAssessmentService healthAssessmentService)
        {
            _healthAssessmentService = healthAssessmentService;
        }

        [HttpPost("pediatric")]
        public async Task<IActionResult> AssessPediatric([FromBody] HealthAssessmentRequestDto dto)
        {
            return FromResult(await _healthAssessmentService.AssessPediatricGrowthAsync(dto));
        }
    }
}
