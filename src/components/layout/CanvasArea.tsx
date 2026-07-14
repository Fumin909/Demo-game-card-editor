import { useMemo } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const DEFAULT_CANVAS_BG = '#FFFFFF';
const WORKSPACE_BG = '#E8E8EC';

export function CanvasArea() {
  const { currentCard, currentProject, assets, viewState } = useWorkspaceStore();

  const assetMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assets) {
      map.set(a.id, a.dataUrl);
    }
    return map;
  }, [assets]);

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
  const scale = viewState.zoom * 0.6;
  const scaledWidth = canvasSize.width * scale;
  const scaledHeight = canvasSize.height * scale;

  return (
    <div className="flex-1 overflow-auto relative" style={{ backgroundColor: WORKSPACE_BG }}>
      <div
        className="absolute inset-0 flex items-center justify-center p-8"
        style={{
          transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px)`,
        }}
      >
        <div
          className="shadow-2xl relative overflow-hidden"
          style={{
            width: scaledWidth,
            height: scaledHeight,
            backgroundColor: DEFAULT_CANVAS_BG,
          }}
        >
          {layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm pointer-events-none">
              空白卡牌 - 点击素材或使用顶栏按钮添加内容
            </div>
          )}
          {layers
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((layer) => {
              if (!layer.visible) return null;
              const layerStyle: React.CSSProperties = {
                left: layer.x * scale,
                top: layer.y * scale,
                width: layer.width * scale,
                height: layer.height * scale,
                transform: `rotate(${layer.rotation}deg)`,
                transformOrigin: 'center center',
                opacity: layer.opacity,
              };

              if (layer.type === 'image') {
                const dataUrl = assetMap.get(layer.assetId);
                return (
                  <div key={layer.id} className="absolute" style={layerStyle}>
                    {dataUrl ? (
                      <img
                        src={dataUrl}
                        alt={layer.name}
                        className="w-full h-full object-fill select-none pointer-events-none"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-500">
                        {layer.assetId ? '图片未找到' : '🖼 ' + layer.name}
                      </div>
                    )}
                  </div>
                );
              }

              const alignMap: Record<string, string> = {
                left: 'flex-start',
                center: 'center',
                right: 'flex-end',
              };

              return (
                <div
                  key={layer.id}
                  className="absolute flex overflow-hidden whitespace-pre-wrap break-words"
                  style={{
                    ...layerStyle,
                    color: layer.color,
                    fontSize: layer.fontSize * scale,
                    fontWeight: layer.fontWeight,
                    fontFamily: layer.fontFamily,
                    justifyContent: alignMap[layer.textAlign] || 'flex-start',
                    alignItems: 'flex-start',
                    lineHeight: layer.lineHeight,
                    letterSpacing: `${layer.letterSpacing * scale}px`,
                    textAlign: layer.textAlign,
                  }}
                >
                  <span>{layer.content || ''}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
