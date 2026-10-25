import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createStripeCheckoutSession } from './src/api/stripeHandler';
import { processStripeWebhook } from './src/api/stripeWebhookHandler';

dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`[Deds Academy] Servidor rodando em http://localhost:${port}`);
});
