import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComparisonResult } from '../../models/profile.models';

@Component({
  selector: 'app-profile-comparison',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-comparison.html',
  styleUrls: ['./profile-comparison.scss']
})
export class ProfileComparison {
  @Input({ required: true }) comparison!: ProfileComparisonResult;
  @Output() onBack = new EventEmitter<void>();
  @Output() onDownload = new EventEmitter<HTMLElement>();

  @ViewChild('dashboardElement') dashboardElement!: ElementRef;

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
