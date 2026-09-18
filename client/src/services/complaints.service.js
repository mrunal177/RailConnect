import api from './api';

export const complaintsService = {
  submitComplaint: async (complaintData) => {
    return await api.post('/complaints', complaintData);
  },
  getUserComplaints: async () => {
    return await api.get('/complaints');
  }
};
