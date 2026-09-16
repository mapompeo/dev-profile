import { Injectable, signal } from '@angular/core';

/** Os três temas do Primer, mais `system`, que devolve a decisão ao SO. */
export type Theme = 'system' | 'light' | 'dark' | 'dimmed';

const STORAGE_KEY = 'devprofile:theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.read());

  constructor() {
    this.apply(this.theme());
  }

  set(theme: Theme): void {
    this.theme.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // modo privado ou storage bloqueado: o tema vale só para esta sessão
    }
  }

  private read(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'dimmed' || saved === 'system') {
        return saved;
      }
    } catch {
      // idem
    }
    return 'system';
  }

  /** `system` remove o atributo e deixa o prefers-color-scheme decidir. */
  private apply(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }
}
