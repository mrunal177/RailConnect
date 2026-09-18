import React from 'react';
import { Train, MapPin, CheckCircle2 } from 'lucide-react';

const RouteVisualizer = ({
  stations = [
    { code: 'NDLS', name: 'New Delhi', status: 'completed' },
    { code: 'AGC', name: 'Agra Cantt', status: 'completed' },
    { code: 'GWL', name: 'Gwalior', status: 'current' },
    { code: 'VGLJ', name: 'Jhansi', status: 'upcoming' },
    { code: 'BPL', name: 'Bhopal', status: 'upcoming' },
    { code: 'CSMT', name: 'Mumbai CSMT', status: 'upcoming' }
  ]
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 my-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Train className="w-4 h-4 text-cyan-400" /> Dynamic Route Visualizer
          </h4>
          <p className="text-xs text-slate-400">Live journey path & station check-in progress</p>
        </div>
        <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-semibold">
          On Time • 140 km/h
        </span>
      </div>

      <div className="relative py-6 px-2 overflow-x-auto">
        <div className="min-w-[500px] flex items-center justify-between relative">
          {/* Track Line Background */}
          <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-slate-800 rounded-full z-0" />
          <div className="absolute top-1/2 left-0 w-2/5 h-1 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full z-0" />

          {stations.map((st, idx) => {
            const isCompleted = st.status === 'completed';
            const isCurrent = st.status === 'current';

            return (
              <div key={idx} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-500/40 animate-pulse shadow-lg shadow-cyan-400/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Train className="w-4 h-4" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </div>
                <div className="text-center mt-2">
                  <span className="text-xs font-bold text-white block">{st.code}</span>
                  <span className="text-[10px] text-slate-400 block max-w-[80px] truncate">{st.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RouteVisualizer;
