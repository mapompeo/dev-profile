import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StackBreakdown } from '../../models/profile.models';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
  offset: number;
  dashArray: string;
}

const CATEGORIES: (keyof StackBreakdown)[] = ['frontend', 'backend', 'devOps', 'mobile', 'data', 'scripts'];

// Escala categorica do design system (MASTER.md): sem cor inventada.
const PALETTE: Record<keyof StackBreakdown, string> = {
  frontend: 'var(--chart-1)',
  backend: 'var(--chart-2)',
  devOps: 'var(--chart-3)',
  mobile: 'var(--chart-4)',
  data: 'var(--chart-5)',
  scripts: 'var(--chart-6)'
};

const LABELS: Record<keyof StackBreakdown, string> = {
  frontend: 'Frontend',
  backend:  'Backend',
  devOps:   'DevOps',
  mobile:   'Mobile',
  data:     'Data',
  scripts:  'Scripts',
};

@Component({
  selector: 'app-chart-donut',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-donut.html',
  styleUrls: ['./chart-donut.scss']
})
export class ChartDonut {
  breakdown = input<StackBreakdown | null>(null);
  centerLabel = input('');

  readonly r = 70;
  readonly circumference = 2 * Math.PI * this.r;

  hoveredSlice: DonutSlice | null = null;

  readonly slices = computed<DonutSlice[]>(() => {
    const breakdown = this.breakdown();
    const values = CATEGORIES.map(c => breakdown?.[c] ?? 0);
    const total = values.reduce((a, b) => a + b, 0) || 1;

    let offset = 0;
    return CATEGORIES
      .map((cat, i) => {
        const pct = values[i] / total;
        const dash = pct * this.circumference;
        const slice: DonutSlice = {
          label:     LABELS[cat],
          value:     Math.round(values[i]),
          color:     PALETTE[cat],
          offset:    this.circumference - offset * this.circumference,
          dashArray: `${dash} ${this.circumference - dash}`,
        };
        offset += pct;
        return slice;
      })
      .filter(s => s.value > 0);
  });

  /** Descricao textual do grafico, exigida pelo checklist de acessibilidade. */
  readonly chartLabel = computed(() => {
    const parts = this.slices().map(s => `${s.label} ${s.value}%`);
    return parts.length ? 'Identidade tecnica: ' + parts.join(', ') : 'Sem dados de stack';
  });

  onHover(s: DonutSlice | null) {
    this.hoveredSlice = s;
  }
}
