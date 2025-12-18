import express from 'express';
import { CallHistory, Assistant, User, UserEmailCredential } from '../models/index.js';
import emailService from '../services/email-service.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

/**
 * @desc    Send post-call email with documents
 * @route   POST /api/v1/calls/:callId/send-email
 * @access  Private (called by LiveKit agent or system)
 */
router.post('/:callId/send-email', async (req, res) => {
    try {
        const { callId } = req.params;

        console.log(`[POST-CALL-EMAIL] Processing email for call: ${callId}`);

        const call = await CallHistory.findOne({
            $or: [
                { call_sid: callId },
                { call_id: callId }
            ]
        }).sort({ created_at: -1 });

        if (!call) {
            console.error(`[POST-CALL-EMAIL] Call not found: ${callId}`);
            return res.status(404).json({
                success: false,
                message: 'Call not found'
            });
        }

        const clientEmail = call.email || (call.transcription && call.transcription.email);

        if (!clientEmail) {
            console.log(`[POST-CALL-EMAIL] No email collected for call: ${callId}`);
            return res.status(200).json({
                success: false,
                message: 'No email collected during call',
                skipped: true
            });
        }

        const assistant = await Assistant.findById(call.assistant_id);

        if (!assistant) {
            console.error(`[POST-CALL-EMAIL] Assistant not found: ${call.assistant_id}`);
            return res.status(404).json({
                success: false,
                message: 'Assistant not found'
            });
        }

        const emailTemplate = assistant.email_templates?.post_call;

        if (!emailTemplate || !emailTemplate.subject || !emailTemplate.body) {
            return res.status(200).json({
                success: false,
                message: 'No email template configured',
                skipped: true
            });
        }

        const linkedEmailId = assistant.dataCollectionSettings?.linkedEmailId;

        if (!linkedEmailId) {
            return res.status(400).json({
                success: false,
                message: 'No email credentials linked to assistant'
            });
        }

        const integration = await UserEmailCredential.findById(linkedEmailId);

        if (!integration || !integration.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Email credentials not found or inactive'
            });
        }

        const clientName = call.name || 'there';
        const assistantName = assistant.name || 'Your Assistant';

        let subject = emailTemplate.subject
            .replace(/\{clientName\}/g, clientName)
            .replace(/\{assistantName\}/g, assistantName);

        let body = emailTemplate.body
            .replace(/\{clientName\}/g, clientName)
            .replace(/\{assistantName\}/g, assistantName);

        const attachments = [];

        if (assistant.assigned_documents && assistant.assigned_documents.length > 0) {
            for (const doc of assistant.assigned_documents) {
                try {
                    const relativePath = doc.path.replace(/^[/\\]/, '');
                    const filePath = path.join(process.cwd(), relativePath);

                    await fs.access(filePath);

                    attachments.push({
                        filename: doc.name,
                        path: filePath
                    });
                } catch (fileError) {
                    console.error(`[POST-CALL-EMAIL] File not found: ${doc.path}`, fileError.message);
                }
            }
        }

        const emailOptions = {
            from: emailTemplate.sender || integration.email,
            to: clientEmail,
            subject: subject,
            text: body,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>`,
            attachments: attachments
        };

        const smtpSettings = {
            smtpHost: integration.smtpHost,
            smtpPort: integration.smtpPort,
            smtpUser: integration.smtpUser,
            smtpPass: integration.smtpPass
        };

        const emailInfo = await emailService.sendEmail(
            smtpSettings,
            emailOptions,
            {
                userId: assistant.user_id,
                assistantId: assistant._id
            }
        );

        res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: emailInfo.messageId,
            recipient: clientEmail,
            attachmentCount: attachments.length
        });

    } catch (error) {
        console.error('[POST-CALL-EMAIL] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
});

export default router;
