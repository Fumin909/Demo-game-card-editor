import type { Layer, CanvasSize } from './layer';

export interface Card {
  id: string;
  name: string;
  projectId: string;
  canvasSize: CanvasSize;
  layers: Layer[];
  createdAt: number;
  updatedAt: number;
  previewDataUrl?: string;
  exportDataUrl?: string;
}
