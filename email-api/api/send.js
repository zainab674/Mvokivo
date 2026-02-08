import nodemailer from 'nodemailer';

/**
 * Vercel serverless endpoint: send one email via user's SMTP.
 * Body: { smtp: { host, port, user, pass }, from, to, subject, text, html?, headers?, attachments?: [{ filename, contentBase64 }] }
 * Headers: Authorization: Bearer <EMAIL_API_SECRET> or X-API-Key: <EMAIL_API_SECRET>
 */
export async function POST(request) {
    try {
        const authRaw = request.headers.get('authorization') || request.headers.get('x-api-key') || '';
        const authHeader = typeof authRaw === 'string' ? authRaw.trim() : '';
        const secret = (process.env.EMAIL_API_SECRET || '').trim();
        if (secret && authHeader !== `Bearer ${secret}` && authHeader !== secret) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { smtp, from, to, subject, text, html, headers, attachments: attachmentsPayload } = body;

        if (!smtp?.host || !smtp?.user || !smtp?.pass || !from || !to || !subject) {
            return Response.json({
                success: false,
                message: 'Missing required fields: smtp.host, smtp.user, smtp.pass, from, to, subject'
            }, { status: 400 });
        }

        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port || 587,
            secure: smtp.port === 465,
            auth: {
                user: smtp.user,
                pass: smtp.pass
            }
        });

        const attachments = [];
        if (Array.isArray(attachmentsPayload)) {
            for (const a of attachmentsPayload) {
                if (a.filename && a.contentBase64) {
                    attachments.push({
                        filename: a.filename,
                        content: Buffer.from(a.contentBase64, 'base64')
                    });
                }
            }
        }

        const mailOptions = {
            from,
            to,
            subject,
            text: text ?? '',
            html: html ?? (text ? text.replace(/\n/g, '<br>') : ''),
            headers: headers || undefined,
            attachments: attachments.length ? attachments : undefined
        };

        const info = await transporter.sendMail(mailOptions);

        return Response.json({
            success: true,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        });
    } catch (error) {
        console.error('[EmailAPI] Send error:', error);
        return Response.json({
            success: false,
            message: error.message || 'Failed to send email'
        }, { status: 500 });
    }
}
