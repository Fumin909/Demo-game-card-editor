import { useState } from 'react';
import { Plus, FolderOpen, Trash2, Calendar } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Dialog, Input } from '@/components/common/Dialog';

export function ProjectListPage() {
  const { projects, createProject, openProject, deleteProject, isLoading } = useWorkspaceStore();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [canvasWidth, setCanvasWidth] = useState('800');
  const [canvasHeight, setCanvasHeight] = useState('1100');

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    const project = await createProject(
      newProjectName.trim(),
      parseInt(canvasWidth) || 800,
      parseInt(canvasHeight) || 1100
    );
    setNewProjectName('');
    setShowNewDialog(false);
    await openProject(project.id);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background overflow-auto">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">🎴 卡牌编辑器</h1>
          <p className="text-text-secondary">
            Game Card Editor V2.0 - 创建、编辑和导出你的专属卡牌
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text">我的项目</h2>
          <button className="btn-primary" onClick={() => setShowNewDialog(true)}>
            <Plus size={16} />
            新建项目
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg border border-border p-12 text-center">
            <div className="text-5xl mb-4">📁</div>
            <p className="text-text-secondary mb-4">
              暂无项目，点击"新建项目"开始你的第一个卡牌项目
            </p>
            <button className="btn-primary mx-auto" onClick={() => setShowNewDialog(true)}>
              <Plus size={16} />
              创建第一个项目
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg border border-border p-4 hover:border-primary hover:shadow-md transition-all group cursor-pointer"
                onClick={() => openProject(project.id)}
              >
                <div className="aspect-[8/11] bg-gray-50 rounded-md mb-3 flex items-center justify-center border border-border/50 relative overflow-hidden">
                  <div className="text-text-secondary text-sm text-center px-2">
                    <FolderOpen size={40} className="mx-auto mb-2 opacity-40" />
                    {project.name}
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                      <Calendar size={12} />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      画布: {project.canvasSize.width} × {project.canvasSize.height}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `确定删除项目"${project.name}"吗？该项目下所有卡牌和素材都将被删除。`
                        )
                      ) {
                        deleteProject(project.id);
                      }
                    }}
                    className="p-1.5 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除项目"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog
          open={showNewDialog}
          onClose={() => setShowNewDialog(false)}
          title="新建项目"
          onConfirm={handleCreate}
          confirmText="创建"
        >
          <Input
            label="项目名称"
            value={newProjectName}
            onChange={setNewProjectName}
            placeholder="例如：三国杀扩展包"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="画布宽度 (px)"
              value={canvasWidth}
              onChange={setCanvasWidth}
              type="number"
            />
            <Input
              label="画布高度 (px)"
              value={canvasHeight}
              onChange={setCanvasHeight}
              type="number"
            />
          </div>
          <p className="text-xs text-text-secondary mt-1">标准卡牌尺寸建议 800 × 1100</p>
        </Dialog>
      </div>
    </div>
  );
}
