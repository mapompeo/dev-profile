import { AfterViewInit, Directive, ElementRef, Input, inject } from '@angular/core';
import { ENTER_DURATION, ENTER_EASING, shouldAnimateEntrance, staggerDelay } from '../utils/enter-animation';

/**
 * Faz uma barra crescer da largura zero até a largura final quando entra na
 * tela. Anima só a largura da própria barra, que é o que o design system
 * permite: nada de altura, posição ou tamanho de card.
 *
 * O valor final é o que já está inline no elemento, então a barra continua
 * correta se a animação não rodar: ela só aparece pronta.
 */
@Directive({
  selector: '[appGrowIn]',
  standalone: true
})
export class GrowInDirective implements AfterViewInit {
  /** Posição na lista, para escalonar a entrada de barras vizinhas. */
  @Input('appGrowIn') index = 0;

  private readonly host = inject(ElementRef<HTMLElement>);

  ngAfterViewInit(): void {
    if (!shouldAnimateEntrance()) return;

    const el = this.host.nativeElement;
    const finalWidth = el.style.width;
    if (!finalWidth) return;

    el.style.transition = 'none';
    el.style.width = '0%';

    requestAnimationFrame(() => {
      el.style.transition = `width ${ENTER_DURATION}ms ${ENTER_EASING} ${staggerDelay(this.index)}ms`;
      el.style.width = finalWidth;
    });
  }
}
