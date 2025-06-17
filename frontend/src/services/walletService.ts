import api from './api';

export const walletService = {
  async getWallet() {
    const response = await api.get('/wallet');
    return response.data;
  },

  async requestTopup(amount: number, paymentMethod: string, paymentProof: string) {
    const response = await api.post('/wallet/topup', {
      amount,
      paymentMethod,
      paymentProof
    });
    return response.data;
  },

  async getTopupRequests() {
    const response = await api.get('/wallet/topup-requests');
    return response.data;
  },

  async getAllTopupRequests(status?: string) {
    const params = status ? { status } : {};
    const response = await api.get('/wallet/admin/topup-requests', { params });
    return response.data;
  },

  async processTopupRequest(id: string, status: 'approved' | 'rejected', adminNotes?: string) {
    const response = await api.put(`/wallet/admin/topup-requests/${id}`, {
      status,
      adminNotes
    });
    return response.data;
  }
};