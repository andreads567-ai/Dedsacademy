/**
 * Vercel Serverless Function: /api/zoho-send-email
 * Sends transactional email via Zoho Mail API
 */
import { sendZohoEmailMessage } from '../src/api/zohoHandler';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const result = await sendZohoEmailMessage(body);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    console.error('[Vercel API Zoho Send Error]', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro interno ao enviar e-mail Zoho' });
  }
}
