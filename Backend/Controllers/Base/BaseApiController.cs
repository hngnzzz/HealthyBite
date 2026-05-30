using Backend.Common;
using Backend.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.Base
{
    public abstract class BaseApiController : ControllerBase
    {
        protected IActionResult FromResult(ServiceResult result)
        {
            var response = ApiResponseFactory.Error(result.Message, result.Errors);

            return result.Status switch
            {
                ResultStatus.Ok => Ok(ApiResponseFactory.Success<object?>(null, result.Message)),
                ResultStatus.BadRequest => BadRequest(response),
                ResultStatus.NotFound => NotFound(response),
                ResultStatus.Unauthorized => Unauthorized(response),
                ResultStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, response),
                _ => StatusCode(StatusCodes.Status500InternalServerError, ApiResponseFactory.Error(AppMessages.UnexpectedError))
            };
        }

        protected IActionResult FromResult<T>(ServiceResult<T> result)
        {
            if (result.Status == ResultStatus.Ok)
            {
                return Ok(ApiResponseFactory.Success(result.Data, result.Message));
            }

            var response = ApiResponseFactory.Error(result.Message, result.Errors);

            return result.Status switch
            {
                ResultStatus.BadRequest => BadRequest(response),
                ResultStatus.NotFound => NotFound(response),
                ResultStatus.Unauthorized => Unauthorized(response),
                ResultStatus.Forbidden => StatusCode(StatusCodes.Status403Forbidden, response),
                _ => StatusCode(StatusCodes.Status500InternalServerError, ApiResponseFactory.Error(AppMessages.UnexpectedError))
            };
        }
    }
}
