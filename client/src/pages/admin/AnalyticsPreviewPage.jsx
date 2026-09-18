import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import { Bot, Smile, Frown, Meh, TrendingUp } from 'lucide-react';
import { analyticsService } from '../../services/analytics.service';

const AnalyticsPreviewPage = () => {
  const [stats, setStats] = useState({ totalBookings: 0, totalPassengers: 0, totalRevenue: 0, sentiment: [] });
  const [error, setError] = useState('');
  useEffect(() => { analyticsService.getOverview().then((response) => setStats(response.data)).catch((requestError) => setError(requestError.message)); }, []);
  const sentimentCount = (label) => stats.sentiment.find((item) => item.label === label)?.count || 0;
  return (
    <DashboardLayout type="admin">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">AI Analytics & Sentiment Dashboard</h1>
          <p className="text-xs text-slate-400">Passenger feedback sentiment analysis and ML occupancy prediction preview</p>
        </div>

        {/* AI Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Positive Feedback</span>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{sentimentCount('Positive')}</h3>
                <span className="text-[10px] text-emerald-400 mt-1">Recorded complaints</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Smile className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Bookings</span>
                <h3 className="text-2xl font-extrabold text-cyan-400 mt-1">{stats.totalBookings}</h3>
                <span className="text-[10px] text-cyan-400 mt-1">Confirmed and waitlisted</span>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Bot className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Registered Passengers</span>
                <h3 className="text-2xl font-extrabold text-purple-400 mt-1">{stats.totalPassengers}</h3>
                <span className="text-[10px] text-purple-400 mt-1">Database accounts</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Sentiment Analysis Distribution */}
        <Card title="Passenger Feedback Sentiment Breakdown" subtitle="NLP sentiment classification results">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-center">
              <Smile className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span className="text-2xl font-extrabold text-emerald-400">{sentimentCount('Positive')}</span>
              <p className="text-xs text-slate-400 mt-1">Positive service reports</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20 text-center">
              <Meh className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <span className="text-2xl font-extrabold text-amber-400">{sentimentCount('Neutral')}</span>
              <p className="text-xs text-slate-400 mt-1">Neutral service reports</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/20 text-center">
              <Frown className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <span className="text-2xl font-extrabold text-rose-400">{sentimentCount('Negative')}</span>
              <p className="text-xs text-slate-400 mt-1">Negative service reports</p>
            </div>
          </div>
        </Card>
        {error && <p className="text-xs text-rose-300">{error}</p>}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPreviewPage;
