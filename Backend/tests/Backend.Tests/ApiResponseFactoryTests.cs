using Backend.Common;
using Backend.Helpers;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Backend.Tests;

public class ApiResponseFactoryTests
{
    [Fact]
    public void ValidationError_MapsModelStateToTypedDictionary()
    {
        var modelState = new ModelStateDictionary();
        modelState.AddModelError("Email", "Email l\u00e0 b\u1eaft bu\u1ed9c");
        modelState.AddModelError("Email", "Email kh\u00f4ng h\u1ee3p l\u1ec7");

        var response = ApiResponseFactory.ValidationError(modelState);

        Assert.False(response.Success);
        Assert.Equal(AppMessages.InvalidData, response.Message);
        Assert.NotNull(response.Errors);
        Assert.True(response.Errors!.ContainsKey("Email"));
        Assert.Equal(
            new[] { "Email l\u00e0 b\u1eaft bu\u1ed9c", "Email kh\u00f4ng h\u1ee3p l\u1ec7" },
            response.Errors["Email"]);
    }
}
