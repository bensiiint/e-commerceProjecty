import api from './api';

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  createdAt: string;
}

export const productService = {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getProduct(id: string) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(productData: {
    name: string;
    description: string;
    price: string;
    category: string;
    stock: string;
    image?: string;
  }) {
    const response = await api.post('/products', {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      stock: productData.stock,
      image: productData.image || ''
    });
    return response.data;
  },

  async updateProduct(id: string, productData: {
    name: string;
    description: string;
    price: string;
    category: string;
    stock: string;
    image?: string;
  }) {
    const response = await api.put(`/products/${id}`, {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      stock: productData.stock,
      image: productData.image || ''
    });
    return response.data;
  },

  async deleteProduct(id: string) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/products/categories');
    return response.data;
  }
};