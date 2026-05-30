using Backend.Common;
using Backend.DTOs;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Backend.Helpers
{
    public static class ApiResponseFactory
    {
        public static ApiResponse<T> Success<T>(T? data, string message)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        public static ApiResponse<object?> Error(string message, Dictionary<string, string[]>? errors = null)
        {
            return new ApiResponse<object?>
            {
                Success = false,
                Message = message,
                Errors = errors
            };
        }

        public static ApiResponse<object?> ValidationError(
            ModelStateDictionary modelState,
            string message = AppMessages.InvalidData)
        {
            return Error(message, ToErrorDictionary(modelState));
        }

        public static Dictionary<string, string[]> ToErrorDictionary(ModelStateDictionary modelState)
        {
            return modelState
                .Where(entry => entry.Value?.Errors.Count > 0)
                .ToDictionary(
                    entry => entry.Key,
                    entry => entry.Value!.Errors.Select(error => error.ErrorMessage).ToArray());
        }
    }
}
