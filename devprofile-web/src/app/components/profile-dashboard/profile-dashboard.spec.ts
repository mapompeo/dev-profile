import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileDashboard } from './profile-dashboard';
import { fakeProfile } from '../../testing/profile.fixture';

describe('ProfileDashboard', () => {
  function criar(profile = fakeProfile()) {
    TestBed.configureTestingModule({
      imports: [ProfileDashboard],
      providers: [provideHttpClient()]
    });
    const fixture = TestBed.createComponent(ProfileDashboard);
    fixture.componentRef.setInput('profile', profile);
    fixture.detectChanges();
    return fixture;
  }

  describe('medidor de score', () => {
    it('acende uma célula a cada quatro pontos, com a de ponta parcial', () => {
      // 60 pontos em 25 células de 4 pontos: 15 cheias, nenhuma parcial.
      const { componentInstance: c } = criar();

      expect(c.cellState(0)).toBe('on');
      expect(c.cellState(14)).toBe('on');
      expect(c.cellState(15)).toBe('off');
      expect(c.cellState(24)).toBe('off');
    });

    it('marca a célula de ponta quando o score não fecha em quatro', () => {
      const perfil = fakeProfile();
      perfil.analysis = { ...perfil.analysis, seniorityScore: 47 };
      const { componentInstance: c } = criar(perfil);

      // 47 / 4 = 11,75: onze cheias e a décima segunda pela metade.
      expect(c.cellState(10)).toBe('on');
      expect(c.cellState(11)).toBe('tip');
      expect(c.cellState(12)).toBe('off');
    });

    it('perfil zerado não acende nada', () => {
      const perfil = fakeProfile();
      perfil.analysis = { ...perfil.analysis, seniorityScore: 0 };
      const { componentInstance: c } = criar(perfil);

      expect(c.cellState(0)).toBe('off');
    });
  });

  describe('nível de pontos', () => {
    it('sobe de nível a cada vez que a pontuação dobra', () => {
      const { componentInstance: c } = criar();

      // A virada acontece quando (1 + pontos/1000) cruza uma potência de dois:
      // 1.000, 3.000, 7.000, 15.000. Cada faixa é o dobro da anterior.
      expect(c.getLevel(0)).toBe(1);
      expect(c.getLevel(999)).toBe(1);
      expect(c.getLevel(1000)).toBe(2);
      expect(c.getLevel(2999)).toBe(2);
      expect(c.getLevel(3000)).toBe(3);
      expect(c.getLevel(7000)).toBe(4);
      expect(c.getLevel(15000)).toBe(5);
    });

    it('não estoura a escala em perfis gigantes', () => {
      const { componentInstance: c } = criar();

      // A fórmula antiga devolvia 3188 aqui, um número que não cabe na tela.
      expect(c.getLevel(3_187_774)).toBe(12);
    });
  });

  describe('composição de linguagens', () => {
    it('o que sobra das cinco primeiras vira o segmento "outras"', () => {
      const { componentInstance: c } = criar();

      // 33,33 + 28,57 + 9,52 + 9,52 + 4,76 = 85,7
      expect(c.otherLangsPercent).toBeCloseTo(14.3, 1);
    });

    it('sem sobra, não existe segmento extra', () => {
      const perfil = fakeProfile();
      perfil.analysis = {
        ...perfil.analysis,
        topLanguages: [{ name: 'C#', percentage: 100, repositories: 10 }]
      };
      const { componentInstance: c } = criar(perfil);

      expect(c.otherLangsPercent).toBe(0);
    });

    it('descreve a composição para quem usa leitor de tela', () => {
      const { componentInstance: c } = criar();

      expect(c.langBarLabel).toContain('JavaScript 33.33%');
      expect(c.langBarLabel).toContain('outras');
    });
  });

  it('a contagem termina no score do perfil', async () => {
    const fixture = criar();
    await new Promise(r => setTimeout(r, 600));

    expect(fixture.componentInstance.displayScore()).toBe(60);
  });
});
