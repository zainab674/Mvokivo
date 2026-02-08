import { User, EmailLog, Assistant, EmailCampaign, UserEmailCredential } from '../models/index.js';
import emailService from '../services/email-service.js';

class EmailWorker {
    constructor() {
        this.isProcessing = false;
        this.interval = 5000; // Check every 5 seconds
    }

    start() {
        console.log('[EmailWorker] Starting email polling service...');
        // Run immediately
        this.processEmails();
        // Then loop
        setInterval(() => this.processEmails(), this.interval);
    }

    async processEmails() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Find all active email credentials
            const credentials = await UserEmailCredential.find({
                smtpPass: { $exists: true, $ne: '' },
                isActive: true
            });

            console.log(`[EmailWorker] Checking inboxes for ${credentials.length} credentials`);

            // Process all credentials in parallel so one slow inbox doesn't delay others (avoids ~5 min delay)
            const results = await Promise.allSettled(credentials.map(async (integration) => {
                const user = await User.findOne({ id: integration.user_id });
                if (!user) return;

                const newEmails = await emailService.checkEmails({
                    email: integration.email,
                    smtpPass: integration.smtpPass,
                    imapHost: integration.imapHost || 'imap.gmail.com',
                    imapPort: integration.imapPort || 993
                });

                if (newEmails.length > 0) {
                    console.log(`[EmailWorker] Found ${newEmails.length} emails for ${integration.email}`);
                    await this.saveSyncedEmails(user, integration, newEmails);
                }
            }));

            results.forEach((result, i) => {
                if (result.status === 'rejected') {
                    console.error(`[EmailWorker] Error processing integration ${credentials[i]?.email}:`, result.reason?.message || result.reason);
                }
            });

        } catch (error) {
            console.error('[EmailWorker] Global error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async saveSyncedEmails(user, integration, emails) {
        for (const email of emails) {
            try {
                const direction = email.folder === 'sent' ? 'outbound' : 'inbound';

                let threadId = null;
                let assistantId = null;
                let campaignId = null;

                // Build list of reference IDs (In-Reply-To can be string or array; References is array or single)
                const refIds = [];
                if (email.inReplyTo) {
                    refIds.push(...(Array.isArray(email.inReplyTo) ? email.inReplyTo : [email.inReplyTo]));
                }
                if (email.references && (Array.isArray(email.references) ? email.references.length : 1)) {
                    refIds.push(...(Array.isArray(email.references) ? email.references : [email.references]));
                }
                if (refIds.length > 0) {
                    const parentLog = await EmailLog.findOne({ messageId: { $in: refIds } });
                    if (parentLog) {
                        threadId = parentLog.threadId || parentLog._id.toString();
                        assistantId = parentLog.assistantId;
                        campaignId = parentLog.campaignId;
                    }
                }

                if (!threadId && email.subject) {
                    const cleanSubject = email.subject.replace(/^(Re:|Fwd:)\s*/i, '').trim();
                    const relatedLog = await EmailLog.findOne({
                        userId: user.id || user._id,
                        subject: { $regex: new RegExp(cleanSubject, 'i') }
                    }).sort({ created_at: -1 });

                    if (relatedLog) {
                        threadId = relatedLog.threadId || relatedLog._id.toString();
                        if (!assistantId) assistantId = relatedLog.assistantId;
                        if (!campaignId) campaignId = relatedLog.campaignId;
                    }
                }

                if (email.messageId) {
                    const existing = await EmailLog.findOne({ messageId: email.messageId });
                    if (existing) continue;
                }

                const newLog = await EmailLog.create({
                    userId: user.id || user._id,
                    from: email.from,
                    to: email.to,
                    subject: email.subject,
                    body: email.text || email.html || '[No Content]',
                    direction: direction,
                    status: direction === 'inbound' ? 'received' : 'sent',
                    messageId: email.messageId,
                    inReplyTo: email.inReplyTo,
                    hasAttachments: false,
                    threadId: threadId,
                    assistantId: assistantId,
                    campaignId: campaignId,
                    created_at: email.date || new Date()
                });

                if (!newLog.threadId) {
                    newLog.threadId = newLog._id.toString();
                    await newLog.save();
                }

                console.log(`[EmailWorker] Saved ${direction} email: ${newLog._id} (Thread: ${newLog.threadId}, Assistant: ${assistantId || 'none'})`);

                if (campaignId && direction === 'inbound') {
                    const fromRaw = email.from && (typeof email.from === 'object' ? email.from.text : email.from);
                    const replierEmail = (typeof fromRaw === 'string' ? fromRaw : '')
                        .trim()
                        .replace(/^.*<([^>]+)>.*$/, (_, addr) => addr)
                        .toLowerCase();
                    if (replierEmail) {
                        await EmailCampaign.updateOne(
                            { _id: campaignId },
                            [
                                {
                                    $set: {
                                        replierEmails: {
                                            $setUnion: [
                                                { $ifNull: ['$replierEmails', []] },
                                                [replierEmail]
                                            ]
                                        }
                                    }
                                },
                                { $set: { 'stats.replies': { $size: '$replierEmails' } } }
                            ]
                        );
                        console.log(`[EmailWorker] Updated unique reply count for Campaign ${campaignId} (replier: ${replierEmail})`);
                    }
                }

                // Run AI reply in background so polling isn't blocked and next check runs on time
                if (direction === 'inbound' && assistantId) {
                    const assistant = await Assistant.findById(assistantId);
                    if (assistant) {
                        console.log(`[EmailWorker] Triggering AI reply for thread ${newLog.threadId} (${assistant.name})`);
                        emailService.generateAndSendReply(user, integration, assistant, newLog, email).catch((err) => {
                            console.error('[EmailWorker] AI reply failed:', err.message);
                        });
                    }
                } else if (direction === 'inbound' && !assistantId) {
                    console.log(`[EmailWorker] Inbound from ${email.from} has no linked thread/assistant - skipping auto-reply`);
                }

            } catch (saveError) {
                console.error('[EmailWorker] Failed to save email:', saveError);
            }
        }
    }
}

export const emailWorker = new EmailWorker();
