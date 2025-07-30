import React from 'react';
import { IdCardData } from '../types';

interface ScanChartProps {
    scans: IdCardData[];
    onAreaSelect: (area: string) => void;
    activeArea: string | null;
}

const ScanChart: React.FC<ScanChartProps> = ({ scans, onAreaSelect, activeArea }) => {
    const scanCountsByArea = React.useMemo(() => {
        return scans.reduce((acc, scan) => {
            const area = scan.scanArea || 'Unknown';
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [scans]);

    const chartData = Object.entries(scanCountsByArea).sort(([, a], [, b]) => b - a);
    const maxCount = Math.max(...chartData.map(([, count]) => count), 0);
    const hasData = chartData.length > 0;

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 h-full">
            <h3 className="text-base font-bold text-white">Scans per Area</h3>
            <p className="text-xs text-gray-400 mb-3">Click an area to filter history.</p>
            <div className={`mt-4 ${hasData ? 'space-y-2' : 'flex items-center justify-center h-48'}`}>
                {hasData ? (
                    chartData.map(([area, count]) => {
                        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        const isActive = activeArea === area;
                        const isOtherActive = activeArea !== null && !isActive;

                        return (
                           <button
                                key={area}
                                onClick={() => onAreaSelect(area)}
                                className={`grid grid-cols-3 gap-4 items-center w-full text-left rounded-lg p-2 transition-all duration-200 ${
                                    isActive ? 'bg-red-900/50 ring-2 ring-red-500' : 'hover:bg-gray-700/50'
                                } ${isOtherActive ? 'opacity-50 hover:opacity-100' : ''}`}
                                aria-pressed={isActive}
                            >
                                <p className="text-xs text-gray-300 truncate col-span-1">{area}</p>
                                <div className="col-span-2 flex items-center gap-1.5">
                                    <div className="w-full bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-red-600 h-3 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                    <p className="text-xs font-bold text-white w-6 text-right">{count}</p>
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <p className="text-gray-500 text-center">No scan data available to display chart.</p>
                )}
            </div>
        </div>
    );
};

export default ScanChart;