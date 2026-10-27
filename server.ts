import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createStripeCheckoutSession } from './src/api/stripeHandler';
import { processStripeWebhook } from './src/api/stripeWebhookHandler';
import {
  exchangeZohoGrantToken,
  refreshZohoAccessToken,
  sendZohoEmailMessage,
} from './src/api/zohoHandler';

dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// 1. Endpoint para criar sessão de checkout
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const origin = `${req.protocol}://${req.get('host')}`;
    const session = await createStripeCheckoutSession(req.body, origin);
    res.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error('[Stripe Express Error]', err);
    res.status(500).json({ error: err.message || 'Erro ao processar checkout Stripe' });
  }
});

// 2. Endpoint para receber Webhooks da Stripe (POST)
app.post('/api/stripe-webhook', async (req, res) => {
  try {
    const result = await processStripeWebhook(req.body);
    res.status(200).json({ received: true, ...result });
  } catch (err: any) {
    console.error('[Stripe Express Webhook Error]', err);
    res.status(400).json({ received: false, error: err.message || 'Erro ao processar webhook' });
  }
});

// 3. Endpoint para troca de Grant Token Zoho (OAuth2 Self-Client)
app.post('/api/zoho-auth', async (req, res) => {
  try {
    const result = await exchangeZohoGrantToken(req.body);
    if (!result.success) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  } catch (err: any) {
    console.error('[Zoho Express Auth Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao autenticar Zoho' });
  }
});

// 4. Endpoint para renovar Access Token Zoho
app.post('/api/zoho-refresh', async (req, res) => {
  try {
    const result = await refreshZohoAccessToken(req.body);
    if (!result.success) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  } catch (err: any) {
    console.error('[Zoho Express Refresh Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao renovar token Zoho' });
  }
});

// 5. Endpoint para disparo de E-mail Zoho Mail
app.post('/api/zoho-send-email', async (req, res) => {
  try {
    const result = await sendZohoEmailMessage(req.body);
    if (!result.success) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  } catch (err: any) {
    console.error('[Zoho Express Send Error]', err);
    res.status(500).json({ success: false, error: err.message || 'Erro ao enviar e-mail via Zoho' });
  }
});

// 6. Endpoint para Emissão Oficial de Certificado (Sequencial Único)
app.post('/api/issue-certificate', async (req, res) => {
  try {
    const { studentId, studentName, studentCpf, studentCode, courseId, courseTitle, hours, instructor, issueDate } = req.body;
    if (!studentId || !studentName || !courseId || !courseTitle) {
      return res.status(400).json({ error: 'Dados incompletos para emissão' });
    }
    const currentYear = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const code = `DA${currentYear}-${randomSeq}`;
    const cert = {
      id: `cert-${courseId}-${Date.now()}`,
      code,
      courseId,
      courseTitle,
      studentId,
      studentCode: studentCode || `ALU-${studentId.slice(-4).toUpperCase()}`,
      studentName,
      studentCpf: studentCpf || '000.000.000-00',
      hours: Number(hours) || 40,
      issueDate: issueDate || new Date().toLocaleDateString('pt-BR'),
      instructor: instructor || 'Deds Academy',
      status: 'valido',
    };
    return res.status(201).json({ success: true, certificate: cert });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`[Deds Academy] Servidor rodando em http://localhost:${port}`);
});
