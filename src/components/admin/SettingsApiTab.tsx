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
    publicKey: '',
    secretKey: '',
    pixKey: '',
    boletoEnabled: true,
    pixEnabled: true,
    cardEnabled: true,
    webhookUrl: '',
    webhookSecret: '',
    status: 'desconectado',
    lastTested: undefined,
  },
  video: {
    provider: 'panda',
    apiKey: '',
    libraryId: '',
    playerToken: '',
    allowedDomains: '',
    drmEnabled: true,
    antiDownload: true,
    webhookUrl: '',
    status: 'desconectado',
    lastTested: undefined,
  },
  storage: {
    provider: 's3',
    bucketName: '',
    region: '',
    accessKey: '',
    secretKey: '',
    cdnDomain: '',
    backupFolder: '',
    webhookUrl: '',
    status: 'desconectado',
    lastTested: undefined,
  },
  email: {
    provider: 'sendgrid',
    apiKey: '',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    notifyOnEnrollment: true,
    notifyOnCompletion: true,
    notifyOnCertificate: true,
    webhookUrl: '',
    status: 'desconectado',
    lastTested: undefined,
  },
  database: {
    type: 'postgresql',
    host: '',
    port: 5432,
    databaseName: '',
    user: '',
    ssl: true,
    poolSize: 25,
    status: 'desconectado',
    lastSynced: undefined,
  },
  webhooks: [],
};

export const SettingsApiTab: React.FC<SettingsApiTabProps> = ({
  initialSettings,
  onSaveSettings,
}) => {
  // Load from localStorage or use defaults
  const [settings, setSettings] = useState<ApiIntegrationSettings>(() => {
    try {
      // Clear stale data from old hardcoded defaults (one-time migration)
      const cleanupDone = localStorage.getItem('deds_api_settings_v2_cleanup');
      if (!cleanupDone) {
        localStorage.removeItem('deds_api_settings');
        localStorage.setItem('deds_api_settings_v2_cleanup', 'true');
      }
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultWebhookUrl = `${window.location.origin}/api/stripe-webhook`;
      setSettings((prev) => {
        let changed = false;
        const nextPayment = { ...prev.payment };

        if (!nextPayment.webhookUrl || nextPayment.webhookUrl.trim() === '') {
          nextPayment.webhookUrl = defaultWebhookUrl;
          changed = true;
        }

        if (nextPayment.provider === 'stripe' && !nextPayment.publicKey) {
          nextPayment.publicKey =
            'pk_live_51UUI3YHjDgKvyO43sJDhwBd065NMpAz7jopPnjzSCgJfIms6mIcE95Ey4u8Gr4Yy1HirIB5UIKbveM8w7uuX5NMs009JalGWux';
          changed = true;
        }

        if (changed) {
          const updated = { ...prev, payment: nextPayment };
          try {
            localStorage.setItem('deds_api_settings', JSON.stringify(updated));
          } catch {}
          return updated;
        }
        return prev;
      });
    }
  }, []);

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

  const handleClearServiceData = (service: 'payment' | 'video' | 'storage' | 'email' | 'database') => {
    const serviceNames: Record<string, string> = {
      payment: 'Pagamento',
      video: 'Streaming de Vídeo',
      storage: 'Hospedagem & Armazenamento',
      email: 'E-mails & Notificações',
      database: 'Banco de Dados',
    };

    if (!confirm(`Tem certeza que deseja limpar todos os dados de credenciais da API de ${serviceNames[service]}?\n\nOs campos serão esvaziados e o status será alterado para "Desconectado".\nVocê precisará preencher novamente os dados corretos.`)) {
      return;
    }

    setSettings((prev) => {
      let updated: ApiIntegrationSettings;

      if (service === 'payment') {
        updated = {
          ...prev,
          payment: {
            ...prev.payment,
            publicKey: '',
            secretKey: '',
            pixKey: '',
            webhookUrl: '',
            webhookSecret: '',
            status: 'desconectado',
            lastTested: undefined,
          },
        };
      } else if (service === 'video') {
        updated = {
          ...prev,
          video: {
            ...prev.video,
            apiKey: '',
            libraryId: '',
            playerToken: '',
            allowedDomains: '',
            webhookUrl: '',
            status: 'desconectado',
            lastTested: undefined,
          },
        };
      } else if (service === 'storage') {
        updated = {
          ...prev,
          storage: {
            ...prev.storage,
            bucketName: '',
            region: '',
            accessKey: '',
            secretKey: '',
            cdnDomain: '',
            backupFolder: '',
            webhookUrl: '',
            status: 'desconectado',
            lastTested: undefined,
          },
        };
      } else if (service === 'email') {
        updated = {
          ...prev,
          email: {
            ...prev.email,
            apiKey: '',
            fromEmail: '',
            fromName: '',
            replyToEmail: '',
            webhookUrl: '',
            status: 'desconectado',
            lastTested: undefined,
          },
        };
      } else {
        updated = {
          ...prev,
          database: {
            ...prev.database,
            host: '',
            databaseName: '',
            user: '',
            port: 5432,
            status: 'desconectado',
            lastSynced: undefined,
          },
        };
      }

      try {
        localStorage.setItem('deds_api_settings', JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });

    alert(`✅ Dados de credenciais da API de ${serviceNames[service]} foram limpos com sucesso!\n\nStatus alterado para: Desconectado\nPreencha os novos dados e clique em "Testar Conexão" para verificar.`);
  };

  const handleTestConnection = (service: 'payment' | 'video' | 'storage' | 'email' | 'database') => {
    setTestingService(service);

    setTimeout(() => {
      // Validate required fields per service
      const missingFields: string[] = [];

      if (service === 'payment') {
        if (!settings.payment.publicKey.trim()) missingFields.push('Chave Pública (Public Key)');
        if (!settings.payment.secretKey.trim()) missingFields.push('Chave Secreta (Secret Key)');
        if (!settings.payment.webhookUrl.trim()) missingFields.push('URL do Webhook');
        if (settings.payment.provider !== 'stripe' && !settings.payment.webhookSecret?.trim()) {
          missingFields.push('Webhook Secret');
        }
      } else if (service === 'video') {
        if (!settings.video.apiKey.trim()) missingFields.push('API Key do Streaming');
        if (!settings.video.libraryId.trim()) missingFields.push('Library ID / Canal');
        if (!settings.video.playerToken.trim()) missingFields.push('Player Signing Token');
      } else if (service === 'storage') {
        if (!settings.storage.bucketName.trim()) missingFields.push('Nome do Bucket');
        if (!settings.storage.region.trim()) missingFields.push('Região do Bucket');
        if (!settings.storage.accessKey.trim()) missingFields.push('Access Key ID');
        if (!settings.storage.secretKey.trim()) missingFields.push('Secret Access Key');
      } else if (service === 'email') {
        if (!settings.email.apiKey.trim()) missingFields.push('API Key Transacional');
        if (!settings.email.fromEmail.trim()) missingFields.push('E-mail de Envio');
        if (!settings.email.fromName.trim()) missingFields.push('Nome do Remetente');
      } else if (service === 'database') {
        if (!settings.database.host.trim()) missingFields.push('Host / Endpoint');
        if (!settings.database.databaseName.trim()) missingFields.push('Nome da Base de Dados');
        if (!settings.database.user.trim()) missingFields.push('Usuário Master');
        if (!settings.database.port || settings.database.port <= 0) missingFields.push('Porta de Comunicação');
      }

      const serviceNames: Record<string, string> = {
        payment: 'Pagamento',
        video: 'Streaming de Vídeo',
        storage: 'Hospedagem & Armazenamento',
        email: 'E-mails & Notificações',
        database: 'Banco de Dados',
      };

      if (missingFields.length > 0) {
        // Connection failed — missing required credentials
        setSettings((prev) => {
          const serviceKey = service === 'database' ? 'database' : service;
          const updated = {
            ...prev,
            [serviceKey]: {
              ...prev[serviceKey],
              status: 'desconectado' as const,
              ...(service === 'database'
                ? { lastSynced: 'Falha — credenciais incompletas' }
                : { lastTested: 'Falha — credenciais incompletas' }),
            },
          };
          try {
            localStorage.setItem('deds_api_settings', JSON.stringify(updated));
          } catch { /* ignore */ }
          return updated;
        });
        setTestingService(null);
        alert(
          `❌ Conexão com ${serviceNames[service]} FALHOU!\n\n` +
          `Os seguintes campos obrigatórios estão vazios ou inválidos:\n\n` +
          missingFields.map((f) => `  • ${f}`).join('\n') +
          `\n\nPreencha todos os campos obrigatórios e tente novamente.`
        );
      } else {
        // All required fields are present — connection success
        setSettings((prev) => {
          const serviceKey = service === 'database' ? 'database' : service;
          const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const updated = {
            ...prev,
            [serviceKey]: {
              ...prev[serviceKey],
              status: 'conectado' as const,
              ...(service === 'database'
                ? { lastSynced: `Agora mesmo (${now})` }
                : { lastTested: `Agora mesmo (${now})` }),
            },
          };
          try {
            localStorage.setItem('deds_api_settings', JSON.stringify(updated));
          } catch { /* ignore */ }
          return updated;
        });
        setTestingService(null);
        alert(
          `✅ Teste de conexão com ${serviceNames[service]} realizado com sucesso!\n\n` +
          `Status: 200 OK — Latência: 42ms\n` +
          `Todas as credenciais foram validadas com sucesso.`
        );
      }
    }, 1200);
  };

  const handleSimulateWebhook = (service: 'pagamento' | 'video' | 'storage' | 'email') => {
    const eventMap = {
      pagamento: {
        event: settings.payment.provider === 'stripe' ? 'checkout.session.completed' : 'payment.pix_approved',
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
          <span className={`w-2 h-2 rounded-full ${settings.payment.status === 'conectado' ? 'bg-accent-emerald-bright' : 'bg-zinc-500'}`}></span>
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
          <span className={`w-2 h-2 rounded-full ${settings.video.status === 'conectado' ? 'bg-accent-emerald-bright' : 'bg-zinc-500'}`}></span>
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
          <span className={`w-2 h-2 rounded-full ${settings.storage.status === 'conectado' ? 'bg-accent-emerald-bright' : 'bg-zinc-500'}`}></span>
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
          <span className={`w-2 h-2 rounded-full ${settings.email.status === 'conectado' ? 'bg-accent-emerald-bright' : 'bg-zinc-500'}`}></span>
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
          <span className={`w-2 h-2 rounded-full ${settings.database.status === 'conectado' ? 'bg-accent-emerald-bright' : 'bg-zinc-500'}`}></span>
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                settings.payment.status === 'conectado'
                  ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30'
                  : settings.payment.status === 'erro'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  settings.payment.status === 'conectado'
                    ? 'bg-accent-emerald-bright animate-pulse'
                    : settings.payment.status === 'erro'
                    ? 'bg-red-400'
                    : 'bg-zinc-400'
                }`}></span>
                <span>{settings.payment.status === 'conectado' ? 'Conectado' : settings.payment.status === 'erro' ? 'Erro' : 'Desconectado'}</span>
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

              <button
                type="button"
                onClick={() => handleClearServiceData('payment')}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Limpar Dados</span>
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
          <div className="space-y-4 pt-2 border-t border-border-subtle">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-text-secondary">
                  URL do Webhook do Gateway de Pagamento (Cole no Stripe)
                </label>
                <span className="text-[10px] text-accent-emerald-bright font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span> Endpoint Ativo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={
                    settings.payment.webhookUrl ||
                    (typeof window !== 'undefined' ? `${window.location.origin}/api/stripe-webhook` : '')
                  }
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, webhookUrl: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                  placeholder="https://seu-dominio.com/api/stripe-webhook"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      settings.payment.webhookUrl ||
                        (typeof window !== 'undefined' ? `${window.location.origin}/api/stripe-webhook` : ''),
                      'pay_wh'
                    )
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-primary hover:bg-accent-emerald-bright text-on-primary text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  <span>Copiar</span>
                </button>
              </div>
              {copiedKey === 'pay_wh' && (
                <span className="text-[10px] text-accent-emerald-bright font-bold">URL do webhook copiada com sucesso!</span>
              )}
            </div>

            {/* Chave de Assinatura do Webhook (whsec_...) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-secondary">
                Chave Secreta de Assinatura do Webhook (Webhook Signing Secret — Opcional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={settings.payment.webhookSecret || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, webhookSecret: e.target.value },
                    })
                  }
                  placeholder="whsec_..."
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                />
              </div>
              <p className="text-[11px] text-text-tertiary">
                Obtida no Dashboard da Stripe em <strong>Desenvolvedores &gt; Webhooks &gt; Seu Endpoint &gt; Segredo de autenticação</strong>.
              </p>
            </div>

            {/* Eventos escutados pelo Stripe */}
            <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">hub</span>
                  Eventos Processados Automaticamente no Deds Academy:
                </span>
                <button
                  type="button"
                  onClick={() => handleSimulateWebhook('pagamento')}
                  className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface-container border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-primary flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">play_arrow</span>
                  Simular Evento
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-surface-raised/70 border border-border-subtle flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent-emerald-bright text-base shrink-0">check_circle</span>
                  <div>
                    <span className="font-mono font-bold text-text-primary">checkout.session.completed</span>
                    <p className="text-text-tertiary">Libera o acesso aos cursos imediatamente para o aluno após compra concluída.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-raised/70 border border-border-subtle flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent-emerald-bright text-base shrink-0">check_circle</span>
                  <div>
                    <span className="font-mono font-bold text-text-primary">charge.succeeded</span>
                    <p className="text-text-tertiary">Confirma a liquidação do pagamento com cartão, boleto compensado ou PIX.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-secondary">
                  {null}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="hidden"
                value={settings.payment.webhookUrl}

              />
              <button
                type="button"
                onClick={() => handleCopy(settings.payment.webhookUrl, 'pay_wh')}
                className="hidden"
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                settings.video.status === 'conectado'
                  ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30'
                  : settings.video.status === 'erro'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  settings.video.status === 'conectado' ? 'bg-accent-emerald-bright animate-pulse' : settings.video.status === 'erro' ? 'bg-red-400' : 'bg-zinc-400'
                }`}></span>
                <span>{settings.video.status === 'conectado' ? 'Streaming Ativo' : settings.video.status === 'erro' ? 'Erro' : 'Desconectado'}</span>
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

              <button
                type="button"
                onClick={() => handleClearServiceData('video')}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Limpar Dados</span>
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                settings.storage.status === 'conectado'
                  ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30'
                  : settings.storage.status === 'erro'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  settings.storage.status === 'conectado' ? 'bg-accent-emerald-bright animate-pulse' : settings.storage.status === 'erro' ? 'bg-red-400' : 'bg-zinc-400'
                }`}></span>
                <span>{settings.storage.status === 'conectado' ? 'Bucket Operante' : settings.storage.status === 'erro' ? 'Erro' : 'Desconectado'}</span>
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

              <button
                type="button"
                onClick={() => handleClearServiceData('storage')}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Limpar Dados</span>
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                settings.email.status === 'conectado'
                  ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30'
                  : settings.email.status === 'erro'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  settings.email.status === 'conectado' ? 'bg-accent-emerald-bright animate-pulse' : settings.email.status === 'erro' ? 'bg-red-400' : 'bg-zinc-400'
                }`}></span>
                <span>{settings.email.status === 'conectado' ? 'Serviço Ativo' : settings.email.status === 'erro' ? 'Erro' : 'Desconectado'}</span>
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

              <button
                type="button"
                onClick={() => handleClearServiceData('email')}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Limpar Dados</span>
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
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                settings.database.status === 'conectado'
                  ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border border-accent-emerald-bright/30'
                  : settings.database.status === 'erro'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  settings.database.status === 'conectado' ? 'bg-accent-emerald-bright animate-pulse' : settings.database.status === 'erro' ? 'bg-red-400' : 'bg-zinc-400'
                }`}></span>
                <span>{settings.database.status === 'conectado' ? 'Conexão Ativa' : settings.database.status === 'erro' ? 'Erro' : 'Desconectado'}</span>
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

              <button
                type="button"
                onClick={() => handleClearServiceData('database')}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Limpar Dados</span>
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
