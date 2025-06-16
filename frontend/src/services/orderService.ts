import api from './api';

export interface Order {
  _id: string;
  userId: string;
  products: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      image: string;
    };
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  createdAt: string;
}

export const orderService = {
  async createOrder(orderData: {
    shippingAddress: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      phone: string;
    };
    paymentMethod: string;
  }) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  async getOrders() {
    const response = await api.get('/orders');
    return response.data;
  },

  async getOrder(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  async getAllOrders() {
    const response = await api.get('/admin/orders');
    return response.data;
  },

  async updateOrderStatus(id: string, status: string) {
    const response = await api.put(`/admin/orders/${id}`, { status });
    return response.data;
  }
};