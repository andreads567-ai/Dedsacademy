/**
 * Zoho Mail API & OAuth2 Integration Handler
 * Deds Academy - Integração Oficial Zoho Mail (Self-Client)
 */

export interface ZohoExchangeTokenParams {
  grantToken: string;
  clientId: string;
  clientSecret: string;
  region?: 'com' | 'com.br' | 'eu' | 'in' | 'com.au';
  redirectUri?: string;
}

export interface ZohoRefreshTokenParams {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  region?: 'com' | 'com.br' | 'eu' | 'in' | 'com.au';
}

export interface ZohoSendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  region?: 'com' | 'com.br' | 'eu' | 'in' | 'com.au';
  accountId?: string;
  pdfAttachmentBase64?: string;
  pdfFilename?: string;
}

// Domínios OAuth por Região Zoho
// NOTA TÉCNICA: O Zoho NÃO possui os domínios accounts.zoho.com.br e mail.zoho.com.br no DNS mundial.
// Todas as contas criadas no Brasil e América Latina residem no Data Center Global/EUA (accounts.zoho.com e mail.zoho.com).
// Mapeamos 'com.br' diretamente para 'https://accounts.zoho.com' e 'https://mail.zoho.com' para resiliência total.
const ZOHO_ACCOUNTS_DOMAINS: Record<string, string> = {
  'com': 'https://accounts.zoho.com',
  'com.br': 'https://accounts.zoho.com',
  'eu': 'https://accounts.zoho.eu',
  'in': 'https://accounts.zoho.in',
  'com.au': 'https://accounts.zoho.com.au',
};

// Domínios da API de E-mails por Região Zoho
const ZOHO_MAIL_DOMAINS: Record<string, string> = {
  'com': 'https://mail.zoho.com',
  'com.br': 'https://mail.zoho.com',
  'eu': 'https://mail.zoho.eu',
  'in': 'https://mail.zoho.in',
  'com.au': 'https://mail.zoho.com.au',
};

function getAccountsDomain(region: string = 'com'): string {
  if (region === 'com.br') return 'https://accounts.zoho.com';
  return ZOHO_ACCOUNTS_DOMAINS[region] || 'https://accounts.zoho.com';
}

function getMailDomain(region: string = 'com'): string {
  if (region === 'com.br') return 'https://mail.zoho.com';
  return ZOHO_MAIL_DOMAINS[region] || 'https://mail.zoho.com';
}

/**
 * Traduz erros comuns do OAuth Zoho para mensagens claras em português
 */
function translateZohoError(errorKey: string, desc?: string): string {
  switch (errorKey) {
    case 'invalid_code':
      return 'O código de concessão (Grant Token) expirou ou já foi utilizado. No Zoho Self-Client, gere um novo código temporário de 10 minutos com o escopo correto.';
    case 'invalid_client':
      return 'Client ID ou Client Secret incorretos ou não autorizados. Verifique suas credenciais no Zoho API Console.';
    case 'invalid_client_secret':
      return 'Client Secret inválido para o Client ID informado.';
    case 'invalid_redirect_uri':
      return 'URL de Redirecionamento (Redirect URI) não confere com o registrado no Zoho Self-Client.';
    case 'access_denied':
      return 'Permissão negada pelo Zoho. Certifique-se de autorizar os escopos ZohoMail.messages.CREATE e ZohoMail.accounts.READ.';
    case 'invalid_refresh_token':
      return 'O Refresh Token informado é inválido ou foi revogado no painel do Zoho.';
    default:
      return desc ? `${errorKey}: ${desc}` : `Erro Zoho OAuth: ${errorKey}`;
  }
}

/**
 * 1. Troca o Grant Token (gerado no Zoho Self-Client) por um Refresh Token permanente e Access Token
 */
export async function exchangeZohoGrantToken(params: ZohoExchangeTokenParams) {
  const { grantToken, clientId, clientSecret, region = 'com.br', redirectUri } = params;

  if (!grantToken?.trim()) {
    throw new Error('Código de Concessão (Grant Token) é obrigatório.');
  }
  if (!clientId?.trim() || !clientSecret?.trim()) {
    throw new Error('Client ID e Client Secret do Zoho são obrigatórios.');
  }

  const accountsDomain = getAccountsDomain(region);
  const tokenUrl = `${accountsDomain}/oauth/v2/token`;

  const bodyData = new URLSearchParams({
    code: grantToken.trim(),
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    grant_type: 'authorization_code',
  });

  if (redirectUri) {
    bodyData.append('redirect_uri', redirectUri);
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyData.toString(),
    });

    const data = await response.json();

    if (data.error) {
      const errorMsg = translateZohoError(data.error, data.error_description);
      return {
        success: false,
        error: errorMsg,
        raw: data,
      };
    }

    if (!data.refresh_token && !data.access_token) {
      return {
        success: false,
        error: 'Zoho não retornou tokens válidos. Verifique os escopos atribuídos ao gerar o código no Self-Client.',
        raw: data,
      };
    }

    return {
      success: true,
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
      apiDomain: data.api_domain,
      tokenType: data.token_type || 'Bearer',
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    // Se a conexão externa falhar ou estiver em ambiente sem acesso à internet externa,
    // permitimos fallback com mock se as credenciais tiverem formato de teste
    console.error('[Zoho Handler Exchange Error]', err);
    return {
      success: false,
      error: `Falha na requisição para ${accountsDomain}: ${err.message || 'Erro de rede'}`,
    };
  }
}

/**
 * 2. Renova o Access Token usando o Refresh Token permanente
 */
export async function refreshZohoAccessToken(params: ZohoRefreshTokenParams) {
  const { refreshToken, clientId, clientSecret, region = 'com.br' } = params;

  if (!refreshToken?.trim()) {
    throw new Error('Refresh Token permanente não configurado.');
  }
  if (!clientId?.trim() || !clientSecret?.trim()) {
    throw new Error('Client ID e Client Secret são obrigatórios.');
  }

  const accountsDomain = getAccountsDomain(region);
  const tokenUrl = `${accountsDomain}/oauth/v2/token`;

  const bodyData = new URLSearchParams({
    refresh_token: refreshToken.trim(),
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    grant_type: 'refresh_token',
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyData.toString(),
    });

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: translateZohoError(data.error, data.error_description),
        raw: data,
      };
    }

    return {
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[Zoho Handler Refresh Error]', err);
    return {
      success: false,
      error: `Erro ao renovar token Zoho: ${err.message}`,
    };
  }
}

/**
 * 3. Envia e-mail via API REST oficial do Zoho Mail
 */
export async function sendZohoEmailMessage(params: ZohoSendEmailParams) {
  let {
    to,
    subject,
    html,
    fromEmail,
    fromName = 'Deds Academy',
    replyTo,
    clientId,
    clientSecret,
    refreshToken,
    region = 'com',
    accountId,
  } = params;

  if (!clientId || !clientSecret || !refreshToken) {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      const { data } = await supabase
        .from('platform_settings')
        .select('api_settings')
        .eq('id', 'general')
        .maybeSingle();
      if (data?.api_settings?.email) {
        const em = data.api_settings.email;
        clientId = clientId || em.zohoClientId;
        clientSecret = clientSecret || em.zohoClientSecret;
        refreshToken = refreshToken || em.zohoRefreshToken;
        if (!params.accessToken && em.zohoAccessToken) params.accessToken = em.zohoAccessToken;
        region = region || em.zohoRegion || 'com';
        accountId = accountId || em.zohoAccountId;
        fromEmail = fromEmail || em.fromEmail || em.zohoUser;
        fromName = fromName || em.fromName || 'Deds Academy';
        replyTo = replyTo || em.replyToEmail || fromEmail;
      }
    } catch (err) {
      console.warn('[ZohoHandler] Falha ao consultar credenciais no Supabase:', err);
    }
  }

  let accessToken = params.accessToken?.trim();

  const renewAccessToken = async (): Promise<string | null> => {
    if (refreshToken && clientId && clientSecret) {
      const refreshRes = await refreshZohoAccessToken({
        refreshToken: refreshToken.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        region,
      });
      if (refreshRes.success && refreshRes.accessToken) {
        return refreshRes.accessToken;
      }
    }
    return null;
  };

  // Se não tem access token ou se ele expirou, tenta renovar via refresh token permanente
  if (!accessToken && refreshToken && clientId && clientSecret) {
    const refreshed = await renewAccessToken();
    if (refreshed) {
      accessToken = refreshed;
    } else {
      return {
        success: false,
        error: 'Não foi possível obter Access Token ativo do Zoho a partir do Refresh Token.',
      };
    }
  }

  if (!accessToken) {
    return {
      success: false,
      error: 'Token de autenticação do Zoho não disponível. Conecte sua conta com o Grant Token ou Refresh Token.',
    };
  }

  const mailDomain = getMailDomain(region);
  
  // No Zoho Mail API: identifica accountId e caixa postal autenticada
  let targetAccountId = accountId?.trim();
  let mailboxAddress: string | undefined;
  let allowedSenders: string[] = [];

  try {
    let accRes = await fetch(`${mailDomain}/api/accounts`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
      },
    });

    // Se o token estiver expirado (401), renova e tenta de novo
    if (accRes.status === 401 && refreshToken && clientId && clientSecret) {
      const refreshedToken = await renewAccessToken();
      if (refreshedToken) {
        accessToken = refreshedToken;
        accRes = await fetch(`${mailDomain}/api/accounts`, {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        });
      }
    }

    if (accRes.ok) {
      const accData = await accRes.json();
      if (accData.data) {
        let accountObj = null;
        if (Array.isArray(accData.data) && accData.data.length > 0) {
          accountObj = accData.data[0];
        } else if (typeof accData.data === 'object' && accData.data.accountId) {
          accountObj = accData.data;
        }

        if (accountObj) {
          if (!targetAccountId) {
            targetAccountId = String(accountObj.accountId);
          }
          mailboxAddress =
            accountObj.primaryEmailAddress ||
            accountObj.mailboxAddress ||
            accountObj.emailAddress?.find((e: any) => e?.isPrimary)?.mailId ||
            accountObj.emailAddress?.[0]?.mailId;

          // Lista oficial de remetentes autorizados pelo Zoho para esta conta
          const collected: string[] = [];
          if (accountObj.primaryEmailAddress) collected.push(accountObj.primaryEmailAddress);
          if (accountObj.mailboxAddress) collected.push(accountObj.mailboxAddress);
          (accountObj.emailAddress || []).forEach((e: any) => e?.mailId && collected.push(e.mailId));
          (accountObj.sendMailDetails || []).forEach((s: any) => s?.fromAddress && collected.push(s.fromAddress));
          allowedSenders = Array.from(new Set(collected.map((a) => String(a).trim().toLowerCase())));
          console.log('[Zoho Mail] Remetentes autorizados:', allowedSenders.join(', '));
        }
      }
    } else {
      const accErr = await accRes.text();
      console.warn('[Zoho Mail /api/accounts HTTP ' + accRes.status + ']:', accErr);
    }
  } catch (err: any) {
    console.warn('[Zoho Mail] Consulta /api/accounts falhou:', err?.message);
  }

  if (!targetAccountId) {
    return {
      success: false,
      error: 'ID da conta (AccountId) não identificado no Zoho Mail. Verifique se o escopo ZohoMail.accounts.READ está ativo.',
    };
  }

  // Endereço remetente: só é usado o informado no painel se o próprio Zoho o reconhecer
  // como endereço da conta. Caso contrário, usa o endereço principal retornado pelo Zoho.
  const requestedFrom = fromEmail?.trim().toLowerCase();
  let finalFrom: string | undefined;
  if (requestedFrom && allowedSenders.includes(requestedFrom)) {
    finalFrom = requestedFrom;
  } else {
    finalFrom = mailboxAddress || allowedSenders[0] || fromEmail?.trim();
    if (requestedFrom && finalFrom && requestedFrom !== finalFrom.toLowerCase()) {
      console.warn(`[Zoho Mail] Remetente "${requestedFrom}" não pertence à conta Zoho. Usando "${finalFrom}".`);
    }
  }

  if (!finalFrom) {
    return {
      success: false,
      error: 'Nenhum endereço remetente válido foi retornado pela conta Zoho Mail.',
    };
  }

  const endpoint = `${mailDomain}/api/accounts/${targetAccountId}/messages`;

  // Payload estrito conforme a especificação oficial do Zoho Mail
  const payload: Record<string, any> = {
    fromAddress: finalFrom,
    toAddress: to.trim(),
    subject: subject.trim(),
    content: html,
    mailFormat: 'html',
  };

  try {
    console.log('[Zoho Mail Dispatching URL]:', endpoint);
    console.log('[Zoho Mail From Address]:', finalFrom, 'To:', to.trim());

    let response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Se receber 401 Unauthorized (token expirou após primeira verificação), renova e reenvia
    if (response.status === 401 && refreshToken && clientId && clientSecret) {
      console.log('[Zoho Mail] 401 recebido. Renovando token...');
      const refreshedToken = await renewAccessToken();
      if (refreshedToken) {
        accessToken = refreshedToken;
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }
    }

    const responseText = await response.text();
    let result: any = null;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { rawText: responseText };
    }

    console.log('[Zoho Mail Response Status]:', response.status);
    console.log('[Zoho Mail Response Body]:', responseText);

    if (!response.ok || (result?.status && result.status.code !== 200)) {
      const apiErr =
        result?.data?.moreInfo ||
        result?.data?.message ||
        result?.status?.description ||
        result?.error ||
        result?.data?.description ||
        responseText ||
        'Erro na API Zoho Mail';
      return {
        success: false,
        error: `Zoho Mail API (${response.status}): ${apiErr}`,
        raw: result,
      };
    }

    return {
      success: true,
      messageId: result.data?.messageId || `zoho_${Date.now()}`,
      status: 'enviado',
      from: finalFrom,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[Zoho Send Error]', err);
    return {
      success: false,
      error: `Erro ao enviar e-mail via Zoho: ${err.message}`,
    };
  }
}
