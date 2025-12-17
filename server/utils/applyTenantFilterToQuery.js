/**
 * Utility to apply tenant filter to query (Mongoose compatible)
 */

/**
 * Apply tenant filter to a Mongoose query builder
 * @param {object} query - Mongoose query builder (e.g. Campaign.find())
 * @param {string} tenant - Tenant identifier (from req.tenant)
 * @returns {object} - Mongoose query builder with tenant filter applied
 */
export function applyTenantFilter(query, tenant) {
  if (!query) return query;

  const effectiveTenant = tenant || 'main';

  if (effectiveTenant === 'main') {
    // For main tenant, include both 'main' and NULL/undefined (legacy data)
    // Mongoose: .or([{ tenant: 'main' }, { tenant: null }, { tenant: { $exists: false } }])
    return query.or([
      { tenant: 'main' },
      { tenant: null },
      { tenant: { $exists: false } }
    ]);
  }

  // For whitelabel tenants, exact match
  return query.where('tenant').equals(effectiveTenant);
}

/**
 * Apply tenant filter from request object to Mongoose query
 * @param {object} req - Express request object
 * @param {object} query - Mongoose query builder
 * @returns {object} - Mongoose query builder with tenant filter applied
 */
export function applyTenantFilterFromRequest(req, query) {
  const tenant = req.tenant || 'main';
  return applyTenantFilter(query, tenant);
}

export default {
  applyTenantFilter,
  applyTenantFilterFromRequest
};
