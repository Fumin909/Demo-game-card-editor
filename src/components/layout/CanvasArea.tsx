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
import { generateId } from '@/lib/utils';

const WORKSPACE_BG = '#E8E8EC';
const CANVAS_BG = '#FFFFFF';
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

interface TextEditState {
  layerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

export function CanvasArea() {
  const { currentCard, currentProject, assets, viewState, setViewState } = useWorkspaceStore();
  const { selectedLayerId, selectLayer, updateLayer, updateTextLayer, setIsDragging } =
    useEditorStore();

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const assetMap = useMemo(() => {
    const map = new Map<string, HTMLImageElement>();
    for (const a of assets) {
      const img = new window.Image();
      img.src = a.dataUrl;
      map.set(a.id, img);
    }
    return map;
  }, [assets]);

  const fitToWindow = useCallback(() => {
    const el = containerRef.current;
    if (!el || !currentCard) return;
    const { canvasSize } = currentCard;
    const fitScale = Math.min(
      (el.clientWidth - 80) / canvasSize.width,
      (el.clientHeight - 80) / canvasSize.height
    );
    setViewState({
      zoom: fitScale,
      offsetX: (el.clientWidth - canvasSize.width * fitScale) / 2,
      offsetY: (el.clientHeight - canvasSize.height * fitScale) / 2,
    });
  }, [currentCard, setViewState]);

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
    (window as any).__canvasFitWindow = fitToWindow;
    return () => {
      delete (window as any).__canvasFitWindow;
    };
  }, [fitToWindow]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (textEdit) return;
      if (e.code === 'Space' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
          return;
        e.preventDefault();
        setSpacePressed(true);
      }
      if ((e.code === 'Delete' || e.code === 'Backspace') && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
          return;
        const { selectedLayerId, removeLayer } = useEditorStore.getState();
        if (selectedLayerId) {
          removeLayer(selectedLayerId);
        }
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        useEditorStore.getState().saveCard();
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
  }, [textEdit]);

  const updateTransformer = useCallback(() => {
    const stage = stageRef.current;
    const tr = transformerRef.current;
    if (!stage || !tr) return;
    if (selectedLayerId && !textEdit) {
      const node = stage.findOne(`#${selectedLayerId}`);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedLayerId, textEdit]);

  useEffect(() => {
    updateTransformer();
  }, [updateTransformer, currentCard?.layers]);

  useEffect(() => {
    if (textEdit && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [textEdit]);

  const commitTextEdit = useCallback(() => {
    if (!textEdit) return;
    updateTextLayer(textEdit.layerId, { content: textEdit.content });
    setTextEdit(null);
  }, [textEdit, updateTextLayer]);

  const handleDoubleClickText = useCallback(
    (layer: TextLayerType) => {
      if (layer.locked) return;
      const stage = stageRef.current;
      const container = containerRef.current;
      if (!stage || !container) return;
      const node = stage.findOne(`#${layer.id}`);
      if (!node) return;
      const stageBox = stage.container().getBoundingClientRect();
      const contBox = container.getBoundingClientRect();
      const absPos = node.absolutePosition();
      setTextEdit({
        layerId: layer.id,
        x: absPos.x + (stageBox.left - contBox.left),
        y: absPos.y + (stageBox.top - contBox.top),
        width: layer.width * viewState.zoom,
        height: (layer.height > 0 ? layer.height : layer.fontSize * 2) * viewState.zoom,
        rotation: layer.rotation,
        content: layer.content,
        fontFamily: layer.fontFamily,
        fontSize: layer.fontSize * viewState.zoom,
        fontWeight: layer.fontWeight,
        color: layer.color,
        textAlign: layer.textAlign,
        lineHeight: layer.lineHeight,
        letterSpacing: layer.letterSpacing,
      });
    },
    [viewState.zoom]
  );

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
      if (textEdit) {
        commitTextEdit();
        return;
      }
      if (e.target === e.target.getStage()) {
        selectLayer(null);
      }
    },
    [selectLayer, textEdit, commitTextEdit]
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

  const getStageCoordsFromDOMEvent = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const x = (clientX - rect.left - viewState.offsetX) / viewState.zoom;
      const y = (clientY - rect.top - viewState.offsetY) / viewState.zoom;
      return { x, y };
    },
    [viewState]
  );

  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleContainerDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setIsDragOver(false);
    }
  }, []);

  const handleContainerDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const assetId = e.dataTransfer.getData('application/x-asset-id');
      if (!assetId) return;
      const coords = getStageCoordsFromDOMEvent(e.clientX, e.clientY);
      const asset = assets.find((a) => a.id === assetId);
      if (!asset || !coords) return;
      const { currentCard } = useWorkspaceStore.getState();
      if (!currentCard) return;
      const newLayer: Layer = {
        id: generateId(),
        type: 'image',
        name: asset.name,
        x: Math.round(coords.x - Math.min(asset.width, 200) / 2),
        y: Math.round(coords.y - Math.min(asset.height, 200) / 2),
        width: Math.min(asset.width, currentCard.canvasSize.width * 0.4),
        height: Math.min(asset.height, currentCard.canvasSize.height * 0.3),
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: currentCard.layers.reduce((m, l) => Math.max(m, l.zIndex), 0) + 10,
        assetId: asset.id,
      };
      useWorkspaceStore.setState({
        currentCard: { ...currentCard, layers: [...currentCard.layers, newLayer] },
        saveStatus: 'unsaved',
      });
      selectLayer(newLayer.id);
    },
    [assets, getStageCoordsFromDOMEvent, selectLayer]
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
  const canvasLeft =
    stageSize.width / 2 / viewState.zoom -
    viewState.offsetX / viewState.zoom -
    canvasSize.width / 2;
  const canvasTop =
    stageSize.height / 2 / viewState.zoom -
    viewState.offsetY / viewState.zoom -
    canvasSize.height / 2;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative"
      style={{
        backgroundColor: WORKSPACE_BG,
        cursor: spacePressed ? 'grab' : isDragOver ? 'copy' : 'default',
      }}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 border-4 border-dashed border-primary bg-primary/5 z-10 pointer-events-none flex items-center justify-center">
          <div className="bg-white/90 px-4 py-2 rounded-lg shadow-md text-primary font-medium">
            释放以添加图片到画布
          </div>
        </div>
      )}

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
        draggable={spacePressed && !textEdit}
        onDragEnd={(e) => {
          setViewState({
            offsetX: e.target.x(),
            offsetY: e.target.y(),
          });
        }}
      >
        <KLayer>
          <Rect
            x={canvasLeft}
            y={canvasTop}
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
                  draggable={!layer.locked && !textEdit}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    if (textEdit) return;
                    selectLayer(layer.id);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    if (textEdit) return;
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
                fontStyle={textLayer.fontWeight >= 700 ? 'bold' : 'normal'}
                fill={textLayer.color}
                align={textLayer.textAlign}
                lineHeight={textLayer.lineHeight}
                letterSpacing={textLayer.letterSpacing}
                draggable={!layer.locked && !textEdit}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (textEdit) return;
                  selectLayer(layer.id);
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  if (textEdit) return;
                  selectLayer(layer.id);
                }}
                onDblClick={() => handleDoubleClickText(textLayer)}
                onDblTap={() => handleDoubleClickText(textLayer)}
                onDragStart={() => {
                  setIsDragging(true);
                  selectLayer(layer.id);
                }}
                onDragEnd={(e) => handleDragEnd(layer.id, e)}
                onTransformEnd={(e) => handleTransformEnd(layer.id, e)}
                listening={!textEdit}
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
            borderStrokeWidth={1.5 / viewState.zoom}
            anchorStroke="#3B82F6"
            anchorFill="#FFFFFF"
            anchorSize={8 / viewState.zoom}
            anchorCornerRadius={2 / viewState.zoom}
            rotateAnchorOffset={20 / viewState.zoom}
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
            visible={!textEdit}
          />
        </KLayer>
      </Stage>

      {textEdit && (
        <textarea
          ref={textareaRef}
          value={textEdit.content}
          onChange={(e) => setTextEdit({ ...textEdit, content: e.target.value })}
          onBlur={commitTextEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setTextEdit(null);
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitTextEdit();
            }
          }}
          style={{
            position: 'absolute',
            left: textEdit.x,
            top: textEdit.y,
            width: textEdit.width + 4,
            height: textEdit.height + 4,
            transform: `rotate(${textEdit.rotation}deg)`,
            transformOrigin: 'center center',
            fontSize: textEdit.fontSize,
            fontFamily: textEdit.fontFamily,
            fontWeight: textEdit.fontWeight,
            color: textEdit.color,
            textAlign: textEdit.textAlign,
            lineHeight: textEdit.lineHeight,
            letterSpacing: textEdit.letterSpacing,
            border: '2px solid #3B82F6',
            borderRadius: 2,
            padding: '0px 4px',
            margin: 0,
            background: 'rgba(255,255,255,0.95)',
            resize: 'none',
            outline: 'none',
            overflow: 'hidden',
            zIndex: 20,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        />
      )}

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
          onClick={fitToWindow}
          className="text-text-secondary hover:text-text px-1 text-xs border-l border-border pl-2"
        >
          适应
        </button>
      </div>
    </div>
  );
}
