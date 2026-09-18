import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { Search, Printer, QrCode, Train } from 'lucide-react';
import { bookingsService } from '../../services/bookings.service';

const TicketPreviewPage = () => {
  const location = useLocation();
  const [pnrInput, setPnrInput] = useState(location.state?.pnr || '');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const lookup = async (event) => {
    event?.preventDefault(); if (!/^\d{10}$/.test(pnrInput)) return setError('Enter a valid 10-digit PNR.');
    setLoading(true); setError('');
    try { setBooking((await bookingsService.getByPNR(pnrInput)).data); } catch (requestError) { setBooking(null); setError(requestError.message); } finally { setLoading(false); }
  };
  useEffect(() => { if (location.state?.pnr) lookup(); }, []);
  return <DashboardLayout type="passenger"><div className="flex flex-col gap-6 max-w-4xl mx-auto">
    <Card title="PNR Status & E-Ticket Preview" subtitle="Lookup booking details by 10-digit PNR"><form onSubmit={lookup} className="flex flex-wrap items-center gap-3"><div className="flex-1 min-w-[240px]"><Input placeholder="Enter 10-Digit PNR Number..." value={pnrInput} onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, '').slice(0, 10))} icon={Search} /></div><Button type="submit" variant="primary" size="md" isLoading={loading}>Fetch Ticket</Button></form>{error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}</Card>
    {booking && <div className="glass-panel rounded-3xl p-8 border border-cyan-500/30 shadow-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/20"><div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-6 mb-6 gap-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400"><Train className="w-6 h-6" /></div><div><span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-widest">Electronic Reservation Slip (ERS)</span><h2 className="text-xl font-extrabold text-white">RailConnect AI Ticket</h2></div></div><div className="text-right"><span className="text-xs text-slate-400 block font-mono">PNR NUMBER</span><span className="text-lg font-mono font-extrabold text-cyan-400">{booking.pnr}</span></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 rounded-2xl bg-slate-950/60 border border-white/5 mb-6"><div><span className="text-xs text-slate-400 uppercase block">Train Info</span><h4 className="text-base font-bold text-white mt-1">{booking.trainName}</h4><span className="text-xs font-mono text-cyan-400">#{booking.trainNumber} · {booking.classType}</span></div><div><span className="text-xs text-slate-400 uppercase block">Journey Date</span><h4 className="text-base font-bold text-white mt-1">{booking.journeyDate}</h4><span className="text-xs text-slate-400">{booking.source} → {booking.destination}</span></div><div><span className="text-xs text-slate-400 uppercase block">Status</span><div className="mt-1"><Badge variant={booking.status === 'CONFIRMED' ? 'success' : booking.status === 'CANCELLED' ? 'danger' : 'warning'}>{booking.status}</Badge></div><span className="text-xs text-slate-400 mt-1 block">Fare: ₹{booking.totalFare}</span></div></div>
      <div className="mb-6 overflow-x-auto"><h4 className="text-sm font-bold text-white mb-3">Passenger Details</h4><table className="w-full text-left text-xs rounded-xl overflow-hidden"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Name</th><th className="p-3">Age / Gender</th><th className="p-3">Coach</th><th className="p-3">Seat</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-white/5 bg-slate-900/40">{booking.passengers.map((passenger, index) => <tr key={index}><td className="p-3 font-bold text-white">{passenger.name}</td><td className="p-3">{passenger.age} / {passenger.gender}</td><td className="p-3 text-cyan-400">{passenger.coach || '—'}</td><td className="p-3 text-cyan-400">{passenger.seat}</td><td className="p-3">{passenger.status}</td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center text-slate-950"><QrCode className="w-10 h-10" /></div><span className="text-xs text-slate-400">Use this PNR for station verification.</span></div><Button variant="primary" size="md" icon={Printer} onClick={() => window.print()}>Print E-Ticket</Button></div>
    </div>}</div></DashboardLayout>;
};
export default TicketPreviewPage;
