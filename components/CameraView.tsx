import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CancelIcon, ErrorIcon } from './Icons';

// jsQR dimuat dari tag skrip di index.html, deklarasikan untuk menjaga TypeScript tetap senang
declare const jsQR: any;

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // Kanvas tersembunyi untuk pemrosesan QR
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const scanForQRCode = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
    
                if (code) {
                    console.log("QR Code detected:", code.data);
                    if (animationFrameId.current) {
                        cancelAnimationFrame(animationFrameId.current);
                        animationFrameId.current = null;
                    }
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    onCapture(dataUrl);
                    return;
                }
            } else {
                console.warn("jsQR not found. Auto-scan disabled.");
                if (animationFrameId.current) {
                    cancelAnimationFrame(animationFrameId.current);
                }
                setError("Auto-scan feature failed to load. Please refresh.");
                return;
            }
        }
    }
    animationFrameId.current = requestAnimationFrame(scanForQRCode);
  }, [onCapture]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const startCameraAndScan = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          activeStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          });
          setStream(activeStream);
          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
            videoRef.current.onloadeddata = () => {
                animationFrameId.current = requestAnimationFrame(scanForQRCode);
            };
          }
        } else {
          setError("Your browser does not support camera access.");
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please ensure permissions are granted.");
      }
    };

    startCameraAndScan();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [scanForQRCode]);
  
  if (error) {
    return (
        <div className="text-center p-4 bg-gray-800 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button onClick={onCancel} className="mt-4 px-4 py-2 bg-red-600 rounded-md">Back to Dashboard</button>
        </div>
    );
  }

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // Penting untuk autoplay di beberapa browser
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="h-[90%] aspect-[54/86] border-4 border-dashed border-white/50 rounded-2xl bg-black/10 backdrop-blur-sm relative flex items-center justify-center">
          <div className="text-white font-semibold text-center bg-black/50 p-3 rounded-lg pointer-events-auto max-w-xs">
            <p>Sejajarkan kartu ID di dalam bingkai</p>
            <div className="mt-2 text-xs font-medium text-yellow-300 bg-yellow-900/30 border border-yellow-700/50 rounded-md px-2 py-1 flex items-center justify-center">
                <ErrorIcon className="w-4 h-4 inline-block mr-1.5 flex-shrink-0" />
                <span>Akurasi OCR tidak 100% akurat.</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={onCancel}
          className="absolute left-6 bottom-7 p-3 bg-gray-700/50 rounded-full text-white backdrop-blur-md hover:bg-gray-600/70 transition-colors"
          aria-label="Cancel Scan"
        >
          <CancelIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CameraView;