import imap from 'imap-simple';
import { simpleParser } from 'mailparser';

function detectSentBox(boxes) {
    const candidates = ['Sent', 'Sent Items', 'SENT', 'Sent Messages', 'INBOX.Sent', 'INBOX.Sent Items'];
    const findSentBox = (boxList, prefix = '') => {
        for (const key of Object.keys(boxList)) {
            const box = boxList[key];
            const fullPath = prefix + key;
            if (box.attribs && box.attribs.some(a => typeof a === 'string' && a.toUpperCase() === '\\SENT')) {
                return fullPath;
            }
            if (box.children) {
                const childFound = findSentBox(box.children, fullPath + (box.delimiter || '.'));
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

/**
 * POST /api/check-emails – fetch emails via IMAP (INBOX + SENT, last 7 days).
 * Body: { imap: { user, password, host?, port? } }
 * Headers: Authorization: Bearer <EMAIL_API_SECRET> or X-API-Key
 */
export async function POST(request) {
    const authRaw = request.headers.get('authorization') || request.headers.get('x-api-key') || '';
    const authHeader = typeof authRaw === 'string' ? authRaw.trim() : '';
    const secret = (process.env.EMAIL_API_SECRET || '').trim();
    if (secret && authHeader !== `Bearer ${secret}` && authHeader !== secret) {
        const authKind = !authHeader ? 'none' : authHeader.startsWith('Bearer ') ? 'Bearer' : 'raw';
        const debug = request.headers.get('x-debug') === '1' ? { secretLen: secret.length, authLen: authHeader.length, authKind } : undefined;
        console.warn('[check-emails] 401: secretLen=%d, authLen=%d, authKind=%s', secret.length, authHeader.length, authKind);
        return Response.json({ success: false, message: 'Unauthorized', ...(debug && { debug }) }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { imap: imapConfig } = body;
        if (!imapConfig?.user || !imapConfig?.password) {
            return Response.json({
                success: false,
                message: 'Missing required fields: imap.user, imap.password'
            }, { status: 400 });
        }

        const config = {
            imap: {
                user: imapConfig.user,
                password: imapConfig.password,
                host: imapConfig.host || 'imap.gmail.com',
                port: imapConfig.port || 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };

        const collectedEmails = [];
        const connection = await imap.connect(config);

        try {
            const fetchFromBox = async (boxName, folderType) => {
                await connection.openBox(boxName);
                const lookback = new Date();
                // Reduce lookback window to last 2 days to avoid syncing too many emails
                lookback.setDate(lookback.getDate() - 2);
                const searchCriteria = [['SINCE', lookback]];
                const fetchOptions = {
                    bodies: ['HEADER', 'TEXT', ''],
                    markSeen: folderType === 'inbox'
                };
                const messages = await connection.search(searchCriteria, fetchOptions);
                for (const item of messages) {
                    const all = item.parts.find(part => part.which === '');
                    const id = item.attributes.uid;
                    const idHeader = 'Imap-Id: ' + id + '\r\n';
                    const parsed = await simpleParser(idHeader + all.body);
                    collectedEmails.push({
                        folder: folderType,
                        from: parsed.from?.text,
                        to: parsed.to?.text,
                        subject: parsed.subject,
                        text: parsed.text,
                        html: parsed.html,
                        messageId: parsed.messageId,
                        inReplyTo: parsed.inReplyTo,
                        references: parsed.references,
                        date: parsed.date ? parsed.date.toISOString() : null
                    });
                }
            };

            await fetchFromBox('INBOX', 'inbox');
            const boxes = await connection.getBoxes();
            const sentBox = detectSentBox(boxes);
            if (sentBox) await fetchFromBox(sentBox, 'sent');
        } finally {
            connection.end();
        }

        return Response.json({ success: true, emails: collectedEmails });
    } catch (error) {
        console.error('[EmailAPI] check-emails error:', error);
        return Response.json({
            success: false,
            message: error.message || 'Failed to fetch emails',
            emails: []
        }, { status: 500 });
    }
}
