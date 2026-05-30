using Backend.Controllers.Base;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "User")]
    public class ImportController : BaseApiController
    {
        private readonly CsvImportService _csvImportService;
        private readonly IWebHostEnvironment _environment;

        public ImportController(CsvImportService csvImportService, IWebHostEnvironment environment)
        {
            _csvImportService = csvImportService;
            _environment = environment;
        }

        [HttpPost("nndb")]
        public async Task<IActionResult> ImportNndb()
        {
            var filePath = Path.Combine(_environment.ContentRootPath, "DataFiles", "nndb_flat.csv");
            return FromResult(await _csvImportService.ImportNndbAsync(filePath));
        }
    }
}
