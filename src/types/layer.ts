export interface CanvasSize {
  width: number;
  height: number;
}

export interface BaseLayer {
  id: string;
  type: 'image' | 'text';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  assetId: string;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

export type Layer = ImageLayer | TextLayer;
