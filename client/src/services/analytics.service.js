import api from './api';

export const analyticsService = {
  getOverview: async () => {
    return await api.get('/analytics/overview');
  }
};
