import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile, LanguageUsage } from '../../models/profile.models';
import { captureElementAsPngDataUrl, downloadDataUrl } from '../../utils/image-export';
import { langColor } from '../../utils/lang-colors';
import { revealOnce } from '../../utils/reveal-on-scroll';

/** Usado quando o app roda em máquina local: link de localhost não serve para ninguém. */
const PUBLIC_ORIGIN = 'https://dev-profile-one.vercel.app';

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
export class CardGenerator implements AfterViewInit, OnDestroy {
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
  selectedTheme: CardTheme = 'dark';

  /** Verdadeiro enquanto a imagem está sendo desenhada. */
  isExporting = false;

  /** PNG pronto do card, no formato e tema atuais. */
  generatedImageUrl: string | null = null;

  private stopWatching?: () => void;

  get format(): FormatConfig {
    return this.formats.find(f => f.id === this.selectedFormat)!;
  }

  get theme(): ThemeConfig {
    return this.themes.find(t => t.id === this.selectedTheme)!;
  }

  /**
   * O selo mostra o mesmo nível que o rodapé e o painel.
   *
   * Antes havia uma segunda escala só para ele ("Líder Técnico", "Arquiteto do
   * GitHub"), com faixas próprias: um perfil de score 61 saía com o selo de
   * Líder Técnico e o rodapé dizendo Pleno, na mesma imagem. Uma escala só.
   */
  get badgeTitle(): string {
    return this.profile.analysis.seniorityLevel;
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

  ngAfterViewInit(): void {
    const frame = this.scalerContain?.nativeElement;
    if (!frame) return;

    // A imagem fica pronta sem ninguém pedir, assim que o bloco entra na tela.
    // Isso tira uma etapa do caminho e, no celular, mantém o compartilhamento
    // nativo dentro do toque do usuário, que é condição para a folha abrir.
    // Fora do ciclo atual de renderização: mudar `isExporting` durante o próprio
    // AfterViewInit faria o Angular reclamar de valor alterado após a checagem.
    this.stopWatching = revealOnce(frame, () => setTimeout(() => void this.prepareImage(), 0));
  }

  ngOnDestroy(): void {
    this.stopWatching?.();
  }

  setFormat(id: CardFormat): void {
    if (this.selectedFormat === id) return;
    this.selectedFormat = id;
    void this.prepareImage();
  }

  setTheme(id: CardTheme): void {
    if (this.selectedTheme === id) return;
    this.selectedTheme = id;
    void this.prepareImage();
  }

  /** Desenha o card no formato e tema atuais. Silencioso: é trabalho de bastidor. */
  private async prepareImage(): Promise<void> {
    const previewEl = this.scalerContain?.nativeElement;
    if (!previewEl || this.isExporting) return;

    // Sem largura não há o que capturar: acontece em ambiente de teste e quando
    // o bloco ainda não foi disposto na tela.
    if (previewEl.getBoundingClientRect().width < 1) return;

    this.isExporting = true;
    this.generatedImageUrl = null;
    this.cdr.markForCheck();

    try {
      // Um quadro para o novo formato ou tema assentar antes da captura.
      await new Promise(r => setTimeout(r, 250));

      const rect = previewEl.getBoundingClientRect();
      const captureScale = (1080 / rect.width) * window.devicePixelRatio;

      this.generatedImageUrl = await captureElementAsPngDataUrl(previewEl, {
        scale: captureScale,
        backgroundColor: this.theme.bg,
        imageTimeout: 15000
      });
    } catch (err) {
      console.error('Falha ao gerar o card:', err);
    } finally {
      this.isExporting = false;
      this.cdr.markForCheck();
    }
  }

  get shareUrl(): string {
    const { origin, pathname } = window.location;
    const ehLocal = /^https?:\/\/(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.|\[::1\])/.test(origin);
    return (ehLocal ? PUBLIC_ORIGIN : origin) + pathname;
  }

  /** Texto do compartilhamento, com os números do perfil em vez de uma frase genérica. */
  get shareText(): string {
    const nome = this.profile.name || this.profile.username;
    const commits = (this.profile.stats.totalCommits ?? 0).toLocaleString('pt-BR');
    const repos = this.profile.stats.totalRepositories ?? 0;
    const analise = this.profile.analysis;

    return (
      `${nome} tem score ${analise.seniorityScore}/100 no DevProfile, nível ${analise.seniorityLevel}. ` +
      `${commits} commits em ${repos} repositórios, stack ${analise.mainStack}.`
    );
  }

  /** O aparelho sabe compartilhar arquivo? Só então o botão nativo faz sentido. */
  get canShareImage(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && typeof navigator.share === 'function';
  }

  async share(platform: string) {
    // Quem clicar antes de a imagem ficar pronta espera por ela, em vez de
    // receber um clique morto.
    if (!this.generatedImageUrl) {
      await this.prepareImage();
    }
    if (!this.generatedImageUrl) return;

    if (platform === 'download') {
      downloadDataUrl(this.generatedImageUrl, `devprofile-${this.profile.username}-${this.selectedFormat}.png`);
      return;
    }

    if (platform === 'native') {
      await this.shareImage();
      return;
    }

    const texto = encodeURIComponent(`${this.shareText} ${this.shareUrl}`);
    const url = encodeURIComponent(this.shareUrl);

    const shareLinks: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.shareText)}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://api.whatsapp.com/send?text=${texto}`
    };

    if (shareLinks[platform]) {
      window.open(shareLinks[platform], '_blank');
    }
  }

  /**
   * Compartilhamento nativo com a imagem anexada: é assim que o card chega
   * inteiro no WhatsApp, no Instagram ou no Telegram. O link vai dentro do
   * texto, e não no campo `url`, porque a maioria dos aplicativos descarta esse
   * campo quando há arquivo junto.
   */
  private async shareImage(): Promise<void> {
    if (!this.generatedImageUrl) return;

    try {
      const blob = await (await fetch(this.generatedImageUrl)).blob();
      const arquivo = new File([blob], `devprofile-${this.profile.username}.png`, { type: 'image/png' });

      if (!navigator.canShare?.({ files: [arquivo] })) {
        // O aparelho compartilha texto, mas não arquivo: melhor mandar o texto
        // do que abrir uma folha vazia.
        await navigator.share({ text: `${this.shareText} ${this.shareUrl}` });
        return;
      }

      await navigator.share({
        files: [arquivo],
        title: `DevProfile de ${this.profile.name || this.profile.username}`,
        text: `${this.shareText} ${this.shareUrl}`
      });
    } catch (err) {
      // Cancelar a folha de compartilhamento cai aqui e não é erro.
      if ((err as DOMException)?.name !== 'AbortError') {
        console.error('Falha ao compartilhar a imagem:', err);
      }
    }
  }

  getLangFill(lang: LanguageUsage): number {
    const langs = this.topFiveLangs;
    if (!langs.length) return 0;
    const max = Math.max(...langs.map(l => l.repositories ?? 0));
    return max > 0 ? ((lang.repositories ?? 0) / max) * 100 : 0;
  }
}
