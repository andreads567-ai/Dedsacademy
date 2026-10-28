import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  const localApiPlugin: Plugin = {
    name: 'local-backend-api-plugin',
    configureServer(server) {
      // 1. Criar sessão de checkout no servidor local
      server.middlewares.use('/api/create-checkout-session', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const host = req.headers.host || 'localhost:3000';
            const origin = `${protocol}://${host}`;

            const { createStripeCheckoutSession } = await import('./src/api/stripeHandler');
            const session = await createStripeCheckoutSession(parsedBody, origin);

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ url: session.url, id: session.id }));
          } catch (err: any) {
            console.error('[API Stripe Error]', err);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(
              JSON.stringify({ error: err.message || 'Erro interno ao processar pagamento Stripe' })
            );
          }
        });
      });

      // 2. Receber e processar Webhooks da Stripe no servidor local
      server.middlewares.use('/api/stripe-webhook', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            const { processStripeWebhook } = await import('./src/api/stripeWebhookHandler');
            const result = await processStripeWebhook(parsedBody);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ received: true, ...result }));
          } catch (err: any) {
            console.error('[API Webhook Error]', err);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({ error: err.message || 'Erro ao processar webhook' }));
          }
        });
      });

      // 3. Trocar Grant Token do Zoho Mail (OAuth2 Self-Client)
      server.middlewares.use('/api/zoho-auth', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            const { exchangeZohoGrantToken } = await import('./src/api/zohoHandler');
            const result = await exchangeZohoGrantToken(parsedBody);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = result.success ? 200 : 400;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            console.error('[API Zoho Auth Error]', err);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message || 'Erro ao autenticar Zoho' }));
          }
        });
      });

      // 4. Renovar Access Token Zoho via Refresh Token permanente
      server.middlewares.use('/api/zoho-refresh', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            const { refreshZohoAccessToken } = await import('./src/api/zohoHandler');
            const result = await refreshZohoAccessToken(parsedBody);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = result.success ? 200 : 400;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            console.error('[API Zoho Refresh Error]', err);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message || 'Erro ao renovar token' }));
          }
        });
      });

      // 5. Enviar e-mail via API REST do Zoho Mail
      server.middlewares.use('/api/zoho-send-email', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            const { sendZohoEmailMessage } = await import('./src/api/zohoHandler');
            const result = await sendZohoEmailMessage(parsedBody);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = result.success ? 200 : 400;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            console.error('[API Zoho Send Error]', err);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message || 'Erro ao enviar e-mail' }));
          }
        });
      });

      // 6. Sincronização central da plataforma (GET e POST)
      server.middlewares.use('/api/platform-sync', async (req, res) => {
        const { getPlatformData, savePlatformData } = await import('./src/api/platformSyncHandler');
        if (req.method === 'GET') {
          try {
            const data = getPlatformData();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              const result = savePlatformData(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      });

      // 7. Upload físico de imagens compartilhado
      server.middlewares.use('/api/upload-image', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const { handleImageUpload } = await import('./src/api/platformSyncHandler');
            const result = handleImageUpload(parsed);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = result.success ? 200 : 400;
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
    },
  };

  return {
    plugins: [react(), tailwindcss(), localApiPlugin],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
