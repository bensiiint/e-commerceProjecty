import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, X, Save } from 'lucide-react';
import { productService, Product } from '../services/productService';
import { toast } from '../components/Toast';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  });

  useEffect(() => {
    loadProducts();
  }, [currentPage, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
      };
      
      const response = await fetch('/api/admin/products?' + new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v).map(([k, v]) => [k, v.toString()])
      ), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, productForm);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(productForm);
        toast.success('Product created successfully');
      }

      resetForm();
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      image: product.image
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image: ''
    });
    setEditingProduct(null);
    setShowAddModal(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-2">Manage your product catalog</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="card p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button type="submit" className="btn-primary whitespace-nowrap">
              Search
            </button>
          </form>
        </div>

        {/* Products Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-300 rounded w-32"></div>
                            <div className="h-3 bg-gray-300 rounded w-24"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-300 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-300 rounded w-12"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-gray-300 rounded"></div>
                          <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <img
                            src={product.image || `https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=100`}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${product.price}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-primary-600 hover:text-primary-900 p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 border border-gray-300 rounded-lg ${
                        currentPage === i + 1 
                          ? 'bg-primary-500 text-white border-primary-500' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={productForm.category}
                        onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={productForm.image}
                      onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                      className="input-field"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}