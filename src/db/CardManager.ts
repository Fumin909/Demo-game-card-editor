import { db } from './database';
import type { Card } from '@/types';
import { generateId } from '@/lib/utils';

export const CardManager = {
  async getByProjectId(projectId: string): Promise<Card[]> {
    return db.cards.where('projectId').equals(projectId).toArray();
  },

  async getById(id: string): Promise<Card | undefined> {
    return db.cards.get(id);
  },

  async create(projectId: string, name: string, canvasSize: { width: number; height: number }): Promise<Card> {
    const now = Date.now();
    const card: Card = {
      id: generateId(),
      name,
      projectId,
      canvasSize,
      layers: [],
      createdAt: now,
      updatedAt: now,
    };
    await db.cards.add(card);
    return card;
  },

  async createFromTemplate(
    projectId: string,
    name: string,
    canvasSize: { width: number; height: number },
    layers: Card['layers']
  ): Promise<Card> {
    const now = Date.now();
    const card: Card = {
      id: generateId(),
      name,
      projectId,
      canvasSize,
      layers: layers.map((l) => ({ ...l, id: generateId() })),
      createdAt: now,
      updatedAt: now,
    };
    await db.cards.add(card);
    return card;
  },

  async update(id: string, updates: Partial<Omit<Card, 'id' | 'projectId' | 'createdAt'>>): Promise<void> {
    await db.cards.update(id, { ...updates, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.cards.delete(id);
  },
};
