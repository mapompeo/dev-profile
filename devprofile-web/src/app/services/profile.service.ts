import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProfileResponse {
    username: string;
    name?: string;
    avatarUrl?: string;
    bio?: string;
    stats: {
        totalStars: number;
        totalRepositories: number;
        totalCommits: number;
        followers: number;
        following: number;
    };
    analysis: {
        seniorityLevel: string;
        seniorityScore: number;
        experienceYears: string;
        mainStack: string;
        stackConfidence: number;
        languagesCount: number;
        valueScore: number;
        topLanguages: Array<{
            name: string;
            percentage: number;
            repositories: number;
        }>;
    };
}

export interface ProfileComparison {
    left: ProfileResponse;
    right: ProfileResponse;
    winnerByScore: string;
    scoreDifference: number;
    summary: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
    constructor(private http: HttpClient) { }

    getProfile(username: string): Observable<ProfileResponse> {
        return this.http.get<ProfileResponse>(`/api/profile/${username}`);
    }

    compareProfiles(left: string, right: string): Observable<ProfileComparison> {
        return this.http.get<ProfileComparison>(`/api/profile/compare?left=${left}&right=${right}`);
    }
}
