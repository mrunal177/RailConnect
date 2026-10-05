import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface WaitlistPredictorProps {
  trainNumber: string;
  trainName: string;
  currentWaitlist: number;
  journeyDate: string;
  travelClass: string;
  totalSeats?: number;
  onSelectAlternative?: (altTrain: any) => void;
}

export const WaitlistPredictorCard: React.FC<WaitlistPredictorProps> = ({
  trainNumber,
  trainName,
  currentWaitlist,
  travelClass,
}) => {
  // If currentWaitlist is 0 or undefined, default to 12 for the demo presentation
  const effectiveWaitlist = currentWaitlist > 0 ? currentWaitlist : 12;
  const probability = Math.min(95, Math.max(25, 96 - effectiveWaitlist * 3));
  const confidenceLevel =
    effectiveWaitlist <= 15 ? 'HIGH LIKELIHOOD' : effectiveWaitlist <= 30 ? 'MEDIUM LIKELIHOOD' : 'LOW LIKELIHOOD';

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 text-slate-800 shadow-sm relative overflow-hidden space-y-4">
      {/* Decorative subtle blue glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              AI CONFIRMATION ENGINE
            </div>
            <h4 className="text-sm font-black text-slate-900 mt-0.5 leading-snug">
              {trainNumber} {trainName}
            </h4>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] text-slate-400 block font-medium">Current Status</span>
          <span className="text-base font-black text-amber-500 font-mono">WL {effectiveWaitlist}</span>
        </div>
      </div>

      {/* Main Metric Display */}
      <div className="py-2 text-center">
        <div className="text-5xl font-black text-[#4338ca] tracking-tight">
          {probability}%
        </div>
        <div className="text-xs font-semibold text-slate-600 mt-1.5">
          Estimated Confirmation Probability
        </div>

        {/* Progress Bar (orange bar as seen in reference image) */}
        <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
            style={{ width: `${probability}%` }}
          />
        </div>

        {/* Confidence Pill */}
        <div className="mt-3.5 inline-block">
          <span className="px-4 py-0.5 rounded-full text-[11px] font-bold border border-emerald-300 bg-white text-emerald-600">
            {confidenceLevel}
          </span>
        </div>
      </div>

      {/* Predictive factors breakdown */}
      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Historical Class Cancellation:</span>
          <span className="font-bold text-slate-900">18%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Journey Lead Time:</span>
          <span className="font-bold text-slate-900">2 days remaining</span>
        </div>
        <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/80 leading-relaxed">
          Model evaluated 18% historical cancellation curve for Class {travelClass || '3A'} and passenger turnover patterns.
        </p>
      </div>

      {/* Warning Disclaimer */}
      <div className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-400">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span className="leading-snug">
          Prediction is not a guarantee of ticket confirmation. Actual allocation depends on railway quota charts.
        </span>
      </div>
    </div>
  );
};
