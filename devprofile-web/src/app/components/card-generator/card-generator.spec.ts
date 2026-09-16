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

  it('o selo mostra o mesmo nível do rodapé, sem escala paralela', () => {
    // Havia duas escalas na mesma imagem: um perfil de score 61 saía com selo de
    // "Líder Técnico" e rodapé dizendo "Pleno".
    expect(criar().badgeTitle).toBe('Pleno');

    const senior = fakeProfile();
    senior.analysis = { ...senior.analysis, seniorityScore: 85, seniorityLevel: 'Senior' };
    expect(criar(senior).badgeTitle).toBe('Senior');
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

  it('começa sem imagem pronta: ela é preparada quando o bloco aparece', () => {
    const c = criar();

    expect(c.generatedImageUrl).toBeNull();
    expect(c.isExporting).toBe(false);
  });

  it('o texto de compartilhamento leva os números do perfil, não uma frase genérica', () => {
    const c = criar();

    expect(c.shareText).toContain('Dev da Silva');
    expect(c.shareText).toContain('60/100');
    expect(c.shareText).toContain('1.060 commits');
    expect(c.shareText).toContain('22 repositórios');
  });

  it('o link compartilhado aponta para o site, mesmo rodando em máquina local', () => {
    const c = criar();

    // O teste roda em localhost: sem a troca, o link levaria para a máquina de
    // quem compartilhou, e não abriria para mais ninguém.
    expect(c.shareUrl.startsWith('https://dev-profile-one.vercel.app')).toBe(true);
    expect(c.shareUrl).not.toContain('localhost');
  });
});
