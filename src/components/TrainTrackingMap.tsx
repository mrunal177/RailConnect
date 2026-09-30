import React from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';
import { TrainTrackingData, StationLocation } from '../lib/tracking.ts';
import { Train, Clock, Compass } from 'lucide-react';

interface TrackingMapProps {
  apiKey: string;
  selectedTrain: TrainTrackingData | null;
  onSelectStation?: (station: StationLocation) => void;
}

export const TrainTrackingMap: React.FC<TrackingMapProps> = ({
  apiKey,
  selectedTrain,
}) => {
  const defaultCenter = selectedTrain
    ? { lat: selectedTrain.latitude, lng: selectedTrain.longitude }
    : { lat: 19.8, lng: 73.0 }; // Corridor center

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-50">
      {/* Live Map Header Status Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-500">Tracking:</span>
          <span className="text-blue-600 font-bold">{selectedTrain?.mode || 'Demo Train Tracking'}</span>
        </div>

        {selectedTrain && (
          <div className="px-3.5 py-1.5 rounded-full bg-blue-50/95 backdrop-blur-md border border-blue-200 text-xs font-semibold text-blue-700 flex items-center gap-2 shadow-sm">
            <Train className="w-3.5 h-3.5 text-blue-600" />
            <span>{selectedTrain.trainNumber} {selectedTrain.trainName}</span>
          </div>
        )}
      </div>

      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={defaultCenter}
          center={selectedTrain ? { lat: selectedTrain.latitude, lng: selectedTrain.longitude } : defaultCenter}
          defaultZoom={7}
          zoom={selectedTrain ? 8 : 7}
          mapId="DEMO_MAP_ID"
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          }}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {/* Station Markers */}
          {selectedTrain?.stations.map((st, idx) => {
            const isCurrent = st.name.toLowerCase().includes(selectedTrain.currentStation.toLowerCase());
            const isNext = st.name.toLowerCase().includes(selectedTrain.nextStation.toLowerCase());

            return (
              <AdvancedMarker
                key={`st-${idx}-${st.name}`}
                position={{ lat: st.lat, lng: st.lng }}
                title={`${st.name} (${st.code})`}
              >
                <div className="relative group cursor-pointer">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all shadow-md ${
                      isCurrent
                        ? 'bg-amber-400 border-white text-slate-900 scale-125 ring-4 ring-amber-200'
                        : isNext
                        ? 'bg-blue-600 border-white text-white scale-110 ring-4 ring-blue-200'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
                    }`}
                  >
                    🚉
                  </div>
                  {/* Station Tooltip */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg shadow-lg border border-slate-700 pointer-events-none z-20">
                    {st.name} ({st.code})
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Active Train Marker */}
          {selectedTrain && (
            <AdvancedMarker
              position={{ lat: selectedTrain.latitude, lng: selectedTrain.longitude }}
              title={`${selectedTrain.trainNumber} - ${selectedTrain.trainName}`}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                {/* Radar pulse */}
                <div className="absolute w-14 h-14 bg-blue-400/30 rounded-full animate-ping pointer-events-none" />
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 border-2 border-white shadow-xl flex items-center justify-center text-white transform hover:scale-110 transition-transform">
                  <Train className="w-5 h-5 text-white" />
                </div>
                {/* Mini Speed Tag */}
                <div className="absolute -top-7 whitespace-nowrap bg-white/95 text-[10px] text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-mono shadow-sm font-bold">
                  {selectedTrain.speedKmph} km/h
                </div>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Floating Info HUD Overlay (Bottom Right) */}
      {selectedTrain && (
        <div className="absolute bottom-4 right-4 z-10 max-w-sm w-full bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 shadow-xl text-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Train {selectedTrain.trainNumber}
              </div>
              <h4 className="text-base font-bold text-slate-900">{selectedTrain.trainName}</h4>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                selectedTrain.delayMinutes > 10
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {selectedTrain.delayMinutes > 0 ? `+${selectedTrain.delayMinutes} min` : 'ON TIME'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Current Station</span>
              <span className="text-amber-600 font-bold text-sm">{selectedTrain.currentStation}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Next Station</span>
              <span className="text-blue-600 font-bold text-sm">{selectedTrain.nextStation}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/90 px-3 py-2 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Next ETA:</span>
              <span className="font-bold text-slate-900">{selectedTrain.etaNextStation}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Heading:</span>
              <span className="font-bold text-slate-900">{selectedTrain.bearing}°</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
