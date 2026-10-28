import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlatformData, savePlatformData } from '../src/api/platformSyncHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, If-None-Match'
  );
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const data = getPlatformData();
      const etag = `W/"${data.version}"`;
      res.setHeader('ETag', etag);
      res.setHeader('X-Platform-Version', String(data.version));

      const clientEtag = req.headers['if-none-match'];
      if (clientEtag && clientEtag === etag) {
        return res.status(304).end();
      }

      return res.status(200).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Erro ao consultar dados sincronizados' });
    }
  }

  if (req.method === 'POST') {
    try {
      const result = savePlatformData(req.body);
      res.setHeader('X-Platform-Version', String(result.version));
      res.setHeader('ETag', `W/"${result.version}"`);
      return res.status(200).json({ ...result, invalidated: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Erro ao sincronizar dados' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
