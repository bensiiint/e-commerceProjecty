import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Truck, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { walletService } from '../services/walletService';
import { toast } from '../components/Toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  const tax = total * 0.08;
  const shipping = total > 50 ? 0 : 10;
  const finalTotal = total + tax + shipping;

  React.useEffect(() => {
    if (user) {
      loadWalletBalance();
    }
  }, [user]);

  const loadWalletBalance = async () => {
    try {
      const wallet = await walletService.getWallet();
      setWalletBalance(wallet.balance);
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    const { name, address, city, postalCode, phone } = shippingInfo;
    
    if (!name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!address.trim()) {
      toast.error('Address is required');
      return false;
    }
    if (!city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!postalCode.trim()) {
      toast.error('Postal code is required');
      return false;
    }
    if (!phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (walletBalance < finalTotal) {
      toast.error(`Insufficient wallet balance. Required: $${finalTotal.toFixed(2)}, Available: $${walletBalance.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        shippingAddress: {
          name: shippingInfo.name.trim(),
          address: shippingInfo.address.trim(),
          city: shippingInfo.city.trim(),
          postalCode: shippingInfo.postalCode.trim(),
          phone: shippingInfo.phone.trim()
        }
      };
      
      console.log('Submitting order:', orderData);
      
      await orderService.createOrder(orderData);
      
      // Clear cart after successful order
      clearCart();
      
      toast.success('Order placed successfully!');
      navigate('/profile');
      
    } catch (error: any) {
      console.error('Order submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <Link to="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/cart"
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-8">
            {/* Wallet Balance */}
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Wallet className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Wallet Balance</h2>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Available Balance:</span>
                <span className={`text-xl font-bold ${walletBalance >= finalTotal ? 'text-green-600' : 'text-red-600'}`}>
                  ${walletBalance.toFixed(2)}
                </span>
              </div>
              
              {walletBalance < finalTotal && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    Insufficient balance. You need ${(finalTotal - walletBalance).toFixed(2)} more.
                  </p>
                  <Link
                    to="/profile"
                    className="text-red-600 hover:text-red-700 font-medium text-sm mt-2 inline-block"
                  >
                    Top up your wallet →
                  </Link>
                </div>
              )}
            </div>

            {/* Shipping Information */}
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Truck className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={shippingInfo.name}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    placeholder="Enter your address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                      placeholder="Enter your city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={shippingInfo.postalCode}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    placeholder="Enter your phone number"
                  />
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Wallet className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>

              <div className="p-4 border border-primary-200 bg-primary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Wallet className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-primary-800">Wallet Payment</span>
                </div>
                <p className="text-sm text-primary-600 mt-1">
                  Payment will be deducted from your wallet balance
                </p>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    Your payment is secure and processed instantly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center space-x-4">
                    <img
                      src={item.product.image || `https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=100`}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || walletBalance < finalTotal}
                className="w-full btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Pay with Wallet - $${finalTotal.toFixed(2)}`}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing your order, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}