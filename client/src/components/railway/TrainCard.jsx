import React from 'react';
import { Train, Clock, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const TrainCard = ({ train, onSelectClass }) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 group shadow-lg">
      {/* Card Header: Train Details */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                #{train.trainNumber}
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                {train.trainName}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Type: <strong className="text-slate-200">{train.trainType}</strong></span>
              {train.speed && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Zap className="w-3 h-3" /> {train.speed}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {train.punctuality && (
            <Badge variant="success" className="text-[11px]">
              {train.punctuality} On-time
            </Badge>
          )}
          <Badge variant="info">{train.trainType}</Badge>
        </div>
      </div>

      {/* Schedule / Journey Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-2 mb-4 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
        <div>
          <span className="text-xl font-extrabold text-white">{train.departureTime}</span>
          <p className="text-xs font-semibold text-cyan-400">{train.sourceName || train.source}</p>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-cyan-400" /> {train.duration}
          </span>
          <div className="w-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <div className="h-[2px] flex-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-full" />
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Direct Route</span>
        </div>

        <div className="text-right">
          <span className="text-xl font-extrabold text-white">{train.arrivalTime}</span>
          <p className="text-xs font-semibold text-cyan-400">{train.destinationName || train.destination}</p>
        </div>
      </div>

      {/* Available Classes & Pricing */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {train.classes?.map((cls, idx) => (
          <button
            key={idx}
            onClick={() => onSelectClass && onSelectClass(train, cls)}
            className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 text-left transition flex flex-col justify-between group/class cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white group-hover/class:text-cyan-300">{cls.type}</span>
              <span className="text-xs font-extrabold text-cyan-400">₹{cls.price}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${cls.available > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {cls.available > 0 ? `AVL ${cls.available}` : cls.status || 'RAC'}
              </span>
              <span className="text-[10px] text-slate-400 uppercase">Book &gt;</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrainCard;
