import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
  offset: number;
  dashArray: string;
}

@Component({
  selector: 'app-chart-donut',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-donut.html',
  styleUrls: ['./chart-donut.scss']
})
export class ChartDonut implements OnChanges {
  @Input() breakdown: any = {};
  @Input() centerLabel = '';

  readonly r = 70;
  readonly circumference = 2 * Math.PI * this.r;

  slices: DonutSlice[] = [];
  hoveredSlice: DonutSlice | null = null;

  private readonly palette: Record<string, string> = {
    Frontend: '#a78bfa',
    Backend:  '#60a5fa',
    DevOps:   '#34d399',
    Mobile:   '#fb923c',
    Data:     '#f472b6',
    Scripts:  '#94a3b8',
  };

  ngOnChanges(): void {
    this.build();
  }

  private build() {
    const categories = ['Frontend', 'Backend', 'DevOps', 'Mobile', 'Data', 'Scripts'];
    const values = categories.map(c => (this.breakdown?.[c] ?? this.breakdown?.[c.toLowerCase()] ?? 0) as number);
    const total = values.reduce((a, b) => a + b, 0) || 1;

    let offset = 0;
    this.slices = categories
      .map((cat, i) => {
        const pct = values[i] / total;
        const dash = pct * this.circumference;
        const slice: DonutSlice = {
          label:     cat,
          value:     Math.round(values[i]),
          color:     this.palette[cat],
          offset:    this.circumference - offset * this.circumference,
          dashArray: `${dash} ${this.circumference - dash}`,
        };
        offset += pct;
        return slice;
      })
      .filter(s => s.value > 0);
  }

  onHover(s: DonutSlice | null) {
    this.hoveredSlice = s;
  }
}
