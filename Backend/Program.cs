using Backend.Extensions;

WebApplicationBuilder? builder = null;
try
{
    builder = WebApplication.CreateBuilder(args);

    builder.Logging.ClearProviders();
    builder.Logging.AddConsole();
    builder.Logging.AddDebug();

    builder.Services
        .AddApiConfiguration()
        .AddApplicationServices(builder.Configuration)
        .AddJwtAuthentication(builder.Configuration)
        .AddDatabase(builder.Configuration)
        .AddSwaggerDocumentation()
        .AddCorsPolicies(builder.Configuration);

    var app = builder.Build();

    app.UseApiConfiguration();

    app.Run();

    return 0;
}
catch (Exception ex)
{
    var configuration = builder?.Configuration;
    var connectionString = configuration?.GetConnectionString("DefaultConnection");
    Console.Error.WriteLine("Backend startup failed.");
    Console.Error.WriteLine($"Connection source: {ConnectionStringDiagnostics.GetConnectionStringSource(configuration ?? new ConfigurationManager())}");
    Console.Error.WriteLine($"Connection target: {ConnectionStringDiagnostics.Summarize(connectionString)}");
    Console.Error.WriteLine(ex);
    return 1;
}
