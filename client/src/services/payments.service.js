import api from './api';

export const paymentsService = {
  processPayment: async (paymentData) => {
    return await api.post('/payments/process', paymentData);
  }
};
