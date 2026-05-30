using Backend.Common;
using Backend.Controllers.Base;
using Backend.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Tests;

public class BaseApiControllerTests
{
    [Fact]
    public void FromResult_ReturnsOkResponseWithStandardContract()
    {
        var controller = new TestController();

        var result = controller.Execute(ServiceResult.Ok("Th\u00e0nh c\u00f4ng"));

        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object?>>(okResult.Value);

        Assert.True(response.Success);
        Assert.Equal("Th\u00e0nh c\u00f4ng", response.Message);
        Assert.Null(response.Data);
        Assert.Null(response.Errors);
    }

    [Fact]
    public void FromTypedResult_ReturnsNotFoundResponseWithStandardContract()
    {
        var controller = new TestController();

        var result = controller.Execute(ServiceResult<string>.NotFound("Kh\u00f4ng t\u00ecm th\u1ea5y d\u1eef li\u1ec7u"));

        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object?>>(notFoundResult.Value);

        Assert.False(response.Success);
        Assert.Equal("Kh\u00f4ng t\u00ecm th\u1ea5y d\u1eef li\u1ec7u", response.Message);
        Assert.Null(response.Data);
        Assert.Null(response.Errors);
    }

    [Fact]
    public void FromTypedResult_ReturnsUnauthorizedResponseWithStandardContract()
    {
        var controller = new TestController();

        var result = controller.Execute(ServiceResult<string>.Unauthorized("Kh\u00f4ng \u0111\u01b0\u1ee3c ph\u00e9p"));

        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        var response = Assert.IsType<ApiResponse<object?>>(unauthorizedResult.Value);

        Assert.False(response.Success);
        Assert.Equal("Kh\u00f4ng \u0111\u01b0\u1ee3c ph\u00e9p", response.Message);
    }

    private sealed class TestController : BaseApiController
    {
        public IActionResult Execute(ServiceResult result) => FromResult(result);

        public IActionResult Execute<T>(ServiceResult<T> result) => FromResult(result);
    }
}
