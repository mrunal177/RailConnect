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

# 2. Configure environment variables in .env (or run in AI Studio)
npm run dev

# 3. Access web application
http://localhost:3000
```

### Google Authentication setup

The app uses Firebase Authentication for real Google sign-in. Before using it outside its original Firebase project setup:

1. In Firebase Console, open **Authentication → Sign-in method** and enable **Google**.
2. In **Authentication → Settings → Authorized domains**, add `localhost` for local development and your deployed domain for production.
3. Download a Firebase service-account key and set its one-line JSON in `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env`. This is used only by Express to verify Firebase ID tokens; never commit it or expose it in browser code.
