import React, { useState, useMemo } from 'react';
import { ScanIcon, IdCardIcon, CancelIcon } from './Icons';
import { IdCardData } from '../types';
import ScanChart from './ScanChart';
import DateRangePicker from './DateRangePicker';

interface DashboardHomeViewProps {
  onStartScan: () => void;
  scanHistory: IdCardData[];
}

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        <p className="text-xs font-medium text-gray-400">{title}</p>
        <p className="mt-1 text-xl font-bold text-white truncate">{value}</p>
    </div>
);

const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({ onStartScan, scanHistory }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string | null>(null);


  const filteredByDateHistory = useMemo(() => {
    if (!startDate && !endDate) {
      return scanHistory;
    }
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
    const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Date.now();

    return scanHistory.filter(scan => {
        const scanTime = scan.scanTimestamp;
        return scanTime >= start && scanTime <= end;
    });
  }, [scanHistory, startDate, endDate]);

  const finalFilteredHistory = useMemo(() => {
    if (!selectedAreaFilter) {
      return filteredByDateHistory;
    }
    return filteredByDateHistory.filter(scan => scan.scanArea === selectedAreaFilter);
  }, [filteredByDateHistory, selectedAreaFilter]);


  const handleDateApply = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };
  
  const handleAreaFilterChange = (area: string | null) => {
    if (area) {
        setSelectedAreaFilter(current => (current === area ? null : area)); // Toggle behavior
    } else {
        setSelectedAreaFilter(null); // Explicitly clear
    }
  };

  const totalScans = filteredByDateHistory.length;
  const lastScan = totalScans > 0 ? filteredByDateHistory[0] : null;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
  };
  
  return (
    <div className="flex flex-col gap-y-6">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-400">Scan history and overview.</p>
            </div>
             <button
                onClick={onStartScan}
                className="inline-flex items-center justify-center gap-x-2 px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transform hover:scale-105 transition-transform duration-200"
                >
                <ScanIcon className="w-5 h-5" />
                Start New Scan
            </button>
        </header>

        {/* Date Filter Section */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-shrink-0">
                <h3 className="text-base font-semibold text-white">Filter by Date</h3>
                <p className="text-xs text-gray-400">Select a range to filter the history and stats.</p>
            </div>
            <DateRangePicker startDate={startDate} endDate={endDate} onApply={handleDateApply} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Scans (Filtered)" value={totalScans.toString()} />
            <StatCard title="Last Scanned Name" value={lastScan ? lastScan.name : 'N/A'} />
            <StatCard title="Last Scanned Area" value={lastScan ? lastScan.scanArea : 'N/A'} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
                 <div className="p-4 border-b border-gray-700 flex-shrink-0 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Scan History</h2>
                    {selectedAreaFilter && (
                        <button
                            onClick={() => handleAreaFilterChange(null)}
                            className="inline-flex items-center gap-x-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                        >
                             <CancelIcon className="w-4 h-4" />
                            Clear filter for "{selectedAreaFilter}"
                        </button>
                    )}
                </div>
                {finalFilteredHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Name</th>
                                    <th scope="col" className="hidden lg:table-cell px-3 py-3.5 text-left text-sm font-semibold text-white">ID Number</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Scan Area</th>
                                    <th scope="col" className="hidden sm:table-cell px-3 py-3.5 text-left text-sm font-semibold text-white">Scan Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {finalFilteredHistory.map((scan, index) => (
                                    <tr key={index} className="hover:bg-gray-700/50">
                                        <td className="py-3 pl-4 pr-3 text-sm sm:pl-6">
                                            <div className="sm:hidden">
                                                <div className="font-medium text-white">{scan.name}</div>
                                                <div className="mt-1 text-xs text-gray-400">{scan.idNumber}</div>
                                                <div className="text-xs text-gray-400">{formatTimestamp(scan.scanTimestamp)}</div>
                                            </div>
                                            <div className="hidden sm:block font-medium text-white">{scan.name}</div>
                                        </td>
                                        <td className="hidden lg:table-cell px-3 py-3 text-sm text-gray-300 font-mono">{scan.idNumber}</td>
                                        <td className="px-3 py-3 text-sm text-gray-300">{scan.scanArea}</td>
                                        <td className="hidden sm:table-cell px-3 py-3 text-sm text-gray-300">{formatTimestamp(scan.scanTimestamp)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center p-4 min-h-[200px]">
                        <div>
                            <IdCardIcon className="mx-auto h-12 w-12 text-gray-500" />
                            <h3 className="mt-3 text-base font-semibold text-white">No scans found</h3>
                            <p className="mt-1 text-xs text-gray-400">Try adjusting the date range or clearing filters.</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="lg:col-span-2">
                <ScanChart scans={filteredByDateHistory} onAreaSelect={handleAreaFilterChange} activeArea={selectedAreaFilter}/>
            </div>
        </div>
    </div>
  );
};

export default DashboardHomeView;