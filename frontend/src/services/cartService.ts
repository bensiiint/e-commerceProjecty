import api from './api';

export const cartService = {
  async getCart() {
    const response = await api.get('/cart');
    return response.data;
  },

  async addToCart(productId: string, quantity: number) {
    const response = await api.post('/cart/add', { productId, quantity });
    return response.data;
  },

  async updateCart(productId: string, quantity: number) {
    const response = await api.put('/cart/update', { productId, quantity });
    return response.data;
  },

  async removeFromCart(productId: string) {
    const response = await api.delete(`/cart/remove/${productId}`);
    return response.data;
  }
};