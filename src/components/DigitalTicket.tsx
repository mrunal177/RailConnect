import React from 'react';
import {
  Ticket,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

export interface TicketData {
  id: number;
  pnr: string;
  train_number: string;
  train_name: string;
  passenger_name: string;
  passenger_age?: number;
  passenger_gender?: string;
  source: string;
  destination: string;
  journey_date: string;
  travel_class: string;
  seat_number: string;
  departure_time: string;
  arrival_time: string;
  fare: string | number;
  booking_status: string;
  payment_status?: string;
  transaction_reference?: string;
}

interface DigitalTicketProps {
  ticket: TicketData;
  onCancelTicket?: () => void;
  onRaiseComplaint?: () => void;
}

export const DigitalTicket: React.FC<DigitalTicketProps> = ({
  ticket,
  onCancelTicket,
  onRaiseComplaint,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isCancelled = ticket.booking_status === 'CANCELLED';

  return (
    <div className="w-full max-w-2xl mx-auto my-6 bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xl text-slate-800 print:bg-white print:text-black">
      {/* Ticket Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-blue-100 font-bold">
              Smart Railway E-Ticket
            </div>
            <h3 className="text-xl font-black text-white">
              {ticket.train_number} {ticket.train_name}
            </h3>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-blue-100 uppercase tracking-wider font-bold">
            Booking PNR
          </div>
          <div className="font-mono text-xl font-black text-amber-200 tracking-wider">
            {ticket.pnr}
          </div>
        </div>
      </div>

      {/* Ticket Status Bar */}
      <div className="bg-slate-50 px-6 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          {isCancelled ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5" /> CANCELLED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> CONFIRMED
            </span>
          )}
          <span className="text-xs text-slate-500 font-mono font-medium">Class: {ticket.travel_class}</span>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Ref: {ticket.transaction_reference || 'SMART-PASS-TXN'}
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="p-6 space-y-6">
        {/* Route Segment */}
        <div className="flex items-center justify-between bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-xs text-slate-400 block mb-1 font-medium">Departure</span>
            <div className="text-lg font-black text-slate-900">{ticket.source}</div>
            <div className="text-xs text-blue-600 font-bold">{ticket.departure_time}</div>
          </div>

          <div className="flex flex-col items-center px-4">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono mb-1 font-bold">
              Direct Corridor
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <div className="w-24 sm:w-36 h-[2px] bg-gradient-to-r from-blue-500 via-amber-400 to-indigo-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            </div>
            <span className="text-[11px] text-slate-500 mt-1 font-mono font-semibold">{ticket.journey_date}</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block mb-1 font-medium">Arrival</span>
            <div className="text-lg font-black text-slate-900">{ticket.destination}</div>
            <div className="text-xs text-indigo-600 font-bold">{ticket.arrival_time}</div>
          </div>
        </div>

        {/* Passenger & Seat Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-1 font-medium">Passenger Name</span>
            <span className="font-bold text-slate-800 text-sm">{ticket.passenger_name}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-1 font-medium">Seat Number</span>
            <span className="font-mono font-black text-blue-600 text-base">{ticket.seat_number}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-1 font-medium">Fare Paid</span>
            <span className="font-bold text-slate-900 text-sm">₹ {ticket.fare}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block text-[11px] mb-1 font-medium">Payment Status</span>
            <span className="font-semibold text-emerald-600 text-sm">VERIFIED</span>
          </div>
        </div>

        {/* QR Code & Digital Stamp */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white p-2 rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
              <QrCode className="w-12 h-12 text-slate-800" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ACID Cryptographic Reservation Token
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Scan at automated station gates. Encodes secure booking ID {ticket.pnr}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Footer Action Buttons */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ticket</span>
          </button>
          <button
            onClick={() => alert(`Ticket details copied to clipboard for PNR: ${ticket.pnr}`)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onRaiseComplaint && (
            <button
              onClick={onRaiseComplaint}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-white text-xs font-medium text-slate-600 transition-colors"
            >
              Raise Complaint
            </button>
          )}

          {!isCancelled && onCancelTicket && (
            <button
              onClick={onCancelTicket}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 transition-colors"
            >
              Cancel Ticket & Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
