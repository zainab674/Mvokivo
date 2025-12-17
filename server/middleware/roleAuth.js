import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

/**
 * Role-based access control middleware
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['user', 'admin', 'super-admin'])
 */
export const requireRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // First check if user is authenticated
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access token required'
        });
      }

      // Verify the token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      if (!decoded || !decoded.id) {
        return res.status(403).json({
          success: false,
          message: 'Invalid token payload'
        });
      }

      // Get user role from database
      const user = await User.findOne({ id: decoded.id }).select('id role tenant slug_name is_active email');

      if (!user) {
        return res.status(403).json({
          success: false,
          message: 'User profile not found'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is not active. Please verify your email.'
        });
      }

      // Check if user has required role
      const userRole = user.role || 'user';

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      // Attach user data to request
      req.user = {
        id: user.id || user._id.toString(), // Support both if id is string field or _id
        email: user.email,
        role: userRole,
        tenant: user.tenant,
        slug_name: user.slug_name,
        is_active: user.is_active
      };

      // Also attach tenant to req for compatibility with tenant filters
      // For whitelabel admins, tenant might be different?
      // But typically tenant is user's tenant or slug_name for whitelabel
      // Assuming user.tenant is the correct field for filtering
      if (user.tenant) {
        req.tenant = user.tenant;
      } else if (user.slug_name && (user.role === 'admin' || user.role === 'super-admin')) {
        // If admin, their slug_name is effectively their tenant for their data?
        // Or 'main' if not set.
        // Let's rely on user.tenant if set.
      }

      next();
    } catch (error) {
      console.error('Role auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to require tenant ownership
 * User must own the tenant (slug_name matches tenant) or be admin
 */
export const requireTenantOwner = async (req, res, next) => {
  try {
    const tenant = req.tenant || 'main'; // This might come from param or previous middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admins can access any tenant
    if (user.role === 'admin' || user.role === 'super-admin') {
      return next();
    }

    // For main tenant, allow users without slug_name (legacy or regular users)
    if (tenant === 'main') {
      return next();
    }

    // For whitelabel tenants, user must own the tenant
    if (user.slug_name === tenant) {
      return next();
    }

    // Also check explicit tenant field
    if (user.tenant === tenant) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `You do not have permission to access tenant "${tenant}"`
    });
  } catch (error) {
    console.error('Tenant owner middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export default {
  requireRole,
  requireTenantOwner
};
