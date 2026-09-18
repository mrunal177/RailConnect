# RailConnect team navigation guide

This guide maps the **current implementation**, not an idealized redesign. Keep ownership boundaries intact; use API contracts rather than importing another member's controller or editing their files.

## Fast workflow map

| Person | Assigned area | Start here | API | Database |
|---|---|---|---|---|
| 1 | User & Security | `auth.controller.js` / `AuthContext.jsx` | `/api/auth/*` | `users`, `audit_logs` |
| 2 | Railway Operations & Booking | `trains.controller.js`, `bookings.controller.js` | `/api/trains/*`, `/api/schedules/*`, `/api/bookings/*` | `stations`, `trains`, `schedules`, `bookings`, `tickets` |
| 3 | Payments & Passenger Support | `payments.controller.js`, `cancellations.controller.js`, `complaints.controller.js` | `/api/payments/*`, `/api/bookings/pnr/:pnr/cancel`, `/api/complaints/*` | `payments`, `complaints`; refund/complaint triggers |
| 4 | Feedback, ML & Analytics | `feedback.controller.js`, `analytics.controller.js` | `/api/feedback`, `/api/analytics/overview` | `feedback`; analytics views and aggregate queries |

## Person 1 — User & Security

Owns identity lifecycle, roles, signed access tokens, route authorization, and audit events.

### Owned files and exact work areas

| File | Work only in |
|---|---|
| `server/src/controllers/auth.controller.js` | `registerUser`, `loginUser`, `getUserProfile`, `publicUser`, and their validation/audit calls. |
| `server/src/routes/auth.routes.js` | `/register`, `/login`, `/profile` route contract only. |
| `server/src/middleware/authMiddleware.js` | `authenticateUser` and `authorizeAdmin`. |
| `server/src/utils/security.js` | password hashing, token signing/verification, and identity-safe token helpers. Do not change `generatePnr` or `generateReference`; they are shared generators. |
| `server/src/utils/audit.js` | `audit()` event writer and audit metadata convention. |
| `client/src/context/AuthContext.jsx` | persisted session, `login`, `logout`, and current-user state. |
| `client/src/components/common/RequireAuth.jsx` | passenger/admin route guard behavior. |
| `client/src/pages/public/LoginPage.jsx` | login form, loading/error state, and `authService.login`. |
| `client/src/pages/public/RegisterPage.jsx` | registration form, validation, and `authService.register`. |
| `client/src/services/auth.service.js` | auth request methods only. |

**Database:** `users` and `audit_logs` in `database/schema.sql`; seeded accounts in `database/seed.sql`. Queries currently read/insert users and write `USER_REGISTERED`/`USER_LOGGED_IN` audit rows.

**Create new files:** `server/src/controllers/` and `server/src/routes/` for profile/security endpoints; `client/src/pages/public/` or `client/src/components/common/` for account UI. Coordinate before adding a route mount to `server/server.js` or a route to `client/src/App.jsx`.

**Do not modify:** Person 2 booking/train/schedule files; Person 3 payment/complaint/cancellation files; Person 4 feedback/analytics files; all Shared Files below.

## Person 2 — Railway Operations & Booking

Owns network inventory, schedules, public search, live capacity calculation, seat assignment, PNR bookings, booking history, and waitlist rules. Person 3 owns the cancellation/refund endpoint and trigger; Person 2 defines the availability consequences through booking/ticket statuses.

### Owned files and exact work areas

| File | Work only in |
|---|---|
| `server/src/controllers/trains.controller.js` | `searchTrains`, `getTrainByNumber`, `getAllStations`, `listTrains`, `createTrain`, `updateTrain`, `deleteTrain`, and `scheduleClasses`. |
| `server/src/controllers/schedules.controller.js` | `listSchedules`, `createSchedule`, `updateSchedule`, `deleteSchedule`, `normalize`, `validate`. |
| `server/src/controllers/bookings.controller.js` | `createBooking`, `getBookingByPNR`, `getUserBookings`, `validatePassengers`, `formatBooking`, and `bookingSummaryQuery`. |
| `server/src/models/train.model.js` | `TrainModel.findByRoute`. |
| `server/src/routes/trains.routes.js` | train/search/station/admin fleet endpoints. |
| `server/src/routes/schedules.routes.js` | admin schedule CRUD endpoints. |
| `client/src/pages/public/TrainSearchPage.jsx` | search result loading and passenger/seat selection; booking request payload only. Payment call is Person 3's service contract. |
| `client/src/components/railway/SearchForm.jsx` | route/date/class input and submit payload. |
| `client/src/components/railway/TrainCard.jsx` | train availability/card rendering. |
| `client/src/components/railway/RouteVisualizer.jsx` | route-progress presentation only. |
| `client/src/pages/passenger/MyBookingsPage.jsx` | booking list/table and link to ticket; do not change payment/refund messaging. |
| `client/src/pages/passenger/TicketPreviewPage.jsx` | PNR lookup/ticket display. |
| `client/src/pages/passenger/PassengerDashboard.jsx` | passenger booking metrics and upcoming journeys. |
| `client/src/pages/admin/TrainManagementPage.jsx` | fleet CRUD UI. |
| `client/src/pages/admin/ScheduleManagementPage.jsx` | timetable CRUD UI. |
| `client/src/services/trains.service.js` | train/station/fleet methods. |
| `client/src/services/schedules.service.js` | schedule CRUD methods. |
| `client/src/services/bookings.service.js` | booking, PNR, history request methods; coordinate its `cancel` method with Person 3. |

**Database:** `stations`, `trains`, `schedules`, `bookings`, `tickets`; seed records in `database/seed.sql`; `view_train_schedules`, `view_booking_details`; procedures `sp_search_trains`, `sp_get_booking_by_pnr`. The seat-count query in `createBooking` is the concurrency-critical section—keep its transaction and `FOR UPDATE` behavior intact.

**Create new files:** `server/src/models/` for train/schedule queries and `client/src/components/railway/` for rail-specific UI. Put a new booking policy helper in `server/src/services/booking/` (create this folder) rather than in a Person 3 controller.

**Do not modify:** `cancellations.controller.js`, `payments.controller.js`, complaints/triggers (Person 3); auth/RBAC files (Person 1); feedback/analytics files (Person 4); Shared Files.

## Person 3 — Payments & Passenger Support

Owns payment records/status, refund processing, complaint intake/tracking, and database automation for cancellations and complaint resolution.

### Owned files and exact work areas

| File | Work only in |
|---|---|
| `server/src/controllers/payments.controller.js` | `processPayment`, payment-method validation, transaction reference creation/use. |
| `server/src/controllers/cancellations.controller.js` | `cancelBooking`: cancellation authorization, ticket status update, and refund hand-off. Do not alter Person 2 seat-allocation logic. |
| `server/src/controllers/complaints.controller.js` | `submitComplaint`, `getUserComplaints`, complaint category/status rules. |
| `server/src/routes/payments.routes.js` | payment endpoint only. |
| `server/src/routes/complaints.routes.js` | complaint endpoints only. |
| `server/src/routes/bookings.routes.js` | only the cancellation route line and Person 3 controller import; coordinate route-order changes with Person 2. |
| `client/src/pages/passenger/PassengerComplaintsPage.jsx` | complaint form/history and feedback hand-off layout; Person 4 owns the feedback submission behavior. |
| `client/src/services/payments.service.js` | payment process request. |
| `client/src/services/complaints.service.js` | complaint requests. |
| `database/triggers.sql` | `trg_before_complaint_update` and `trg_after_booking_cancel`; keep Person 2's PNR trigger coordinated. |

**Database:** `payments`, `complaints`; related `bookings` and `tickets` updates are limited to cancellation state transitions. `trg_after_booking_cancel` marks successful payments `REFUNDED`; `trg_before_complaint_update` stamps `resolved_at`. Relevant procedures belong in `database/procedures.sql` under a clearly marked Person 3 section.

**Create new files:** `server/src/controllers/`/`routes/` for refunds or support APIs, and `client/src/pages/passenger/` for new passenger-support screens. Put payment gateway adapters under `server/src/services/payments/` (create it), never inside booking allocation code.

**Do not modify:** train/search/schedule/seat/Pnr logic (Person 2); user/security files (Person 1); feedback/analytics logic (Person 4); Shared Files.

## Person 4 — Feedback, ML & Analytics

Owns ratings and comments, sentiment/ML-NLP enrichment, passenger insights, popular-route/train metrics, and reporting endpoints/UI.

### Owned files and exact work areas

| File | Work only in |
|---|---|
| `server/src/controllers/feedback.controller.js` | `submitFeedback`, rating validation, feedback persistence, and future sentiment invocation. |
| `server/src/controllers/analytics.controller.js` | `getOverviewStats` aggregate queries, sentiment output, and future insight metrics. |
| `server/src/routes/feedback.routes.js` | feedback endpoint only. |
| `server/src/routes/analytics.routes.js` | protected analytics endpoint only. |
| `client/src/pages/admin/AnalyticsPreviewPage.jsx` | dashboard cards and sentiment breakdown. |
| `client/src/pages/admin/AdminDashboard.jsx` | KPI/alerts fed by `analyticsService`; preserve Person 2 fleet navigation. |
| `client/src/services/feedback.service.js` | feedback API method. |
| `client/src/services/analytics.service.js` | analytics API method. |
| `client/src/pages/passenger/PassengerComplaintsPage.jsx` | only the **Journey Feedback** form section and `feedbackService` call; Person 3 owns the complaint form/history above it. |

**Database:** `feedback`; read-only insight queries may join `bookings`, `tickets`, `trains`, `schedules`, and `complaints`. `complaints.sentiment_label` is currently the analytics input—coordinate any automatic classifier write with Person 3. Use `view_train_schedules` and `view_booking_details` in `database/views.sql` for reporting; add new analytics views in a clearly marked Person 4 section.

**Create new files:** `server/src/services/analytics/` for NLP/model adapters, `server/src/models/analytics.model.js` for reporting queries, and `client/src/components/analytics/` for charts. Do not put ML logic in Express route files.

**Do not modify:** feedback-adjacent complaint persistence/triggers (Person 3); booking data mutation (Person 2); user/session code (Person 1); Shared Files.

## Shared Files — DO NOT MODIFY WITHOUT TEAM AGREEMENT

| Shared file/area | Why it is shared / coordination rule |
|---|---|
| `client/src/App.jsx` | Central route map and `RequireAuth` wrapping. One owner makes agreed route changes after API contract review. |
| `client/src/main.jsx`, `client/src/index.css`, `client/src/App.css` | Entry point and global visual system. Do not alter layout/theme globally for a module feature. |
| `client/src/components/common/` except `RequireAuth.jsx` | Reusable UI primitives/layout/navigation; changing props affects every module. Add module-specific components outside this folder. |
| `client/src/services/api.js` | Axios base URL, auth header, response-error shape. All services depend on it. |
| `client/src/mock/mockData.js` | Demo fallback data shared by landing/rail UI; keep its object shape compatible with API contracts. |
| `client/src/pages/public/LandingPage.jsx` | Product homepage and navigation entry point; rail-card data is Person 2, but layout/theme requires team agreement. |
| `server/server.js` | Global middleware and route mounts. Add a route only after its owner agrees on API prefix/order. |
| `server/src/config/db.js` | One shared MySQL pool and connection behavior. |
| `server/src/middleware/errorHandler.js`, `logger.js` | Global error/log policy. |
| `server/src/utils/http.js` | Shared validation/error helper. |
| `database/schema.sql` | Cross-module foreign keys and enums. Propose changes in the team channel first; update seed/views/procedures/triggers together. |
| `database/seed.sql`, `database/views.sql`, `database/procedures.sql`, `database/triggers.sql` | Shared database deployment order. Mark every addition with `PERSON N` and avoid changing another member's object. |
| `package.json`, `client/package.json`, `server/package.json`, lockfiles, `vite.config.js`, `.env.example` | Build/runtime configuration. Team agreement required before dependency, port, proxy, or environment changes. |

## Integration rules

1. Keep request/response shapes in the owning `client/src/services/*.service.js`; consumers should not call Axios directly.
2. A database schema change requires one coordinated PR containing the schema, seed impact, relevant view/procedure/trigger impact, backend query, and frontend contract update.
3. Person 2 exposes booking state; Person 3 consumes it for cancellation/refund; Person 4 reads it for insights. No downstream module directly rewrites Person 2 allocation SQL.
4. Use small, module-scoped commits. Before merging, run the client lint/build, server syntax checks, and the affected API flow.
