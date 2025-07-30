import React from 'react';
import { IdCardData } from '../types';
import { IdCardIcon } from './Icons';

// Kartu kecil untuk setiap item riwayat pemindaian
const ScanHistoryCard: React.FC<{ scan: IdCardData, onClick: () => void }> = ({ scan, onClick }) => (
    <button onClick={onClick} className="bg-gray-800 p-4 rounded-lg border border-gray-700 w-full transition-transform hover:scale-[1.02] hover:shadow-lg hover:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-left">
        <h3 className="text-lg font-bold text-white truncate">{scan.name}</h3>
        <p className="text-sm text-gray-400 truncate">{scan.company}</p>
        <p className="mt-2 text-xs text-gray-300 font-mono bg-gray-900 px-2 py-1 rounded w-full truncate">{scan.idNumber}</p>
    </button>
);

// Komponen panel utama
const RecentScansPanel: React.FC<{ scans: IdCardData[], onScanSelect: (scan: IdCardData) => void }> = ({ scans, onScanSelect }) => {
    return (
        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-gray-800/50 p-4 rounded-2xl border border-gray-700 lg:flex lg:flex-col">
            <h2 className="text-xl font-bold text-white mb-4 px-2 flex-shrink-0">Recent Scans</h2>
            <div className="lg:overflow-y-auto lg:flex-grow">
                {scans.length > 0 ? (
                    <div className="space-y-4">
                        {scans.map((scan, index) => (
                            <ScanHistoryCard key={`${scan.idNumber}-${index}`} scan={scan} onClick={() => onScanSelect(scan)} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 p-8 min-h-[150px] lg:min-h-0 h-full">
                        <IdCardIcon className="w-12 h-12" />
                        <p className="mt-4 font-medium">Scan results will appear here.</p>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default RecentScansPanel;