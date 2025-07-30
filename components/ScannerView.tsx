import React, { useState, useCallback } from 'react';
import { IdCardData } from '../types';
import CameraView from './CameraView';
import { processImageWithOCR } from '../services/ocrService';
import { LoadingIcon, LocationMarkerIcon } from './Icons';
import RecentScansPanel from './RecentScansPanel';
import { useNotification } from '../contexts/NotificationContext';

interface ScannerViewProps {
    onGoToDashboard: () => void;
    onScanSuccess: (data: IdCardData) => void;
    scanHistory: IdCardData[];
    onScanSelect: (scan: IdCardData) => void;
}

type ScanStep = 'camera' | 'loading';

const DUMMY_AREAS = [
    "Terminal 1 - Keberangkatan",
    "Terminal 1 - Kedatangan",
    "Terminal 2 - Keberangkatan",
    "Terminal 2 - Kedatangan",
    "Terminal 3 - Internasional",
    "Area Kargo",
    "Sisi Udara (Airside)",
];

const LoadingView: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full h-full">
        <LoadingIcon className="w-16 h-16 text-red-500 animate-spin" />
        <h2 className="mt-6 text-2xl font-bold text-white">Processing Image...</h2>
        <p className="mt-2 text-base text-gray-400">Please wait while we extract the information.</p>
    </div>
);

const AreaSelector: React.FC<{ onAreaSelect: (area: string) => void; selectedArea: string }> = ({ onAreaSelect, selectedArea }) => (
    <div className="w-full max-w-md bg-gray-800 p-4 rounded-xl border border-gray-700">
        <label htmlFor="area-select" className="flex items-center gap-2 text-lg font-bold text-white mb-2">
            <LocationMarkerIcon className="w-6 h-6 text-red-500" />
            Pilih Area Scan
        </label>
        <select
            id="area-select"
            value={selectedArea}
            onChange={(e) => onAreaSelect(e.target.value)}
            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
            <option value="" disabled>-- Pilih salah satu area --</option>
            {DUMMY_AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
            ))}
        </select>
    </div>
);

const ScannerView: React.FC<ScannerViewProps> = ({ onGoToDashboard, onScanSuccess, scanHistory, onScanSelect }) => {
  const [step, setStep] = useState<ScanStep>('camera');
  const [scanArea, setScanArea] = useState<string>('');
  const { addNotification } = useNotification();

  const handleCapture = useCallback(async (imageDataUrl: string) => {
    if (!scanArea) {
      addNotification("Please select a scan area first!", 'error');
      return;
    }
    setStep('loading');
    try {
        const parsedData = await processImageWithOCR(imageDataUrl);
        const finalData: IdCardData = {
          ...parsedData,
          scanArea,
          scanTimestamp: Date.now(),
        };
        onScanSuccess(finalData);
        setStep('camera'); // Reset for next scan

    } catch (err) {
        console.error("Scan failed:", err);
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        addNotification(message, 'error');
        setStep('camera'); // Reset on error
    }
  }, [onScanSuccess, scanArea, addNotification]);

  const renderContent = () => {
    switch (step) {
      case 'camera':
        return <CameraView onCapture={handleCapture} onCancel={onGoToDashboard} />;
      case 'loading':
        return <LoadingView />;
      default:
        return <CameraView onCapture={handleCapture} onCancel={onGoToDashboard} />;
    }
  };

  return (
     <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-8 font-sans">
        <div className="flex-grow w-full flex flex-col items-center justify-start pt-4 gap-6">
            <AreaSelector selectedArea={scanArea} onAreaSelect={setScanArea} />
            
            <div className="w-full flex-grow flex items-center justify-center aspect-video lg:aspect-auto">
                {scanArea ? (
                    renderContent()
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 w-full h-full max-w-md">
                        <LocationMarkerIcon className="w-16 h-16 text-gray-500" />
                        <h2 className="mt-4 text-2xl font-bold text-white">Area Belum Dipilih</h2>
                        <p className="mt-2 text-base text-gray-400">Silakan pilih area pemindaian di atas untuk memulai kamera.</p>
                    </div>
                )}
            </div>
        </div>
        <RecentScansPanel scans={scanHistory} onScanSelect={onScanSelect} />
    </div>
  );
};

export default ScannerView;