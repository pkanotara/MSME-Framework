const { verifyAccessToken } = require('../utils/jwt');
const Admin = require('../models/Admin');
const RestaurantOwner = require('../models/RestaurantOwner');

/**
 * Verify JWT and attach user to req
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Attach user info
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Require super_admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Require restaurant_owner role
 */
const requireOwner = (req, res, next) => {
  if (req.user?.role !== 'restaurant_owner') {
    return res.status(403).json({ error: 'Restaurant owner access required' });
  }
  next();
};

/**
 * Allow both admin and owner
 */
const requireAuthenticatedUser = (req, res, next) => {
  if (!['super_admin', 'restaurant_owner'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

/**
 * Ensure restaurant owner can only access their own restaurant
 */
const requireOwnRestaurant = async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') return next(); // Admin can access all

    const restaurantId = req.params.restaurantId || req.body.restaurantId;
    if (!restaurantId) return res.status(400).json({ error: 'Restaurant ID required' });

    const owner = await RestaurantOwner.findById(req.user.id);
    if (!owner || owner.restaurant?.toString() !== restaurantId) {
      return res.status(403).json({ error: 'You can only access your own restaurant' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireAdmin, requireOwner, requireAuthenticatedUser, requireOwnRestaurant };
