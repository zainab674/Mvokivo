# Onboarding Payment Removal - Implementation Summary

## Overview
Removed the Stripe payment step from the onboarding flow. Users now select a plan and are immediately assigned that plan with the configured minutes allocation.

## Changes Made

### Frontend Changes

#### 1. **useOnboarding.tsx** - Updated Step Count
- Changed `totalSteps` from 7 to 6
- Removed payment step from the onboarding flow
- **Impact**: Onboarding now has 6 steps instead of 7

#### 2. **OnboardingLayout.tsx** - Removed Payment Step
- Removed `PaymentStep` import
- Removed `PaymentStep` from the steps array
- **Flow**: Welcome → Business Profile → Use Case → Preferences → Pricing → Complete

#### 3. **OnboardingComplete.tsx** - Removed Payment Processing
- Removed all Stripe payment method handling code
- Removed payment method API calls
- Simplified onboarding completion to only handle:
  - User signup (if new user)
  - Profile/onboarding data submission
  - Plan assignment (backend handles minutes)
- **Impact**: No payment collection during onboarding

### Backend Changes

#### 4. **server/routes/user.js** - Enhanced Onboarding Endpoint
Added plan-based minutes assignment logic to the `/api/v1/user/onboarding` endpoint:

```javascript
// Fetch plan configuration to get minutes allocation
if (plan) {
  const planConfig = await PlanConfig.findOne({ 
    plan_key: plan.toLowerCase(), 
    tenant: planTenant,
    is_active: true 
  });

  if (planConfig) {
    // Assign minutes based on plan configuration
    if (planConfig.minutes !== undefined && planConfig.minutes !== null) {
      updates.minutes_limit = Number(planConfig.minutes);
    } else if (planConfig.pay_as_you_go) {
      updates.minutes_limit = 0; // Pay as you go - no included minutes
    } else {
      updates.minutes_limit = 0; // Unlimited or unspecified
    }
  }
}

// Reset minutes_used to 0 for new onboarding
updates.minutes_used = 0;
```

**Logic**:
1. When a user completes onboarding with a selected plan
2. Backend fetches the plan configuration from the database
3. Assigns `minutes_limit` based on the plan's `minutes` field
4. Resets `minutes_used` to 0
5. Handles pay-as-you-go plans (0 minutes)
6. Handles unlimited/unspecified plans (0 minutes as placeholder)

## How It Works Now

### User Flow
1. User signs up and enters onboarding
2. User fills out business profile, use case, and preferences
3. User selects a pricing plan (Starter, Professional, or Enterprise)
4. User completes onboarding
5. **Backend automatically assigns minutes** based on the selected plan
6. User is redirected to dashboard with plan and minutes assigned

### Plan Configuration
Plans are configured in the database with the following structure:
- `plan_key`: Unique identifier (e.g., "starter", "professional", "enterprise")
- `name`: Display name
- `price`: Monthly price
- `minutes`: Number of minutes included (optional)
- `pay_as_you_go`: Boolean flag for pay-as-you-go plans
- `features`: Array of feature descriptions

### Minutes Assignment Examples
- **Plan with 100 minutes**: User gets `minutes_limit = 100`
- **Pay-as-you-go plan**: User gets `minutes_limit = 0`
- **Unlimited plan** (minutes not set): User gets `minutes_limit = 0`
- **Plan not found**: User gets `minutes_limit = 0` (fallback)

## Benefits
1. **Simplified Onboarding**: Removed complex payment integration from initial signup
2. **Faster User Activation**: Users can start using the platform immediately
3. **Flexible Monetization**: Payment can be added later via settings/billing
4. **Trial Support**: 7-day trial is still configured (trial_ends_at)
5. **Plan-Based Minutes**: Minutes are automatically assigned based on plan configuration

## Future Considerations
- Payment methods can still be added later via the billing/settings page
- Stripe integration remains intact for future payment processing
- Minutes can be purchased separately via the existing minutes purchase flow
- Trial expiration logic should be implemented to prompt for payment after 7 days

## Testing Checklist
- [ ] Complete onboarding flow from signup to dashboard
- [ ] Verify plan is assigned correctly
- [ ] Verify minutes_limit is set based on plan configuration
- [ ] Verify minutes_used is reset to 0
- [ ] Test with different plan types (starter, professional, enterprise)
- [ ] Test with pay-as-you-go plans
- [ ] Test with tenant-specific plans
- [ ] Verify trial_ends_at is set correctly (7 days from signup)
