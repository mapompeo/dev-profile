using DevProfile.API.Models.DTOs;
using DevProfile.API.Services.Interfaces;

namespace DevProfile.API.Services;

public sealed class ScoreEngine : IScoreEngine
{
    private readonly IGitHubService _gitHubService;

    public ScoreEngine(IGitHubService gitHubService)
    {
        _gitHubService = gitHubService;
    }

    public async Task<ScoreResultDto> CalculateAsync(string username, CancellationToken cancellationToken = default)
    {
        var profile = await _gitHubService.GetProfileAsync(username, cancellationToken);
        var languages = await _gitHubService.GetLanguageDistributionAsync(username, cancellationToken);

        var years = Math.Max(0.5, (DateTime.UtcNow - profile.CreatedAt).TotalDays / 365.25);
        var commitsScore = Normalize(profile.TotalCommits, 2000);
        var seniorityYearsScore = Normalize(years, 8);
        var languageDiversityScore = Normalize(languages.Count, 12);
        var communityImpactScore = Normalize(profile.TotalStars + profile.TotalForks, 500);
        var consistencyScore = CalculateConsistencyScore(profile.TotalCommits, years);

        var valueScore = (commitsScore * 0.30)
                       + (seniorityYearsScore * 0.20)
                       + (languageDiversityScore * 0.20)
                       + (communityImpactScore * 0.15)
                       + (consistencyScore * 0.15);

        var roundedScore = (int)Math.Round(valueScore, MidpointRounding.AwayFromZero);
        var mainStack = DetectMainStack(languages);

        return new ScoreResultDto
        {
            SeniorityLevel = ToSeniorityLevel(roundedScore),
            SeniorityScore = roundedScore,
            ExperienceYears = ToExperienceRange(years),
            MainStack = mainStack.MainStack,
            StackConfidence = mainStack.Confidence,
            LanguagesCount = languages.Count,
            ValueScore = roundedScore,
            TopLanguages = languages.Take(5).ToList()
        };
    }

    public async Task<ProfileResponseDto> BuildProfileResponseAsync(string username, CancellationToken cancellationToken = default)
    {
        var profile = await _gitHubService.GetProfileAsync(username, cancellationToken);
        var analysis = await CalculateAsync(username, cancellationToken);

        return new ProfileResponseDto
        {
            Username = profile.Username,
            Name = profile.Name,
            AvatarUrl = profile.AvatarUrl,
            Bio = profile.Bio,
            Stats = new ProfileStatsDto
            {
                TotalStars = profile.TotalStars,
                TotalRepositories = profile.PublicRepositories,
                TotalCommits = profile.TotalCommits,
                Followers = profile.Followers,
                Following = profile.Following
            },
            Analysis = analysis
        };
    }

    private static double Normalize(double value, double maxValue)
    {
        if (maxValue <= 0)
        {
            return 0;
        }

        var normalized = (value / maxValue) * 100;
        return Math.Clamp(normalized, 0, 100);
    }

    private static double CalculateConsistencyScore(int commits, double years)
    {
        var commitsPerMonth = commits / Math.Max(1, years * 12);
        return Normalize(commitsPerMonth, 25);
    }

    private static string ToSeniorityLevel(int score)
    {
        if (score <= 34)
        {
            return "Junior";
        }

        if (score <= 64)
        {
            return "Pleno";
        }

        return "Senior";
    }

    private static string ToExperienceRange(double years)
    {
        if (years < 2)
        {
            return "0-2";
        }

        if (years < 5)
        {
            return "3-5";
        }

        return "5+";
    }

    private static MainStackResult DetectMainStack(IReadOnlyList<LanguageUsageDto> languages)
    {
        if (languages.Count == 0)
        {
            return new MainStackResult("Unknown", 0);
        }

        var top = languages.Take(6).ToList();
        var buckets = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase)
        {
            ["Frontend"] = Sum(top, ["JavaScript", "TypeScript", "HTML", "CSS"]),
            ["Backend"] = Sum(top, ["C#", "Java", "Go", "Ruby", "Python", "PHP"]),
            ["Mobile"] = Sum(top, ["Swift", "Kotlin", "Dart"]),
            ["Data Science"] = Sum(top, ["Python", "R", "Jupyter Notebook"]),
            ["DevOps"] = Sum(top, ["Shell", "Dockerfile", "HCL", "PowerShell", "YAML"])
        };

        var winner = buckets.OrderByDescending(x => x.Value).First();
        var confidence = Math.Round(winner.Value / 100, 2);

        if (buckets["Frontend"] > 25 && buckets["Backend"] > 25)
        {
            var fullstackConfidence = Math.Round((buckets["Frontend"] + buckets["Backend"]) / 200, 2);
            return new MainStackResult("Fullstack", fullstackConfidence);
        }

        if (winner.Value <= 0)
        {
            return new MainStackResult("Unknown", 0);
        }

        return new MainStackResult(winner.Key, confidence);
    }

    private static double Sum(IEnumerable<LanguageUsageDto> languages, IReadOnlyCollection<string> names)
    {
        return languages
            .Where(l => names.Contains(l.Name, StringComparer.OrdinalIgnoreCase))
            .Sum(l => l.Percentage);
    }

    private sealed class MainStackResult
    {
        public MainStackResult(string mainStack, double confidence)
        {
            MainStack = mainStack;
            Confidence = confidence;
        }

        public string MainStack { get; }
        public double Confidence { get; }
    }
}
