import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import html2canvas from 'html2canvas';

import { Header } from '../header/header';
import { Hero } from '../hero/hero';

import { LoadingStatus } from '../hero/hero';
import { ProfileDashboard } from '../profile-dashboard/profile-dashboard';
import { ProfileComparison } from '../profile-comparison/profile-comparison';

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
    ProfileComparison
  ],
  templateUrl: './profile-search.component.html',
  styleUrls: ['./profile-search.component.scss']
})
export class ProfileSearchComponent implements OnInit {
  profile: any = null;
  comparison: any = null;
  loading: boolean = false;
  error: string | null = null;
  isJsonView: boolean = false;
  loadingStatus: LoadingStatus = LoadingStatus.IDLE;

  private wakingUpTimer: any;

  constructor(
    private http: HttpClient,
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
          window.location.href = `/api/profile/compare?left=${user1}&right=${user2}`;
        } else if (user1) {
          window.location.href = `/api/profile/${user1}`;
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

  private setProfileTitle(profile: any) {
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

    this.http.get(`/api/profile/${user}`).subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
        this.clearWakingUpTimer();
        this.setProfileTitle(data);
        // Navigate to shareable URL only after success
        if (pushUrl) this.router.navigate(['/dashboard', user], { replaceUrl: true });
      },
      error: (err) => {
        this.error = err.error?.message || 'Erro ao buscar perfil. Verifique se o usuário existe.';
        this.loading = false;
        this.clearWakingUpTimer();
      }
    });
  }

  private fetchComparison(user1: string, user2: string, pushUrl: boolean = true) {
    this.loading = true;
    this.error = null;
    this.profile = null;
    this.loadingStatus = LoadingStatus.ANALYZING;

    this.startWakingUpTimer();

    this.http.get(`/api/profile/compare?left=${user1}&right=${user2}`).subscribe({
      next: (data) => {
        this.comparison = data;
        this.loading = false;
        this.clearWakingUpTimer();
        // Navigate to shareable URL only after success
        if (pushUrl) this.router.navigate(['/dashboard/compare', user1, user2], { replaceUrl: true });
      },
      error: (err) => {
        this.error = err.error?.message || 'Erro ao buscar dados. Verifique os usuários.';
        this.loading = false;
        this.clearWakingUpTimer();
      }
    });
  }

  private startWakingUpTimer() {
    this.clearWakingUpTimer();
    this.wakingUpTimer = setTimeout(() => {
      if (this.loading) {
        this.loadingStatus = LoadingStatus.WAKING_UP;
      }
    }, 3000); // If no response in 3s, show waking up
  }

  private clearWakingUpTimer() {
    if (this.wakingUpTimer) {
      clearTimeout(this.wakingUpTimer);
      this.wakingUpTimer = null;
    }
  }

  downloadAsImage(element: HTMLElement) {
    if (!element) return;
    html2canvas(element, { backgroundColor: '#0c0c10', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `devprofile-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }
}
