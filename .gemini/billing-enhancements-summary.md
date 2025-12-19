# Billing Page Enhancements - Implementation Summary

## Overview
Enhanced the billing page to show "Purchase Minutes" only for pay-as-you-go users and implemented a plan change feature with a warning dialog about minutes not rolling over.

## Changes Made

### Backend Changes

#### 1. **server/routes/billing.js** - Enhanced Usage Endpoint
- Updated `/api/v1/billing/usage` endpoint to return complete plan information
- Added `payAsYouGo` flag to plan response
- Added `minutesLimit` to usage response
- Improved plan configuration fetching with tenant support
- Added next billing date calculation

**New Response Structure**:
```javascript
{
  success: true,
  usage: {
    minutesBalance: number,
    minutesUsed: number,
    minutesLimit: number,  // NEW
    apiCalls: { used, limit },
    textMessages: { used, limit },
    teamMembers: { used, limit },
    phoneMinutes: { used, limit }
  },
  plan: {
    key: string,
    name: string,
    price: number,
    period: string,
    status: string,
    nextBilling: string | null,
    payAsYouGo: boolean,  // NEW
    features: string[]     // NEW
  }
}
```

#### 2. **server/routes/user.js** - Plan Change Endpoint
Added new endpoint: `POST /api/v1/user/change-plan`

**Request Body**:
```javascript
{
  newPlan: string  // Plan key (e.g., "starter", "professional", "enterprise")
}
```

**Response**:
```javascript
{
  success: true,
  user: User,
  message: "Plan changed successfully",
  minutesAssigned: number
}
```

**Logic**:
1. Validates the new plan exists and is active
2. Fetches plan configuration from database
3. Assigns minutes based on plan configuration:
   - If plan has `minutes` defined: assigns that amount
   - If plan is `pay_as_you_go`: assigns 0 minutes
   - Otherwise: assigns 0 minutes (unlimited/unspecified)
4. **Resets `minutes_used` to 0** (minutes don't roll over)
5. Updates user's plan and minutes

### Frontend Changes

#### 3. **src/components/settings/billing/PlanChangeDialog.tsx** - New Component
Created a comprehensive plan change dialog with two steps:

**Step 1: Warning**
- Shows current plan and minutes balance
- Warns user that minutes won't roll over
- Displays clear message about losing unused minutes
- Requires user acknowledgment to proceed

**Step 2: Plan Selection**
- Fetches available plans (excluding current plan and free plan)
- Displays all plans with:
  - Plan name and price
  - Minutes allocation or "Pay As You Go" badge
  - Top 3 features
  - Visual selection indicator
- Allows user to select new plan
- Confirms plan change with backend

**Features**:
- Loading states for plan fetching and submission
- Error handling with toast notifications
- Success feedback with minutes assigned
- Callback to refresh billing data after change

#### 4. **src/pages/Billing.tsx** - Updated Billing Page

**State Management**:
- Added `payAsYouGo` flag to `currentPlan` state
- Added `isPlanChangeDialogOpen` state
- Extracted `fetchBillingData` as reusable function

**UI Changes**:

1. **Current Plan Card**:
   - "Change Plan" button now opens the plan change dialog
   - Triggers warning and plan selection flow

2. **Minutes Balance Card**:
   - **Conditionally shows "Purchase Minutes" button**:
     - ✅ Shows for `payAsYouGo` plans
     - ❌ Hidden for plans with included minutes
   - Updated helper text:
     - Pay-as-you-go: "Minutes are purchased separately on pay-as-you-go plans"
     - Regular plans: "Minutes are included with your {plan name} plan"

3. **Plan Change Dialog Integration**:
   - Opens when "Change Plan" is clicked
   - Shows warning about minutes not rolling over
   - Allows plan selection
   - Refreshes all billing data after successful change

## User Flow

### Changing Plans
1. User clicks "Change Plan" button
2. **Warning Dialog** appears:
   - Shows current plan and remaining minutes
   - Warns that minutes won't roll over
   - User must click "I Understand, Continue"
3. **Plan Selection Dialog** appears:
   - Shows all available plans (except current and free)
   - User selects desired plan
   - User clicks "Confirm Plan Change"
4. Backend processes change:
   - Validates new plan
   - Resets minutes_used to 0
   - Assigns new minutes based on plan
5. Success toast shows new plan and minutes
6. Billing page refreshes with updated data

### Purchase Minutes (Pay-As-You-Go Only)
1. Only visible if user is on a pay-as-you-go plan
2. User clicks "Purchase Minutes"
3. Existing minutes purchase dialog opens
4. User completes purchase
5. Minutes balance updates

## Benefits

1. **Clear User Communication**: Warning dialog ensures users understand minutes won't roll over
2. **Flexible Plan Management**: Users can easily switch between plans
3. **Automatic Minutes Assignment**: Backend handles minutes allocation based on plan configuration
4. **Pay-As-You-Go Support**: Properly handles plans where users must purchase minutes separately
5. **Data Consistency**: Minutes reset ensures clean state for new plan
6. **Improved UX**: Only shows relevant options based on plan type

## Testing Checklist

- [ ] Verify "Purchase Minutes" only shows for pay-as-you-go users
- [ ] Verify "Purchase Minutes" is hidden for users with included minutes
- [ ] Test plan change warning dialog displays correctly
- [ ] Test plan selection shows all available plans
- [ ] Test plan change resets minutes_used to 0
- [ ] Test plan change assigns correct minutes based on new plan
- [ ] Test pay-as-you-go plan change (should get 0 minutes)
- [ ] Test plan with included minutes (should get specified amount)
- [ ] Test billing data refreshes after plan change
- [ ] Test error handling for invalid plan selection
- [ ] Test with tenant-specific plans
- [ ] Verify toast notifications show correct information

## Database Schema Notes

The implementation relies on the following User model fields:
- `plan`: Current plan key
- `minutes_limit`: Total minutes available
- `minutes_used`: Minutes consumed (reset on plan change)
- `tenant`: User's tenant for plan lookup

And PlanConfig model fields:
- `plan_key`: Unique plan identifier
- `name`: Display name
- `price`: Monthly price
- `minutes`: Included minutes (optional)
- `pay_as_you_go`: Boolean flag
- `features`: Array of feature strings
- `tenant`: Plan's tenant (null for main)
- `is_active`: Whether plan is available

## Future Enhancements

1. **Prorated Billing**: Calculate prorated charges when changing plans mid-cycle
2. **Minutes Rollover Option**: Allow certain plans to roll over unused minutes
3. **Plan Comparison**: Show side-by-side comparison before changing
4. **Downgrade Protection**: Warn if downgrading will limit features
5. **Plan History**: Track plan changes over time
6. **Scheduled Plan Changes**: Allow users to schedule plan changes for next billing cycle
