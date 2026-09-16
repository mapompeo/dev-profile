import { TestBed } from '@angular/core/testing';
import { CardGenerator } from './card-generator';
import { fakeProfile } from '../../testing/profile.fixture';

describe('CardGenerator', () => {
  function criar(profile = fakeProfile()) {
    // Alguns testes comparam dois perfis diferentes, e o TestBed não aceita ser
    // reconfigurado depois de instanciado.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [CardGenerator] });
    const fixture = TestBed.createComponent(CardGenerator);
    fixture.componentRef.setInput('profile', profile);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('o card sai nos dois formatos que as redes usam', () => {
    const c = criar();

    expect(c.formats.map(f => f.id)).toEqual(['post', 'story']);
    expect(c.formats.every(f => f.width === 1080)).toBe(true);
    expect(c.format.aspect).toBe('1/1');

    c.setFormat('story');
    expect(c.format.aspect).toBe('9/16');
    expect(c.format.height).toBe(1920);
  });

  it('os temas do card são os mesmos três do app', () => {
    const c = criar();

    expect(c.themes.map(t => t.id)).toEqual(['dark', 'light', 'dimmed']);

    c.setTheme('light');
    expect(c.theme.bg).toBe('#ffffff');
  });

  it('o título do selo acompanha a faixa de score', () => {
    const baixo = fakeProfile();
    baixo.analysis = { ...baixo.analysis, seniorityScore: 20 };
    expect(criar(baixo).badgeTitle).toBe('Desenvolvedor Altamente Ativo');

    const alto = fakeProfile();
    alto.analysis = { ...alto.analysis, seniorityScore: 85 };
    expect(criar(alto).badgeTitle).toBe('Arquiteto do GitHub');
  });

  it('o valor sai formatado como moeda brasileira', () => {
    const c = criar();

    expect(c.formattedWorth).toContain('11.200,00');
    expect(c.formattedWorth).toMatch(/^R\$/);
  });

  it('a barra de linguagens do card fecha em 100%', () => {
    const c = criar();
    const soma = c.topFiveLangs.reduce((total, l) => total + l.percentage, 0);

    expect(soma + c.otherLangsPercent).toBeCloseTo(100, 1);
  });

  it('descreve a composição para leitor de tela', () => {
    const c = criar();

    expect(c.langBarLabel).toContain('JavaScript');
    expect(c.langBarLabel).toContain('%');
  });

  it('começa sem diálogo aberto e sem imagem gerada', () => {
    const c = criar();

    expect(c.showModal).toBe(false);
    expect(c.generatedImageUrl).toBeNull();
    expect(c.isExporting).toBe(false);
  });
});
