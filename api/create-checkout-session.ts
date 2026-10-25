import { createStripeCheckoutSession } from '../src/api/stripeHandler';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const origin = `${protocol}://${host}`;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const session = await createStripeCheckoutSession(body, origin);

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (error: any) {
    console.error('[Vercel API Stripe Error]', error);
    return res.status(500).json({ error: error.message || 'Erro ao processar Stripe Checkout' });
  }
}
