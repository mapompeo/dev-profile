import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';

export type CardFormat = 'story' | 'post';
export type CardTheme = 'dark' | 'light';

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

  /* ── Ultra-Dense Formats (Strict 1080px base) ───────────────────────── */
  readonly formats: FormatConfig[] = [
    { id: 'post',    label: 'Post',    icon: 'instagram', platform: 'Feed (1:1)',  aspect: '1/1',    width: 1080, height: 1080 },
    { id: 'story',   label: 'Story',   icon: 'instagram', platform: 'Story (9:16)',  aspect: '9/16',   width: 1080, height: 1920 },
  ];

  /* ── Modern Tech Themes ─────────────────────────────────────────────── */
  readonly themes: ThemeConfig[] = [
    {
      id: 'dark', label: 'Modo Escuro',
      bg: '#0a0a0f', surface: '#16161e', accent: '#8957e5', accentLight: '#d2a8ff',
      text: '#e6edf3', subtext: '#7d8590', border: 'rgba(255,255,255,0.08)'
    },
    {
      id: 'light', label: 'Modo Claro',
      bg: '#ffffff', surface: '#f6f8fa', accent: '#0969da', accentLight: '#54aeff',
      text: '#1f2328', subtext: '#656d76', border: 'rgba(31,35,40,0.08)'
    }
  ];

  selectedFormat: CardFormat = 'post';
  selectedTheme: CardTheme  = 'dark';
  isExporting = false;
  showModal = false;
  generatedImageUrl: string | null = null;

  get format(): FormatConfig {
    return this.formats.find(f => f.id === this.selectedFormat)!;
  }

  get theme(): ThemeConfig {
    return this.themes.find(t => t.id === this.selectedTheme)!;
  }

  get badgeTitle(): string {
    const score = this.profile?.analysis?.seniorityScore || 0;
    if (score >= 80) return 'Arquiteto do GitHub';
    if (score >= 60) return 'Líder Técnico';
    if (score >= 35) return 'Engenheiro de Software';
    return 'Desenvolvedor Altamente Ativo';
  }

  get formattedWorth(): string {
    const val = this.profile?.analysis?.aggregatedValue || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  get topFiveLangs(): any[] {
    return (this.profile?.analysis?.topLanguagesAll || []).slice(0, 5);
  }

  get radarCompetencies(): any[] {
    const r = this.profile?.analysis?.radar || {};
    return [
      { label: 'Consistência', value: r.consistency   || 0 },
      { label: 'Velocidade',   value: r.velocity      || 0 },
      { label: 'Diversidade',  value: r.diversity     || 0 },
      { label: 'Popularidade', value: r.popularity    || 0 },
      { label: 'Colaboração',  value: r.collaboration || 0 }
    ];
  }

  ngOnInit() {}

  setFormat(id: CardFormat) { this.selectedFormat = id; }
  setTheme(id: CardTheme)   { this.selectedTheme  = id; }

  async generateAndOpen() {
    if (!this.profile) return;
    this.isExporting = true;
    
    // ── WYSIWYG Approach: Capture the ACTIVE PREVIEW directly ───────
    // This ensures what the user sees is exactly what they get.
    const previewEl = document.querySelector('.scaler-contain');
    if (!previewEl) {
      this.isExporting = false;
      return;
    }

    try {
      // Small pause for state stability
      await new Promise(r => setTimeout(r, 400));

      const rect = previewEl.getBoundingClientRect();
      const targetWidth = 1080;
      // Calculate scale to reach exactly 1080px width
      const captureScale = (targetWidth / rect.width) * window.devicePixelRatio;

      const canvas = await html2canvas(previewEl as HTMLElement, {
        scale: captureScale, 
        useCORS: true,
        allowTaint: false,
        backgroundColor: this.theme.bg,
        logging: false,
        imageTimeout: 15000,
      });

      this.generatedImageUrl = canvas.toDataURL('image/png', 1.0);
      this.showModal = true;
    } catch (err) {
      console.error('Falha ao gerar captura de alta fidelidade:', err);
    } finally {
      this.isExporting = false;
    }
  }

  async share(platform: string) {
    if (!this.generatedImageUrl) return;

    if (platform === 'download') {
      const link = document.createElement('a');
      link.download = `dev-profile-${this.selectedFormat}.png`;
      link.href = this.generatedImageUrl;
      link.click();
      return;
    }

    if (platform === 'native' && navigator.share) {
      try {
        const response = await fetch(this.generatedImageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'card.png', { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Meu Perfil DevProfile',
          text: 'Minhas estatísticas Git!'
        });
      } catch (err) { console.error('Share Error:', err); }
      return;
    }

    const text = encodeURIComponent('Minhas estatísticas GitHub @DevProfile');
    const url = encodeURIComponent(window.location.href);

    const shareLinks: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://api.whatsapp.com/send?text=${text}%20${url}`
    };

    if (shareLinks[platform]) {
      window.open(shareLinks[platform], '_blank');
    }
  }

  closeModal() { this.showModal = false; this.generatedImageUrl = null; }

  getLangFill(lang: any): number {
    const langs = this.topFiveLangs;
    if (!langs.length) return 0;
    const max = Math.max(...langs.map((l: any) => l.repositories ?? 0));
    return max > 0 ? ((lang.repositories ?? 0) / max) * 100 : 0;
  }
}
