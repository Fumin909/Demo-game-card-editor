import { db } from './database';
import type { Asset } from '@/types';
import { generateId } from '@/lib/utils';

export const AssetManager = {
  async getByProjectId(projectId: string): Promise<Asset[]> {
    return db.assets.where('projectId').equals(projectId).toArray();
  },

  async getById(id: string): Promise<Asset | undefined> {
    return db.assets.get(id);
  },

  async create(asset: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset> {
    const newAsset: Asset = {
      ...asset,
      id: generateId(),
      createdAt: Date.now(),
    };
    await db.assets.add(newAsset);
    return newAsset;
  },

  async delete(id: string): Promise<void> {
    await db.assets.delete(id);
  },
};
