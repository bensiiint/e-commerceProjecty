import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.find()
        .populate('user', 'name email')
        .populate('items.product', 'name price')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Monthly sales data for chart
    const monthlySales = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders,
      monthlySales: monthlySales.reverse()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      users,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalUsers: total,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.put('/orders/:id', async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email')
     .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all products (including inactive)
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      products,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts: total,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;