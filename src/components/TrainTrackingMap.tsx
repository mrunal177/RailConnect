import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { featureCollection, lineString, point } from '@turf/turf';
import { TrainTrackingData } from '../lib/tracking.ts';
import { CloudSun, Compass, Train, Wind } from 'lucide-react';

interface TrackingMapProps { maptilerApiKey: string; selectedTrain: TrainTrackingData | null; }
type Weather = { temperature: number; description: string; windKmph: number } | null;
const FALLBACK_STYLE = 'https://demotiles.maplibre.org/style.json';

export const TrainTrackingMap: React.FC<TrackingMapProps> = ({ maptilerApiKey, selectedTrain }) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [weather, setWeather] = useState<Weather>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    const style = maptilerApiKey ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${encodeURIComponent(maptilerApiKey)}` : FALLBACK_STYLE;
    map.current = new maplibregl.Map({ container: container.current, style, center: [73, 19.8], zoom: 6.4 });
    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    return () => { map.current?.remove(); map.current = null; };
  }, [maptilerApiKey]);

  useEffect(() => {
    if (!selectedTrain || !map.current) return;
    const currentMap = map.current;
    const updateLayers = () => {
      const route = lineString(selectedTrain.stations.map((station) => [station.lng, station.lat]), { trainNumber: selectedTrain.trainNumber });
      const train = point([selectedTrain.longitude, selectedTrain.latitude], { bearing: selectedTrain.bearing });
      const stations = featureCollection(selectedTrain.stations.map((station) => point([station.lng, station.lat], station)));
      const set = (id: string, data: GeoJSON.FeatureCollection | GeoJSON.Feature) => (currentMap.getSource(id) as GeoJSONSource).setData(data);
      if (currentMap.getSource('rail-route')) {
        set('rail-route', route); set('rail-stations', stations); set('live-train', train);
      } else {
        currentMap.addSource('rail-route', { type: 'geojson', data: route });
        currentMap.addLayer({ id: 'rail-route', type: 'line', source: 'rail-route', paint: { 'line-color': '#2563eb', 'line-width': 4, 'line-opacity': 0.85 } });
        currentMap.addSource('rail-stations', { type: 'geojson', data: stations });
        currentMap.addLayer({ id: 'rail-stations', type: 'circle', source: 'rail-stations', paint: { 'circle-radius': 5, 'circle-color': '#ffffff', 'circle-stroke-color': '#475569', 'circle-stroke-width': 2 } });
        currentMap.addSource('live-train', { type: 'geojson', data: train });
        currentMap.addLayer({ id: 'live-train', type: 'circle', source: 'live-train', paint: { 'circle-radius': 10, 'circle-color': '#2563eb', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } });
      }
      currentMap.easeTo({ center: [selectedTrain.longitude, selectedTrain.latitude], zoom: 8, duration: 750 });
    };
    currentMap.loaded() ? updateLayers() : currentMap.once('load', updateLayers);
  }, [selectedTrain]);

  useEffect(() => {
    if (!selectedTrain) return;
    const controller = new AbortController();
    fetch(`/api/weather?lat=${selectedTrain.latitude}&lon=${selectedTrain.longitude}`, { signal: controller.signal })
      .then((res) => res.status === 204 ? null : res.ok ? res.json() : null).then(setWeather).catch(() => undefined);
    return () => controller.abort();
  }, [selectedTrain?.trainNumber, selectedTrain?.latitude, selectedTrain?.longitude]);

  return <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-50">
    <div ref={container} className="absolute inset-0" />
    <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
      <div className="px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm"><span className="inline-block w-2.5 h-2.5 mr-2 rounded-full bg-emerald-500 animate-pulse" />{selectedTrain?.mode || 'Awaiting feed'}</div>
      {selectedTrain && <div className="px-3.5 py-1.5 rounded-full bg-blue-50/95 border border-blue-200 text-xs font-bold text-blue-700 shadow-sm"><Train className="inline w-3.5 h-3.5 mr-1.5" />{selectedTrain.trainNumber} {selectedTrain.trainName}</div>}
    </div>
    {selectedTrain && <div className="absolute bottom-4 right-4 z-10 max-w-sm w-[calc(100%-2rem)] bg-white/95 border border-slate-200 rounded-3xl p-4 shadow-xl text-slate-800 pointer-events-none">
      <div className="flex justify-between gap-3 pb-3 border-b border-slate-100"><div><div className="text-xs font-bold text-blue-600 uppercase">Live RailRadar feed</div><h4 className="font-bold">{selectedTrain.currentStation} → {selectedTrain.nextStation}</h4></div><span className="text-xs font-bold text-amber-700">{selectedTrain.delayMinutes ? `+${selectedTrain.delayMinutes} min` : 'ON TIME'}</span></div>
      <div className="grid grid-cols-2 gap-2.5 my-3 text-xs"><div className="bg-slate-50 p-2 rounded-xl"><Compass className="inline w-3.5 h-3.5 mr-1 text-blue-600" />{selectedTrain.speedKmph} km/h</div><div className="bg-slate-50 p-2 rounded-xl">ETA {selectedTrain.etaNextStation}</div>{weather && <><div className="bg-slate-50 p-2 rounded-xl"><CloudSun className="inline w-3.5 h-3.5 mr-1 text-amber-600" />{weather.temperature}°C, {weather.description}</div><div className="bg-slate-50 p-2 rounded-xl"><Wind className="inline w-3.5 h-3.5 mr-1 text-slate-500" />{weather.windKmph} km/h</div></>}</div>
      {!maptilerApiKey && <p className="text-[10px] text-slate-500">Using the MapLibre fallback style. Add VITE_MAPTILER_API_KEY for MapTiler terrain.</p>}
    </div>}
  </div>;
};
