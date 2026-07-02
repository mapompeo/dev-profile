import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RadarPoint { x: number; y: number; }

@Component({
  selector: 'app-chart-radar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-radar.html',
  styleUrls: ['./chart-radar.scss']
})
export class ChartRadar implements OnChanges {
  @Input() radar: any = {};

  readonly axes = [
    { key: 'consistency',   label: 'Consistência' },
    { key: 'diversity',     label: 'Diversidade' },
    { key: 'popularity',    label: 'Popularidade' },
    { key: 'structure',     label: 'Estrutura' },
    { key: 'collaboration', label: 'Colaboração' },
    { key: 'velocity',      label: 'Velocidade' },
  ];

  readonly cx = 200;
  readonly cy = 200;
  readonly r  = 160;
  readonly levels = [20, 40, 60, 80, 100];

  gridPolygons: string[] = [];
  dataPolygon  = '';
  axisLines: { x2: number; y2: number; label: string; lx: number; ly: number; value: number }[] = [];

  ngOnChanges(): void {
    this.build();
  }

  private angleOf(i: number): number {
    return (Math.PI * 2 * i) / this.axes.length - Math.PI / 2;
  }

  private point(pct: number, i: number): RadarPoint {
    const angle = this.angleOf(i);
    const rad   = (pct / 100) * this.r;
    return { x: this.cx + rad * Math.cos(angle), y: this.cy + rad * Math.sin(angle) };
  }

  private toPolygon(pct: number): string {
    return this.axes.map((_, i) => {
      const p = this.point(pct, i);
      return `${p.x},${p.y}`;
    }).join(' ');
  }

  private build() {
    this.gridPolygons = this.levels.map(l => this.toPolygon(l));

    const rawValues = this.axes.map(a => Math.min(100, Math.max(0, this.radar?.[a.key] ?? this.radar?.[a.key.charAt(0).toUpperCase() + a.key.slice(1)] ?? 0)));

    this.dataPolygon = this.axes.map((_, i) => {
      const p = this.point(rawValues[i], i);
      return `${p.x},${p.y}`;
    }).join(' ');

    this.axisLines = this.axes.map((a, i) => {
      const angle = this.angleOf(i);
      const outer = { x: this.cx + this.r * Math.cos(angle), y: this.cy + this.r * Math.sin(angle) };
      // label offset further out
      const lPad = 34;
      return {
        x2:   outer.x,
        y2:   outer.y,
        label: a.label,
        lx:   this.cx + (this.r + lPad) * Math.cos(angle),
        ly:   this.cy + (this.r + lPad) * Math.sin(angle),
        value: rawValues[i]
      };
    });
  }
}
