/**
 * Regras comuns a toda animação de entrada do app, num lugar só.
 *
 * O MASTER.md define que movimento só acontece quando chega dado novo, em 400ms
 * com ease-out. Estas funções guardam as três situações em que nem isso deve
 * rodar: quem pediu menos movimento, aba em segundo plano (onde
 * requestAnimationFrame não roda e o valor ficaria congelado no início) e
 * ambientes sem as APIs de animação.
 */
export const ENTER_DURATION = 400;
export const ENTER_EASING = 'cubic-bezier(.22,.61,.36,1)';
export const ENTER_STAGGER = 40;

/** Teto do escalonamento: passar disso vira espera, não ritmo. */
export const ENTER_STAGGER_MAX = 240;

export function shouldAnimateEntrance(): boolean {
  if (typeof document === 'undefined' || typeof matchMedia !== 'function') return false;
  if (typeof requestAnimationFrame !== 'function') return false;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return document.visibilityState === 'visible';
}

/** Aproximação da curva do design system, suficiente para contagem numérica. */
export function easeOut(progress: number): number {
  return 1 - Math.pow(1 - progress, 2.4);
}

export function staggerDelay(index: number): number {
  return Math.min(index * ENTER_STAGGER, ENTER_STAGGER_MAX);
}
