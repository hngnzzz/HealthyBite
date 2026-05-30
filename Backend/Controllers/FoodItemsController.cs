using Backend.Controllers.Base;
using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FoodItemsController : BaseApiController
    {
        private readonly FoodItemService _foodItemService;

        public FoodItemsController(FoodItemService foodItemService)
        {
            _foodItemService = foodItemService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return FromResult(await _foodItemService.GetAllAsync(page, pageSize));
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string keyword)
        {
            return FromResult(await _foodItemService.SearchAsync(keyword));
        }

        [HttpGet("search/usda")]
        public async Task<IActionResult> SearchUsda([FromQuery] string keyword, CancellationToken cancellationToken)
        {
            return FromResult(await _foodItemService.SearchUsdaAsync(keyword, cancellationToken));
        }

        [HttpGet("search/smart")]
        public async Task<IActionResult> SearchSmart([FromQuery] string keyword, CancellationToken cancellationToken)
        {
            return FromResult(await _foodItemService.SearchSmartAsync(keyword, cancellationToken));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            return FromResult(await _foodItemService.GetByIdAsync(id));
        }

        [HttpGet("usda/{fdcId:int}")]
        public async Task<IActionResult> GetUsdaById(int fdcId, CancellationToken cancellationToken)
        {
            return FromResult(await _foodItemService.GetUsdaByIdAsync(fdcId, cancellationToken));
        }
    }
}
