import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile, LanguageUsage } from '../../models/profile.models';
import { captureElementAsPngDataUrl, downloadDataUrl } from '../../utils/image-export';
import { langColor } from '../../utils/lang-colors';

export type CardFormat = 'story' | 'post';
export type CardTheme = 'dark' | 'light' | 'dimmed';

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
export class CardGenerator {
  @Input({ required: true }) profile!: Profile;

  @ViewChild('scalerContain') scalerContain?: ElementRef<HTMLElement>;

  readonly langColor = langColor;

  // App zoneless: estado alterado depois de um await precisa marcar a view.
  private readonly cdr = inject(ChangeDetectorRef);

  /* ── Ultra-Dense Formats (Strict 1080px base) ───────────────────────── */
  readonly formats: FormatConfig[] = [
    { id: 'post',    label: 'Post',    icon: 'instagram', platform: 'Feed (1:1)',  aspect: '1/1',    width: 1080, height: 1080 },
    { id: 'story',   label: 'Story',   icon: 'instagram', platform: 'Story (9:16)',  aspect: '9/16',   width: 1080, height: 1920 },
  ];

  /* -- Os mesmos tres temas do Primer usados no app -------------------- */
  // Unico lugar do projeto com hex fora de _theme.scss, e por um motivo: o card
  // e exportado como imagem e pode ter tema diferente do app, entao nao pode
  // depender das custom properties da pagina. Valores identicos aos do MASTER.md.
  readonly themes: ThemeConfig[] = [
    {
      id: 'dark', label: 'Dark default',
      bg: '#0d1117', surface: '#151b23', accent: '#4493f8', accentLight: '#79c0ff',
      text: '#f0f6fc', subtext: '#9198a1', border: '#3d444d'
    },
    {
      id: 'light', label: 'Light',
      bg: '#ffffff', surface: '#f6f8fa', accent: '#0969da', accentLight: '#218bff',
      text: '#1f2328', subtext: '#59636e', border: '#d1d9e0'
    },
    {
      id: 'dimmed', label: 'Dark dimmed',
      bg: '#22272e', surface: '#2d333b', accent: '#539bf5', accentLight: '#6cb6ff',
      text: '#adbac7', subtext: '#768390', border: '#444c56'
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
    const score = this.profile.analysis.seniorityScore || 0;
    if (score >= 80) return 'Arquiteto do GitHub';
    if (score >= 60) return 'Líder Técnico';
    if (score >= 35) return 'Engenheiro de Software';
    return 'Desenvolvedor Altamente Ativo';
  }

  get formattedWorth(): string {
    const val = this.profile.analysis.aggregatedValue || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  get topFiveLangs(): LanguageUsage[] {
    return (this.profile.analysis.topLanguagesAll || []).slice(0, 5);
  }

  /** Mesmo criterio da barra do painel: o que sobra das cinco vira um segmento neutro. */
  get otherLangsPercent(): number {
    const sum = this.topFiveLangs.reduce((total, lang) => total + (lang.percentage ?? 0), 0);
    return Math.max(0, Math.round((100 - sum) * 100) / 100);
  }

  get langBarLabel(): string {
    const parts = this.topFiveLangs.map(l => `${l.name} ${l.percentage}%`);
    if (this.otherLangsPercent > 0) parts.push(`outras ${this.otherLangsPercent}%`);
    return 'Composição de linguagens: ' + parts.join(', ');
  }

  get radarCompetencies(): { label: string; value: number }[] {
    const r = this.profile.analysis.radar;
    return [
      { label: 'Consistência', value: r.consistency   || 0 },
      { label: 'Velocidade',   value: r.velocity      || 0 },
      { label: 'Diversidade',  value: r.diversity     || 0 },
      { label: 'Popularidade', value: r.popularity    || 0 },
      { label: 'Colaboração',  value: r.collaboration || 0 }
    ];
  }

  setFormat(id: CardFormat) { this.selectedFormat = id; }
  setTheme(id: CardTheme)   { this.selectedTheme  = id; }

  async generateAndOpen() {
    this.isExporting = true;
    
    // ── WYSIWYG Approach: Capture the ACTIVE PREVIEW directly ───────
    // This ensures what the user sees is exactly what they get.
    const previewEl = this.scalerContain?.nativeElement;
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

      this.generatedImageUrl = await captureElementAsPngDataUrl(previewEl, {
        scale: captureScale,
        backgroundColor: this.theme.bg,
        imageTimeout: 15000,
      });
      this.showModal = true;
    } catch (err) {
      console.error('Falha ao gerar captura de alta fidelidade:', err);
    } finally {
      this.isExporting = false;
      this.cdr.markForCheck();
    }
  }

  async share(platform: string) {
    if (!this.generatedImageUrl) return;

    if (platform === 'download') {
      downloadDataUrl(this.generatedImageUrl, `dev-profile-${this.selectedFormat}.png`);
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

  getLangFill(lang: LanguageUsage): number {
    const langs = this.topFiveLangs;
    if (!langs.length) return 0;
    const max = Math.max(...langs.map(l => l.repositories ?? 0));
    return max > 0 ? ((lang.repositories ?? 0) / max) * 100 : 0;
  }
}
