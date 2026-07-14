import { create } from 'zustand';
import type {
  Project,
  ProjectWithCards,
  Card,
  Template,
  ResourceTab,
  EditorViewState,
  Asset,
  Layer,
} from '@/types';
import { ProjectManager, CardManager, TemplateManager, AssetManager } from '@/db';
import { generateId } from '@/lib/utils';

interface WorkspaceState {
  projects: Project[];
  currentProject: ProjectWithCards | null;
  currentCard: Card | null;
  templates: Template[];
  assets: Asset[];
  activeTab: ResourceTab;
  viewState: EditorViewState;
  isLoading: boolean;
  isInitialized: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
}

interface WorkspaceActions {
  initialize: () => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (name: string, width?: number, height?: number) => Promise<Project>;
  openProject: (id: string) => Promise<void>;
  closeProject: () => void;
  deleteProject: (id: string) => Promise<void>;
  createCard: (name: string, template?: Template) => Promise<Card>;
  openCard: (id: string) => Promise<void>;
  closeCard: () => void;
  deleteCard: (id: string) => Promise<void>;
  renameCard: (id: string, name: string) => Promise<void>;
  setActiveTab: (tab: ResourceTab) => void;
  setViewState: (state: Partial<EditorViewState>) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
  uploadAssets: (files: FileList | File[]) => Promise<Asset[]>;
  renameAsset: (id: string, name: string) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  refreshProject: () => Promise<void>;
  addImageLayer: (asset: Asset) => void;
}

let initPromise: Promise<void> | null = null;

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>((set, get) => ({
  projects: [],
  currentProject: null,
  currentCard: null,
  templates: [],
  assets: [],
  activeTab: 'cards',
  viewState: { zoom: 1, offsetX: 0, offsetY: 0 },
  isLoading: true,
  isInitialized: false,
  saveStatus: 'saved',

  initialize: async () => {
    if (get().isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      set({ isLoading: true });
      await TemplateManager.seedDefaults();
      const [projects, templates] = await Promise.all([
        ProjectManager.getAll(),
        TemplateManager.getAll(),
      ]);
      set({ projects, templates, isLoading: false, isInitialized: true });
    })();

    return initPromise;
  },

  loadProjects: async () => {
    const projects = await ProjectManager.getAll();
    set({ projects });
  },

  createProject: async (name, width = 800, height = 1100) => {
    const project = await ProjectManager.create(name, width, height);
    await get().loadProjects();
    return project;
  },

  openProject: async (id) => {
    const project = await ProjectManager.getById(id);
    if (project) {
      set({
        currentProject: project,
        currentCard: null,
        assets: project.assets,
        activeTab: 'cards',
      });
    }
  },

  closeProject: () => {
    set({ currentProject: null, currentCard: null, assets: [] });
  },

  deleteProject: async (id) => {
    await ProjectManager.delete(id);
    const { currentProject, loadProjects } = get();
    if (currentProject?.id === id) {
      set({ currentProject: null, currentCard: null, assets: [] });
    }
    await loadProjects();
  },

  createCard: async (name, template) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project open');
    const canvasSize = template?.canvasSize ?? currentProject.canvasSize;
    const layers = template?.defaultLayers ?? [];
    const card = template
      ? await CardManager.createFromTemplate(currentProject.id, name, canvasSize, layers)
      : await CardManager.create(currentProject.id, name, canvasSize);
    await get().refreshProject();
    await get().openCard(card.id);
    return card;
  },

  openCard: async (id) => {
    const card = await CardManager.getById(id);
    if (card) {
      set({ currentCard: card, viewState: { zoom: 1, offsetX: 0, offsetY: 0 } });
    }
  },

  closeCard: () => {
    set({ currentCard: null });
  },

  deleteCard: async (id) => {
    await CardManager.delete(id);
    const { currentCard, refreshProject } = get();
    if (currentCard?.id === id) {
      set({ currentCard: null });
    }
    await refreshProject();
  },

  renameCard: async (id, name) => {
    await CardManager.update(id, { name });
    const { currentCard, refreshProject } = get();
    if (currentCard?.id === id) {
      set({ currentCard: { ...currentCard, name } });
    }
    await refreshProject();
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setViewState: (state) => set((prev) => ({ viewState: { ...prev.viewState, ...state } })),

  setSaveStatus: (status) => set({ saveStatus: status }),

  uploadAssets: async (files) => {
    const { currentProject } = get();
    if (!currentProject) throw new Error('No project open');
    const newAssets = await AssetManager.uploadFiles(currentProject.id, files);
    set((s) => ({ assets: [...newAssets, ...s.assets] }));
    await get().refreshProject();
    return newAssets;
  },

  renameAsset: async (id, name) => {
    await AssetManager.rename(id, name);
    set((s) => ({
      assets: s.assets.map((a) => (a.id === id ? { ...a, name } : a)),
    }));
  },

  deleteAsset: async (id) => {
    await AssetManager.delete(id);
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
    await get().refreshProject();
  },

  refreshProject: async () => {
    const { currentProject } = get();
    if (currentProject) {
      const project = await ProjectManager.getById(currentProject.id);
      if (project) {
        set({ currentProject: project, assets: project.assets });
      }
    }
  },

  addImageLayer: (asset) => {
    const { currentCard } = get();
    if (!currentCard) return;
    const newLayer: Layer = {
      id: generateId(),
      type: 'image',
      name: asset.name,
      x: (currentCard.canvasSize.width - asset.width * 0.5) / 2,
      y: (currentCard.canvasSize.height - asset.height * 0.5) / 2,
      width: Math.min(asset.width, currentCard.canvasSize.width * 0.6),
      height: Math.min(asset.height, currentCard.canvasSize.height * 0.4),
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: currentCard.layers.reduce((m, l) => Math.max(m, l.zIndex), 0) + 10,
      assetId: asset.id,
    };
    set({
      currentCard: {
        ...currentCard,
        layers: [...currentCard.layers, newLayer],
      },
      saveStatus: 'unsaved',
    });
  },
}));
