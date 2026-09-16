import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CountUpDirective } from './count-up.directive';
import { GrowInDirective } from './grow-in.directive';
import { RevealDirective } from './reveal.directive';
import { revealOnce } from '../utils/reveal-on-scroll';

/**
 * A entrada acompanha a rolagem: o que está abaixo da dobra fica parado até
 * chegar na tela. Estes testes controlam o IntersectionObserver na mão, porque
 * é a única forma de afirmar "antes de aparecer" e "depois de aparecer" sem
 * depender de rolagem real.
 */
describe('entrada conforme a rolagem', () => {
  let observers: { callback: IntersectionObserverCallback; target?: Element; disconnected: boolean }[];

  /** Faz o elemento observado "entrar na tela". */
  function entrarNaTela(): void {
    for (const o of observers) {
      if (o.disconnected) continue;
      o.callback([{ isIntersecting: true, target: o.target } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  }

  beforeEach(() => {
    observers = [];

    class FakeObserver {
      constructor(private cb: IntersectionObserverCallback) {
        observers.push({ callback: cb, disconnected: false });
      }
      observe(target: Element) {
        observers[observers.length - 1].target = target;
      }
      disconnect() {
        const found = observers.find(o => o.callback === this.cb);
        if (found) found.disconnected = true;
      }
      unobserve() {}
      takeRecords() {
        return [];
      }
    }

    vi.stubGlobal('IntersectionObserver', FakeObserver as unknown as typeof IntersectionObserver);
    vi.stubGlobal('matchMedia', ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    })) as unknown as typeof matchMedia);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1;
    }) as unknown as typeof requestAnimationFrame);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('revealOnce só chama de volta quando o elemento aparece, e uma vez só', () => {
    const el = document.createElement('div');
    let chamadas = 0;

    revealOnce(el, () => chamadas++);
    expect(chamadas).toBe(0);

    entrarNaTela();
    expect(chamadas).toBe(1);

    entrarNaTela();
    expect(chamadas).toBe(1);
  });

  it('o número fica em zero até entrar na tela', () => {
    @Component({
      standalone: true,
      imports: [CountUpDirective],
      template: `<b [appCountUp]="1959"></b>`
    })
    class Host {}

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const alvo = fixture.nativeElement.querySelector('b') as HTMLElement;

    expect(alvo.textContent).toBe('0');

    entrarNaTela();
    expect(alvo.textContent).toBe('1.959');
  });

  it('a barra fica recolhida até entrar na tela', () => {
    @Component({
      standalone: true,
      imports: [GrowInDirective],
      template: `<i [appGrowIn]="0" style="width: 64%"></i>`
    })
    class Host {}

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const barra = fixture.nativeElement.querySelector('i') as HTMLElement;

    expect(barra.style.width).toBe('0%');

    entrarNaTela();
    expect(barra.style.width).toBe('64%');
  });

  it('o bloco que anima por CSS só recebe a classe ao aparecer', () => {
    @Component({
      standalone: true,
      imports: [RevealDirective],
      template: `<div appReveal></div>`
    })
    class Host {}

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const bloco = fixture.nativeElement.querySelector('div') as HTMLElement;

    expect(bloco.classList.contains('is-revealed')).toBe(false);

    entrarNaTela();
    expect(bloco.classList.contains('is-revealed')).toBe(true);
  });

  it('com movimento desligado, tudo aparece pronto sem esperar rolagem', () => {
    vi.stubGlobal('matchMedia', ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    })) as unknown as typeof matchMedia);

    @Component({
      standalone: true,
      imports: [CountUpDirective, RevealDirective],
      template: `<b [appCountUp]="42"></b><div appReveal></div>`
    })
    class Host {}

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('b') as HTMLElement).textContent).toBe('42');
    expect((fixture.nativeElement.querySelector('div') as HTMLElement).classList.contains('is-revealed')).toBe(true);
  });
});
