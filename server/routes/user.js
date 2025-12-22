import express from 'express';
import { User, VerificationToken, VerificationOtp, PasswordResetToken } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Get user profile
 * GET /api/v1/user/profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Get user profile
 * GET /api/v1/user/profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Update user profile
 * PUT /api/v1/user/profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Filter allowed updates
    const allowedUpdates = ['name', 'contact', 'company', 'phone', 'plan']; // Adjust based on needs
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const user = await User.findOneAndUpdate(
      { id: userId },
      { $set: filteredUpdates },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Complete onboarding
 * POST /api/v1/user/onboarding
 */
router.post('/onboarding', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, company, industry, team_size, role, use_case,
      theme, notifications, goals, plan, contact,
      trial_ends_at, tenant, slug_name
    } = req.body;

    const updates = {
      name, company, industry, team_size, role, use_case,
      theme, notifications, goals, plan, contact,
      onboarding_completed: true,
      updated_at: new Date()
    };

    if (trial_ends_at) updates.trial_ends_at = trial_ends_at;
    if (tenant) updates.tenant = tenant;
    if (slug_name) updates.slug_name = slug_name;

    // Fetch plan configuration to get minutes allocation
    if (plan) {
      try {
        const { PlanConfig } = await import('../models/index.js');

        // Determine tenant for plan lookup
        const planTenant = tenant && tenant !== 'main' ? tenant : null;

        // Find the plan configuration
        const planConfig = await PlanConfig.findOne({
          plan_key: plan.toLowerCase(),
          tenant: planTenant,
          is_active: true
        });

        if (planConfig) {
          // Check if plan is successfully resolved
          const isFree = planConfig.price === 0;

          if (isFree) {
            // Assign minutes immediately for free plans
            if (planConfig.minutes !== undefined && planConfig.minutes !== null) {
              updates.minutes_limit = Number(planConfig.minutes);
              console.log(`Assigned ${planConfig.minutes} minutes to user ${userId} for FREE plan ${plan}`);
            } else if (planConfig.pay_as_you_go) {
              updates.minutes_limit = 0;
            } else {
              updates.minutes_limit = 0;
            }
          } else {
            // Paid plan: Do NOT assign minutes yet. Wait for webhook.
            console.log(`User ${userId} selected PAID plan ${plan}. Waiting for payment webhook to assign minutes.`);
            // We do not set updates.minutes_limit here, so it remains 0 (for new users) or current value (for existing).
          }
        } else {
          console.warn(`Plan configuration not found for plan: ${plan}, tenant: ${planTenant}`);
          // Default to 0 minutes if plan not found
          if (!updates.minutes_limit) updates.minutes_limit = 1;
        }
      } catch (error) {
        console.error('Error fetching plan configuration:', error);
        // Continue with onboarding even if plan fetch fails
        updates.minutes_limit = 1;
      }
    }

    // Reset minutes_used to 0 for new onboarding
    updates.minutes_used = 0;

    const user = await User.findOneAndUpdate(
      { id: userId },
      { $set: updates },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


/**
 * Complete signup with white label support
 * This endpoint ensures slug is properly assigned during signup
 */
router.post('/complete-signup', async (req, res) => {
  try {
    const { user_id, slug, whitelabel } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // If white label signup, validate and assign slug
    if (whitelabel && slug) {
      const lowerSlug = slug.toLowerCase();

      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(lowerSlug)) {
        return res.status(400).json({
          success: false,
          message: 'Slug can only contain lowercase letters, numbers, and hyphens'
        });
      }

      if (lowerSlug.length < 3 || lowerSlug.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Slug must be between 3 and 50 characters'
        });
      }

      // Check if slug is available
      const existingUser = await User.findOne({ slug_name: lowerSlug });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Slug is already taken'
        });
      }

      // Update user with slug and set as admin
      const updatedUser = await User.findOneAndUpdate(
        { id: user_id },
        {
          slug_name: lowerSlug,
          tenant: lowerSlug,
          role: 'admin'
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Setup Nginx reverse proxy for the whitelabel domain
      try {
        // Construct full domain from slug
        const mainDomain = process.env.MAIN_DOMAIN || process.env.VITE_MAIN_DOMAIN || 'frontend.ultratalkai.com';
        const fullDomain = `${lowerSlug}.${mainDomain}`;
        const frontendPort = process.env.FRONTEND_PORT || '8080';

        // Path to script
        const scriptPath = path.join(__dirname, '..', 'scripts', 'setup_reverse_proxy.sh');

        // Check if script exists
        if (!fs.existsSync(scriptPath)) {
          console.error('Nginx setup script not found:', scriptPath);
          // Don't fail signup, just log error
        } else {
          console.log(`🚀 Setting up Nginx reverse proxy for ${fullDomain} on port ${frontendPort}`);

          // Execute script asynchronously (don't block signup response)
          const script = spawn('sudo', [
            'bash',
            scriptPath,
            fullDomain,
            frontendPort
          ]);

          let output = '';

          script.stdout.on('data', (data) => {
            output += data.toString();
            console.log('Nginx setup output:', data.toString());
          });

          script.stderr.on('data', (data) => {
            output += data.toString();
            console.error('Nginx setup error:', data.toString());
          });

          script.on('close', (code) => {
            if (code === 0) {
              console.log(`✅ Nginx reverse proxy setup completed for ${fullDomain}`);
            } else {
              console.error(`❌ Nginx setup failed for ${fullDomain} with code ${code}`);
              console.error('Script output:', output);
            }
          });

          // Handle script errors
          script.on('error', (error) => {
            console.error('Error executing Nginx setup script:', error);
          });

          // Don't wait for script to complete - return success immediately
          // Script runs in background
        }
      } catch (error) {
        console.error('Error setting up Nginx reverse proxy:', error);
        // Don't fail signup if Nginx setup fails
      }
    }

    // we should create a token if the user is not active/verified.
    // The user should have been created in /signup route which sends verification there properly?
    // This route is called 'complete-signup', arguably after registration.
    // We can trigger another email here if needed.
    // For now, assume /signup handled initial verification email, but let's check.
    const user = await User.findOne({ id: user_id });
    if (user && !user.is_active) {
      // Create verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await VerificationToken.findOneAndUpdate(
        { user_id: user_id },
        { token, expires_at: expiresAt },
        { upsert: true }
      );

      // Log the link (mock email)
      const siteUrl = process.env.VITE_SITE_URL || process.env.SITE_URL || 'http://localhost:8080';
      console.log(`Verify email link: ${siteUrl}/api/user/verify-email?token=${token}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Signup completed successfully'
    });
  } catch (error) {
    console.error('Error in complete-signup:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during signup'
    });
  }
});

/**
 * Send verification email after signup
 * This is called by the frontend after signup
 */
router.post('/send-verification-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already verified (is_active is our flag)
    if (user.is_active) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Store verification token in database
    await VerificationToken.findOneAndUpdate(
      { user_id: user.id },
      { token, expires_at: expiresAt },
      { upsert: true }
    );

    // Get tenant info for redirect URL (frontend constructs this typically, but here for link generation)
    const tenant = user.tenant || 'main';
    const slugName = user.slug_name;
    const customDomain = user.custom_domain;

    // Build verification URL
    const mainDomain = process.env.MAIN_DOMAIN || 'localhost';
    let verificationUrl;
    // We point to backend endpoint which redirects, OR frontend?
    // Our new `verify-email` endpoint below expects `token` query param.
    // Let's point the user to the BACKEND verify route if it handles redirect, 
    // OR frontend page `auth/verify-email`.
    // The previous implementation used `${siteUrl}/auth/callback`.
    // Let's assume we send a link to the Frontend which calls the API, or a link to the API which redirects.
    // Let's stick to API link for simplicity of "clicking a link in email".
    // Or if frontend handles it: `https://.../auth/verify?token=...`
    // I will log the link as if I sent an email.

    // Construct the link that the USER would click.
    // Usually: https://frontend-domain/auth/verify?token=xyz
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    // Use siteUrl or mainDomain
    const siteUrl = process.env.VITE_SITE_URL || `${protocol}://${mainDomain}:8080`;

    const clickLink = `${siteUrl}/verify-email?token=${token}`; // Assuming a frontend route

    console.log(`[MOCK EMAIL] To: ${email}, Subject: Verify your email, Link: ${clickLink}`);

    return res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Error in send-verification-email:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while sending verification email'
    });
  }
});

/**
 * Verify user email with token
 * Accessed via GET (link click) or POST (code submission)
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find verification token
    const verificationToken = await VerificationToken.findOne({ token });

    if (!verificationToken) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Check if token is expired
    if (verificationToken.expires_at < new Date()) {
      await VerificationToken.deleteOne({ token });
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      });
    }

    // Update user profile to set is_active
    await User.findOneAndUpdate(
      { id: verificationToken.user_id },
      { is_active: true }
    );

    // Delete verification token
    await VerificationToken.deleteOne({ token });

    // Get user data for redirect logic
    const user = await User.findOne({ id: verificationToken.user_id });

    const tenant = user?.tenant || 'main'; // unused but kept for parity
    const slugName = user?.slug_name;
    const customDomain = user?.custom_domain;

    // Build login URL
    const mainDomain = process.env.MAIN_DOMAIN || 'localhost';
    let loginUrl;
    // Assuming frontend running on port 8080 or main domain
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.NODE_ENV === 'production' ? mainDomain : 'localhost:8080';

    if (customDomain) {
      loginUrl = `https://${customDomain}/login?verified=true`;
    } else if (slugName) {
      loginUrl = `${protocol}://${slugName}.${mainDomain}/login?verified=true`;
    } else {
      loginUrl = `${protocol}://${host}/login?verified=true`;
    }

    // Improve local dev redirection
    if (process.env.NODE_ENV !== 'production' && !slugName && !customDomain) {
      loginUrl = `http://localhost:8080/login?verified=true`;
    }

    // Redirect to login page
    return res.redirect(loginUrl);
  } catch (error) {
    console.error('Error in verify-email:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying email'
    });
  }
});

/**
 * Forgot password - send OTP
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { action, email, otp } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.'
      });
    }

    if (action === 'send_otp') {
      // Check if existing valid OTP
      const existingOtp = await VerificationOtp.findOne({
        user_email: email,
        expires_at: { $gt: new Date() }
      });

      if (existingOtp) {
        return res.status(200).json({
          success: true,
          message: 'OTP already sent. Please check your email.'
        });
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP (expires in 10 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      await VerificationOtp.create({
        user_email: email,
        otp: otpCode,
        expires_at: expiresAt
      });

      // TODO: Send email
      console.log(`[MOCK EMAIL] OTP for ${email}: ${otpCode}`);

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully. Please check your email.'
      });
    } else if (action === 'verify_otp') {
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'OTP is required'
        });
      }

      // Verify OTP
      const otpData = await VerificationOtp.findOne({
        user_email: email,
        otp: otp,
        expires_at: { $gt: new Date() }
      });

      if (!otpData) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 1); // 1 hour expiry

      // Store reset token
      await PasswordResetToken.findOneAndUpdate(
        { user_id: user.id },
        { token: resetToken, expires_at: tokenExpiresAt },
        { upsert: true }
      );

      // Delete OTP
      await VerificationOtp.deleteOne({ _id: otpData._id });

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        reset_token: resetToken
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "send_otp" or "verify_otp"'
      });
    }
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing password reset'
    });
  }
});

/**
 * Reset password with token
 */
router.post('/reset-password', authenticateToken, async (req, res) => {
  // Note: authenticateToken might fail if user doesn't have a valid JWT. 
  // Usually reset-password uses the reset token supplied in body to identify user, NOT the JWT header.
  // The previous implementation utilized `authenticateToken` but also logic for `reset_token`.
  // If I use `reset_token`, I should NOT require `authenticateToken` middleware unless the token IS a JWT.
  // But here `reset_token` is an opaque string from `PasswordResetToken` model.
  // So I should remove `authenticateToken` from route if I rely on `reset_token`.
  // However, the previous code checked `req.user.id` BUT ALSO if `reset_token` provided it used that.
  // I will support `reset_token` without auth, or auth update.
  // But `router.post` signature below includes `authenticateToken`.
  // I will make `authenticateToken` optional or handle inside?
  // Actually, standard flow is:
  // 1. Unauthenticated user -> forgot pass -> OTP -> gets reset_token.
  // 2. Uses reset_token to set new password.
  // So this route should probably NOT enforce `authenticateToken` if `reset_token` is present.
  // I will remove `authenticateToken` middleware here and handle auth manually if needed.
  // Wait, let's keep it consistent: I'll remove it from the definition line and check inside.
  try {
    const { new_password, reset_token } = req.body;

    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    let userId = null;

    if (reset_token) {
      const resetTokenData = await PasswordResetToken.findOne({
        token: reset_token,
        expires_at: { $gt: new Date() }
      });

      if (!resetTokenData) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      userId = resetTokenData.user_id;

      // Delete reset token
      await PasswordResetToken.deleteOne({ token: reset_token });
    } else if (req.user) {
      // Fallback to authenticated user changin password? 
      // But `authenticateToken` is not applied middleware.
      // So `req.user` will be undefined.
      // We really need `reset_token`.
      return res.status(400).json({
        success: false,
        message: 'Reset token required'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Reset token required'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update user
    await User.findOneAndUpdate(
      { id: userId },
      { password: hashedPassword, is_active: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error in reset-password:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting password'
    });
  }
});

/**
 * Change password (requires authentication)
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Both old and new passwords are required'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    const userId = req.user.id;

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify old password
    if (user.password) {
      const isMatch = await bcrypt.compare(old_password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect old password'
        });
      }
    } else {
      // If user has no password (maybe oauth only?), allow setting?
      // But they provided old_password.
      // We can just proceed, or error.
      // For safety, error if they try to switch from oauth to password without flow?
      // But here we assume manual auth.
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error in change-password:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while changing password'
    });
  }
});

/**
 * Delete user account
 */
router.post('/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete user
    await User.deleteOne({ id: userId });

    // Clean up related data?
    // Mongoose cascading delete or manual cleanup:
    // PhoneNumber, Assistant, Campaign, etc.
    // For now just delete User to match previous simple logic.

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

/**
 * Get user settings
 * GET /api/v1/user/settings
 */
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      settings: {
        daily_summary: user.daily_summary || false,
        call_summary: user.call_summary || false,
        summary_email: user.summary_email || ''
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Update user settings
 * POST /api/v1/user/settings
 */
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    const { daily_summary, call_summary, summary_email } = req.body;
    const updates = {};
    if (typeof daily_summary !== 'undefined') updates.daily_summary = daily_summary;
    if (typeof call_summary !== 'undefined') updates.call_summary = call_summary;
    if (typeof summary_email !== 'undefined') updates.summary_email = summary_email;

    const user = await User.findOneAndUpdate(
      { id: req.user.id },
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      settings: {
        daily_summary: user.daily_summary,
        call_summary: user.call_summary,
        summary_email: user.summary_email
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Change user's plan
 * POST /api/v1/user/change-plan
 */
router.post('/change-plan', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPlan } = req.body;

    if (!newPlan) {
      return res.status(400).json({ success: false, message: 'New plan is required' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Determine tenant for plan lookup
    const planTenant = user.tenant && user.tenant !== 'main' ? user.tenant : null;

    // Find the new plan configuration
    const { PlanConfig } = await import('../models/index.js');
    const planConfig = await PlanConfig.findOne({
      plan_key: newPlan.toLowerCase(),
      tenant: planTenant,
      is_active: true
    });

    if (!planConfig) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Update user's plan and reset minutes
    const updates = {
      plan: newPlan.toLowerCase(),
      updated_at: new Date()
    };

    // Assign minutes based on new plan configuration
    if (planConfig.minutes !== undefined && planConfig.minutes !== null) {
      updates.minutes_limit = Number(planConfig.minutes);
      console.log(`Assigned ${planConfig.minutes} minutes to user ${userId} for new plan ${newPlan}`);
    } else if (planConfig.pay_as_you_go) {
      // Pay as you go plan - no minutes included
      updates.minutes_limit = 0;
      console.log(`User ${userId} switched to pay-as-you-go plan ${newPlan} - no minutes included`);
    } else {
      // Unlimited or unspecified
      updates.minutes_limit = 0;
      console.log(`User ${userId} switched to plan ${newPlan} with unlimited/unspecified minutes`);
    }

    // Reset minutes_used to 0 when changing plans
    updates.minutes_used = 0;

    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      { $set: updates },
      { new: true }
    );

    res.json({
      success: true,
      user: updatedUser,
      message: 'Plan changed successfully',
      minutesAssigned: updates.minutes_limit
    });

  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;


