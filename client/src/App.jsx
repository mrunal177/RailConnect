import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import TrainSearchPage from './pages/public/TrainSearchPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Passenger Pages
import PassengerDashboard from './pages/passenger/PassengerDashboard';
import MyBookingsPage from './pages/passenger/MyBookingsPage';
import TicketPreviewPage from './pages/passenger/TicketPreviewPage';
import PassengerComplaintsPage from './pages/passenger/PassengerComplaintsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TrainManagementPage from './pages/admin/TrainManagementPage';
import ScheduleManagementPage from './pages/admin/ScheduleManagementPage';
import AnalyticsPreviewPage from './pages/admin/AnalyticsPreviewPage';
import RequireAuth from './components/common/RequireAuth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Area */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<TrainSearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Passenger Portal */}
          <Route path="/passenger" element={<RequireAuth role="passenger"><PassengerDashboard /></RequireAuth>} />
          <Route path="/passenger/bookings" element={<RequireAuth role="passenger"><MyBookingsPage /></RequireAuth>} />
          <Route path="/passenger/ticket-preview" element={<RequireAuth role="passenger"><TicketPreviewPage /></RequireAuth>} />
          <Route path="/passenger/complaints" element={<RequireAuth role="passenger"><PassengerComplaintsPage /></RequireAuth>} />

          {/* Admin Control Center */}
          <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/trains" element={<RequireAuth role="admin"><TrainManagementPage /></RequireAuth>} />
          <Route path="/admin/schedules" element={<RequireAuth role="admin"><ScheduleManagementPage /></RequireAuth>} />
          <Route path="/admin/analytics" element={<RequireAuth role="admin"><AnalyticsPreviewPage /></RequireAuth>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
