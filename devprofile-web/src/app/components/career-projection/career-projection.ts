import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScoreAnalysis, ProfileStats } from '../../models/profile.models';

interface Milestone {
  title: string;
  timeLabel: string;
  description: string;
  reached: boolean;
}

interface ProjectionState {
  rhythm: string;
  suggestion: string;
  milestones: Milestone[];
}

function humanTime(months: number): string {
  if (months < 1)   return 'este mês';
  if (months === 1) return '1 mês';
  if (months < 12)  return `${months} meses`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} ano${y > 1 ? 's' : ''} e ${m} meses` : `${y} ano${y > 1 ? 's' : ''}`;
}

@Component({
  selector: 'app-career-projection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './career-projection.html',
  styleUrls: ['./career-projection.scss']
})
export class CareerProjection {
  analysis = input<ScoreAnalysis | null>(null);
  stats = input<ProfileStats | null>(null);

  readonly projection = computed<ProjectionState>(() => {
    const analysis = this.analysis();
    if (!analysis) return { rhythm: '', suggestion: '', milestones: [] };

    const score   = analysis.seniorityScore ?? 0;
    const commits = this.stats()?.totalCommits ?? 0;
    const langs   = analysis.languagesCount ?? 0;

    // Commits per month estimate
    const yearsStr = analysis.experienceYears ?? '0-2';
    const yearsNum  = yearsStr === '0-2' ? 1 : yearsStr === '3-5' ? 4 : 6;
    const cpm       = commits / Math.max(1, yearsNum * 12);
    const monthsToSenior  = Math.max(1, Math.round((65  - score) / (cpm / 30 + 0.3)));
    const monthsToLead    = Math.max(1, Math.round((85  - score) / (cpm / 30 + 0.2)));

    let rhythm: string;
    if (cpm >= 20)       rhythm = 'Acelerado';
    else if (cpm >= 10)  rhythm = 'Consistente';
    else if (cpm >= 5)   rhythm = 'Moderado';
    else                 rhythm = 'Esporádico';

    const suggestion = langs < 4
      ? 'Diversificar linguagens pode acelerar sua progressão'
      : score < 50
      ? 'Aumentar consistência de commits acelera seu crescimento'
      : 'Contribua para projetos open source para ganhar visibilidade';

    const levels: { title: string; threshold: number; desc: string }[] = [
      { title: 'Júnior',    threshold: 0,  desc: 'Aprendendo fundamentos' },
      { title: 'Pleno',     threshold: 35, desc: 'Produtividade autônoma' },
      { title: 'Sênior',    threshold: 65, desc: 'Liderança técnica' },
      { title: 'Tech Lead', threshold: 85, desc: 'Arquitetura e mentoria' },
    ];

    const milestones = levels.map((l, i) => {
      const reached = score >= l.threshold;
      let timeLabel: string;
      if (reached) {
        timeLabel = 'Atingido';
      } else if (i === 2) {
        timeLabel = `~${humanTime(monthsToSenior)}`;
      } else {
        timeLabel = `~${humanTime(monthsToLead)}`;
      }
      return { title: l.title, timeLabel, description: l.desc, reached };
    });

    return { rhythm, suggestion, milestones };
  });
}
