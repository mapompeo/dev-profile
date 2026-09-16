import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { ENTER_DURATION, easeOut, shouldAnimateEntrance } from '../utils/enter-animation';

/**
 * Faz um número contar de zero até o valor quando ele chega na tela, do mesmo
 * jeito que o score já fazia. Escreve direto no elemento em vez de passar por
 * binding: o app roda sem zone.js, e um valor que muda sessenta vezes por
 * segundo não deve disparar detecção de mudança sessenta vezes.
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements OnChanges, OnDestroy {
  /** Valor final. Zero ou negativo é escrito direto, sem animação. */
  @Input('appCountUp') value = 0;

  /** Casas decimais, para valores em reais. */
  @Input() countUpDecimals = 0;

  /** Texto colado antes do número, como "R$ ". */
  @Input() countUpPrefix = '';

  private readonly host = inject(ElementRef<HTMLElement>);
  private frame = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.run();
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private run(): void {
    this.stop();

    const target = Number(this.value) || 0;
    if (target <= 0 || !shouldAnimateEntrance()) {
      this.write(target);
      return;
    }

    let start: number | null = null;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / ENTER_DURATION);
      this.write(easeOut(progress) * target);
      if (progress < 1) {
        this.frame = requestAnimationFrame(step);
      } else {
        this.frame = 0;
      }
    };

    this.write(0);
    this.frame = requestAnimationFrame(step);
  }

  private write(value: number): void {
    const formatted = value.toLocaleString('pt-BR', {
      minimumFractionDigits: this.countUpDecimals,
      maximumFractionDigits: this.countUpDecimals
    });
    this.host.nativeElement.textContent = `${this.countUpPrefix}${formatted}`;
  }

  private stop(): void {
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }
}
