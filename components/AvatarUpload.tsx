import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Upload } from 'lucide-react';

interface Props {
  onImageChange: (base64: string) => void;
  initialImage?: string;
}

export default function AvatarUpload({ onImageChange, initialImage }: Props) {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  /**
   * Resize source media to a square and return a compressed JPEG data URL.
   * For selfie capture UX, we support mirroring so the saved image matches the mirrored preview.
   */
  const resizeAndProcess = (
    source: HTMLImageElement | HTMLVideoElement,
    options?: { mirror?: boolean }
  ): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 300; // Resize to 300x300 for storage efficiency
    canvas.width = size;
    canvas.height = size;

    if (!ctx) return '';

    // Calculate aspect fill
    let sWidth, sHeight, sx, sy;
    if (source instanceof HTMLVideoElement) {
        sWidth = source.videoWidth;
        sHeight = source.videoHeight;
    } else {
        sWidth = source.width;
        sHeight = source.height;
    }

    const scale = Math.max(size / sWidth, size / sHeight);
    const scaledWidth = sWidth * scale;
    const scaledHeight = sHeight * scale;
    const dx = (size - scaledWidth) / 2;
    const dy = (size - scaledHeight) / 2;

    // Mirror (selfie-style) if requested. This flips horizontally.
    if (options?.mirror) {
      ctx.save();
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
      // After flipping, adjust the x coordinate so content stays centered.
      ctx.drawImage(source, -dx - scaledWidth, dy, scaledWidth, scaledHeight);
      ctx.restore();
    } else {
      ctx.drawImage(source, dx, dy, scaledWidth, scaledHeight);
    }
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const resized = resizeAndProcess(img);
          setPreview(resized);
          onImageChange(resized);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    setIsMenuOpen(false);
  };

  const startCamera = async () => {
    setIsMenuOpen(false);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Could not access camera.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      // Mirror capture to match the mirrored selfie preview.
      const dataUrl = resizeAndProcess(videoRef.current, { mirror: true });
      setPreview(dataUrl);
      onImageChange(dataUrl);
      closeCamera();
    }
  };

  const closeCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Preview / Trigger */}
      <div className="relative">
        <button 
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-24 h-24 rounded-full border-4 border-slate-100 flex items-center justify-center overflow-hidden shadow-md transition-all ${!preview ? 'bg-slate-200' : 'bg-white'}`}
        >
            {preview ? (
                <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                <Camera size={32} className="text-slate-400" />
            )}
        </button>
        {/* Simple Label if empty */}
        {!preview && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 whitespace-nowrap">Add Photo</span>}
        
        {/* Edit Badge */}
        {preview && (
            <button 
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="absolute bottom-0 right-0 p-1.5 bg-slate-800 text-white rounded-full border-2 border-white shadow-sm"
            >
                <Camera size={12} />
            </button>
        )}
      </div>

      {/* Options Menu */}
      {isMenuOpen && (
        <div className="flex gap-3 animate-fade-in bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-sm mt-2">
            <button 
                type="button"
                onClick={startCamera}
                className="flex flex-col items-center gap-1 p-2 hover:bg-white rounded-lg transition-colors min-w-[60px]"
            >
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
                    <Camera size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-600">Camera</span>
            </button>
            <label className="flex flex-col items-center gap-1 p-2 hover:bg-white rounded-lg transition-colors min-w-[60px] cursor-pointer">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                    <ImageIcon size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-600">Gallery</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md h-full flex flex-col">
                {/* Camera View */}
                {/* Mirror the selfie preview so it feels natural (like native camera apps). */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="flex-1 w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                
                {/* Overlay Controls */}
                <div className="absolute bottom-0 w-full p-8 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
                    <button onClick={closeCamera} className="p-3 text-white bg-white/20 rounded-full backdrop-blur-md">
                        <X size={24} />
                    </button>
                    <button 
                        onClick={capturePhoto} 
                        className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center backdrop-blur-sm active:scale-95 transition-transform"
                    >
                        <div className="w-16 h-16 bg-white rounded-full"></div>
                    </button>
                    <div className="w-12"></div> {/* Spacer for alignment */}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}