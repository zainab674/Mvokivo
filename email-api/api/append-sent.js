import imap from 'imap-simple';
import nodemailer from 'nodemailer';

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
    return sentBoxName || 'Sent';
}

/**
 * POST /api/append-sent – append a sent message to the IMAP Sent folder.
 * Body: { imap: { user, password, host?, port? }, from, to, subject, text?, html?, headers? }
 */
export async function POST(request) {
    const authRaw = request.headers.get('authorization') || request.headers.get('x-api-key') || '';
    const authHeader = typeof authRaw === 'string' ? authRaw.trim() : '';
    const secret = (process.env.EMAIL_API_SECRET || '').trim();
    if (secret && authHeader !== `Bearer ${secret}` && authHeader !== secret) {
        return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { imap: imapConfig, from, to, subject, text, html, headers } = body;
        if (!imapConfig?.user || !imapConfig?.password || !from || !to || !subject) {
            return Response.json({
                success: false,
                message: 'Missing required: imap.user, imap.password, from, to, subject'
            }, { status: 400 });
        }

        const streamTransport = nodemailer.createTransport({
            streamTransport: true,
            buffer: true,
            newline: 'windows'
        });
        const info = await streamTransport.sendMail({
            from,
            to,
            subject,
            text: text ?? '',
            html: html ?? (text ? text.replace(/\n/g, '<br>') : ''),
            headers: headers || undefined
        });
        const rawMessage = typeof info.message === 'string' ? info.message : info.message.toString();

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

        const connection = await imap.connect(config);
        try {
            const boxes = await connection.getBoxes();
            const sentBoxName = detectSentBox(boxes);
            await connection.append(rawMessage, { mailbox: sentBoxName, flags: ['\\Seen'] });
        } finally {
            connection.end();
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('[EmailAPI] append-sent error:', error);
        return Response.json({
            success: false,
            message: error.message || 'Failed to append to Sent'
        }, { status: 500 });
    }
}
