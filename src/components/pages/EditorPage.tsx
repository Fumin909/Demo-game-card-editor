import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { LeftPanel } from '@/components/layout/LeftPanel';
import { CanvasArea } from '@/components/layout/CanvasArea';
import { RightPanel } from '@/components/layout/RightPanel';
import { StatusBar } from '@/components/layout/StatusBar';
import { Dialog, Input } from '@/components/common/Dialog';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function EditorPage() {
  const { currentProject, createCard, openCard } = useWorkspaceStore();
  const [showNewCardDialog, setShowNewCardDialog] = useState(false);
  const [newCardName, setNewCardName] = useState('');

  const handleCreateCard = async () => {
    if (!newCardName.trim() || !currentProject) return;
    const card = await createCard(newCardName.trim());
    setNewCardName('');
    setShowNewCardDialog(false);
    await openCard(card.id);
  };

  if (!currentProject) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel onNewCard={() => setShowNewCardDialog(true)} />
        <CanvasArea />
        <RightPanel />
      </div>
      <StatusBar />

      <Dialog
        open={showNewCardDialog}
        onClose={() => setShowNewCardDialog(false)}
        title="新建卡牌"
        onConfirm={handleCreateCard}
        confirmText="创建"
      >
        <Input
          label="卡牌名称"
          value={newCardName}
          onChange={setNewCardName}
          placeholder="例如：关羽"
          autoFocus
        />
        <p className="text-xs text-text-secondary">
          画布尺寸: {currentProject.canvasSize.width} × {currentProject.canvasSize.height} px
        </p>
      </Dialog>
    </div>
  );
}
