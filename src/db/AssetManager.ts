import { db } from './database';
import type { Asset } from '@/types';
import { generateId } from '@/lib/utils';
import { fileToDataURL, loadImage, generateThumbnail } from '@/lib/imageUtils';

export const AssetManager = {
  async getByProjectId(projectId: string): Promise<Asset[]> {
    return db.assets.where('projectId').equals(projectId).reverse().sortBy('createdAt');
  },

  async getById(id: string): Promise<Asset | undefined> {
    return db.assets.get(id);
  },

  async uploadFile(projectId: string, file: File): Promise<Asset> {
    if (!file.type.startsWith('image/')) {
      throw new Error(`不支持的文件类型: ${file.type}`);
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('文件大小超过20MB限制');
    }

    const dataUrl = await fileToDataURL(file);
    const img = await loadImage(dataUrl);
    const thumbnailDataUrl = await generateThumbnail(dataUrl, 200);

    const name = file.name.replace(/\.[^.]+$/, '');

    return this.create({
      name,
      projectId,
      dataUrl,
      thumbnailDataUrl,
      size: file.size,
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  },

  async uploadFiles(projectId: string, files: FileList | File[]): Promise<Asset[]> {
    const results: Asset[] = [];
    for (const file of Array.from(files)) {
      const asset = await this.uploadFile(projectId, file);
      results.push(asset);
    }
    return results;
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

  async rename(id: string, name: string): Promise<void> {
    await db.assets.update(id, { name });
  },

  async delete(id: string): Promise<void> {
    await db.assets.delete(id);
  },

  async countByProjectId(projectId: string): Promise<number> {
    return db.assets.where('projectId').equals(projectId).count();
  },
};
