import { domToPng } from 'modern-screenshot';

export interface CaptureOptions {
  backgroundColor?: string;
  scale?: number;
  imageTimeout?: number;
}

/**
 * Captura um elemento da página como PNG.
 *
 * Usa modern-screenshot em vez de html2canvas: o segundo é CommonJS, o que
 * fazia o bundler abrir mão de otimizações em toda build e ainda avisar sobre
 * isso. Este é ESM, bem menor, e desenha a partir do SVG foreignObject, então
 * respeita o CSS moderno que o app usa (custom properties, container queries).
 */
export async function captureElementAsPngDataUrl(element: HTMLElement, options: CaptureOptions = {}): Promise<string> {
  return domToPng(element, {
    backgroundColor: options.backgroundColor,
    scale: options.scale ?? 2,
    timeout: options.imageTimeout,
    // O avatar vem de avatars.githubusercontent.com: sem isto a imagem sai
    // furada, com um buraco no lugar da foto.
    fetch: { requestInit: { mode: 'cors' } }
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
