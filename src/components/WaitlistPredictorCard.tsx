import React, { useEffect, useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface WaitlistPredictorProps {
  trainId: number;
  trainNumber: string;
  trainName: string;
  currentWaitlist: number;
  journeyDate: string;
  travelClass: string;
  totalSeats?: number;
  onSelectAlternative?: (altTrain: any) => void;
}

interface WaitlistPrediction {
  confirmation_probability: number;
  prediction: string;
}

export const WaitlistPredictorCard: React.FC<WaitlistPredictorProps> = ({
  trainId,
  trainNumber,
  trainName,
  currentWaitlist,
  journeyDate,
  travelClass,
}) => {
  const [prediction, setPrediction] = useState<WaitlistPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setPrediction(null);
    setIsLoading(currentWaitlist > 0);

    if (currentWaitlist <= 0) {
      return () => controller.abort();
    }

    fetch('/api/ml/waitlist/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        train_id: trainId,
        journey_date: journeyDate,
        travel_class: travelClass,
        current_waitlist: currentWaitlist,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Prediction request failed (${response.status})`);
        const result = await response.json();
        if (
          typeof result.confirmation_probability !== 'number'
          || !Number.isFinite(result.confirmation_probability)
          || typeof result.prediction !== 'string'
        ) {
          throw new Error('Prediction response has an invalid format');
        }
        setPrediction(result);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Waitlist prediction failed:', error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [trainId, journeyDate, travelClass, currentWaitlist]);

  const probability = prediction?.confirmation_probability;

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
          <span className="text-[11px] text-slate-400 block font-medium">Waitlist Status</span>
          <span className="text-base font-black text-amber-500 font-mono">
            {currentWaitlist > 0 ? `WL ${currentWaitlist}` : 'No active waitlist'}
          </span>
        </div>
      </div>

      {/* Main Metric Display */}
      <div className="py-2 text-center">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
          Waitlist Confirmation
        </div>
        {currentWaitlist <= 0 ? (
          <p className="mt-3 text-sm font-semibold text-slate-500" role="status">
            No waitlist prediction is needed while seats are available.
          </p>
        ) : isLoading ? (
          <p className="mt-3 text-sm font-semibold text-slate-500" role="status">Calculating confirmation probability…</p>
        ) : prediction ? (
          <>
            <div className="mt-2 text-5xl font-black text-[#4338ca] tracking-tight">
              {probability!.toFixed(2)}% chance of confirmation
            </div>
            <div className="mt-3 inline-block">
              <span className="px-4 py-0.5 rounded-full text-[11px] font-bold border border-emerald-300 bg-white text-emerald-600">
                {prediction.prediction}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, probability!))}%` }}
              />
            </div>
          </>
        ) : (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500" role="status">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Unable to calculate confirmation probability
          </p>
        )}
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
