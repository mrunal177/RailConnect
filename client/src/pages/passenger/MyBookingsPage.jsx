import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Search } from 'lucide-react';
import { bookingsService } from '../../services/bookings.service';
import LoadingState from '../../components/common/LoadingState';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const loadBookings = async () => {
    setLoading(true); setError('');
    try { setBookings((await bookingsService.getUserBookings()).data); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadBookings(); }, []);
  const cancel = async (pnr) => {
    if (!window.confirm(`Cancel booking ${pnr}?`)) return;
    try { await bookingsService.cancel(pnr); loadBookings(); }
    catch (requestError) { setError(requestError.message); }
  };

  const columns = [
    {
      header: 'PNR Number',
      accessor: 'pnr',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/30">
          {row.pnr}
        </span>
      )
    },
    {
      header: 'Train Details',
      cell: (row) => (
        <div>
          <span className="font-bold text-white text-xs block">{row.trainName}</span>
          <span className="text-[11px] text-slate-400 font-mono">#{row.trainNumber} • {row.classType}</span>
        </div>
      )
    },
    {
      header: 'Journey Route',
      cell: (row) => (
        <span className="text-xs text-slate-300">
          {row.source} &rarr; {row.destination}
        </span>
      )
    },
    {
      header: 'Journey Date',
      accessor: 'journeyDate'
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.status === 'CONFIRMED' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Fare',
      cell: (row) => <span className="font-bold text-cyan-400">₹{row.totalFare}</span>
    },
    {
      header: 'Action',
      cell: (row) => (
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => navigate('/passenger/ticket-preview', { state: { pnr: row.pnr } })}>View</Button>{row.status !== 'CANCELLED' && <Button variant="ghost" size="sm" onClick={() => cancel(row.pnr)}>Cancel</Button>}</div>
      )
    }
  ];

  return (
    <DashboardLayout type="passenger">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">My Reservations</h1>
            <p className="text-xs text-slate-400">View current and past train ticket bookings</p>
          </div>
          <Button variant="primary" size="md" icon={Search} onClick={() => navigate('/search')}>
            New Booking
          </Button>
        </div>

        {error && <p role="alert" className="text-xs text-rose-300 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">{error}</p>}
        <Card>{loading ? <LoadingState message="Loading your reservations…" /> : <Table columns={columns} data={bookings} />}</Card>
      </div>
    </DashboardLayout>
  );
};

export default MyBookingsPage;
