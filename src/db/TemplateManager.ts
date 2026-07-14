import { db } from './database';
import type { Template } from '@/types';

export const TemplateManager = {
  async getAll(): Promise<Template[]> {
    return db.templates.toArray();
  },

  async seedDefaults(): Promise<void> {
    const count = await db.templates.count();
    if (count > 0) return;

    const defaultTemplates: Template[] = [
      {
        id: 'default-character',
        name: '默认角色牌',
        category: '基础',
        canvasSize: { width: 800, height: 1100 },
        defaultLayers: [],
      },
      {
        id: 'default-card',
        name: '默认卡牌',
        category: '基础',
        canvasSize: { width: 800, height: 1100 },
        defaultLayers: [],
      },
    ];

    await db.templates.bulkPut(defaultTemplates);
  },
};
