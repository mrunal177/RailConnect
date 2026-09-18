import api from './api';

export const trainsService = {
  searchTrains: async (params) => {
    return await api.get('/trains/search', { params });
  },
  getStations: async () => {
    return await api.get('/trains/stations');
  },
  getTrainByNumber: async (trainNumber) => {
    return await api.get(`/trains/${trainNumber}`);
  },
  list: async () => await api.get('/trains'),
  create: async (data) => await api.post('/trains', data),
  update: async (trainNumber, data) => await api.put(`/trains/${trainNumber}`, data),
  remove: async (trainNumber) => await api.delete(`/trains/${trainNumber}`)
};
