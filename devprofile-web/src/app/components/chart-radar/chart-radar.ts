import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompetenceRadar } from '../../models/profile.models';

interface RadarPoint { x: number; y: number; }
interface AxisLine { x2: number; y2: number; label: string; lx: number; ly: number; value: number; }

const AXES: { key: keyof CompetenceRadar; label: string }[] = [
  { key: 'consistency',   label: 'Consistência' },
  { key: 'diversity',     label: 'Diversidade' },
  { key: 'popularity',    label: 'Popularidade' },
  { key: 'structure',     label: 'Estrutura' },
  { key: 'collaboration', label: 'Colaboração' },
  { key: 'velocity',      label: 'Velocidade' },
];

const CX = 200;
const CY = 200;
const RADIUS = 160;
const LEVELS = [20, 40, 60, 80, 100];

function angleOf(i: number): number {
  return (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
}

function point(pct: number, i: number): RadarPoint {
  const angle = angleOf(i);
  const rad = (pct / 100) * RADIUS;
  return { x: CX + rad * Math.cos(angle), y: CY + rad * Math.sin(angle) };
}

function toPolygon(pct: number): string {
  return AXES.map((_, i) => {
    const p = point(pct, i);
    return `${p.x},${p.y}`;
  }).join(' ');
}

@Component({
  selector: 'app-chart-radar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-radar.html',
  styleUrls: ['./chart-radar.scss']
})
export class ChartRadar {
  radar = input<CompetenceRadar | null>(null);

  readonly axes = AXES;
  readonly cx = CX;
  readonly cy = CY;
  readonly r = RADIUS;
  readonly levels = LEVELS;

  readonly gridPolygons = LEVELS.map(l => toPolygon(l));

  private readonly rawValues = computed(() => {
    const radar = this.radar();
    return AXES.map(a => Math.min(100, Math.max(0, radar?.[a.key] ?? 0)));
  });

  readonly dataPolygon = computed(() => {
    const values = this.rawValues();
    return AXES.map((_, i) => {
      const p = point(values[i], i);
      return `${p.x},${p.y}`;
    }).join(' ');
  });

  readonly axisLines = computed<AxisLine[]>(() => {
    const values = this.rawValues();
    return AXES.map((a, i) => {
      const angle = angleOf(i);
      const outer = { x: CX + RADIUS * Math.cos(angle), y: CY + RADIUS * Math.sin(angle) };
      const lPad = 34; // label offset further out
      return {
        x2: outer.x,
        y2: outer.y,
        label: a.label,
        lx: CX + (RADIUS + lPad) * Math.cos(angle),
        ly: CY + (RADIUS + lPad) * Math.sin(angle),
        value: values[i]
      };
    });
  });
}
