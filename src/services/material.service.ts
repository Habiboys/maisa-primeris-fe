import api from '../lib/api';

export interface Material {
  id: string;
  name: string;
  unit: string;
  notes?: string;
}

export const materialService = {
  getAll: async (): Promise<Material[]> => {
    const { data } = await api.get('/materials');
    return data.data;
  },

  create: async (payload: { name: string; unit: string; notes?: string }): Promise<Material> => {
    const { data } = await api.post('/materials', payload);
    return data.data;
  },

  update: async (id: string, payload: { name?: string; unit?: string; notes?: string }): Promise<Material> => {
    const { data } = await api.put(`/materials/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/materials/${id}`);
  }
};
