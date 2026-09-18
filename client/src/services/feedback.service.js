import api from './api';

export const feedbackService = {
  submitFeedback: async (feedbackData) => {
    return await api.post('/feedback', feedbackData);
  }
};
