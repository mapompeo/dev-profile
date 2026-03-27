import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';

export type CardFormat = 'story' | 'post' | 'linkedin' | 'twitter';
export type CardTheme = 'copilot' | 'github' | 'aurora' | 'terminal' | 'ocean' | 'sunrise';

interface FormatConfig {
  id: CardFormat;
  label: string;
  icon: string;
  platform: string;
  aspect: string;   // CSS aspect-ratio
  width: number;    // export px
  height: number;
}

interface ThemeConfig {
  id: CardTheme;
  label: string;
  bg: string;
  surface: string;
  accent: string;
  accentLight: string;
  text: string;
  subtext: string;
  border: string;
}

@Component({
  selector: 'app-card-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-generator.html',
  styleUrls: ['./card-generator.scss']
})
export class CardGenerator implements OnInit {
  @Input() profile: any;

  /* ── Formats ─────────────────────────────────────────────────────────── */
  readonly formats: FormatConfig[] = [
    { id: 'story',   label: 'Story',   icon: '📱', platform: 'Instagram',  aspect: '9/16',   width: 1080, height: 1920 },
    { id: 'post',    label: 'Post',    icon: '🟫', platform: 'Instagram',  aspect: '1/1',    width: 1080, height: 1080 },
    { id: 'linkedin',label: 'LinkedIn',icon: '💼', platform: 'LinkedIn',   aspect: '1.91/1', width: 1200, height: 628  },
    { id: 'twitter', label: 'Twitter', icon: '🐦', platform: 'Twitter/X',  aspect: '16/9',   width: 1200, height: 675  },
  ];

  /* ── Themes ──────────────────────────────────────────────────────────── */
  readonly themes: ThemeConfig[] = [
    {
      id: 'copilot', label: 'Copilot',
      bg: '#0c0c10', surface: '#1a1625', accent: '#8534F3', accentLight: '#C898FD',
      text: '#F2F5F3', subtext: '#909692', border: 'rgba(255,255,255,0.08)'
    },
    {
      id: 'github', label: 'GitHub',
      bg: '#0d1117', surface: '#161b22', accent: '#0FBF3E', accentLight: '#8CF2A6',
      text: '#e6edf3', subtext: '#7d8590', border: 'rgba(255,255,255,0.08)'
    },
    {
      id: 'aurora', label: 'Aurora',
      bg: '#0a001a', surface: '#130028', accent: '#B870FF', accentLight: '#e0aaff',
      text: '#F2F5F3', subtext: '#9d8fb8', border: 'rgba(184,112,255,0.15)'
    },
    {
      id: 'terminal', label: 'Terminal',
      bg: '#000000', surface: '#0d0d0d', accent: '#00FF41', accentLight: '#80FF80',
      text: '#ffffff', subtext: '#666666', border: 'rgba(0,255,65,0.2)'
    },
    {
      id: 'ocean', label: 'Ocean',
      bg: '#020b18', surface: '#0a1929', accent: '#3094FF', accentLight: '#9EECFF',
      text: '#e8f4fd', subtext: '#7eb0d4', border: 'rgba(48,148,255,0.15)'
    },
    {
      id: 'sunrise', label: 'Sunrise',
      bg: '#120808', surface: '#1e0f0f', accent: '#FE4C25', accentLight: '#F4A876',
      text: '#fdf1e8', subtext: '#a07060', border: 'rgba(254,76,37,0.15)'
    },
  ];

  selectedFormat: CardFormat = 'story';
  selectedTheme: CardTheme  = 'copilot';
  isExporting = false;

  get format(): FormatConfig {
    return this.formats.find(f => f.id === this.selectedFormat)!;
  }

  get theme(): ThemeConfig {
    return this.themes.find(t => t.id === this.selectedTheme)!;
  }

  /* Top 3 languages for card */
  get topThreeLangs(): any[] {
    return (this.profile?.analysis?.topLanguages || []).slice(0, 3);
  }

  /* Top completed badge */
  get completedBadges(): any[] {
    return (this.profile?.analysis?.badges || []).filter((b: any) => b.completed);
  }

  ngOnInit() {}

  setFormat(id: CardFormat) { this.selectedFormat = id; }
  setTheme(id: CardTheme)   { this.selectedTheme  = id; }

  async exportCard() {
    this.isExporting = true;
    const el = document.getElementById('dev-card-preview');
    if (!el) { this.isExporting = false; return; }

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: this.theme.bg,
        width:  this.format.width  / 3, // preview width
        height: this.format.height / 3, // preview height
      });

      const link = document.createElement('a');
      link.download = `devprofile-card-${this.selectedFormat}-${this.selectedTheme}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      this.isExporting = false;
    }
  }

  getLangBarWidth(lang: any): number {
    const langs = this.topThreeLangs;
    if (!langs.length) return 0;
    const max = Math.max(...langs.map((l: any) => l.repositories ?? 0));
    return max > 0 ? ((lang.repositories ?? 0) / max) * 100 : 0;
  }
}
