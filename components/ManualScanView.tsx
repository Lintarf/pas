import React, { useState, useCallback } from 'react';
import { IdCardData } from '../types';
import { processImageWithOCR } from '../services/ocrService';
import { LoadingIcon, UploadIcon, LocationMarkerIcon } from './Icons';
import RecentScansPanel from './RecentScansPanel';
import { useNotification } from '../contexts/NotificationContext';

interface ManualScanViewProps {
    onGoToDashboard: () => void;
    onScanSuccess: (data: IdCardData) => void;
    scanHistory: IdCardData[];
    onScanSelect: (scan: IdCardData) => void;
}

type ScanStep = 'upload' | 'loading';

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
    <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        <LoadingIcon className="w-16 h-16 text-red-500 animate-spin" />
        <h2 className="mt-6 text-2xl font-bold text-white">Processing Image...</h2>
        <p className="mt-2 text-base text-gray-400">Please wait while we extract the information.</p>
    </div>
);

const UploadView: React.FC<{ onFileUpload: (file: File) => void, disabled: boolean }> = ({ onFileUpload, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileUpload(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!disabled && e.target.files && e.target.files.length > 0) {
            onFileUpload(e.target.files[0]);
        }
    };

    const onAreaClick = () => {
        if (!disabled) fileInputRef.current?.click();
    };

    const baseClasses = "w-full h-full p-8 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-colors duration-300";
    const activeClasses = `cursor-pointer ${isDragging ? 'border-red-500 bg-gray-800' : 'border-gray-600 hover:border-red-500 hover:bg-gray-800/50'}`;
    const disabledClasses = "border-gray-700 bg-gray-800/30 cursor-not-allowed";
    
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center h-full">
             <div 
                className={`${baseClasses} ${disabled ? disabledClasses : activeClasses}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={onAreaClick}
                role="button"
                aria-label="File Upload Dropzone"
                aria-disabled={disabled}
             >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={disabled}
                />
                <UploadIcon className={`w-16 h-16 mb-4 ${disabled ? 'text-gray-600' : 'text-gray-500'}`} />
                <h2 className={`text-xl font-bold ${disabled ? 'text-gray-500' : 'text-white'}`}>{disabled ? 'Pilih Area Terlebih Dahulu' : 'Upload ID Card Image'}</h2>
                <p className={`mt-2 text-base ${disabled ? 'text-gray-600' : 'text-gray-400'}`}>{disabled ? 'Anda harus memilih area scan sebelum dapat mengunggah file.' : 'Drag & drop your file here, or click to browse.'}</p>
                {!disabled && <p className="mt-1 text-sm text-gray-500">Supports: JPG, PNG, WEBP</p>}
                {!disabled && <p className="mt-4 text-xs text-yellow-500">Catatan: Akurasi OCR tidak dijamin. Harap verifikasi hasil setelah pemindaian.</p>}
             </div>
        </div>
    );
};

const AreaSelector: React.FC<{ onAreaSelect: (area: string) => void; selectedArea: string }> = ({ onAreaSelect, selectedArea }) => (
    <div className="w-full max-w-2xl bg-gray-800 p-4 rounded-xl border border-gray-700">
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


const ManualScanView: React.FC<ManualScanViewProps> = ({ onGoToDashboard, onScanSuccess, scanHistory, onScanSelect }) => {
  const [step, setStep] = useState<ScanStep>('upload');
  const [scanArea, setScanArea] = useState<string>('');
  const { addNotification } = useNotification();

  const handleFileUpload = useCallback(async (file: File) => {
    if (!scanArea) {
      addNotification("Please select a scan area first!", 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
        addNotification("Please upload a valid image file (PNG, JPG, etc.).", 'error');
        return;
    }

    setStep('loading');

    const reader = new FileReader();
    reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        if (!imageDataUrl) {
            addNotification("Could not read the image file.", 'error');
            setStep('upload');
            return;
        }
        
        try {
            const parsedData = await processImageWithOCR(imageDataUrl);
            const finalData: IdCardData = {
              ...parsedData,
              scanArea,
              scanTimestamp: Date.now(),
            };
            onScanSuccess(finalData);
            setStep('upload');
        } catch (err) {
            console.error("Scan failed:", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            addNotification(message, 'error');
            setStep('upload');
        }
    };
    reader.onerror = () => {
        addNotification("Failed to read file.", 'error');
        setStep('upload');
    };
    reader.readAsDataURL(file);
  }, [onScanSuccess, scanArea, addNotification]);
  
  const renderContent = () => {
    switch (step) {
      case 'upload':
        return <UploadView onFileUpload={handleFileUpload} disabled={!scanArea} />;
      case 'loading':
        return <LoadingView />;
      default:
        return <UploadView onFileUpload={handleFileUpload} disabled={!scanArea} />;
    }
  };

  return (
     <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-8 font-sans">
        <div className="flex-grow w-full flex flex-col items-center justify-start pt-4 gap-6">
            <AreaSelector selectedArea={scanArea} onAreaSelect={setScanArea} />
            <div className="w-full flex-grow flex items-center justify-center">
              {renderContent()}
            </div>
        </div>
        <RecentScansPanel scans={scanHistory} onScanSelect={onScanSelect} />
    </div>
  );
};

export default ManualScanView;