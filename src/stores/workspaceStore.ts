import { create } from 'zustand';
import type { Project, ProjectWithCards, Card, Template, ResourceTab, EditorViewState } from '@/types';
import { ProjectManager, CardManager, TemplateManager } from '@/db';

interface WorkspaceState {
  projects: Project[];
  currentProject: ProjectWithCards | null;
  currentCard: Card | null;
  templates: Template[];
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
  setActiveTab: (tab: ResourceTab) => void;
  setViewState: (state: Partial<EditorViewState>) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
}

let initPromise: Promise<void> | null = null;

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>((set, get) => ({
  projects: [],
  currentProject: null,
  currentCard: null,
  templates: [],
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
      set({ currentProject: project, currentCard: null, activeTab: 'cards' });
    }
  },

  closeProject: () => {
    set({ currentProject: null, currentCard: null });
  },

  deleteProject: async (id) => {
    await ProjectManager.delete(id);
    const { currentProject, loadProjects } = get();
    if (currentProject?.id === id) {
      set({ currentProject: null, currentCard: null });
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
    await get().openProject(currentProject.id);
    return card;
  },

  openCard: async (id) => {
    const card = await CardManager.getById(id);
    if (card) {
      set({ currentCard: card });
    }
  },

  closeCard: () => {
    set({ currentCard: null });
  },

  deleteCard: async (id) => {
    await CardManager.delete(id);
    const { currentCard, currentProject, openProject } = get();
    if (currentCard?.id === id) {
      set({ currentCard: null });
    }
    if (currentProject) {
      await openProject(currentProject.id);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setViewState: (state) =>
    set((prev) => ({ viewState: { ...prev.viewState, ...state } })),

  setSaveStatus: (status) => set({ saveStatus: status }),
}));
