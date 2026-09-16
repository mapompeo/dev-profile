/**
 * Dispara uma vez, quando o elemento entra na tela.
 *
 * A animação de entrada acompanha a rolagem: num painel longo, animar tudo no
 * carregamento faz o usuário perder todo o movimento que está abaixo da dobra.
 * Cada bloco anima quando chega a vez dele, e só na primeira vez: rolar de volta
 * não reanima nada, senão a página vira um carrossel.
 *
 * Sem IntersectionObserver, o retorno é imediato: melhor mostrar o valor final
 * do que depender de uma API que pode não existir.
 */
const THRESHOLD = 0.2;

/** Margem negativa embaixo: o bloco anima quando está de fato na tela, não ao encostar a borda. */
const ROOT_MARGIN = '0px 0px -10% 0px';

export function revealOnce(element: Element, onVisible: () => void): () => void {
  if (typeof IntersectionObserver !== 'function') {
    onVisible();
    return () => {};
  }

  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          onVisible();
          return;
        }
      }
    },
    { threshold: THRESHOLD, rootMargin: ROOT_MARGIN }
  );

  observer.observe(element);
  return () => observer.disconnect();
}
