import {
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  ImagePlus,
  Type,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useEditorStore } from '@/stores/editorStore';

export function TopBar() {
  const { currentProject, currentCard, closeProject, viewState, setViewState, saveStatus } =
    useWorkspaceStore();
  const { addTextLayer, saveCard } = useEditorStore();

  const handleSave = async () => {
    if (!currentCard) return;
    await saveCard();
  };

  return (
    <div className="h-12 bg-white border-b border-border flex items-center px-4 gap-1 shrink-0 select-none">
      <div className="flex items-center gap-1 pr-3 border-r border-border mr-2">
        <button
          className="btn-icon"
          title="返回项目列表"
          onClick={() => currentProject && closeProject()}
        >
          <FolderOpen size={18} />
        </button>
        <button className="btn-icon" title="保存" disabled={!currentCard} onClick={handleSave}>
          <Save size={18} />
          {saveStatus === 'unsaved' && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-r border-border mr-2">
        <button className="btn-icon" title="撤销" disabled={!currentCard}>
          <Undo2 size={18} />
        </button>
        <button className="btn-icon" title="重做" disabled={!currentCard}>
          <Redo2 size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-r border-border mr-2">
        <button
          className="btn-icon"
          title="添加图片（在素材库中点击图片添加）"
          disabled={!currentCard}
        >
          <ImagePlus size={18} />
        </button>
        <button
          className="btn-icon"
          title="添加文字"
          disabled={!currentCard}
          onClick={addTextLayer}
        >
          <Type size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-r border-border mr-2">
        <button className="btn-icon" title="导出 PNG" disabled={!currentCard}>
          <Download size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-r border-border mr-2">
        <button
          className="btn-icon"
          title="缩小"
          onClick={() => setViewState({ zoom: Math.max(0.1, viewState.zoom - 0.1) })}
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-xs text-text-secondary w-10 text-center">
          {Math.round(viewState.zoom * 100)}%
        </span>
        <button
          className="btn-icon"
          title="放大"
          onClick={() => setViewState({ zoom: Math.min(5, viewState.zoom + 0.1) })}
        >
          <ZoomIn size={18} />
        </button>
        <button className="btn-icon" title="适应窗口">
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="flex-1" />

      {currentProject && (
        <div className="text-sm text-text-secondary flex items-center gap-2">
          <span>
            {currentProject.name}
            {currentCard && ` / ${currentCard.name}`}
          </span>
          {saveStatus === 'unsaved' && <span className="text-[10px] text-orange-500">未保存</span>}
          {saveStatus === 'saving' && <span className="text-[10px] text-primary">保存中...</span>}
          {saveStatus === 'saved' && currentCard && (
            <span className="text-[10px] text-green-500">已保存</span>
          )}
        </div>
      )}
    </div>
  );
}
