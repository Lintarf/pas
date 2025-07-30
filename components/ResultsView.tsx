import React from 'react';
import { IdCardData } from '../types';
import { ScanIcon, UserIcon, DashboardIcon, UploadIcon } from './Icons';

interface ResultsViewProps {
  data: IdCardData;
  onRescan?: () => void;
  onGoToDashboard?: () => void;
  rescanButtonText?: string;
  rescanButtonIcon?: React.ReactNode;
  showActions?: boolean;
}

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode; isMono?: boolean; }> = ({ label, value, isMono = false }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
    <p className={`text-sm sm:text-md lg:text-sm text-white break-words ${isMono ? 'font-mono' : 'font-medium'}`}>{value}</p>
  </div>
);

const ResultsView: React.FC<ResultsViewProps> = ({ data, onRescan, onGoToDashboard, rescanButtonText, rescanButtonIcon, showActions = true }) => {
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      <div className="w-full bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Card Header */}
        <div className="bg-red-700 p-3 sm:p-4 lg:p-3">
          <h2 className="text-lg sm:text-xl lg:text-lg font-bold text-white text-center tracking-wide">{data.issuingAuthority}</h2>
        </div>
        <div className="bg-gray-900 p-2 lg:p-1.5">
            <h3 className="text-sm font-semibold text-gray-200 text-center">{data.location}</h3>
        </div>

        {/* Card Body */}
        <div className="p-2 sm:p-3 lg:p-3">
          <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-2">
            <p className="text-xs sm:text-sm font-bold text-gray-400">EXPIRY DATE</p>
            <p className="text-sm sm:text-base lg:text-base font-bold text-white font-mono tracking-wider">{data.expiryDate}</p>
          </div>

            {/* Responsive grid for photo and details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 sm:gap-x-4 lg:gap-x-4 gap-y-2 sm:gap-y-3 lg:gap-y-2 items-center sm:items-start">
                 
                 {/* Photo */}
                 <div className="sm:col-span-1 flex justify-center">
                   <div className="w-20 h-26 sm:w-28 sm:h-36 lg:w-28 lg:h-36 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                       {data.photo ? (
                         <img 
                           src={data.photo} 
                           alt="ID Photo" 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <UserIcon className="w-12 h-12 sm:w-16 sm:h-16 lg:w-16 lg:h-16 text-gray-400" />
                       )}
                   </div>
                 </div>

                 {/* Details */}
                 <div className="sm:col-span-2 flex flex-col space-y-1 sm:space-y-2 lg:space-y-1.5 w-full text-center sm:text-left">
                  <InfoRow label="Name" value={data.name} />
                  <InfoRow label="Position" value={data.position} />
                  <InfoRow label="Company" value={data.company} />
              </div>
            </div>

            <div className="mt-3 sm:mt-4 lg:mt-3 border-t border-gray-700 pt-3 sm:pt-4 lg:pt-3 space-y-2 sm:space-y-3 lg:space-y-2">
              {/* Access Areas */}
               <div>
                  <p className="text-center sm:text-left text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5 lg:mb-1.5">Access Areas</p>
                   <div className="flex flex-row flex-wrap justify-center sm:justify-start gap-1 sm:gap-1.5 lg:gap-1.5">
                       {data.accessAreas?.length > 0 ? data.accessAreas.map(area => (
                           <span key={area} className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gray-900/50 border border-gray-600 rounded-lg flex items-center justify-center text-xs sm:text-sm lg:text-sm font-bold text-white tracking-widest">{area}</span>
                       )) : <p className="text-gray-400 text-sm italic">No access areas</p>}
                   </div>
                </div>
              
              {/* ID Number */}
              <InfoRow label="ID Number" value={data.idNumber} isMono={true}/>
            </div>

            {/* Scan Context Info */}
             <div className="mt-2 sm:mt-2 lg:mt-2 border-t border-gray-700 pt-2 sm:pt-2 lg:pt-2 space-y-1 sm:space-y-1.5 lg:space-y-1.5">
                  <InfoRow label="Scan Area" value={data.scanArea} />
                  <InfoRow label="Scan Time" value={new Date(data.scanTimestamp).toLocaleString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                  })} />
              </div>
        </div>
      </div>

      {showActions && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
                onClick={onGoToDashboard}
                className="inline-flex items-center justify-center gap-x-2 px-6 py-3 border border-gray-600 text-base font-medium rounded-full shadow-sm text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 transform hover:scale-105 transition-transform duration-200"
              >
                <DashboardIcon className="w-5 h-5" />
                Back to Dashboard
            </button>
            <button
              onClick={onRescan}
              className="inline-flex items-center justify-center gap-x-2 px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transform hover:scale-105 transition-transform duration-200"
            >
              {rescanButtonIcon || (rescanButtonText?.includes("Upload") ? <UploadIcon className="w-5 h-5" /> : <ScanIcon className="w-5 h-5" />)}
              {rescanButtonText || 'Scan Another Card'}
            </button>
          </div>
      )}
    </div>
  );
};

export default ResultsView;