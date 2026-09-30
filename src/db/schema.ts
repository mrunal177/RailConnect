import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  numeric,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// 1. USERS TABLE
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(), // Firebase Auth UID
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    phone: text('phone'),
    role: text('role').notNull().default('PASSENGER'), // 'PASSENGER' | 'STAFF' | 'ADMIN'
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_users_email').on(table.email),
    index('idx_users_role').on(table.role),
  ]
);

// 2. TRAINS TABLE
export const trains = pgTable(
  'trains',
  {
    id: serial('id').primaryKey(),
    trainNumber: text('train_number').notNull().unique(),
    trainName: text('train_name').notNull(),
    source: text('source').notNull(),
    destination: text('destination').notNull(),
    departureTime: text('departure_time').notNull(),
    arrivalTime: text('arrival_time').notNull(),
    duration: text('duration').notNull(),
    totalSeats: integer('total_seats').notNull().default(120),
    trainType: text('train_type').notNull().default('Express'), // 'Rajdhani' | 'Superfast' | 'Vande Bharat' | 'Express'
    classes: text('classes').notNull().default('1A,2A,3A,SL,CC'),
    baseFare: numeric('base_fare', { precision: 10, scale: 2 }).notNull().default('850.00'),
    trainStatus: text('train_status').notNull().default('ON_TIME'), // 'ON_TIME' | 'DELAYED' | 'CANCELLED'
    currentStation: text('current_station').notNull(),
    nextStation: text('next_station').notNull(),
    delayMinutes: integer('delay_minutes').notNull().default(0),
    speedKmph: integer('speed_kmph').notNull().default(85),
    routeJson: text('route_json').notNull().default('[]'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_trains_number').on(table.trainNumber),
    index('idx_trains_route').on(table.source, table.destination),
    index('idx_trains_status').on(table.trainStatus),
  ]
);

// 3. BOOKINGS TABLE (Central Business Entity)
export const bookings = pgTable(
  'bookings',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    trainId: integer('train_id')
      .notNull()
      .references(() => trains.id, { onDelete: 'restrict' }),
    pnr: text('pnr').notNull().unique(),
    journeyDate: text('journey_date').notNull(), // YYYY-MM-DD
    passengerName: text('passenger_name').notNull(),
    passengerAge: integer('passenger_age').notNull().default(28),
    passengerGender: text('passenger_gender').notNull().default('Other'),
    seatNumber: text('seat_number').notNull(), // e.g., 'B2-24', or 'WL-12'
    travelClass: text('travel_class').notNull().default('3A'),
    fare: numeric('fare', { precision: 10, scale: 2 }).notNull(),
    bookingStatus: text('booking_status').notNull().default('CONFIRMED'), // 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED'
    waitlistPosition: integer('waitlist_position'),
    confirmationProbability: integer('confirmation_probability'), // 0 - 100%
    bookingTime: timestamp('booking_time').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_bookings_pnr').on(table.pnr),
    index('idx_bookings_user_id').on(table.userId),
    index('idx_bookings_train_date').on(table.trainId, table.journeyDate),
    index('idx_bookings_status').on(table.bookingStatus),
  ]
);

// 4. PAYMENTS TABLE
export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    bookingId: integer('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: text('payment_method').notNull().default('UPI'), // 'UPI' | 'CARD' | 'NET_BANKING'
    paymentStatus: text('payment_status').notNull().default('SUCCESS'), // 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
    transactionReference: text('transaction_reference').notNull().unique(),
    paymentGateway: text('payment_gateway').notNull().default('SMART_RAIL_GATEWAY'),
    paymentDate: timestamp('payment_date').defaultNow().notNull(),
    refundStatus: text('refund_status').notNull().default('NONE'), // 'NONE' | 'INITIATED' | 'PROCESSING' | 'COMPLETED'
    refundAmount: numeric('refund_amount', { precision: 10, scale: 2 }).default('0.00'),
    refundDate: timestamp('refund_date'),
  },
  (table) => [
    uniqueIndex('idx_payments_txn_ref').on(table.transactionReference),
    index('idx_payments_booking_id').on(table.bookingId),
    index('idx_payments_status').on(table.paymentStatus),
  ]
);

// 5. COMPLAINTS TABLE
export const complaints = pgTable(
  'complaints',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    category: text('category').notNull(), // 'Train Delay' | 'Cleanliness' | 'Staff Behaviour' | 'Food/Catering' | 'Safety' | 'Seat Issue' | 'Other'
    description: text('description').notNull(),
    status: text('status').notNull().default('OPEN'), // 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
    priority: text('priority').notNull().default('MEDIUM'), // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    assignedStaff: text('assigned_staff'),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
  },
  (table) => [
    index('idx_complaints_user_id').on(table.userId),
    index('idx_complaints_booking_id').on(table.bookingId),
    index('idx_complaints_status').on(table.status),
    index('idx_complaints_category').on(table.category),
  ]
);

// 6. FEEDBACK TABLE
export const feedback = pgTable(
  'feedback',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(), // 1 to 5
    comment: text('comment').notNull(),
    sentiment: text('sentiment').notNull().default('NEUTRAL'), // 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
    sentimentConfidence: integer('sentiment_confidence').notNull().default(85), // 0 to 100
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_feedback_user_id').on(table.userId),
    index('idx_feedback_rating').on(table.rating),
    index('idx_feedback_sentiment').on(table.sentiment),
  ]
);

// 7. SEATS INVENTORY TABLE (For ACID Seat Reservation & Concurrency Lock)
export const seats = pgTable(
  'seats',
  {
    id: serial('id').primaryKey(),
    trainId: integer('train_id')
      .notNull()
      .references(() => trains.id, { onDelete: 'cascade' }),
    journeyDate: text('journey_date').notNull(), // YYYY-MM-DD
    seatNumber: text('seat_number').notNull(), // e.g. A1, A2, B1, B2...
    travelClass: text('travel_class').notNull().default('3A'),
    isBooked: boolean('is_booked').notNull().default(false),
    bookedByUserId: integer('booked_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    lockedAt: timestamp('locked_at'),
  },
  (table) => [
    uniqueIndex('idx_seats_train_date_seat').on(table.trainId, table.journeyDate, table.seatNumber),
    index('idx_seats_availability').on(table.trainId, table.journeyDate, table.isBooked),
  ]
);

// 8. AUDIT LOGS TABLE
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(), // 'LOGIN' | 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'PAYMENT_SUCCESS' | etc.
    entity: text('entity').notNull(), // 'BOOKING' | 'PAYMENT' | 'COMPLAINT' | 'USER'
    entityId: text('entity_id'),
    metadata: text('metadata'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_logs_action').on(table.action),
    index('idx_audit_logs_created_at').on(table.createdAt),
  ]
);

// RELATIONS DEFINITIONS
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  complaints: many(complaints),
  feedback: many(feedback),
  auditLogs: many(auditLogs),
}));

export const trainsRelations = relations(trains, ({ many }) => ({
  bookings: many(bookings),
  seats: many(seats),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  train: one(trains, {
    fields: [bookings.trainId],
    references: [trains.id],
  }),
  payments: many(payments),
  complaints: many(complaints),
  feedback: many(feedback),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  user: one(users, {
    fields: [complaints.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [complaints.bookingId],
    references: [bookings.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [feedback.bookingId],
    references: [bookings.id],
  }),
}));

export const seatsRelations = relations(seats, ({ one }) => ({
  train: one(trains, {
    fields: [seats.trainId],
    references: [trains.id],
  }),
  booking: one(bookings, {
    fields: [seats.bookingId],
    references: [bookings.id],
  }),
  bookedByUser: one(users, {
    fields: [seats.bookedByUserId],
    references: [users.id],
  }),
}));
