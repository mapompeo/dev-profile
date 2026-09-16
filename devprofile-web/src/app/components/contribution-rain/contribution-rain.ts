import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributionDay } from '../../models/profile.models';

/** Uma coluna da chuva: uma fatia do calendário caindo na vertical. */
interface Column {
  x: number;
  y: number;
  speed: number;
  levels: number[];
}

const CELL = 12;
const GAP = 4;
const STEP = CELL + GAP;

@Component({
  selector: 'app-contribution-rain',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contribution-rain.html',
  styleUrls: ['./contribution-rain.scss']
})
export class ContributionRain implements AfterViewInit, OnChanges, OnDestroy {
  /** Dias do calendário do perfil. Sem dias, o componente não desenha nada. */
  @Input() days: ContributionDay[] = [];

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private columns: Column[] = [];
  private frame = 0;
  private colors: string[] = [];
  private resizeObserver?: ResizeObserver;
  private readonly onVisibility = () => this.syncLoop();

  ngAfterViewInit(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');
    this.resizeObserver = new ResizeObserver(() => this.layout());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.layout();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['days'] && this.ctx) {
      this.layout();
    }
  }

  ngOnDestroy(): void {
    this.stop();
    this.resizeObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /** Só anima onde faz sentido: com dados, com movimento permitido e com mouse. */
  private get shouldAnimate(): boolean {
    if (!this.days.length) return false;
    if (typeof matchMedia !== 'function') return false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    // Em telas de toque o custo de uma animação contínua sai da bateria de quem
    // está olhando, então lá a grade fica parada.
    if (matchMedia('(pointer: coarse)').matches) return false;
    return true;
  }

  private layout(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;

    const box = (canvas.parentElement ?? canvas).getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(box.width * dpr));
    canvas.height = Math.max(1, Math.floor(box.height * dpr));
    canvas.style.width = `${box.width}px`;
    canvas.style.height = `${box.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.readColors();
    this.buildColumns(box.width, box.height);
    this.draw();
    this.syncLoop();
  }

  /** As cores saem dos tokens do tema, então a chuva acompanha light e dark. */
  private readColors(): void {
    const styles = getComputedStyle(document.documentElement);
    this.colors = [1, 2, 3, 4].map(level => styles.getPropertyValue(`--grid-${level}`).trim() || '#2ea043');
  }

  private buildColumns(width: number, height: number): void {
    const levels = this.days.map(d => d.level);
    if (!levels.length) {
      this.columns = [];
      return;
    }

    const count = Math.ceil(width / STEP) + 1;
    const perColumn = Math.ceil(height / STEP) + 6;
    this.columns = [];

    for (let i = 0; i < count; i++) {
      // Cada coluna começa em um ponto diferente do calendário: a chuva é sempre
      // o histórico real da pessoa, nunca um padrão aleatório.
      const offset = (i * 7) % levels.length;
      const slice: number[] = [];
      for (let j = 0; j < perColumn; j++) {
        slice.push(levels[(offset + j) % levels.length]);
      }

      this.columns.push({
        x: i * STEP,
        y: -((i * 37) % (perColumn * STEP)),
        speed: 8 + ((i * 13) % 14),
        levels: slice
      });
    }
  }

  private draw(): void {
    const canvas = this.canvasRef?.nativeElement;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;

    const width = canvas.width / (Math.min(2, window.devicePixelRatio || 1));
    const height = canvas.height / (Math.min(2, window.devicePixelRatio || 1));
    ctx.clearRect(0, 0, width, height);

    for (const column of this.columns) {
      for (let j = 0; j < column.levels.length; j++) {
        const level = column.levels[j];
        if (level <= 0) continue;

        const y = column.y + j * STEP;
        if (y < -STEP || y > height) continue;

        // A cabeça da coluna é mais viva que a cauda: dá a leitura de queda sem
        // precisar de rastro desenhado.
        const fade = 1 - Math.min(1, j / column.levels.length);
        ctx.globalAlpha = 0.25 + fade * 0.75;
        ctx.fillStyle = this.colors[level - 1] ?? this.colors[0];
        ctx.fillRect(column.x, y, CELL, CELL);
      }
    }

    ctx.globalAlpha = 1;
  }

  private tick = (): void => {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const height = canvas.height / Math.min(2, window.devicePixelRatio || 1);
    for (const column of this.columns) {
      column.y += column.speed / 60;
      if (column.y > height) {
        column.y = -column.levels.length * STEP;
      }
    }

    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  private syncLoop(): void {
    const podeAnimar = this.shouldAnimate && document.visibilityState === 'visible';
    if (podeAnimar && !this.frame) {
      this.frame = requestAnimationFrame(this.tick);
    } else if (!podeAnimar) {
      this.stop();
    }
  }

  private stop(): void {
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }
}
