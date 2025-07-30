import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Page } from '../App';
import { MenuIcon } from './Icons';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  navigateTo: (page: Page) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, currentPage, navigateTo }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    navigateTo(page);
    setIsSidebarOpen(false); // Secara otomatis menutup sidebar saat navigasi
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white flex">
      {/* Overlay untuk mobile saat sidebar terbuka */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar currentPage={currentPage} navigateTo={handleNavigate} isOpen={isSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0"> {/* min-w-0 penting untuk mencegah overflow pada flex children */}
        {/* Header khusus untuk mobile */}
        <header className="lg:hidden sticky top-0 z-20 flex-shrink-0 flex items-center justify-between bg-gray-800/80 backdrop-blur-md border-b border-gray-700 p-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-300 hover:text-white"
            aria-label="Open sidebar"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">PAS Scanner</h1>
          <div className="w-6" /> {/* Spacer untuk menyeimbangkan judul */}
        </header>

        {/* Konten Utama */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;