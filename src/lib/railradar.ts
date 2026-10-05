import { getSimulatedTrainPosition, TrainTrackingData } from './tracking.ts';

type RailRadarStop = { stationCode?: string; stationName?: string; lat?: number; lng?: number };
type RailRadarResponse = { success?: boolean; data?: { trainNumber?: string; trainName?: string; lastUpdatedAt?: string; delayMinutes?: number; status?: string; train?: { name?: string; source?: { name?: string }; destination?: { name?: string } }; currentLocation?: { stationCode?: string; speedKmh?: number; bearingDegrees?: number; segmentProgress?: number }; nextHalt?: { stationCode?: string; scheduledArrival?: string }; route?: RailRadarStop[] } };

const CACHE_MS = 45_000;
const cache = new Map<string, { expiresAt: number; value: TrainTrackingData }>();

export const STATION_CODE_MAP: Record<string, string> = {
  'Mumbai': 'MMCT',
  'Mumbai Central': 'MMCT',
  'CSMT': 'CSMT',
  'Delhi': 'NDLS',
  'New Delhi': 'NDLS',
  'Pune': 'PUNE',
  'Ahmedabad': 'ADI',
  'Bengaluru': 'SBC',
  'Bangalore': 'SBC',
  'Chennai': 'MAS',
  'Jaipur': 'JP',
  'MMCT': 'MMCT',
  'NDLS': 'NDLS',
  'PUNE': 'PUNE',
  'ADI': 'ADI',
  'SBC': 'SBC',
  'MAS': 'MAS',
  'JP': 'JP',
};

export const STATION_NAME_MAP: Record<string, string> = {
  'MMCT': 'Mumbai',
  'CSMT': 'Mumbai',
  'BCT': 'Mumbai',
  'NDLS': 'Delhi',
  'DLI': 'Delhi',
  'NZM': 'Delhi',
  'PUNE': 'Pune',
  'ADI': 'Ahmedabad',
  'SBC': 'Bengaluru',
  'YPR': 'Bengaluru',
  'MAS': 'Chennai',
  'MS': 'Chennai',
  'JP': 'Jaipur',
};

export interface RailRadarBetweenTrain {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  classes: string;
  trainType: string;
  baseFare: string;
  speedKmph: number;
  delayMinutes: number;
  trainStatus: string;
  currentStation: string;
  nextStation: string;
}

export interface RailRadarBetweenResult {
  success: boolean;
  source: 'railradar-api' | 'catalog';
  apiEndpoint: string;
  fromCode: string;
  toCode: string;
  trains: RailRadarBetweenTrain[];
  error?: string;
}

const betweenCache = new Map<string, { expiresAt: number; value: RailRadarBetweenResult }>();

/**
 * Calls https://api.railradar.in/v1/trains/between/{from}/{to}
 * and extracts all available trains operating between the two stations.
 */
export async function getRailRadarTrainsBetween(
  from: string,
  to: string,
  date?: string
): Promise<RailRadarBetweenResult> {
  const fromClean = (from || 'Mumbai').trim();
  const toClean = (to || 'Delhi').trim();
  const fromCode = STATION_CODE_MAP[fromClean] || fromClean.toUpperCase();
  const toCode = STATION_CODE_MAP[toClean] || toClean.toUpperCase();
  const endpoint = `https://api.railradar.in/v1/trains/between/${encodeURIComponent(fromCode)}/${encodeURIComponent(toCode)}`;
  const cacheKey = `${fromCode}_${toCode}_${date || ''}`;

  const cached = betweenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const apiKey = process.env.RAILRADAR_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      source: 'catalog',
      apiEndpoint: endpoint,
      fromCode,
      toCode,
      trains: [],
      error: 'RAILRADAR_API_KEY is not configured',
    };
  }

  try {
    const url = date ? `${endpoint}?date=${encodeURIComponent(date)}` : endpoint;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const result: RailRadarBetweenResult = {
        success: false,
        source: 'catalog',
        apiEndpoint: endpoint,
        fromCode,
        toCode,
        trains: [],
        error: `RailRadar API HTTP error ${response.status}`,
      };
      betweenCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_MS });
      return result;
    }

    const json: any = await response.json();
    const rawList = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.data?.trains)
      ? json.data.trains
      : Array.isArray(json?.trains)
      ? json.trains
      : [];

    const trains: RailRadarBetweenTrain[] = rawList.map((t: any) => {
      const trainNumber = String(t.trainNumber || t.train_number || t.number || '').trim();
      const trainName = String(t.trainName || t.train_name || t.name || `Train ${trainNumber}`).trim();
      const dep = String(t.departureTime || t.departure_time || t.std || t.dep || '08:00').slice(0, 5);
      const arr = String(t.arrivalTime || t.arrival_time || t.sta || t.arr || '18:00').slice(0, 5);
      const duration = String(t.duration || t.travelTime || '10h 00m');
      const classesRaw = t.classes || t.availableClasses || t.classType || '1A,2A,3A,SL';
      const classes = Array.isArray(classesRaw) ? classesRaw.join(',') : String(classesRaw);
      const baseFare = String(t.baseFare || t.fare || '950.00');
      const trainType = String(t.trainType || t.train_type || t.type || 'Superfast');
      const speedKmph = Number(t.speedKmph || t.speed || 95);
      const delayMinutes = Number(t.delayMinutes || t.delay || 0);

      return {
        trainNumber,
        trainName,
        source: STATION_NAME_MAP[fromCode] || fromClean,
        destination: STATION_NAME_MAP[toCode] || toClean,
        departureTime: dep,
        arrivalTime: arr,
        duration,
        classes,
        trainType,
        baseFare,
        speedKmph,
        delayMinutes,
        trainStatus: delayMinutes > 15 ? 'DELAYED' : 'ON_TIME',
        currentStation: t.currentStation || fromClean,
        nextStation: t.nextStation || toClean,
      };
    }).filter((t: RailRadarBetweenTrain) => t.trainNumber.length > 0);

    const result: RailRadarBetweenResult = {
      success: trains.length > 0,
      source: trains.length > 0 ? 'railradar-api' : 'catalog',
      apiEndpoint: endpoint,
      fromCode,
      toCode,
      trains,
    };

    betweenCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_MS });
    return result;
  } catch (err: any) {
    const result: RailRadarBetweenResult = {
      success: false,
      source: 'catalog',
      apiEndpoint: endpoint,
      fromCode,
      toCode,
      trains: [],
      error: err?.message || 'Network error fetching RailRadar trains between',
    };
    betweenCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_MS });
    return result;
  }
}

function toEta(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function createLiveTracking(raw: RailRadarResponse['data'], fallback: TrainTrackingData): TrainTrackingData | null {
  if (!raw?.route?.length) return null;
  const stations = raw.route.filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng)).map((stop) => ({ name: stop.stationName || stop.stationCode || 'Railway station', code: stop.stationCode || '—', lat: Number(stop.lat), lng: Number(stop.lng) }));
  if (!stations.length) return null;
  const currentIndex = Math.max(0, stations.findIndex((station) => station.code === raw.currentLocation?.stationCode));
  const current = stations[currentIndex];
  const next = stations.find((station) => station.code === raw.nextHalt?.stationCode) || stations[Math.min(stations.length - 1, currentIndex + 1)];
  const progress = Math.min(1, Math.max(0, Number(raw.currentLocation?.segmentProgress ?? 0)));
  const delayMinutes = Number(raw.delayMinutes || 0);
  return {
    trainNumber: raw.trainNumber || fallback.trainNumber, trainName: raw.trainName || raw.train?.name || fallback.trainName,
    source: raw.train?.source?.name || fallback.source, destination: raw.train?.destination?.name || fallback.destination,
    currentStation: current.name, nextStation: next.name, etaNextStation: toEta(raw.nextHalt?.scheduledArrival), delayMinutes,
    speedKmph: Math.round(Number(raw.currentLocation?.speedKmh || 0)), status: delayMinutes > 15 ? 'Delayed' : raw.status?.toLowerCase() === 'running' ? 'Running' : 'Stationary',
    latitude: Number((current.lat + (next.lat - current.lat) * progress).toFixed(5)), longitude: Number((current.lng + (next.lng - current.lng) * progress).toFixed(5)),
    bearing: Math.round(Number(raw.currentLocation?.bearingDegrees || 0)), mode: 'Live Operator Feed', lastUpdated: raw.lastUpdatedAt || new Date().toISOString(), stations,
  };
}

/** Reads RailRadar from the server so the Bearer token never reaches the browser. */
export async function getRailRadarTracking(trainNumber: string, trainName: string, source: string, destination: string, speed: number, delay: number): Promise<TrainTrackingData> {
  const fallback = getSimulatedTrainPosition(trainNumber, trainName, source, destination, speed, delay);
  const apiKey = process.env.RAILRADAR_API_KEY;
  const cached = cache.get(trainNumber);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (!apiKey) return fallback;
  try {
    const response = await fetch(`https://api.railradar.in/v1/trains/${encodeURIComponent(trainNumber)}/live`, { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) {
      cache.set(trainNumber, { value: fallback, expiresAt: Date.now() + CACHE_MS });
      return fallback;
    }
    const payload = await response.json() as RailRadarResponse;
    const live = payload.success ? createLiveTracking(payload.data, fallback) : null;
    if (!live) {
      cache.set(trainNumber, { value: fallback, expiresAt: Date.now() + CACHE_MS });
      return fallback;
    }
    cache.set(trainNumber, { value: live, expiresAt: Date.now() + CACHE_MS });
    return live;
  } catch {
    cache.set(trainNumber, { value: fallback, expiresAt: Date.now() + CACHE_MS });
    return fallback;
  }
}
