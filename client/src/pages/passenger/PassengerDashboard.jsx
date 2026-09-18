import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Ticket, Search, Calendar, ShieldCheck } from 'lucide-react';
import { bookingsService } from '../../services/bookings.service';
import { useAuth } from '../../context/AuthContext';

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  useEffect(() => { bookingsService.getUserBookings().then((response) => setBookings(response.data)).catch(() => setBookings([])); }, []);
  const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED').length;
  const waitlisted = bookings.filter((booking) => booking.status === 'WAITLIST').length;

  return (
    <DashboardLayout type="passenger">
      <div className="flex flex-col gap-6">
        {/* Welcome Banner */}
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">
                Passenger Portal
              </span>
              <h1 className="text-2xl font-extrabold text-white mt-1">Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Manage upcoming journeys, track PNR status, view tickets, and submit feedback.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={Search}
              onClick={() => navigate('/search')}
              className="shadow-cyan-500/25"
            >
              Book New Journey
            </Button>
          </div>
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Bookings</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">{bookings.length}</h3>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Ticket className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Confirmed Tickets</span>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{confirmed}</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Waitlisted PNR</span>
                <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{waitlisted}</h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Bookings Overview */}
        <Card title="Upcoming Journeys" subtitle="Your active train reservations">
          <div className="flex flex-col gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      PNR: {booking.pnr}
                    </span>
                    <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'warning'}>
                      {booking.status}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-white">{booking.trainName} (#{booking.trainNumber})</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {booking.source} &rarr; {booking.destination} • {booking.journeyDate}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-cyan-400">₹{booking.totalFare}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/passenger/ticket-preview', { state: { pnr: booking.pnr } })}
                  >
                    View Ticket
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PassengerDashboard;
