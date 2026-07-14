import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useEditorStore } from '@/stores/editorStore';

export function StatusBar() {
  const { currentProject, currentCard, viewState, saveStatus } = useWorkspaceStore();
  const { selectedLayerId } = useEditorStore();

  const objectCount = currentCard?.layers.length ?? 0;
  const zoomPercent = Math.round(viewState.zoom * 100);
  const selectedLayer = selectedLayerId
    ? currentCard?.layers.find((l) => l.id === selectedLayerId)
    : null;

  const statusText = {
    saved: '已保存',
    saving: '保存中...',
    unsaved: '未保存',
  }[saveStatus];

  return (
    <div className="h-8 bg-white border-t border-border flex items-center px-4 text-xs text-text-secondary shrink-0 select-none">
      <div className="flex items-center gap-4">
        <span>项目: {currentProject?.name ?? '-'}</span>
        <span>卡牌: {currentCard?.name ?? '-'}</span>
        <span>缩放: {currentCard ? `${zoomPercent}%` : '-'}</span>
        <span>对象: {currentCard ? `${objectCount}` : '-'}</span>
        {selectedLayer && (
          <span className="text-primary">
            选中: {selectedLayer.name} ({Math.round(selectedLayer.x)}, {Math.round(selectedLayer.y)}
            ) {Math.round(selectedLayer.width)}×{Math.round(selectedLayer.height)}
          </span>
        )}
      </div>
      <div className="flex-1" />
      <span className={saveStatus === 'unsaved' ? 'text-orange-500' : ''}>{statusText}</span>
    </div>
  );
}
