import React from 'react';
import { Armchair, Bed, Check, User, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface SeatItem {
  seatNumber: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED';
}

interface CoachLayoutProps {
  travelClass: string;
  seats: SeatItem[];
  selectedSeat: string | null;
  onSelectSeat: (seatNumber: string) => void;
  trainNumber: string;
  coachName?: string;
}

export const CoachLayout: React.FC<CoachLayoutProps> = ({
  travelClass,
  seats,
  selectedSeat,
  onSelectSeat,
  trainNumber,
  coachName = 'B2',
}) => {
  const { t } = useLanguage();

  // Sleeper classes in Indian Railways: SL, 3A, 2A, 1A
  const isSleeper = ['SL', '3A', '2A', '1A'].includes(travelClass.toUpperCase());

  // Determine berth type for sleeper berths based on standard 8-berth modular bay
  const getBerthType = (numStr: string) => {
    // If seatNumber is like A1, B2, or pure number
    const match = numStr.match(/\d+/);
    const num = match ? parseInt(match[0], 10) : 1;
    const mod = num % 8;
    if (mod === 1 || mod === 4) return { type: 'LB', name: t('lowerBerth') };
    if (mod === 2 || mod === 5) return { type: 'MB', name: t('middleBerth') };
    if (mod === 3 || mod === 6) return { type: 'UB', name: t('upperBerth') };
    if (mod === 7) return { type: 'SL', name: t('sideLower') };
    return { type: 'SU', name: t('sideUpper') };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
            {isSleeper ? <Bed className="w-3.5 h-3.5" /> : <Armchair className="w-3.5 h-3.5" />}
            <span>{t('interactiveCoachLayout')}</span>
          </span>
          <h4 className="text-sm font-bold text-slate-900">
            {trainNumber} {t('coach')} {coachName} ({travelClass}) — {isSleeper ? t('sleeperBerths') : t('chairCarSeats')}
          </h4>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {selectedSeat ? `${t('selected')}: ${selectedSeat}` : t('pickSeat')}
          </span>
        </div>
      </div>

      {/* Train Coach Container */}
      <div className="my-4 p-4 bg-gradient-to-b from-slate-100 to-slate-50 rounded-2xl border-2 border-slate-200 shadow-inner">
        {/* Coach Direction Indicator & Windows */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-3 px-2">
          <span>◄ ENGINE / LOCOMOTIVE DIRECTION</span>
          <span>COACH ENTRY / VESTIBULE ►</span>
        </div>

        {isSleeper ? (
          /* ========================================================= */
          /* SLEEPER COACH LAYOUT: LONG RECTANGLES JUST LIKE BEDS      */
          /* ========================================================= */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Main Bay Berths (Left Column of Beds) */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center justify-between">
                  <span>Main Cabin Berths</span>
                  <span className="text-[9px] text-slate-400">(LB / MB / UB)</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {seats.filter((_, idx) => idx % 2 === 0).map((seat) => {
                    const isBooked = seat.status === 'BOOKED';
                    const isSelected = selectedSeat === seat.seatNumber;
                    const berthInfo = getBerthType(seat.seatNumber);

                    return (
                      <button
                        key={seat.seatNumber}
                        type="button"
                        disabled={isBooked}
                        onClick={() => onSelectSeat(seat.seatNumber)}
                        className={`relative w-full h-14 rounded-xl border-2 transition-all p-2 flex items-center justify-between text-left cursor-pointer group ${
                          isBooked
                            ? 'bg-slate-200/80 border-slate-300 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                            : 'bg-white border-slate-300 hover:border-blue-400 hover:shadow-md hover:bg-blue-50/40 text-slate-700'
                        }`}
                      >
                        {/* Pillow at one end of the bed */}
                        <div
                          className={`w-4 h-9 rounded-md border flex items-center justify-center shrink-0 shadow-xs ${
                            isSelected
                              ? 'bg-white/90 border-blue-300 text-blue-800'
                              : isBooked
                              ? 'bg-slate-300 border-slate-400'
                              : 'bg-indigo-50 border-indigo-200 group-hover:bg-blue-100'
                          }`}
                        >
                          <span className="text-[8px] font-black tracking-tighter">P</span>
                        </div>

                        {/* Bed Mattress Center Info */}
                        <div className="flex-1 px-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-sm">{seat.seatNumber}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-blue-800 text-white'
                                  : isBooked
                                  ? 'bg-slate-300 text-slate-600'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {berthInfo.type}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-80 block truncate">
                            {isBooked ? t('booked') : berthInfo.name}
                          </span>
                        </div>

                        {/* Status Icon */}
                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : isBooked ? (
                            <User className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Bed className="w-4 h-4 opacity-30 group-hover:opacity-70 group-hover:text-blue-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Side Berths (Right Column of Beds with Corridor In-Between) */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center justify-between">
                  <span>Side Berths</span>
                  <span className="text-[9px] text-slate-400">(SL / SU)</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {seats.filter((_, idx) => idx % 2 === 1).map((seat) => {
                    const isBooked = seat.status === 'BOOKED';
                    const isSelected = selectedSeat === seat.seatNumber;
                    const berthInfo = getBerthType(seat.seatNumber);

                    return (
                      <button
                        key={seat.seatNumber}
                        type="button"
                        disabled={isBooked}
                        onClick={() => onSelectSeat(seat.seatNumber)}
                        className={`relative w-full h-14 rounded-xl border-2 transition-all p-2 flex items-center justify-between text-left cursor-pointer group ${
                          isBooked
                            ? 'bg-slate-200/80 border-slate-300 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                            : 'bg-white border-slate-300 hover:border-blue-400 hover:shadow-md hover:bg-blue-50/40 text-slate-700'
                        }`}
                      >
                        {/* Pillow at one end of the bed */}
                        <div
                          className={`w-4 h-9 rounded-md border flex items-center justify-center shrink-0 shadow-xs ${
                            isSelected
                              ? 'bg-white/90 border-blue-300 text-blue-800'
                              : isBooked
                              ? 'bg-slate-300 border-slate-400'
                              : 'bg-indigo-50 border-indigo-200 group-hover:bg-blue-100'
                          }`}
                        >
                          <span className="text-[8px] font-black tracking-tighter">P</span>
                        </div>

                        {/* Bed Mattress Center Info */}
                        <div className="flex-1 px-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-sm">{seat.seatNumber}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-blue-800 text-white'
                                  : isBooked
                                  ? 'bg-slate-300 text-slate-600'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {berthInfo.type}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-80 block truncate">
                            {isBooked ? t('booked') : berthInfo.name}
                          </span>
                        </div>

                        {/* Status Icon */}
                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : isBooked ? (
                            <User className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Bed className="w-4 h-4 opacity-30 group-hover:opacity-70 group-hover:text-blue-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Aisle Walkway divider */}
            <div className="py-1 px-3 bg-slate-200/80 rounded-lg text-center text-[10px] font-mono text-slate-500 tracking-widest border border-dashed border-slate-300">
              ◄ {t('aisle')} (PASSENGER CORRIDOR) ►
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* CHAIR CAR / SITTING COACH LAYOUT: REALISTIC CHAIR SEATS   */
          /* ========================================================= */
          <div className="space-y-3">
            {/* 2x2 layout with central aisle */}
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {/* Left Window Seat Header */}
              <div className="col-span-2 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase">
                <span>Window</span>
                <span>Aisle</span>
              </div>
              {/* Center Aisle Indicator */}
              <div className="flex items-center justify-center text-[9px] font-mono text-slate-400">
                Aisle
              </div>
              {/* Right Window Seat Header */}
              <div className="col-span-2 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase">
                <span>Aisle</span>
                <span>Window</span>
              </div>
            </div>

            {/* Render rows in 4-seat clusters (2 seats, Aisle, 2 seats) */}
            {Array.from({ length: Math.ceil(seats.length / 4) }).map((_, rowIdx) => {
              const rowSeats = seats.slice(rowIdx * 4, rowIdx * 4 + 4);
              const leftSeats = rowSeats.slice(0, 2);
              const rightSeats = rowSeats.slice(2, 4);

              return (
                <div key={rowIdx} className="grid grid-cols-5 gap-2 items-center">
                  {/* Left 2 Seats */}
                  <div className="col-span-2 grid grid-cols-2 gap-2">
                    {leftSeats.map((seat) => {
                      const isBooked = seat.status === 'BOOKED';
                      const isSelected = selectedSeat === seat.seatNumber;

                      return (
                        <button
                          key={seat.seatNumber}
                          type="button"
                          disabled={isBooked}
                          onClick={() => onSelectSeat(seat.seatNumber)}
                          className={`relative h-14 rounded-2xl border-2 transition-all flex flex-col items-center justify-between p-1.5 shadow-xs cursor-pointer group ${
                            isBooked
                              ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                              : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700'
                          }`}
                        >
                          {/* Seat Headrest */}
                          <div
                            className={`w-7 h-2 rounded-t-sm border-b ${
                              isSelected ? 'bg-blue-400/80 border-blue-300' : isBooked ? 'bg-slate-300 border-slate-400' : 'bg-slate-100 border-slate-200'
                            }`}
                          />
                          {/* Seat Number */}
                          <span className="font-mono font-black text-xs">{seat.seatNumber}</span>
                          {/* Armrest Base */}
                          <div className="w-full flex items-center justify-between px-1">
                            <span className={`w-1 h-2 rounded ${isSelected ? 'bg-blue-400' : 'bg-slate-300'}`} />
                            <span className="text-[9px] opacity-75">{isBooked ? 'X' : isSelected ? '✓' : 'AVL'}</span>
                            <span className={`w-1 h-2 rounded ${isSelected ? 'bg-blue-400' : 'bg-slate-300'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Aisle Walkway in Middle */}
                  <div className="h-full flex items-center justify-center">
                    <div className="w-1 h-10 bg-slate-200 rounded-full" />
                  </div>

                  {/* Right 2 Seats */}
                  <div className="col-span-2 grid grid-cols-2 gap-2">
                    {rightSeats.map((seat) => {
                      const isBooked = seat.status === 'BOOKED';
                      const isSelected = selectedSeat === seat.seatNumber;

                      return (
                        <button
                          key={seat.seatNumber}
                          type="button"
                          disabled={isBooked}
                          onClick={() => onSelectSeat(seat.seatNumber)}
                          className={`relative h-14 rounded-2xl border-2 transition-all flex flex-col items-center justify-between p-1.5 shadow-xs cursor-pointer group ${
                            isBooked
                              ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                              : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700'
                          }`}
                        >
                          {/* Seat Headrest */}
                          <div
                            className={`w-7 h-2 rounded-t-sm border-b ${
                              isSelected ? 'bg-blue-400/80 border-blue-300' : isBooked ? 'bg-slate-300 border-slate-400' : 'bg-slate-100 border-slate-200'
                            }`}
                          />
                          {/* Seat Number */}
                          <span className="font-mono font-black text-xs">{seat.seatNumber}</span>
                          {/* Armrest Base */}
                          <div className="w-full flex items-center justify-between px-1">
                            <span className={`w-1 h-2 rounded ${isSelected ? 'bg-blue-400' : 'bg-slate-300'}`} />
                            <span className="text-[9px] opacity-75">{isBooked ? 'X' : isSelected ? '✓' : 'AVL'}</span>
                            <span className={`w-1 h-2 rounded ${isSelected ? 'bg-blue-400' : 'bg-slate-300'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-white border-2 border-slate-300" />
          <span>{t('available')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-blue-600 border-2 border-blue-600 text-white flex items-center justify-center text-[10px]">✓</div>
          <span className="font-bold text-blue-700">{t('selected')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-slate-200 border-2 border-slate-300 opacity-80" />
          <span>{t('booked')}</span>
        </div>
      </div>
    </div>
  );
};
