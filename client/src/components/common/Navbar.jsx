import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Train, ShieldCheck, UserCheck, Search, Home, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-200">
            <Train className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
              RailConnect <span className="text-cyan-400">AI</span>
            </span>
            <span className="text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase -mt-1">
              NextGen Railway Platform
            </span>
          </div>
        </Link>

        {/* Public Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-white/10">
          <Link
            to="/"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              isActive('/') ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <Link
            to="/search"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              isActive('/search') ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Search Trains
          </Link>
          <Link
            to="/passenger"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              location.pathname.startsWith('/passenger') ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Passenger Area
          </Link>
          <Link
            to="/admin"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              location.pathname.startsWith('/admin') ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Portal
          </Link>
        </nav>

        {/* Role Switcher & Auth Preview */}
        <div className="flex items-center gap-3">
          <Link
            to={user ? (user.role === 'admin' ? '/admin' : '/passenger') : '/login'}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>{user ? user.name.split(' ')[0] : 'Sign In'}</span>
          </Link>
          {user && <button onClick={logout} title="Sign out" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300"><LogOut className="w-3.5 h-3.5" /></button>}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
