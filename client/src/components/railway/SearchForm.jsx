import React, { useState } from 'react';
import { MapPin, Calendar, ArrowRightLeft, Search, Filter } from 'lucide-react';
import Button from '../common/Button';
import { STATIONS } from '../../mock/mockData';

const SearchForm = ({ onSearch, className = '', initialValues = {} }) => {
  const [source, setSource] = useState(initialValues.source || 'NDLS');
  const [destination, setDestination] = useState(initialValues.destination || 'CSMT');
  const [date, setDate] = useState(initialValues.date || '2026-10-15');
  const [classType, setClassType] = useState(initialValues.classType || 'ALL');

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (source === destination) return;
    if (onSearch) {
      onSearch({ source, destination, date, classType });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-2xl relative ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Source Station */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> From Station
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="glass-input rounded-xl text-sm py-2.5 px-3.5 bg-slate-900/80 cursor-pointer font-medium"
          >
            {STATIONS.map((st) => (
              <option key={st.code} value={st.code} className="bg-slate-900 text-white">
                {st.name} ({st.code})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex items-center justify-center pb-0.5">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-cyan-400 border border-white/10 hover:border-cyan-400/40 transition active:rotate-180 duration-300 cursor-pointer"
            title="Swap Stations"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Station */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> To Station
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="glass-input rounded-xl text-sm py-2.5 px-3.5 bg-slate-900/80 cursor-pointer font-medium"
          >
            {STATIONS.map((st) => (
              <option key={st.code} value={st.code} className="bg-slate-900 text-white">
                {st.name} ({st.code})
              </option>
            ))}
          </select>
        </div>

        {/* Journey Date */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Date of Journey
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="glass-input rounded-xl text-sm py-2.5 px-3.5 bg-slate-900/80 font-medium"
          />
        </div>

        {/* Submit Search CTA */}
        <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Class:</span>
            {['ALL', 'CC', '2A', '3A', 'SL'].map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setClassType(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  classType === c ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <Button type="submit" variant="primary" icon={Search} size="md" className="w-full md:w-auto px-8">
            Find Express Trains
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchForm;
