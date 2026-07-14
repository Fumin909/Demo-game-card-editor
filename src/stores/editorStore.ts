import { create } from 'zustand';
import type { Layer, ImageLayer, TextLayer } from '@/types';
import { useWorkspaceStore } from './workspaceStore';
import { CardManager } from '@/db';
import { generateId } from '@/lib/utils';

interface EditorState {
  selectedLayerId: string | null;
  isDragging: boolean;

  selectLayer: (id: string | null) => void;
  setIsDragging: (v: boolean) => void;

  updateLayer: (id: string, updates: Partial<Layer>) => void;
  updateImageLayer: (id: string, updates: Partial<ImageLayer>) => void;
  updateTextLayer: (id: string, updates: Partial<TextLayer>) => void;

  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  toggleVisible: (id: string) => void;
  toggleLocked: (id: string) => void;
  reorderLayer: (id: string, newZIndex: number) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  addTextLayer: () => void;

  saveCard: () => Promise<void>;
}

function getCurrentCard() {
  return useWorkspaceStore.getState().currentCard;
}

function updateCurrentCard(layers: Layer[]) {
  const card = getCurrentCard();
  if (!card) return;
  useWorkspaceStore.setState({
    currentCard: { ...card, layers },
    saveStatus: 'unsaved',
  });
}

function sortLayersByZ(layers: Layer[]): Layer[] {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  selectedLayerId: null,
  isDragging: false,

  selectLayer: (id) => set({ selectedLayerId: id }),
  setIsDragging: (v) => set({ isDragging: v }),

  updateLayer: (id, updates) => {
    const card = getCurrentCard();
    if (!card) return;
    const layers = card.layers.map((l) => (l.id === id ? ({ ...l, ...updates } as Layer) : l));
    updateCurrentCard(layers);
  },

  updateImageLayer: (id, updates) => {
    const card = getCurrentCard();
    if (!card) return;
    const layers = card.layers.map((l) =>
      l.id === id && l.type === 'image' ? ({ ...l, ...updates } as ImageLayer) : l
    );
    updateCurrentCard(layers);
  },

  updateTextLayer: (id, updates) => {
    const card = getCurrentCard();
    if (!card) return;
    const layers = card.layers.map((l) =>
      l.id === id && l.type === 'text' ? ({ ...l, ...updates } as TextLayer) : l
    );
    updateCurrentCard(layers);
  },

  removeLayer: (id) => {
    const card = getCurrentCard();
    if (!card) return;
    const layers = card.layers.filter((l) => l.id !== id);
    updateCurrentCard(layers);
    if (get().selectedLayerId === id) {
      set({ selectedLayerId: null });
    }
  },

  duplicateLayer: (id) => {
    const card = getCurrentCard();
    if (!card) return;
    const layer = card.layers.find((l) => l.id === id);
    if (!layer) return;
    const newLayer: Layer = {
      ...layer,
      id: generateId(),
      name: `${layer.name} 副本`,
      x: layer.x + 20,
      y: layer.y + 20,
    };
    updateCurrentCard([...card.layers, newLayer]);
  },

  toggleVisible: (id) => {
    const card = getCurrentCard();
    if (!card) return;
    const layers = card.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l));
    updateCurrentCard(layers);
  },

  toggleLocked: (id) => {
    const card = getCurrentCard();
    if (!card) return;
    const layers = card.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l));
    updateCurrentCard(layers);
  },

  reorderLayer: (id, newZIndex) => {
    const card = getCurrentCard();
    if (!card) return;
    const layers = card.layers.map((l) => (l.id === id ? { ...l, zIndex: newZIndex } : l));
    updateCurrentCard(layers);
  },

  bringForward: (id) => {
    const card = getCurrentCard();
    if (!card) return;
    const sorted = sortLayersByZ(card.layers);
    const idx = sorted.findIndex((l) => l.id === id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const currZ = sorted[idx].zIndex;
    const nextZ = sorted[idx + 1].zIndex;
    const layers = card.layers.map((l) => {
      if (l.id === id) return { ...l, zIndex: nextZ };
      if (l.id === sorted[idx + 1].id) return { ...l, zIndex: currZ };
      return l;
    });
    updateCurrentCard(layers);
  },

  sendBackward: (id) => {
    const card = getCurrentCard();
    if (!card) return;
    const sorted = sortLayersByZ(card.layers);
    const idx = sorted.findIndex((l) => l.id === id);
    if (idx <= 0) return;
    const currZ = sorted[idx].zIndex;
    const prevZ = sorted[idx - 1].zIndex;
    const layers = card.layers.map((l) => {
      if (l.id === id) return { ...l, zIndex: prevZ };
      if (l.id === sorted[idx - 1].id) return { ...l, zIndex: currZ };
      return l;
    });
    updateCurrentCard(layers);
  },

  addTextLayer: () => {
    const card = getCurrentCard();
    if (!card) return;
    const maxZ = card.layers.reduce((m, l) => Math.max(m, l.zIndex), 0);
    const newLayer: TextLayer = {
      id: generateId(),
      type: 'text',
      name: '新文字',
      x: card.canvasSize.width / 2 - 150,
      y: card.canvasSize.height / 2 - 30,
      width: 300,
      height: 60,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: maxZ + 10,
      content: '双击编辑文字',
      fontFamily: 'sans-serif',
      fontSize: 28,
      fontWeight: 400,
      color: '#1F2937',
      textAlign: 'center',
      lineHeight: 1.4,
      letterSpacing: 0,
    };
    updateCurrentCard([...card.layers, newLayer]);
    set({ selectedLayerId: newLayer.id });
  },

  saveCard: async () => {
    const card = getCurrentCard();
    if (!card) return;
    useWorkspaceStore.setState({ saveStatus: 'saving' });
    await CardManager.update(card.id, {
      layers: card.layers,
      canvasSize: card.canvasSize,
    });
    useWorkspaceStore.setState({ saveStatus: 'saved' });
    await useWorkspaceStore.getState().refreshProject();
  },
}));
