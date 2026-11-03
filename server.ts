import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createStripeCheckoutSession } from './src/api/stripeHandler';
import { processStripeWebhook } from './src/api/stripeWebhookHandler';
import {
  exchangeZohoGrantToken,
  refreshZohoAccessToken,
  sendZohoEmailMessage,
} from './src/api/zohoHandler';
import {
  getPlatformData,
  savePlatformData,
  handleImageUpload,
  saveCertificate,
  findCertificateByCode,
} from './src/api/platformSyncHandler';

dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Identifica a raiz do projeto de forma resiliente tanto em dev quanto em produção (dist/server.js no Coolify/Docker)
const isInsideDist = path.basename(__dirname) === 'dist';
const projectRoot = isInsideDist ? path.resolve(__dirname, '..') : (process.cwd() || __dirname);
const distDir = isInsideDist ? __dirname : path.join(projectRoot, 'dist');
const publicDir = path.join(projectRoot, 'public');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// 0. Endpoints de Healthcheck dedicados (essenciais para Coolify, Docker e Hostinger)
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'Deds Academy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

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
    console.log('[Zoho Express /api/zoho-send-email Result]:', JSON.stringify(result));
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
    saveCertificate(cert);
    return res.status(201).json({ success: true, certificate: cert });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6.1 Endpoint para Validação Oficial de Certificados (Hostinger Database)
const handleValidateCertificate = (req: express.Request, res: express.Response) => {
  try {
    const rawCode = (req.query.codigo || req.query.code || req.body?.code) as string;
    if (!rawCode) {
      return res.status(400).json({ error: 'Código de certificado não informado.' });
    }
    const cert = findCertificateByCode(rawCode);
    if (!cert) {
      return res.status(404).json({ valid: false, error: 'Certificado não encontrado nos registros oficiais.' });
    }
    return res.status(200).json({
      valid: cert.status === 'valido',
      status: cert.status,
      certificate: cert,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro interno ao validar certificado' });
  }
};
app.get('/api/validate-certificate', handleValidateCertificate);
app.post('/api/validate-certificate', handleValidateCertificate);

// 7. Endpoint Central de Sincronização entre Navegadores (GET e POST) com Invalidação Ativada por Servidor
app.get('/api/platform-sync', (req, res) => {
  try {
    const data = getPlatformData();
    const etag = `W/"${data.version}"`;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', etag);
    res.setHeader('X-Platform-Version', String(data.version));

    const clientEtag = req.headers['if-none-match'];
    if (clientEtag && clientEtag === etag) {
      return res.status(304).end();
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao obter dados da plataforma' });
  }
});

app.post('/api/platform-sync', (req, res) => {
  try {
    const result = savePlatformData(req.body);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('ETag', `W/"${result.version}"`);
    res.setHeader('X-Platform-Version', String(result.version));
    res.json({ ...result, invalidated: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao sincronizar dados' });
  }
});

// 8. Endpoint de Upload Físico de Imagens Compartilhado para Todos os Navegadores
app.post('/api/upload-image', (req, res) => {
  try {
    const result = handleImageUpload(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao fazer upload da imagem' });
  }
});

// Servir diretório de uploads compartilhados tanto em dev quanto em prod
const uploadsDir = path.join(publicDir, 'uploads');
const distUploadsDir = path.join(distDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
}
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  }
}));
if (distUploadsDir !== uploadsDir && fs.existsSync(distUploadsDir)) {
  app.use('/uploads', express.static(distUploadsDir));
}

// Servir diretório do gerador oficial de certificados (index.html, style.css, script.js, frente.png, verso.png)
const certGenDir = path.join(publicDir, 'certificate-generator');
const certGenDistDir = path.join(distDir, 'certificate-generator');
const certGenFallback = path.join(projectRoot, 'certificate-generator');

app.use('/certificate-generator', (req, res, next) => {
  if (req.url === '' || req.url === '/') {
    req.url = '/index.html';
  }
  next();
});
app.use('/certificate-generator', express.static(certGenDistDir));
app.use('/certificate-generator', express.static(certGenDir));
app.use('/certificate-generator', express.static(certGenFallback));

// Serve static assets in production with fine-grained cache control
app.use(
  express.static(distDir, {
    setHeaders: (res, filePath) => {
      // 1. Never cache HTML files - always force validation
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      // 2. Vite hashed assets (immutable)
      else if (filePath.includes(`${path.sep}assets${path.sep}`) || /\/assets\//.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // 3. Static images and icons (stale-while-revalidate)
      else if (/\.(jpg|jpeg|png|webp|svg|gif|ico)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      }
    },
  })
);

const indexHtmlPath = path.join(distDir, 'index.html');

app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.status(200).send('<!DOCTYPE html><html><head><title>Deds Academy</title></head><body><h1>Deds Academy</h1><p>Aplicação online.</p></body></html>');
  }
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[Deds Academy] Servidor rodando em http://0.0.0.0:${port}`);
});
