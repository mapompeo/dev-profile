/**
 * A única animação de entrada do app: um número contando de 0 até o valor,
 * uma vez, quando chega dado novo. Duração e curva vêm do MASTER.md
 * (400ms, cubic-bezier(.22,.61,.36,1)); quem pede menos movimento recebe o
 * valor final direto.
 */
const DURATION = 400;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Aba em segundo plano não executa requestAnimationFrame. Sem esta checagem, um
 * link de perfil aberto em nova aba mostra 0 até alguém olhar para ele, que é
 * justamente o caminho de quem recebe o link compartilhado.
 */
function pageIsHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState !== 'visible';
}

/** Aproximação da cubic-bezier(.22,.61,.36,1), suficiente para uma contagem. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 2.4);
}

/** Devolve uma função de cancelamento, para o componente parar no destroy. */
export function countUp(to: number, onTick: (value: number) => void): () => void {
  if (prefersReducedMotion() || pageIsHidden() || typeof requestAnimationFrame !== 'function') {
    onTick(to);
    return () => {};
  }

  let frame = 0;
  let start: number | null = null;

  const step = (timestamp: number) => {
    if (start === null) start = timestamp;
    const progress = Math.min(1, (timestamp - start) / DURATION);
    onTick(Math.round(easeOut(progress) * to));
    if (progress < 1) {
      frame = requestAnimationFrame(step);
    }
  };

  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
