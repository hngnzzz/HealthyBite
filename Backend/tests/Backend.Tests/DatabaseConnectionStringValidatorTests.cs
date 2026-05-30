using Backend.Extensions;

namespace Backend.Tests;

public class DatabaseConnectionStringValidatorTests
{
    [Fact]
    public void ValidateOrThrow_ThrowsWhenPasswordIsMissing()
    {
        var connectionString = "Server=127.0.0.1;Port=3306;Database=healthymeal;Uid=healthymeal;";

        var exception = Assert.Throws<InvalidOperationException>(() =>
            DatabaseConnectionStringValidator.ValidateOrThrow(connectionString));

        Assert.Contains("missing a real password", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ValidateOrThrow_ThrowsWhenPasswordIsPlaceholder()
    {
        var connectionString = "Server=127.0.0.1;Port=3306;Database=healthymeal;Uid=healthymeal;Pwd=CHANGE_ME_DB_PASSWORD;";

        var exception = Assert.Throws<InvalidOperationException>(() =>
            DatabaseConnectionStringValidator.ValidateOrThrow(connectionString));

        Assert.Contains("placeholder", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ValidateOrThrow_AllowsValidPassword()
    {
        var connectionString = "Server=127.0.0.1;Port=3306;Database=healthymeal;Uid=healthymeal;Pwd=Secret123!;";

        var result = DatabaseConnectionStringValidator.ValidateOrThrow(connectionString);

        Assert.Contains("healthymeal", result, StringComparison.OrdinalIgnoreCase);
    }
}
