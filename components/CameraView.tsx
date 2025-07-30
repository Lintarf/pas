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

  const [isCardDetected, setIsCardDetected] = useState(false);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const lastFrameData = useRef<ImageData | null>(null);

  const calculateFrameDifference = (frame1: ImageData, frame2: ImageData): number => {
    const data1 = frame1.data;
    const data2 = frame2.data;
    let diff = 0;
    
    // Hanya bandingkan setiap 10 pixel untuk kinerja yang lebih baik
    for (let i = 0; i < data1.length; i += 40) {
      diff += Math.abs(data1[i] - data2[i]);
    }
    
    return diff / (data1.length / 40);
  };

  const detectCard = (imageData: ImageData): boolean => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Hitung rata-rata kecerahan di area tengah (area kartu)
    const centerX = Math.floor(width * 0.25);
    const centerY = Math.floor(height * 0.25);
    const centerWidth = Math.floor(width * 0.5);
    const centerHeight = Math.floor(height * 0.5);
    
    let brightness = 0;
    let pixelCount = 0;
    
    for (let y = centerY; y < centerY + centerHeight; y += 2) {
      for (let x = centerX; x < centerX + centerWidth; x += 2) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        brightness += (r + g + b) / 3;
        pixelCount++;
      }
    }
    
    const avgBrightness = brightness / pixelCount;
    return avgBrightness > 100 && avgBrightness < 240; // Nilai threshold untuk deteksi kartu
  };

  const scanFrame = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        const cardDetected = detectCard(imageData);
        setIsCardDetected(cardDetected);

        if (cardDetected) {
          if (lastFrameData.current) {
            const frameDiff = calculateFrameDifference(imageData, lastFrameData.current);
            
            if (frameDiff < 5) { // Threshold untuk stabilitas frame
              setStabilityCounter(prev => {
                if (prev >= 15) { // Auto-capture setelah 15 frame stabil
                  if (animationFrameId.current) {
                    cancelAnimationFrame(animationFrameId.current);
                    animationFrameId.current = null;
                  }
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                  onCapture(dataUrl);
                  return 0;
                }
                return prev + 1;
              });
            } else {
              setStabilityCounter(0);
            }
          }
          lastFrameData.current = imageData;
        } else {
          setStabilityCounter(0);
          lastFrameData.current = null;
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(scanFrame);
  }, [onCapture]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isComponentMounted = true;
    
    const startCameraAndScan = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Mengoptimalkan konfigurasi kamera untuk kinerja yang lebih baik
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { min: 1280, ideal: 1920, max: 2560 },
              height: { min: 720, ideal: 1080, max: 1440 },
              aspectRatio: { ideal: 1.7777777778 },
              frameRate: { ideal: 30 },
              // Mengaktifkan auto-focus untuk hasil yang lebih tajam
              focusMode: 'continuous',
              // Mengoptimalkan exposure untuk kondisi pencahayaan yang berbeda
              exposureMode: 'continuous',
              whiteBalanceMode: 'continuous'
            }
          });

          if (!isComponentMounted) return;
          
          setStream(activeStream);
          if (videoRef.current) {
            videoRef.current.srcObject = activeStream;
            await new Promise<void>((resolve) => {
              if (videoRef.current) {
                videoRef.current.onloadeddata = () => resolve();
              }
            });
            
            if (!isComponentMounted) return;
            animationFrameId.current = requestAnimationFrame(scanFrame);
          }
        } else {
          setError("Your browser does not support camera access.");
        }
      } catch (err) {
        if (!isComponentMounted) return;
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please ensure permissions are granted.");
      }
    };

    startCameraAndScan();

    return () => {
      isComponentMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      // Reset state pada cleanup
      setIsCardDetected(false);
      setStabilityCounter(0);
      lastFrameData.current = null;
    };
  }, [scanFrame]);
  
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
        <div className={`h-[90%] aspect-[54/86] border-4 ${isCardDetected ? 'border-green-500' : 'border-dashed border-white/50'} rounded-2xl bg-black/10 backdrop-blur-sm relative flex items-center justify-center transition-colors duration-300`}>
          <div className="text-white font-semibold text-center bg-black/50 p-3 rounded-lg pointer-events-auto max-w-xs">
            {isCardDetected ? (
              <>
                <p className="text-green-400">Kartu Terdeteksi!</p>
                <p className="text-sm mt-1">Tahan kartu tetap stabil...</p>
                <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300" 
                    style={{ width: `${(stabilityCounter / 15) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p>Sejajarkan kartu ID di dalam bingkai</p>
                <div className="mt-2 text-xs font-medium text-yellow-300 bg-yellow-900/30 border border-yellow-700/50 rounded-md px-2 py-1 flex items-center justify-center">
                  <ErrorIcon className="w-4 h-4 inline-block mr-1.5 flex-shrink-0" />
                  <span>Akurasi OCR tidak 100% akurat.</span>
                </div>
              </>
            )}
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