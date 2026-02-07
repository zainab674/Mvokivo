import { User, MinutesPurchase } from '../models/index.js';

/**
 * Only the main tenant admin has "unlimited" minutes (when minutes_limit is 0 or null).
 * Whitelabel admins have minutes according to their plan; 0 means no minutes for them too.
 * @param {{ role?: string | null; minutes_limit?: number | null; tenant?: string | null; slug_name?: string | null }} user - User with role, minutes_limit, tenant, slug_name
 * @returns {boolean}
 */
export function isUnlimitedMinutes(user) {
  if (!user) return false;
  const isMainAdmin = user.role === 'admin' && (user.tenant === 'main' || !user.tenant) && !user.slug_name;
  const limit = user.minutes_limit;
  const zeroOrNull = limit === 0 || limit == null;
  return !!isMainAdmin && zeroOrNull;
}

/**
 * Calculate the current balance of minutes by summing all non-expired remaining_minutes.
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export async function getMinutesBalance(userId) {
  const activeCredits = await MinutesPurchase.find({
    user_id: userId,
    status: 'completed',
    remaining_minutes: { $gt: 0 },
    expires_at: { $gt: new Date() }
  });

  return activeCredits.reduce((sum, credit) => sum + (credit.remaining_minutes || 0), 0);
}

/**
 * Add a new set of minutes with a 3-month expiration.
 * @param {string} userId 
 * @param {number} amount 
 * @param {Object} options 
 */
export async function addMinuteCredit(userId, amount, options = {}) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 3);

  const credit = new MinutesPurchase({
    user_id: userId,
    minutes_purchased: amount,
    remaining_minutes: amount,
    amount_paid: options.amount_paid || 0,
    currency: options.currency || 'USD',
    payment_method: options.payment_method || 'manual',
    status: 'completed',
    notes: options.notes,
    expires_at: expiresAt
  });

  await credit.save();
  return credit;
}

/**
 * Deduct minutes from the oldest valid credits first (FIFO).
 * @param {string} userId 
 * @param {number} amount 
 */
export async function consumeMinutes(userId, amount) {
  let remainingToDeduct = amount;

  // Find active, non-expired credits, sorted by oldest first
  const activeCredits = await MinutesPurchase.find({
    user_id: userId,
    status: 'completed',
    remaining_minutes: { $gt: 0 },
    expires_at: { $gt: new Date() }
  }).sort({ created_at: 1 });

  for (const credit of activeCredits) {
    if (remainingToDeduct <= 0) break;

    const deductFromThis = Math.min(credit.remaining_minutes, remainingToDeduct);
    credit.remaining_minutes -= deductFromThis;
    remainingToDeduct -= deductFromThis;

    await credit.save();
  }

  return remainingToDeduct <= 0; // True if we successfully deducted everything
}

/**
 * Get the date and amount of the next batch of minutes to expire.
 * @param {string} userId 
 */
export async function getNextExpiration(userId) {
  const nextCredit = await MinutesPurchase.findOne({
    user_id: userId,
    status: 'completed',
    remaining_minutes: { $gt: 0 },
    expires_at: { $gt: new Date() }
  }).sort({ expires_at: 1 });

  return nextCredit ? {
    expiry_date: nextCredit.expires_at,
    minutes_expiring: nextCredit.remaining_minutes
  } : null;
}
