/**
 * GET /api – health/info so the deployment preview doesn't show 404.
 */
export async function GET() {
    return Response.json({
        service: 'email-api',
        status: 'ok',
        endpoints: {
            send: 'POST /api/send – send email via SMTP',
            checkEmails: 'POST /api/check-emails – fetch emails via IMAP (INBOX + SENT, last 7 days)',
            appendSent: 'POST /api/append-sent – append message to IMAP Sent folder'
        },
        docs: 'See README for request bodies'
    });
}
