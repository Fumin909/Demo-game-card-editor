import { useWorkspaceStore } from '@/stores/workspaceStore';

const DEFAULT_CANVAS_BG = '#FFFFFF';
const WORKSPACE_BG = '#E8E8EC';

export function CanvasArea() {
  const { currentCard, currentProject } = useWorkspaceStore();

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary">
        请先打开或创建一个项目
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div
        className="flex-1 flex items-center justify-center text-text-secondary"
        style={{ backgroundColor: WORKSPACE_BG }}
      >
        请选择一张卡牌开始编辑，或新建一张卡牌
      </div>
    );
  }

  const { canvasSize, layers } = currentCard;

  const scale = 0.6;
  const scaledWidth = canvasSize.width * scale;
  const scaledHeight = canvasSize.height * scale;

  return (
    <div className="flex-1 overflow-auto relative" style={{ backgroundColor: WORKSPACE_BG }}>
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div
          className="shadow-2xl relative"
          style={{
            width: scaledWidth,
            height: scaledHeight,
            backgroundColor: DEFAULT_CANVAS_BG,
          }}
        >
          {layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm">
              空白卡牌 - 使用顶栏按钮添加图片或文字
            </div>
          )}
          {layers
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((layer) => {
              if (!layer.visible) return null;
              if (layer.type === 'image') {
                return (
                  <div
                    key={layer.id}
                    className="absolute bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500"
                    style={{
                      left: layer.x * scale,
                      top: layer.y * scale,
                      width: layer.width * scale,
                      height: layer.height * scale,
                      transform: `rotate(${layer.rotation}deg)`,
                      opacity: layer.opacity,
                    }}
                  >
                    🖼 {layer.name}
                  </div>
                );
              }
              return (
                <div
                  key={layer.id}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: layer.x * scale,
                    top: layer.y * scale,
                    width: layer.width * scale,
                    height: layer.height * scale,
                    transform: `rotate(${layer.rotation}deg)`,
                    opacity: layer.opacity,
                    color: layer.color,
                    fontSize: layer.fontSize * scale,
                    fontWeight: layer.fontWeight,
                    fontFamily: layer.fontFamily,
                    textAlign: layer.textAlign,
                    lineHeight: layer.lineHeight,
                    letterSpacing: layer.letterSpacing,
                  }}
                >
                  {layer.content || `📝 ${layer.name}`}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
