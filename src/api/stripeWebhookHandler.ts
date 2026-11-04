import { getPlatformUsers, upsertPlatformUser } from './platformSyncHandler';
import { supabase } from '../lib/supabaseClient';
import { sendZohoEmailMessage } from './zohoHandler';

export interface StripeWebhookResult {
  success: boolean;
  event: string;
  message: string;
  studentEmail?: string;
  coursesEnrolled?: string[];
}

/**
 * Processes incoming Stripe webhook events (checkout.session.completed, charge.succeeded, etc.)
 * Automatically enrolls the student and updates database records in Hostinger local store.
 */
export async function processStripeWebhook(eventPayload: any): Promise<StripeWebhookResult> {
  const eventType = eventPayload?.type;
  const eventData = eventPayload?.data?.object;

  if (!eventType || !eventData) {
    throw new Error('Formato de evento Stripe inválido: type ou data.object ausente.');
  }

  console.log(`[Stripe Webhook] Recebido evento: ${eventType} (ID: ${eventPayload.id || 'sem_id'})`);

  // Registra auditoria do webhook diretamente no Supabase
  try {
    supabase.from('webhook_logs').insert({
      event_type: eventType,
      payload: eventPayload,
      status: 'received',
    }).then(({ error }) => {
      if (error) console.warn('[Stripe Webhook] Falha ao registrar log no Supabase:', error.message);
    });
  } catch (logErr) {
    console.warn('[Stripe Webhook] Erro ao gravar log no Supabase:', logErr);
  }

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

    // Persiste no armazenamento central do servidor Hostinger (platform-store.json)
    try {
      const users = getPlatformUsers();
      const existingUser = users.find((u: any) => u.email?.trim().toLowerCase() === normalizedEmail);

      if (existingUser) {
        const currentEnrolled = (existingUser.enrolledCourseIds as string[]) || (existingUser.enrolled_course_ids as string[]) || [];
        const updatedEnrolled = Array.from(new Set([...currentEnrolled, ...courseIds]));

        existingUser.enrolledCourseIds = updatedEnrolled;
        existingUser.status = 'ativo';
        if (!existingUser.name && customerName) existingUser.name = customerName;
        if (!existingUser.cpf && studentCpf) existingUser.cpf = studentCpf;

        upsertPlatformUser(existingUser);
        console.log(`[Stripe Webhook] Aluno existente ${normalizedEmail} matriculado nos cursos:`, courseIds);
      } else {
        const newUserId = `user-aluno-${Date.now()}`;
        const newUser = {
          id: newUserId,
          email: normalizedEmail,
          name: customerName,
          role: 'aluno',
          status: 'ativo',
          cpf: studentCpf || null,
          studentCode: `ALU-${Math.floor(1000 + Math.random() * 9000)}`,
          registeredAt: new Date().toISOString().split('T')[0],
          enrolledCourseIds: courseIds,
          completedCourseIds: [],
        };
        upsertPlatformUser(newUser);
        console.log(`[Stripe Webhook] Novo aluno cadastrado e matriculado com sucesso no Hostinger: ${normalizedEmail}`);
      }
    } catch (storeErr) {
      console.warn('[Stripe Webhook] Erro ao sincronizar aluno no Hostinger store:', storeErr);
    }

    // Persiste também na tabela users do Supabase
    try {
      const { data: dbUser } = await supabase.from('users').select('*').eq('email', normalizedEmail).maybeSingle();
      if (dbUser) {
        const currentEnrolled: string[] = dbUser.enrolled_course_ids || [];
        const updatedEnrolled = Array.from(new Set([...currentEnrolled, ...courseIds]));
        await supabase.from('users').update({
          enrolled_course_ids: updatedEnrolled,
          status: 'ativo',
          updated_at: new Date().toISOString(),
        }).eq('id', dbUser.id);
      } else {
        await supabase.from('users').insert({
          id: `user-aluno-${Date.now()}`,
          email: normalizedEmail,
          name: customerName,
          role: 'aluno',
          status: 'ativo',
          cpf: studentCpf || null,
          student_code: `ALU-${Math.floor(1000 + Math.random() * 9000)}`,
          registered_at: new Date().toLocaleDateString('pt-BR'),
          enrolled_course_ids: courseIds,
          completed_course_ids: [],
        });
      }
    } catch (sbUserErr) {
      console.warn('[Stripe Webhook] Erro ao sincronizar aluno no Supabase:', sbUserErr);
    }

    // Dispara e-mail de confirmação de pagamento e liberação de acesso
    try {
      sendZohoEmailMessage({
        to: normalizedEmail,
        toName: customerName,
        subject: '🎉 Matrícula Confirmada e Acesso Liberado - Deds Academy',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; border-radius: 12px; background: #0f172a; color: #f8fafc;">
            <h1 style="color: #00c0a0; margin-bottom: 8px;">Pagamento Confirmado!</h1>
            <p style="font-size: 16px; color: #94a3b8;">Olá, <strong>${customerName}</strong>! Seu pagamento foi processado com sucesso pela Stripe.</p>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #38bdf8;">Cursos Liberados:</p>
              <p style="margin: 4px 0 0; color: #cbd5e1;">${courseIds.join(', ')}</p>
            </div>
            <p style="font-size: 14px; color: #94a3b8;">Seu acesso imediato aos módulos e certificados oficiais com validade jurídica já está disponível na plataforma.</p>
            <div style="text-align: center; margin-top: 28px;">
              <a href="https://dedsacademy.com.br" style="background: #00c0a0; color: #000; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Acessar Área do Aluno</a>
            </div>
          </div>
        `,
      }).catch((mailErr) => console.warn('[Stripe Webhook] Falha no disparo de e-mail de pagamento:', mailErr));
    } catch (mailErr) {
      console.warn('[Stripe Webhook] Erro ao disparar notificação de pagamento:', mailErr);
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
