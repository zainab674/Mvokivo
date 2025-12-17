import express from 'express';
import { WorkspaceSettings, WorkspaceMember, WorkspaceInvitation, User } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Middleware to ensure workspace exists for user
const ensureWorkspace = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let workspace = await WorkspaceSettings.findOne({ user_id: userId });

        // Auto-create workspace if it doesn't exist (personal workspace)
        if (!workspace) {
            workspace = await WorkspaceSettings.create({
                user_id: userId,
                workspace_name: 'My Workspace',
                timezone: 'UTC'
            });

            // Also add user as owner to members
            const { data: user } = await User.findOne({ id: userId });
            await WorkspaceMember.create({
                workspace_id: workspace._id,
                user_id: userId,
                email: user?.email || req.user.email || '', // Fallback
                role: 'owner',
                status: 'active',
                user_name: user?.name
            });
        }

        req.workspace = workspace;
        next();
    } catch (error) {
        console.error('Error in ensureWorkspace:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /api/v1/workspace/settings
 * Get workspace settings
 */
router.get('/settings', authenticateToken, ensureWorkspace, async (req, res) => {
    try {
        res.json(req.workspace);
    } catch (error) {
        console.error('Error fetching workspace settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/v1/workspace/settings
 * Update workspace settings
 */
router.put('/settings', authenticateToken, ensureWorkspace, async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = [
            'workspace_name', 'timezone', 'company_address',
            'company_phone', 'company_website', 'company_industry',
            'company_size', 'company_description'
        ];

        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        filteredUpdates.updated_at = new Date();

        const workspace = await WorkspaceSettings.findOneAndUpdate(
            { _id: req.workspace._id },
            { $set: filteredUpdates },
            { new: true }
        );

        res.json(workspace);
    } catch (error) {
        console.error('Error updating workspace settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/v1/workspace/members
 * List workspace members
 */
router.get('/members', authenticateToken, ensureWorkspace, async (req, res) => {
    try {
        const members = await WorkspaceMember.find({ workspace_id: req.workspace._id });
        res.json(members);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/v1/workspace/members/:id
 * Remove member
 */
router.delete('/members/:id', authenticateToken, ensureWorkspace, async (req, res) => {
    try {
        const memberId = req.params.id;

        // Check if member exists and belongs to workspace
        const member = await WorkspaceMember.findOne({
            _id: memberId,
            workspace_id: req.workspace._id
        });

        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Prevent removing self if owner? Or handled by frontend logic. 
        // Ideally ensure at least one owner remains.

        await WorkspaceMember.deleteOne({ _id: memberId });
        res.json({ success: true, message: 'Member removed' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/v1/workspace/invitations
 * List pending invitations
 */
router.get('/invitations', authenticateToken, ensureWorkspace, async (req, res) => {
    try {
        const invitations = await WorkspaceInvitation.find({
            workspace_id: req.workspace._id,
            status: 'pending'
        });
        res.json(invitations);
    } catch (error) {
        console.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/v1/workspace/invitations
 * Invite member
 */
router.post('/invitations', authenticateToken, ensureWorkspace, async (req, res) => {
    try {
        const { email, role } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if already member
        const existingMember = await WorkspaceMember.findOne({
            workspace_id: req.workspace._id,
            email
        });

        if (existingMember) {
            return res.status(400).json({ error: 'User is already a member' });
        }

        // Check if already invited
        const existingInvite = await WorkspaceInvitation.findOne({
            workspace_id: req.workspace._id,
            email,
            status: 'pending'
        });

        if (existingInvite) {
            return res.status(400).json({ error: 'User is already invited' });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const invitation = await WorkspaceInvitation.create({
            workspace_id: req.workspace._id,
            email,
            role: role || 'member',
            status: 'pending',
            token,
            invited_by: req.user.id,
            expires_at: expiresAt
        });

        // TODO: Send email with invitation link
        console.log(`[MOCK EMAIL] Invitation to ${email}: ${process.env.VITE_SITE_URL || 'http://localhost:8080'}/join-workspace?token=${token}`);

        res.json(invitation);
    } catch (error) {
        console.error('Error inviting member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/v1/workspace/invitations/:id
 * Cancel invitation
 */
router.delete('/invitations/:id', authenticateToken, ensureWorkspace, async (req, res) => {
    try {
        const inviteId = req.params.id;

        await WorkspaceInvitation.deleteOne({
            _id: inviteId,
            workspace_id: req.workspace._id
        });

        res.json({ success: true, message: 'Invitation cancelled' });
    } catch (error) {
        console.error('Error cancelling invitation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Multer configuration for logo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'logo-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

/**
 * POST /api/v1/workspace/logo
 * Upload workspace logo
 */
router.post('/logo', authenticateToken, ensureWorkspace, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Construct public URL
        // Use VITE_SITE_URL if available, otherwise construct from request
        const baseUrl = process.env.VITE_SITE_URL || `${req.protocol}://${req.get('host')}`;
        const publicUrl = `${baseUrl}/uploads/${req.file.filename}`;

        res.json({ success: true, url: publicUrl });
    } catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
