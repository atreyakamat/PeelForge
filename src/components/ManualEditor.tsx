import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ManualEditorProps {
  originalImage: string;
  maskData: Uint8Array;
  width: number;
  height: number;
  onMaskUpdate: (newMask: Uint8Array) => void;
}

interface Point {
  x: number;
  y: number;
}

type EditMode = 'remove' | 'restore';

export const ManualEditor: React.FC<ManualEditorProps> = ({
  originalImage,
  maskData,
  width,
  height,
  onMaskUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('remove');
  const [brushSize, setBrushSize] = useState(20);
  const [currentMask, setCurrentMask] = useState<Uint8Array>(new Uint8Array(maskData));
  const [showCursor, setShowCursor] = useState(false);

  // Initialize canvas with original image and current mask
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d')!;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;

    // Load and draw the original image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      updatePreview();
    };
    img.src = originalImage;
  }, [originalImage, width, height]);

  // Update mask data when prop changes
  useEffect(() => {
    setCurrentMask(new Uint8Array(maskData));
  }, [maskData]);

  // Update preview with current mask
  const updatePreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Apply current mask
    for (let i = 0; i < currentMask.length; i++) {
      const pixelIndex = i * 4;
      imageData.data[pixelIndex + 3] = currentMask[i]; // Set alpha
    }
    
    ctx.putImageData(imageData, 0, 0);
  }, [currentMask, width, height]);

  // Update preview when mask changes
  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Draw brush cursor
  const drawCursor = useCallback((x: number, y: number) => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const ctx = overlayCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    
    if (showCursor) {
      // Draw solid brush cursor
      ctx.fillStyle = editMode === 'remove' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(68, 255, 68, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw solid border
      ctx.strokeStyle = editMode === 'remove' ? '#ff4444' : '#44ff44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }, [brushSize, editMode, showCursor]);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, [width, height]);

  // Apply brush stroke to mask
  const applyBrushStroke = useCallback((x: number, y: number) => {
    const newMask = new Uint8Array(currentMask);
    const radius = brushSize / 2;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          const pixelX = Math.round(x + dx);
          const pixelY = Math.round(y + dy);
          
          if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
            const index = pixelY * width + pixelX;
            if (index >= 0 && index < newMask.length) {
              // Apply solid brush - fully opaque or fully transparent
              newMask[index] = editMode === 'remove' ? 0 : 255;
            }
          }
        }
      }
    }

    setCurrentMask(newMask);
    onMaskUpdate(newMask);
  }, [currentMask, brushSize, editMode, width, height, onMaskUpdate]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    applyBrushStroke(pos.x, pos.y);
  }, [getMousePos, applyBrushStroke]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    drawCursor(pos.x, pos.y);

    if (isDrawing) {
      applyBrushStroke(pos.x, pos.y);
    }
  }, [getMousePos, drawCursor, isDrawing, applyBrushStroke]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setShowCursor(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowCursor(false);
    setIsDrawing(false);
    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      const ctx = overlayCanvas.getContext('2d')!;
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
  }, []);

  return (
    <div className="manual-editor">
      <div className="editor-controls">
        <div className="mode-controls">
          <button 
            className={`mode-btn ${editMode === 'remove' ? 'active' : ''}`}
            onClick={() => setEditMode('remove')}
          >
            🗑️ Remove
          </button>
          <button 
            className={`mode-btn ${editMode === 'restore' ? 'active' : ''}`}
            onClick={() => setEditMode('restore')}
          >
            ↩️ Restore
          </button>
        </div>
        
        <div className="brush-controls">
          <label htmlFor="brush-size">Brush Size: {brushSize}px</label>
          <input
            id="brush-size"
            type="range"
            min="5"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="brush-slider"
          />
        </div>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="editor-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        <canvas
          ref={overlayCanvasRef}
          className="overlay-canvas"
          style={{ pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
};