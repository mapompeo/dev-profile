import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Theme, ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header {
  @Input() isMainView = false;
  @Output() onHome = new EventEmitter<void>();

  readonly theme = inject(ThemeService);

  onThemeChange(event: Event): void {
    this.theme.set((event.target as HTMLSelectElement).value as Theme);
  }
}
