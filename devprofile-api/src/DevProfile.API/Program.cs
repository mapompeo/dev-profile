using DevProfile.API.Services;
using DevProfile.API.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200", 
                "https://devprofile.vercel.app", // Placeholder (User can update after deploy)
                builder.Configuration["AllowedOrigins"] ?? ""
            )
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
});

builder.Services.AddScoped<IScoreEngine, ScoreEngine>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("DefaultPolicy");
app.MapControllers();

app.Run();
