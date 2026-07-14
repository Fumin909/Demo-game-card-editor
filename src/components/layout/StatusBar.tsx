import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useEditorStore } from '@/stores/editorStore';

export function StatusBar() {
  const { currentProject, currentCard, viewState, saveStatus } = useWorkspaceStore();
  const { selectedLayerId } = useEditorStore();

  const objectCount = currentCard?.layers.length ?? 0;
  const zoomPercent = Math.round(viewState.zoom * 100);
  const selectedLayer =
    currentCard && selectedLayerId
      ? currentCard.layers.find((l) => l.id === selectedLayerId)
      : undefined;

  const statusText = {
    saved: '已保存',
    saving: '保存中...',
    unsaved: '未保存',
  }[saveStatus];

  const typeLabel =
    selectedLayer?.type === 'image' ? '图片' : selectedLayer?.type === 'text' ? '文字' : '';

  return (
    <div className="h-7 bg-white border-t border-border flex items-center px-3 text-[11px] text-text-secondary shrink-0 select-none gap-4">
      <span>{currentProject?.name ?? '无项目'}</span>
      <span className="text-border">|</span>
      <span>{currentCard?.name ?? '无卡牌'}</span>
      {currentCard && (
        <>
          <span className="text-border">|</span>
          <span>
            {currentCard.canvasSize.width}×{currentCard.canvasSize.height}
          </span>
          <span className="text-border">|</span>
          <span>{zoomPercent}%</span>
          <span className="text-border">|</span>
          <span>{objectCount} 个对象</span>
        </>
      )}
      {selectedLayer && (
        <>
          <span className="text-border">|</span>
          <span className="text-primary">
            {typeLabel}: {selectedLayer.name}
          </span>
          <span className="text-text-secondary/60">
            ({Math.round(selectedLayer.x)}, {Math.round(selectedLayer.y)}){' '}
            {Math.round(selectedLayer.width)}×{Math.round(selectedLayer.height)}
            {selectedLayer.rotation !== 0 && ` · ${Math.round(selectedLayer.rotation)}°`}
            {selectedLayer.opacity !== 1 && ` · ${Math.round(selectedLayer.opacity * 100)}%`}
            {selectedLayer.locked && ' · 🔒'}
            {!selectedLayer.visible && ' · 👁'}
          </span>
        </>
      )}
      <div className="flex-1" />
      <span
        className={
          saveStatus === 'unsaved'
            ? 'text-orange-500'
            : saveStatus === 'saving'
              ? 'text-blue-500'
              : 'text-green-500'
        }
      >
        {statusText}
      </span>
    </div>
  );
}
