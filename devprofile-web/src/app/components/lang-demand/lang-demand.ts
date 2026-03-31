import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DemandEntry {
  lang: string;
  demand: 'Alta' | 'Média' | 'Baixa';
  growth: string;
}

@Component({
  selector: 'app-lang-demand',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang-demand.html',
  styleUrls: ['./lang-demand.scss']
})
export class LangDemand implements OnChanges {
  @Input() topLanguages: any[] = [];

  rows: (DemandEntry & { inProfile: boolean, percentage: number })[] = [];

  // Static market demand table (Brazilian job market 2024–2025)
  private readonly demandTable: DemandEntry[] = [
    { lang: 'JavaScript',   demand: 'Alta',  growth: '+12%' },
    { lang: 'TypeScript',   demand: 'Alta',  growth: '+28%' },
    { lang: 'Python',       demand: 'Alta',  growth: '+18%' },
    { lang: 'Java',         demand: 'Alta',  growth: '+5%'  },
    { lang: 'C#',           demand: 'Alta',  growth: '+8%'  },
    { lang: 'Go',           demand: 'Alta',  growth: '+32%' },
    { lang: 'Rust',         demand: 'Alta',  growth: '+45%' },
    { lang: 'Kotlin',       demand: 'Alta',  growth: '+15%' },
    { lang: 'Swift',        demand: 'Média', growth: '+6%'  },
    { lang: 'PHP',          demand: 'Média', growth: '-3%'  },
    { lang: 'Ruby',         demand: 'Média', growth: '-8%'  },
    { lang: 'Dart',         demand: 'Média', growth: '+20%' },
    { lang: 'HTML',         demand: 'Alta',  growth: '+3%'  },
    { lang: 'CSS',          demand: 'Alta',  growth: '+3%'  },
    { lang: 'Shell',        demand: 'Média', growth: '+10%' },
    { lang: 'C',            demand: 'Média', growth: '-5%'  },
    { lang: 'C++',          demand: 'Média', growth: '-2%'  },
    { lang: 'R',            demand: 'Baixa', growth: '+2%'  },
    { lang: 'Lua',          demand: 'Baixa', growth: '+5%'  },
    { lang: 'Perl',         demand: 'Baixa', growth: '-15%' },
  ];

  ngOnChanges(): void {
    this.build();
  }

  private build() {
    if (!this.topLanguages?.length) return;

    const myLangs = new Map<string, number>(
      this.topLanguages.map((l: any) => [l.name, l.percentage ?? 0])
    );

    // Show langs in my profile first, then relevant market langs I don't have
    const merged = [
      ...this.demandTable.filter(d => myLangs.has(d.lang)),
      ...this.demandTable.filter(d => !myLangs.has(d.lang) && d.demand === 'Alta').slice(0, 3),
    ].slice(0, 10);

    this.rows = merged.map(d => ({
      ...d,
      inProfile:  myLangs.has(d.lang),
      percentage: myLangs.get(d.lang) ?? 0
    }));
  }

  demandColor(demand: string) {
    return demand === 'Alta'  ? '#34d399' :
           demand === 'Média' ? '#fbbf24' : '#f87171';
  }
}
