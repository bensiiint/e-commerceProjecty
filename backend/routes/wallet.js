import express from 'express';
import User from '../models/User.js';
import TopupRequest from '../models/TopupRequest.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get wallet balance and transactions
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    res.json(user.wallet);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request wallet top-up
router.post('/topup', authenticate, [
  body('amount').isNumeric().withMessage('Amount must be a number').custom(value => {
    if (value < 1) throw new Error('Amount must be at least $1');
    return true;
  }),
  body('paymentMethod').isIn(['bank_transfer', 'credit_card', 'paypal']).withMessage('Invalid payment method'),
  body('paymentProof').notEmpty().withMessage('Payment proof is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, paymentMethod, paymentProof } = req.body;

    const topupRequest = new TopupRequest({
      user: req.user._id,
      amount,
      paymentMethod,
      paymentProof
    });

    await topupRequest.save();

    res.status(201).json({
      message: 'Top-up request submitted successfully. Please wait for admin approval.',
      request: topupRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's top-up requests
router.get('/topup-requests', authenticate, async (req, res) => {
  try {
    const requests = await TopupRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all top-up requests
router.get('/admin/topup-requests', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const requests = await TopupRequest.find(query)
      .populate('user', 'name email')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Process top-up request
router.put('/admin/topup-requests/:id', authenticate, authorize('admin'), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('adminNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, adminNotes } = req.body;
    const requestId = req.params.id;

    const topupRequest = await TopupRequest.findById(requestId).populate('user');
    if (!topupRequest) {
      return res.status(404).json({ message: 'Top-up request not found' });
    }

    if (topupRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    topupRequest.status = status;
    topupRequest.adminNotes = adminNotes || '';
    topupRequest.processedBy = req.user._id;
    topupRequest.processedAt = new Date();

    if (status === 'approved') {
      // Add money to user's wallet
      const user = await User.findById(topupRequest.user._id);
      user.wallet.balance += topupRequest.amount;
      user.wallet.transactions.push({
        type: 'topup',
        amount: topupRequest.amount,
        description: `Wallet top-up approved - ${topupRequest.paymentMethod}`,
        status: 'completed'
      });
      await user.save();
    }

    await topupRequest.save();

    res.json({
      message: `Top-up request ${status} successfully`,
      request: topupRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;