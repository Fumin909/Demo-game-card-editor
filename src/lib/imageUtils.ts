export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function generateThumbnail(dataUrl: string, maxSize = 200): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let { width, height } = img;
  if (width > height) {
    if (width > maxSize) {
      height = (height * maxSize) / width;
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = (width * maxSize) / height;
      height = maxSize;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

export async function generateCardPreview(
  canvasSize: { width: number; height: number },
  layers: Array<{
    type: 'image' | 'text';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    visible: boolean;
    content?: string;
    color?: string;
    fontSize?: number;
    fontWeight?: number;
    fontFamily?: string;
    textAlign?: string;
    assetDataUrl?: string;
  }>,
  _assetDataUrls?: Record<string, string>
): Promise<string> {
  const canvas = document.createElement('canvas');
  const maxW = 400;
  const scale = Math.min(1, maxW / canvasSize.width);
  canvas.width = canvasSize.width * scale;
  canvas.height = canvasSize.height * scale;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sorted = [...layers].sort((a, b) => (a as any).zIndex - (b as any).zIndex);

  for (const layer of sorted) {
    if (!layer.visible) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    const cx = (layer.x + layer.width / 2) * scale;
    const cy = (layer.y + layer.height / 2) * scale;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    const w = layer.width * scale;
    const h = layer.height * scale;

    if (layer.type === 'image' && layer.assetDataUrl) {
      try {
        const img = await loadImage(layer.assetDataUrl);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } catch {
        ctx.fillStyle = '#E5E7EB';
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
    } else if (layer.type === 'text') {
      ctx.fillStyle = layer.color || '#1F2937';
      ctx.font = `${layer.fontWeight || 400} ${(layer.fontSize || 16) * scale}px ${layer.fontFamily || 'sans-serif'}`;
      ctx.textAlign = (layer.textAlign as CanvasTextAlign) || 'left';
      ctx.textBaseline = 'top';
      const text = layer.content || '';
      const lines = text.split('\n');
      const lineH = (layer.fontSize || 16) * scale * 1.2;
      lines.forEach((line, i) => {
        ctx.fillText(line, -w / 2, -h / 2 + i * lineH);
      });
    }
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

export function generateTemplatePreview(
  canvasSize: { width: number; height: number },
  defaultLayers: Array<{
    type: 'image' | 'text';
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    color?: string;
    fontSize?: number;
    name?: string;
  }>,
  theme: { bg: string; border: string; accent: string } = {
    bg: '#F3F4F6',
    border: '#9CA3AF',
    accent: '#3B82F6',
  }
): string {
  const canvas = document.createElement('canvas');
  const maxW = 200;
  const scale = maxW / canvasSize.width;
  canvas.width = canvasSize.width * scale;
  canvas.height = canvasSize.height * scale;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  for (const layer of defaultLayers) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    const x = layer.x * scale;
    const y = layer.y * scale;
    const w = layer.width * scale;
    const h = layer.height * scale;

    if (layer.type === 'image') {
      ctx.fillStyle = '#D1D5DB';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#9CA3AF';
      ctx.strokeRect(x, y, w, h);
    } else {
      ctx.fillStyle = layer.color || theme.accent;
      const fs = Math.max(8, (layer.fontSize || 14) * scale);
      ctx.font = `600 ${fs}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(layer.name || layer.content || 'T', x + w / 2, y + h / 2);
    }
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}
