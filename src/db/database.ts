import Dexie, { type Table } from 'dexie';
import type { Project, Card, Asset, Template } from '@/types';

export class CardEditorDB extends Dexie {
  projects!: Table<Project, string>;
  cards!: Table<Card, string>;
  assets!: Table<Asset, string>;
  templates!: Table<Template, string>;

  constructor() {
    super('CardEditorDB');
    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      cards: 'id, projectId, name, createdAt, updatedAt',
      assets: 'id, projectId, name, createdAt',
      templates: 'id, name, category',
    });
  }
}

export const db = new CardEditorDB();
