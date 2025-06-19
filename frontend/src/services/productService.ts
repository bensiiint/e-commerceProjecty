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
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }) {
    try {
      // Clean up params to avoid sending empty strings
      const cleanParams: any = {};
      
      if (params?.page) cleanParams.page = params.page;
      if (params?.limit) cleanParams.limit = params.limit;
      if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
      if (params?.minPrice !== undefined && params.minPrice !== null) cleanParams.minPrice = params.minPrice;
      if (params?.maxPrice !== undefined && params.maxPrice !== null) cleanParams.maxPrice = params.maxPrice;
      if (params?.sortBy && params.sortBy.trim()) cleanParams.sortBy = params.sortBy.trim();

      console.log('Sending request with params:', cleanParams);
      
      const response = await api.get('/products', { params: cleanParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  async getProduct(id: string) {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  async createProduct(productData: {
    name: string;
    description: string;
    price: string;
    category: string;
    stock: string;
    image?: string;
  }) {
    try {
      const data = {
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: Number(productData.price),
        category: productData.category.trim(),
        stock: Number(productData.stock),
        image: productData.image?.trim() || ''
      };

      console.log('Creating product with data:', data);
      
      const response = await api.post('/products', data);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  async updateProduct(id: string, productData: {
    name: string;
    description: string;
    price: string;
    category: string;
    stock: string;
    image?: string;
  }) {
    try {
      const data = {
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: Number(productData.price),
        category: productData.category.trim(),
        stock: Number(productData.stock),
        image: productData.image?.trim() || ''
      };

      console.log('Updating product with data:', data);
      
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id: string) {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
};