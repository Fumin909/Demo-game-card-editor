import type { CanvasSize } from './layer';
import type { Layer } from './layer';

export interface Template {
  id: string;
  name: string;
  category: string;
  canvasSize: CanvasSize;
  defaultLayers: Layer[];
  previewDataUrl?: string;
}
