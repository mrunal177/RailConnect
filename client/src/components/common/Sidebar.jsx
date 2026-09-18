import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Search,
  MessageSquareWarning,
  Star,
  Train,
  Calendar,
  BarChart3,
  Users,
  Settings,
  Shield
} from 'lucide-react';

const Sidebar = ({ type = 'passenger' }) => {
  const location = useLocation();

  const passengerLinks = [
    { label: 'Dashboard', path: '/passenger', icon: LayoutDashboard },
    { label: 'My Bookings', path: '/passenger/bookings', icon: Ticket },
    { label: 'PNR Status & Ticket', path: '/passenger/ticket-preview', icon: Search },
    { label: 'Complaints & Support', path: '/passenger/complaints', icon: MessageSquareWarning },
  ];

  const adminLinks = [
    { label: 'Control Center', path: '/admin', icon: LayoutDashboard },
    { label: 'Train Fleet', path: '/admin/trains', icon: Train },
    { label: 'Schedule Manager', path: '/admin/schedules', icon: Calendar },
    { label: 'AI Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  const links = type === 'admin' ? adminLinks : passengerLinks;

  return (
    <aside className="w-64 glass-panel rounded-2xl p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-6rem)] border border-white/10">
      <div className="flex flex-col gap-6">
        {/* Section Header */}
        <div className="px-3 pt-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400 font-bold flex items-center gap-1.5">
            {type === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <LayoutDashboard className="w-3.5 h-3.5" />}
            {type === 'admin' ? 'Admin Control' : 'Passenger Area'}
          </span>
          <h2 className="text-sm font-bold text-white mt-1">
            {type === 'admin' ? 'System Management' : 'Travel Hub'}
          </h2>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1">
          {links.map((link, idx) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={idx}
                to={link.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? type === 'admin'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? (type === 'admin' ? 'text-purple-400' : 'text-cyan-400') : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>RailConnect System</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Express Server: Connected <br />
          Version 1.0 (Foundation)
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
