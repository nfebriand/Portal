import React, { useRef, useState, useEffect } from 'react';
import { Edit3, Trash2, Check, RefreshCw } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  height?: number;
  label?: string;
}

const HANDWRITING_FONTS = [
  "font-serif italic",
  "font-mono italic",
];

export default function SignaturePad({
  value,
  onChange,
  height = 120,
  label = "Tanda Tangan Digital"
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFontIndex, setSelectedFontIndex] = useState(0);

  // Initialize canvas with background
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e293b'; // slate-800
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // If there is existing value and it is an image, load it onto the canvas
        if (value && value.startsWith('data:image')) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = value;
        } else {
          // Clear with transparent bg
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [mode, value]);

  // Handle resizing/scaling for HDPI displays
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (value && value.startsWith('data:image')) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = value;
        }
      }
    }
  }, [mode]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if blank (very basic check)
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  // Convert text signature to dataURL using standard 2D canvas context
  const generateTypedSignature = (text: string, fontIndex: number) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 300;
    tempCanvas.height = 100;
    const ctx = tempCanvas.getContext('2d');
    if (ctx && text.trim().length > 0) {
      ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.fillStyle = '#1e293b'; // slate-800
      
      const fonts = [
        "36px 'Brush Script MT', cursive, sans-serif",
        "32px 'Great Vibes', cursive, 'Lucida Handwriting', serif",
        "34px 'Dancing Script', cursive, serif"
      ];
      
      ctx.font = fonts[fontIndex] || fonts[0];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);
      
      const dataUrl = tempCanvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setTypedName(text);
    generateTypedSignature(text, selectedFontIndex);
  };

  const rotateFont = () => {
    const nextIndex = (selectedFontIndex + 1) % 3;
    setSelectedFontIndex(nextIndex);
    if (typedName.trim().length > 0) {
      generateTypedSignature(typedName, nextIndex);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">{label}</label>
        <div className="flex bg-slate-100 rounded-md p-0.5 text-xs">
          <button
            type="button"
            onClick={() => { setMode('draw'); clearCanvas(); }}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              mode === 'draw' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Gambar
          </button>
          <button
            type="button"
            onClick={() => { setMode('type'); setTypedName(''); onChange(''); }}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              mode === 'type' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ketik Nama
          </button>
        </div>
      </div>

      <div 
        className="relative bg-slate-50/50 border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
        style={{ height: `${height}px` }}
      >
        {mode === 'draw' ? (
          <>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />
            {value && (
              <div className="absolute top-2 right-2 flex gap-1 bg-white/80 backdrop-blur-xs p-1 rounded-lg shadow-xs pointer-events-auto">
                <button
                  type="button"
                  onClick={clearCanvas}
                  title="Hapus tanda tangan"
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono pointer-events-none">
              {value ? "✓ Tanda tangan terekam" : "Gunakan mouse atau layar sentuh untuk menggambar"}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 p-3 flex flex-col justify-between">
            <div className="flex gap-2">
              <input
                type="text"
                value={typedName}
                onChange={handleTextChange}
                placeholder="Ketik nama di sini..."
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-slate-400 text-slate-800 font-medium"
              />
              {typedName && (
                <button
                  type="button"
                  onClick={rotateFont}
                  title="Ubah Gaya Tulisan"
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Gaya
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[50px]">
              {typedName ? (
                <div 
                  className="text-slate-800 text-center select-none"
                  style={{
                    fontFamily: selectedFontIndex === 0 ? "'Brush Script MT', cursive, sans-serif" : 
                                selectedFontIndex === 1 ? "'Lucida Handwriting', cursive, serif" : 
                                "'Dancing Script', cursive, serif",
                    fontSize: '1.8rem',
                    lineHeight: '1.2'
                  }}
                >
                  {typedName}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">Nama akan diubah menjadi format tanda tangan elektronik</div>
              )}
            </div>
            
            <div className="text-[10px] text-slate-400 font-mono flex justify-between items-center border-t border-slate-100 pt-1">
              <span>{value ? "✓ Model tanda tangan siap" : "Silakan ketik nama"}</span>
              {value && <span className="text-emerald-600 font-semibold flex items-center gap-0.5"><Check className="w-3 h-3" /> Valid</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
