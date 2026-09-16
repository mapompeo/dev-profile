import { TestBed } from '@angular/core/testing';
import { ProfileComparison } from './profile-comparison';
import { fakeComparison } from '../../testing/profile.fixture';

describe('ProfileComparison', () => {
  function criar() {
    TestBed.configureTestingModule({ imports: [ProfileComparison] });
    const fixture = TestBed.createComponent(ProfileComparison);
    fixture.componentRef.setInput('comparison', fakeComparison());
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('compara os mesmos sinais dos dois lados, na mesma ordem', () => {
    const c = criar();
    const rotulos = c.rows.map(r => r.label);

    expect(rotulos[0]).toBe('Score de senioridade');
    expect(rotulos).toContain('Commits');
    expect(rotulos).toContain('Estrelas recebidas');
    expect(new Set(rotulos).size).toBe(rotulos.length);
  });

  it('aponta quem lidera cada linha numérica', () => {
    const c = criar();
    const score = c.rows.find(r => r.label === 'Score de senioridade')!;
    const repos = c.rows.find(r => r.label === 'Repositórios')!;

    expect(score.leader).toBe('right');
    expect(repos.leader).toBe('right');
  });

  it('linha de texto não elege vencedor', () => {
    const c = criar();
    const nivel = c.rows.find(r => r.label === 'Nível')!;

    expect(nivel.leader).toBe('tie');
    expect(nivel.left).toBe('Pleno');
    expect(nivel.right).toBe('Senior');
  });

  it('formata número grande com separador de milhar', () => {
    const c = criar();
    const estrelas = c.rows.find(r => r.label === 'Estrelas recebidas')!;

    expect(estrelas.right).toBe('47.461');
  });

  it('a barra divide o espaço na proporção dos dois valores', () => {
    const c = criar();
    const commits = c.rows.find(r => r.label === 'Commits')!;

    const esquerda = c.share(commits, 'left');
    const direita = c.share(commits, 'right');

    expect(esquerda + direita).toBeCloseTo(100, 5);
    expect(direita).toBeGreaterThan(esquerda);
  });

  it('empate em zero divide a barra ao meio em vez de dividir por zero', () => {
    const c = criar();
    const linha = { label: 'x', left: '0', right: '0', leader: 'tie' as const };

    expect(c.share(linha, 'left')).toBe(50);
    expect(c.isNumericRow(linha)).toBe(false);
  });

  it('lista as três principais linguagens de cada perfil', () => {
    const c = criar();

    expect(c.topLanguages(c.comparison.left)).toBe('JavaScript, C#, C++');
  });
});
