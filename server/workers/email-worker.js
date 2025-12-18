import { User, EmailLog, Assistant, EmailCampaign, UserEmailCredential } from '../models/index.js';
import emailService from '../services/email-service.js';

class EmailWorker {
    constructor() {
        this.isProcessing = false;
        this.interval = 10000; // Check every 10 seconds
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

            for (const integration of credentials) {
                try {
                    const user = await User.findOne({ id: integration.user_id });
                    if (!user) continue;

                    // Check emails for this integration
                    const newEmails = await emailService.checkEmails({
                        email: integration.email,
                        smtpPass: integration.smtpPass, // Using smtpPass as the master secret for now
                        imapHost: integration.imapHost || 'imap.gmail.com',
                        imapPort: integration.imapPort || 993
                    });

                    if (newEmails.length > 0) {
                        await this.saveSyncedEmails(user, integration, newEmails);
                    }
                } catch (err) {
                    console.error(`[EmailWorker] Error processing integration ${integration.email}:`, err.message);
                }
            }

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

                if (email.inReplyTo || (email.references && email.references.length > 0)) {
                    const refs = Array.isArray(email.references) ? email.references : [email.references];

                    const parentLog = await EmailLog.findOne({
                        $or: [
                            { messageId: email.inReplyTo },
                            { messageId: { $in: refs } }
                        ]
                    });
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

                const existing = await EmailLog.findOne({ messageId: email.messageId });
                if (existing) {
                    continue;
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

                console.log(`[EmailWorker] Saved ${direction} email: ${newLog._id} (Thread: ${newLog.threadId})`);

                if (campaignId && direction === 'inbound') {
                    await EmailCampaign.findByIdAndUpdate(campaignId, { $inc: { 'stats.replies': 1 } });
                    console.log(`[EmailWorker] Incremented reply count for Campaign ${campaignId}`);
                }

                if (direction === 'inbound' && assistantId) {
                    const assistant = await Assistant.findById(assistantId);
                    if (assistant) {
                        await emailService.generateAndSendReply(user, integration, assistant, newLog, email);
                    }
                }

            } catch (saveError) {
                console.error('[EmailWorker] Failed to save email:', saveError);
            }
        }
    }
}

export const emailWorker = new EmailWorker();
