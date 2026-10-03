import React, { useState } from 'react';
import { MessageSquare, Star, Send, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { authenticatedFetch } from '../lib/authenticated-fetch.ts';

interface FeedbackFormProps {
  bookingId?: number;
  onSubmitted?: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ bookingId, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await authenticatedFetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingId || null,
          rating,
          comment,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record feedback');
      }

      const data = await res.json();
      setSuccessResult(data);
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Error submitting feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 text-slate-800 shadow-md">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Journey Feedback & ML Review</h3>
          <p className="text-xs text-slate-500">
            Real-time NLP sentiment analysis engine categorizes reviews automatically.
          </p>
        </div>
      </div>

      {!successResult ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Your Rating (1 - 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-600 ml-2">{rating} / 5 Stars</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Review Comments
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. The train was super clean, punctual and staff was very polite and supportive!"
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
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
            disabled={isSubmitting || !comment.trim()}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running NLP Sentiment Classifier...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Journey Feedback</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="py-4 space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-emerald-800">Feedback Stored in PostgreSQL</div>
              <div className="text-xs text-slate-600 mt-1">
                Your review has been cataloged into the passenger feedback dataset.
              </div>
            </div>
          </div>

          {successResult.mlAnalysis && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  ML Sentiment Analysis Result:
                </span>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                    successResult.mlAnalysis.sentiment === 'POSITIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : successResult.mlAnalysis.sentiment === 'NEGATIVE'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {successResult.mlAnalysis.sentiment}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                Confidence: <strong className="text-slate-900">{successResult.mlAnalysis.sentimentConfidence}%</strong>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setSuccessResult(null);
              setComment('');
            }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl text-slate-700 transition-colors"
          >
            Submit Another Feedback
          </button>
        </div>
      )}
    </div>
  );
};
