import api from './api';

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(name: string, email: string, password: string) {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(data: { name?: string; email?: string; address?: string; phone?: string }) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  }
};