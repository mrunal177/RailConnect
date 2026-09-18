import api from './api';

export const schedulesService = {
  list: async () => await api.get('/schedules'),
  create: async (data) => await api.post('/schedules', data),
  update: async (id, data) => await api.put(`/schedules/${id}`, data),
  remove: async (id) => await api.delete(`/schedules/${id}`)
};
