namespace Backend.Common
{
    public class ServiceResult
    {
        public ResultStatus Status { get; init; }
        public string Message { get; init; } = string.Empty;
        public Dictionary<string, string[]>? Errors { get; init; }

        public static ServiceResult Ok(string message) =>
            new() { Status = ResultStatus.Ok, Message = message };

        public static ServiceResult BadRequest(string message, Dictionary<string, string[]>? errors = null) =>
            new() { Status = ResultStatus.BadRequest, Message = message, Errors = errors };

        public static ServiceResult NotFound(string message) =>
            new() { Status = ResultStatus.NotFound, Message = message };

        public static ServiceResult Unauthorized(string message) =>
            new() { Status = ResultStatus.Unauthorized, Message = message };

        public static ServiceResult Forbidden(string message) =>
            new() { Status = ResultStatus.Forbidden, Message = message };
    }

    public class ServiceResult<T>
    {
        public ResultStatus Status { get; init; }
        public string Message { get; init; } = string.Empty;
        public T? Data { get; init; }
        public Dictionary<string, string[]>? Errors { get; init; }

        public static ServiceResult<T> Ok(T? data, string message) =>
            new() { Status = ResultStatus.Ok, Data = data, Message = message };

        public static ServiceResult<T> BadRequest(string message, Dictionary<string, string[]>? errors = null) =>
            new() { Status = ResultStatus.BadRequest, Message = message, Errors = errors };

        public static ServiceResult<T> NotFound(string message) =>
            new() { Status = ResultStatus.NotFound, Message = message };

        public static ServiceResult<T> Unauthorized(string message) =>
            new() { Status = ResultStatus.Unauthorized, Message = message };

        public static ServiceResult<T> Forbidden(string message) =>
            new() { Status = ResultStatus.Forbidden, Message = message };
    }
}
