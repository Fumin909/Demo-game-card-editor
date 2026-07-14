export type EditorState = 'idle' | 'selected' | 'editing' | 'transforming';

export interface EditorViewState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export type ResourceTab = 'project' | 'templates' | 'assets' | 'cards';
