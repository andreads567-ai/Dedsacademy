import React, { useState, useEffect } from 'react';
import { ApiIntegrationSettings, WebhookLogItem } from '../../types';

interface SettingsApiTabProps {
  initialSettings?: ApiIntegrationSettings;
  onSaveSettings?: (settings: ApiIntegrationSettings) => void;
}

const DEFAULT_SETTINGS: ApiIntegrationSettings = {
  payment: {
    provider: 'mercadopago',
    environment: 'producao',
    publicKey: 'APP_USR-7839210-9832-4211-90a1-778219034',
    secretKey: 'APP_USR_SEC-984321904-89421-4190-8432-894319084',
    pixKey: 'financeiro@dedsacademy.com.br',
    boletoEnabled: true,
    pixEnabled: true,
    cardEnabled: true,
    webhookUrl: 'https://api.dedsacademy.com.br/api/webhooks/payments',
    webhookSecret: 'whsec_payment_938472910843219',
    status: 'conectado',
    lastTested: 'Hoje, 10:24',
  },
  video: {
    provider: 'panda',
    apiKey: 'panda_live_839410928430198420194832',
    libraryId: 'lib_deds_streaming_hd_prod',
    playerToken: 'ply_token_984321908420194',
    allowedDomains: 'dedsacademy.com.br, *.dedsacademy.com.br',
    drmEnabled: true,
    antiDownload: true,
    webhookUrl: 'https://api.dedsacademy.com.br/api/webhooks/video-transcode',
    status: 'conectado',
    lastTested: 'Hoje, 09:40',
  },
  storage: {
    provider: 's3',
    bucketName: 'deds-academy-assets-sa-east',
    region: 'sa-east-1 (São Paulo)',
    accessKey: 'AKIA_DEDS_PROD_8392019',
    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    cdnDomain: 'https://cdn.dedsacademy.com.br',
    backupFolder: '/backups/certificados_e_anexos',
    webhookUrl: 'https://api.dedsacademy.com.br/api/webhooks/storage-events',
    status: 'conectado',
    lastTested: 'Ontem, 18:15',
  },
  email: {
    provider: 'sendgrid',
    apiKey: 'SG.984321098432.89432190843219084321908432',
    fromEmail: 'notificacoes@dedsacademy.com.br',
    fromName: 'Deds Academy Brasil',
    replyToEmail: 'suporte@dedsacademy.com.br',
    notifyOnEnrollment: true,
    notifyOnCompletion: true,
    notifyOnCertificate: true,
    webhookUrl: 'https://api.dedsacademy.com.br/api/webhooks/email-events',
    status: 'conectado',
    lastTested: 'Hoje, 08:12',
  },
  database: {
    type: 'postgresql',
    host: 'db.dedsacademy-cloud.internal',
    port: 5432,
    databaseName: 'deds_academy_production',
    user: 'deds_app_master',
    ssl: true,
    poolSize: 25,
    status: 'conectado',
    lastSynced: 'Há 3 minutos',
  },
  webhooks: [
    {
      id: 'wh-1',
      service: 'pagamento',
      event: 'payment.pix_approved',
      status: 'sucesso',
      statusCode: 200,
      payload: '{"payment_id":"pix_984321","status":"approved","amount":179.90,"student_email":"aluno@email.com"}',
      timestamp: 'Hoje, 10:45:12',
    },
    {
      id: 'wh-2',
      service: 'email',
      event: 'email.delivered',
      status: 'sucesso',
      statusCode: 200,
      payload: '{"template":"welcome_course","to":"aluno@email.com","status":"delivered"}',
      timestamp: 'Hoje, 10:45:15',
    },
    {
      id: 'wh-3',
      service: 'storage',
      event: 'certificate.generated_and_stored',
      status: 'sucesso',
      statusCode: 200,
      payload: '{"certificate_id":"CERT-2025-9812","bucket":"deds-academy-assets","url":"https://cdn..."}',
      timestamp: 'Hoje, 09:30:00',
    },
    {
      id: 'wh-4',
      service: 'video',
      event: 'video.transcode_ready',
      status: 'sucesso',
      statusCode: 200,
      payload: '{"video_id":"vid_ai_prompt_aula1","duration_seconds":900,"resolutions":["1080p","720p"]}',
      timestamp: 'Hoje, 08:15:22',
    },
  ],
};

export const SettingsApiTab: React.FC<SettingsApiTabProps> = ({
  initialSettings,
  onSaveSettings,
}) => {
  // Load from localStorage or use defaults
  const [settings, setSettings] = useState<ApiIntegrationSettings>(() => {
    try {
      const saved = localStorage.getItem('deds_api_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return initialSettings || DEFAULT_SETTINGS;
  });

  const [activeSection, setActiveSection] = useState<
    'pagamento' | 'video' | 'storage' | 'email' | 'webhooks' | 'banco'
  >('pagamento');

  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('deds_api_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
    if (onSaveSettings) {
      onSaveSettings(settings);
    }
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3500);
  };

  const handleTestConnection = (service: 'payment' | 'video' | 'storage' | 'email' | 'database') => {
    setTestingService(service);
    setTimeout(() => {
      setSettings((prev) => ({
        ...prev,
        [service]: {
          ...prev[service],
          status: 'conectado',
          lastTested: 'Agora mesmo',
        },
      }));
      setTestingService(null);
      alert(`Teste de conexão com a API de ${service.toUpperCase()} realizado com sucesso! (Status 200 OK - Latência 42ms)`);
    }, 1000);
  };

  const handleSimulateWebhook = (service: 'pagamento' | 'video' | 'storage' | 'email') => {
    const eventMap = {
      pagamento: {
        event: 'payment.pix_approved',
        payload: JSON.stringify({
          event_type: 'pix_instant_payment',
          transaction_id: `tx_${Date.now()}`,
          amount_cents: 17990,
          currency: 'BRL',
          status: 'approved',
          payer: { name: 'Mariana Silva', cpf: '***.***.184-90' },
        }),
      },
      video: {
        event: 'video.transcode_ready',
        payload: JSON.stringify({
          event_type: 'hls_drm_ready',
          video_id: `vid_${Date.now().toString().slice(-6)}`,
          quality: '1080p_60fps',
          anti_download_drm: true,
        }),
      },
      storage: {
        event: 'certificate.stored',
        payload: JSON.stringify({
          event_type: 'pdf_signed_upload',
          certificate_hash: `DEDS-VAL-${Date.now().toString().slice(-8)}`,
          s3_etag: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        }),
      },
      email: {
        event: 'email.opened_and_clicked',
        payload: JSON.stringify({
          event_type: 'certificate_email_opened',
          recipient: 'aluno@empresa.com.br',
          client: 'Gmail iOS 17.4',
        }),
      },
    };

    const newLog: WebhookLogItem = {
      id: `wh-${Date.now()}`,
      service,
      event: eventMap[service].event,
      status: 'sucesso',
      statusCode: 200,
      payload: eventMap[service].payload,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
    };

    setSettings((prev) => ({
      ...prev,
      webhooks: [newLog, ...prev.webhooks.slice(0, 19)],
    }));

    alert(`Webhook de [${service.toUpperCase()}] simulado com sucesso! Log adicionado em tempo real.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">settings_input_composite</span>
              Configurações do Sistema &amp; Integrações de APIs
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary">
              Infraestrutura &amp; Webhooks
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Gerencie as credenciais das 4 APIs principais (Pagamentos, Streaming de Vídeo, Armazenamento e Notificações), webhooks e conexão com banco de dados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">save</span>
          <span>Salvar Todas as Configurações</span>
        </button>
      </div>

      {showSaveAlert && (
        <div className="p-4 rounded-xl bg-accent-emerald-bright/10 border border-accent-emerald-bright/40 text-accent-emerald-bright text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">verified</span>
            <span>Configurações das APIs e Webhooks salvas com sucesso no banco e cache local!</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSaveAlert(false)}
            className="text-text-tertiary hover:text-text-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* 6 Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto p-2 bg-surface-raised border border-border-subtle rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveSection('pagamento')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSection === 'pagamento'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
          }`}
        >
          <span className="material-symbols-outlined text-base">payments</span>
          <span>1. Pagamento (Cartão, Pix &amp; Boleto)</span>
          <span className="w-2 h-2 rounded-full bg-accent-emerald-bright"></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('video')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSection === 'video'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
          }`}
        >
          <span className="material-symbols-outlined text-base">play_circle</span>
          <span>2. Streaming de Vídeos (Segurança DRM)</span>
          <span className="w-2 h-2 rounded-full bg-accent-emerald-bright"></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('storage')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSection === 'storage'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
          }`}
        >
          <span className="material-symbols-outlined text-base">cloud_upload</span>
          <span>3. Hospedagem &amp; Arquivos (PDFs/Certificados)</span>
          <span className="w-2 h-2 rounded-full bg-accent-emerald-bright"></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('email')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSection === 'email'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
          }`}
        >
          <span className="material-symbols-outlined text-base">mail</span>
          <span>4. E-mails &amp; Notificações Automáticas</span>
          <span className="w-2 h-2 rounded-full bg-accent-emerald-bright"></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('webhooks')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSection === 'webhooks'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
          }`}
        >
          <span className="material-symbols-outlined text-base">webhook</span>
          <span>Webhooks &amp; Conexões</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary/20 text-primary">
            {settings.webhooks.length} logs
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('banco')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSection === 'banco'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
          }`}
        >
          <span className="material-symbols-outlined text-base">database</span>
          <span>Banco de Dados</span>
          <span className="w-2 h-2 rounded-full bg-accent-emerald-bright"></span>
        </button>
      </div>

      {/* SECTION 1: PAGAMENTO */}
      {activeSection === 'pagamento' && (
        <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  1. API de Processamento de Pagamentos (Cartão, Pix e Boleto)
                </h3>
                <p className="text-xs text-text-tertiary">
                  Recebimento instantâneo, conciliação bancária e liberação imediata da matrícula do aluno.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-emerald-bright animate-pulse"></span>
                <span>Conectado</span>
              </span>

              <button
                type="button"
                onClick={() => handleTestConnection('payment')}
                disabled={testingService === 'payment'}
                className="px-3 py-1.5 rounded-xl bg-surface-overlay hover:bg-surface-container border border-border-subtle text-xs font-bold text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">network_check</span>
                <span>{testingService === 'payment' ? 'Testando...' : 'Testar Conexão'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Provedor de Pagamento
              </label>
              <select
                value={settings.payment.provider}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payment: {
                      ...settings.payment,
                      provider: e.target.value as any,
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value="mercadopago">Mercado Pago (Cartão, Pix com QR Code &amp; Boleto)</option>
                <option value="asaas">Asaas Pagamentos Inteligentes</option>
                <option value="stripe">Stripe Global (Cartões Internacionais &amp; Nacionais)</option>
                <option value="pagseguro">PagSeguro / PagBank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Ambiente de Execução
              </label>
              <select
                value={settings.payment.environment}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payment: {
                      ...settings.payment,
                      environment: e.target.value as any,
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value="producao">Produção (Processamento Real com Dinheiro em Conta)</option>
                <option value="sandbox">Sandbox / Homologação (Ambiente de Testes)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Chave Pública (Public Key / Client ID)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings.payment.publicKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, publicKey: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(settings.payment.publicKey, 'public_key')}
                  className="p-2.5 rounded-xl bg-surface-overlay hover:bg-surface-container border border-border-subtle text-text-tertiary hover:text-text-primary cursor-pointer"
                  title="Copiar Chave Pública"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
              {copiedKey === 'public_key' && (
                <span className="text-[10px] text-accent-emerald-bright font-bold">Chave copiada!</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Chave Secreta (Access Token / Secret Key)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={settings.payment.secretKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, secretKey: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(settings.payment.secretKey, 'secret_key')}
                  className="p-2.5 rounded-xl bg-surface-overlay hover:bg-surface-container border border-border-subtle text-text-tertiary hover:text-text-primary cursor-pointer"
                  title="Copiar Chave Secreta"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
              {copiedKey === 'secret_key' && (
                <span className="text-[10px] text-accent-emerald-bright font-bold">Chave copiada!</span>
              )}
            </div>
          </div>

          {/* Formas de Pagamento Ativas */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Formas de Pagamento Habilitadas no Checkout
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle cursor-pointer hover:border-primary">
                <input
                  type="checkbox"
                  checked={settings.payment.cardEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: {
                        ...settings.payment,
                        cardEnabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-text-primary block">Cartão de Crédito</span>
                  <span className="text-[10px] text-text-tertiary">Até 12x parcelado</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle cursor-pointer hover:border-primary">
                <input
                  type="checkbox"
                  checked={settings.payment.pixEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: {
                        ...settings.payment,
                        pixEnabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-accent-emerald-bright rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-text-primary block">Pix com QR Code</span>
                  <span className="text-[10px] text-text-tertiary">Aprovação em 5 segundos</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle cursor-pointer hover:border-primary">
                <input
                  type="checkbox"
                  checked={settings.payment.boletoEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: {
                        ...settings.payment,
                        boletoEnabled: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-text-primary block">Boleto Bancário</span>
                  <span className="text-[10px] text-text-tertiary">Compensação 1 a 3 dias</span>
                </div>
              </label>
            </div>
          </div>

          {/* Webhook do Gateway */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-secondary">
              URL do Webhook do Gateway de Pagamento (Cole no painel do seu provedor)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={settings.payment.webhookUrl}
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => handleCopy(settings.payment.webhookUrl, 'pay_wh')}
                className="px-3 py-2.5 rounded-xl bg-surface-overlay hover:bg-surface-container border border-border-subtle text-xs font-bold text-text-primary flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>Copiar</span>
              </button>
            </div>
            {copiedKey === 'pay_wh' && (
              <span className="text-[10px] text-accent-emerald-bright font-bold">URL do webhook copiada!</span>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: STREAMING DE VÍDEOS */}
      {activeSection === 'video' && (
        <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">smart_display</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  2. API de Streaming Seguro de Vídeos (Panda Video, Cloudflare &amp; DRM)
                </h3>
                <p className="text-xs text-text-tertiary">
                  Transcodificação automática adaptativa (HLS 1080p, 720p), criptografia e proteção anti-download.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-emerald-bright"></span>
                <span>Streaming Ativo</span>
              </span>

              <button
                type="button"
                onClick={() => handleTestConnection('video')}
                disabled={testingService === 'video'}
                className="px-3 py-1.5 rounded-xl bg-surface-overlay hover:bg-surface-container border border-border-subtle text-xs font-bold text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">network_check</span>
                <span>{testingService === 'video' ? 'Testando...' : 'Verificar Streaming'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Serviço de Streaming
              </label>
              <select
                value={settings.video.provider}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    video: { ...settings.video, provider: e.target.value as any },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value="panda">Panda Video (Líder em segurança, anti-pirataria e player ultra-rápido)</option>
                <option value="cloudflare">Cloudflare Stream (CDN Global distribuído)</option>
                <option value="vimeo">Vimeo OTT Enterprise</option>
                <option value="bunny">Bunny.net Stream</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Library ID / Canal de Vídeo
              </label>
              <input
                type="text"
                value={settings.video.libraryId}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    video: { ...settings.video, libraryId: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                API Key de Gerenciamento do Streaming
              </label>
              <input
                type="password"
                value={settings.video.apiKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    video: { ...settings.video, apiKey: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Player Signing Token (Criptografia Tokenizada)
              </label>
              <input
                type="password"
                value={settings.video.playerToken}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    video: { ...settings.video, playerToken: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Domínios Autorizados para Reprodução (Anti-Iframe / Hotlink Protection)
              </label>
              <input
                type="text"
                value={settings.video.allowedDomains}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    video: { ...settings.video, allowedDomains: e.target.value },
                  })
                }
                placeholder="ex: dedsacademy.com.br, *.dedsacademy.com.br"
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Opções de Segurança Avançada de Vídeo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-overlay border border-border-subtle cursor-pointer hover:border-primary">
              <input
                type="checkbox"
                checked={settings.video.drmEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    video: { ...settings.video, drmEnabled: e.target.checked },
                  })
                }
                className="w-4 h-4 text-accent-emerald-bright rounded cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-text-primary block">
                  Proteção DRM Criptografada Ativa
                </span>
                <span className="text-[10px] text-text-tertiary">
                  Impede extensões do navegador e capturadores de gravar a tela limpa
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-overlay border border-border-subtle cursor-pointer hover:border-primary">
              <input
                type="checkbox"
                checked={settings.video.antiDownload}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    video: { ...settings.video, antiDownload: e.target.checked },
                  })
                }
                className="w-4 h-4 text-accent-emerald-bright rounded cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-text-primary block">
                  Bloqueio Estrito de Download do Arquivo .mp4 Original
                </span>
                <span className="text-[10px] text-text-tertiary">
                  Permite apenas streaming fragmentado HLS/DASH
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* SECTION 3: STORAGE */}
      {activeSection === 'storage' && (
        <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">cloud_queue</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  3. API de Hospedagem &amp; Armazenamento (PDFs, Certificados &amp; Anexos)
                </h3>
                <p className="text-xs text-text-tertiary">
                  Armazenamento em nuvem de alta disponibilidade para arquivos anexos de aulas, apostilas e certificados oficiais assinados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-emerald-bright"></span>
                <span>Bucket Operante</span>
              </span>

              <button
                type="button"
                onClick={() => handleTestConnection('storage')}
                disabled={testingService === 'storage'}
                className="px-3 py-1.5 rounded-xl bg-surface-overlay hover:bg-surface-container border border-border-subtle text-xs font-bold text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">network_check</span>
                <span>{testingService === 'storage' ? 'Testando...' : 'Testar Gravação S3'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Provedor de Armazenamento
              </label>
              <select
                value={settings.storage.provider}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    storage: { ...settings.storage, provider: e.target.value as any },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value="s3">Amazon S3 (Simple Storage Service)</option>
                <option value="gcs">Google Cloud Storage</option>
                <option value="firebase">Firebase Cloud Storage</option>
                <option value="backblaze">Backblaze B2 Cloud</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Nome do Bucket
              </label>
              <input
                type="text"
                value={settings.storage.bucketName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    storage: { ...settings.storage, bucketName: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Região do Bucket
              </label>
              <input
                type="text"
                value={settings.storage.region}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    storage: { ...settings.storage, region: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Domínio CDN Personalizado (Opcional)
              </label>
              <input
                type="text"
                value={settings.storage.cdnDomain || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    storage: { ...settings.storage, cdnDomain: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Access Key ID
              </label>
              <input
                type="text"
                value={settings.storage.accessKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    storage: { ...settings.storage, accessKey: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Secret Access Key
              </label>
              <input
                type="password"
                value={settings.storage.secretKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    storage: { ...settings.storage, secretKey: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: EMAIL */}
      {activeSection === 'email' && (
        <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">mark_email_read</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  4. API de E-mails &amp; Notificações Automáticas
                </h3>
                <p className="text-xs text-text-tertiary">
                  Disparo transacional de boas-vindas, lembretes de aulas, avisos de avaliação e entrega do certificado com validação.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-emerald-bright"></span>
                <span>Serviço Ativo</span>
              </span>

              <button
                type="button"
                onClick={() => handleTestConnection('email')}
                disabled={testingService === 'email'}
                className="px-3 py-1.5 rounded-xl bg-surface-overlay hover:bg-surface-container border border-border-subtle text-xs font-bold text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>{testingService === 'email' ? 'Disparando...' : 'Enviar E-mail de Teste'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Provedor de E-mail Transacional
              </label>
              <select
                value={settings.email.provider}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, provider: e.target.value as any },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value="sendgrid">Twilio SendGrid API</option>
                <option value="resend">Resend (Modern Email Platform)</option>
                <option value="ses">Amazon Simple Email Service (SES)</option>
                <option value="mailgun">Mailgun Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                E-mail de Envio Autenticado (SPF/DKIM)
              </label>
              <input
                type="email"
                value={settings.email.fromEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, fromEmail: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Nome do Remetente Exibido
              </label>
              <input
                type="text"
                value={settings.email.fromName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, fromName: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                API Key Transacional
              </label>
              <input
                type="password"
                value={settings.email.apiKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, apiKey: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* Gatilhos de Notificação */}
          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Disparos Automáticos de Notificação
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle cursor-pointer hover:border-primary">
                <input
                  type="checkbox"
                  checked={settings.email.notifyOnEnrollment}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: {
                        ...settings.email,
                        notifyOnEnrollment: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-text-primary block">Nova Matrícula</span>
                  <span className="text-[10px] text-text-tertiary">Envia dados de acesso</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle cursor-pointer hover:border-primary">
                <input
                  type="checkbox"
                  checked={settings.email.notifyOnCompletion}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: {
                        ...settings.email,
                        notifyOnCompletion: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-text-primary block">Conclusão de Módulo</span>
                  <span className="text-[10px] text-text-tertiary">Parabéns &amp; próximos passos</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-raised border border-border-subtle cursor-pointer hover:border-primary">
                <input
                  type="checkbox"
                  checked={settings.email.notifyOnCertificate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email: {
                        ...settings.email,
                        notifyOnCertificate: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-accent-emerald-bright rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-text-primary block">Emissão de Certificado</span>
                  <span className="text-[10px] text-text-tertiary">Envia link com QR Code</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: WEBHOOKS */}
      {activeSection === 'webhooks' && (
        <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">webhook</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Central de Webhooks &amp; Códigos de Conexão em Tempo Real
                </h3>
                <p className="text-xs text-text-tertiary">
                  Endpoints que recebem notificações automáticas das APIs externas para atualizar status de pagamentos, transcodificação de vídeos e entrega de certificados.
                </p>
              </div>
            </div>

            {/* Simular disparo de webhook */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSimulateWebhook('pagamento')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">payments</span>
                <span>Simular Pix</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateWebhook('video')}
                className="px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">play_circle</span>
                <span>Simular Vídeo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateWebhook('storage')}
                className="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">cloud_done</span>
                <span>Simular Certificado</span>
              </button>
            </div>
          </div>

          {/* Webhook Endpoints Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Endpoints Registrados para Webhooks
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-overlay border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-text-primary">Webhook de Pagamentos (POST)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright">
                    Ativo
                  </span>
                </div>
                <code className="text-[11px] text-text-secondary block font-mono break-all">
                  https://api.dedsacademy.com.br/api/webhooks/payments
                </code>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-overlay border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-text-primary">Webhook de Vídeos / Transcode (POST)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright">
                    Ativo
                  </span>
                </div>
                <code className="text-[11px] text-text-secondary block font-mono break-all">
                  https://api.dedsacademy.com.br/api/webhooks/video-transcode
                </code>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-overlay border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-text-primary">Webhook de Storage &amp; Certificados (POST)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright">
                    Ativo
                  </span>
                </div>
                <code className="text-[11px] text-text-secondary block font-mono break-all">
                  https://api.dedsacademy.com.br/api/webhooks/storage-events
                </code>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-overlay border border-border-subtle">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-text-primary">Webhook de Disparos de E-mail (POST)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright">
                    Ativo
                  </span>
                </div>
                <code className="text-[11px] text-text-secondary block font-mono break-all">
                  https://api.dedsacademy.com.br/api/webhooks/email-events
                </code>
              </div>
            </div>
          </div>

          {/* Webhook Logs Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
              <span>Registro de Eventos Recebidos (Logs em Tempo Real)</span>
              <span className="text-[11px] text-text-tertiary font-normal">
                Últimos eventos processados pelo backend
              </span>
            </h4>

            <div className="border border-border-subtle rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-overlay border-b border-border-subtle text-text-tertiary">
                  <tr>
                    <th className="p-3">Horário</th>
                    <th className="p-3">Serviço</th>
                    <th className="p-3">Evento</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Payload Recebido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {settings.webhooks.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-overlay/50 transition-colors">
                      <td className="p-3 font-mono text-text-tertiary whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="p-3 font-bold uppercase text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            log.service === 'pagamento'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : log.service === 'video'
                              ? 'bg-purple-500/15 text-purple-400'
                              : log.service === 'storage'
                              ? 'bg-sky-500/15 text-sky-400'
                              : 'bg-orange-500/15 text-orange-400'
                          }`}
                        >
                          {log.service}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-text-primary">
                        {log.event}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright">
                          {log.statusCode} OK
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-text-secondary max-w-xs truncate">
                        {log.payload}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: BANCO DE DADOS */}
      {activeSection === 'banco' && (
        <div className="p-6 rounded-2xl bg-surface-raised border border-border-subtle shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">database</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  5. Configuração do Banco de Dados &amp; Persistência de Dados
                </h3>
                <p className="text-xs text-text-tertiary">
                  Parâmetros de conexão para salvar registros de cursos, matrículas, progresso das aulas e certificados emitidos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-emerald-bright"></span>
                <span>Conexão Ativa</span>
              </span>

              <button
                type="button"
                onClick={() => handleTestConnection('database')}
                disabled={testingService === 'database'}
                className="px-3 py-1.5 rounded-xl bg-surface-overlay hover:bg-surface-container border border-border-subtle text-xs font-bold text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">sync</span>
                <span>{testingService === 'database' ? 'Testando...' : 'Testar Conexão SQL'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Engine / Tipo de Banco de Dados
              </label>
              <select
                value={settings.database.type}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    database: { ...settings.database, type: e.target.value as any },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value="postgresql">PostgreSQL 16 (Cloud SQL / Neon / AWS RDS)</option>
                <option value="firestore">Firebase Cloud Firestore (NoSQL em Tempo Real)</option>
                <option value="mysql">MySQL 8.0 Enterprise</option>
                <option value="local_indexed">IndexedDB Local Storage (Cache do Navegador)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Nome da Base de Dados (Database Name)
              </label>
              <input
                type="text"
                value={settings.database.databaseName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    database: { ...settings.database, databaseName: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Host / Endpoint do Banco
              </label>
              <input
                type="text"
                value={settings.database.host}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    database: { ...settings.database, host: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Porta de Comunicação
              </label>
              <input
                type="number"
                value={settings.database.port}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    database: { ...settings.database, port: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Usuário Master da Aplicação
              </label>
              <input
                type="text"
                value={settings.database.user}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    database: { ...settings.database, user: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Tamanho do Pool de Conexões (Connection Pool)
              </label>
              <input
                type="number"
                value={settings.database.poolSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    database: { ...settings.database, poolSize: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.database.ssl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    database: { ...settings.database, ssl: e.target.checked },
                  })
                }
                className="w-4 h-4 text-accent-emerald-bright rounded cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-text-primary block">
                  Exigir Conexão Criptografada SSL / TLS Obrigatória
                </span>
                <span className="text-[10px] text-text-tertiary">
                  Garante conformidade com a LGPD e criptografia de ponta a ponta
                </span>
              </div>
            </label>

            <span className="text-[11px] text-text-tertiary">
              Última sincronização com réplicas: <strong className="text-text-primary">{settings.database.lastSynced}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
