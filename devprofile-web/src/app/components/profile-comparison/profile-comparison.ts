import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-comparison',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-comparison.html',
  styleUrls: ['./profile-comparison.scss']
})
export class ProfileComparison {
  @Input() comparison: any;
  @Output() onBack = new EventEmitter<void>();
  @Output() onDownload = new EventEmitter<HTMLElement>();
  
  @ViewChild('dashboardElement') dashboardElement!: ElementRef;
}
