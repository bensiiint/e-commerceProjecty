import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create order using wallet
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('Order creation request:', req.body);
    console.log('User:', req.user._id);

    const { shippingAddress } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    const { name, address, city, postalCode, phone } = shippingAddress;
    
    if (!name || !address || !city || !postalCode || !phone) {
      return res.status(400).json({ 
        message: 'All shipping address fields are required',
        required: ['name', 'address', 'city', 'postalCode', 'phone']
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price stock isActive');

    console.log('Cart found:', cart);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        return res.status(400).json({ 
          message: `Product ${item.product?.name || 'Unknown'} is no longer available` 
        });
      }

      if (item.product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = item.product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      });
    }

    console.log('Order items:', orderItems);
    console.log('Subtotal:', subtotal);

    // Calculate tax and shipping
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
    const total = subtotal + tax + shipping;

    console.log('Total calculation:', { subtotal, tax, shipping, total });

    // Check wallet balance
    const user = await User.findById(req.user._id);
    console.log('User wallet balance:', user.wallet.balance);

    if (user.wallet.balance < total) {
      return res.status(400).json({ 
        message: `Insufficient wallet balance. Required: $${total.toFixed(2)}, Available: $${user.wallet.balance.toFixed(2)}` 
      });
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        phone: phone.trim()
      },
      paymentMethod: 'wallet',
      subtotal,
      tax,
      shipping,
      total,
      paymentStatus: 'paid'
    });

    console.log('Creating order:', order);

    await order.save();

    console.log('Order created successfully:', order._id);

    // Deduct from wallet and add transaction
    user.wallet.balance -= total;
    user.wallet.transactions.push({
      type: 'purchase',
      amount: -total,
      description: `Order payment - #${order.orderNumber}`,
      status: 'completed'
    });
    await user.save();

    console.log('Wallet updated, new balance:', user.wallet.balance);

    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
      console.log(`Updated stock for product ${item.product._id}, reduced by ${item.quantity}`);
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    console.log('Cart cleared');

    // Populate order for response
    await order.populate('items.product', 'name price image');

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user's orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name price image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalOrders: total,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    }).populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get single order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;