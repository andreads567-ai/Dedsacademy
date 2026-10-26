/**
 * Client-side image optimization utility
 * Resizes and compresses uploaded images using an offscreen HTML5 canvas
 * so they fit safely into localStorage (under 100-200 KB) without triggering
 * QuotaExceededError or causing UI lag.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<{ dataUrl: string; sizeKb: number; name: string }> {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem.'));
    reader.onload = (e) => {
      const src = e.target?.result;
      if (typeof src !== 'string') {
        reject(new Error('Falha ao processar conteúdo da imagem.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao decodificar imagem.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original raw string if 2d context unavailable
          const approxKb = Math.round(src.length / 1024);
          resolve({ dataUrl: src, sizeKb: approxKb, name: file.name });
          return;
        }

        // Draw with smoothing for high fidelity
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized dataUrl
        const outputMime = file.type === 'image/png' ? 'image/png' : mimeType;
        const dataUrl = canvas.toDataURL(outputMime, quality);
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          sizeKb,
          name: file.name,
        });
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Safe localStorage setter with fallback protection against QuotaExceededError
 */
export function safeSaveLocalStorage(key: string, value: any): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    console.warn(`[Storage] Failed to save key "${key}" to localStorage:`, err);
    // If quota exceeded, try cleaning temporary items or non-essential cache
    try {
      localStorage.removeItem('deds_temp_cache');
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}
