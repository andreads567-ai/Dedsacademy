import { processStripeWebhook } from '../src/api/stripeWebhookHandler';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed - Webhooks aceitam apenas requisições POST' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (parseErr) {
        console.error('[Stripe Webhook Error] Falha ao fazer parse do corpo JSON:', parseErr);
        return res.status(400).json({ error: 'Payload JSON inválido' });
      }
    }

    const result = await processStripeWebhook(payload);
    return res.status(200).json({ received: true, ...result });
  } catch (err: any) {
    console.error('[Stripe Webhook Error]', err);
    return res.status(400).json({
      received: false,
      error: err.message || 'Erro ao processar evento de webhook da Stripe',
    });
  }
}
