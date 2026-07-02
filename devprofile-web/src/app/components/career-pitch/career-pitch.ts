import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../../models/profile.models';

@Component({
  selector: 'app-career-pitch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './career-pitch.html',
  styleUrls: ['./career-pitch.scss']
})
export class CareerPitch {
  profile = input<Profile | null>(null);

  copied = false;

  readonly pitch = computed(() => {
    const p = this.profile();
    if (!p) return '';

    const name       = p.name || p.username;
    const level      = p.analysis.seniorityLevel;
    const years      = p.analysis.experienceYears;
    const stack      = p.analysis.mainStack;
    const langs      = (p.analysis.topLanguages ?? []).slice(0, 3).map(l => l.name).join(', ');
    const commits    = p.stats?.totalCommits ?? 0;
    const stars      = p.stats?.totalStars ?? 0;
    const repos      = p.stats?.totalRepositories ?? 0;

    const yearsLabel = years === '0-2' ? 'menos de 2 anos' : `${years} anos`;
    const starsMention = stars > 0 ? ` e ${stars} estrela${stars !== 1 ? 's' : ''} recebidas` : '';

    return `${name} é um dev ${level} com ${yearsLabel} de experiência, ` +
      `especializado em ${stack} (${langs}). ` +
      `Acumulou ${commits.toLocaleString('pt-BR')} commits distribuídos em ${repos} repositórios públicos${starsMention}. ` +
      `Score de senioridade: ${p.analysis.seniorityScore}/100.`;
  });

  copy() {
    navigator.clipboard.writeText(this.pitch()).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}
