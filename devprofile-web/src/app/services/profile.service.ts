import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile, ProfileComparisonResult } from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
    constructor(private http: HttpClient) { }

    getProfile(username: string): Observable<Profile> {
        return this.http.get<Profile>(`/api/profile/${encodeURIComponent(username)}`);
    }

    compareProfiles(left: string, right: string): Observable<ProfileComparisonResult> {
        return this.http.get<ProfileComparisonResult>(`/api/profile/compare?left=${encodeURIComponent(left)}&right=${encodeURIComponent(right)}`);
    }
}
