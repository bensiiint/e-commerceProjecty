import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Eye, Wallet, Clock, CheckCircle, XCircle } from 'lucide-react';
import { walletService } from '../services/walletService';
import { toast } from '../components/Toast';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  user: {
    name: string;
    email: string;
  };
  total: number;
  status: string;
  createdAt: string;
}

interface MonthlySale {
  _id: {
    year: number;
    month: number;
  };
  total: number;
  count: number;
}

interface TopupRequest {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  amount: number;
  paymentMethod: string;
  paymentProof: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadTopupRequests();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
        setMonthlySales(data.monthlySales);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopupRequests = async () => {
    try {
      const requests = await walletService.getAllTopupRequests('pending');
      setTopupRequests(requests);
    } catch (error) {
      console.error('Failed to load topup requests:', error);
    }
  };

  const handleTopupRequest = async (id: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    try {
      await walletService.processTopupRequest(id, status, adminNotes);
      toast.success(`Top-up request ${status} successfully`);
      loadTopupRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${status} request`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMonth = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your e-commerce platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12% from last month</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+8% from last month</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+23% from last month</span>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+18% from last month</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pending Top-up Requests */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Pending Top-up Requests</h2>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">{topupRequests.length} pending</span>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {topupRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending requests</p>
              ) : (
                topupRequests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{request.user.name}</h4>
                        <p className="text-sm text-gray-500">{request.user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${request.amount}</p>
                        <p className="text-sm text-gray-500">{request.paymentMethod}</p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <strong>Payment Proof:</strong> {request.paymentProof}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTopupRequest(request._id, 'approved')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleTopupRequest(request._id, 'rejected', 'Request rejected by admin')}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link 
                to="/admin/orders" 
                className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View All</span>
              </Link>
            </div>

            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">{order.user.name}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Sales Chart */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Sales</h2>
          
          <div className="space-y-4">
            {monthlySales.map((sale, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">
                    {formatMonth(sale._id.month)} {sale._id.year}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${sale.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{sale.count} orders</p>
                </div>
              </div>
            ))}
          </div>

          {monthlySales.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No sales data available</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link to="/admin/products" className="card p-6 text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Add New Product</h3>
              <p className="text-gray-600 text-sm">Create a new product listing</p>
            </Link>

            <Link to="/admin/orders" className="card p-6 text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Manage Orders</h3>
              <p className="text-gray-600 text-sm">View and update order status</p>
            </Link>

            <button className="card p-6 text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600 text-sm">Manage user accounts and roles</p>
            </button>

            <button className="card p-6 text-left hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Wallet Management</h3>
              <p className="text-gray-600 text-sm">Process top-up requests</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}