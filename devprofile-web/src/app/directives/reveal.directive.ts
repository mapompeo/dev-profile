import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { shouldAnimateEntrance } from '../utils/enter-animation';
import { revealOnce } from '../utils/reveal-on-scroll';

/**
 * Marca o elemento com `is-revealed` quando ele entra na tela, uma vez só.
 *
 * Serve para o que anima por CSS, como o polígono do radar e as células do
 * medidor: o estilo fica no SCSS do componente e este é só o gatilho. Quando o
 * movimento está desligado, a classe entra na hora, então o CSS nunca precisa
 * saber se houve animação ou não.
 */
@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private stopWatching?: () => void;

  ngAfterViewInit(): void {
    const el = this.host.nativeElement;

    if (!shouldAnimateEntrance()) {
      el.classList.add('is-revealed');
      return;
    }

    this.stopWatching = revealOnce(el, () => el.classList.add('is-revealed'));
  }

  ngOnDestroy(): void {
    this.stopWatching?.();
  }
}
