# SMART RAILWAY: Reservation & Passenger Intelligence System
**College DBMS + Full Stack + ML + Cybersecurity Capstone Project**

## 1. Project Overview & Problem Statement
Modern railway operations require unified systems that guarantee **ACID transaction safety**, concurrency protection against simultaneous seat reservations, real-time geographic route tracking, and predictive passenger intelligence. **SMART RAILWAY** is an enterprise-grade full-stack transportation platform engineered using **PostgreSQL 16 (Cloud SQL)**, **Express.js**, **React 19**, **Google Maps JavaScript API**, and **Statistical Machine Learning**.

---

## 2. Relational Database Management System (DBMS) Architecture

### A. The 6 Core Conceptual Entities
1. **USERS**: Stores passenger credentials, contact profiles, and role-based permissions (`PASSENGER`, `STAFF`, `ADMIN`).
2. **TRAINS**: Premier train schedule, routes, capacity, dynamic delay metrics, and current spatial stations.
3. **BOOKINGS** *(Central Business Entity)*: Normalizes journey reservations, PNR, passenger metadata, class, fare, and confirmation states.
4. **PAYMENTS**: Encapsulates transaction references, payment gateway verification, refund states, and amounts.
5. **COMPLAINTS**: Grievance logging, priority classification, staff dispatching, and resolution tracking.
6. **FEEDBACK**: Passenger journey ratings, qualitative comments, and automated NLP sentiment analysis scores.

### B. Supporting Relational Tables
- **SEATS**: Granular row-locked inventory ensuring zero double-booking concurrency race conditions.
- **AUDIT_LOGS**: Immutable audit trail populated automatically via PostgreSQL database triggers.

---

## 3. DBMS Principles Implemented

### 1. Database Normalization (1NF, 2NF, 3NF)
- **1NF**: Every field is strictly atomic (scalar values, no unnested arrays or composite types).
- **2NF**: Full functional dependency on the primary key with no partial functional dependencies.
- **3NF**: Elimination of transitive dependencies. Train schedules and station geographic coordinates are factored into dedicated parent entities.

### 2. ACID Transaction & Concurrency Control
When multiple passengers attempt to reserve the same seat simultaneously:
```sql
BEGIN TRANSACTION;
-- Row-level exclusive lock on the requested seat
SELECT * FROM seats 
WHERE train_id = $1 AND journey_date = $2 AND seat_number = $3 
FOR UPDATE;

-- If seat is already locked or booked:
-- System rolls back and returns HTTP 409 Conflict:
-- "Seat temporarily unavailable. Please choose another seat."
COMMIT;
```

### 3. PL/pgSQL Triggers & Stored Functions
- `generate_pnr()`: Generates random cryptographic 10-character PNRs.
- `calculate_refund(fare, journey_date)`: Dynamically computes cancellation penalty and net refund.
- `trg_audit_booking`: Automatically logs immutable records into `audit_logs` on ticket issuance or cancellation.
- `trg_audit_complaint`: Tracks grievance escalation and staff updates.

### 4. B-Tree Indexes
- `idx_bookings_pnr`: O(log N) PNR lookups.
- `idx_trains_route`: Composite index on `(source, destination)`.
- `idx_seats_availability`: Accelerated coach layout queries on `(train_id, journey_date, is_booked)`.
- `idx_feedback_sentiment`: Rapid aggregation for executive sentiment cards.

---

## 4. Machine Learning & Predictive Analytics
1. **Waitlist Confirmation Probability**: Logistic regression model factoring booking lead-time days, class cancellation curves, and weekend demand fluctuations.
2. **Sentiment Analysis**: Lexicon-informed Naive Bayes classifier categorizing passenger reviews into `POSITIVE`, `NEUTRAL`, and `NEGATIVE` with confidence scoring.

---

## 5. Google Maps Platform GIS Integration
Interactive satellite/vector map featuring:
- Live railway station markers (`Mumbai Central`, `Surat`, `Vadodara`, `Ahmedabad`, `Delhi`, etc.)
- Active corridor visualization with dynamic train radar pulses and heading bearings.
- Configurable data modes: **Live Operator Feed** or high-precision **Demo Train Tracking**.

---

## 6. How to Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Install the trained waitlist API dependencies with Python 3.12
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt

# 3. Configure environment variables in .env (or run in AI Studio)
npm run dev

# 4. Access web application
http://localhost:3000
```

Local development starts both the Express application and the trained waitlist
prediction API. Waitlist probabilities require `DATABASE_URL` and recorded
booking history for the selected train and class; when that train has no class
history, the predictor uses recorded history for the same class on other trains.
If there is no history for that class, it reports that a prediction is unavailable.

### Supabase setup (Google OAuth and PostgreSQL)

1. Create a Supabase project and run the SQL files in `database/` in this order: `schema.sql`, `indexes.sql`, `functions.sql`, `triggers.sql`, `views.sql`, then `seed.sql`.
2. In **Project Settings → API**, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` in `.env`. The anon/publishable key is used for Supabase Auth only; keep the service-role key private and out of this app.
3. In **Authentication → Providers → Google**, enable Google and provide the OAuth client ID and client secret from Google Cloud Console. Add the Supabase callback URL shown in the provider settings to the Google OAuth client's authorized redirect URIs.
4. In **Authentication → URL Configuration**, set the site URL and add `http://localhost:3000/**` plus your deployed app URL to the allowed redirect URLs.
5. Set `DATABASE_URL` to the Supabase PostgreSQL connection URI from **Project Settings → Database → Connection string**. Use the session pooler URI if direct connections are unavailable on your network/deployment.

Existing Google OAuth client ID and client secret are needed in the Supabase dashboard, not in this repository's `.env`. The local `.env` is intentionally ignored by Git; put the project URL, publishable/anon key, and database URI there locally. Do not send database passwords or OAuth client secrets in chat.

### Deploy to Vercel

The application deploys as a Vite SPA plus the catch-all Express function in
`api/[...path].ts`. Commit that function and `vercel.json` along with the app
changes; neither can remain only on a developer's machine.

1. Import the GitHub repository into Vercel. The project supports Node 22–24 and runs
   `npm ci` followed by `npm run build`.
2. In **Project Settings → Environment Variables**, add the values from
   `.env.example` to **Production** (and Preview when desired). `DATABASE_URL`,
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`, and
   `VITE_SUPABASE_ANON_KEY` are required for search, bookings, and sign-in.
   Use Supabase's Transaction Pooler URI for `DATABASE_URL`; do not expose it
   as a `VITE_*` variable.
3. Set `GEMINI_API_KEY`, `RAILRADAR_API_KEY`, `OPENWEATHER_API_KEY`, and
   `VITE_MAPTILER_API_KEY` only when those integrations are enabled. Server-only
   values must never use the `VITE_` prefix.
4. In Supabase **Authentication → URL Configuration**, set the production
   domain as the Site URL and add it to Redirect URLs. Add Vercel preview URLs
   too if previews need Google sign-in. Keep Supabase's Google callback URL in
   the Google OAuth client's authorised redirect URIs.
5. Run `schema.sql`, `indexes.sql`, `functions.sql`, `triggers.sql`,
   `views.sql`, and `seed.sql` against the production Supabase database, in that
   order, before the first deployment.

After deployment, verify these paths on the production domain:

```text
/api/health
/api/config
/api/trains/search?from=Mumbai&to=Delhi&date=YYYY-MM-DD&travelClass=3A
```

`/api/health` must return `"status":"ok"` and `"database":"connected"`.
The train-search URL should return train records. `/api/auth/me` intentionally returns
`401` until the browser sends a signed-in user's Supabase bearer token.
