import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile, ProfileComparisonResult } from '../../models/profile.models';

interface CompareRow {
  label: string;
  left: string;
  right: string;
  /** Quem lidera a linha, quando a linha é comparável por número. */
  leader: 'left' | 'right' | 'tie';
  note?: string;
}

@Component({
  selector: 'app-profile-comparison',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-comparison.html',
  styleUrls: ['./profile-comparison.scss']
})
export class ProfileComparison {
  @Input({ required: true }) comparison!: ProfileComparisonResult;
  @Output() onBack = new EventEmitter<void>();
  @Output() onDownload = new EventEmitter<HTMLElement>();

  @ViewChild('dashboardElement') dashboardElement!: ElementRef<HTMLElement>;

  /** Linhas da tabela comparativa, no formato de um diff: mesma escala nos dois lados. */
  get rows(): CompareRow[] {
    const l = this.comparison.left;
    const r = this.comparison.right;

    return [
      this.numeric('Score de senioridade', l.analysis.seniorityScore, r.analysis.seniorityScore),
      this.text('Nível', l.analysis.seniorityLevel, r.analysis.seniorityLevel),
      this.numeric('Commits', l.stats.totalCommits, r.stats.totalCommits),
      this.numeric('Repositórios', l.stats.totalRepositories, r.stats.totalRepositories),
      this.numeric('Estrelas recebidas', l.stats.totalStars, r.stats.totalStars),
      this.numeric('Forks recebidos', l.stats.totalForks, r.stats.totalForks),
      this.numeric('Seguidores', l.stats.followers, r.stats.followers),
      this.text('Experiência', l.analysis.experienceYears, r.analysis.experienceYears),
      this.text('Stack principal', l.analysis.mainStack, r.analysis.mainStack),
      this.numeric('Linguagens usadas', l.analysis.languagesCount, r.analysis.languagesCount),
      this.numeric('Pontos', l.analysis.totalScore, r.analysis.totalScore)
    ];
  }

  /** Barra de proporção da linha: quanto cada lado ocupa do total. */
  share(row: CompareRow, side: 'left' | 'right'): number {
    const l = this.toNumber(row.left);
    const r = this.toNumber(row.right);
    const total = l + r;
    if (!total) return 50;
    return ((side === 'left' ? l : r) / total) * 100;
  }

  isNumericRow(row: CompareRow): boolean {
    return this.toNumber(row.left) > 0 || this.toNumber(row.right) > 0;
  }

  topLanguages(profile: Profile): string {
    return (profile.analysis.topLanguages ?? []).slice(0, 3).map(l => l.name).join(', ') || '—';
  }

  private numeric(label: string, left: number, right: number): CompareRow {
    return {
      label,
      left: (left ?? 0).toLocaleString('pt-BR'),
      right: (right ?? 0).toLocaleString('pt-BR'),
      leader: left === right ? 'tie' : left > right ? 'left' : 'right'
    };
  }

  private text(label: string, left: string, right: string): CompareRow {
    return { label, left: left || '—', right: right || '—', leader: 'tie' };
  }

  private toNumber(value: string): number {
    const parsed = Number(String(value).replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
