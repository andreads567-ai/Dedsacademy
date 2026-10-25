import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import { createStripeCheckoutSession } from './src/api/stripeHandler';
import { processStripeWebhook } from './src/api/stripeWebhookHandler';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  const stripeApiPlugin: Plugin = {
    name: 'stripe-checkout-api',
    configureServer(server) {
      // 1. Criar sessão de checkout
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

      // 2. Receber e processar Webhooks da Stripe (checkout.session.completed, charge.succeeded)
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
    },
  };

  return {
    plugins: [react(), tailwindcss(), stripeApiPlugin],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
