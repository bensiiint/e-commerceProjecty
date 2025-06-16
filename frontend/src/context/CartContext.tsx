import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => void;
  total: number;
  itemCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      // Load from localStorage for guest users
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    }
  }, [user]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartItems = await cartService.getCart();
      setItems(cartItems);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      setLoading(true);
      if (user) {
        await cartService.addToCart(productId, quantity);
        await loadCart();
      } else {
        // Handle guest cart with localStorage
        const updatedItems = [...items];
        const existingIndex = updatedItems.findIndex(item => item.product._id === productId);
        
        if (existingIndex >= 0) {
          updatedItems[existingIndex].quantity += quantity;
        } else {
          // In a real app, you'd fetch product details here
          updatedItems.push({
            _id: Date.now().toString(),
            product: { _id: productId, name: '', price: 0, image: '' },
            quantity
          });
        }
        
        setItems(updatedItems);
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      setLoading(true);
      if (user) {
        await cartService.updateCart(productId, quantity);
        await loadCart();
      } else {
        const updatedItems = items.map(item =>
          item.product._id === productId ? { ...item, quantity } : item
        );
        setItems(updatedItems);
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      }
    } catch (error) {
      console.error('Failed to update cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      setLoading(true);
      if (user) {
        await cartService.removeFromCart(productId);
        await loadCart();
      } else {
        const updatedItems = items.filter(item => item.product._id !== productId);
        setItems(updatedItems);
        localStorage.setItem('cart', JSON.stringify(updatedItems));
      }
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      total,
      itemCount,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}