import api from './api';

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: Array<{
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
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shipping: number;
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
  }) {
    try {
      console.log('Creating order with data:', orderData);
      
      // Validate required fields
      const { shippingAddress } = orderData;
      if (!shippingAddress) {
        throw new Error('Shipping address is required');
      }

      const { name, address, city, postalCode, phone } = shippingAddress;
      if (!name || !address || !city || !postalCode || !phone) {
        throw new Error('All shipping address fields are required');
      }

      // Clean the data
      const cleanOrderData = {
        shippingAddress: {
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          phone: phone.trim()
        }
      };

      console.log('Sending clean order data:', cleanOrderData);
      
      const response = await api.post('/orders', cleanOrderData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
      }
      throw error;
    }
  },

  async getOrders() {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  async getOrder(id: string) {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }
};