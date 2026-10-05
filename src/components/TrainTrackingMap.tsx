import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { featureCollection, lineString, point } from '@turf/turf';
import { TrainTrackingData } from '../lib/tracking.ts';
import { CloudSun, Compass, Train, Wind } from 'lucide-react';

interface TrackingMapProps { maptilerApiKey: string; selectedTrain: TrainTrackingData | null; }
type Weather = { temperature: number; description: string; windKmph: number } | null;
const FALLBACK_STYLE = 'https://demotiles.maplibre.org/style.json';

// MapLibre GL JS v6 is ESM-only. Vite must compile the worker as its own asset;
// otherwise the map mounts but cannot request or render vector tiles.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

export const TrainTrackingMap: React.FC<TrackingMapProps> = ({ maptilerApiKey, selectedTrain }) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [weather, setWeather] = useState<Weather>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!container.current || map.current) return;
    const style = maptilerApiKey ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${encodeURIComponent(maptilerApiKey)}` : FALLBACK_STYLE;
    const mapInstance = new maplibregl.Map({ container: container.current, style, center: [73, 19.8], zoom: 6.4 });
    map.current = mapInstance;
    setMapReady(false);
    mapInstance.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    // The tracking tab can be mounted after its parent has been laid out. Keep
    // MapLibre's WebGL canvas in sync with its actual available dimensions.
    const resizeObserver = new ResizeObserver(() => mapInstance.resize());
    resizeObserver.observe(container.current);
    mapInstance.once('load', () => {
      mapInstance.resize();
      setMapReady(true);
    });

    return () => {
      resizeObserver.disconnect();
      mapInstance.remove();
      if (map.current === mapInstance) map.current = null;
      setMapReady(false);
    };
  }, [maptilerApiKey]);

  useEffect(() => {
    if (!selectedTrain || !map.current || !mapReady) return;
    const currentMap = map.current;
    let pulseFrame: number | undefined;
    const updateLayers = () => {
      const route = lineString(selectedTrain.stations.map((station) => [station.lng, station.lat]), { trainNumber: selectedTrain.trainNumber });
      const train = point([selectedTrain.longitude, selectedTrain.latitude], { bearing: selectedTrain.bearing });
      const stations = featureCollection(selectedTrain.stations.map((station) => point([station.lng, station.lat], station)));
      const set = (id: string, data: GeoJSON.FeatureCollection | GeoJSON.Feature) => (currentMap.getSource(id) as GeoJSONSource).setData(data);
      if (currentMap.getSource('rail-route')) {
        set('rail-route', route); set('rail-stations', stations); set('live-train', train); set('train-target', train);
      } else {
        currentMap.addSource('rail-route', { type: 'geojson', data: route });
        currentMap.addLayer({ id: 'rail-route', type: 'line', source: 'rail-route', paint: { 'line-color': '#2563eb', 'line-width': 4, 'line-opacity': 0.85 } });
        currentMap.addSource('rail-stations', { type: 'geojson', data: stations });
        currentMap.addLayer({ id: 'rail-stations', type: 'circle', source: 'rail-stations', paint: { 'circle-radius': 5, 'circle-color': '#ffffff', 'circle-stroke-color': '#475569', 'circle-stroke-width': 2 } });
        currentMap.addSource('live-train', { type: 'geojson', data: train });
        currentMap.addLayer({ id: 'live-train', type: 'circle', source: 'live-train', paint: { 'circle-radius': 10, 'circle-color': '#2563eb', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 } });
        currentMap.addSource('train-target', { type: 'geojson', data: train });
        currentMap.addLayer({ id: 'train-target', type: 'circle', source: 'train-target', paint: { 'circle-radius': 12, 'circle-color': '#2563eb', 'circle-opacity': 0, 'circle-stroke-color': '#60a5fa', 'circle-stroke-width': 2, 'circle-stroke-opacity': 0 } });
      }
      currentMap.flyTo({ center: [selectedTrain.longitude, selectedTrain.latitude], zoom: 8, duration: 900, essential: true });

      const startedAt = performance.now();
      const pulse = (now: number) => {
        const progress = Math.min((now - startedAt) / 900, 1);
        currentMap.setPaintProperty('train-target', 'circle-radius', 12 + progress * 24);
        currentMap.setPaintProperty('train-target', 'circle-opacity', (1 - progress) * 0.16);
        currentMap.setPaintProperty('train-target', 'circle-stroke-opacity', (1 - progress) * 0.85);
        if (progress < 1) pulseFrame = requestAnimationFrame(pulse);
      };
      pulseFrame = requestAnimationFrame(pulse);
    };
    updateLayers();
    return () => { if (pulseFrame !== undefined) cancelAnimationFrame(pulseFrame); };
  }, [selectedTrain, mapReady]);

  useEffect(() => {
    if (!selectedTrain) return;
    const controller = new AbortController();
    fetch(`/api/weather?lat=${selectedTrain.latitude}&lon=${selectedTrain.longitude}`, { signal: controller.signal })
      .then((res) => res.status === 204 ? null : res.ok ? res.json() : null).then(setWeather).catch(() => undefined);
    return () => controller.abort();
  }, [selectedTrain?.trainNumber, selectedTrain?.latitude, selectedTrain?.longitude]);

  return <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-50">
    {/* MapLibre assigns .maplibregl-map to this exact node. Inline positioning
        wins over MapLibre's default position: relative, which otherwise causes
        the absolutely positioned canvas to collapse to zero height. */}
    <div ref={container} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
      <div className="px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm"><span className="inline-block w-2.5 h-2.5 mr-2 rounded-full bg-emerald-500 animate-pulse" />{selectedTrain?.mode || 'Awaiting feed'}</div>
      {selectedTrain && <div className="px-3.5 py-1.5 rounded-full bg-blue-50/95 border border-blue-200 text-xs font-bold text-blue-700 shadow-sm"><Train className="inline w-3.5 h-3.5 mr-1.5" />{selectedTrain.trainNumber} {selectedTrain.trainName}</div>}
    </div>
    {selectedTrain && <div className="absolute bottom-4 right-4 z-10 max-w-sm w-[calc(100%-2rem)] bg-white/95 border border-slate-200 rounded-3xl p-4 shadow-xl text-slate-800 pointer-events-none">
      <div className="flex justify-between gap-3 pb-3 border-b border-slate-100"><div><div className="text-xs font-bold text-blue-600 uppercase">Live RailRadar feed</div><h4 className="font-bold">{selectedTrain.currentStation} → {selectedTrain.nextStation}</h4></div><span className={`text-xs font-bold ${selectedTrain.delayMinutes ? 'text-amber-700' : 'text-emerald-700'}`}>{selectedTrain.delayMinutes ? `+${selectedTrain.delayMinutes} min` : 'ON TIME'}</span></div>
      <div className="grid grid-cols-2 gap-2.5 my-3 text-xs"><div className="bg-slate-50 p-2 rounded-xl"><Compass className="inline w-3.5 h-3.5 mr-1 text-blue-600" />{selectedTrain.speedKmph} km/h</div><div className="bg-slate-50 p-2 rounded-xl">ETA {selectedTrain.etaNextStation}</div>{weather && <><div className="bg-slate-50 p-2 rounded-xl"><CloudSun className="inline w-3.5 h-3.5 mr-1 text-amber-600" />{weather.temperature}°C, {weather.description}</div><div className="bg-slate-50 p-2 rounded-xl"><Wind className="inline w-3.5 h-3.5 mr-1 text-slate-500" />{weather.windKmph} km/h</div></>}</div>
      {!maptilerApiKey && <p className="text-[10px] text-slate-500">Using the MapLibre fallback style. Add VITE_MAPTILER_API_KEY for MapTiler terrain.</p>}
    </div>}
  </div>;
};
