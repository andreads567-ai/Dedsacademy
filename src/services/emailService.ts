/**
 * Deds Academy - Serviço Integrado de E-mails & Notificações Transacionais
 * Suporta Zoho Mail (OAuth2 Self-Client), Resend, SendGrid e simulações com auditoria em Webhooks
 */

import { ApiIntegrationSettings, WebhookLogItem, UserAccount, Course, Coupon } from '../types';

export type EmailNotificationType =
  | 'welcome'
  | 'password_reset'
  | 'lesson_complete'
  | 'certificate'
  | 'new_coupon'
  | 'new_course'
  | 'admin_lead_alert'
  | 'test';

export interface SendEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  type: EmailNotificationType;
  metadata?: Record<string, any>;
  pdfAttachmentBase64?: string;
  pdfFilename?: string;
}

/**
 * Obtém as configurações atuais de e-mail do sistema
 */
export function getStoredApiSettings(): ApiIntegrationSettings | null {
  try {
    const saved = localStorage.getItem('deds_api_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('[EmailService] Erro ao carregar configurações:', err);
  }
  return null;
}

/**
 * Salva as configurações de integração
 */
export function saveStoredApiSettings(settings: ApiIntegrationSettings): void {
  try {
    localStorage.setItem('deds_api_settings', JSON.stringify(settings));
  } catch (err) {
    console.error('[EmailService] Erro ao salvar configurações:', err);
  }
}

/**
 * Registra um log de envio na aba de Webhooks & Conexões
 */
export function logEmailEvent(item: {
  event: string;
  recipient: string;
  status: '200 OK' | 'Falha' | 'Simulado';
  payload: Record<string, any>;
}) {
  try {
    const settings = getStoredApiSettings();
    if (!settings) return;

    const newLog: WebhookLogItem = {
      id: `email_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      service: 'email',
      event: item.event,
      statusCode: item.status === 'Falha' ? 500 : 200,
      payload: JSON.stringify(
        {
          to: item.recipient,
          timestamp: new Date().toISOString(),
          provider: settings.email.provider,
          ...item.payload,
        },
        null,
        2
      ),
      status: item.status === 'Falha' ? 'erro' : 'sucesso',
    };

    const updatedLogs = [newLog, ...(settings.webhooks || [])].slice(0, 50); // manter últimos 50 logs
    settings.webhooks = updatedLogs;
    saveStoredApiSettings(settings);
  } catch (e) {
    console.warn('[EmailService] Falha ao gravar log de auditoria:', e);
  }
}

/**
 * Gera o template HTML padrão com design oficial Deds Academy
 */
function wrapDedsTemplate(title: string, subtitle: string, contentHtml: string, ctaButton?: { text: string; url: string }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #080B10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E1E7EF; }
    .container { max-width: 600px; margin: 30px auto; background-color: #0F141C; border-radius: 16px; border: 1px solid #1E293B; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #092016 0%, #0F141C 100%); padding: 32px 28px; text-align: center; border-bottom: 1px solid rgba(0, 220, 130, 0.2); }
    .brand-title { color: #00DC82; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px 0; text-transform: uppercase; }
    .header-sub { color: #94A3B8; font-size: 13px; margin: 0; }
    .body { padding: 32px 28px; font-size: 14px; line-height: 1.6; color: #CBD5E1; }
    .cta-container { text-align: center; margin: 32px 0 24px 0; }
    .cta-btn { display: inline-block; background-color: #00DC82; color: #080B10 !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 12px; transition: 0.2s; box-shadow: 0 4px 15px rgba(0, 220, 130, 0.3); }
    .highlight-card { background-color: #17202D; border: 1px solid #2B394A; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
    .footer { background-color: #090C12; padding: 24px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #1A2230; }
    .footer a { color: #00DC82; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand-title">Deds Academy</h1>
      <p class="header-sub">${subtitle}</p>
    </div>
    <div class="body">
      <h2 style="color: #FFFFFF; font-size: 18px; margin-top: 0;">${title}</h2>
      ${contentHtml}
      ${
        ctaButton
          ? `<div class="cta-container">
              <a href="${ctaButton.url}" class="cta-btn" target="_blank">${ctaButton.text}</a>
            </div>`
          : ''
      }
    </div>
    <div class="footer">
      <p>Mensagem automática enviada pela plataforma <strong>Deds Academy</strong>.</p>
      <p>&copy; ${new Date().getFullYear()} Deds Academy. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Disparador central de e-mails
 */
export async function sendEmail(payload: SendEmailPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}> {
  const settings = getStoredApiSettings();
  const emailConfig = settings?.email;

  // Checagem de flags ativas conforme os 5 fluxos solicitados
  if (emailConfig) {
    if (payload.type === 'welcome' && emailConfig.notifyOnWelcome === false) {
      console.log('[EmailService] Notificação de Boas-Vindas está desativada.');
      return { success: true, simulated: true };
    }
    if (payload.type === 'password_reset' && emailConfig.notifyOnPasswordReset === false) {
      console.log('[EmailService] Notificação de Recuperação de Senha está desativada.');
      return { success: true, simulated: true };
    }
    if (payload.type === 'lesson_complete' && emailConfig.notifyOnLessonComplete === false) {
      console.log('[EmailService] Notificação de Conclusão de Aula está desativada.');
      return { success: true, simulated: true };
    }
    if (payload.type === 'certificate' && emailConfig.notifyOnCertificate === false) {
      console.log('[EmailService] Notificação de Certificado está desativada.');
      return { success: true, simulated: true };
    }
    if (payload.type === 'new_coupon' && emailConfig.notifyOnNewCoupon === false) {
      console.log('[EmailService] Notificação de Cupons está desativada.');
      return { success: true, simulated: true };
    }
    if (payload.type === 'new_course' && emailConfig.notifyOnNewCourse === false) {
      console.log('[EmailService] Notificação de Novos Cursos está desativada.');
      return { success: true, simulated: true };
    }
  }

  // Tenta enviar via endpoint da API Zoho no backend
  try {
    const res = await fetch('/api/zoho-send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: payload.to,
        toName: payload.toName,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        fromEmail: emailConfig?.fromEmail || emailConfig?.zohoUser || 'contato@dedsacademy.com.br',
        fromName: emailConfig?.fromName || 'Deds Academy',
        replyTo: emailConfig?.replyToEmail || emailConfig?.fromEmail,
        clientId: emailConfig?.zohoClientId,
        clientSecret: emailConfig?.zohoClientSecret,
        refreshToken: emailConfig?.zohoRefreshToken,
        accessToken: emailConfig?.zohoAccessToken,
        region: emailConfig?.zohoRegion || 'com.br',
        accountId: emailConfig?.zohoAccountId,
        pdfAttachmentBase64: payload.pdfAttachmentBase64,
        pdfFilename: payload.pdfFilename,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      logEmailEvent({
        event: `email.${payload.type}`,
        recipient: payload.to,
        status: '200 OK',
        payload: { subject: payload.subject, messageId: data.messageId, provider: emailConfig?.provider || 'zoho' },
      });
      return { success: true, messageId: data.messageId };
    }
  } catch (err) {
    // Se a API backend não estiver alcançável (ou estático), fallback controlado
    console.warn('[EmailService] Fallback de simulação ativado:', err);
  }

  // Fallback simulado com registro em auditoria
  const simulatedId = `sim_msg_${Date.now()}`;
  logEmailEvent({
    event: `email.${payload.type}`,
    recipient: payload.to,
    status: 'Simulado',
    payload: {
      subject: payload.subject,
      simulatedId,
      notice: 'Disparo simulado registrado com sucesso.',
    },
  });

  return { success: true, messageId: simulatedId, simulated: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Notificação de Boas-Vindas e Orientação de Acesso
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(user: UserAccount, appUrl: string = window.location.origin) {
  const content = `
    <p>Olá, <strong>${user.name}</strong>!</p>
    <p>Seja muito bem-vindo(a) à <strong>Deds Academy</strong>! Sua conta de aluno foi criada com sucesso e você já possui acesso imediato ao ambiente acadêmico da nossa plataforma.</p>
    
    <div class="highlight-card">
      <h3 style="margin-top: 0; color: #00DC82; font-size: 14px;">📋 Seus Dados de Acesso</h3>
      <p style="margin: 4px 0;"><strong>E-mail cadastrado:</strong> ${user.email}</p>
      <p style="margin: 4px 0;"><strong>Código de Matrícula:</strong> <span style="font-family: monospace; color: #38BDF8;">${user.studentCode || 'ALU-NOVO'}</span></p>
      <p style="margin: 4px 0;"><strong>Status da Conta:</strong> Ativa &amp; Liberada</p>
    </div>

    <h4 style="color: #FFFFFF; font-size: 14px; margin-bottom: 8px;">🚀 Primeiros Passos:</h4>
    <ol style="padding-left: 20px; margin: 0 0 16px 0;">
      <li>Acesse o portal do aluno com seu e-mail e senha.</li>
      <li>Navegue até a seção <strong>Meus Cursos</strong> para dar início às aulas.</li>
      <li>Conclua as etapas, responda aos quizzes e emita seu certificado oficial com autenticação em tempo real!</li>
    </ol>
  `;

  const html = wrapDedsTemplate(
    'Sua jornada de aprendizado começa agora!',
    'Boas-vindas ao Portal Oficial do Aluno',
    content,
    { text: 'Acessar Meu Painel de Estudos', url: `${appUrl}/aluno` }
  );

  // Envia ao aluno
  const result = await sendEmail({
    to: user.email,
    toName: user.name,
    subject: '🎓 Bem-vindo(a) à Deds Academy! Acesse suas aulas e orientações',
    html,
    type: 'welcome',
    metadata: { userId: user.id, studentCode: user.studentCode },
  });

  // Notifica o time admin caso configurado
  const settings = getStoredApiSettings();
  if (settings?.email?.adminAlertEmail) {
    await sendAdminLeadAlert(user, appUrl);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Alerta de Novo Aluno/Lead para a Equipe Admin
// ─────────────────────────────────────────────────────────────────────────────
export async function sendAdminLeadAlert(user: UserAccount, appUrl: string = window.location.origin) {
  const settings = getStoredApiSettings();
  const adminEmail = settings?.email?.adminAlertEmail;
  if (!adminEmail) return;

  const content = `
    <p>Um novo aluno acaba de se cadastrar na plataforma Deds Academy:</p>
    <div class="highlight-card">
      <p style="margin: 4px 0;"><strong>Nome:</strong> ${user.name}</p>
      <p style="margin: 4px 0;"><strong>E-mail:</strong> ${user.email}</p>
      <p style="margin: 4px 0;"><strong>Código do Aluno:</strong> ${user.studentCode || 'N/A'}</p>
      <p style="margin: 4px 0;"><strong>Telefone / WhatsApp:</strong> ${user.phone || 'Não informado'}</p>
      <p style="margin: 4px 0;"><strong>Data de Cadastro:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    </div>
  `;

  const html = wrapDedsTemplate(
    'Novo Lead / Cadastro Realizado',
    'Painel Administrativo Deds Academy',
    content,
    { text: 'Ver Alunos no Painel Admin', url: `${appUrl}/admin` }
  );

  return sendEmail({
    to: adminEmail,
    toName: 'Administrador Deds Academy',
    subject: `🔔 Novo Aluno Cadastrado: ${user.name} (${user.email})`,
    html,
    type: 'admin_lead_alert',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Notificação de Recuperação de Senha
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(targetEmail: string, resetToken: string = `tok_${Date.now()}`, appUrl: string = window.location.origin) {
  const resetUrl = `${appUrl}/redefinir-senha?token=${resetToken}&email=${encodeURIComponent(targetEmail)}`;

  const content = `
    <p>Olá,</p>
    <p>Recebemos uma solicitação para redefinir a senha de acesso da sua conta na <strong>Deds Academy</strong> associada a <strong>${targetEmail}</strong>.</p>
    
    <div class="highlight-card" style="text-align: center;">
      <p style="margin: 0; color: #94A3B8; font-size: 12px;">Código de Segurança para Redefinição Direta:</p>
      <p style="font-size: 24px; font-weight: 800; font-family: monospace; color: #00DC82; letter-spacing: 4px; margin: 8px 0;">
        ${Math.floor(100000 + Math.random() * 900000)}
      </p>
      <p style="margin: 0; color: #64748B; font-size: 11px;">Este código e link expiram em 2 horas.</p>
    </div>

    <p style="font-size: 12px; color: #94A3B8;">
      Se você não realizou essa solicitação, pode ignorar este e-mail com segurança. Sua senha permanecerá inalterada e sua conta protegida.
    </p>
  `;

  const html = wrapDedsTemplate(
    'Instruções para Redefinição de Senha',
    'Segurança & Proteção de Acesso',
    content,
    { text: 'Redefinir Minha Senha com Segurança', url: resetUrl }
  );

  return sendEmail({
    to: targetEmail,
    subject: '🔒 Deds Academy: Solicitação de Redefinição de Senha',
    html,
    type: 'password_reset',
    metadata: { targetEmail, resetToken },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Notificação de Conclusão de Aula e Emissão de Certificado
// ─────────────────────────────────────────────────────────────────────────────
export async function sendLessonCompleteEmail(params: {
  studentEmail: string;
  studentName: string;
  courseTitle: string;
  lessonTitle: string;
  progressPercent: number;
  appUrl?: string;
}) {
  const { studentEmail, studentName, courseTitle, lessonTitle, progressPercent, appUrl = window.location.origin } = params;

  const content = `
    <p>Parabéns, <strong>${studentName}</strong>!</p>
    <p>Você concluiu com sucesso mais uma aula na sua jornada acadêmica:</p>
    
    <div class="highlight-card">
      <p style="margin: 4px 0;"><strong>Curso:</strong> ${courseTitle}</p>
      <p style="margin: 4px 0;"><strong>Aula Concluída:</strong> <span style="color: #00DC82;">✔ ${lessonTitle}</span></p>
      <p style="margin: 4px 0;"><strong>Seu Progresso no Curso:</strong> <strong>${progressPercent}% concluído</strong></p>
    </div>

    <p>Continue nesse ritmo! A cada aula finalizada você fica mais próximo(a) da emissão do seu <strong>Certificado Oficial</strong>.</p>
  `;

  const html = wrapDedsTemplate(
    'Etapa Concluída com Sucesso! 🎯',
    'Progresso Acadêmico do Aluno',
    content,
    { text: 'Continuar Próxima Aula', url: `${appUrl}/aluno` }
  );

  return sendEmail({
    to: studentEmail,
    toName: studentName,
    subject: `🎯 Aula Concluída no curso "${courseTitle}" (${progressPercent}%)`,
    html,
    type: 'lesson_complete',
  });
}

export async function sendCertificateEmail(params: {
  studentEmail: string;
  studentName: string;
  courseTitle: string;
  hours: number;
  instructor?: string;
  certCode: string;
  pdfAttachmentBase64?: string;
  appUrl?: string;
}) {
  const { studentEmail, studentName, courseTitle, hours, instructor = 'Deds Academy', certCode, pdfAttachmentBase64, appUrl = window.location.origin } = params;

  const content = `
    <p>Parabéns, <strong>${studentName}</strong>!</p>
    <p>É com grande orgulho que informamos que você concluiu 100% de todos os módulos e avaliações do curso <strong>${courseTitle}</strong>!</p>
    
    <div class="highlight-card" style="border-color: #00DC82; background: linear-gradient(135deg, #092016 0%, #17202D 100%);">
      <h3 style="margin-top: 0; color: #00DC82; font-size: 15px;">📜 Dados do seu Certificado Oficial</h3>
      <p style="margin: 4px 0;"><strong>Curso:</strong> ${courseTitle}</p>
      <p style="margin: 4px 0;"><strong>Carga Horária:</strong> ${hours} horas certificadas</p>
      <p style="margin: 4px 0;"><strong>Instrutor Responsável:</strong> ${instructor}</p>
      <p style="margin: 4px 0;"><strong>Código de Autenticidade:</strong> <span style="font-family: monospace; color: #38BDF8; font-weight: bold;">${certCode}</span></p>
      <p style="margin: 4px 0;"><strong>Status:</strong> Válido e Autenticado com QR Code</p>
    </div>

    <p>O arquivo PDF do seu certificado foi gerado e está anexado a este e-mail para download imediato. Você também pode acessá-lo e compartilhá-lo no LinkedIn a qualquer momento pelo portal do aluno.</p>
  `;

  const html = wrapDedsTemplate(
    'Parabéns pela Conclusão do Curso! 🏆',
    'Emissão Oficial de Certificado de Conclusão',
    content,
    { text: 'Acessar e Baixar Certificado Oficial', url: `${appUrl}/aluno` }
  );

  return sendEmail({
    to: studentEmail,
    toName: studentName,
    subject: `🏆 Parabéns! Seu Certificado de Conclusão em "${courseTitle}" foi emitido`,
    html,
    type: 'certificate',
    pdfAttachmentBase64,
    pdfFilename: `Certificado_${certCode}.pdf`,
    metadata: { certCode, courseTitle },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Notificação de Divulgação de Cupons de Desconto
// ─────────────────────────────────────────────────────────────────────────────
export async function sendCouponBroadcastEmail(params: {
  coupon: Coupon;
  students: UserAccount[];
  appUrl?: string;
}) {
  const { coupon, students, appUrl = window.location.origin } = params;
  if (!students || students.length === 0) return { success: true, count: 0 };

  const discountText = coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `R$ ${coupon.discountValue} de desconto`;

  const content = `
    <p>Olá, estudante da <strong>Deds Academy</strong>!</p>
    <p>Temos uma excelente novidade para impulsionar a sua carreira e acelerar seu aprendizado:</p>
    
    <div class="highlight-card" style="text-align: center; border-color: #F59E0B;">
      <p style="margin: 0; color: #F59E0B; font-weight: 700; font-size: 12px; text-transform: uppercase;">Super Oferta Liberada</p>
      <h2 style="margin: 8px 0; color: #FFFFFF; font-size: 26px;">${discountText}</h2>
      <div style="display: inline-block; background-color: #0F141C; padding: 8px 24px; border-radius: 8px; border: 1px dashed #F59E0B; margin: 8px 0;">
        <span style="font-family: monospace; font-size: 20px; font-weight: 800; color: #F59E0B; letter-spacing: 2px;">${coupon.code}</span>
      </div>
      <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 11px;">
        Válido até <strong>${coupon.endDateTime ? new Date(coupon.endDateTime).toLocaleDateString('pt-BR') : 'tempo limitado'}</strong> ou até esgotarem os usos disponíveis.
      </p>
    </div>

    <p>Aproveite agora para se inscrever em novos cursos do catálogo com desconto especial aplicado diretamente no carrinho!</p>
  `;

  const html = wrapDedsTemplate(
    'Cupom de Desconto Exclusivo Liberado! 🎁',
    'Oferta Especial Deds Academy',
    content,
    { text: 'Explorar Cursos com o Cupom', url: `${appUrl}/#catalogo` }
  );

  let sentCount = 0;
  // Dispara para até 15 alunos de forma controlada
  for (const student of students.slice(0, 15)) {
    if (student.email) {
      await sendEmail({
        to: student.email,
        toName: student.name,
        subject: `🎁 Cupom Especial ${coupon.code}: Garanta ${discountText} nos seus próximos cursos`,
        html,
        type: 'new_coupon',
        metadata: { couponCode: coupon.code, discountText },
      });
      sentCount++;
    }
  }

  return { success: true, count: sentCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Notificação de Divulgação de Cursos Novos
// ─────────────────────────────────────────────────────────────────────────────
export async function sendNewCourseBroadcastEmail(params: {
  course: Course;
  students: UserAccount[];
  appUrl?: string;
}) {
  const { course, students, appUrl = window.location.origin } = params;
  if (!students || students.length === 0) return { success: true, count: 0 };

  const content = `
    <p>Olá, estudante!</p>
    <p>Acabamos de lançar um curso inédito no catálogo da <strong>Deds Academy</strong> para elevar ainda mais as suas habilidades:</p>
    
    <div class="highlight-card" style="border-color: #00DC82;">
      <h3 style="margin-top: 0; color: #00DC82; font-size: 17px;">${course.title}</h3>
      <p style="margin: 4px 0; color: #CBD5E1;">${course.description}</p>
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #2B394A; display: flex; gap: 16px; font-size: 12px; color: #94A3B8;">
        <span><strong>Categoria:</strong> ${course.category}</span>
        <span><strong>Carga Horária:</strong> ${course.hours} horas</span>
        <span><strong>Nível:</strong> ${course.level}</span>
      </div>
    </div>

    <p>As matrículas já estão abertas com acesso vitalício, material de apoio e emissão do certificado oficial!</p>
  `;

  const html = wrapDedsTemplate(
    'Novo Lançamento no Catálogo! 🚀',
    'Lançamentos & Novidades Acadêmicas',
    content,
    { text: 'Conhecer o Novo Curso', url: `${appUrl}/#curso-${course.id}` }
  );

  let sentCount = 0;
  for (const student of students.slice(0, 15)) {
    if (student.email) {
      await sendEmail({
        to: student.email,
        toName: student.name,
        subject: `🚀 Novo Curso Lançado na Deds Academy: "${course.title}"`,
        html,
        type: 'new_course',
        metadata: { courseId: course.id, courseTitle: course.title },
      });
      sentCount++;
    }
  }

  return { success: true, count: sentCount };
}
