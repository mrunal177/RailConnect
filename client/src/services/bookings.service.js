import api from './api';

export const bookingsService = {
  createBooking: async (bookingData) => {
    return await api.post('/bookings', bookingData);
  },
  getByPNR: async (pnr) => {
    return await api.get(`/bookings/pnr/${pnr}`);
  },
  getUserBookings: async () => {
    return await api.get('/bookings/user');
  },
  cancel: async (pnr) => {
    return await api.post(`/bookings/pnr/${pnr}/cancel`);
  }
};
