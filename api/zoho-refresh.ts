/**
 * Vercel Serverless Function: /api/zoho-refresh
 * Refreshes Zoho Access Token using permanent Refresh Token
 */
import { refreshZohoAccessToken } from '../src/api/zohoHandler';

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
    const result = await refreshZohoAccessToken(body);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    console.error('[Vercel API Zoho Refresh Error]', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro interno ao renovar token Zoho' });
  }
}
