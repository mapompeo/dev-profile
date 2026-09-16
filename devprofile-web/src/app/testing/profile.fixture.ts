import { Profile, ProfileComparisonResult } from '../models/profile.models';

/** Perfil de teste com números redondos, para as contas ficarem óbvias no assert. */
export function fakeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    username: 'dev',
    name: 'Dev da Silva',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    bio: 'Fullstack',
    company: 'Empresa',
    location: 'Brasil',
    createdAt: '2022-10-21T00:00:00Z',
    stats: {
      totalStars: 26,
      totalRepositories: 22,
      totalCommits: 1060,
      totalForks: 4,
      followers: 24,
      following: 62
    },
    analysis: {
      seniorityLevel: 'Pleno',
      seniorityScore: 60,
      experienceYears: '3-5',
      mainStack: 'Fullstack',
      stackConfidence: 0.38,
      languagesCount: 8,
      valueScore: 60,
      totalScore: 3150,
      aggregatedValue: 11200,
      topLanguages: [
        { name: 'JavaScript', percentage: 33.33, repositories: 7 },
        { name: 'C#', percentage: 28.57, repositories: 6 },
        { name: 'C++', percentage: 9.52, repositories: 2 },
        { name: 'HTML', percentage: 9.52, repositories: 2 },
        { name: 'C', percentage: 4.76, repositories: 1 }
      ],
      topLanguagesAll: [
        { name: 'JavaScript', percentage: 33.33, repositories: 7 },
        { name: 'C#', percentage: 28.57, repositories: 6 },
        { name: 'C++', percentage: 9.52, repositories: 2 },
        { name: 'HTML', percentage: 9.52, repositories: 2 },
        { name: 'C', percentage: 4.76, repositories: 1 },
        { name: 'Python', percentage: 4.76, repositories: 1 }
      ],
      radar: {
        consistency: 91,
        diversity: 100,
        popularity: 17,
        structure: 28,
        collaboration: 12,
        velocity: 53
      },
      stackBreakdown: { frontend: 40, backend: 24, devOps: 12, mobile: 4, data: 6, scripts: 5 }
    },
    ...overrides
  };
}

export function fakeComparison(): ProfileComparisonResult {
  const left = fakeProfile();
  const right = fakeProfile({
    username: 'outro',
    name: 'Outro Dev',
    stats: { ...fakeProfile().stats, totalCommits: 1959, totalStars: 47461, totalRepositories: 301, followers: 93658 }
  });
  right.analysis = { ...right.analysis, seniorityScore: 91, seniorityLevel: 'Senior' };

  return {
    left,
    right,
    winnerByScore: 'outro',
    scoreDifference: 31,
    summary: 'A maior distância está em colaboração: 100 contra 12, a favor de outro.'
  };
}
