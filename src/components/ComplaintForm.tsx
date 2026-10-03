import React, { useState } from 'react';
import { ShieldAlert, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '../lib/authenticated-fetch.ts';

interface ComplaintFormProps {
  bookingId?: number;
  pnr?: string;
  onSubmitted?: () => void;
}

export const ComplaintForm: React.FC<ComplaintFormProps> = ({ bookingId, pnr, onSubmitted }) => {
  const [category, setCategory] = useState('Train Delay');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'Train Delay',
    'Cleanliness',
    'Staff Behaviour',
    'Food/Catering',
    'Safety',
    'Seat Issue',
    'Payment Issue',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await authenticatedFetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingId || null,
          category,
          priority,
          description,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit complaint');
      }

      const data = await res.json();
      setSubmittedComplaint(data);
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Error creating complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 text-slate-800 shadow-md">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Passenger Grievance Redressal</h3>
          <p className="text-xs text-slate-500">
            Submit issues directly to Indian Railways Division & Duty Officers.
          </p>
        </div>
      </div>

      {!submittedComplaint ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {pnr && (
            <div className="text-xs text-slate-500">
              Associated Booking PNR: <span className="font-mono text-blue-700 font-bold">{pnr}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Urgency / Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="LOW">Low (Routine)</option>
                <option value="MEDIUM">Medium (Normal)</option>
                <option value="HIGH">High (Urgent)</option>
                <option value="CRITICAL">Critical (Immediate Security/Safety)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Description of the Issue
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, coach/berth details, or station vicinity..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !description.trim()}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 font-bold text-xs text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-amber-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Complaint Ticket...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Lodge Official Grievance</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="py-4 space-y-3">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-emerald-800">Grievance Ticket #{submittedComplaint.id} Registered</div>
              <div className="text-xs text-slate-600 mt-1">
                Assigned to Railway Divisional Control. Status: <strong>{submittedComplaint.status}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSubmittedComplaint(null);
              setDescription('');
            }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl text-slate-700 transition-colors"
          >
            Raise Another Query
          </button>
        </div>
      )}
    </div>
  );
};
