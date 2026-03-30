import api from '../lib/api';

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export const departmentService = {
  getAll: async (): Promise<Department[]> => {
    const { data } = await api.get('/departments');
    return data.data;
  },

  create: async (payload: { name: string; description?: string }): Promise<Department> => {
    const { data } = await api.post('/departments', payload);
    return data.data;
  },

  update: async (id: string, payload: { name?: string; description?: string }): Promise<Department> => {
    const { data } = await api.put(`/departments/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}`);
  }
};
