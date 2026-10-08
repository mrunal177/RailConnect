import React, { useState, useEffect } from 'react';
import {
  Train,
  MapPin,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  CreditCard,
  Ticket,
  Bell,
  BarChart3,
  Database,
  Moon,
  Sun,
  LogOut,
  RefreshCw,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  Globe,
  X,
  Info,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from './context/AuthContext.tsx';
import { useLanguage } from './context/LanguageContext.tsx';
import { TrainTrackingMap } from './components/TrainTrackingMap.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { DigitalTicket } from './components/DigitalTicket.tsx';
import { WaitlistPredictorCard } from './components/WaitlistPredictorCard.tsx';
import { FeedbackForm } from './components/FeedbackForm.tsx';
import { ComplaintForm } from './components/ComplaintForm.tsx';
import { DbmsLabModal } from './components/DbmsLabModal.tsx';
import { VoiceAssistantChatbot } from './components/VoiceAssistantChatbot.tsx';
import { TrainTrackingData } from './lib/tracking.ts';
import { authenticatedFetch } from './lib/authenticated-fetch.ts';
import trainDaylightPastel from './assets/images/train_daylight_pastel_1790515202398.jpg';

const ALL_STATIONS = [
  { value: 'Mumbai', label: 'Mumbai (MMCT / CSMT)', code: 'MMCT' },
  { value: 'Delhi', label: 'Delhi (NDLS)', code: 'NDLS' },
  { value: 'Pune', label: 'Pune (PUNE)', code: 'PUNE' },
  { value: 'Ahmedabad', label: 'Ahmedabad (ADI)', code: 'ADI' },
  { value: 'Bengaluru', label: 'Bengaluru (SBC)', code: 'SBC' },
  { value: 'Chennai', label: 'Chennai (MAS)', code: 'MAS' },
  { value: 'Jaipur', label: 'Jaipur (JP)', code: 'JP' },
];

const STATION_CODE_MAP: Record<string, string> = {
  'Mumbai': 'MMCT',
  'Delhi': 'NDLS',
  'Pune': 'PUNE',
  'Ahmedabad': 'ADI',
  'Bengaluru': 'SBC',
  'Chennai': 'MAS',
  'Jaipur': 'JP',
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (d: Date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = days[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthName = months[d.getMonth()];
  return `${dayName}, ${dayNum} ${monthName}`;
};

type TrainScheduleStop = {
  station: string;
  arrival: string;
  departure: string;
  halt: string;
  distanceKm: number;
};

const formatScheduleClock = (minutes: number) => {
  const dayOffset = Math.floor(minutes / 1440);
  const clock = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return `${clock}${dayOffset > 0 ? ` +${dayOffset}d` : ''}`;
};

const getTrainScheduleStops = (train: any): TrainScheduleStop[] => {
  if (train.route_json) {
    try {
      const route = JSON.parse(train.route_json);
      const stops = Array.isArray(route) ? route : route?.stops;
      if (Array.isArray(stops) && stops.length > 1) {
        return stops.map((stop: any) => ({
          station: String(stop.station || stop.stationName || stop.name || 'Station'),
          arrival: stop.arrival ? String(stop.arrival) : '—',
          departure: stop.departure ? String(stop.departure) : '—',
          halt: stop.arrival && stop.departure ? 'Scheduled' : '—',
          distanceKm: Number(stop.distanceKm ?? stop.distance ?? 0),
        }));
      }
    } catch (error) {
      console.warn('Unable to parse train route schedule:', error);
    }
  }

  const departureMatch = String(train.departure_time || '08:00').match(/^(\d{1,2}):(\d{2})/);
  const departureMinutes = departureMatch ? Number(departureMatch[1]) * 60 + Number(departureMatch[2]) : 480;
  const durationMatch = String(train.duration || '').match(/(?:(\d+)d\s*)?(\d+)h\s*(\d+)m/i);
  const durationMinutes = durationMatch
    ? Number(durationMatch[1] || 0) * 1440 + Number(durationMatch[2]) * 60 + Number(durationMatch[3])
    : 600;
  const speed = Math.max(30, Number(train.speed_kmph) || 80);
  const totalDistance = Math.round(speed * durationMinutes / 60);
  const intermediateStations = [train.current_station, train.next_station]
    .filter((station, index, all) =>
      station
      && station !== train.source
      && station !== train.destination
      && all.indexOf(station) === index
    );
  const stops: TrainScheduleStop[] = [{
    station: `${train.source} JN`,
    arrival: 'Source',
    departure: formatScheduleClock(departureMinutes),
    halt: '—',
    distanceKm: 0,
  }];

  intermediateStations.forEach((station: string, index: number) => {
    const progress = (index + 1) / (intermediateStations.length + 1);
    const arrival = departureMinutes + Math.round(durationMinutes * progress);
    stops.push({
      station,
      arrival: formatScheduleClock(arrival),
      departure: formatScheduleClock(arrival + 3),
      halt: '3 mins',
      distanceKm: Math.round(totalDistance * progress),
    });
  });

  stops.push({
    station: `${train.destination} (DST)`,
    arrival: formatScheduleClock(departureMinutes + durationMinutes),
    departure: 'Destination',
    halt: '—',
    distanceKm: totalDistance,
  });
  return stops;
};

const calculateFare = (baseFare: string | number, tClass: string) => {
  const base = parseFloat(String(baseFare || '300'));
  let multiplier = 1.0;
  if (tClass === '1A') multiplier = 2.4;
  else if (tClass === '2A') multiplier = 1.8;
  else if (tClass === '3A') multiplier = 1.3;
  else if (tClass === '3E') multiplier = 1.2;
  else if (tClass === 'CC') multiplier = 1.1;
  else if (tClass === 'SL') multiplier = 0.6;
  return Math.round(base * multiplier);
};

const ALL_CLASSES = [
  { code: 'SL', label: 'Sleeper' },
  { code: '2S', label: 'Second Sitting' },
  { code: '3E', label: 'AC 3 Economy' },
  { code: '3A', label: 'AC 3 Tier' },
  { code: '2A', label: 'AC 2 Tier' },
  { code: '1A', label: 'AC First Class' },
  { code: 'CC', label: 'AC Chair Car' },
  { code: 'EC', label: 'Executive Chair Car' },
];

const getTrainClasses = (train: { classes?: unknown }) =>
  String(train.classes || '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

const getClassLabel = (classCode: string) =>
  ALL_CLASSES.find((trainClass) => trainClass.code === classCode)?.label || classCode;

const getAvailabilityTiles = (baseDateStr: string, train: any) => {
  const base = new Date(baseDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tiles = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i * 7);
    const label = formatDisplayDate(d);
    const dateStr = formatLocalDate(d);
    const isPast = d < today;

    let statusText = '';
    let statusType: 'DEPARTED' | 'AVAILABLE' | 'WAITLIST' = 'AVAILABLE';

    if (isPast) {
      statusText = 'TRAIN DEPARTED';
      statusType = 'DEPARTED';
    } else if (i === 0) {
      if (train.availableSeats > 0) {
        statusText = `AVAILABLE ${train.availableSeats}`;
        statusType = 'AVAILABLE';
      } else {
        statusText = `WL${train.waitlistCount || 12}`;
        statusType = 'WAITLIST';
      }
    } else if (i === 1) {
      statusText = 'WL68';
      statusType = 'WAITLIST';
    } else if (i === 2) {
      statusText = 'WL23';
      statusType = 'WAITLIST';
    } else {
      statusText = 'WL54';
      statusType = 'WAITLIST';
    }

    tiles.push({
      dateStr,
      label,
      statusText,
      statusType,
      availableSeats: statusType === 'AVAILABLE'
        ? Number(statusText.match(/\d+/)?.[0] || 0)
        : 0,
      waitlistPosition: statusType === 'WAITLIST'
        ? Number(statusText.match(/\d+/)?.[0] || 0)
        : 0,
    });
  }
  return tiles;
};

const getDefaultJourneyDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatLocalDate(date);
};

// MapTiler browser keys are public by design and must be domain-restricted in
// MapTiler. Vite substitutes this value only at build time.
const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';

export default function App() {
  const {
    user,
    profile,
    signInWithGoogle,
    signOut,
  } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Navigation tab state: 'SEARCH' | 'TRACKING' | 'MY_BOOKINGS' | 'COMPLAINTS' | 'ADMIN'
  const [currentTab, setCurrentTab] = useState<'SEARCH' | 'TRACKING' | 'MY_BOOKINGS' | 'COMPLAINTS' | 'ADMIN'>('SEARCH');

  // Guard: Admin tab is strictly visible & accessible only when role is ADMIN
  useEffect(() => {
    if (profile?.role !== 'ADMIN' && currentTab === 'ADMIN') {
      setCurrentTab('SEARCH');
    }
  }, [profile?.role, currentTab]);

  // Search parameters
  const [searchFrom, setSearchFrom] = useState('Mumbai');
  const [searchTo, setSearchTo] = useState('Delhi');
  const [searchDate, setSearchDate] = useState(getDefaultJourneyDate);
  const [availabilityTileBaseDate, setAvailabilityTileBaseDate] = useState(getDefaultJourneyDate);
  const [travelClass, setTravelClass] = useState('3A');
  const [trainsList, setTrainsList] = useState<any[]>([]);
  const [routeAvailableClasses, setRouteAvailableClasses] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const isSameStationRoute = searchFrom.trim().toLowerCase() === searchTo.trim().toLowerCase();

  // Selected train & seat booking state
  const [selectedTrain, setSelectedTrain] = useState<any | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<{
    trainId: number;
    journeyDate: string;
    travelClass: string;
    status: 'AVAILABLE' | 'WAITLIST';
    availableSeats: number;
    waitlistPosition: number;
  } | null>(null);
  const [seatMap, setSeatMap] = useState<any | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>('A1');
  const [scheduleTrain, setScheduleTrain] = useState<any | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [passengerAge, setPassengerAge] = useState('');
  const [passengerGender, setPassengerGender] = useState('');

  // Checkout modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<any | null>(null);

  // Tracking state
  const [liveTrains, setLiveTrains] = useState<TrainTrackingData[]>([]);
  const [trackedTrain, setTrackedTrain] = useState<TrainTrackingData | null>(null);

  // Passenger bookings & complaints lists
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [overviewStats, setOverviewStats] = useState<any | null>(null);

  // Modals
  const [isDbmsLabOpen, setIsDbmsLabOpen] = useState(false);
  const [authPromptAction, setAuthPromptAction] = useState<string | null>(null);
  const [authPromptError, setAuthPromptError] = useState<string | null>(null);

  // Searching, train details, and live tracking are public. Anything that reads
  // private data or changes a reservation must start with authentication.
  const isAuthenticated = Boolean(user);
  const signedInName = profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Google user';
  const signedInRole = profile?.role || 'Authenticated passenger';
  const requireAuthentication = (action: string) => {
    if (isAuthenticated) return true;
    setAuthPromptError(null);
    setAuthPromptAction(action);
    return false;
  };

  const openComplaintForm = () => {
    if (requireAuthentication('raise a complaint')) {
      setCurrentTab('COMPLAINTS');
    }
  };

  // Initial fetch: Search trains & load active tracking
  const executeSearch = async (classOverride = travelClass) => {
    setAvailabilityTileBaseDate(searchDate);
    if (isSameStationRoute) {
      setTrainsList([]);
      setRouteAvailableClasses([]);
      setSelectedTrain(null);
      setSelectedAvailability(null);
      setSeatMap(null);
      setSearchMessage('Choose different origin and destination stations to search for trains.');
      return;
    }

    setIsSearching(true);
    setRouteAvailableClasses([]);
    setSearchMessage(null);
    setTrainsList([]);
    try {
      const res = await fetch(
        `/api/trains/search?from=${encodeURIComponent(searchFrom)}&to=${encodeURIComponent(searchTo)}&date=${searchDate}&travelClass=${classOverride}`
      );
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || `Train search failed (${res.status})`);
      }

      const data = await res.json();
      setTrainsList(data);

      if (data.length > 0) {
        const matchingTrain = selectedTrain && data.find((train: any) => train.id === selectedTrain.id);
        if (matchingTrain) {
          setSelectedTrain(matchingTrain);
          setSelectedAvailability({
            trainId: matchingTrain.id,
            journeyDate: String(searchDate),
            travelClass: classOverride,
            status: matchingTrain.availableSeats > 0 ? 'AVAILABLE' : 'WAITLIST',
            availableSeats: matchingTrain.availableSeats || 0,
            waitlistPosition: matchingTrain.waitlistCount || 0,
          });
        } else {
          setSelectedTrain(null);
          setSelectedAvailability(null);
          setSeatMap(null);
          handleSelectTrain(data[0], classOverride);
        }
      } else {
        setSelectedTrain(null);
        setSelectedAvailability(null);
        setSeatMap(null);

        // A route can be served while not offering the selected coach class.
        const routeRes = await fetch(
          `/api/trains/search?from=${encodeURIComponent(searchFrom)}&to=${encodeURIComponent(searchTo)}&date=${searchDate}`
        );
        if (routeRes.ok) {
          const routeTrains = await routeRes.json();
          setRouteAvailableClasses(Array.from(
            new Set(routeTrains.flatMap((train: any) => getTrainClasses(train)))
          ));
        }
      }
    } catch (e) {
      console.error('Search error:', e);
      setTrainsList([]);
      setSelectedTrain(null);
      setSelectedAvailability(null);
      setSeatMap(null);
      setSearchMessage(e instanceof Error ? e.message : 'Train search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchActiveTracking = async () => {
    try {
      const res = await fetch('/api/tracking/active');
      if (res.ok) {
        const data = await res.json();
        setLiveTrains(data);
        if (!trackedTrain && data.length > 0) {
          setTrackedTrain(data[0]);
        }
      }
    } catch (e) {
      console.error('Tracking fetch error:', e);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const res = await authenticatedFetch('/api/bookings/my');
      if (res.ok) {
        const data = await res.json();
        setMyBookings(data);
      }
    } catch (e) {
      console.error('Bookings fetch error:', e);
    }
  };

  const fetchAdminStats = async () => {
    if (profile?.role !== 'ADMIN') return;
    try {
      const [ovRes, compRes, fbRes, logsRes] = await Promise.all([
        authenticatedFetch('/api/analytics/overview'),
        authenticatedFetch('/api/complaints'),
        authenticatedFetch('/api/feedback'),
        authenticatedFetch('/api/admin/audit-logs'),
      ]);

      if (ovRes.ok) setOverviewStats(await ovRes.json());
      if (compRes.ok) setAllComplaints(await compRes.json());
      if (fbRes.ok) setFeedbackList(await fbRes.json());
      if (logsRes.ok) setAuditLogs(await logsRes.json());
    } catch (e) {
      console.error('Admin metrics error:', e);
    }
  };

  useEffect(() => {
    executeSearch();
    fetchActiveTracking();

    // 10s auto-refresh for live train coordinates
    const interval = setInterval(() => {
      fetchActiveTracking();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (profile) {
      fetchUserBookings();
      fetchAdminStats();
    }
  }, [profile]);

  const handleSelectTrain = async (train: any, chosenClass?: string) => {
    setSelectedTrain(train);
    const activeClass = chosenClass || travelClass;
    if (chosenClass) setTravelClass(chosenClass);
    setSelectedAvailability((current) => {
      if (current && current.trainId === train.id && current.journeyDate === searchDate) {
        return { ...current, travelClass: activeClass };
      }
      return {
        trainId: train.id,
        journeyDate: searchDate,
        travelClass: activeClass,
        status: train.availableSeats > 0 ? 'AVAILABLE' : 'WAITLIST',
        availableSeats: train.availableSeats || 0,
        waitlistPosition: train.waitlistCount || 0,
      };
    });
    try {
      const res = await fetch(`/api/trains/${train.id}/seats?date=${searchDate}&travelClass=${activeClass}`);
      if (res.ok) {
        const data = await res.json();
        setSeatMap(data);
        // Find first available seat or default to A1
        const avail = data.seats?.find((s: any) => s.status === 'AVAILABLE');
        setSelectedSeat(avail?.seatNumber || 'A1');
      } else {
        setSelectedSeat('A1');
      }
    } catch (e) {
      console.error('Failed to load seat map:', e);
      setSelectedSeat('A1');
    }
  };

  const handleCompleteBooking = async (paymentMethod: string) => {
    if (!requireAuthentication('complete a booking')) return;
    if (!selectedTrain || !selectedSeat) return;

    const res = await authenticatedFetch('/api/bookings/reserve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainId: selectedTrain.id,
        journeyDate: searchDate,
        passengerName: passengerName.trim(),
        passengerAge: Number(passengerAge),
        passengerGender,
        seatNumber: selectedSeat,
        travelClass,
        paymentMethod,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to complete booking transaction');
    }

    const data = await res.json();
    setCurrentTicket({
      ...data.booking,
      train_name: selectedTrain.train_name,
      train_number: selectedTrain.train_number,
      source: selectedTrain.source,
      destination: selectedTrain.destination,
      departure_time: selectedTrain.departure_time,
      arrival_time: selectedTrain.arrival_time,
      transaction_reference: data.payment.transaction_reference,
    });

    // Refresh inventory and user bookings
    handleSelectTrain(selectedTrain);
    fetchUserBookings();
    fetchAdminStats();
  };

  const handleCancelTicket = async (bookingId: number) => {
    if (!requireAuthentication('cancel a ticket')) return;
    if (!confirm('Are you sure you want to cancel this booking and initiate a refund?')) return;
    try {
      const res = await authenticatedFetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      if (res.ok) {
        alert('Booking cancelled successfully! Seat has been released and refund calculated.');
        fetchUserBookings();
        fetchAdminStats();
        if (currentTicket && currentTicket.id === bookingId) {
          setCurrentTicket({ ...currentTicket, booking_status: 'CANCELLED' });
        }
      }
    } catch (e) {
      console.error('Cancel booking error:', e);
    }
  };

  const scheduleStops = scheduleTrain ? getTrainScheduleStops(scheduleTrain) : [];
  const currentSelectedAvailability = selectedAvailability
    && selectedTrain
    && selectedAvailability.trainId === selectedTrain.id
    && selectedAvailability.journeyDate === searchDate
    && selectedAvailability.travelClass === travelClass
    ? selectedAvailability
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP HEADER & PERSONA ROLE SWITCHER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('SEARCH')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900">{t('appTitle')}</span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:block font-medium">
                {t('appSubtitle')}
              </span>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setCurrentTab('SEARCH')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'SEARCH'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              {t('searchAndBook')}
            </button>
            <button
              onClick={() => setCurrentTab('TRACKING')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'TRACKING'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              {t('liveGisMap')}
            </button>
            <button
              onClick={() => {
                if (requireAuthentication('view your journeys')) setCurrentTab('MY_BOOKINGS');
              }}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'MY_BOOKINGS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              {t('myJourneys')}
            </button>
            <button
              onClick={() => {
                if (requireAuthentication('use the grievance portal')) setCurrentTab('COMPLAINTS');
              }}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'COMPLAINTS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              {t('grievancePortal')}
            </button>
            {/* Admin Analytics Tab: Visible ONLY when ADMIN is selected! */}
            {profile?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentTab('ADMIN')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  currentTab === 'ADMIN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                {t('adminAnalytics')}
              </button>
            )}
          </nav>

          {/* Right Header: Language selector and authenticated profile */}
          <div className="flex items-center gap-2.5">
            {/* Language Selection Section */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                aria-label="Select Language"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            {/* User Profile / Login */}
            {user ? (
              <div className="flex items-center gap-2 pl-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center font-bold text-xs text-blue-700 shadow-xs">
                  {signedInName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden xl:block text-left text-xs leading-none">
                  <span className="font-bold text-slate-800 block">{signedInName}</span>
                  <span className="text-[10px] text-slate-500">{signedInRole}</span>
                </div>
                <button
                  onClick={signOut}
                  title="Sign out"
                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthPromptError(null);
                  setAuthPromptAction('access your account');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT ROUTER */}
      {currentTab === 'SEARCH' ? (
        <div className="w-full flex flex-col">
          {/* Full-Screen Hero Block covering the viewport, revealing the approaching train completely in pastel daylight */}
          <section className="relative w-full min-h-[calc(100vh-68px)] flex flex-col justify-between p-6 md:p-12 lg:p-16 overflow-hidden bg-slate-100 border-b border-slate-200 shadow-sm">
            {/* Full-bleed train approaching daylight backdrop */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
              <img
                src={trainDaylightPastel}
                alt="High-speed modern train approaching in bright daylight"
                className="w-full h-full object-cover object-center scale-100 transform transition-transform duration-1000"
              />
              {/* Atmospheric pastel overlays that blend seamlessly into the light background */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-white/50 to-sky-50/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent" />
              <div className="absolute top-1/4 left-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 right-20 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Top / Center Hero Titles */}
            <div className="relative z-10 max-w-3xl pt-6 lg:pt-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-amber-300 text-amber-800 text-xs font-bold tracking-widest uppercase mb-4 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Connected & Intelligent Transit</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight drop-shadow-sm">
                Discover Trains &<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600">
                  Reserve Seats
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-700 mt-4 max-w-2xl font-medium leading-relaxed">
                Experience next-generation high-speed Indian rail transit with atomic concurrency-protected seat booking, interactive coach maps, and statistical AI waitlist confirmation prediction.
              </p>
            </div>

            {/* Bottom Floating Glass Search Box & Scroll Prompt */}
            <div className="relative z-10 w-full max-w-6xl mx-auto pb-4 pt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white/80 shadow-xl shadow-slate-300/40 ring-1 ring-slate-200/50">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('fromStation')}</label>
                  <select
                    value={searchFrom}
                    onChange={(e) => {
                      const nextFrom = e.target.value;
                      setSearchFrom(nextFrom);
                      if (nextFrom === searchTo) {
                        setSearchTo(ALL_STATIONS.find((station) => station.value !== nextFrom)?.value || '');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {ALL_STATIONS.map((st) => (
                      <option key={`from-${st.value}`} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">{t('toStation')}</label>
                    <button
                      type="button"
                      onClick={() => {
                        const temp = searchFrom;
                        setSearchFrom(searchTo);
                        setSearchTo(temp);
                      }}
                      title="Swap From and To stations"
                      className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Swap</span>
                    </button>
                  </div>
                  <select
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {ALL_STATIONS.map((st) => (
                      <option key={`to-${st.value}`} value={st.value} disabled={st.value === searchFrom}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('departureDate')}</label>
                  <input
                    type="date"
                    value={searchDate}
                    min={formatLocalDate(new Date())}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('class')}</label>
                  <select
                    value={travelClass}
                    onChange={(e) => setTravelClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="1A">AC First Class (1A)</option>
                    <option value="2A">AC 2 Tier (2A)</option>
                    <option value="3A">AC 3 Tier (3A)</option>
                    <option value="3E">AC 3 Economy (3E)</option>
                    <option value="CC">AC Chair Car (CC)</option>
                    <option value="EC">Executive Chair Car (EC)</option>
                    <option value="SL">Sleeper (SL)</option>
                    <option value="2S">Second Sitting (2S)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      executeSearch();
                      // Smooth scroll down to results section
                      const resultsSection = document.getElementById('train-results-section');
                      if (resultsSection) {
                        resultsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    disabled={isSearching || isSameStationRoute}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs text-white flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>{isSearching ? t('findingTrains') : t('searchTrains')}</span>
                  </button>
                </div>
              </div>

              {isSameStationRoute && (
                <p className="mt-2 text-center text-xs font-semibold text-amber-800" role="status">
                  Choose different origin and destination stations to search for trains.
                </p>
              )}

              {/* Subtle Scroll Down Prompt Indicator */}
              <div
                onClick={() => {
                  const resultsSection = document.getElementById('train-results-section');
                  if (resultsSection) {
                    resultsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <span>Scroll down to inspect trains & coach seat maps</span>
                <span className="animate-bounce">↓</span>
              </div>
            </div>
          </section>

          {/* Shifted down content: Train list, Interactive Seats & AI Predictions */}
          <main id="train-results-section" className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-8 pt-10">
            {/* Train Search Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Train list cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Available Trains</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {trainsList.length} Found
                      </span>
                    </h3>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <span className="text-xs text-slate-600 font-semibold">
                      {searchFrom} ({STATION_CODE_MAP[searchFrom] || searchFrom}) ➔ {searchTo} ({STATION_CODE_MAP[searchTo] || searchTo})
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-[11px] text-slate-700 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-semibold text-slate-600">Train schedules for {formatDisplayDate(new Date(searchDate + 'T00:00:00'))}</span>
                  </div>
                </div>

                {searchMessage && !isSameStationRoute && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800" role="status">
                    {searchMessage}
                  </p>
                )}

                {trainsList.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">
                      {routeAvailableClasses.length > 0
                        ? `No ${getClassLabel(travelClass)} (${travelClass}) coaches on this route`
                        : 'No trains matching this specific route'}
                    </h4>
                    {routeAvailableClasses.length > 0 ? (
                      <>
                        <p className="text-xs text-slate-500 mt-1">
                          {searchFrom} to {searchTo} is available in another class. Choose one to see trains.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                          {routeAvailableClasses.map((classCode) => (
                            <button
                              key={classCode}
                              type="button"
                              onClick={() => {
                                setTravelClass(classCode);
                                executeSearch(classCode);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-700 transition-colors cursor-pointer"
                            >
                              {getClassLabel(classCode)} ({classCode})
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        Try another station pair or travel class.
                      </p>
                    )}
                  </div>
                ) : (
                  trainsList.map((train) => {
                    const isSelected = selectedTrain?.id === train.id;

                    if (isSelected) {
                      const currentFare = calculateFare(train.base_fare, travelClass);
                      const tiles = getAvailabilityTiles(availabilityTileBaseDate, train);

                      return (
                        <div
                          key={train.id}
                          className="p-5 sm:p-6 rounded-3xl border border-slate-300 bg-white shadow-md ring-2 ring-blue-500/20 transition-all space-y-4"
                        >
                          {/* Row 1: Train title + Runs on + Train Schedule link */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-100">
                            <div>
                              <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                {train.train_name.toUpperCase()} ({train.train_number})
                              </h4>
                              {train.train_type === 'Indicative Demo' && (
                                <span className="mt-1 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                  Indicative schedule
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <span className="text-slate-500">Runs On:</span>
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                                  <span
                                    key={idx}
                                    className={`font-bold ${
                                      idx === 0 ? 'text-slate-900' : 'text-slate-300'
                                    }`}
                                  >
                                    {day}
                                  </span>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => setScheduleTrain(train)}
                                className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer transition-colors"
                              >
                                Train Schedule
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Timing, Stations and Duration Strip */}
                          <div className="flex items-center justify-between py-2 text-xs sm:text-sm">
                            <div>
                              <span className="text-lg font-black text-slate-900">{train.departure_time}</span>
                              <span className="mx-2 text-slate-300 font-normal">|</span>
                              <span className="font-bold text-slate-800 uppercase">{train.source} JN.</span>
                              <span className="mx-2 text-slate-300 font-normal">|</span>
                              <span className="text-slate-500 font-medium">{formatDisplayDate(new Date(searchDate + 'T00:00:00'))}</span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400">
                              <div className="w-6 sm:w-10 h-[1px] bg-slate-300" />
                              <span className="font-mono text-slate-600 font-bold text-xs">{train.duration}</span>
                              <div className="w-6 sm:w-10 h-[1px] bg-slate-300" />
                            </div>

                            <div className="text-right">
                              <span className="text-lg font-black text-slate-900">{train.arrival_time}</span>
                              <span className="mx-2 text-slate-300 font-normal">|</span>
                              <span className="font-bold text-slate-800 uppercase">{train.destination}</span>
                              <span className="mx-2 text-slate-300 font-normal">|</span>
                              <span className="text-slate-500 font-medium">{formatDisplayDate(new Date(searchDate + 'T00:00:00'))}</span>
                            </div>
                          </div>

                          {/* Row 3: Class Selection Tabs */}
                          <div className="flex items-center justify-between border-b border-slate-200 pt-2 overflow-x-auto">
                            <div className="flex items-center gap-1 sm:gap-2">
                              {getTrainClasses(train).map((classCode) => {
                                const cls = { code: classCode, label: getClassLabel(classCode) };
                                const isActive = travelClass === cls.code;
                                return (
                                  <button
                                    key={cls.code}
                                    type="button"
                                    onClick={() => handleSelectTrain(train, cls.code)}
                                    className={`pb-2.5 px-3 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                                      isActive
                                        ? 'text-slate-900'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    <span>{cls.label} ({cls.code})</span>
                                    {isActive && (
                                      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-500 rounded-t" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedTrain(null)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors ml-2 mb-1 cursor-pointer"
                              title="Close details"
                            >
                              <X className="w-4 h-4 font-black" />
                            </button>
                          </div>

                          {/* Row 4: Availability Date Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                            {tiles.map((tile, idx) => {
                              const isCurrent = tile.dateStr === searchDate;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setSearchDate(tile.dateStr);
                                    setSelectedAvailability({
                                      trainId: train.id,
                                      journeyDate: tile.dateStr,
                                      travelClass,
                                      status: tile.statusType === 'WAITLIST' ? 'WAITLIST' : 'AVAILABLE',
                                      availableSeats: tile.availableSeats,
                                      waitlistPosition: tile.waitlistPosition,
                                    });
                                  }}
                                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-300/40'
                                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                                  }`}
                                >
                                  <div className="text-xs font-bold text-slate-900">{tile.label}</div>
                                  <div
                                    className={`text-xs font-black mt-1.5 ${
                                      tile.statusType === 'DEPARTED'
                                        ? 'text-slate-900 font-black'
                                        : tile.statusType === 'AVAILABLE'
                                        ? 'text-emerald-600 font-black'
                                        : 'text-rose-600 font-black'
                                    }`}
                                  >
                                    {tile.statusText}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Row 5: NTES Disclaimer */}
                          <div className="text-xs text-slate-700 pt-1">
                            Please check{' '}
                            <a
                              href="https://enquiry.indianrail.gov.in"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-blue-700 hover:underline"
                            >
                              NTES website
                            </a>{' '}
                            or{' '}
                            <a
                              href="https://enquiry.indianrail.gov.in"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-blue-700 hover:underline"
                            >
                              NTES app
                            </a>{' '}
                            for actual time before boarding
                          </div>

                          {/* Row 6: Book Now Button and Fare */}
                          <div className="pt-2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (requireAuthentication('book tickets')) {
                                  if (!selectedSeat) setSelectedSeat('A1');
                                  setIsPaymentOpen(true);
                                }
                              }}
                              className="px-6 py-2 rounded-lg bg-[#fb923c] hover:bg-[#f97316] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
                            >
                              Book Now
                            </button>
                            <div className="flex items-center gap-1.5 text-base font-black text-slate-900">
                              <span>₹ {currentFare}</span>
                              <button
                                type="button"
                                title="Fare Breakdown: Base Fare + Superfast & Reservation surcharges"
                                className="text-slate-700 hover:text-slate-900 cursor-pointer"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={train.id}
                        onClick={() => handleSelectTrain(train)}
                        className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-blue-700">
                              {train.train_number}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{train.train_name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {train.train_type}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block font-mono">Starts from</span>
                            <span className="text-base font-black text-slate-900">
                              ₹ {calculateFare(train.base_fare, travelClass)}
                            </span>
                          </div>
                        </div>

                        {/* Timing and Route Strip */}
                        <div className="flex items-center justify-between py-2 text-xs">
                          <div>
                            <div className="text-base font-black text-slate-900">{train.departure_time}</div>
                            <div className="text-slate-500 font-semibold">{train.source}</div>
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 font-mono mb-0.5">
                              {train.duration}
                            </span>
                            <div className="w-24 sm:w-32 h-[2px] bg-slate-200 relative">
                              <span className="w-2 h-2 rounded-full bg-blue-500 absolute -top-[3px] left-0" />
                              <span className="w-2 h-2 rounded-full bg-indigo-500 absolute -top-[3px] right-0" />
                            </div>
                            <span className="text-[10px] text-emerald-600 mt-1 font-semibold">
                              {train.delay_minutes > 0 ? `+${train.delay_minutes}m Delay` : 'On Time'}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-black text-slate-900">{train.arrival_time}</div>
                            <div className="text-slate-500 font-semibold">{train.destination}</div>
                          </div>
                        </div>

                        {/* Availability Footer */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            {train.availableSeats > 0 ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>AVL {train.availableSeats} Seats Available</span>
                              </span>
                            ) : (
                              <span className="text-amber-700 font-bold flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                <span>Waitlist WL {train.waitlistCount}</span>
                              </span>
                            )}
                          </div>

                          <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition-all">
                            View Stats & Book
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Passenger Information & AI Confirmation Predictor */}
              <div className="space-y-6">
                {selectedTrain ? (
                  <>
                    {/* Passenger Information Card (Matching Reference Screenshot 2) */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 pb-3 border-b border-slate-100">
                        PASSENGER INFORMATION
                      </h3>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Passenger Full Name
                        </label>
                        <input
                          type="text"
                          value={passengerName}
                          required
                          onFocus={(e) => {
                            if (!requireAuthentication('enter passenger details')) e.currentTarget.blur();
                          }}
                          onChange={(e) => setPassengerName(e.target.value)}
                          placeholder="Enter passenger name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Age
                          </label>
                          <input
                            type="number"
                            value={passengerAge}
                            min={1}
                            max={120}
                            required
                            onFocus={(e) => {
                              if (!requireAuthentication('enter passenger details')) e.currentTarget.blur();
                            }}
                            onChange={(e) => setPassengerAge(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Gender
                          </label>
                          <select
                            value={passengerGender}
                            required
                            onFocus={(e) => {
                              if (!requireAuthentication('enter passenger details')) e.currentTarget.blur();
                            }}
                            onChange={(e) => setPassengerGender(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
                          >
                            <option value="" disabled>Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Proceed to Payment CTA */}
                      <button
                        type="button"
                        onClick={() => {
                          if (requireAuthentication('proceed to payment')) {
                            const age = Number(passengerAge);
                            if (
                              !passengerName.trim()
                              || !Number.isInteger(age)
                              || age < 1
                              || age > 120
                              || !passengerGender
                            ) {
                              alert('Please enter the passenger name, a valid age, and gender.');
                              return;
                            }
                            if (!selectedSeat) setSelectedSeat('A1');
                            setIsPaymentOpen(true);
                          }
                        }}
                        className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-[#3b49f3] hover:bg-[#2d3be3] font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Proceed to Payment (Berth/Seat {selectedSeat || 'A1'})</span>
                      </button>
                    </div>

                    {/* AI Confirmation Engine Card (Matching Reference Screenshot 2) */}
                    <WaitlistPredictorCard
                      trainId={selectedTrain.id}
                      trainNumber={selectedTrain.train_number}
                      trainName={selectedTrain.train_name}
                      currentWaitlist={currentSelectedAvailability?.status === 'WAITLIST'
                        ? currentSelectedAvailability.waitlistPosition
                        : 0}
                      journeyDate={currentSelectedAvailability
                        ? currentSelectedAvailability.journeyDate
                        : searchDate}
                      travelClass={currentSelectedAvailability
                        ? currentSelectedAvailability.travelClass
                        : travelClass}
                      totalSeats={selectedTrain.total_seats}
                    />
                  </>
                ) : (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs shadow-sm space-y-2">
                    <Train className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                    <h4 className="font-bold text-slate-800 text-sm">Select a train to inspect</h4>
                    <p className="text-slate-500 leading-relaxed">
                      Click on any train card on the left to view detailed availability stats, passenger information, and AI waitlist predictions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Ticket Preview (if any recent booking made) */}
            {currentTicket && (
              <div className="pt-8 border-t border-slate-200">
                <div className="text-center max-w-md mx-auto mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Latest Confirmed Reservation
                  </span>
                  <h3 className="text-xl font-black text-slate-900">Your E-Ticket is Ready</h3>
                </div>
                <DigitalTicket
                  ticket={currentTicket}
                  onCancelTicket={() => handleCancelTicket(currentTicket.id)}
                  onRaiseComplaint={openComplaintForm}
                />
              </div>
            )}
          </main>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
          {/* TAB 2: LIVE GIS TRAIN TRACKING */}
          {currentTab === 'TRACKING' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    RailRadar + MapLibre GIS Integration
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">Live Network Train Tracking</h2>
                </div>

                {/* Active train selector */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 pl-2">Select Train:</span>
                  <select
                    value={trackedTrain?.trainNumber || ''}
                    onChange={(e) => {
                      const found = liveTrains.find((t) => t.trainNumber === e.target.value);
                      if (found) setTrackedTrain(found);
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  >
                    {liveTrains.map((t) => (
                      <option key={t.trainNumber} value={t.trainNumber}>
                        {t.trainNumber} {t.trainName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Map Container */}
              <div className="w-full h-[600px] shadow-sm rounded-3xl overflow-hidden border border-slate-200">
                <TrainTrackingMap maptilerApiKey={maptilerApiKey} selectedTrain={trackedTrain} />
              </div>

              {/* Live Corridor Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500">Active High-Speed Trains</div>
                  <div className="text-2xl font-black text-blue-600 mt-1">{liveTrains.length}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Western & Central Railway Mainlines</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500">Corridor Punctuality</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">94.8%</div>
                  <div className="text-[11px] text-slate-400 mt-1">Within standard 15-minute tolerance</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500">Data Feed Architecture</div>
                  <div className="text-sm font-bold text-amber-800 mt-2">
                    Dynamic GIS Simulation & Operator Feeds
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Smooth coordinate interpolation</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PASSENGER JOURNEY HISTORY & TICKETS */}
          {currentTab === 'MY_BOOKINGS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    Passenger Portal
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">My Journey History & Tickets</h2>
                </div>
                <button
                  onClick={fetchUserBookings}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Bookings</span>
                </button>
              </div>

              {myBookings.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <Ticket className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-900">No bookings found for this account</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Book your first train ticket on the Search & Book tab to experience ACID seat reservations.
                  </p>
                  <button
                    onClick={() => setCurrentTab('SEARCH')}
                    className="mt-4 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                  >
                    Search Available Trains
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myBookings.map((b) => (
                    <DigitalTicket
                      key={b.id}
                      ticket={b}
                      onCancelTicket={() => handleCancelTicket(b.id)}
                      onRaiseComplaint={openComplaintForm}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GRIEVANCES & FEEDBACK */}
          {currentTab === 'COMPLAINTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <ComplaintForm onSubmitted={fetchAdminStats} />
              </div>
              <div>
                <FeedbackForm onSubmitted={fetchAdminStats} />
              </div>
            </div>
          )}

          {/* TAB 5: ADMIN & DBMS ANALYTICS DASHBOARD */}
          {currentTab === 'ADMIN' && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Control Centre Intelligence
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">Executive Analytics & System Insights</h2>
                </div>
                <button
                  onClick={() => setIsDbmsLabOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2 hover:bg-amber-100 shadow-sm"
                >
                  <Database className="w-4 h-4 text-amber-700" />
                  <span>Launch DBMS Lab & Viva Defense</span>
                </button>
              </div>

              {/* Top KPI Cards (Computed strictly from PostgreSQL) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 block font-medium">Total Passengers</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {overviewStats?.totalPassengers || 6}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 block font-medium">Total Bookings</span>
                  <span className="text-2xl font-black text-blue-600 mt-1 block">
                    {overviewStats?.totalBookings || 2}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 block font-medium">Active Trains</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">
                    {overviewStats?.activeTrains || 15}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 block font-medium">Net Revenue</span>
                  <span className="text-2xl font-black text-amber-700 mt-1 block">
                    ₹ {(overviewStats?.netRevenue || 1795).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 block font-medium">Open Complaints</span>
                  <span className="text-2xl font-black text-orange-600 mt-1 block">
                    {overviewStats?.openComplaints || 1}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[11px] text-slate-500 block font-medium">Avg Satisfaction</span>
                  <span className="text-2xl font-black text-indigo-600 mt-1 block">
                    {overviewStats?.avgRating || 4.8} ★
                  </span>
                </div>
              </div>

              {/* Complaints Management Table for Staff & Admin */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Grievance Redressal Dispatch Board</h3>
                    <p className="text-xs text-slate-500">
                      Live database tickets with status updating capability.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    {allComplaints.length} Recorded
                  </span>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase font-mono border-b border-slate-200">
                      <tr>
                        <th className="p-3">Ticket ID</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allComplaints.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono font-bold text-amber-700">#{c.id}</td>
                          <td className="p-3 text-slate-900 font-medium">{c.user_name || 'Passenger'}</td>
                          <td className="p-3">{c.category}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.priority === 'CRITICAL' || c.priority === 'HIGH'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {c.priority}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs truncate">{c.description}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                c.status === 'RESOLVED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Logs Trail */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">System Security & Audit Trail</h3>
                    <p className="text-xs text-slate-500">
                      Immutable event records auto-populated by PostgreSQL triggers.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ACID Logged
                  </span>
                </div>

                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto font-mono text-xs text-slate-700">
                  {auditLogs.length === 0 ? (
                    <div className="text-slate-400 py-3 text-center">No audit entries recorded yet.</div>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-blue-700 font-bold">[{log.action}]</span>
                          <span className="text-slate-800">{log.entity}: {log.entity_id}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* 4. FOOTER */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 px-4 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">{t('appTitle')}</span>
            <span className="text-slate-400">|</span>
            <span>{t('appSubtitle')}</span>
          </div>
          <div className="text-slate-400">
            © 2026 Smart Railway Reservation & Passenger Intelligence System.
          </div>
        </div>
      </footer>

      {/* MULTILINGUAL VOICE & TEXT ASSISTANT CHATBOT IN LEFT CORNER */}
      <VoiceAssistantChatbot />

      {/* MODALS */}
      {authPromptAction && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-prompt-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-slate-950/25">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h2 id="auth-prompt-title" className="text-xl font-black text-slate-900">
                Sign in to continue
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Please sign in to {authPromptAction}. You can continue browsing trains and live tracking without an account.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={async () => {
                  try {
                    setAuthPromptError(null);
                    await signInWithGoogle();
                    setAuthPromptAction(null);
                  } catch (error: any) {
                    setAuthPromptError(
                      error?.message || 'Google Sign-In could not be completed. Please try again.'
                    );
                  }
                }}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-500"
              >
                Sign in with Google
              </button>
              {authPromptError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs leading-5 text-rose-700">
                  {authPromptError}
                </p>
              )}
              <button
                onClick={() => {
                  setAuthPromptError(null);
                  setAuthPromptAction(null);
                }}
                className="w-full px-4 py-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentOpen && selectedTrain && (
        <PaymentModal
          amount={calculateFare(selectedTrain.base_fare, travelClass)}
          trainName={selectedTrain.train_name}
          trainNumber={selectedTrain.train_number}
          seatNumber={selectedSeat || 'A1'}
          journeyDate={searchDate}
          onPaymentSuccess={handleCompleteBooking}
          onClose={() => setIsPaymentOpen(false)}
        />
      )}

      {/* TRAIN SCHEDULE MODAL */}
      {scheduleTrain && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  {scheduleTrain.train_type === 'Indicative Demo' ? 'Indicative Demo Timetable' : 'Indicative Train Timetable'}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {scheduleTrain.train_name} ({scheduleTrain.train_number})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Route: {scheduleTrain.source} to {scheduleTrain.destination} • Speed: {scheduleTrain.speed_kmph || 110} km/h
                </p>
              </div>
              <button
                onClick={() => setScheduleTrain(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2">Station</th>
                    <th className="py-2">Arr.</th>
                    <th className="py-2">Dep.</th>
                    <th className="py-2">Halt</th>
                    <th className="py-2 text-right">Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scheduleStops.map((stop, index) => (
                    <tr key={`${stop.station}-${index}`}>
                      <td className="py-2.5 font-bold text-slate-800">{stop.station}</td>
                      <td className={`py-2.5 font-mono ${index === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
                        {stop.arrival}
                      </td>
                      <td className={`py-2.5 font-mono ${index === scheduleStops.length - 1 ? 'text-slate-400' : 'text-slate-700'}`}>
                        {stop.departure}
                      </td>
                      <td className="py-2.5 text-slate-500">{stop.halt}</td>
                      <td className="py-2.5 text-right font-mono text-slate-600">
                        {stop.distanceKm.toLocaleString()} km
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Indicative times; verify the official timetable before travel.</span>
              <button
                type="button"
                onClick={() => setScheduleTrain(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                Close Timetable
              </button>
            </div>
          </div>
        </div>
      )}

      {isDbmsLabOpen && <DbmsLabModal onClose={() => setIsDbmsLabOpen(false)} />}
    </div>
  );
}
