import React, { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import DashboardHomeView from './components/DashboardHomeView';
import ScannerView from './components/ScannerView';
import ManualScanView from './components/ManualScanView';
import { IdCardData } from './types';
import ScanDetailModal from './components/ScanDetailModal';
import { useNotification } from './contexts/NotificationContext';
import { storageService } from './services/storageService';

export type Page = 'dashboard' | 'scanner' | 'manual-scan';

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [scanHistory, setScanHistory] = useState<IdCardData[]>([]);
  const [selectedScan, setSelectedScan] = useState<IdCardData | null>(null);
  const { addNotification } = useNotification();

  // Load scan history on component mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await storageService.loadIdCardData();
        setScanHistory(history);
      } catch (error) {
        console.error('Error loading scan history:', error);
        addNotification('Failed to load scan history', 'error');
      }
    };
    loadHistory();
  }, [addNotification]);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const handleScanSuccess = async (data: IdCardData) => {
    try {
      await storageService.saveIdCardData(data);
      setScanHistory(prevHistory => [data, ...prevHistory]);
      setSelectedScan(data);
      addNotification('Scan successful!', 'success');
    } catch (error) {
      console.error('Error saving scan data:', error);
      addNotification('Failed to save scan data', 'error');
    }
  };

  const handleSelectScan = (scan: IdCardData) => {
    setSelectedScan(scan);
  };
  
  const handleCloseModal = () => {
    setSelectedScan(null);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHomeView onStartScan={() => navigateTo('scanner')} scanHistory={scanHistory} />;
      case 'scanner':
        return <ScannerView onGoToDashboard={() => navigateTo('dashboard')} onScanSuccess={handleScanSuccess} scanHistory={scanHistory} onScanSelect={handleSelectScan} />;
      case 'manual-scan':
        return <ManualScanView onGoToDashboard={() => navigateTo('dashboard')} onScanSuccess={handleScanSuccess} scanHistory={scanHistory} onScanSelect={handleSelectScan} />;
      default:
        return <DashboardHomeView onStartScan={() => navigateTo('scanner')} scanHistory={scanHistory} />;
    }
  };

  return (
    <>
      <DashboardLayout currentPage={currentPage} navigateTo={navigateTo}>
        {renderContent()}
      </DashboardLayout>
      {selectedScan && <ScanDetailModal scan={selectedScan} onClose={handleCloseModal} />}
    </>
  );
};

const App: React.FC = () => {
  return <MainApp />;
};

export default App;