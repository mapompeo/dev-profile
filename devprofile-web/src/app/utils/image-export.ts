import html2canvas from 'html2canvas';

export interface CaptureOptions {
  backgroundColor?: string;
  scale?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  logging?: boolean;
  imageTimeout?: number;
}

export async function captureElementAsPngDataUrl(element: HTMLElement, options: CaptureOptions = {}): Promise<string> {
  const canvas = await html2canvas(element, {
    backgroundColor: options.backgroundColor ?? '#0c0c10',
    scale: options.scale ?? 2,
    useCORS: options.useCORS ?? true,
    allowTaint: options.allowTaint ?? false,
    logging: options.logging ?? false,
    imageTimeout: options.imageTimeout,
  });
  return canvas.toDataURL('image/png', 1.0);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
