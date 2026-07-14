import { useWorkspaceStore } from '@/stores/workspaceStore';

export function StatusBar() {
  const { currentProject, currentCard, viewState, saveStatus } = useWorkspaceStore();

  const objectCount = currentCard?.layers.length ?? 0;
  const zoomPercent = Math.round(viewState.zoom * 100);

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
        <span>对象: {currentCard ? `${objectCount} Objects` : '-'}</span>
      </div>
      <div className="flex-1" />
      <span>{statusText}</span>
    </div>
  );
}
