import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ShopHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
            >
              Home
            </Link>
            {user?.role !== 'admin' && (
              <Link 
                to="/products" 
                className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
              >
                Products
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Search - Only show for non-admin users */}
            {user?.role !== 'admin' && (
              <div className="hidden md:flex">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                  />
                </div>
              </div>
            )}

            {/* Cart - Only show for non-admin users */}
            {user?.role !== 'admin' && (
              <Link 
                to="/cart" 
                className="relative p-2 text-gray-700 hover:text-primary-500 transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary-500 transition-colors"
                >
                  <User className="w-6 h-6" />
                  <span className="hidden md:block">{user.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    {user.role === 'admin' ? (
                      <>
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                        <Link
                          to="/admin/products"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Manage Products</span>
                        </Link>
                      </>
                    ) : (
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-500"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-primary-500 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {user?.role !== 'admin' && (
                <Link 
                  to="/products" 
                  className="text-gray-700 hover:text-primary-500 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Products
                </Link>
              )}
              {user?.role !== 'admin' && (
                <div className="pt-2 border-t border-gray-200">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}