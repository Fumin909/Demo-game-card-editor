import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Eye, EyeOff, Lock, Unlock, Image as ImageIcon, Type, Trash2, Copy } from 'lucide-react';

export function RightPanel() {
  const { currentCard } = useWorkspaceStore();

  if (!currentCard) {
    return (
      <div className="w-64 bg-white border-l border-border flex flex-col shrink-0">
        <div className="flex-1 flex items-center justify-center text-text-secondary text-sm p-4 text-center">
          选择一张卡牌后，这里将显示对象列表和属性面板
        </div>
      </div>
    );
  }

  const sortedLayers = [...currentCard.layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-64 bg-white border-l border-border flex flex-col shrink-0">
      <ObjectListPanel layers={sortedLayers} />
      <div className="border-t border-border" />
      <PropertyPanel />
    </div>
  );
}

function ObjectListPanel({
  layers,
}: {
  layers: NonNullable<
    ReturnType<typeof useWorkspaceStore.getState>['currentCard']
  >['layers'][number][];
}) {
  return (
    <div className="h-[40%] flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-text">对象列表</h3>
      </div>
      <div className="flex-1 overflow-auto">
        {layers.length === 0 ? (
          <div className="p-3 text-sm text-text-secondary">暂无对象</div>
        ) : (
          layers.map((layer) => (
            <div
              key={layer.id}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 cursor-pointer text-sm group',
                'border-b border-gray-50'
              )}
            >
              <button className="btn-icon !p-0.5" title={layer.visible ? '隐藏' : '显示'}>
                {layer.visible ? (
                  <Eye size={14} />
                ) : (
                  <EyeOff size={14} className="text-text-secondary" />
                )}
              </button>
              <button className="btn-icon !p-0.5" title={layer.locked ? '解锁' : '锁定'}>
                {layer.locked ? (
                  <Lock size={14} />
                ) : (
                  <Unlock size={14} className="text-text-secondary" />
                )}
              </button>
              <span className="text-text-secondary">
                {layer.type === 'image' ? <ImageIcon size={14} /> : <Type size={14} />}
              </span>
              <span className="flex-1 truncate text-text">{layer.name}</span>
              <button className="btn-icon !p-0.5 opacity-0 group-hover:opacity-100" title="复制">
                <Copy size={14} />
              </button>
              <button
                className="btn-icon !p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500"
                title="删除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PropertyPanel() {
  const { currentCard, viewState } = useWorkspaceStore();

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-text">属性</h3>
      </div>
      <div className="p-3 space-y-3">
        <div className="text-sm text-text-secondary mb-2">画布属性</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <label className="text-xs text-text-secondary block mb-1">宽度</label>
            <div className="px-2 py-1 bg-gray-50 rounded border border-border text-text">
              {currentCard?.canvasSize.width ?? '-'}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">高度</label>
            <div className="px-2 py-1 bg-gray-50 rounded border border-border text-text">
              {currentCard?.canvasSize.height ?? '-'}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">缩放</label>
            <div className="px-2 py-1 bg-gray-50 rounded border border-border text-text">
              {Math.round(viewState.zoom * 100)}%
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">对象数</label>
            <div className="px-2 py-1 bg-gray-50 rounded border border-border text-text">
              {currentCard?.layers.length ?? 0}
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-xs text-text-secondary">选中对象后，这里将显示对象的详细属性</p>
        </div>
      </div>
    </div>
  );
}
