/**
 * Vercel Serverless Function: /api/stripe-webhook
 * Self-contained Stripe webhook handler.
 * Receives and processes events from Stripe (checkout.session.completed, charge.succeeded, etc.)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://fexbpxuvyijvsqzsfyhn.supabase.co';

const SUPABASE_KEY =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGJweHV2eWlqdnNxenNmeWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNTI1NzksImV4cCI6MjA2MTYyODU3OX0.aD4t5bE8_8Pj4H-68UsqqV9R9tV4iS2iG1o3v7a8u_0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req: any, res: any) {
  // 1. CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Health check / ping via GET in browser
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: 'Deds Academy Stripe Webhook Endpoint',
      timestamp: new Date().toISOString(),
      acceptedEvents: [
        'checkout.session.completed',
        'charge.succeeded',
        'payment_intent.succeeded',
      ],
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    return res.status(405).json({ error: 'Method Not Allowed - Aceita requisições POST' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (parseErr) {
        console.error('[Stripe Webhook Parse Error]', parseErr);
        return res.status(400).json({ error: 'Payload JSON inválido' });
      }
    }

    const eventType = payload?.type;
    const eventData = payload?.data?.object;

    if (!eventType || !eventData) {
      return res.status(400).json({ error: 'Formato de evento Stripe inválido' });
    }

    console.log(`[Stripe Webhook] Recebido evento: ${eventType} (ID: ${payload.id || 'sem_id'})`);

    // Handle checkout.session.completed
    if (eventType === 'checkout.session.completed') {
      const customerEmail =
        eventData.customer_details?.email ||
        eventData.customer_email ||
        eventData.metadata?.student_email ||
        '';
      const customerName =
        eventData.customer_details?.name ||
        eventData.metadata?.student_name ||
        'Aluno Deds Academy';
      const studentCpf = eventData.metadata?.student_cpf || '';
      const rawCourseIds = eventData.metadata?.course_ids || '';

      const courseIds = rawCourseIds
        ? rawCourseIds.split(',').map((id: string) => id.trim()).filter(Boolean)
        : [];

      if (customerEmail) {
        const normalizedEmail = customerEmail.trim().toLowerCase();
        try {
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();

          if (existingUser) {
            const currentEnrolled = (existingUser.enrolled_course_ids as string[]) || [];
            const updatedEnrolled = Array.from(new Set([...currentEnrolled, ...courseIds]));

            await supabase
              .from('users')
              .update({
                enrolled_course_ids: updatedEnrolled,
                status: 'ativo',
                name: existingUser.name || customerName,
                cpf: existingUser.cpf || studentCpf || null,
              })
              .eq('id', existingUser.id);

            console.log(`[Stripe Webhook] Aluno existente atualizado: ${normalizedEmail}`);
          } else {
            const newUserId = `user-aluno-${Date.now()}`;
            await supabase.from('users').insert({
              id: newUserId,
              email: normalizedEmail,
              name: customerName,
              role: 'aluno',
              status: 'ativo',
              cpf: studentCpf || null,
              student_code: `ALU-${Math.floor(1000 + Math.random() * 9000)}`,
              registered_at: new Date().toISOString().split('T')[0],
              enrolled_course_ids: courseIds,
              completed_course_ids: [],
            });

            console.log(`[Stripe Webhook] Novo aluno cadastrado: ${normalizedEmail}`);
          }
        } catch (dbErr) {
          console.warn('[Stripe Webhook] Supabase sync aviso:', dbErr);
        }
      }

      return res.status(200).json({ received: true, event: eventType });
    }

    // Handle charge.succeeded or payment_intent.succeeded
    if (eventType === 'charge.succeeded' || eventType === 'payment_intent.succeeded') {
      const email =
        eventData.billing_details?.email ||
        eventData.receipt_email ||
        eventData.metadata?.student_email ||
        '';
      const amount = eventData.amount ? eventData.amount / 100 : 0;
      console.log(`[Stripe Webhook] Pagamento confirmado: R$ ${amount.toFixed(2)} para ${email || 'aluno'}`);
      return res.status(200).json({ received: true, event: eventType });
    }

    return res.status(200).json({ received: true, event: eventType });
  } catch (err: any) {
    console.error('[Stripe Webhook Error]', err);
    return res.status(200).json({ received: true, warning: err.message });
  }
}
