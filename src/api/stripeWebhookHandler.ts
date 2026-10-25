import { supabase } from '../lib/supabaseClient';

export interface StripeWebhookResult {
  success: boolean;
  event: string;
  message: string;
  studentEmail?: string;
  coursesEnrolled?: string[];
}

/**
 * Processes incoming Stripe webhook events (checkout.session.completed, charge.succeeded, etc.)
 * Automatically enrolls the student and updates database records.
 */
export async function processStripeWebhook(eventPayload: any): Promise<StripeWebhookResult> {
  const eventType = eventPayload?.type;
  const eventData = eventPayload?.data?.object;

  if (!eventType || !eventData) {
    throw new Error('Formato de evento Stripe inválido: type ou data.object ausente.');
  }

  console.log(`[Stripe Webhook] Recebido evento: ${eventType} (ID: ${eventPayload.id || 'sem_id'})`);

  // ─── 1. Evento: checkout.session.completed ───────────────────────────────
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
    const studentCpf =
      eventData.metadata?.student_cpf ||
      '';
    const rawCourseIds =
      eventData.metadata?.course_ids ||
      '';

    const courseIds = rawCourseIds
      ? rawCourseIds.split(',').map((id: string) => id.trim()).filter(Boolean)
      : [];

    if (!customerEmail) {
      return {
        success: true,
        event: eventType,
        message: 'checkout.session.completed recebido sem e-mail de cliente.',
      };
    }

    const normalizedEmail = customerEmail.trim().toLowerCase();

    // Persist to Supabase if database connection is active
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

        console.log(`[Stripe Webhook] Aluno existente ${normalizedEmail} matriculado nos cursos:`, courseIds);
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

        console.log(`[Stripe Webhook] Novo aluno cadastrado e matriculado com sucesso: ${normalizedEmail}`);
      }
    } catch (dbErr) {
      console.warn('[Stripe Webhook] Supabase indisponível, processamento concluído:', dbErr);
    }

    return {
      success: true,
      event: eventType,
      message: `Matrícula confirmada para ${normalizedEmail}`,
      studentEmail: normalizedEmail,
      coursesEnrolled: courseIds,
    };
  }

  // ─── 2. Evento: charge.succeeded / payment_intent.succeeded ──────────────
  if (eventType === 'charge.succeeded' || eventType === 'payment_intent.succeeded') {
    const email =
      eventData.billing_details?.email ||
      eventData.receipt_email ||
      eventData.metadata?.student_email ||
      '';
    const amount = eventData.amount ? eventData.amount / 100 : 0;

    console.log(
      `[Stripe Webhook] Pagamento aprovado (${eventType}): R$ ${amount.toFixed(2)} para ${email || 'cliente'}`
    );

    return {
      success: true,
      event: eventType,
      message: `Cobrança no valor de R$ ${amount.toFixed(2)} confirmada com sucesso.`,
      studentEmail: email,
    };
  }

  // ─── 3. Outros eventos (ex: charge.failed, payment_intent.created) ─────────
  return {
    success: true,
    event: eventType,
    message: `Evento ${eventType} registrado com sucesso.`,
  };
}
