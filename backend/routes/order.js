const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const RestaurantOwner = require('../models/RestaurantOwner');

router.use(authenticate);

// ─── Get Orders ──────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    let restaurantId;
    if (req.user.role === 'super_admin') {
      restaurantId = req.query.restaurantId;
    } else {
      const owner = await RestaurantOwner.findById(req.user.id);
      restaurantId = owner?.restaurant;
    }

    const { page = 1, limit = 20, status, from, to } = req.query;
    const query = {};
    if (restaurantId) query.restaurant = restaurantId;
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ data: orders, meta: { total, page: parseInt(page), totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// ─── Get Single Order ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurant', 'name');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Ownership check for restaurant owners
    if (req.user.role === 'restaurant_owner') {
      const owner = await RestaurantOwner.findById(req.user.id);
      if (order.restaurant._id.toString() !== owner?.restaurant?.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json(order);
  } catch (err) { next(err); }
});

module.exports = router;
