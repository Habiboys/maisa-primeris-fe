import api from '../lib/api';

export interface PaymentScheme {
  id: string;
  name: string;
  description?: string;
}

export const paymentSchemeService = {
  getAll: async (): Promise<PaymentScheme[]> => {
    const { data } = await api.get('/payment-schemes');
    return data.data;
  },

  create: async (payload: { name: string; description?: string }): Promise<PaymentScheme> => {
    const { data } = await api.post('/payment-schemes', payload);
    return data.data;
  },

  update: async (id: string, payload: { name?: string; description?: string }): Promise<PaymentScheme> => {
    const { data } = await api.put(`/payment-schemes/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/payment-schemes/${id}`);
  }
};
