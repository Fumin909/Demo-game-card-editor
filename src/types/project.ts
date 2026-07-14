import type { CanvasSize } from './layer';
import type { Card } from './card';

export interface Asset {
  id: string;
  name: string;
  projectId: string;
  dataUrl: string;
  thumbnailDataUrl: string;
  size: number;
  width: number;
  height: number;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  canvasSize: CanvasSize;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectWithCards extends Project {
  cards: Card[];
  assets: Asset[];
}
