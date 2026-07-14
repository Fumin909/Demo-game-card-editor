import { db } from './database';
import type { Project, ProjectWithCards } from '@/types';
import { generateId } from '@/lib/utils';

export const ProjectManager = {
  async getAll(): Promise<Project[]> {
    return db.projects.orderBy('updatedAt').reverse().toArray();
  },

  async getById(id: string): Promise<ProjectWithCards | undefined> {
    const project = await db.projects.get(id);
    if (!project) return undefined;
    const cards = await db.cards.where('projectId').equals(id).toArray();
    const assets = await db.assets.where('projectId').equals(id).toArray();
    return { ...project, cards, assets };
  },

  async create(name: string, width = 800, height = 1100): Promise<Project> {
    const now = Date.now();
    const project: Project = {
      id: generateId(),
      name,
      canvasSize: { width, height },
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.add(project);
    return project;
  },

  async update(id: string, updates: Partial<Pick<Project, 'name' | 'canvasSize'>>): Promise<void> {
    await db.projects.update(id, { ...updates, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.projects, db.cards, db.assets, async () => {
      await db.cards.where('projectId').equals(id).delete();
      await db.assets.where('projectId').equals(id).delete();
      await db.projects.delete(id);
    });
  },

  async touch(id: string): Promise<void> {
    await db.projects.update(id, { updatedAt: Date.now() });
  },
};
