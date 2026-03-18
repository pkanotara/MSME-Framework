const { validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const RestaurantOwner = require('../models/RestaurantOwner');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { ActivityLog } = require('../models/Logs');
const crypto = require('crypto');

const getModel = (role) => role === 'super_admin' ? Admin : RestaurantOwner;

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, role } = req.body;
    const Model = getModel(role);

    const user = await Model.findOne({ email }).select('+password +refreshToken');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { id: user._id, role: user.role || role, email: user.email };
    if (role === 'restaurant_owner') payload.restaurantId = user.restaurant;

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await ActivityLog.create({
      actor: user._id, actorRole: role, actorName: user.name,
      action: 'login', ipAddress: req.ip,
    });

    res.json({ accessToken, refreshToken, user: user.toJSON() });
  } catch (err) { next(err); }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken, role } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    const decoded = verifyRefreshToken(refreshToken);
    const Model = getModel(decoded.role || role);

    const user = await Model.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const payload = { id: user._id, role: decoded.role, email: user.email };
    if (decoded.role === 'restaurant_owner') payload.restaurantId = user.restaurant;

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const Model = getModel(req.user.role);
    await Model.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const Model = getModel(req.user.role);
    const user = await Model.findById(req.user.id)
      .populate(req.user.role === 'restaurant_owner' ? 'restaurant' : '');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const Model = getModel(req.user.role);
    const user = await Model.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const Model = getModel(role || 'restaurant_owner');
    const user = await Model.findOne({ email });
    // Always return 200 to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link will be sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    // TODO: send email with reset link
    res.json({ message: 'If that email exists, a reset link will be sent.' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password, role } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const Model = getModel(role || 'restaurant_owner');
    const user = await Model.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (err) { next(err); }
};
