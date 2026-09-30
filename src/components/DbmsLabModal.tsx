import React, { useState } from 'react';
import { Database, Lock } from 'lucide-react';

export const DbmsLabModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'TRANSACTION' | 'NORMALIZATION' | 'INDEXES' | 'VIEWS' | 'TRIGGERS'>('TRANSACTION');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-600 font-bold">
                College DBMS Viva & Engineering Defense
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Relational Database System Architecture
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 my-4 border-b border-slate-100 pb-2 overflow-x-auto shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('TRANSACTION')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'TRANSACTION'
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            ACID Transaction & Concurrency
          </button>
          <button
            onClick={() => setActiveTab('NORMALIZATION')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'NORMALIZATION'
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            1NF / 2NF / 3NF Normalization
          </button>
          <button
            onClick={() => setActiveTab('INDEXES')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'INDEXES'
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            B-Tree Indexes
          </button>
          <button
            onClick={() => setActiveTab('VIEWS')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'VIEWS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            Materialized & Analytical Views
          </button>
          <button
            onClick={() => setActiveTab('TRIGGERS')}
            className={`px-3 py-2 rounded-xl transition-colors ${
              activeTab === 'TRIGGERS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            PL/pgSQL Triggers & Functions
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-slate-600">
          {activeTab === 'TRANSACTION' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  ACID Concurrency Flow: Seat Reservation with Row-Level Locking
                </h4>
                <p className="text-slate-600 leading-relaxed mb-3">
                  When two passengers attempt to reserve Seat A12 concurrently, PostgreSQL enforces row-level exclusive locks (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">FOR UPDATE</code>). The second transaction blocks until the first completes. Upon commit, the second transaction detects the reservation conflict and rolls back cleanly with a human-readable 409 conflict message.
                </p>
                <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-blue-800 leading-5">
                  1. BEGIN TRANSACTION;<br />
                  2. SELECT * FROM trains WHERE id = $1 FOR SHARE;<br />
                  3. SELECT * FROM seats WHERE train_id = $1 AND journey_date = $2 AND seat_number = $3 FOR UPDATE;<br />
                  4. IF seat.is_booked THEN ROLLBACK; RETURN 409 Conflict;<br />
                  5. INSERT INTO bookings (...) VALUES (...) RETURNING *;<br />
                  6. UPDATE seats SET is_booked = true, booking_id = $newBookingId;<br />
                  7. INSERT INTO payments (...) VALUES ('SUCCESS');<br />
                  8. COMMIT;
                </div>
              </div>
            </div>
          )}

          {activeTab === 'NORMALIZATION' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-emerald-700 mb-2">
                  Schema Normalization Standards
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block mb-1">1NF (First Normal Form):</strong>
                    All attributes are atomic (no repeating groups or arrays stored in relational keys). Passenger names, phone numbers, and seat numbers are strictly scalar.
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block mb-1">2NF (Second Normal Form):</strong>
                    All non-key attributes are fully functionally dependent on the primary key. In the central <code className="text-blue-600 font-mono">bookings</code> table, all attributes depend on <code className="text-amber-600 font-mono">BookingID</code> (or surrogate PNR), eliminating partial dependency.
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block mb-1">3NF (Third Normal Form):</strong>
                    Transitive dependencies are eliminated. Train details (source, destination, departure time) are factored into <code className="text-blue-600 font-mono">trains</code>, avoiding duplication across thousands of bookings. User profile data is isolated in <code className="text-blue-600 font-mono">users</code>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'INDEXES' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-blue-700 mb-2">
                  Active B-Tree Indexes & Justifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-mono text-blue-700 font-bold block">idx_bookings_pnr</span>
                    <span className="text-[11px] text-slate-500">Guarantees O(log N) lookup time for instant passenger digital ticket retrieval.</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-mono text-blue-700 font-bold block">idx_trains_route</span>
                    <span className="text-[11px] text-slate-500">Composite index on (source, destination) accelerating high-frequency train search queries.</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-mono text-blue-700 font-bold block">idx_seats_availability</span>
                    <span className="text-[11px] text-slate-500">Composite index on (train_id, journey_date, is_booked) for lightning-fast seat inventory rendering.</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-mono text-blue-700 font-bold block">idx_feedback_sentiment</span>
                    <span className="text-[11px] text-slate-500">Enables rapid aggregation of ML sentiment metrics for executive dashboards.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'VIEWS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-indigo-700 mb-2">
                  Analytical Database Views in Cloud SQL
                </h4>
                <p className="text-slate-600 mb-3">
                  Pre-compiled views decouple high-frequency analytical dashboards from transactional write tables:
                </p>
                <ul className="space-y-2 font-mono text-[11px]">
                  <li className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700">
                    <strong className="text-blue-700">PassengerBookingSummary:</strong> Aggregates user booking frequency, cancellation rates, and customer lifetime value (LTV).
                  </li>
                  <li className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700">
                    <strong className="text-blue-700">TrainPerformance:</strong> Joins trains, confirmed passenger revenue, and average satisfaction ratings.
                  </li>
                  <li className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700">
                    <strong className="text-blue-700">ComplaintAnalytics:</strong> Calculates mean time to resolution (MTTR) grouped by operational category.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'TRIGGERS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-amber-700 mb-2">
                  Automated PL/pgSQL Triggers & Audit Security
                </h4>
                <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 space-y-2">
                  <div>
                    <span className="text-emerald-700 font-bold">trg_audit_booking:</span> Executes AFTER INSERT OR UPDATE on <code className="text-blue-700">bookings</code>. Automatically writes immutable records into <code className="text-amber-700">audit_logs</code> whenever tickets are issued or cancelled.
                  </div>
                  <div>
                    <span className="text-emerald-700 font-bold">trg_audit_complaint:</span> Executes AFTER INSERT OR UPDATE on <code className="text-blue-700">complaints</code>. Records status transitions and staff assignment accountability for compliance.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            Close Viva Insights
          </button>
        </div>
      </div>
    </div>
  );
};
