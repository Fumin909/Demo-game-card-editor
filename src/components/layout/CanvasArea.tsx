import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Stage,
  Layer as KLayer,
  Rect,
  Image as KImage,
  Text as KText,
  Transformer,
} from 'react-konva';
import type Konva from 'konva';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useEditorStore } from '@/stores/editorStore';
import type { ImageLayer as ImageLayerType, TextLayer as TextLayerType, Layer } from '@/types';

const WORKSPACE_BG = '#E8E8EC';
const CANVAS_BG = '#FFFFFF';
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

export function CanvasArea() {
  const { currentCard, currentProject, assets, viewState, setViewState } = useWorkspaceStore();
  const { selectedLayerId, selectLayer, updateLayer, setIsDragging } = useEditorStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  const assetMap = useMemo(() => {
    const map = new Map<string, HTMLImageElement>();
    for (const a of assets) {
      const img = new window.Image();
      img.src = a.dataUrl;
      map.set(a.id, img);
    }
    return map;
  }, [assets]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setStageSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        const { selectedLayerId, removeLayer } = useEditorStore.getState();
        if (selectedLayerId) {
          removeLayer(selectedLayerId);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const updateTransformer = useCallback(() => {
    const stage = stageRef.current;
    const tr = transformerRef.current;
    if (!stage || !tr) return;
    if (selectedLayerId) {
      const node = stage.findOne(`#${selectedLayerId}`);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedLayerId]);

  useEffect(() => {
    updateTransformer();
  }, [updateTransformer, currentCard?.layers]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      if (e.evt.ctrlKey || e.evt.metaKey) {
        const oldScale = viewState.zoom;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const mousePointTo = {
          x: (pointer.x - viewState.offsetX) / oldScale,
          y: (pointer.y - viewState.offsetY) / oldScale,
        };
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const factor = 1 + 0.05 * direction;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldScale * factor));
        setViewState({
          zoom: newScale,
          offsetX: pointer.x - mousePointTo.x * newScale,
          offsetY: pointer.y - mousePointTo.y * newScale,
        });
      } else {
        setViewState({
          offsetX: viewState.offsetX - e.evt.deltaX,
          offsetY: viewState.offsetY - e.evt.deltaY,
        });
      }
    },
    [viewState, setViewState]
  );

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        selectLayer(null);
      }
    },
    [selectLayer]
  );

  const handleDragEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      updateLayer(id, {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
      } as Partial<Layer>);
      setIsDragging(false);
    },
    [updateLayer, setIsDragging]
  );

  const handleTransformEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      updateLayer(id, {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        width: Math.round(Math.max(5, node.width() * scaleX)),
        height: Math.round(Math.max(5, node.height() * scaleY)),
        rotation: Math.round(node.rotation()),
      } as Partial<Layer>);
    },
    [updateLayer]
  );

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
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{ backgroundColor: WORKSPACE_BG, cursor: spacePressed ? 'grab' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={viewState.zoom}
        scaleY={viewState.zoom}
        x={viewState.offsetX}
        y={viewState.offsetY}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        draggable={spacePressed}
        onDragEnd={(e) => {
          setViewState({
            offsetX: e.target.x(),
            offsetY: e.target.y(),
          });
        }}
      >
        <KLayer>
          <Rect
            x={
              stageSize.width / 2 / viewState.zoom -
              viewState.offsetX / viewState.zoom -
              canvasSize.width / 2
            }
            y={
              stageSize.height / 2 / viewState.zoom -
              viewState.offsetY / viewState.zoom -
              canvasSize.height / 2
            }
            width={canvasSize.width}
            height={canvasSize.height}
            fill={CANVAS_BG}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={20}
            shadowOffsetX={4}
            shadowOffsetY={4}
          />
          {sortedLayers.map((layer) => {
            if (!layer.visible) return null;

            if (layer.type === 'image') {
              const imgLayer = layer as ImageLayerType;
              const imgEl = assetMap.get(imgLayer.assetId);
              return (
                <KImage
                  key={layer.id}
                  id={layer.id}
                  image={imgEl}
                  x={layer.x}
                  y={layer.y}
                  width={layer.width}
                  height={layer.height}
                  rotation={layer.rotation}
                  opacity={layer.opacity}
                  draggable={!layer.locked}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    selectLayer(layer.id);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    selectLayer(layer.id);
                  }}
                  onDragStart={() => {
                    setIsDragging(true);
                    selectLayer(layer.id);
                  }}
                  onDragEnd={(e) => handleDragEnd(layer.id, e)}
                  onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
                />
              );
            }

            const textLayer = layer as TextLayerType;
            return (
              <KText
                key={layer.id}
                id={layer.id}
                text={textLayer.content || ''}
                x={layer.x}
                y={layer.y}
                width={layer.width}
                height={layer.height}
                rotation={layer.rotation}
                opacity={layer.opacity}
                fontSize={textLayer.fontSize}
                fontFamily={textLayer.fontFamily}
                fontStyle={
                  textLayer.fontWeight >= 700
                    ? 'bold'
                    : textLayer.fontWeight >= 500
                      ? 'italic'
                      : 'normal'
                }
                fill={textLayer.color}
                align={textLayer.textAlign}
                lineHeight={textLayer.lineHeight}
                letterSpacing={textLayer.letterSpacing}
                draggable={!layer.locked}
                onClick={(e) => {
                  e.cancelBubble = true;
                  selectLayer(layer.id);
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  selectLayer(layer.id);
                }}
                onDragStart={() => {
                  setIsDragging(true);
                  selectLayer(layer.id);
                }}
                onDragEnd={(e) => handleDragEnd(layer.id, e)}
                onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
              />
            );
          })}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
            borderStroke="#3B82F6"
            borderStrokeWidth={1.5}
            anchorStroke="#3B82F6"
            anchorFill="#FFFFFF"
            anchorSize={8}
            rotateAnchorOffset={20}
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
              'middle-left',
              'middle-right',
              'top-center',
              'bottom-center',
            ]}
          />
        </KLayer>
      </Stage>

      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 rounded-md shadow-sm border border-border px-2 py-1">
        <button
          onClick={() => setViewState({ zoom: Math.max(MIN_ZOOM, viewState.zoom - 0.1) })}
          className="text-text-secondary hover:text-text px-1 text-sm"
        >
          −
        </button>
        <span className="text-xs text-text-secondary w-12 text-center">
          {Math.round(viewState.zoom * 100)}%
        </span>
        <button
          onClick={() => setViewState({ zoom: Math.min(MAX_ZOOM, viewState.zoom + 0.1) })}
          className="text-text-secondary hover:text-text px-1 text-sm"
        >
          +
        </button>
        <button
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            const fitScale = Math.min(
              (el.clientWidth - 80) / canvasSize.width,
              (el.clientHeight - 80) / canvasSize.height
            );
            setViewState({
              zoom: fitScale,
              offsetX: (el.clientWidth - canvasSize.width * fitScale) / 2,
              offsetY: (el.clientHeight - canvasSize.height * fitScale) / 2,
            });
          }}
          className="text-text-secondary hover:text-text px-1 text-xs border-l border-border pl-2"
        >
          适应
        </button>
      </div>
    </div>
  );
}
