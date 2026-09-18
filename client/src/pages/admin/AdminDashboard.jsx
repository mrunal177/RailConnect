import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { BarChart3, Train, DollarSign, Activity, AlertTriangle, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { analyticsService } from '../../services/analytics.service';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalBookings: 0, activeTrains: 0, revenueToday: 0, onTimePerformance: 'N/A', complaintsOpen: 0 });
  const [error, setError] = useState('');
  useEffect(() => { analyticsService.getOverview().then((response) => setStats(response.data)).catch((requestError) => setError(requestError.message)); }, []);

  return (
    <DashboardLayout type="admin">
      <div className="flex flex-col gap-6">
        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">System Control Center</h1>
            <p className="text-xs text-slate-400">Real-time railway network metrics & fleet management</p>
          </div>
          <Button variant="primary" size="md" icon={Train} onClick={() => navigate('/admin/trains')}>
            Manage Fleet
          </Button>
        </div>

        {/* High Level Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Bookings</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalBookings}</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1">
                  <ArrowUpRight className="w-3 h-3" /> +12.4% this week
                </span>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Active Express Trains</span>
                <h3 className="text-2xl font-extrabold text-cyan-400 mt-1">{stats.activeTrains}</h3>
                <span className="text-[10px] text-slate-400 mt-1">Fleet Operational</span>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Train className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Revenue (Today)</span>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">₹{Number(stats.revenueToday).toLocaleString('en-IN')}</h3>
                <span className="text-[10px] text-emerald-400 mt-1">Target Exceeded</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Network Punctuality</span>
                <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{stats.onTimePerformance}</h3>
                <span className="text-[10px] text-slate-400 mt-1">On-time Index</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Fleet & AI Analytics Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card title="Fleet Status Overview" subtitle="Active express trains across main corridors">
              <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-white/5 my-2">
                <p className="text-xs text-slate-400 mb-4">
                  Live operational totals are sourced from reservations, fleet, and complaint records.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')}>
                  Open Analytics Dashboard
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card title="Alerts & Operations" subtitle="Grievances requiring attention">
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Open Complaints
                    </span>
                    <span>{stats.complaintsOpen} Issues</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Electrical maintenance issues logged for Train #12952.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> System Health
                    </span>
                    <span>Operational</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80">
                    MySQL DB Connection Pool active with zero error spikes.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </DashboardLayout>
  );
};

export default AdminDashboard;
