import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken, authenticateToken } from '../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * Register a new user
 * POST /api/auth/signup
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, tenant } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Determine tenant assignment
        let userTenant = 'main';
        let userSlugName = undefined;

        if (tenant && tenant !== 'main') {
            // User is signing up on a whitelabel subdomain
            // Verify the tenant exists by checking if there's a user with that slug_name
            const tenantOwner = await User.findOne({ slug_name: tenant });

            if (tenantOwner) {
                // Valid tenant - assign user to this tenant
                userTenant = tenant;
                // Regular users under a tenant don't get slug_name
                userSlugName = undefined;
            } else {
                // Invalid tenant - fall back to main
                console.warn(`Signup attempted on invalid tenant: ${tenant}`);
                userTenant = 'main';
            }
        }

        // Regular users on main tenant do not get a slug_name until they activate whitelabel
        userSlugName = undefined;

        // Create user
        const newUser = new User({
            id: uuidv4(),
            email,
            password: hashedPassword,
            name: name,
            slug_name: userSlugName,
            tenant: userTenant,
            role: 'user'
        });

        await newUser.save();

        // Generate token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                tenant: newUser.tenant
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Check user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check password
        // They might need to reset password.
        if (!user.password) {
            return res.status(400).json({ success: false, message: 'Please reset your password to login.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenant: user.tenant
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ id: req.user.id }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Forgot Password (Stub)
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        // TODO: Implement actual email sending logic locally
        console.log(`[Stub] Password reset requested for: ${email}`);
        res.json({ success: true, message: 'If an account exists, a password reset email has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
