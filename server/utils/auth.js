import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET not set in environment variables, using default.');
}

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant: user.tenant || 'main'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    jwt.verify(token, JWT_SECRET, async (err, userPayload) => {
      if (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
          error: err.message
        });
      }

      // Optional: Check if user still exists in DB
      try {
        // We can skip DB check for performance if payload is sufficient, 
        // but for security (revocation) it's better to check.
        // For now, let's just use payload.
        req.user = userPayload;
        next();
      } catch (dbError) {
        console.error('Auth middleware DB error:', dbError);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to extract user ID from JWT or session (legacy support)
 */
export const extractUserId = (req, res, next) => {
  try {
    const userId = req.headers['user-id'] || req.headers['x-user-id'];
    const companyId = req.headers['company-id'] || req.headers['x-company-id'];

    if (!userId) {
      // If we passed authenticateToken, req.user.id is there
      if (req.user && req.user.id) {
        req.user.companyId = req.user.companyId || req.user.id;
        return next();
      }

      return res.status(401).json({
        error: 'User ID required',
        message: 'Please provide user-id in headers or valid token'
      });
    }

    // Set user object on request
    if (!req.user) req.user = {};
    req.user.id = userId;
    req.user.companyId = companyId || userId;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: error.message
    });
  }
};

/**
 * Middleware to require company ID
 */
export const requireCompanyId = (req, res, next) => {
  if (!req.user?.companyId) {
    // If authenticated via JWT, companyId might be same as user id for now
    if (req.user?.id) {
      req.user.companyId = req.user.id;
    } else {
      return res.status(400).json({
        error: 'Company ID required',
        message: 'Please provide company-id in headers'
      });
    }
  }
  next();
};

/**
 * Middleware to validate knowledge base access
 */
export const validateKnowledgeBaseAccess = (req, res, next) => {
  const { knowledgeBaseId } = req.params;

  if (!knowledgeBaseId) {
    return res.status(400).json({
      error: 'Knowledge base ID required'
    });
  }

  next();
};

/**
 * Middleware to validate file access
 */
export const validateFileAccess = (req, res, next) => {
  const { fileId } = req.params;

  if (!fileId) {
    return res.status(400).json({
      error: 'File ID required'
    });
  }

  next();
};

export default {
  authenticateToken,
  generateToken,
  extractUserId,
  requireCompanyId,
  validateKnowledgeBaseAccess,
  validateFileAccess
};
