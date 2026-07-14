import { useEffect } from 'react';
import { ProjectListPage } from '@/components/pages/ProjectListPage';
import { EditorPage } from '@/components/pages/EditorPage';
import { useWorkspaceStore } from '@/stores/workspaceStore';

function App() {
  const { initialize, currentProject, isLoading } = useWorkspaceStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">加载中...</div>
      </div>
    );
  }

  return currentProject ? <EditorPage /> : <ProjectListPage />;
}

export default App;
