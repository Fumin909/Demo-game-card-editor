import { db } from './database';
import type { Template, TextLayer, ImageLayer } from '@/types';
import { generateId } from '@/lib/utils';

function createDefaultLayers(canvasSize: { width: number; height: number }) {
  const w = canvasSize.width;
  const h = canvasSize.height;

  const titleLayer: TextLayer = {
    id: generateId(),
    type: 'text',
    name: '卡牌名称',
    x: 60,
    y: 40,
    width: w - 120,
    height: 80,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 10,
    content: '卡牌名称',
    fontFamily: 'serif',
    fontSize: 48,
    fontWeight: 700,
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 1.3,
    letterSpacing: 2,
  };

  const descLayer: TextLayer = {
    id: generateId(),
    type: 'text',
    name: '技能描述',
    x: 80,
    y: h - 280,
    width: w - 160,
    height: 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 10,
    content: '在这里输入技能描述...',
    fontFamily: 'sans-serif',
    fontSize: 22,
    fontWeight: 400,
    color: '#374151',
    textAlign: 'left',
    lineHeight: 1.5,
    letterSpacing: 0,
  };

  return { titleLayer, descLayer };
}

function buildCharacterTemplate(): Template {
  const canvasSize = { width: 800, height: 1100 };
  const { titleLayer, descLayer } = createDefaultLayers(canvasSize);

  const portraitFrame: ImageLayer = {
    id: generateId(),
    type: 'image',
    name: '角色图片框',
    x: 100,
    y: 140,
    width: 600,
    height: 600,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1,
    assetId: '',
  };

  const campBadge: TextLayer = {
    id: generateId(),
    type: 'text',
    name: '阵营标记',
    x: 60,
    y: 900,
    width: 120,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 10,
    content: '阵营',
    fontFamily: 'sans-serif',
    fontSize: 20,
    fontWeight: 700,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 1.2,
    letterSpacing: 4,
  };

  const hpText: TextLayer = {
    id: generateId(),
    type: 'text',
    name: '体力值',
    x: w2(canvasSize.width, -180),
    y: 900,
    width: 120,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 10,
    content: '4',
    fontFamily: 'serif',
    fontSize: 36,
    fontWeight: 700,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 1.2,
    letterSpacing: 0,
  };

  return {
    id: 'tpl-character',
    name: '角色牌',
    category: '基础',
    canvasSize,
    defaultLayers: [portraitFrame, titleLayer, descLayer, campBadge, hpText],
  };
}

function buildSkillCardTemplate(): Template {
  const canvasSize = { width: 800, height: 1100 };
  const { titleLayer, descLayer } = createDefaultLayers(canvasSize);

  const artArea: ImageLayer = {
    id: generateId(),
    type: 'image',
    name: '卡牌插画',
    x: 80,
    y: 140,
    width: 640,
    height: 400,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1,
    assetId: '',
  };

  const typeLabel: TextLayer = {
    id: generateId(),
    type: 'text',
    name: '卡牌类型',
    x: 80,
    y: 560,
    width: 200,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 10,
    content: '【技能牌】',
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: 700,
    color: '#2563EB',
    textAlign: 'left',
    lineHeight: 1.2,
    letterSpacing: 1,
  };

  const costText: TextLayer = {
    id: generateId(),
    type: 'text',
    name: '费用/花色',
    x: 580,
    y: 560,
    width: 140,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 10,
    content: '♠ K',
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: 700,
    color: '#1F2937',
    textAlign: 'right',
    lineHeight: 1.2,
    letterSpacing: 0,
  };

  return {
    id: 'tpl-skill',
    name: '技能牌',
    category: '基础',
    canvasSize,
    defaultLayers: [artArea, titleLayer, typeLabel, costText, descLayer],
  };
}

function buildEquipmentTemplate(): Template {
  const canvasSize = { width: 800, height: 1100 };
  const { titleLayer, descLayer } = createDefaultLayers(canvasSize);

  const eqArea: ImageLayer = {
    id: generateId(),
    type: 'image',
    name: '装备图片',
    x: 200,
    y: 160,
    width: 400,
    height: 400,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1,
    assetId: '',
  };

  const rangeText: TextLayer = {
    id: generateId(),
    type: 'text',
    name: '攻击范围',
    x: 80,
    y: 580,
    width: 200,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 10,
    content: '攻击范围: 3',
    fontFamily: 'sans-serif',
    fontSize: 20,
    fontWeight: 600,
    color: '#059669',
    textAlign: 'left',
    lineHeight: 1.2,
    letterSpacing: 0,
  };

  const eqType: TextLayer = {
    id: generateId(),
    type: 'text',
    name: '装备类型',
    x: 480,
    y: 580,
    width: 240,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 10,
    content: '【武器】',
    fontFamily: 'sans-serif',
    fontSize: 24,
    fontWeight: 700,
    color: '#D97706',
    textAlign: 'right',
    lineHeight: 1.2,
    letterSpacing: 1,
  };

  return {
    id: 'tpl-equipment',
    name: '装备牌',
    category: '基础',
    canvasSize,
    defaultLayers: [eqArea, titleLayer, rangeText, eqType, descLayer],
  };
}

function buildBlankTemplate(): Template {
  const canvasSize = { width: 800, height: 1100 };
  return {
    id: 'tpl-blank',
    name: '空白卡牌',
    category: '基础',
    canvasSize,
    defaultLayers: [],
  };
}

function w2(w: number, offset: number): number {
  return w / 2 + offset;
}

export const TemplateManager = {
  async getAll(): Promise<Template[]> {
    return db.templates.toArray();
  },

  async getById(id: string): Promise<Template | undefined> {
    return db.templates.get(id);
  },

  async seedDefaults(): Promise<void> {
    const defaultTemplates: Template[] = [
      buildCharacterTemplate(),
      buildSkillCardTemplate(),
      buildEquipmentTemplate(),
      buildBlankTemplate(),
    ];
    await db.templates.bulkPut(defaultTemplates);
  },

  async add(template: Template): Promise<void> {
    await db.templates.put(template);
  },

  async delete(id: string): Promise<void> {
    await db.templates.delete(id);
  },
};
