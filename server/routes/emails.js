import express from 'express';
import { EmailLog, User, UserEmailCredential } from '../models/index.js';
import { authenticateToken as requireAuth } from '../utils/auth.js';
import multer from 'multer';
import fs from 'fs';
import emailService from '../services/email-service.js';

const router = express.Router();

// GET /api/v1/emails/threads
router.get('/threads', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { search } = req.query;

        const credentials = await UserEmailCredential.find({ user_id: userId, isActive: true });
        const activeEmails = credentials.map(i => i.email);

        const matchStage = {
            userId: userId,
            $or: [
                { from: { $in: activeEmails } },
                { to: { $in: activeEmails } }
            ]
        };

        const threads = await EmailLog.aggregate([
            { $match: matchStage },
            { $sort: { created_at: -1 } },
            {
                $addFields: {
                    rawOtherParty: {
                        $cond: {
                            if: { $eq: ["$direction", "inbound"] },
                            then: "$from",
                            else: "$to"
                        }
                    }
                }
            },
            {
                $addFields: {
                    cleanOtherParty: {
                        $let: {
                            vars: {
                                match: {
                                    $regexFind: {
                                        input: "$rawOtherParty",
                                        regex: "<([^>]+)>"
                                    }
                                }
                            },
                            in: {
                                $toLower: {
                                    $trim: {
                                        input: {
                                            $cond: {
                                                if: { $ne: ["$$match", null] },
                                                then: { $arrayElemAt: ["$$match.captures", 0] },
                                                else: "$rawOtherParty"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$cleanOtherParty",
                    lastMessage: { $first: "$$ROOT" },
                    messageCount: { $sum: 1 },
                    displayName: { $first: "$rawOtherParty" }
                }
            },
            { $sort: { "lastMessage.created_at": -1 } }
        ]);

        const formattedThreads = threads.map(t => ({
            id: t._id,
            senderName: t.displayName || t._id,
            senderEmail: t._id,
            subject: t.lastMessage.subject,
            lastMessage: t.lastMessage.body ? t.lastMessage.body.substring(0, 100) : '',
            timestamp: t.lastMessage.created_at,
            assistantName: 'Assistant',
            messageCount: t.messageCount
        }));

        if (search) {
            const lowerSearch = search.toLowerCase();
            const filtered = formattedThreads.filter(t =>
                (t.senderName && t.senderName.toLowerCase().includes(lowerSearch)) ||
                (t.subject && t.subject.toLowerCase().includes(lowerSearch))
            );
            return res.json({ success: true, threads: filtered });
        }

        res.json({ success: true, threads: formattedThreads });

    } catch (error) {
        console.error('Error fetching email threads:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch emails' });
    }
});

// GET /api/v1/emails/:id
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const credentials = await UserEmailCredential.find({ user_id: userId, isActive: true });
        const activeEmails = credentials.map(i => i.email);

        let query;

        if (id.includes('@')) {
            const emailMatch = id.match(/<([^>]+)>/);
            const cleanEmail = emailMatch ? emailMatch[1] : id;
            const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const emailRegex = new RegExp(escapedEmail, 'i');

            query = {
                userId: userId,
                $or: [
                    {
                        from: { $regex: emailRegex },
                        to: { $in: activeEmails }
                    },
                    {
                        from: { $in: activeEmails },
                        to: { $regex: emailRegex }
                    }
                ]
            };
        } else {
            query = {
                userId: userId,
                threadId: id
            };
        }

        let messages = await EmailLog.find(query).sort({ created_at: 1 });

        if (messages.length === 0 && !id.includes('@')) {
            const singleMessage = await EmailLog.findOne({ userId: userId, _id: id });
            if (singleMessage) messages = [singleMessage];
        }

        const formattedMessages = messages.map(msg => ({
            id: msg._id,
            from: msg.direction === 'outbound' ? 'assistant' : 'user',
            content: msg.body,
            timestamp: msg.created_at,
            senderEmail: msg.from
        }));

        res.json({ success: true, messages: formattedMessages });

    } catch (error) {
        console.error('Error fetching thread details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch thread' });
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination: 'uploads/',
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + '-' + file.originalname);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// POST /api/v1/emails/automation/send
router.post('/automation/send', requireAuth, upload.single('attachment'), async (req, res) => {
    try {
        const { assistantId, accountId, subject, body, recipients } = req.body;
        const attachment = req.file;

        if (!assistantId || !accountId || !subject || !body || !recipients) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        let recipientsList;
        try {
            recipientsList = JSON.parse(recipients);
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid recipients format' });
        }

        const integration = await UserEmailCredential.findOne({ _id: accountId, user_id: req.user.id });

        if (!integration || !integration.isActive) {
            return res.status(400).json({ success: false, message: 'Selected email account is not active' });
        }

        const emailOptionsBase = {
            from: integration.email,
            subject: subject,
            text: body,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>`,
            attachments: attachment ? [{
                filename: attachment.originalname,
                path: attachment.path
            }] : []
        };

        const emailSettings = {
            smtpHost: integration.smtpHost,
            smtpPort: integration.smtpPort,
            smtpUser: integration.smtpUser,
            smtpPass: integration.smtpPass,
            imapHost: integration.imapHost,
            imapPort: integration.imapPort,
            imapUser: integration.imapUser,
            imapPass: integration.imapPass,
            email: integration.email
        };

        let sentCount = 0;
        let failedCount = 0;

        for (const recipientEmail of recipientsList) {
            try {
                await emailService.sendEmail(
                    emailSettings,
                    { ...emailOptionsBase, to: recipientEmail },
                    { userId: req.user.id, assistantId: assistantId }
                );
                sentCount++;
            } catch (err) {
                console.error(`[EmailAutomation] Failed to send to ${recipientEmail}:`, err.message);
                failedCount++;
            }
        }

        if (attachment) {
            fs.unlink(attachment.path, (err) => { if (err) console.error('Failed to cleanup file:', err) });
        }

        res.json({
            success: true,
            message: `Campaign complete. Sent: ${sentCount}, Failed: ${failedCount}`,
            stats: { sent: sentCount, failed: failedCount }
        });

    } catch (error) {
        console.error('[EmailAutomation] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to execute campaign' });
    }
});

// POST /api/v1/emails/sync
router.post('/sync', requireAuth, async (req, res) => {
    try {
        const { emailWorker } = await import('../workers/email-worker.js');
        emailWorker.processEmails().catch(err => {
            console.error('[EmailAPI] Manual sync failed:', err);
        });
        res.json({ success: true, message: 'Sync started' });
    } catch (error) {
        console.error('Error triggering sync:', error);
        res.status(500).json({ success: false, message: 'Failed to start sync' });
    }
});

export default router;
