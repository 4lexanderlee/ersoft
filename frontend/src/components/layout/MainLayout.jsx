import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AppFooter from '../ui/AppFooter';
import { useTheme } from '../../context/ThemeContext';

const MainLayout = () => {
  const { theme } = useTheme();

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#313b48]' : 'bg-[#d6d0d4]'
      }`}
    >
      {/* Dark Sidebar on the left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page content — footer remains fixed at the bottom, inner div scrolls */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 flex flex-col min-h-0 relative">
            <Outlet />
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
