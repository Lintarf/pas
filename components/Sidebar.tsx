import React from 'react';
import { Page } from '../App';
import { DashboardIcon, ScanIcon, IdCardIcon, UploadIcon } from './Icons';

interface SidebarProps {
  currentPage: Page;
  navigateTo: (page: Page) => void;
  isOpen: boolean;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-red-600 text-white shadow-lg'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, navigateTo, isOpen }) => {
  return (
    <aside className={`w-64 flex-shrink-0 bg-gray-800 p-4 flex flex-col justify-between border-r border-gray-700 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div>
        <div className="flex items-center gap-3 px-2 mb-8">
            <IdCardIcon className="w-10 h-10 text-red-500"/>
            <h1 className="text-xl font-bold text-white tracking-tight">PAS Scanner</h1>
        </div>
        <nav className="space-y-2">
          <NavItem
            icon={<DashboardIcon className="w-6 h-6" />}
            label="Dashboard"
            isActive={currentPage === 'dashboard'}
            onClick={() => navigateTo('dashboard')}
          />
          <NavItem
            icon={<ScanIcon className="w-6 h-6" />}
            label="Scan Card"
            isActive={currentPage === 'scanner'}
            onClick={() => navigateTo('scanner')}
          />
          <NavItem
            icon={<UploadIcon className="w-6 h-6" />}
            label="Manual Scan"
            isActive={currentPage === 'manual-scan'}
            onClick={() => navigateTo('manual-scan')}
          />
        </nav>
      </div>
       <div className="px-2 text-xs text-gray-500">
            <p>&copy; 2024 PAS Scanner</p>
       </div>
    </aside>
  );
};

export default Sidebar;