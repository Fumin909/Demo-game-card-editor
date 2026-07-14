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

export function TopBar() {
  const { currentProject, currentCard, closeProject } = useWorkspaceStore();

  return (
    <div className="h-12 bg-white border-b border-border flex items-center px-4 gap-1 shrink-0 select-none">
      <div className="flex items-center gap-1 pr-3 border-r border-border mr-2">
        <button
          className="btn-icon"
          title="打开项目"
          onClick={() => currentProject && closeProject()}
        >
          <FolderOpen size={18} />
        </button>
        <button className="btn-icon" title="保存" disabled={!currentCard}>
          <Save size={18} />
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
        <button className="btn-icon" title="添加图片" disabled={!currentCard}>
          <ImagePlus size={18} />
        </button>
        <button className="btn-icon" title="添加文字" disabled={!currentCard}>
          <Type size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-r border-border mr-2">
        <button className="btn-icon" title="导出 PNG" disabled={!currentCard}>
          <Download size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-r border-border mr-2">
        <button className="btn-icon" title="放大">
          <ZoomIn size={18} />
        </button>
        <button className="btn-icon" title="缩小">
          <ZoomOut size={18} />
        </button>
        <button className="btn-icon" title="适应窗口">
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="flex-1" />

      {currentProject && (
        <div className="text-sm text-text-secondary">
          {currentProject.name}
          {currentCard && ` / ${currentCard.name}`}
        </div>
      )}
    </div>
  );
}
