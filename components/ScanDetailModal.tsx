import React, { useEffect } from 'react';
import { IdCardData } from '../types';
import ResultsView from './ResultsView';
import { CancelIcon } from './Icons';

interface ScanDetailModalProps {
  scan: IdCardData;
  onClose: () => void;
}

const ScanDetailModal: React.FC<ScanDetailModalProps> = ({ scan, onClose }) => {
  // Menambahkan event listener untuk tombol Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Membersihkan event listener saat komponen di-unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 lg:p-3"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      ></div>

      {/* Konten Modal */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg transform transition-all max-h-[70vh] lg:max-h-[65vh] overflow-hidden">
        <div className="relative">
           <ResultsView data={scan} showActions={false} />
            <button
                onClick={onClose}
                className="absolute -top-2 -right-2 p-2 bg-gray-700 rounded-full text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-white z-10"
                aria-label="Close"
            >
                <CancelIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScanDetailModal;