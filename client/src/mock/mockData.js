// Mock Data Repository for UI Demonstration & Standalone Development

export const MOCK_TRAINS = [
  {
    id: 't1',
    trainNumber: '22436',
    trainName: 'Vande Bharat Express',
    trainType: 'Vande Bharat',
    speed: '160 km/h',
    source: 'NDLS',
    sourceName: 'New Delhi',
    destination: 'CSMT',
    destinationName: 'Mumbai CSMT',
    departureTime: '06:00 AM',
    arrivalTime: '02:30 PM',
    duration: '8h 30m',
    punctuality: '99.2%',
    runsOn: ['Mon', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    classes: [
      { type: 'CC', label: 'AC Chair Car', price: 1850, available: 42, status: 'AVAILABLE' },
      { type: 'EC', label: 'Executive Chair', price: 3200, available: 8, status: 'AVAILABLE' }
    ]
  },
  {
    id: 't2',
    trainNumber: '12952',
    trainName: 'Mumbai Rajdhani Express',
    trainType: 'Rajdhani',
    speed: '130 km/h',
    source: 'NDLS',
    sourceName: 'New Delhi',
    destination: 'CSMT',
    destinationName: 'Mumbai CSMT',
    departureTime: '04:55 PM',
    arrivalTime: '08:35 AM',
    duration: '15h 40m',
    punctuality: '98.5%',
    runsOn: ['Daily'],
    classes: [
      { type: '3A', label: 'AC 3 Tier', price: 1950, available: 54, status: 'AVAILABLE' },
      { type: '2A', label: 'AC 2 Tier', price: 2850, available: 16, status: 'AVAILABLE' },
      { type: '1A', label: 'AC 1st Class', price: 4300, available: 3, status: 'RAC 2' }
    ]
  },
  {
    id: 't3',
    trainNumber: '12002',
    trainName: 'Bhopal Shatabdi Express',
    trainType: 'Shatabdi',
    speed: '150 km/h',
    source: 'NDLS',
    sourceName: 'New Delhi',
    destination: 'RKMP',
    destinationName: 'Rani Kamlapati',
    departureTime: '06:00 AM',
    arrivalTime: '02:05 PM',
    duration: '8h 05m',
    punctuality: '97.8%',
    runsOn: ['Daily'],
    classes: [
      { type: 'CC', label: 'AC Chair Car', price: 1520, available: 78, status: 'AVAILABLE' },
      { type: 'EC', label: 'Executive Chair', price: 2650, available: 14, status: 'AVAILABLE' }
    ]
  }
];

export const MOCK_BOOKINGS = [
  {
    id: 'b1',
    pnr: '8429104821',
    trainNumber: '22436',
    trainName: 'Vande Bharat Express',
    source: 'New Delhi (NDLS)',
    destination: 'Mumbai CSMT',
    journeyDate: '2026-10-15',
    classType: 'CC',
    passengers: [
      { name: 'Rahul Sharma', age: 28, gender: 'Male', coach: 'C4', seat: '32', status: 'CONFIRMED' },
      { name: 'Priya Sharma', age: 26, gender: 'Female', coach: 'C4', seat: '33', status: 'CONFIRMED' }
    ],
    status: 'CONFIRMED',
    totalFare: 3700,
    bookingDate: '2026-09-01'
  },
  {
    id: 'b2',
    pnr: '9123847120',
    trainNumber: '12952',
    trainName: 'Mumbai Rajdhani Express',
    source: 'New Delhi (NDLS)',
    destination: 'Mumbai CSMT',
    journeyDate: '2026-10-18',
    classType: '2A',
    passengers: [
      { name: 'Rahul Sharma', age: 28, gender: 'Male', coach: 'B2', seat: 'WL 4', status: 'WAITLIST' }
    ],
    status: 'WAITLIST',
    totalFare: 2850,
    bookingDate: '2026-09-05'
  }
];

export const MOCK_COMPLAINTS = [
  {
    id: 'CMP_101',
    pnr: '8429104821',
    category: 'Cleanliness',
    description: 'Coach C4 washroom sanitization requested prior to departure.',
    status: 'RESOLVED',
    sentiment: 'Neutral',
    date: '2026-09-10'
  },
  {
    id: 'CMP_102',
    pnr: '9123847120',
    category: 'Electrical & AC',
    description: 'Reading light near seat 32 non-functional.',
    status: 'IN_PROGRESS',
    sentiment: 'Negative',
    date: '2026-09-14'
  }
];

export const MOCK_ADMIN_STATS = {
  totalBookings: '14,820',
  activeTrains: '42',
  dailyPassengers: '28,450',
  revenue: '₹14.89 L',
  onTimePunctuality: '96.8%',
  openComplaints: '12'
};

export const STATIONS = [
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'CSMT', name: 'Mumbai CSMT' },
  { code: 'HWH', name: 'Howrah Junction' },
  { code: 'MAS', name: 'Chennai Central' },
  { code: 'SBC', name: 'Bengaluru City' },
  { code: 'ADI', name: 'Ahmedabad Junction' }
];
