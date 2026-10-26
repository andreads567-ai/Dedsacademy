/**
 * Vercel Serverless Function: /api/create-checkout-session
 * Self-contained Stripe Checkout Session creator with CORS and safe error handling.
 */

function buildFormData(data: any, form = new URLSearchParams(), parentKey = ''): URLSearchParams {
  if (data === null || data === undefined) return form;
  if (typeof data === 'object' && !(data instanceof Date)) {
    if (Array.isArray(data)) {
      data.forEach((val, idx) => {
        buildFormData(val, form, `${parentKey}[${idx}]`);
      });
    } else {
      Object.keys(data).forEach((key) => {
        const fullKey = parentKey ? `${parentKey}[${key}]` : key;
        buildFormData(data[key], form, fullKey);
      });
    }
  } else {
    form.append(parentKey, String(data));
  }
  return form;
}

export default async function handler(req: any, res: any) {
  // 1. CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    const secretKey =
      (typeof process !== 'undefined' &&
        (process.env?.STRIPE_SECRET_KEY || process.env?.STRIPE_API_KEY)) ||
      '';

    if (!secretKey) {
      console.error('[Stripe Config Error] STRIPE_SECRET_KEY não encontrada nas variáveis de ambiente da Vercel.');
      return res.status(400).json({
        error:
          'Chave secreta da Stripe (STRIPE_SECRET_KEY) não foi configurada nas Variáveis de Ambiente da Vercel. Por favor configure STRIPE_SECRET_KEY no painel da Vercel (Project Settings > Environment Variables).',
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'dedsacademy.vercel.app';
    const origin =
      req.headers['origin'] ||
      (req.headers['referer'] ? req.headers['referer'].replace(/\/$/, '') : `${protocol}://${host}`);

    const successUrl =
      body.successUrl || `${origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${origin}/?payment_status=cancel`;

    // Build line items
    const lineItems: any[] = [];
    const totalDiscount = Number(body.discountAmount) || 0;
    const rawSubtotal = (body.items || []).reduce(
      (sum: number, it: any) => sum + (Number(it.price) || 0) * (it.quantity || 1),
      0
    );
    const discountRatio =
      rawSubtotal > 0 && totalDiscount > 0
        ? Math.max(0, (rawSubtotal - totalDiscount) / rawSubtotal)
        : 1;

    for (const item of body.items || []) {
      if (item.priceId && String(item.priceId).startsWith('price_')) {
        lineItems.push({
          price: item.priceId,
          quantity: item.quantity || 1,
        });
      } else {
        const calculatedUnit = (Number(item.price) || 0) * discountRatio;
        const finalUnitCents = Math.max(100, Math.round(calculatedUnit * 100)); // Minimum 1 BRL (100 cents)

        lineItems.push({
          price_data: {
            currency: 'brl',
            product_data: {
              name: item.title,
              description: item.instructor
                ? `Instrutor: ${item.instructor}`
                : 'Deds Academy - Curso com Certificado Oficial',
              images:
                item.image && typeof item.image === 'string' && item.image.startsWith('https://')
                  ? [item.image]
                  : undefined,
            },
            unit_amount: finalUnitCents,
          },
          quantity: item.quantity || 1,
        });
      }
    }

    if (lineItems.length === 0) {
      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Curso Deds Academy',
          },
          unit_amount: 1000,
        },
        quantity: 1,
      });
    }

    const sessionPayload: Record<string, any> = {
      mode: 'payment',
      ui_mode: 'hosted_page',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: lineItems,
      billing_address_collection: 'auto',
      name_collection: {
        individual: {
          enabled: true,
          optional: true,
        },
        business: {
          enabled: true,
          optional: true,
        },
      },
      allow_promotion_codes: true,
      submit_type: 'auto',
      integration_identifier: 'hosted_web_0003',
      customer_creation: 'always',
      origin_context: 'web',
      metadata: {
        student_email: body.studentEmail || '',
        student_name: body.studentName || '',
        student_cpf: body.studentCpf || '',
        course_ids: (body.items || []).map((i: any) => i.id).join(','),
      },
    };

    if (body.studentEmail && String(body.studentEmail).includes('@')) {
      sessionPayload.customer_email = String(body.studentEmail).trim();
    }

    const formData = buildFormData(sessionPayload);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('[Stripe API Error Response]', data);
      const errorMsg = data?.error?.message || 'Falha ao gerar sessão de checkout na Stripe';
      return res.status(stripeRes.status || 400).json({ error: errorMsg, details: data });
    }

    return res.status(200).json({ url: data.url, id: data.id });
  } catch (error: any) {
    console.error('[Vercel API Stripe Catch Error]', error);
    return res.status(500).json({
      error: error.message || 'Erro inesperado ao criar sessão de pagamento na Stripe',
    });
  }
}
