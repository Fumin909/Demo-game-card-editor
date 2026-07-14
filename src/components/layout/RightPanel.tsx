import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useEditorStore } from '@/stores/editorStore';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Image as ImageIcon,
  Type,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import type { Layer, TextLayer } from '@/types';

export function RightPanel() {
  const { currentCard } = useWorkspaceStore();
  const { selectedLayerId } = useEditorStore();

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
  const selectedLayer = selectedLayerId
    ? currentCard.layers.find((l) => l.id === selectedLayerId)
    : undefined;

  return (
    <div className="w-64 bg-white border-l border-border flex flex-col shrink-0">
      <ObjectListPanel layers={sortedLayers} selectedId={selectedLayerId} />
      <div className="border-t border-border" />
      <PropertyPanel layer={selectedLayer} />
    </div>
  );
}

function ObjectListPanel({ layers, selectedId }: { layers: Layer[]; selectedId: string | null }) {
  const {
    selectLayer,
    toggleVisible,
    toggleLocked,
    removeLayer,
    duplicateLayer,
    bringForward,
    sendBackward,
  } = useEditorStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = (id: string) => {
    if (renameValue.trim()) {
      useEditorStore.getState().updateLayer(id, { name: renameValue.trim() });
    }
    setRenamingId(null);
  };

  return (
    <div className="h-[40%] flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">对象列表</h3>
        <span className="text-xs text-text-secondary">({layers.length})</span>
      </div>
      <div className="flex-1 overflow-auto">
        {layers.length === 0 ? (
          <div className="p-3 text-sm text-text-secondary text-center">
            暂无对象
            <br />
            <span className="text-xs">点击素材或使用顶栏添加按钮</span>
          </div>
        ) : (
          layers.map((layer) => (
            <div
              key={layer.id}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 cursor-pointer text-sm group',
                selectedId === layer.id
                  ? 'bg-blue-50 border-l-2 border-l-primary'
                  : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              )}
              onClick={() => selectLayer(layer.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisible(layer.id);
                }}
                className="p-0.5 hover:text-primary"
                title={layer.visible ? '隐藏' : '显示'}
              >
                {layer.visible ? (
                  <Eye size={13} />
                ) : (
                  <EyeOff size={13} className="text-text-secondary" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLocked(layer.id);
                }}
                className="p-0.5 hover:text-primary"
                title={layer.locked ? '解锁' : '锁定'}
              >
                {layer.locked ? (
                  <Lock size={13} />
                ) : (
                  <Unlock size={13} className="text-text-secondary" />
                )}
              </button>
              <span className={cn('text-text-secondary', !layer.visible && 'opacity-40')}>
                {layer.type === 'image' ? <ImageIcon size={13} /> : <Type size={13} />}
              </span>
              {renamingId === layer.id ? (
                <div
                  className="flex-1 flex items-center gap-0.5 min-w-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(layer.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    className="flex-1 text-xs border border-primary rounded px-1 py-0 min-w-0"
                  />
                  <button onClick={() => commitRename(layer.id)} className="text-green-600 p-0.5">
                    <Check size={11} />
                  </button>
                  <button onClick={() => setRenamingId(null)} className="text-text-secondary p-0.5">
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <span
                  className={cn(
                    'flex-1 truncate',
                    !layer.visible && 'opacity-40 line-through',
                    layer.locked && 'italic'
                  )}
                >
                  {layer.name}
                </span>
              )}
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    bringForward(layer.id);
                  }}
                  className="p-0.5 text-text-secondary hover:text-primary"
                  title="上移一层"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendBackward(layer.id);
                  }}
                  className="p-0.5 text-text-secondary hover:text-primary"
                  title="下移一层"
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(layer.id, layer.name);
                  }}
                  className="p-0.5 text-text-secondary hover:text-primary"
                  title="重命名"
                >
                  <Edit3 size={11} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateLayer(layer.id);
                  }}
                  className="p-0.5 text-text-secondary hover:text-primary"
                  title="复制"
                >
                  <Copy size={11} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                  className="p-0.5 text-text-secondary hover:text-red-500"
                  title="删除"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PropertyPanel({ layer }: { layer: Layer | undefined }) {
  const { currentCard, viewState } = useWorkspaceStore();
  const { updateLayer } = useEditorStore();

  if (!currentCard) return null;

  if (!layer) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="px-3 py-2 border-b border-border">
          <h3 className="text-sm font-semibold text-text">属性</h3>
        </div>
        <div className="p-3 space-y-3">
          <div className="text-sm text-text-secondary mb-2">画布属性</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <PropField label="宽度" value={String(currentCard.canvasSize.width)} readOnly />
            <PropField label="高度" value={String(currentCard.canvasSize.height)} readOnly />
            <PropField label="缩放" value={`${Math.round(viewState.zoom * 100)}%`} readOnly />
            <PropField label="对象数" value={String(currentCard.layers.length)} readOnly />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-text">
          {layer.type === 'image' ? '图片' : '文字'}属性
        </h3>
      </div>
      <div className="p-3 space-y-3">
        <div className="text-xs text-text-secondary mb-1">位置与尺寸</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <PropField
            label="X"
            value={String(layer.x)}
            onChange={(v) => updateLayer(layer.id, { x: v })}
            type="number"
          />
          <PropField
            label="Y"
            value={String(layer.y)}
            onChange={(v) => updateLayer(layer.id, { y: v })}
            type="number"
          />
          <PropField
            label="宽"
            value={String(layer.width)}
            onChange={(v) => updateLayer(layer.id, { width: v })}
            type="number"
          />
          <PropField
            label="高"
            value={String(layer.height)}
            onChange={(v) => updateLayer(layer.id, { height: v })}
            type="number"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <PropField
            label="旋转"
            value={String(layer.rotation)}
            onChange={(v) => updateLayer(layer.id, { rotation: v })}
            type="number"
            suffix="°"
          />
          <PropField
            label="透明度"
            value={String(Math.round(layer.opacity * 100))}
            onChange={(v) => updateLayer(layer.id, { opacity: v / 100 })}
            type="number"
            suffix="%"
          />
        </div>

        {layer.type === 'text' && <TextPropertyPanel layer={layer as TextLayer} />}
      </div>
    </div>
  );
}

function TextPropertyPanel({ layer }: { layer: TextLayer }) {
  const { updateTextLayer } = useEditorStore();

  return (
    <>
      <div className="border-t border-border pt-3 mt-3">
        <div className="text-xs text-text-secondary mb-2">文字属性</div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-text-secondary block mb-0.5">内容</label>
            <textarea
              value={layer.content}
              onChange={(e) => updateTextLayer(layer.id, { content: e.target.value })}
              className="w-full text-xs border border-border rounded px-2 py-1 resize-none focus:outline-none focus:border-primary"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-secondary block mb-0.5">字体</label>
              <select
                value={layer.fontFamily}
                onChange={(e) => updateTextLayer(layer.id, { fontFamily: e.target.value })}
                className="w-full text-xs border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
              >
                <option value="sans-serif">无衬线</option>
                <option value="serif">衬线体</option>
                <option value="monospace">等宽体</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-0.5">字号</label>
              <input
                type="number"
                value={layer.fontSize}
                onChange={(e) => updateTextLayer(layer.id, { fontSize: Number(e.target.value) })}
                className="w-full text-xs border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-secondary block mb-0.5">字重</label>
              <select
                value={layer.fontWeight}
                onChange={(e) => updateTextLayer(layer.id, { fontWeight: Number(e.target.value) })}
                className="w-full text-xs border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
              >
                <option value={400}>常规</option>
                <option value={500}>中等</option>
                <option value={600}>半粗</option>
                <option value={700}>粗体</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-0.5">颜色</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={layer.color}
                  onChange={(e) => updateTextLayer(layer.id, { color: e.target.value })}
                  className="w-6 h-6 border border-border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={layer.color}
                  onChange={(e) => updateTextLayer(layer.id, { color: e.target.value })}
                  className="flex-1 text-xs border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-text-secondary block mb-0.5">对齐</label>
              <select
                value={layer.textAlign}
                onChange={(e) =>
                  updateTextLayer(layer.id, {
                    textAlign: e.target.value as 'left' | 'center' | 'right',
                  })
                }
                className="w-full text-xs border border-border rounded px-1 py-1 focus:outline-none focus:border-primary"
              >
                <option value="left">左</option>
                <option value="center">中</option>
                <option value="right">右</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-0.5">行高</label>
              <input
                type="number"
                value={layer.lineHeight}
                step={0.1}
                min={0.5}
                max={3}
                onChange={(e) => updateTextLayer(layer.id, { lineHeight: Number(e.target.value) })}
                className="w-full text-xs border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-0.5">字距</label>
              <input
                type="number"
                value={layer.letterSpacing}
                step={1}
                onChange={(e) =>
                  updateTextLayer(layer.id, { letterSpacing: Number(e.target.value) })
                }
                className="w-full text-xs border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PropField({
  label,
  value,
  onChange,
  readOnly = false,
  type = 'text',
  suffix,
}: {
  label: string;
  value: string;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  type?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="text-xs text-text-secondary block mb-0.5">{label}</label>
      {readOnly ? (
        <div className="px-2 py-1 bg-gray-50 rounded border border-border text-text text-xs">
          {value}
          {suffix}
        </div>
      ) : (
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={(e) => {
              const v = type === 'number' ? Number(e.target.value) : e.target.value;
              if (onChange && type === 'number' && !isNaN(v as number)) onChange(v as number);
            }}
            className="w-full text-xs border border-border rounded px-2 py-1 focus:outline-none focus:border-primary pr-5"
          />
          {suffix && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
