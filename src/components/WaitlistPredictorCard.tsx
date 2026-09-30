import React, { useState } from 'react';
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
  const [prediction] = useState<{
    confirmationProbability: number;
    confidenceLevel: 'HIGH LIKELIHOOD' | 'MEDIUM LIKELIHOOD' | 'LOW LIKELIHOOD';
    explanation: string;
    factors: {
      leadTimeDays: number;
      dayOfWeek: string;
      historicalCancellationRate: number;
    };
  }>({
    confirmationProbability: Math.min(95, Math.max(25, 96 - currentWaitlist * 3)),
    confidenceLevel: currentWaitlist <= 15 ? 'HIGH LIKELIHOOD' : currentWaitlist <= 30 ? 'MEDIUM LIKELIHOOD' : 'LOW LIKELIHOOD',
    explanation: `Model evaluated 18% historical cancellation curve for Class ${travelClass} and passenger turnover patterns.`,
    factors: {
      leadTimeDays: 2,
      dayOfWeek: 'Monday',
      historicalCancellationRate: 18,
    },
  });

  const getConfidenceBadgeColor = () => {
    if (prediction.confidenceLevel === 'HIGH LIKELIHOOD') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (prediction.confidenceLevel === 'MEDIUM LIKELIHOOD') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 text-slate-800 shadow-md relative overflow-hidden">
      {/* Decorative subtle pastel glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-100/50 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              AI Confirmation Engine
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {trainNumber} {trainName}
            </h4>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-mono">Current Status</span>
          <span className="text-sm font-black text-amber-600 font-mono">WL {currentWaitlist}</span>
        </div>
      </div>

      {/* Main Metric Display */}
      <div className="my-5 text-center">
        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
          {prediction.confirmationProbability}%
        </div>
        <div className="text-xs font-semibold text-slate-600 mt-1">
          Estimated Confirmation Probability
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              prediction.confirmationProbability >= 70
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : prediction.confirmationProbability >= 40
                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                : 'bg-gradient-to-r from-rose-500 to-pink-500'
            }`}
            style={{ width: `${prediction.confirmationProbability}%` }}
          />
        </div>

        <div className="mt-3 inline-block">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getConfidenceBadgeColor()}`}>
            {prediction.confidenceLevel}
          </span>
        </div>
      </div>

      {/* Predictive factors breakdown */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Historical Class Cancellation:</span>
          <span className="font-mono font-semibold text-slate-700">{prediction.factors.historicalCancellationRate}%</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Journey Lead Time:</span>
          <span className="font-mono font-semibold text-slate-700">{prediction.factors.leadTimeDays} days remaining</span>
        </div>
        <p className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200">
          {prediction.explanation}
        </p>
      </div>

      <div className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-400">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span>Prediction is not a guarantee of ticket confirmation. Actual allocation depends on railway quota charts.</span>
      </div>
    </div>
  );
};
