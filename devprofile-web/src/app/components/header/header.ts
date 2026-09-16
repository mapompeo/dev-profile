import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
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

  @ViewChild('methodDialog') methodDialog!: ElementRef<HTMLDialogElement>;

  readonly theme = inject(ThemeService);

  onThemeChange(event: Event): void {
    this.theme.set((event.target as HTMLSelectElement).value as Theme);
  }

  openMethod(): void {
    this.methodDialog?.nativeElement.showModal();
  }

  closeMethod(): void {
    this.methodDialog?.nativeElement.close();
  }

  /** Clique no fundo do diálogo fecha; clique no conteúdo, não. */
  onDialogClick(event: MouseEvent): void {
    if (event.target === this.methodDialog?.nativeElement) {
      this.closeMethod();
    }
  }
}
