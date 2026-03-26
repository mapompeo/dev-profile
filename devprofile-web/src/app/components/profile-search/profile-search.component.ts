import { Component } from '@angular/core';
import { ProfileService, ProfileResponse, ProfileComparison } from '../../services/profile.service';

@Component({
    selector: 'app-profile-search',
    templateUrl: './profile-search.component.html',
    styleUrls: ['./profile-search.component.scss']
})
export class ProfileSearchComponent {
    username = '';
    left = '';
    right = '';
    profile: ProfileResponse | null = null;
    comparison: ProfileComparison | null = null;
    error: string | null = null;
    loading = false;

    constructor(private profileService: ProfileService) { }

    searchProfile() {
        this.error = null;
        this.comparison = null;
        this.loading = true;
        this.profileService.getProfile(this.username.trim())
            .subscribe({
                next: (data) => {
                    this.profile = data;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.error?.message || 'Erro ao buscar perfil.';
                    this.profile = null;
                    this.loading = false;
                }
            });
    }

    compareProfiles() {
        this.error = null;
        this.profile = null;
        this.loading = true;
        this.profileService.compareProfiles(this.left.trim(), this.right.trim())
            .subscribe({
                next: (data) => {
                    this.comparison = data;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = err.error?.message || 'Erro ao comparar perfis.';
                    this.comparison = null;
                    this.loading = false;
                }
            });
    }
}
