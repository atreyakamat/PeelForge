import { useState, useRef, useCallback } from "react";
import { useRmbg } from "./useRmbg";
import { ManualEditor } from "./components/ManualEditor";

interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
}

function App() {
  const { ready, loading, error, progress, removeBackground, hasWebGPU } = useRmbg();
  const [original, setOriginal] = useState<ImageData | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [currentMask, setCurrentMask] = useState<Uint8Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (PNG, JPG, JPEG, or WebP)");
      return false;
    }

    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return false;
    }

    return true;
  };

  const generateResultImage = useCallback((img: HTMLImageElement, maskData: Uint8Array) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;

    // Get original image data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.drawImage(img, 0, 0);
    const originalData = tempCtx.getImageData(0, 0, img.width, img.height);

    // Apply mask to create transparent background
    const imageData = ctx.createImageData(img.width, img.height);

    for (let i = 0; i < maskData.length; i++) {
      const pixelIndex = i * 4;
      const alpha = maskData[i];
      
      imageData.data[pixelIndex + 0] = originalData.data[pixelIndex + 0]; // R
      imageData.data[pixelIndex + 1] = originalData.data[pixelIndex + 1]; // G
      imageData.data[pixelIndex + 2] = originalData.data[pixelIndex + 2]; // B
      imageData.data[pixelIndex + 3] = alpha; // A
    }

    ctx.putImageData(imageData, 0, 0);
    setResult(canvas.toDataURL("image/png"));
  }, []);

  const handleMaskUpdate = useCallback((newMask: Uint8Array) => {
    if (!original) return;
    
    setCurrentMask(newMask);
    
    // Create new image with updated mask
    const img = new Image();
    img.onload = () => {
      generateResultImage(img, newMask);
    };
    img.src = original.url;
  }, [original, generateResultImage]);

  const processImageFile = useCallback(async (file: File) => {
    if (!validateImageFile(file)) return;

    const url = URL.createObjectURL(file);
    
    try {
      const img = new Image();
      img.src = url;
      await img.decode();

      setOriginal({
        file,
        url,
        width: img.width,
        height: img.height
      });
      setResult(null);
      setProcessingError(null);

      if (!ready) {
        alert("Please wait for the AI model to finish loading");
        return;
      }

      setProcessing(true);

      const output = await removeBackground(img);

      // Store the mask for manual editing
      setCurrentMask(new Uint8Array(output.mask.data));

      // Create transparent cutout
      generateResultImage(img, output.mask.data);

    } catch (error) {
      console.error("Error processing image:", error);
      setProcessingError(error instanceof Error ? error.message : "Failed to process image");
    } finally {
      setProcessing(false);
    }
  }, [ready, removeBackground]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  }, [processImageFile]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const download = () => {
    if (!result || !original) return;
    
    const a = document.createElement("a");
    a.href = result;
    const filename = original.file.name.replace(/\.[^/.]+$/, "") + "_no_bg.png";
    a.download = filename;
    a.click();
  };

  const reset = () => {
    if (original?.url) {
      URL.revokeObjectURL(original.url);
    }
    setOriginal(null);
    setResult(null);
    setCurrentMask(null);
    setShowManualEditor(false);
    setProcessingError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadTestImage = async () => {
    try {
      const response = await fetch('/alonso-original.jpg');
      const blob = await response.blob();
      const file = new File([blob], 'alonso-original.jpg', { type: 'image/jpeg' });
      processImageFile(file);
    } catch (error) {
      console.error('Failed to load test image:', error);
      alert('Failed to load test image. Make sure alonso-original.jpg is in the public folder.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🪄 PeelForge Background Remover</h1>
        <p>Remove backgrounds from images instantly in your browser</p>
        {hasWebGPU && (
          <div className="webgpu-badge">
            ⚡ WebGPU Accelerated
          </div>
        )}
      </header>

      <main className="app-main">
        {!original && (
          <div className="upload-section">
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''} ${(!ready || processing) ? 'disabled' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleUploadClick}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png,image/jpg,image/jpeg,image/webp" 
                onChange={handleFileInput} 
                disabled={!ready || processing}
                className="file-input"
              />
              
              <div className="upload-content">
                <div className="upload-icon">📁</div>
                <h3>
                  {processing ? "Processing..." : 
                   dragActive ? "Drop your image here" : 
                   "Drag & drop an image or click to upload"}
                </h3>
                <p>Supports PNG, JPG, JPEG, WebP • Max 10MB</p>
              </div>
            </div>
            
            {loading && (
              <div className="status loading">
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p>🔄 Loading AI model... {progress}%</p>
                  <small>This happens only once and may take a few seconds</small>
                </div>
              </div>
            )}
            
            {error && (
              <div className="status error">
                <p>⚠️ {error}</p>
                <button onClick={() => window.location.reload()} className="retry-btn">
                  🔄 Retry
                </button>
              </div>
            )}
            
            {ready && !loading && !error && (
              <div className="status ready">
                <p>✅ Ready! Upload an image to remove its background</p>
                <button onClick={loadTestImage} className="test-btn">
                  🧪 Test with Alonso Image
                </button>
              </div>
            )}
          </div>
        )}

        {original && (
          <div className="preview-section">
            <div className="file-info">
              <h3>📸 {original.file.name}</h3>
              <div className="file-details">
                <span>{original.width} × {original.height}px</span>
                <span>{formatFileSize(original.file.size)}</span>
              </div>
            </div>

            <div className="image-container">
              <div className="image-wrapper">
                <h4>Original</h4>
                <img src={original.url} alt="original" className="preview-image" />
              </div>
              
              {(result || processing) && (
                <div className="image-wrapper">
                  <h4>Background Removed</h4>
                  {processing ? (
                    <div className="processing-placeholder">
                      <div className="spinner"></div>
                      <p>Removing background...</p>
                    </div>
                  ) : result ? (
                    <div className="cutout-preview">
                      <img src={result} alt="cutout" className="preview-image" />
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {processingError && (
              <div className="status error">
                <p>❌ {processingError}</p>
                <button onClick={() => processImageFile(original.file)} className="retry-btn">
                  🔄 Try Again
                </button>
              </div>
            )}
            
            <div className="actions">
              {result && !processing && (
                <>
                  <button onClick={download} className="download-btn">
                    📥 Download PNG
                  </button>
                  <button 
                    onClick={() => setShowManualEditor(!showManualEditor)}
                    className="manual-editor-toggle"
                  >
                    🎨 {showManualEditor ? 'Hide' : 'Show'} Manual Editor
                  </button>
                </>
              )}
              <button onClick={reset} className="reset-btn">
                🔄 New Image
              </button>
            </div>

            {showManualEditor && result && currentMask && original && (
              <ManualEditor
                originalImage={original.url}
                maskData={currentMask}
                width={original.width}
                height={original.height}
                onMaskUpdate={handleMaskUpdate}
              />
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>🔒 Your images never leave your browser • Powered by Transformers.js & RMBG-1.4</p>
        <p>
          <small>
            {hasWebGPU ? "Using WebGPU for optimal performance" : "Using WebAssembly (Consider using a WebGPU-compatible browser for better performance)"}
          </small>
        </p>
      </footer>
    </div>
  );
}

export default App;
