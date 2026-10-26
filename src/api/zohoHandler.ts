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
const ZOHO_ACCOUNTS_DOMAINS: Record<string, string> = {
  'com': 'https://accounts.zoho.com',
  'com.br': 'https://accounts.zoho.com.br',
  'eu': 'https://accounts.zoho.eu',
  'in': 'https://accounts.zoho.in',
  'com.au': 'https://accounts.zoho.com.au',
};

// Domínios da API de E-mails por Região Zoho
const ZOHO_MAIL_DOMAINS: Record<string, string> = {
  'com': 'https://mail.zoho.com',
  'com.br': 'https://mail.zoho.com.br',
  'eu': 'https://mail.zoho.eu',
  'in': 'https://mail.zoho.in',
  'com.au': 'https://mail.zoho.com.au',
};

function getAccountsDomain(region: string = 'com.br'): string {
  return ZOHO_ACCOUNTS_DOMAINS[region] || ZOHO_ACCOUNTS_DOMAINS['com.br'];
}

function getMailDomain(region: string = 'com.br'): string {
  return ZOHO_MAIL_DOMAINS[region] || ZOHO_MAIL_DOMAINS['com.br'];
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
  const {
    to,
    subject,
    html,
    fromEmail = 'contato@dedsacademy.com.br',
    fromName = 'Deds Academy',
    clientId,
    clientSecret,
    refreshToken,
    region = 'com.br',
    accountId,
  } = params;

  let accessToken = params.accessToken;

  // Se não tem access token ou se ele expirou, tenta renovar via refresh token
  if (!accessToken && refreshToken && clientId && clientSecret) {
    const refreshRes = await refreshZohoAccessToken({
      refreshToken,
      clientId,
      clientSecret,
      region,
    });
    if (refreshRes.success && refreshRes.accessToken) {
      accessToken = refreshRes.accessToken;
    } else {
      return {
        success: false,
        error: `Não foi possível obter Access Token do Zoho: ${refreshRes.error}`,
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
  
  // No Zoho Mail API:
  // Se accountId não foi informado, podemos consultar /api/accounts ou tentar o accountId default
  let targetAccountId = accountId;
  if (!targetAccountId) {
    try {
      const accRes = await fetch(`${mailDomain}/api/accounts`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
        },
      });
      const accData = await accRes.json();
      if (accData.data && accData.data.length > 0) {
        targetAccountId = accData.data[0].accountId;
      }
    } catch {
      // continua com endpoint genérico
    }
  }

  const endpoint = targetAccountId
    ? `${mailDomain}/api/accounts/${targetAccountId}/messages`
    : `${mailDomain}/api/accounts/messages`;

  const payload: Record<string, any> = {
    fromAddress: fromEmail,
    toAddress: to,
    subject: subject,
    content: html,
    mailFormat: 'html',
    askReceipt: 'no',
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || (result.status && result.status.code !== 200)) {
      return {
        success: false,
        error: result.data?.message || result.status?.description || result.error || 'Erro na API Zoho Mail',
        raw: result,
      };
    }

    return {
      success: true,
      messageId: result.data?.messageId || `zoho_${Date.now()}`,
      status: 'enviado',
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
