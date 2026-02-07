import express from 'express';
// import crypto from 'crypto'; // Unused
import { SipClient } from 'livekit-server-sdk';
import { getSipConfigForLiveKit } from './twilio-trunk-service.js';
import { PhoneNumber } from './models/index.js';

export const livekitPerAssistantTrunkRouter = express.Router();

const lk = new SipClient(
  process.env.LIVEKIT_HOST,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET,
);

/* ----------------------------- helpers ---------------------------------- */

const toE164 = (n) => {
  if (!n) return n;
  const cleaned = String(n).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return `+${cleaned.slice(2)}`;
  return `+${cleaned}`;
};

const slug = (s, max = 48) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, max);

function readId(obj, ...keys) {
  for (const k of keys) if (obj && obj[k] != null) return obj[k];
  return undefined;
}

function preview(s, n = 120) {
  const str = String(s || '');
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

const rid = () => Math.random().toString(36).slice(2, 10);

function log(ctx, msg, data = {}) {
  console.log(`[LK-AST] ${msg} ::`, JSON.stringify({ rid: ctx.rid, route: ctx.route, ...data }));
}
function logErr(ctx, msg, err) {
  console.error(
    `[LK-AST][ERR] ${msg} ::`,
    JSON.stringify({ rid: ctx.rid, route: ctx.route, err: err?.message || String(err) })
  );
}

/* ----------------------- robust rule deletion --------------------------- */

async function deleteDispatchRule(ctx, id) {
  try {
    // According to latest SDK d.ts, it's positional
    await lk.deleteSipDispatchRule(id);
    log(ctx, 'deleteSipDispatchRule OK', { id });
    return;
  } catch (e1) {
    logErr(ctx, 'delete positional failed, trying object', e1);
  }
  try {
    await lk.deleteSipDispatchRule({ sipDispatchRuleId: id });
    log(ctx, 'deleteSipDispatchRule OK (object)', { id });
    return;
  } catch (e2) {
    logErr(ctx, 'delete object failed, trying snake_case', e2);
  }
  try {
    await lk.deleteSipDispatchRule({ sip_dispatch_rule_id: id });
    log(ctx, 'deleteSipDispatchRule OK (snake_case)', { id });
  } catch (e3) {
    logErr(ctx, 'deleteSipDispatchRule failed after 3 attempts', e3);
    throw e3;
  }
}

/* ---------------- per-assistant trunk + catch-all rule ------------------ */
/**
 * Create a brand-new inbound trunk for an assistant and a catch-all rule for that trunk.
 * This avoids per-DID rules; every number placed on this trunk routes to the assistant.
 * Also creates a corresponding outbound trunk for making calls.
 */
async function createAssistantTrunk(ctx, { assistantId, assistantName, phoneNumber, userId }) {
  const e164 = toE164(phoneNumber);
  const agentName = process.env.LK_AGENT_NAME || 'ai';

  // Unique, safe trunk name each time (you asked to create a new trunk every time)
  const trunkName = slug(`ast-${assistantName}-${Date.now()}`);

  log(ctx, 'creating assistant trunk', { assistantId, assistantName, phoneNumber: e164, trunkName });

  // ✅ IMPORTANT: use positional signature (name, numbers, opts)
  const trunk = await lk.createSipInboundTrunk(
    trunkName,
    [e164],                                 // attach the DID(s) directly to the trunk
    {
      metadata: JSON.stringify({
        kind: 'per-assistant-trunk',
        assistantId,
        assistantName,
        phoneNumber: e164,
        createdAt: new Date().toISOString(),
      }),
      // You can add auth/allow lists here if needed later:
      // allowedNumbers: [e164],
      // authUsername: '...', authPassword: '...',
    }
  );

  const trunkId = readId(trunk, 'sip_trunk_id', 'sipTrunkId', 'id');
  log(ctx, 'created assistant trunk', { trunkId, trunkName, numbers: [e164] });

  // Get dynamic Twilio SIP configuration from database
  console.log(`🔍 Getting SIP config for user ${userId} to create outbound trunk`);
  const sipConfig = await getSipConfigForLiveKit(userId);
  console.log(`📊 Retrieved SIP config:`, {
    domainName: sipConfig.domainName,
    sipUsername: sipConfig.sipUsername,
    hasPassword: !!sipConfig.sipPassword,
    trunkSid: sipConfig.trunkSid,
    credentialListSid: sipConfig.credentialListSid
  });

  // Create corresponding outbound trunk for making calls
  // Use the domain name from Twilio trunk as the LiveKit trunk name
  const outboundTrunkName = sipConfig.domainName.replace('.pstn.twilio.com', ''); // Remove .pstn.twilio.com suffix
  log(ctx, 'creating outbound trunk', { assistantId, assistantName, phoneNumber: e164, outboundTrunkName });
  log(ctx, 'retrieved SIP config', {
    domainName: sipConfig.domainName,
    sipUsername: sipConfig.sipUsername,
    trunkSid: sipConfig.trunkSid
  });

  const destinationCountry = process.env.SIP_DESTINATION_COUNTRY || 'US';

  // Debug Twilio credentials
  console.log('🔍 Dynamic Twilio SIP Configuration:', {
    domainName: sipConfig.domainName,
    destinationCountry,
    sipUsername: sipConfig.sipUsername ? `${sipConfig.sipUsername.substring(0, 8)}...` : 'MISSING',
    sipPassword: sipConfig.sipPassword ? `${sipConfig.sipPassword.substring(0, 8)}...` : 'MISSING'
  });

  // Create outbound trunk using dynamic configuration
  const trunkOptions = {
    auth_username: sipConfig.sipUsername,
    auth_password: sipConfig.sipPassword,
    destination_country: destinationCountry,
    metadata: JSON.stringify({
      kind: 'per-assistant-outbound-trunk',
      assistantId,
      assistantName,
      phoneNumber: e164,
      domainName: sipConfig.domainName,
      trunkSid: sipConfig.trunkSid,
      createdAt: new Date().toISOString(),
    }),
  };

  console.log(`🚀 Creating LiveKit outbound trunk with:`, {
    outboundTrunkName,
    domainName: sipConfig.domainName,
    phoneNumber: e164,
    trunkOptions
  });

  const outboundTrunk = await lk.createSipOutboundTrunk(
    outboundTrunkName,
    sipConfig.domainName,  // Dynamic domain name
    [e164], // Use the same phone number for outbound calls
    trunkOptions
  );

  const outboundTrunkId = readId(outboundTrunk, 'sip_trunk_id', 'sipTrunkId', 'id');
  console.log(`✅ Created LiveKit outbound trunk:`, {
    outboundTrunkId,
    outboundTrunkName,
    phoneNumber: e164,
    fullResponse: outboundTrunk
  });
  log(ctx, 'created outbound trunk', { outboundTrunkId, outboundTrunkName, numbers: [e164] });

  // Minimal agent metadata; worker fetches full prompt by assistantId if needed
  const agentMetadataJson = JSON.stringify({
    agentName,
    assistantId,
    forceFirstMessage: true,
  });

  // One catch-all rule per trunk: inboundNumbers empty ⇒ applies to all numbers on that trunk
  const rule = await lk.createSipDispatchRule(
    { type: 'individual', roomPrefix: 'assistant-' },
    {
      name: `assistant:${assistantId}:${Date.now()}`,
      trunkIds: [trunkId],
      inbound_numbers: [],          // ensure compatibility (snake_case)
      inboundNumbers: [],           // and camelCase
      roomConfig: {
        agents: [{ agentName, metadata: agentMetadataJson }],
        metadata: agentMetadataJson,
      },
      metadata: JSON.stringify({
        assistantId,
        assistantName,
        trunkId,
        phoneNumber: e164,
      }),
    }
  );

  const ruleId = readId(rule, 'sip_dispatch_rule_id', 'sipDispatchRuleId', 'id');
  log(ctx, 'created catch-all rule for trunk', { ruleId, trunkId });

  return {
    trunkId,
    trunkName,
    outboundTrunkId,
    outboundTrunkName,
    ruleId,
    phoneNumber: e164,
    assistantId,
    assistantName,
  };
}

/* -------------------- find / delete helpers ----------------------------- */

async function findAssistantTrunk(ctx, { assistantId, phoneNumber }) {
  const e164 = toE164(phoneNumber);
  log(ctx, 'searching assistant trunk', { assistantId, phoneNumber: e164 });

  const trunks = await lk.listSipInboundTrunk();
  const hit = trunks.find((t) => Array.isArray(t?.numbers) && t.numbers.includes(e164));
  if (!hit) {
    log(ctx, 'no trunk found for DID');
    return null;
  }
  const trunkId = readId(hit, 'sip_trunk_id', 'sipTrunkId', 'id');
  log(ctx, 'found trunk for DID', { trunkId, trunkName: hit.name });
  return { trunkId, trunkName: hit.name, phoneNumber: e164, assistantId, existing: true };
}

async function deleteAssistantTrunk(ctx, { trunkId, outboundTrunkId }) {
  log(ctx, 'deleting trunk + rules', { trunkId, outboundTrunkId });

  // delete rules referencing this trunk
  const rules = await lk.listSipDispatchRule();
  const trunkRules = rules.filter((r) => {
    const tids = r?.trunk_ids ?? r?.trunkIds ?? [];
    return tids.includes(trunkId);
  });

  for (const r of trunkRules) {
    const rid = readId(r, 'sip_dispatch_rule_id', 'sipDispatchRuleId', 'id');
    if (rid) await deleteDispatchRule(ctx, rid);
  }

  // Delete inbound trunk
  let inboundDeleted = false;
  try {
    // Correct method: deleteSipTrunk
    await lk.deleteSipTrunk(trunkId);
    log(ctx, 'deleteSipTrunk (inbound) OK', { trunkId });
    inboundDeleted = true;
  } catch (e1) {
    logErr(ctx, 'deleteSipTrunk (inbound) failed', e1);
  }

  // Delete outbound trunk if provided
  let outboundDeleted = true; // Default to true if no outbound trunk
  if (outboundTrunkId) {
    outboundDeleted = false;
    try {
      // Correct method: deleteSipTrunk
      await lk.deleteSipTrunk(outboundTrunkId);
      log(ctx, 'deleteSipTrunk (outbound) OK', { outboundTrunkId });
      outboundDeleted = true;
    } catch (e1) {
      logErr(ctx, 'deleteSipTrunk (outbound) failed', e1);
    }
  }

  return inboundDeleted && outboundDeleted;
}

/* -------------------------------- routes -------------------------------- */

/**
 * POST /api/v1/livekit/assistant-trunk
 * Body: { assistantId, assistantName, phoneNumber }
 * Always creates a NEW trunk + catch-all rule.
 */
livekitPerAssistantTrunkRouter.post('/assistant-trunk', async (req, res) => {
  const ctx = { route: 'POST /assistant-trunk', rid: rid() };
  log(ctx, 'incoming', { body: preview(JSON.stringify(req.body || {})) });

  try {
    const { assistantId, assistantName, phoneNumber } = req.body || {};
    const userId = req.body.userId || req.headers['x-user-id'];

    if (!assistantId || !assistantName || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'assistantId, assistantName, phoneNumber are required' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const trunk = await createAssistantTrunk(ctx, { assistantId, assistantName, phoneNumber, userId });
    res.json({ success: true, message: `Created trunk for ${assistantName}`, trunk, created: true });
  } catch (err) {
    logErr(ctx, 'failed to create assistant trunk', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to create assistant trunk' });
  }
});

/**
 * GET /api/v1/livekit/assistant-trunks
 * Lists trunks that look like assistant trunks (name starts with 'ast-')
 */
livekitPerAssistantTrunkRouter.get('/assistant-trunks', async (req, res) => {
  const ctx = { route: 'GET /assistant-trunks', rid: rid() };
  try {
    const trunks = await lk.listSipInboundTrunk();
    const assistantTrunks = trunks.filter((t) => t?.name && String(t.name).startsWith('ast-'));
    log(ctx, 'listed assistant trunks', { count: assistantTrunks.length });
    res.json({ success: true, trunks: assistantTrunks, count: assistantTrunks.length });
  } catch (err) {
    logErr(ctx, 'failed to list assistant trunks', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to list assistant trunks' });
  }
});

/**
 * DELETE /api/v1/livekit/assistant-trunk/:trunkId
 * Deletes trunk and any rules that reference it.
 */
livekitPerAssistantTrunkRouter.delete('/assistant-trunk/:trunkId', async (req, res) => {
  const ctx = { route: 'DELETE /assistant-trunk/:trunkId', rid: rid() };
  const { trunkId } = req.params;
  const { outboundTrunkId } = req.query;

  try {
    const ok = await deleteAssistantTrunk(ctx, { trunkId, outboundTrunkId });
    if (ok) res.json({ success: true, message: 'Assistant trunk deleted' });
    else res.status(500).json({ success: false, message: 'Failed to delete assistant trunk' });
  } catch (err) {
    logErr(ctx, 'delete assistant trunk error', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to delete assistant trunk' });
  }
});

/**
 * GET /api/v1/livekit/assistant-trunk/:assistantId/:phoneNumber
 * Finds the trunk that currently holds this DID (if any).
 */
livekitPerAssistantTrunkRouter.get('/assistant-trunk/:assistantId/:phoneNumber', async (req, res) => {
  const ctx = { route: 'GET /assistant-trunk/:assistantId/:phoneNumber', rid: rid() };
  const { assistantId, phoneNumber } = req.params;

  try {
    const trunk = await findAssistantTrunk(ctx, { assistantId, phoneNumber });
    if (trunk) res.json({ success: true, trunk, exists: true });
    else res.json({ success: true, trunk: null, exists: false, message: 'No trunk found for this DID' });
  } catch (err) {
    logErr(ctx, 'get assistant trunk info failed', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to get assistant trunk info' });
  }
});

/**
 * POST /api/v1/livekit/unassign-number
 * Body: { assistantId, phoneNumber, outboundTrunkId }
 * Deletes both inbound and outbound trunks and associated rules.
 */
livekitPerAssistantTrunkRouter.post('/unassign-number', async (req, res) => {
  const ctx = { route: 'POST /unassign-number', rid: rid() };
  try {
    const { assistantId, phoneNumber, outboundTrunkId: bodyOutboundTrunkId } = req.body || {};
    if (!assistantId || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'assistantId and phoneNumber are required' });
    }

    let outboundTrunkId = bodyOutboundTrunkId;

    // If outboundTrunkId is missing, try to find it in the database
    if (!outboundTrunkId) {
      const mapping = await PhoneNumber.findOne({ number: toE164(phoneNumber) });
      if (mapping?.outbound_trunk_id) {
        outboundTrunkId = mapping.outbound_trunk_id;
        log(ctx, 'found outboundTrunkId in database', { outboundTrunkId });
      }
    }

    // 1. Find inbound trunk
    const trunkInfo = await findAssistantTrunk(ctx, { assistantId, phoneNumber });
    if (!trunkInfo) {
      log(ctx, 'no inbound trunk found to delete', { phoneNumber });
    }

    // 2. Delete trunks
    const ok = await deleteAssistantTrunk(ctx, {
      trunkId: trunkInfo?.trunkId,
      outboundTrunkId
    });

    if (ok) {
      res.json({ success: true, message: 'LiveKit trunks and rules deleted' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete some LiveKit resources' });
    }
  } catch (err) {
    logErr(ctx, 'unassign-number error', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to unassign number in LiveKit' });
  }
});

export default livekitPerAssistantTrunkRouter;
