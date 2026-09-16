import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { Header } from '../header/header';
import { Hero } from '../hero/hero';

import { LoadingStatus } from '../hero/hero';
import { ProfileDashboard } from '../profile-dashboard/profile-dashboard';
import { ProfileComparison } from '../profile-comparison/profile-comparison';
import { ContributionRain } from '../contribution-rain/contribution-rain';
import { ProfileService } from '../../services/profile.service';
import { ContributionDay, Profile, ProfileComparisonResult } from '../../models/profile.models';
import { captureElementAsPngDataUrl, downloadDataUrl } from '../../utils/image-export';

const DEFAULT_FAVICON_URL = 'https://img.icons8.com/ios11/512/FFFFFF/github.png';

@Component({
  selector: 'app-profile-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Header,
    Hero,
    ProfileDashboard,
    ProfileComparison,
    ContributionRain
  ],
  templateUrl: './profile-search.component.html',
  styleUrls: ['./profile-search.component.scss']
})
export class ProfileSearchComponent implements OnInit {
  profile: Profile | null = null;
  comparison: ProfileComparisonResult | null = null;
  loading: boolean = false;
  error: string | null = null;
  isJsonView: boolean = false;
  contributionDays: ContributionDay[] = [];
  loadingStatus: LoadingStatus = LoadingStatus.IDLE;

  private wakingUpTimer: ReturnType<typeof setTimeout> | null = null;

  // O app roda sem zone.js: mudanca de propriedade simples fora de um evento do
  // template nao agenda deteccao. Toda resposta assincrona precisa marcar a view.
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private profileService: ProfileService,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const user1 = params.get('user') || params.get('user1');
      const user2 = params.get('user2');
      this.isJsonView = params.get('json') === 'json';

      // If user wants raw JSON, redirect directly to the backend API
      if (this.isJsonView) {
        if (user1 && user2) {
          window.location.href = `/api/profile/compare?left=${encodeURIComponent(user1)}&right=${encodeURIComponent(user2)}`;
        } else if (user1) {
          window.location.href = `/api/profile/${encodeURIComponent(user1)}`;
        }
        return;
      }

      // Only trigger fetch from URL params if not already loading
      // (prevents re-triggering when we push the URL after data loads)
      if (this.loading) return;

      if (user1 && user2) {
        this.fetchComparison(user1, user2, false); // false = don't push URL again
      } else if (user1) {
        this.fetchProfile(user1, false); // false = don't push URL again
      } else {
        this.resetView(false);
      }
    });
  }

  // ─── App logic & Routing ────────────────────────────────────────────────────
  searchProfile(user: string) {
    if (!user) return;
    // Fetch directly without navigating first — keeps Hero alive & in current mode
    this.fetchProfile(user, true);
  }

  handleCompare(event: { left: string, right: string }) {
    if (!event.left || !event.right) return;
    // Fetch directly without navigating first — keeps Hero alive & in VS mode
    this.fetchComparison(event.left, event.right, true);
  }

  resetView(navigate: boolean = true) {
    this.profile = null;
    this.comparison = null;
    this.contributionDays = [];
    this.loading = false;
    this.error = null;
    this.isJsonView = false;
    this.setDefaultTitle();
    if (navigate) {
      this.router.navigate(['/']);
    }
  }

  // ─── Title & Favicon ────────────────────────────────────────────────────────
  private setDefaultTitle() {
    this.titleService.setTitle('DevProfile — Mapeie sua Senioridade Técnica');
    this.setFavicon(DEFAULT_FAVICON_URL);
  }

  private setProfileTitle(profile: Profile) {
    const name = profile?.name || profile?.username || 'Usuário';
    this.titleService.setTitle(`${name} | DevProfile`);
    this.setFavicon(DEFAULT_FAVICON_URL);
  }

  private setFavicon(href: string) {
    const link = document.getElementById('app-favicon') as HTMLLinkElement;
    if (link) link.href = href;
  }

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  private fetchProfile(user: string, pushUrl: boolean = true) {
    this.loading = true;
    this.error = null;
    this.comparison = null;
    this.loadingStatus = LoadingStatus.ANALYZING;

    this.startWakingUpTimer();

    this.profileService.getProfile(user).subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
        this.clearWakingUpTimer();
        this.setProfileTitle(data);
        this.cdr.markForCheck();
        this.loadContributions(data.username);
        // Navigate to shareable URL only after success
        if (pushUrl) this.router.navigate(['/dashboard', user], { replaceUrl: true });
      },
      error: (err) => {
        this.error = err.error?.message || 'Erro ao buscar perfil. Verifique se o usuário existe.';
        this.loading = false;
        this.clearWakingUpTimer();
        this.cdr.markForCheck();
      }
    });
  }

  private fetchComparison(user1: string, user2: string, pushUrl: boolean = true) {
    this.loading = true;
    this.error = null;
    this.profile = null;
    this.loadingStatus = LoadingStatus.ANALYZING;

    this.startWakingUpTimer();

    this.profileService.compareProfiles(user1, user2).subscribe({
      next: (data) => {
        this.comparison = data;
        this.loading = false;
        this.clearWakingUpTimer();
        this.cdr.markForCheck();
        this.loadContributions(data.winnerByScore);
        // Navigate to shareable URL only after success
        if (pushUrl) this.router.navigate(['/dashboard/compare', user1, user2], { replaceUrl: true });
      },
      error: (err) => {
        this.error = err.error?.message || 'Erro ao buscar dados. Verifique os usuários.';
        this.loading = false;
        this.clearWakingUpTimer();
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Pano de fundo do painel. Roda depois da análise, de propósito: se demorar ou
   * falhar, ninguém percebe, porque a tela já está inteira na frente do usuário.
   */
  private loadContributions(username: string) {
    this.contributionDays = [];
    this.profileService.getContributions(username).subscribe({
      next: calendar => {
        this.contributionDays = calendar?.days ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.contributionDays = [];
        this.cdr.markForCheck();
      }
    });
  }

  private startWakingUpTimer() {
    this.clearWakingUpTimer();
    this.wakingUpTimer = setTimeout(() => {
      if (this.loading) {
        this.loadingStatus = LoadingStatus.WAKING_UP;
        this.cdr.markForCheck();
      }
    }, 3000); // If no response in 3s, show waking up
  }

  private clearWakingUpTimer() {
    if (this.wakingUpTimer) {
      clearTimeout(this.wakingUpTimer);
      this.wakingUpTimer = null;
    }
  }

  async downloadAsImage(element: HTMLElement) {
    if (!element) return;
    const dataUrl = await captureElementAsPngDataUrl(element);
    downloadDataUrl(dataUrl, `devprofile-${Date.now()}.png`);
  }
}
