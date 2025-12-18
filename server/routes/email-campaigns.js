import express from 'express';
import { EmailCampaign, User, Contact, CsvContact, UserEmailCredential } from '../models/index.js';
import { authenticateToken as requireAuth } from '../utils/auth.js';
import multer from 'multer';
import fs from 'fs';
import emailService from '../services/email-service.js';

const router = express.Router();

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

// GET /api/v1/email-campaigns
router.get('/', requireAuth, async (req, res) => {
    try {
        const campaigns = await EmailCampaign.find({ userId: req.user.id })
            .populate('assistantId', 'name')
            .sort({ created_at: -1 });

        const credentials = await UserEmailCredential.find({ user_id: req.user.id });

        const enhancedCampaigns = campaigns.map(camp => {
            const integration = credentials.find(i => i._id.toString() === camp.emailIntegrationId?.toString());
            return {
                ...camp.toObject(),
                senderEmail: integration ? integration.email : 'Unknown'
            };
        });

        res.json({ success: true, campaigns: enhancedCampaigns });
    } catch (error) {
        console.error('Error fetching email campaigns:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
    }
});

// POST /api/v1/email-campaigns
router.post('/', requireAuth, upload.single('attachment'), async (req, res) => {
    try {
        const {
            name,
            assistantId,
            emailIntegrationId,
            contactSource,
            contactListId,
            csvFileId,
            subject,
            body
        } = req.body;

        const attachment = req.file;

        if (!name || !assistantId || !emailIntegrationId || !contactSource || !subject || !body) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        let recipients = [];
        if (contactSource === 'contact_list') {
            const contacts = await Contact.find({ list_id: contactListId, user_id: req.user.id });
            recipients = contacts
                .filter(c => c.email)
                .map(c => c.email);
        } else if (contactSource === 'csv_file') {
            const contacts = await CsvContact.find({ csv_file_id: csvFileId });
            recipients = contacts
                .filter(c => c.email)
                .map(c => c.email);
        }

        recipients = [...new Set(recipients)];

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid recipients found in selected source' });
        }

        const campaign = new EmailCampaign({
            userId: req.user.id,
            name,
            assistantId,
            emailIntegrationId,
            contactSource,
            contactListId: contactListId || undefined,
            csvFileId: csvFileId || undefined,
            subject,
            body,
            attachmentPath: attachment ? attachment.path : undefined,
            attachmentOriginalName: attachment ? attachment.originalname : undefined,
            status: 'draft',
            totalRecipients: recipients.length
        });

        await campaign.save();

        res.json({ success: true, message: 'Campaign draft created', campaignId: campaign._id });

    } catch (error) {
        console.error('[EmailCampaign] Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create campaign' });
    }
});

// POST /api/v1/email-campaigns/:id/start
router.post('/:id/start', requireAuth, async (req, res) => {
    try {
        const campaign = await EmailCampaign.findOne({ _id: req.params.id, userId: req.user.id });
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        if (campaign.status !== 'draft' && campaign.status !== 'paused' && campaign.status !== 'failed') {
            return res.status(400).json({ success: false, message: 'Campaign is already sending or completed' });
        }

        let recipients = [];
        if (campaign.contactSource === 'contact_list') {
            const contacts = await Contact.find({ list_id: campaign.contactListId, user_id: req.user.id });
            recipients = contacts
                .filter(c => c.email)
                .map(c => c.email);
        } else if (campaign.contactSource === 'csv_file') {
            const contacts = await CsvContact.find({ csv_file_id: campaign.csvFileId });
            recipients = contacts
                .filter(c => c.email)
                .map(c => c.email);
        }
        recipients = [...new Set(recipients)];

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid recipients found' });
        }

        const integration = await UserEmailCredential.findOne({ _id: campaign.emailIntegrationId, user_id: req.user.id });

        if (!integration || !integration.isActive) {
            campaign.status = 'failed';
            await campaign.save();
            return res.status(400).json({ success: false, message: 'Selected email account is not active' });
        }

        campaign.status = 'sending';
        campaign.totalRecipients = recipients.length;
        await campaign.save();

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

        const emailOptionsBase = {
            from: integration.email,
            subject: campaign.subject,
            text: campaign.body,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${campaign.body.replace(/\n/g, '<br>')}</div>`,
            attachments: campaign.attachmentPath ? [{
                filename: campaign.attachmentOriginalName,
                path: campaign.attachmentPath
            }] : []
        };

        res.json({ success: true, message: 'Campaign started' });

        (async () => {
            let sentCount = 0;
            let failedCount = 0;

            for (const recipientEmail of recipients) {
                try {
                    await emailService.sendEmail(
                        emailSettings,
                        { ...emailOptionsBase, to: recipientEmail },
                        {
                            userId: req.user.id,
                            assistantId: campaign.assistantId,
                            campaignId: campaign._id
                        }
                    );
                    sentCount++;
                } catch (err) {
                    console.error(`[EmailCampaign] Failed to send to ${recipientEmail}:`, err.message);
                    failedCount++;
                }
            }

            campaign.stats.sent = sentCount;
            campaign.stats.failed = failedCount;
            campaign.status = 'completed';
            await campaign.save();

        })().catch(err => {
            console.error('[EmailCampaign] Background process error:', err);
            campaign.status = 'failed';
            campaign.save();
        });

    } catch (error) {
        console.error('[EmailCampaign] Start Error:', error);
        res.status(500).json({ success: false, message: 'Failed to start campaign' });
    }
});

export default router;
