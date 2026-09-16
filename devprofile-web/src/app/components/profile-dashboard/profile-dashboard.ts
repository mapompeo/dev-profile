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
import { CardGenerator } from '../card-generator/card-generator';
import { ChartRadar } from '../chart-radar/chart-radar';
import { ChartDonut } from '../chart-donut/chart-donut';
import { CareerPitch } from '../career-pitch/career-pitch';
import { LangDemand } from '../lang-demand/lang-demand';
import { CareerProjection } from '../career-projection/career-projection';
import { Profile } from '../../models/profile.models';
import { langColor } from '../../utils/lang-colors';
import { countUp } from '../../utils/count-up';

/** 25 células de 4 pontos cada: a grade de contribuições virada de lado. */
const METER_CELLS = 25;

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [CommonModule, CardGenerator, ChartRadar, ChartDonut, CareerPitch, LangDemand, CareerProjection],
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

  get langBarLabel(): string {
    const langs = this.profile?.analysis?.topLanguages?.slice(0, 5) ?? [];
    const parts = langs.map(l => `${l.name} ${l.percentage}%`);
    if (this.otherLangsPercent > 0) parts.push(`outras ${this.otherLangsPercent}%`);
    return 'Composição de linguagens: ' + parts.join(', ');
  }

  getLevel(score: number): number {
    if (!score) return 1;
    return Math.floor(score / 1000) + 1;
  }

  private startCount(): void {
    this.stopCount?.();
    this.displayScore.set(0);
    this.stopCount = countUp(this.profile?.analysis?.seniorityScore ?? 0, value => this.displayScore.set(value));
  }
}
