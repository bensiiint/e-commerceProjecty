import React, { useState, useEffect } from 'react';
import { User, Package, Settings, Lock, Edit2, Save, X, Wallet, Plus, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { walletService } from '../services/walletService';
import { toast } from '../components/Toast';

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    product: {
      name: string;
      price: number;
      image: string;
    };
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  transactions: Array<{
    type: string;
    amount: number;
    description: string;
    status: string;
    createdAt: string;
  }>;
}

interface TopupRequest {
  _id: string;
  amount: number;
  paymentMethod: string;
  paymentProof: string;
  status: string;
  adminNotes: string;
  createdAt: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, transactions: [] });
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [topupData, setTopupData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    paymentProof: ''
  });

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'profile') {
      loadProfile();
    } else if (activeTab === 'wallet') {
      loadWallet();
      loadTopupRequests();
    }
  }, [activeTab]);

  const loadProfile = async () => {
    try {
      const profile = await authService.getProfile();
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        address: profile.address || '',
        phone: profile.phone || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const walletData = await walletService.getWallet();
      setWallet(walletData);
    } catch (error) {
      console.error('Failed to load wallet:', error);
      toast.error('Failed to load wallet');
    }
  };

  const loadTopupRequests = async () => {
    try {
      const requests = await walletService.getTopupRequests();
      setTopupRequests(requests);
    } catch (error) {
      console.error('Failed to load topup requests:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      await authService.updateProfile(profileData);
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await walletService.requestTopup(
        Number(topupData.amount),
        topupData.paymentMethod,
        topupData.paymentProof
      );
      toast.success('Top-up request submitted successfully');
      setShowTopupModal(false);
      setTopupData({ amount: '', paymentMethod: 'bank_transfer', paymentProof: '' });
      loadTopupRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit top-up request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">Manage your profile and view your orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Profile Settings</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'wallet' 
                      ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  <span>Wallet</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span>Order History</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'password' 
                      ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>Change Password</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                  <button
                    onClick={() => editMode ? setEditMode(false) : setEditMode(true)}
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                  >
                    {editMode ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    <span>{editMode ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!editMode}
                      className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!editMode}
                      className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!editMode}
                      className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!editMode}
                      className="input-field disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                {editMode && (
                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-6">
                {/* Wallet Balance */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Wallet Balance</h2>
                    <button
                      onClick={() => setShowTopupModal(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Top Up</span>
                    </button>
                  </div>

                  <div className="text-center p-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg text-white">
                    <h3 className="text-lg font-medium mb-2">Available Balance</h3>
                    <p className="text-4xl font-bold">${wallet.balance.toFixed(2)}</p>
                  </div>
                </div>

                {/* Top-up Requests */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Top-up Requests</h3>
                  
                  {topupRequests.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No top-up requests yet</p>
                  ) : (
                    <div className="space-y-4">
                      {topupRequests.map((request) => (
                        <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">${request.amount}</p>
                              <p className="text-sm text-gray-500">{request.paymentMethod}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          {request.adminNotes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                              <strong>Admin Notes:</strong> {request.adminNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transaction History */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h3>
                  
                  {wallet.transactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No transactions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {wallet.transactions.map((transaction, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order History</h2>
                
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500">Start shopping to see your orders here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Order #{order.orderNumber}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <p className="text-lg font-bold text-gray-900 mt-1">
                              ${order.total.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-4">
                              <img
                                src={item.product.image || `https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=100`}
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <span className="font-medium text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'password' && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
                
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Top-up Modal */}
        {showTopupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Top Up Wallet</h2>
                  <button
                    onClick={() => setShowTopupModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleTopupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={topupData.amount}
                      onChange={(e) => setTopupData(prev => ({ ...prev, amount: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={topupData.paymentMethod}
                      onChange={(e) => setTopupData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="input-field"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Proof (Receipt/Transaction ID)
                    </label>
                    <input
                      type="text"
                      value={topupData.paymentProof}
                      onChange={(e) => setTopupData(prev => ({ ...prev, paymentProof: e.target.value }))}
                      className="input-field"
                      placeholder="Enter transaction ID or upload receipt"
                      required
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        Your top-up request will be reviewed by an admin. This may take 1-2 business days.
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTopupModal(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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