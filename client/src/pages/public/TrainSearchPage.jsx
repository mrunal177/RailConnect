import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import SearchForm from '../../components/railway/SearchForm';
import TrainCard from '../../components/railway/TrainCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingState from '../../components/common/LoadingState';
import { Ticket, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { trainsService } from '../../services/trains.service';
import { bookingsService } from '../../services/bookings.service';
import { paymentsService } from '../../services/payments.service';
import { useAuth } from '../../context/AuthContext';

const defaultSearch = { source: 'NDLS', destination: 'CSMT', date: '2026-10-15', classType: 'ALL' };
const blankPassenger = { name: '', age: '', gender: 'Male' };

const TrainSearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trains, setTrains] = useState([]);
  const [search, setSearch] = useState(location.state || defaultSearch);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [passengers, setPassengers] = useState([{ ...blankPassenger }]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (params) => {
    setSearch(params); setError(''); setLoading(true);
    try {
      const response = await trainsService.searchTrains(params);
      setTrains(response.data);
    } catch (requestError) { setTrains([]); setError(requestError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { handleSearch(location.state || defaultSearch); }, []);

  const updatePassenger = (index, key, value) => setPassengers((current) => current.map((passenger, itemIndex) => itemIndex === index ? { ...passenger, [key]: value } : passenger));
  const handleSelectClass = (train, cls) => {
    if (cls.available < 1) return setError('This class has no available seats.');
    setSelectedTrain(train); setSelectedClass(cls); setPassengers([{ ...blankPassenger }]); setIsBookingModalOpen(true); setError('');
  };
  const handleBooking = async (event) => {
    event.preventDefault();
    if (!user) return navigate('/login', { state: { from: '/search' } });
    setBookingLoading(true); setError('');
    try {
      const response = await bookingsService.createBooking({ scheduleId: selectedTrain.scheduleId, journeyDate: search.date, classType: selectedClass.type, passengers });
      await paymentsService.processPayment({ pnr: response.data.pnr, paymentMethod: 'UPI' });
      setIsBookingModalOpen(false);
      navigate('/passenger/ticket-preview', { state: { pnr: response.data.pnr } });
    } catch (requestError) { setError(requestError.message); }
    finally { setBookingLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0d1929] text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6"><h1 className="text-2xl font-extrabold text-white">Find & Book Express Trains</h1><p className="text-xs text-slate-400">Search routes, check live seat availability, and reserve tickets.</p></div>
        <SearchForm onSearch={handleSearch} initialValues={search} className="mb-8" />
        {error && <div role="alert" className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</div>}
        {loading ? <LoadingState message="Searching schedules and seat availability…" /> : (
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white">Available Trains <span className="text-xs text-cyan-400 font-normal">({trains.length} Trains Found)</span></h2>
            {trains.length ? <div className="grid grid-cols-1 gap-6">{trains.map((train) => <TrainCard key={train.scheduleId} train={train} onSelectClass={handleSelectClass} />)}</div> : !error && <p className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-slate-400">No active schedules match this route and date.</p>}
          </div>
        )}
        <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Confirm Ticket Selection">
          {selectedTrain && selectedClass && <form onSubmit={handleBooking} className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30"><div className="flex justify-between mb-2"><span className="text-xs font-mono font-bold text-cyan-400">#{selectedTrain.trainNumber}</span><span className="text-xs font-bold text-emerald-400">{selectedClass.type}</span></div><h4 className="text-base font-bold text-white">{selectedTrain.trainName}</h4><p className="text-xs text-slate-300 mt-1">{selectedTrain.sourceName} → {selectedTrain.destinationName} · {search.date}</p></div>
            {passengers.map((passenger, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-xl border border-white/10 p-3"><Input label={`Passenger ${index + 1}`} value={passenger.name} onChange={(event) => updatePassenger(index, 'name', event.target.value)} required /><Input label="Age" type="number" min="1" max="120" value={passenger.age} onChange={(event) => updatePassenger(index, 'age', event.target.value)} required /><select aria-label="Gender" value={passenger.gender} onChange={(event) => updatePassenger(index, 'gender', event.target.value)} className="glass-input rounded-xl text-sm px-3 bg-slate-900/80 mt-6 h-10"><option>Male</option><option>Female</option><option>Other</option></select>{passengers.length > 1 && <Button variant="ghost" size="sm" icon={Trash2} className="mt-6" onClick={() => setPassengers((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>}</div>)}
            {passengers.length < 6 && <Button variant="outline" size="sm" icon={Plus} onClick={() => setPassengers((current) => [...current, { ...blankPassenger }])}>Add passenger</Button>}
            <div className="flex justify-between py-2 border-y border-white/10 text-sm"><span className="text-slate-400">Total fare ({passengers.length} passenger{passengers.length > 1 ? 's' : ''})</span><span className="text-lg font-extrabold text-cyan-400">₹{selectedClass.price * passengers.length}</span></div>
            <p className="text-[11px] text-slate-400 flex gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />Payment is recorded with the booking using the selected UPI method.</p>
            <div className="flex justify-end gap-3"><Button variant="ghost" size="sm" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" size="sm" icon={Ticket} isLoading={bookingLoading}>Confirm & Book</Button></div>
          </form>}
        </Modal>
      </main>
    </div>
  );
};

export default TrainSearchPage;
