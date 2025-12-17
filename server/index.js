import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './lib/db.js';

// Import Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import billingRoutes from './routes/billing.js';
import calendarRoutes from './routes/calendar.js';
import callHistoryRoutes from './routes/call-history.js';
import contactsRoutes from './routes/contacts.js';
import knowledgeBaseRoutes from './routes/knowledge-base.js';
import minutesRoutes from './routes/minutes.js';
import minutesPricingRoutes from './routes/minutes-pricing.js';
import plansRoutes from './routes/plans.js';
import supportAccessRoutes from './routes/supportAccess.js';
import whatsappRoutes from './routes/whatsapp.js';
import whitelabelRoutes from './routes/whitelabel.js';
import workspaceRoutes from './routes/workspace.js';
import assistantRoutes from './routes/assistant.js';

// Import Campaign Router (named export)
import { campaignManagementRouter } from './campaign-management.js';
import { recordingWebhookRouter } from './recording-webhook.js';
import { twilioUserRouter } from './twilio-user.js';
import { twilioAdminRouter } from './twilio-admin.js';
import { twilioSmsRouter } from './twilio-sms.js';
import { csvManagementRouter } from './csv-management.js';
import { livekitRoomRouter } from './livekit-room.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Connect to Database
connectDB();

// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/call-history', callHistoryRoutes);
app.use('/api/v1/call-history', callHistoryRoutes);
app.use('/api/v1/contacts', contactsRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/v1/knowledge-base', knowledgeBaseRoutes);
app.use('/api/minutes', minutesRoutes);
app.use('/api/v1/minutes', minutesRoutes);
app.use('/api/minutes-pricing', minutesPricingRoutes);
app.use('/api/v1/minutes-pricing', minutesPricingRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/v1/plans', plansRoutes);
app.use('/api/support', supportAccessRoutes);
app.use('/api/v1/support', supportAccessRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/whitelabel', whitelabelRoutes);
app.use('/api/v1/whitelabel', whitelabelRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/v1/workspace', workspaceRoutes);
app.use('/api/assistant', assistantRoutes);

// Additional V1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/assistants', assistantRoutes);
app.use('/api/v1/campaigns', campaignManagementRouter);
app.use('/api/v1/recording', recordingWebhookRouter);
app.use('/api/v1/twilio/user', twilioUserRouter);
app.use('/api/v1/twilio/sms', twilioSmsRouter);
app.use('/api/v1/twilio', twilioAdminRouter);
app.use('/api/v1/csv', csvManagementRouter);
app.use('/api/v1/livekit', livekitRoomRouter);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
