import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardGenerator }      from '../card-generator/card-generator';
import { ChartRadar }         from '../chart-radar/chart-radar';
import { ChartDonut }         from '../chart-donut/chart-donut';
import { CareerPitch }        from '../career-pitch/career-pitch';
import { LangDemand }         from '../lang-demand/lang-demand';
import { CareerProjection }   from '../career-projection/career-projection';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [CommonModule, CardGenerator, ChartRadar, ChartDonut, CareerPitch, LangDemand, CareerProjection],
  templateUrl: './profile-dashboard.html',
  styleUrls: ['./profile-dashboard.scss']
})
export class ProfileDashboard {
  @Input() profile: any;
  @Output() onBack     = new EventEmitter<void>();
  @Output() onDownload = new EventEmitter<HTMLElement>();

  @ViewChild('dashboardElement') dashboardElement!: ElementRef;

  getLangPercent(lang: any, langs: any[]): number {
    if (!langs?.length) return 0;
    const max = Math.max(...langs.map((l: any) => l.repositories ?? 0));
    return max > 0 ? ((lang.repositories ?? 0) / max) * 100 : 0;
  }

  getRepoPercent(repo: any, repos: any[], prop: 'stars' | 'size' = 'stars'): number {
    if (!repos?.length) return 0;
    const max = Math.max(...repos.map((r: any) => r[prop] ?? 0));
    const val = repo[prop] ?? 0;
    return max > 0 ? Math.max((val / max) * 100, 5) : 5;
  }

  getLevel(score: number): number {
    if (!score) return 1;
    // Every 1000 points = 1 level
    return Math.floor(score / 1000) + 1;
  }

  /** Exposes the native encodeURIComponent to the template */
  encodeURIComponent(value: string): string {
    return encodeURIComponent(value ?? '');
  }

  /** Opens Google Calendar on the exact date the user joined GitHub */
  getCalendarUrl(createdAt: string | Date): string {
    if (!createdAt) return 'https://calendar.google.com';
    const date = new Date(createdAt);
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate();
    return `https://calendar.google.com/calendar/r/day/${y}/${m}/${d}`;
  }
}

