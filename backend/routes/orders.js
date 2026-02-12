const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Artwork = require('../models/Artwork');
const ArtistProfile = require('../models/ArtistProfile');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get orders for current user
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.user_type === 'admin') {
      // Admin can see all orders
    } else if (req.user.user_type === 'artist') {
      // Artists can see orders for their artworks
      const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
      if (artistProfile) {
        query['items.product'] = { $in: await Artwork.find({ artist_id: artistProfile._id }).select('_id') };
      }
    } else {
      // Regular users can see their own orders
      query.user_id = req.user._id;
    }

    const orders = await Order.find(query)
      .populate('user_id', 'full_name email')
      .populate({
        path: 'items.product',
        select: 'title price category image_url medium'
      })
      .populate('address', 'firstName lastName street city state country phone')
      .sort({ order_date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user_id', 'full_name email')
      .populate('artwork_id', 'title price')
      .populate('artist_id', 'artist_name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user can view this order
    if (req.user.user_type !== 'admin' &&
        order.user_id._id.toString() !== req.user._id.toString() &&
        order.artist_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { userId, items, address, paymentMethod } = req.body;

    // Manual validation
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid items' });
    }
    for (const item of items) {
      if (!item.product || typeof item.product !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid product in items' });
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({ success: false, message: 'Invalid quantity in items' });
      }
    }
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid address' });
    }
    if (paymentMethod && paymentMethod !== 'stripe') {
      return res.status(400).json({ success: false, message: 'Invalid paymentMethod' });
    }

    // Verify user can only create orders for themselves
    if (req.user._id.toString() !== userId && req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Note: ObjectId conversion is not needed as we're storing string IDs directly

    let totalAmount = 0;
    const orderItems = [];

    // Validate each item
    for (const item of items) {
      const artwork = await Artwork.findById(item.product);
      if (!artwork || artwork.status !== 'published') {
        return res.status(400).json({ success: false, message: `Artwork ${item.product} not available` });
      }

      // Check if user is not the artist
      const artistProfile = await ArtistProfile.findById(artwork.artist_id);
      if (artistProfile && artistProfile.user_id.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Cannot order your own artwork' });
      }

      totalAmount += artwork.price * item.quantity;
      orderItems.push({
        product: item.product,
        quantity: item.quantity
      });
    }

    // Add tax (2%)
    totalAmount += Math.round(totalAmount * 2 / 100);

    const order = new Order({
      user_id: userId,
      items: orderItems,
      total_amount: totalAmount,
      address: address,
      paymentType: paymentMethod ? 'Online' : 'COD'
    });

    await order.save();
    await order.populate('user_id', 'full_name email');
    await order.populate({
      path: 'items.product',
      select: 'title price category image_url medium'
    });
    await order.populate('address', 'firstName lastName street city state country phone');

    if (paymentMethod === 'stripe') {
      // Handle Stripe payment (placeholder)
      res.json({ success: true, message: 'Order created, proceed to payment', url: 'https://stripe-payment-url.com' });
    } else {
      res.json({ success: true, message: 'Order placed successfully', order });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update order status
router.put('/:id', auth, [
  body('status').isIn(['pending', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed: ' + errors.array().map(err => err.msg).join(', ') });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user can update this order
    if (req.user.user_type !== 'admin') {
      // For artists, check if they have artworks in this order
      const artistProfile = await ArtistProfile.findOne({ user_id: req.user._id });
      if (!artistProfile) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const hasArtworksInOrder = order.items.some(item =>
        item.product.artist_id.toString() === artistProfile._id.toString()
      );

      if (!hasArtworksInOrder) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const oldStatus = order.status;
    const newStatus = req.body.status;

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: newStatus }, { new: true })
      .populate('user_id', 'full_name email')
      .populate({
        path: 'items.product',
        select: 'title price category image_url medium'
      })
      .populate('address', 'firstName lastName street city state country phone');

    // Update total_sales for each artist in the order
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      // Add to total_sales for each artist
      for (const item of order.items) {
        const artistProfile = await ArtistProfile.findById(item.product.artist_id);
        if (artistProfile) {
          await ArtistProfile.findByIdAndUpdate(artistProfile._id, {
            $inc: { total_sales: item.product.price * item.quantity }
          });
        }
      }
    } else if (newStatus === 'cancelled' && oldStatus === 'completed') {
      // Subtract from total_sales for each artist
      for (const item of order.items) {
        const artistProfile = await ArtistProfile.findById(item.product.artist_id);
        if (artistProfile) {
          await ArtistProfile.findByIdAndUpdate(artistProfile._id, {
            $inc: { total_sales: -(item.product.price * item.quantity) }
          });
        }
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete order
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only admin can delete orders
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
