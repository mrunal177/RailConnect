import { getSimulatedTrainPosition, TrainTrackingData } from './tracking.ts';

type RailRadarStop = { stationCode?: string; stationName?: string; lat?: number; lng?: number };
type RailRadarResponse = { success?: boolean; data?: { trainNumber?: string; trainName?: string; lastUpdatedAt?: string; delayMinutes?: number; status?: string; train?: { name?: string; source?: { name?: string }; destination?: { name?: string } }; currentLocation?: { stationCode?: string; speedKmh?: number; bearingDegrees?: number; segmentProgress?: number }; nextHalt?: { stationCode?: string; scheduledArrival?: string }; route?: RailRadarStop[] } };

const CACHE_MS = 45_000;
const cache = new Map<string, { expiresAt: number; value: TrainTrackingData }>();

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
