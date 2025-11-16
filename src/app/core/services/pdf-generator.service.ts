import { Injectable } from '@angular/core';
import html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {
  
  constructor() {}

  /**
   * Converts image URLs to base64 to avoid cross-origin issues
   */
  private async convertImagesToDataURL(container: HTMLElement): Promise<void> {
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];

    await Promise.all(
      imgs.map(img =>
        new Promise<void>(async (resolve) => {
          try {
            if (/^https?:\/\//.test(img.src) && !img.src.startsWith(window.location.origin)) {
              img.src = await this.toDataURL(img.src);
            }
          } catch {
            // ignore errors, continue
          }
          resolve();
        })
      )
    );
  }

  private async toDataURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Generates a PDF from an HTMLElement
   */
  async generatePDF(container: HTMLElement, title: string = 'Emily-Report'): Promise<void> {
    if (!container) {
      console.error('PDF container not found');
      return;
    }

    await this.convertImagesToDataURL(container);

    const filename = `${title || 'Emily-Report'}-${Date.now()}.pdf`;

    const options: any = {
      filename,
      margin: 15,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    await html2pdf().from(container).set(options).save();
  }
}
