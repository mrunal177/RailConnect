import React from 'react';
import { Loader2, TrainTrack } from 'lucide-react';

const LoadingState = ({ message = 'Loading railway data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <TrainTrack className="w-5 h-5 text-cyan-300 absolute inset-0 m-auto" />
      </div>
      <p className="text-sm font-medium text-slate-300">{message}</p>
    </div>
  );
};

export default LoadingState;
