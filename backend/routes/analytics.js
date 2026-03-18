const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const RestaurantOwner = require('../models/RestaurantOwner');
const Customer = require('../models/Customer');

router.use(authenticate);

const getRestaurantId = async (req) => {
  if (req.user.role === 'super_admin') return req.query.restaurantId || null;
  const owner = await RestaurantOwner.findById(req.user.id);
  return owner?.restaurant;
};

// ─── Daily Orders Chart ───────────────────────────────────────────────────────
router.get('/daily-orders', async (req, res, next) => {
  try {
    const restaurantId = await getRestaurantId(req);
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const match = { createdAt: { $gte: startDate } };
    if (restaurantId) match.restaurant = require('mongoose').Types.ObjectId.createFromHexString(restaurantId.toString());

    const data = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data.map(d => ({ date: d._id, orders: d.orders, revenue: d.revenue })));
  } catch (err) { next(err); }
});

// ─── Revenue Summary ──────────────────────────────────────────────────────────
router.get('/revenue', async (req, res, next) => {
  try {
    const restaurantId = await getRestaurantId(req);
    const match = {};
    if (restaurantId) match.restaurant = require('mongoose').Types.ObjectId.createFromHexString(restaurantId.toString());

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today); thisWeek.setDate(today.getDate() - 7);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayRev, weekRev, monthRev, allTime] = await Promise.all([
      Order.aggregate([{ $match: { ...match, createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { ...match, createdAt: { $gte: thisWeek } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { ...match, createdAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    ]);

    res.json({
      today: todayRev[0]?.total || 0,
      week: weekRev[0]?.total || 0,
      month: monthRev[0]?.total || 0,
      allTime: allTime[0]?.total || 0,
    });
  } catch (err) { next(err); }
});

// ─── Top Menu Items ────────────────────────────────────────────────────────────
router.get('/top-items', async (req, res, next) => {
  try {
    const restaurantId = await getRestaurantId(req);
    const match = {};
    if (restaurantId) match.restaurant = require('mongoose').Types.ObjectId.createFromHexString(restaurantId.toString());

    const items = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json(items.map(i => ({ name: i._id, count: i.count, revenue: i.revenue })));
  } catch (err) { next(err); }
});

// ─── Order Status Breakdown ────────────────────────────────────────────────────
router.get('/order-status', async (req, res, next) => {
  try {
    const restaurantId = await getRestaurantId(req);
    const match = {};
    if (restaurantId) match.restaurant = require('mongoose').Types.ObjectId.createFromHexString(restaurantId.toString());

    const breakdown = await Order.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json(breakdown.map(b => ({ status: b._id, count: b.count })));
  } catch (err) { next(err); }
});

module.exports = router;
