import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountUpDirective } from '../../directives/count-up.directive';
import { GrowInDirective } from '../../directives/grow-in.directive';
import { RevealDirective } from '../../directives/reveal.directive';
import { CardGenerator } from '../card-generator/card-generator';
import { ChartRadar } from '../chart-radar/chart-radar';
import { ChartDonut } from '../chart-donut/chart-donut';
import { CareerPitch } from '../career-pitch/career-pitch';
import { LangDemand } from '../lang-demand/lang-demand';
import { CareerProjection } from '../career-projection/career-projection';
import { Profile } from '../../models/profile.models';
import { langColor } from '../../utils/lang-colors';
import { countUp } from '../../utils/count-up';
import { ENTER_STAGGER, shouldAnimateEntrance } from '../../utils/enter-animation';

/** 25 células de 4 pontos cada: a grade de contribuições virada de lado. */
const METER_CELLS = 25;

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [CommonModule, CountUpDirective, GrowInDirective, RevealDirective, CardGenerator, ChartRadar, ChartDonut, CareerPitch, LangDemand, CareerProjection],
  templateUrl: './profile-dashboard.html',
  styleUrls: ['./profile-dashboard.scss']
})
export class ProfileDashboard implements OnChanges, OnDestroy {
  @Input({ required: true }) profile!: Profile;
  @Output() onBack = new EventEmitter<void>();
  @Output() onDownload = new EventEmitter<HTMLElement>();

  @ViewChild('dashboardElement') dashboardElement!: ElementRef<HTMLElement>;

  readonly meterCells = Array.from({ length: METER_CELLS }, (_, i) => i);
  readonly langColor = langColor;

  // Signal: a contagem roda em requestAnimationFrame e o app nao usa zone.js.
  readonly displayScore = signal(0);
  private stopCount: (() => void) | undefined;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile']) {
      this.startCount();
    }
  }

  ngOnDestroy(): void {
    this.stopCount?.();
  }

  /** Estado de cada célula do medidor: cheia, a de ponta, ou vazia. */
  cellState(index: number): 'on' | 'tip' | 'off' {
    const filled = (this.profile?.analysis?.seniorityScore ?? 0) / (100 / METER_CELLS);
    if (index < Math.floor(filled)) return 'on';
    if (index === Math.floor(filled) && filled % 1 > 0) return 'tip';
    return 'off';
  }

  /** As cinco primeiras raramente somam 100%: o resto vira um segmento neutro,
   *  para a barra fechar como a barra de linguagens de um repositorio. */
  get otherLangsPercent(): number {
    const top = this.profile?.analysis?.topLanguages?.slice(0, 5) ?? [];
    const sum = top.reduce((total, lang) => total + (lang.percentage ?? 0), 0);
    return Math.max(0, Math.round((100 - sum) * 100) / 100);
  }

  /**
   * As células do medidor acendem uma depois da outra, acompanhando a contagem
   * do número. O atraso é proporcional à posição, e o teto é a duração da
   * própria contagem: o medidor termina de encher junto com o score.
   */
  cellDelay(index: number): string {
    if (!shouldAnimateEntrance()) return '0ms';
    const preenchidas = Math.max(1, (this.profile?.analysis?.seniorityScore ?? 0) / (100 / METER_CELLS));
    return `${Math.round((index / preenchidas) * (METER_CELLS * ENTER_STAGGER) * 0.05)}ms`;
  }

  get langBarLabel(): string {
    const langs = this.profile?.analysis?.topLanguages?.slice(0, 5) ?? [];
    const parts = langs.map(l => `${l.name} ${l.percentage}%`);
    if (this.otherLangsPercent > 0) parts.push(`outras ${this.otherLangsPercent}%`);
    return 'Composição de linguagens: ' + parts.join(', ');
  }

  /**
   * Nível em escala logarítmica. A regra anterior era um ponto a cada mil, o que
   * dava "nível 3188" para um perfil grande: um número que não diz nada e some
   * do lado do próprio total. Dobrando a pontuação sobe um nível, então a escala
   * cabe na tela e continua fazendo sentido de ponta a ponta.
   */
  getLevel(score: number): number {
    if (!score || score < 0) return 1;
    return 1 + Math.floor(Math.log2(1 + score / 1000));
  }

  private startCount(): void {
    this.stopCount?.();
    this.displayScore.set(0);
    this.stopCount = countUp(this.profile?.analysis?.seniorityScore ?? 0, value => this.displayScore.set(value));
  }
}
