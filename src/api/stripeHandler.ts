/**
 * Stripe Checkout Session Creation Handler
 * Connects to Stripe API using the restricted live key.
 */

export interface CartItemPayload {
  id: string;
  title: string;
  price: number;
  quantity?: number;
  priceId?: string; // Optional pre-configured Stripe Price ID
  image?: string;
  instructor?: string;
}

export interface CreateSessionRequest {
  items: CartItemPayload[];
  studentEmail?: string;
  studentName?: string;
  studentCpf?: string;
  successUrl?: string;
  cancelUrl?: string;
  discountAmount?: number;
}

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

export async function createStripeCheckoutSession(payload: CreateSessionRequest, origin: string) {
  const secretKey = (typeof process !== 'undefined' && process.env?.STRIPE_SECRET_KEY) || '';
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY não está configurada no ambiente.');
  }

  const successUrl =
    payload.successUrl ||
    `${origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = payload.cancelUrl || `${origin}/?payment_status=cancel`;

  // Build line items
  const lineItems: any[] = [];

  const totalDiscount = Number(payload.discountAmount) || 0;
  const rawSubtotal = (payload.items || []).reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1),
    0
  );
  const discountRatio =
    rawSubtotal > 0 && totalDiscount > 0
      ? Math.max(0, (rawSubtotal - totalDiscount) / rawSubtotal)
      : 1;

  for (const item of payload.items || []) {
    if (item.priceId && item.priceId.startsWith('price_')) {
      lineItems.push({
        price: item.priceId,
        quantity: item.quantity || 1,
      });
    } else {
      // Calculate unit price after discount
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
              item.image && item.image.startsWith('https://')
                ? [item.image]
                : undefined,
          },
          unit_amount: finalUnitCents,
        },
        quantity: item.quantity || 1,
      });
    }
  }

  // Fallback item if cart was empty
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
    saved_payment_method_options: {
      payment_method_save: 'enabled',
    },
    origin_context: 'web',
    metadata: {
      student_email: payload.studentEmail || '',
      student_name: payload.studentName || '',
      student_cpf: payload.studentCpf || '',
      course_ids: (payload.items || []).map((i) => i.id).join(','),
    },
  };

  if (payload.studentEmail && payload.studentEmail.includes('@')) {
    sessionPayload.customer_email = payload.studentEmail.trim();
  }

  const formData = buildFormData(sessionPayload);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || 'Falha ao criar sessão de checkout na Stripe';
    console.error('[Stripe Error]', data);
    throw new Error(errorMsg);
  }

  return data;
}
