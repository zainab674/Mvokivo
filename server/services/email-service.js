import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { EmailLog, Assistant, User, UserEmailCredential } from '../models/index.js';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const EMAIL_API_URL = process.env.EMAIL_API_URL?.replace(/\/$/, '');
const EMAIL_API_SECRET = (typeof process.env.EMAIL_API_SECRET === 'string' ? process.env.EMAIL_API_SECRET.trim() : '') || undefined;

/** Extract plain email address from "Name <email@x.com>" or return trimmed string */
function toPlainEmail(maybeAddress) {
    if (!maybeAddress || typeof maybeAddress !== 'string') return '';
    const s = maybeAddress.trim();
    const match = s.match(/<([^>]+)>/);
    return match ? match[1].trim() : s;
}

/** Throttle 401 hint so we don't spam logs (log once per 5 min) */
let last401Hint = 0;
const EMAIL_API_401_HINT_INTERVAL_MS = 5 * 60 * 1000;

class EmailService {
    /**
     * Send an email using User's SMTP settings.
     * If EMAIL_API_URL is set, sends via the Vercel email API; otherwise uses local SMTP (nodemailer).
     * @param {Object} userSettings - containing smtpHost, smtpPort, smtpUser, smtpPass
     * @param {Object} emailOptions - { from, to, subject, text, html, attachments }
     * @param {Object} context - { userId, assistantId } for logging
     */
    async sendEmail(userSettings, emailOptions, context = {}) {
        const { smtpHost, smtpPort, smtpUser, smtpPass } = userSettings;

        if (!smtpHost || !smtpUser || !smtpPass) {
            throw new Error('Missing SMTP credentials');
        }

        try {
            let info;

            if (EMAIL_API_URL) {
                info = await this._sendViaEmailApi(userSettings, emailOptions);
            } else {
                info = await this._sendViaLocalSmtp(userSettings, emailOptions);
            }

            console.log('Email sent: %s', info.messageId);

            // Attempt to append to Sent folder via IMAP (best effort)
            if (userSettings.imapHost && (userSettings.imapUser || userSettings.email) && userSettings.imapPass) {
                if (EMAIL_API_URL) {
                    this._appendSentViaEmailApi(userSettings, emailOptions).catch(err => {
                        console.error('Failed to append to Sent folder:', err.message);
                    });
                } else {
                    this.appendSentMessage(userSettings, emailOptions).catch(err => {
                        console.error('Failed to append to Sent folder:', err.message);
                    });
                }
            }

            // Log success
            if (context.userId) {
                const logEntry = await EmailLog.create({
                    userId: context.userId,
                    assistantId: context.assistantId,
                    campaignId: context.campaignId,
                    from: emailOptions.from,
                    to: emailOptions.to,
                    subject: emailOptions.subject,
                    body: emailOptions.text || 'HTML Content',
                    direction: 'outbound',
                    status: 'sent',
                    messageId: info.messageId,
                    hasAttachments: !!(emailOptions.attachments && emailOptions.attachments.length > 0),
                    threadId: context.threadId || undefined
                });

                if (!logEntry.threadId) {
                    logEntry.threadId = logEntry._id.toString();
                    await logEntry.save();
                }
            }

            return info;
        } catch (error) {
            console.error('Error sending email:', error);

            if (context.userId) {
                const logEntry = await EmailLog.create({
                    userId: context.userId,
                    assistantId: context.assistantId,
                    campaignId: context.campaignId,
                    from: emailOptions.from,
                    to: emailOptions.to,
                    subject: emailOptions.subject,
                    body: emailOptions.text || 'HTML Content',
                    direction: 'outbound',
                    status: 'failed',
                    error: error.message,
                    hasAttachments: !!(emailOptions.attachments && emailOptions.attachments.length > 0),
                    threadId: context.threadId || undefined
                });

                if (!logEntry.threadId) {
                    logEntry.threadId = logEntry._id.toString();
                    await logEntry.save();
                }
            }
            throw error;
        }
    }

    /**
     * Send via local nodemailer (when EMAIL_API_URL is not set)
     */
    async _sendViaLocalSmtp(userSettings, emailOptions) {
        const { smtpHost, smtpPort, smtpUser, smtpPass } = userSettings;
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort || 587,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
        });
        return transporter.sendMail(emailOptions);
    }

    /**
     * Send via Vercel-deployed email API (when EMAIL_API_URL is set, e.g. on DigitalOcean where SMTP is blocked)
     */
    async _sendViaEmailApi(userSettings, emailOptions) {
        const attachmentsPayload = [];
        if (Array.isArray(emailOptions.attachments)) {
            for (const a of emailOptions.attachments) {
                const filePath = a.path || a.filename;
                const filename = a.filename || (typeof filePath === 'string' ? path.basename(filePath) : 'attachment');
                if (filePath && typeof filePath === 'string') {
                    try {
                        const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
                        const buf = await fs.readFile(absPath);
                        attachmentsPayload.push({ filename: filename, contentBase64: buf.toString('base64') });
                    } catch (err) {
                        console.error('[EmailService] Failed to read attachment:', filePath, err.message);
                    }
                }
            }
        }

        const body = {
            smtp: {
                host: userSettings.smtpHost,
                port: userSettings.smtpPort || 587,
                user: userSettings.smtpUser,
                pass: userSettings.smtpPass,
            },
            from: emailOptions.from,
            to: emailOptions.to,
            subject: emailOptions.subject,
            text: emailOptions.text ?? '',
            html: emailOptions.html,
            headers: emailOptions.headers,
            attachments: attachmentsPayload.length ? attachmentsPayload : undefined,
        };

        const headers = {
            'Content-Type': 'application/json',
            ...(EMAIL_API_SECRET && { Authorization: `Bearer ${EMAIL_API_SECRET}`, 'X-API-Key': EMAIL_API_SECRET }),
        };

        const res = await fetch(`${EMAIL_API_URL}/api/send`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || `Email API error: ${res.status}`);
        }

        if (!data.success) {
            throw new Error(data.message || 'Email API returned failure');
        }

        const rejected = Array.isArray(data.rejected) ? data.rejected : [];
        if (rejected.length > 0) {
            throw new Error(`Recipient did not receive: ${rejected.join(', ')}`);
        }

        return {
            messageId: data.messageId,
            accepted: data.accepted,
            rejected: data.rejected,
        };
    }

    /**
     * Append sent message to IMAP Sent folder via email API (when EMAIL_API_URL is set)
     */
    async _appendSentViaEmailApi(userSettings, emailOptions) {
        const body = {
            imap: {
                user: userSettings.imapUser || userSettings.email,
                password: userSettings.imapPass,
                host: userSettings.imapHost,
                port: userSettings.imapPort || 993,
            },
            from: emailOptions.from,
            to: emailOptions.to,
            subject: emailOptions.subject,
            text: emailOptions.text,
            html: emailOptions.html,
            headers: emailOptions.headers,
        };
        const headers = {
            'Content-Type': 'application/json',
            ...(EMAIL_API_SECRET && { Authorization: `Bearer ${EMAIL_API_SECRET}`, 'X-API-Key': EMAIL_API_SECRET }),
        };
        const res = await fetch(`${EMAIL_API_URL}/api/append-sent`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
            throw new Error(data.message || `Append-sent API error: ${res.status}`);
        }
    }

    /**
     * Fetch emails via email API (when EMAIL_API_URL is set)
     */
    async _checkEmailsViaEmailApi(userSettings) {
        const body = {
            imap: {
                user: userSettings.email,
                password: userSettings.imapPass || userSettings.smtpPass, // Use imapPass if available
                host: userSettings.imapHost || 'imap.gmail.com',
                port: userSettings.imapPort || 993,
            },
        };
        const headers = {
            'Content-Type': 'application/json',
            'X-Debug': '1',
            ...(EMAIL_API_SECRET && { Authorization: `Bearer ${EMAIL_API_SECRET}`, 'X-API-Key': EMAIL_API_SECRET }),
        };
        const res = await fetch(`${EMAIL_API_URL}/api/check-emails`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            if (res.status === 401 && Date.now() - last401Hint > EMAIL_API_401_HINT_INTERVAL_MS) {
                last401Hint = Date.now();
                const len = EMAIL_API_SECRET ? EMAIL_API_SECRET.length : 0;
                const hint = data.debug
                    ? `[EmailService] Check-emails 401: this app secretLen=${len}, email-api received authLen=${data.debug.authLen}, authKind=${data.debug.authKind} (secretLen on API=${data.debug.secretLen}). authKind=none means header was stripped.`
                    : `[EmailService] Check-emails API 401: EMAIL_API_SECRET must match on both apps (this app length=${len}). Redeploy email-api after changing its env.`;
                console.warn(hint);
            }
            throw new Error(data.message || `Check-emails API error: ${res.status}`);
        }
        const emails = data.emails || [];
        return emails.map(e => ({
            ...e,
            date: e.date ? new Date(e.date) : null,
        }));
    }

    /**
     * Check for new emails using IMAP and reply if they are part of an assistant thread
     * @param {Object} user - User document
     * @param {Object} integration - User's email integration object
     */
    async monitorInbox(user, integration) {
        if (!integration.isActive) return;

        console.log(`[EmailMonitor] Checking inbox for ${integration.email}...`);

        const { imapHost, imapPort, imapUser, imapPass, email } = integration;
        const imap = (await import('imap-simple'));
        const { simpleParser } = (await import('mailparser'));

        // Force accept self-signed certs
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        const config = {
            imap: {
                user: imapUser || email,
                password: imapPass,
                host: imapHost || 'imap.gmail.com',
                port: imapPort || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };

        let connection;
        try {
            connection = await imap.connect(config);
            await connection.openBox('INBOX');

            // Fetch UNSEEN messages
            const searchCriteria = ['UNSEEN'];
            const fetchOptions = {
                bodies: ['HEADER', 'TEXT', ''],
                markSeen: true
            };

            const messages = await connection.search(searchCriteria, fetchOptions);

            if (messages.length === 0) {
                // console.log(`[EmailMonitor] No new messages for ${integration.email}`);
                connection.end();
                return;
            }

            console.log(`[EmailMonitor] Found ${messages.length} new messages for ${integration.email}`);

            for (const item of messages) {
                const all = item.parts.find(part => part.which === '');
                const id = item.attributes.uid;
                const idHeader = "Imap-Id: " + id + "\r\n";
                const parsed = await simpleParser(idHeader + all.body);

                // Check if this is a reply to one of our threads
                await this.processIncomingEmail(user, integration, parsed);
            }

            connection.end();

        } catch (error) {
            console.error(`[EmailMonitor] Error checking ${integration.email}:`, error);
            if (connection) connection.end();
        }
    }

    async processIncomingEmail(user, integration, email) {
        try {
            // 1. Identify Thread
            // Check In-Reply-To or References header
            const references = []
                .concat(email.inReplyTo || [])
                .concat(email.references || []);

            if (references.length === 0) {
                return;
            }

            // Find valid parent message in our logs
            const parentLog = await EmailLog.findOne({
                messageId: { $in: references },
                userId: user.id || user._id, // Support both patterns
                direction: 'outbound' // We are looking for a reply to our outbound email
            });

            if (!parentLog) {
                // console.log(`[EmailMonitor] Email from ${email.from.text} is not a reply to a known assistant thread.`);
                return;
            }

            console.log(`[EmailMonitor] Match found! Reply to thread ${parentLog.threadId} (Assistant: ${parentLog.assistantId})`);

            // 2. Fetch Assistant
            const assistant = await Assistant.findOne({ _id: parentLog.assistantId });
            if (!assistant) {
                console.error(`[EmailMonitor] Assistant ${parentLog.assistantId} not found.`);
                return;
            }

            // 3. Log the incoming email
            const inboundLog = await EmailLog.create({
                userId: user.id || user._id,
                assistantId: assistant._id,
                from: email.from.text,
                to: email.to.text,
                subject: email.subject,
                body: email.text || 'HTML Content',
                direction: 'inbound',
                status: 'received',
                messageId: email.messageId,
                inReplyTo: parentLog.messageId,
                threadId: parentLog.threadId,
                created_at: new Date()
            });

            // 4. Generate AI Reply
            await this.generateAndSendReply(user, integration, assistant, inboundLog, email);

        } catch (error) {
            console.error('[EmailMonitor] Error processing email:', error);
        }
    }

    async generateAndSendReply(user, integration, assistant, inboundLog, incomingEmail) {
        try {
            console.log(`[EmailMonitor] Generating AI reply for Assistant: ${assistant.name}`);

            // Fetch thread history
            const history = await EmailLog.find({ threadId: inboundLog.threadId })
                .sort({ created_at: 1 })
                .limit(10); // Last 10 messages for context

            // Construct Prompt
            let prompt = `You are an AI assistant named ${assistant.name}.\n`;
            prompt += `Your instructions: ${assistant.prompt || assistant.systemPrompt || 'Be helpful and professional.'}\n\n`;
            prompt += `Conversation History:\n`;

            history.forEach(msg => {
                const role = msg.direction === 'outbound' ? 'You (Assistant)' : 'User';
                // Clean up body (simple truncation or cleanup)
                const snippet = msg.body ? msg.body.substring(0, 500) : '[No Content]';
                prompt += `${role}: ${snippet}\n\n`;
            });

            prompt += `User just replied: "${incomingEmail.text || ''}"\n`;
            prompt += `\nPlease write a reply to the user. Keep it concise and professional. Do not include subject line in the body.`;

            // Call OpenAI with timeout so we don't hang and user gets a chance to retry
            const openaiTimeoutMs = Math.min(60000, Math.max(10000, parseInt(process.env.OPENAI_REPLY_TIMEOUT_MS || '25000', 10)));
            const completion = await Promise.race([
                openai.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "gpt-4o",
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`OpenAI reply timed out after ${openaiTimeoutMs}ms`)), openaiTimeoutMs)
                ),
            ]);

            const replyText = completion.choices[0].message.content.trim();

            // Send Reply – use plain email so SMTP/API always get a valid address
            const fromRaw = incomingEmail.from && (typeof incomingEmail.from === 'object' ? incomingEmail.from.text : incomingEmail.from);
            const recipient = toPlainEmail(fromRaw || '');
            if (!recipient) {
                throw new Error('No reply-to address found for incoming email');
            }

            const refs = incomingEmail.references
                ? (Array.isArray(incomingEmail.references) ? incomingEmail.references.join(' ') : String(incomingEmail.references))
                : '';
            const refHeader = [refs, incomingEmail.messageId].filter(Boolean).join(' ').trim();

            const emailOptions = {
                from: integration.email,
                to: recipient,
                subject: (incomingEmail.subject || '').startsWith('Re:') ? incomingEmail.subject : `Re: ${incomingEmail.subject || '(no subject)'}`,
                text: replyText,
                html: `<div style="font-family: Arial, sans-serif; pre-wrap: break-word;">${replyText.replace(/\n/g, '<br>')}</div>`,
                headers: refHeader
                    ? {
                        ...(incomingEmail.messageId && { 'In-Reply-To': Array.isArray(incomingEmail.messageId) ? incomingEmail.messageId[0] : incomingEmail.messageId }),
                        'References': refHeader
                    }
                    : undefined
            };

            console.log(`[EmailMonitor] Sending AI reply to ${recipient} (thread: ${inboundLog.threadId})`);

            await this.sendEmail(
                {
                    smtpHost: integration.smtpHost,
                    smtpPort: integration.smtpPort,
                    smtpUser: integration.smtpUser,
                    smtpPass: integration.smtpPass
                },
                emailOptions,
                {
                    userId: user.id || user._id,
                    assistantId: assistant._id,
                    threadId: inboundLog.threadId
                }
            );

            console.log(`[EmailMonitor] Auto-reply sent to ${recipient}`);

        } catch (error) {
            console.error('[EmailMonitor] Failed to generate/send reply:', error);
        }
    }

    /**
     * Check for new emails using IMAP (or email API when EMAIL_API_URL is set)
     * @param {Object} userSettings - containing email, smtpPass (used as imap pass), imapHost, imapPort
     * @returns {Promise<Array>} List of new email objects
     */
    async checkEmails(userSettings) {
        if (EMAIL_API_URL) {
            try {
                return await this._checkEmailsViaEmailApi(userSettings);
            } catch (error) {
                console.error('[EmailService] Check-emails API Error:', error);
                return [];
            }
        }

        const { email, smtpPass, imapPass, imapHost, imapPort } = userSettings;
        const imap = (await import('imap-simple'));
        const { simpleParser } = (await import('mailparser'));

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        const config = {
            imap: {
                user: email,
                password: imapPass || smtpPass, // Use imapPass if available
                host: imapHost || 'imap.gmail.com',
                port: imapPort || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };

        const collectedEmails = [];

        try {
            const connection = await imap.connect(config);

            // Helper to fetch and parse from a box
            const fetchFromBox = async (boxName, folderType) => {
                try {
                    await connection.openBox(boxName);

                    const lookback = new Date();
                    lookback.setDate(lookback.getDate() - 7);
                    const searchCriteria = [['SINCE', lookback]];
                    const fetchOptions = {
                        bodies: ['HEADER', 'TEXT', ''],
                        markSeen: false
                    };
                    if (folderType === 'inbox') fetchOptions.markSeen = true;

                    const messages = await connection.search(searchCriteria, fetchOptions);
                    console.log(`[EmailService] Found ${messages.length} emails in ${boxName} (${folderType})`);

                    for (const item of messages) {
                        const all = item.parts.find(part => part.which === '');
                        const id = item.attributes.uid;
                        const idHeader = "Imap-Id: " + id + "\r\n";
                        const parsed = await simpleParser(idHeader + all.body);

                        collectedEmails.push({
                            folder: folderType, // 'inbox' or 'sent'
                            from: parsed.from?.text,
                            to: parsed.to?.text,
                            subject: parsed.subject,
                            text: parsed.text,
                            html: parsed.html,
                            messageId: parsed.messageId,
                            inReplyTo: parsed.inReplyTo,
                            references: parsed.references,
                            date: parsed.date
                        });
                    }
                } catch (err) {
                    console.error(`[EmailService] Error fetching from ${boxName}:`, err.message);
                }
            };

            // 1. Fetch INBOX
            await fetchFromBox('INBOX', 'inbox');

            // 2. Fetch SENT
            const sentBox = await this._detectSentBox(connection);
            if (sentBox) {
                await fetchFromBox(sentBox, 'sent');
            } else {
                console.warn('[EmailService] Could not detect Sent folder for syncing');
            }

            connection.end();
            return collectedEmails;

        } catch (error) {
            console.error('[EmailService] IMAP Connection Error:', error);
            return [];
        }
    }

    // Helper to detect sent box
    async _detectSentBox(connection) {
        const boxes = await connection.getBoxes();
        const candidates = ['Sent', 'Sent Items', 'SENT', 'Sent Messages', 'INBOX.Sent', 'INBOX.Sent Items'];

        const findSentBox = (boxList, prefix = '') => {
            for (const key of Object.keys(boxList)) {
                const box = boxList[key];
                const fullPath = prefix + key;
                if (box.attribs && box.attribs.some(a => typeof a === 'string' && a.toUpperCase() === '\\SENT')) {
                    return fullPath;
                }
                if (box.children) {
                    const childFound = findSentBox(box.children, fullPath + box.delimiter);
                    if (childFound) return childFound;
                }
            }
            return null;
        };

        let sentBoxName = findSentBox(boxes);
        if (!sentBoxName) {
            const allPaths = [];
            const flatten = (boxList, prefix = '') => {
                for (const key of Object.keys(boxList)) {
                    const delim = boxList[key].delimiter || '.';
                    allPaths.push(prefix + key);
                    if (boxList[key].children) flatten(boxList[key].children, prefix + key + delim);
                }
            };
            flatten(boxes);
            const match = allPaths.find(p => candidates.some(c => p.endsWith(c) || p === c));
            if (match) sentBoxName = match;
        }
        return sentBoxName;
    }

    async appendSentMessage(userSettings, emailOptions) {
        const imap = (await import('imap-simple'));
        const nodemailer = (await import('nodemailer'));
        const snubTransport = nodemailer.createTransport({
            streamTransport: true,
            buffer: true,
            newline: 'windows'
        });

        const info = await snubTransport.sendMail(emailOptions);
        const rawMessage = typeof info.message === 'string' ? info.message : info.message.toString();

        const config = {
            imap: {
                user: userSettings.imapUser || userSettings.email,
                password: userSettings.imapPass,
                host: userSettings.imapHost,
                port: userSettings.imapPort || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };

        const connection = await imap.connect(config);

        try {
            const boxes = await connection.getBoxes();
            let sentBoxName = null;

            const candidates = ['Sent', 'Sent Items', 'SENT', 'Sent Messages', 'INBOX.Sent', 'INBOX.Sent Items'];

            const findSentBox = (boxList, prefix = '') => {
                for (const key of Object.keys(boxList)) {
                    const box = boxList[key];
                    const fullPath = prefix + key;
                    if (box.attribs && box.attribs.some(a => typeof a === 'string' && a.toUpperCase() === '\\SENT')) {
                        return fullPath;
                    }
                    if (box.children) {
                        const childFound = findSentBox(box.children, fullPath + box.delimiter);
                        if (childFound) return childFound;
                    }
                }
                return null;
            };

            const detectedSent = findSentBox(boxes);
            if (detectedSent) {
                sentBoxName = detectedSent;
            } else {
                const allPaths = [];
                const flatten = (boxList, prefix = '') => {
                    for (const key of Object.keys(boxList)) {
                        const delim = boxList[key].delimiter || '.';
                        allPaths.push(prefix + key);
                        if (boxList[key].children) flatten(boxList[key].children, prefix + key + delim);
                    }
                };
                flatten(boxes);

                const match = allPaths.find(p => candidates.some(c => p.endsWith(c) || p === c));
                if (match) {
                    sentBoxName = match;
                }
            }

            if (!sentBoxName) {
                sentBoxName = 'Sent';
            }

            await connection.append(rawMessage, {
                mailbox: sentBoxName,
                flags: ['\\Seen']
            });

        } finally {
            connection.end();
        }
    }
}

export default new EmailService();
