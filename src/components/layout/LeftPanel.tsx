import { useMemo, useRef, useState } from 'react';
import {
  LayoutTemplate,
  Image,
  Layers,
  Info,
  Plus,
  Upload,
  Trash2,
  Edit3,
  Check,
  X,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { ResourceTab, Template } from '@/types';
import { generateTemplatePreview } from '@/lib/imageUtils';

const tabs: { id: ResourceTab; label: string; icon: React.ReactNode }[] = [
  { id: 'project', label: '项目', icon: <Info size={16} /> },
  { id: 'templates', label: '模板', icon: <LayoutTemplate size={16} /> },
  { id: 'assets', label: '素材', icon: <Image size={16} /> },
  { id: 'cards', label: '卡牌', icon: <Layers size={16} /> },
];

export function LeftPanel({ onNewCard }: { onNewCard: () => void }) {
  const { activeTab, setActiveTab, currentProject, templates } = useWorkspaceStore();

  if (!currentProject) return null;

  return (
    <div className="w-60 bg-white border-r border-border flex flex-col shrink-0">
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-blue-50/50'
                : 'text-text-secondary hover:text-text hover:bg-gray-50'
            )}
            title={tab.label}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3">
        {activeTab === 'project' && <ProjectTab />}
        {activeTab === 'templates' && <TemplatesTab templates={templates} />}
        {activeTab === 'assets' && <AssetsTab />}
        {activeTab === 'cards' && <CardsTab onNewCard={onNewCard} />}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ProjectTab() {
  const { currentProject } = useWorkspaceStore();
  if (!currentProject) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">项目信息</h3>
      <div className="space-y-2 text-sm">
        <div>
          <div className="text-text-secondary text-xs mb-0.5">名称</div>
          <div className="text-text font-medium break-words">{currentProject.name}</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs mb-0.5">画布尺寸</div>
          <div className="text-text">
            {currentProject.canvasSize.width} × {currentProject.canvasSize.height} px
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-text-secondary text-xs mb-0.5">卡牌数</div>
            <div className="text-text font-medium">{currentProject.cards.length}</div>
          </div>
          <div>
            <div className="text-text-secondary text-xs mb-0.5">素材数</div>
            <div className="text-text font-medium">{currentProject.assets.length}</div>
          </div>
        </div>
        <div>
          <div className="text-text-secondary text-xs mb-0.5">创建时间</div>
          <div className="text-text">{formatDate(currentProject.createdAt)}</div>
        </div>
        <div>
          <div className="text-text-secondary text-xs mb-0.5">最近更新</div>
          <div className="text-text">{formatDate(currentProject.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}

function TemplatePreviewCanvas({ template }: { template: Template }) {
  const dataUrl = useMemo(
    () => generateTemplatePreview(template.canvasSize, template.defaultLayers),
    [template]
  );
  return (
    <img src={dataUrl} alt={template.name} className="w-full h-full object-contain rounded-sm" />
  );
}

function TemplatesTab({ templates }: { templates: Template[] }) {
  const { createCard, currentCard } = useWorkspaceStore();
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const handleCreate = async (t: Template) => {
    setCreatingId(t.id);
    try {
      await createCard(`${t.name}${currentCard ? ' 副本' : ''}`, t);
    } finally {
      setCreatingId(null);
    }
  };

  const categories = useMemo(() => {
    const map = new Map<string, Template[]>();
    for (const t of templates) {
      const cat = t.category || '默认';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return Array.from(map.entries());
  }, [templates]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text">模板库</h3>
        <p className="text-xs text-text-secondary mt-0.5">双击模板新建卡牌</p>
      </div>
      {categories.map(([cat, list]) => (
        <div key={cat} className="space-y-2">
          <div className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            {cat}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {list.map((t) => (
              <button
                key={t.id}
                onDoubleClick={() => handleCreate(t)}
                onClick={() => handleCreate(t)}
                disabled={creatingId === t.id}
                className={cn(
                  'border border-border rounded-md p-1.5 hover:border-primary hover:bg-blue-50/30 transition-colors text-left group',
                  creatingId === t.id && 'opacity-60 cursor-wait'
                )}
                title={`双击创建「${t.name}」卡牌`}
              >
                <div className="aspect-[8/11] bg-gray-50 rounded-sm mb-1.5 flex items-center justify-center overflow-hidden border border-gray-100">
                  <TemplatePreviewCanvas template={t} />
                </div>
                <div className="text-xs text-text font-medium truncate group-hover:text-primary">
                  {t.name}
                </div>
                <div className="text-[10px] text-text-secondary flex justify-between">
                  <span>{t.defaultLayers.length} 个图层</span>
                  <span>+ 新建</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AssetsTab() {
  const {
    assets,
    uploadAssets,
    deleteAsset,
    renameAsset,
    addImageLayer,
    currentCard,
    setActiveTab,
  } = useWorkspaceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter((a) => a.name.toLowerCase().includes(q));
  }, [assets, searchQuery]);

  const handleFiles = async (files: FileList | File[]) => {
    setUploading(true);
    setErrorMsg(null);
    try {
      await uploadAssets(files);
    } catch (err: any) {
      setErrorMsg(err?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = async (id: string) => {
    if (renameValue.trim()) {
      await renameAsset(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleAssetClick = (assetId: string) => {
    if (!currentCard) {
      setErrorMsg('请先在「卡牌」标签中打开或新建一张卡牌');
      setActiveTab('cards');
      return;
    }
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      addImageLayer(asset);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        <h3 className="text-sm font-semibold text-text">素材库</h3>
        <span className="text-xs text-text-secondary">({assets.length})</span>
      </div>

      {assets.length > 0 && (
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索素材..."
            className="w-full pl-7 pr-2 py-1 text-xs border border-border rounded focus:outline-none focus:border-primary"
          />
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-md p-3 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-blue-50'
            : 'border-border hover:border-primary/50 hover:bg-gray-50'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
        {uploading ? (
          <div className="text-xs text-primary">上传中...</div>
        ) : (
          <>
            <Upload size={20} className="mx-auto text-text-secondary mb-1" />
            <div className="text-xs text-text-secondary">点击或拖拽图片到此处上传</div>
            <div className="text-[10px] text-text-secondary mt-0.5">
              支持 PNG/JPG/WebP，最大20MB
            </div>
          </>
        )}
      </div>

      {errorMsg && (
        <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-200 flex items-start gap-1">
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
            <X size={12} />
          </button>
        </div>
      )}

      {filteredAssets.length === 0 && assets.length > 0 && (
        <p className="text-xs text-text-secondary text-center py-2">未找到匹配的素材</p>
      )}

      {assets.length === 0 ? (
        <p className="text-xs text-text-secondary text-center py-4">
          暂无素材
          <br />
          上传图片后可直接点击添加到画布
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filteredAssets.map((a) => (
            <div
              key={a.id}
              className="border border-border rounded-md p-1 hover:border-primary/50 transition-colors group relative"
            >
              <div
                className="aspect-square bg-gray-50 rounded-sm overflow-hidden cursor-grab active:cursor-grabbing"
                onClick={() => handleAssetClick(a.id)}
                draggable={!!currentCard}
                onDragStart={(e) => {
                  if (!currentCard) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData('application/x-asset-id', a.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                title={currentCard ? '点击添加到画布，或拖拽到画布指定位置' : '请先打开一张卡牌'}
              >
                <img
                  src={a.thumbnailDataUrl}
                  alt={a.name}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity pointer-events-none"
                />
              </div>
              {renamingId === a.id ? (
                <div className="flex items-center gap-0.5 mt-1">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(a.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    className="flex-1 text-xs border border-primary rounded px-1 py-0.5 min-w-0"
                  />
                  <button
                    onClick={() => commitRename(a.id)}
                    className="text-green-600 hover:text-green-700 p-0.5"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setRenamingId(null)}
                    className="text-text-secondary hover:text-text p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center mt-1 px-0.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-text truncate" title={a.name}>
                      {a.name}
                    </div>
                    <div className="text-[10px] text-text-secondary">
                      {a.width}×{a.height} · {formatSize(a.size)}
                    </div>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(a.id, a.name);
                      }}
                      className="text-text-secondary hover:text-primary p-0.5"
                      title="重命名"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `确定删除素材「${a.name}」吗？\n注意：已添加到卡牌中的图片引用也会失效。`
                          )
                        ) {
                          deleteAsset(a.id);
                        }
                      }}
                      className="text-text-secondary hover:text-red-500 p-0.5"
                      title="删除"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CardsTab({ onNewCard }: { onNewCard: () => void }) {
  const { currentProject, currentCard, openCard, deleteCard, renameCard, setActiveTab } =
    useWorkspaceStore();
  const cards = currentProject?.cards ?? [];
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = async (id: string) => {
    if (renameValue.trim()) {
      await renameCard(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">
          卡牌列表 <span className="text-text-secondary font-normal">({cards.length})</span>
        </h3>
        <button
          onClick={onNewCard}
          className="btn-primary text-xs !py-1 !px-2 flex items-center gap-0.5"
        >
          <Plus size={14} />
          新建
        </button>
      </div>
      {cards.length === 0 ? (
        <div className="text-center py-6">
          <Layers size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-text-secondary mb-2">暂无卡牌</p>
          <p className="text-xs text-text-secondary">点击「新建」或在「模板」标签中双击模板创建</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                'border rounded-md p-2 cursor-pointer transition-colors flex gap-2 group',
                currentCard?.id === card.id
                  ? 'border-primary bg-blue-50/30'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => {
                openCard(card.id);
                setActiveTab('cards');
              }}
            >
              <div className="w-12 aspect-[8/11] bg-gray-100 rounded-sm shrink-0 flex items-center justify-center text-text-secondary text-xs overflow-hidden border border-gray-200">
                {card.previewDataUrl ? (
                  <img
                    src={card.previewDataUrl}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-text-secondary">预览</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {renamingId === card.id ? (
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(card.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="flex-1 text-xs border border-primary rounded px-1 py-0.5 min-w-0"
                    />
                    <button
                      onClick={() => commitRename(card.id)}
                      className="text-green-600 hover:text-green-700 p-0.5"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="text-text-secondary hover:text-text p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-text font-medium truncate">{card.name}</div>
                    <div className="text-xs text-text-secondary">
                      {formatDate(card.updatedAt)} · {card.layers.length} 图层
                    </div>
                  </>
                )}
              </div>
              {renamingId !== card.id && (
                <div className="flex flex-col gap-0.5 self-start opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(card.id, card.name);
                    }}
                    className="text-text-secondary hover:text-primary p-0.5"
                    title="重命名"
                  >
                    <Edit3 size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定删除卡牌「${card.name}」吗？此操作不可撤销。`)) {
                        deleteCard(card.id);
                      }
                    }}
                    className="text-text-secondary hover:text-red-500 p-0.5"
                    title="删除"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
