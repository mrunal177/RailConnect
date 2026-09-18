import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, type = 'passenger' }) => {
  return (
    <div className="min-h-screen bg-[#0d1929] text-slate-100 flex flex-col">
      <Navbar />
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6 flex-1">
        <Sidebar type={type} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
