import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { User, PlanConfig } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLUG_REGEX = /^[a-z0-9-]+$/;
const RESERVED_SLUGS = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost', 'main', 'test', 'staging', 'dev', 'prod'];

async function isPlanWhitelabelEnabled(planKey, tenant) {
  if (!planKey) {
    return false;
  }

  const normalizedPlanKey = planKey.toLowerCase();

  const fetchPlan = async (tenantFilter) => {
    const query = {
      plan_key: normalizedPlanKey,
      is_active: true
    };

    if (tenantFilter) {
      query.tenant = tenantFilter;
    } else {
      query.tenant = { $in: [null, undefined] }; // Check for null or undefined
    }

    try {
      const planConfig = await PlanConfig.findOne(query);
      return planConfig;
    } catch (error) {
      console.error('Error fetching plan config for whitelabel check:', error);
      return null;
    }
  };

  const tenantFilter = tenant && tenant !== 'main' ? tenant : null;

  if (tenantFilter) {
    const tenantPlan = await fetchPlan(tenantFilter);
    if (tenantPlan) {
      return tenantPlan.whitelabel_enabled === true;
    }
  }

  const mainPlan = await fetchPlan(null);
  if (mainPlan) {
    return mainPlan.whitelabel_enabled === true;
  }

  return false;
}

function validateSlug(slug) {
  if (!slug) {
    return 'Slug is required';
  }

  const lowerSlug = slug.toLowerCase();

  if (!SLUG_REGEX.test(lowerSlug)) {
    return 'Slug can only contain lowercase letters, numbers, and hyphens';
  }

  if (lowerSlug.length < 3) {
    return 'Slug must be at least 3 characters long';
  }

  if (lowerSlug.length > 50) {
    return 'Slug must be less than 50 characters long';
  }

  if (RESERVED_SLUGS.includes(lowerSlug)) {
    return 'This slug is reserved and cannot be used';
  }

  return null;
}

async function ensureSlugAvailable(lowerSlug) {
  try {
    const existingUser = await User.findOne({ slug_name: lowerSlug }).select('slug_name');
    if (existingUser) {
      return false;
    }
    return true;
  } catch (error) {
    throw new Error(error.message || 'Error checking slug availability');
  }
}

async function setupReverseProxyForSlug(lowerSlug) {
  try {
    const mainDomain = process.env.MAIN_DOMAIN || process.env.VITE_MAIN_DOMAIN || 'frontend.ultratalkai.com';
    const fullDomain = `${lowerSlug}.${mainDomain}`;
    const frontendPort = process.env.FRONTEND_PORT || '8080';
    const scriptPath = path.join(__dirname, '..', 'scripts', 'setup_reverse_proxy.sh');

    if (!fs.existsSync(scriptPath)) {
      console.error('Nginx setup script not found:', scriptPath);
      return;
    }

    console.log(`🚀 Setting up Nginx reverse proxy for ${fullDomain} on port ${frontendPort}`);

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

    script.on('error', (error) => {
      console.error('Error executing Nginx setup script:', error);
    });
  } catch (error) {
    console.error('Error setting up Nginx reverse proxy:', error);
  }
}

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Whitelabel routes are working' });
});

// Check if slug is available
router.post('/check-slug-available', async (req, res) => {
  try {
    const { slug } = req.body;

    const validationError = validateSlug(slug);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const lowerSlug = slug.toLowerCase();

    try {
      const available = await ensureSlugAvailable(lowerSlug);
      if (!available) {
        return res.status(200).json({
          success: false,
          message: `${slug} is already taken`
        });
      }
    } catch (error) {
      console.error('Error checking slug:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error checking slug availability'
      });
    }

    return res.status(200).json({
      success: true,
      message: `${slug} is available`
    });
  } catch (error) {
    console.error('Error in check-slug-available:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking slug availability'
    });
  }
});

// Activate whitelabel for eligible plans
router.post('/activate', authenticateToken, async (req, res) => {
  try {
    const { slug, website_name, logo, stripe_publishable_key, stripe_secret_key } = req.body;
    const authUser = req.user;

    const validationError = validateSlug(slug);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    if (!website_name || website_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Brand name is required'
      });
    }

    let userData = await User.findOne({ id: authUser.id }).select('id slug_name tenant role plan name');

    if (!userData) {
      console.error('Error fetching user data: User not found');
      // If profile doesn't exist yet, we can try to create it, but usually authenticateToken ensures user exists or we should handle it
      // Here we rely on user existing
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    if (userData.slug_name) {
      return res.status(400).json({
        success: false,
        message: 'Whitelabel has already been activated for this account.'
      });
    }

    const planAllowsWhitelabel = await isPlanWhitelabelEnabled(userData.plan, userData.tenant);
    if (!planAllowsWhitelabel) {
      return res.status(403).json({
        success: false,
        message: 'Your current plan does not include Whitelabel access. Please upgrade to a plan with Whitelabel enabled.'
      });
    }

    const lowerSlug = slug.toLowerCase();
    try {
      const available = await ensureSlugAvailable(lowerSlug);
      if (!available) {
        return res.status(400).json({
          success: false,
          message: `${slug} is already taken`
        });
      }
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error checking slug availability'
      });
    }

    const updatePayload = {
      slug_name: lowerSlug,
      tenant: lowerSlug,
      role: 'admin',
      website_name,
      logo: logo || null,
      stripe_publishable_key: stripe_publishable_key || null,
      stripe_secret_key: stripe_secret_key || null,
      stripe_enabled: !!(stripe_publishable_key && stripe_secret_key)
    };

    const updatedUser = await User.findOneAndUpdate(
      { id: authUser.id },
      updatePayload,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to activate whitelabel. Please try again.'
      });
    }

    // Kick off reverse proxy setup asynchronously (best-effort)
    setupReverseProxyForSlug(lowerSlug);

    const mainDomain = process.env.MAIN_DOMAIN || process.env.VITE_MAIN_DOMAIN || req.headers.host || 'frontend.ultratalkai.com';
    const redirectUrl = `https://${lowerSlug}.${mainDomain.replace(/^https?:\/\//, '')}`;

    return res.status(200).json({
      success: true,
      message: 'Whitelabel activated successfully',
      slug: lowerSlug,
      redirectUrl
    });
  } catch (error) {
    console.error('Error activating whitelabel:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while activating whitelabel'
    });
  }
});


// Get website settings for current tenant
router.get('/website-settings', async (req, res) => {
  try {
    // Allow explicit slug from query param (for public fetching) or fall back to middleware detection
    const tenant = req.query.slug || req.tenant || 'main';

    // For whitelabel tenants, find by slug_name
    // For main tenant, check if authenticated user wants their own settings
    let query = {};

    if (tenant !== 'main') {
      // Whitelabel tenant: find by slug_name
      query = { slug_name: tenant };
    } else {
      // Main tenant: check if authenticated user wants their settings
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        // We can't use authenticateToken middleware here because this route might be public
        // So we manually verify if token is present, but reusing middleware logic is cleaner.
        // However, since this is a conditional auth, we call jwt verify manually or use a helper if we extracted one.
        // Importing jwt for manual verification in this specific edge case
        const { default: jwt } = await import('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.id) {
            const userSettings = await User.findOne({ id: decoded.id })
              .select('slug_name custom_domain website_name logo contact_email meta_description live_demo_agent_id live_demo_phone_number policy_text stripe_publishable_key stripe_enabled');

            if (userSettings) {
              return res.status(200).json({
                success: true,
                message: 'Website name and logo fetched',
                settings: {
                  slug_name: userSettings.slug_name,
                  custom_domain: userSettings.custom_domain,
                  website_name: userSettings.website_name,
                  logo: userSettings.logo,
                  contact_email: userSettings.contact_email,
                  meta_description: userSettings.meta_description,
                  live_demo_agent_id: userSettings.live_demo_agent_id,
                  live_demo_phone_number: userSettings.live_demo_phone_number,
                  policy_text: userSettings.policy_text,
                  stripe_publishable_key: userSettings.stripe_publishable_key,
                  stripe_enabled: userSettings.stripe_enabled,
                }
              });
            }
          }
        } catch (e) {
          // ignore auth error, treat as public
        }
      }

      // For main tenant without auth or if no user found, return defaults
      return res.status(200).json({
        success: true,
        message: 'Website name and logo fetched',
        settings: {
          slug_name: null,
          custom_domain: null,
          website_name: null,
          logo: null,
          contact_email: null,
          meta_description: null,
          live_demo_agent_id: null,
          live_demo_phone_number: null,
          policy_text: null,
        }
      });
    }

    const settings = await User.findOne(query)
      .select('slug_name custom_domain website_name logo contact_email meta_description live_demo_agent_id live_demo_phone_number policy_text stripe_publishable_key stripe_enabled');

    if (!settings) {
      // Return default settings if tenant not found
      return res.status(200).json({
        success: true,
        message: 'Website name and logo fetched',
        settings: {
          slug_name: null,
          custom_domain: null,
          website_name: null,
          logo: null,
          contact_email: null,
          meta_description: null,
          live_demo_agent_id: null,
          live_demo_phone_number: null,
          policy_text: null,
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Website name and logo fetched',
      settings: {
        slug_name: settings.slug_name,
        custom_domain: settings.custom_domain,
        website_name: settings.website_name,
        logo: settings.logo,
        contact_email: settings.contact_email,
        meta_description: settings.meta_description,
        live_demo_agent_id: settings.live_demo_agent_id,
        live_demo_phone_number: settings.live_demo_phone_number,
        policy_text: settings.policy_text,
        stripe_publishable_key: settings.stripe_publishable_key,
        stripe_enabled: settings.stripe_enabled,
      }
    });
  } catch (error) {
    console.error('Error in website-settings:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching website settings'
    });
  }
});

// Update website settings (requires authentication and tenant ownership)
router.post('/website-settings', authenticateToken, async (req, res) => {
  try {
    console.log('POST /website-settings called, tenant:', req.tenant);
    const tenant = req.tenant || 'main';
    const {
      website_name,
      logo,
      custom_domain,
      contact_email,
      meta_description,
      live_demo_agent_id,
      live_demo_phone_number,
      policy_text,
      stripe_publishable_key,
      stripe_secret_key
    } = req.body;

    // Auth user is attached by middleware
    const authUser = req.user;

    // Get authenticated user data to verify permissions
    let userData = await User.findOne({ id: authUser.id }).select('id slug_name tenant role plan');

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify user has permission to update this tenant's settings
    // User must be the tenant owner (slug_name matches tenant) or be an admin/super-admin
    // For main tenant, only allow if user doesn't have a slug_name (regular user)
    const isTenantOwner = userData.slug_name === tenant;
    const isAdmin = userData.role === 'admin' || userData.role === 'super-admin';

    // For main tenant: only allow if user is admin OR user doesn't have slug_name (regular main tenant user)
    // For whitelabel tenant: only allow if user owns the tenant (slug_name matches) OR is admin
    if (tenant === 'main') {
      // Main tenant: allow admins or users without slug_name
      if (!isAdmin && userData.slug_name) {
        return res.status(403).json({
          success: false,
          message: 'You cannot update main tenant settings. You own a whitelabel tenant.'
        });
      }
    } else {
      // Whitelabel tenant: only allow tenant owner or admin
      if (!isTenantOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: `You do not have permission to update settings for tenant "${tenant}". You can only update settings for your own tenant (${userData.slug_name || 'main'}).`
        });
      }
    }

    const planAllowsWhitelabel = await isPlanWhitelabelEnabled(userData.plan, userData.tenant);
    if (!planAllowsWhitelabel) {
      return res.status(403).json({
        success: false,
        message: 'Your current plan does not include Whitelabel access. Please upgrade to a plan with Whitelabel enabled.'
      });
    }

    // Prepare update data (matching urban-new approach)
    const updateData = {};
    if (website_name !== undefined) updateData.website_name = website_name;
    if (logo !== undefined) {
      updateData.logo = logo;
    }
    if (custom_domain !== undefined) {
      // Validate custom domain format if provided
      if (custom_domain && custom_domain.trim() !== '') {
        const trimmedDomain = custom_domain.trim().toLowerCase();
        // Basic domain validation: allows subdomains and TLDs
        const domainRegex = /^([a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
        if (!domainRegex.test(trimmedDomain)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid custom domain format. Please enter a valid domain (e.g., example.com or subdomain.example.com)'
          });
        }
        updateData.custom_domain = trimmedDomain;
      } else {
        updateData.custom_domain = null;
      }
    }
    if (contact_email !== undefined) updateData.contact_email = contact_email;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (live_demo_agent_id !== undefined) updateData.live_demo_agent_id = live_demo_agent_id;
    if (live_demo_phone_number !== undefined) updateData.live_demo_phone_number = live_demo_phone_number;
    if (policy_text !== undefined) updateData.policy_text = policy_text;

    // Handle Stripe credentials
    if (stripe_publishable_key !== undefined) updateData.stripe_publishable_key = stripe_publishable_key;
    if (stripe_secret_key !== undefined) updateData.stripe_secret_key = stripe_secret_key;

    // Set stripe_enabled flag if both keys are provided
    if (stripe_publishable_key && stripe_secret_key) {
      updateData.stripe_enabled = true;
    } else if (stripe_publishable_key === null || stripe_secret_key === null) {
      updateData.stripe_enabled = false;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update'
      });
    }

    // Update tenant owner's settings
    // For whitelabel tenants, update by slug_name (tenant)
    // For main tenant, always update the authenticated user's own record by id
    let filter = {};

    if (tenant === 'main') {
      // For main tenant, always update the authenticated user's own record by id
      filter = { id: authUser.id };
    } else {
      // For whitelabel tenants, update by slug_name (tenant owner)
      filter = { slug_name: tenant };
    }

    const updatedSettings = await User.findOneAndUpdate(filter, updateData, { new: true })
      .select('slug_name custom_domain website_name logo contact_email meta_description live_demo_agent_id live_demo_phone_number policy_text stripe_publishable_key stripe_enabled');

    if (!updatedSettings) {
      return res.status(404).json({
        success: false,
        message: 'No matching record found to update. Please ensure your profile exists.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Website name and logo updated',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error in update website-settings:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating website settings'
    });
  }
});

export default router;
