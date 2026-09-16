using DevProfile.API.Services;
using DevProfile.API.Services.Interfaces;
using DevProfile.API.Services.Internal;
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options =>
{
    var allowedOrigins = new List<string> { "http://localhost:4200", "https://devprofile.vercel.app" };
    var configuredOrigin = builder.Configuration["AllowedOrigins"];
    if (!string.IsNullOrWhiteSpace(configuredOrigin))
    {
        allowedOrigins.Add(configuredOrigin);
    }

    options.AddPolicy("DefaultPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins.ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddHttpClient<IGitHubService, GitHubService>((provider, client) =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    client.BaseAddress = new Uri("https://api.github.com/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(config["GitHub:AppName"] ?? "DevProfile");

    var token = config["GitHub:Token"];
    if (!string.IsNullOrWhiteSpace(token))
    {
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }
}).AddStandardResilienceHandler();

// O calendário de contribuições vem do HTML público do perfil, não da API, então
// é outro cliente: base github.com, sem token e sem consumir a cota de 60/h.
builder.Services.AddHttpClient<IContributionCalendarService, ContributionCalendarService>((provider, client) =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    client.BaseAddress = new Uri("https://github.com/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd(config["GitHub:AppName"] ?? "DevProfile");
    client.Timeout = TimeSpan.FromSeconds(15);
}).AddStandardResilienceHandler();

builder.Services.AddScoped<IScoreEngine, ScoreEngine>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = exception switch
        {
            GitHubRateLimitExceededException => StatusCodes.Status429TooManyRequests,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status500InternalServerError
        };

        var message = exception is GitHubRateLimitExceededException or KeyNotFoundException
            ? exception.Message
            : "An unexpected error occurred.";

        await context.Response.WriteAsJsonAsync(new { message });
    });
});

app.UseHttpsRedirection();
app.UseCors("DefaultPolicy");
app.MapControllers();

app.Run();
