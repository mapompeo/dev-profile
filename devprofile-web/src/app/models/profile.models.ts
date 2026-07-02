export interface LanguageUsage {
  name: string;
  percentage: number;
  repositories: number;
}

export interface CompetenceRadar {
  consistency: number;
  diversity: number;
  popularity: number;
  structure: number;
  collaboration: number;
  velocity: number;
}

export interface StackBreakdown {
  frontend: number;
  backend: number;
  devOps: number;
  mobile: number;
  data: number;
  scripts: number;
}

export interface ScoreAnalysis {
  seniorityLevel: string;
  seniorityScore: number;
  experienceYears: string;
  mainStack: string;
  stackConfidence: number;
  languagesCount: number;
  valueScore: number;
  totalScore: number;
  topLanguages: LanguageUsage[];
  topLanguagesAll: LanguageUsage[];
  radar: CompetenceRadar;
  stackBreakdown: StackBreakdown;
  aggregatedValue: number;
}

export interface ProfileStats {
  totalStars: number;
  totalRepositories: number;
  totalCommits: number;
  totalForks: number;
  followers: number;
  following: number;
}

export interface Profile {
  username: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  company?: string;
  location?: string;
  createdAt: string;
  stats: ProfileStats;
  analysis: ScoreAnalysis;
}

export interface ProfileComparisonResult {
  left: Profile;
  right: Profile;
  winnerByScore: string;
  scoreDifference: number;
  summary: string;
}
