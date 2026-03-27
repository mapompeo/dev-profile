import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardGenerator } from '../card-generator/card-generator';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [CommonModule, CardGenerator],
  templateUrl: './profile-dashboard.html',
  styleUrls: ['./profile-dashboard.scss']
})
export class ProfileDashboard {
  @Input() profile: any;
  @Output() onBack = new EventEmitter<void>();
  @Output() onDownload = new EventEmitter<HTMLElement>();

  @ViewChild('dashboardElement') dashboardElement!: ElementRef;

  /** Returns a percentage width for a language bar relative to the top language */
  getLangPercent(lang: any, langs: any[]): number {
    if (!langs?.length) return 0;
    const max = Math.max(...langs.map((l: any) => l.repositories ?? 0));
    return max > 0 ? ((lang.repositories ?? 0) / max) * 100 : 0;
  }
}
