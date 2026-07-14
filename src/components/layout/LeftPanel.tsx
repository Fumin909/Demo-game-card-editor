import { LayoutTemplate, Image, Layers, Info, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { ResourceTab } from '@/types';

const tabs: { id: ResourceTab; label: string; icon: React.ReactNode }[] = [
  { id: 'project', label: '项目', icon: <Info size={16} /> },
  { id: 'templates', label: '模板', icon: <LayoutTemplate size={16} /> },
  { id: 'assets', label: '素材', icon: <Image size={16} /> },
  { id: 'cards', label: '卡牌', icon: <Layers size={16} /> },
];

export function LeftPanel({ onNewCard }: { onNewCard: () => void }) {
  const { activeTab, setActiveTab, currentProject, templates, openCard, deleteCard, createCard } =
    useWorkspaceStore();

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
        {activeTab === 'templates' && (
          <TemplatesTab
            templates={templates}
            onCreateFromTemplate={(t) => createCard(`${t.name} 副本`, t)}
          />
        )}
        {activeTab === 'assets' && <AssetsTab />}
        {activeTab === 'cards' && (
          <CardsTab onNewCard={onNewCard} onOpenCard={openCard} onDeleteCard={deleteCard} />
        )}
      </div>
    </div>
  );
}

function ProjectTab() {
  const { currentProject } = useWorkspaceStore();
  if (!currentProject) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">项目信息</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-text-secondary">名称：</span>
          <span className="text-text">{currentProject.name}</span>
        </div>
        <div>
          <span className="text-text-secondary">画布尺寸：</span>
          <span className="text-text">
            {currentProject.canvasSize.width} × {currentProject.canvasSize.height}
          </span>
        </div>
        <div>
          <span className="text-text-secondary">卡牌数：</span>
          <span className="text-text">{currentProject.cards.length}</span>
        </div>
        <div>
          <span className="text-text-secondary">素材数：</span>
          <span className="text-text">{currentProject.assets.length}</span>
        </div>
      </div>
    </div>
  );
}

function TemplatesTab({
  templates,
  onCreateFromTemplate,
}: {
  templates: ReturnType<typeof useWorkspaceStore.getState>['templates'];
  onCreateFromTemplate: (t: (typeof templates)[0]) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">模板库</h3>
      <div className="grid grid-cols-1 gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onCreateFromTemplate(t)}
            className="border border-border rounded-md p-2 hover:border-primary hover:bg-blue-50/30 transition-colors text-left group"
          >
            <div className="aspect-[8/11] bg-gray-100 rounded-sm mb-2 flex items-center justify-center text-text-secondary text-xs">
              {t.name}
            </div>
            <div className="text-sm text-text font-medium truncate group-hover:text-primary">
              {t.name}
            </div>
            <div className="text-xs text-text-secondary">{t.category}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AssetsTab() {
  const { currentProject } = useWorkspaceStore();
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">素材库</h3>
      {currentProject?.assets.length === 0 ? (
        <p className="text-sm text-text-secondary">暂无素材，上传图片后将显示在这里</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {currentProject?.assets.map((a) => (
            <div key={a.id} className="border border-border rounded-md p-1">
              <img
                src={a.thumbnailDataUrl}
                alt={a.name}
                className="w-full aspect-square object-cover rounded-sm"
              />
              <div className="text-xs text-text truncate mt-1 px-1">{a.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CardsTab({
  onNewCard,
  onOpenCard,
  onDeleteCard,
}: {
  onNewCard: () => void;
  onOpenCard: (id: string) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
}) {
  const { currentProject, currentCard } = useWorkspaceStore();
  const cards = currentProject?.cards ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">卡牌列表</h3>
        <button onClick={onNewCard} className="btn-primary text-xs !py-1 !px-2">
          <Plus size={14} />
          新建
        </button>
      </div>
      {cards.length === 0 ? (
        <p className="text-sm text-text-secondary">暂无卡牌，点击"新建"创建第一张卡牌</p>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className={cn(
                'border rounded-md p-2 cursor-pointer transition-colors flex gap-2',
                currentCard?.id === card.id
                  ? 'border-primary bg-blue-50/30'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => onOpenCard(card.id)}
            >
              <div className="w-12 aspect-[8/11] bg-gray-100 rounded-sm shrink-0 flex items-center justify-center text-text-secondary text-xs overflow-hidden">
                {card.previewDataUrl ? (
                  <img
                    src={card.previewDataUrl}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px]">预览</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text font-medium truncate">{card.name}</div>
                <div className="text-xs text-text-secondary">
                  {new Date(card.updatedAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-text-secondary">{card.layers.length} 个对象</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`确定删除卡牌"${card.name}"吗？`)) {
                    onDeleteCard(card.id);
                  }
                }}
                className="text-text-secondary hover:text-red-500 self-start p-1"
                title="删除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
