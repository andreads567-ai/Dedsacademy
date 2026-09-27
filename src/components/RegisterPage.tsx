import React, { useState } from 'react';

export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  phone: string;
  address?: {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
}

interface RegisterPageProps {
  onNavigateHome: (sectionId?: string) => void;
  onOpenLogin: () => void;
  onRegistrationSuccess: (data: RegistrationData) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateHome,
  onOpenLogin,
  onRegistrationSuccess,
}) => {
  // Form fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmaSenha, setShowConfirmaSenha] = useState(false);
  const [cpf, setCpf] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [telefone, setTelefone] = useState('');

  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');

  const [termos, setTermos] = useState(true);
  const [promocoes, setPromocoes] = useState(true);

  // Masks
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(v);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    v = v.replace(/(\d{2})(\d)/, '$1/$2');
    v = v.replace(/(\d{2})(\d)/, '$1/$2');
    setNascimento(v);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    setTelefone(v);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    setCep(v);
  };

  const handleAutoFillCEP = () => {
    setCep('01310-100');
    setRua('Avenida Paulista');
    setBairro('Bela Vista');
    setCidade('São Paulo');
    setUf('SP');
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!senha) return { score: 0, label: 'Força: -', width: '0%', colorClass: 'bg-status-danger', textClass: 'text-text-tertiary' };
    let score = 0;
    if (senha.length >= 8) score++;
    if (/[A-Z]/.test(senha)) score++;
    if (/[0-9]/.test(senha)) score++;
    if (/[^A-Za-z0-9]/.test(senha)) score++;

    if (score <= 1) {
      return { score, label: 'Fraca', width: '25%', colorClass: 'bg-status-danger', textClass: 'text-status-danger' };
    }
    if (score === 2) {
      return { score, label: 'Média', width: '50%', colorClass: 'bg-accent-gold', textClass: 'text-accent-gold' };
    }
    if (score === 3) {
      return { score, label: 'Boa', width: '75%', colorClass: 'bg-secondary', textClass: 'text-secondary' };
    }
    return { score, label: 'Excelente', width: '100%', colorClass: 'bg-accent-emerald-bright', textClass: 'text-accent-emerald-bright' };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== confirmaSenha) {
      alert('As senhas não coincidem. Por favor, confirme a senha corretamente.');
      return;
    }
    onRegistrationSuccess({
      name: nome || 'Aluno Deds',
      email: email || '',
      password: senha,
      cpf: cpf || '',
      phone: telefone || '',
      address: {
        cep: cep || undefined,
        street: rua || undefined,
        number: numero || undefined,
        complement: complemento || undefined,
        neighborhood: bairro || undefined,
        city: cidade || undefined,
        state: uf || undefined,
      },
    });
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-80 right-10 w-80 h-80 bg-tertiary-container/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop pt-space-lg pb-space-2xl">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-space-xs text-text-tertiary font-label-sm text-label-sm mb-space-md">
          <button
            onClick={() => onNavigateHome('hero-section')}
            className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-body-sm">home</span>
            Início
          </button>
          <span>/</span>
          <span className="text-text-tertiary">Autenticação</span>
          <span>/</span>
          <span className="text-primary font-label-md">Cadastre-se na Deds Academy</span>
        </div>

        {/* Header Title & Subtitle */}
        <div className="mb-space-xl text-center md:text-left">
          <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
            Crie sua Conta na <span className="text-primary">Deds Academy</span>
          </h1>
          <p className="font-body-md text-body-md text-text-secondary mt-space-2xs max-w-3xl">
            Preencha seus dados cadastrais para acessar cursos, emitir certificados reconhecidos e impulsionar sua carreira profissional.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Left Column: Authority & Benefits Card (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-space-md">
            <div className="bg-surface-raised rounded-xl p-space-lg shadow-xl relative overflow-hidden border border-border-subtle">
              <div className="absolute top-0 right-0 p-space-sm opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[100px] text-primary">school</span>
              </div>

              <div className="flex items-center gap-space-xs mb-space-md">
                <div className="w-11 h-11 rounded-lg bg-surface-overlay flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-headline-md">school</span>
                </div>
                <div>
                  <span className="font-headline-sm text-headline-sm text-text-primary block tracking-tight font-bold">
                    Deds <span className="text-primary">Academy</span>
                  </span>
                  <span className="font-label-sm text-label-sm text-text-tertiary">
                    Plataforma Oficial de Formação
                  </span>
                </div>
              </div>

              <div className="mb-space-md">
                <h2 className="font-headline-md text-headline-md text-text-primary leading-tight font-bold">
                  Aprenda. Evolua. Conquiste.
                </h2>
                <p className="font-body-sm text-body-sm text-text-secondary mt-space-2xs">
                  Junte-se à maior comunidade de especialistas técnicos e conquiste credenciais com real peso no mercado.
                </p>
              </div>

              {/* Graphic Banner */}
              <div className="relative rounded-lg overflow-hidden mb-space-md shadow-md">
                <img
                  alt="Certificados com Validade Nacional - Deds Academy"
                  className="w-full h-auto object-cover"
                  src="/images/certificado-validade-nacional.png"
                />
              </div>

              {/* 4 Pillars */}
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-start gap-space-xs">
                  <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-body-md">verified_user</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-text-primary font-semibold">
                      Validação Jurídica & Hash
                    </span>
                    <span className="font-body-sm text-body-sm text-text-tertiary leading-snug">
                      Conforme Lei Federal nº 9.394/96 e registro digital inviolável.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-space-xs">
                  <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-body-md">history_edu</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-text-primary font-semibold">
                      Horas Válidas para AACC
                    </span>
                    <span className="font-body-sm text-body-sm text-text-tertiary leading-snug">
                      Atividades curriculares complementares aceitas em faculdades do país.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-space-xs">
                  <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-body-md">lock</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-text-primary font-semibold">
                      Privacidade LGPD & SSL 256-bit
                    </span>
                    <span className="font-body-sm text-body-sm text-text-tertiary leading-snug">
                      Seus dados blindados com camadas rígidas de proteção institucional.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-space-xs">
                  <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-body-md">support_agent</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-text-primary font-semibold">
                      Suporte Humanizado Imediato
                    </span>
                    <span className="font-body-sm text-body-sm text-text-tertiary leading-snug">
                      Canais ativos via WhatsApp e painel de chamados sem filas.
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating strip */}
              <div className="mt-space-md pt-space-md bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between border border-border-subtle">
                <div className="flex items-center gap-space-xs">
                  <div className="flex text-accent-gold">
                    <span className="material-symbols-outlined text-body-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-body-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-body-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-body-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-body-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                  </div>
                  <span className="font-label-lg text-label-lg text-text-primary font-bold">4.9/5</span>
                </div>
                <span className="font-body-sm text-body-sm text-text-secondary">+48.000 alunos</span>
              </div>
            </div>

            {/* Already have account card */}
            <div className="bg-surface-raised rounded-xl p-space-md shadow-md flex items-center justify-between border border-border-subtle">
              <div className="flex items-center gap-space-xs">
                <div className="w-9 h-9 rounded-lg bg-surface-overlay flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-headline-sm">login</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-text-primary font-bold">
                    Já possui conta?
                  </span>
                  <span className="font-body-sm text-body-sm text-text-tertiary">
                    Acesse o portal do aluno
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-space-sm py-space-2xs bg-surface-overlay hover:bg-surface-container-high text-primary font-label-md text-label-md rounded-lg transition-colors cursor-pointer"
              >
                Entrar
              </button>
            </div>

            {/* Study at your pace card */}
            <div className="rounded-xl overflow-hidden shadow-lg relative border border-border-subtle">
              <img
                alt="Estude no seu ritmo - Deds Academy"
                className="w-full h-auto object-cover"
                src="/images/estude-no-seu-ritmo.jpg"
              />
            </div>
          </div>

          {/* Right Column: Form (lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="bg-surface-raised rounded-xl p-space-md md:p-space-xl shadow-xl border border-border-subtle">
              {/* Quick Social Login */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm pb-space-md mb-space-lg bg-surface-container-lowest/40 rounded-lg p-space-md border border-border-subtle">
                <div>
                  <span className="font-label-md text-label-md text-text-primary font-bold">
                    Cadastro Rápido com Redes
                  </span>
                  <p className="font-body-sm text-body-sm text-text-tertiary">
                    Preencha instantaneamente usando suas credenciais sociais seguras:
                  </p>
                </div>
                <div className="flex items-center gap-space-xs w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setNome('André Silva');
                      setEmail('andre.ads567@gmail.com');
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-space-2xs px-space-md py-space-xs bg-surface-overlay hover:bg-surface-container-high rounded-lg text-text-primary font-label-md text-label-md transition-all shadow-sm cursor-pointer border border-border-subtle"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNome('André Silva');
                      setEmail('andre.ads567@gmail.com');
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-space-2xs px-space-md py-space-xs bg-surface-overlay hover:bg-surface-container-high rounded-lg text-text-primary font-label-md text-label-md transition-all shadow-sm cursor-pointer border border-border-subtle"
                  >
                    <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>

              {/* Real Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-space-xl">
                {/* Step 1: Personal & Access Data */}
                <div>
                  <div className="flex items-center gap-space-xs mb-space-md">
                    <span className="w-7 h-7 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center font-bold">
                      1
                    </span>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                        Dados Pessoais & Acesso
                      </h3>
                      <p className="font-body-sm text-body-sm text-text-tertiary">
                        Informações essenciais para identificação e login do aluno.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {/* Nome Completo */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="nome">
                          Nome Completo
                          <span className="text-status-danger">*</span>
                        </label>
                        <span className="font-label-sm text-label-sm text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">info</span>
                          Como deve constar no seu certificado
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-space-md text-text-tertiary pointer-events-none">
                          person
                        </span>
                        <input
                          id="nome"
                          required
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          placeholder="Ex: Lucas Gabriel da Silva"
                          className="w-full h-12 pl-12 pr-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                          type="text"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="email">
                        E-mail Profissional ou Pessoal
                        <span className="text-status-danger">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-space-md text-text-tertiary pointer-events-none">
                          mail
                        </span>
                        <input
                          id="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seuemail@exemplo.com.br"
                          className="w-full h-12 pl-12 pr-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                          type="email"
                        />
                      </div>
                    </div>

                    {/* Senha */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="senha">
                        Senha de Acesso
                        <span className="text-status-danger">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-space-md text-text-tertiary pointer-events-none">
                          lock
                        </span>
                        <input
                          id="senha"
                          required
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          className="w-full h-12 pl-12 pr-12 bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                          type={showSenha ? 'text' : 'password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSenha(!showSenha)}
                          className="absolute right-space-md text-text-tertiary hover:text-text-primary cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-body-lg">
                            {showSenha ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {/* Password strength bar */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.colorClass} transition-all duration-300`}
                            style={{ width: passwordStrength.width }}
                          />
                        </div>
                        <span className={`font-label-sm text-label-sm ${passwordStrength.textClass}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>

                    {/* Confirmar Senha */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="confirmaSenha">
                        Confirmar Senha
                        <span className="text-status-danger">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-space-md text-text-tertiary pointer-events-none">
                          lock_reset
                        </span>
                        <input
                          id="confirmaSenha"
                          required
                          value={confirmaSenha}
                          onChange={(e) => setConfirmaSenha(e.target.value)}
                          placeholder="Repita a senha criada"
                          className="w-full h-12 pl-12 pr-12 bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                          type={showConfirmaSenha ? 'text' : 'password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmaSenha(!showConfirmaSenha)}
                          className="absolute right-space-md text-text-tertiary hover:text-text-primary cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-body-lg">
                            {showConfirmaSenha ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      <span className="font-label-sm text-label-sm text-text-tertiary">
                        Use letras, números e caracteres especiais.
                      </span>
                    </div>

                    {/* CPF */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="cpf">
                          CPF
                          <span className="text-status-danger">*</span>
                        </label>
                        <span className="font-label-sm text-label-sm text-accent-emerald-bright">
                          Necessário p/ Certificado
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-space-md text-text-tertiary pointer-events-none">
                          badge
                        </span>
                        <input
                          id="cpf"
                          required
                          value={cpf}
                          onChange={handleCpfChange}
                          maxLength={14}
                          placeholder="000.000.000-00"
                          className="w-full h-12 pl-12 pr-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                          type="text"
                        />
                      </div>
                    </div>

                    {/* Data de Nascimento */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="nascimento">
                        Data de Nascimento
                        <span className="text-status-danger">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-space-md text-text-tertiary pointer-events-none">
                          calendar_month
                        </span>
                        <input
                          id="nascimento"
                          required
                          value={nascimento}
                          onChange={handleDateChange}
                          maxLength={10}
                          placeholder="DD/MM/AAAA"
                          className="w-full h-12 pl-12 pr-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                          type="text"
                        />
                      </div>
                    </div>

                    {/* Telefone / WhatsApp */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="telefone">
                        Telefone / WhatsApp
                        <span className="text-status-danger">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-space-md text-text-tertiary pointer-events-none">
                          call
                        </span>
                        <input
                          id="telefone"
                          required
                          value={telefone}
                          onChange={handlePhoneChange}
                          maxLength={15}
                          placeholder="(00) 00000-0000"
                          className="w-full h-12 pl-12 pr-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                          type="tel"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Address Data */}
                <div>
                  <div className="flex items-center gap-space-xs mb-space-md">
                    <span className="w-7 h-7 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center font-bold">
                      2
                    </span>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                        Endereço Residencial / Cobrança
                      </h3>
                      <p className="font-body-sm text-body-sm text-text-tertiary">
                        Utilizado para emissão de notas fiscais e envio de kits quando aplicável.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-space-md">
                    {/* CEP */}
                    <div className="md:col-span-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="cep">
                          CEP
                          <span className="text-status-danger">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoFillCEP}
                          className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">search</span>
                          Buscar CEP
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-space-md text-text-tertiary pointer-events-none">
                          pin_drop
                        </span>
                        <input
                          id="cep"
                          required
                          value={cep}
                          onChange={handleCepChange}
                          maxLength={9}
                          placeholder="00000-000"
                          className="w-full h-12 pl-12 pr-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-3 flex flex-col justify-end">
                      <span className="text-body-sm font-body-sm text-text-tertiary pb-2">
                        Preenchimento automático do logradouro e bairro disponível pelo CEP.
                      </span>
                    </div>

                    {/* Rua */}
                    <div className="md:col-span-4 flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="rua">
                        Rua / Logradouro
                        <span className="text-status-danger">*</span>
                      </label>
                      <input
                        id="rua"
                        required
                        value={rua}
                        onChange={(e) => setRua(e.target.value)}
                        placeholder="Ex: Av. Paulista ou Rua das Flores"
                        className="w-full h-12 px-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                        type="text"
                      />
                    </div>

                    {/* Número */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="numero">
                        Número
                        <span className="text-status-danger">*</span>
                      </label>
                      <input
                        id="numero"
                        required
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder="Ex: 1420"
                        className="w-full h-12 px-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                        type="text"
                      />
                    </div>

                    {/* Complemento */}
                    <div className="md:col-span-3 flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary font-semibold" htmlFor="complemento">
                        Complemento / Cumprimento
                      </label>
                      <input
                        id="complemento"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                        placeholder="Apto 42, Bloco C, Sala 10 (Opcional)"
                        className="w-full h-12 px-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                        type="text"
                      />
                    </div>

                    {/* Bairro */}
                    <div className="md:col-span-3 flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="bairro">
                        Bairro
                        <span className="text-status-danger">*</span>
                      </label>
                      <input
                        id="bairro"
                        required
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Ex: Bela Vista"
                        className="w-full h-12 px-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                        type="text"
                      />
                    </div>

                    {/* Cidade */}
                    <div className="md:col-span-4 flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="cidade">
                        Cidade
                        <span className="text-status-danger">*</span>
                      </label>
                      <input
                        id="cidade"
                        required
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full h-12 px-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md placeholder:text-text-tertiary focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all"
                        type="text"
                      />
                    </div>

                    {/* Estado / UF */}
                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-text-primary flex items-center gap-1 font-semibold" htmlFor="uf">
                        Estado / UF
                        <span className="text-status-danger">*</span>
                      </label>
                      <select
                        id="uf"
                        required
                        value={uf}
                        onChange={(e) => setUf(e.target.value)}
                        className="w-full h-12 px-space-md bg-surface-container-low rounded-lg text-text-primary font-body-md text-body-md focus:outline-none focus:bg-surface-container border border-border-subtle focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="" disabled>
                          UF
                        </option>
                        {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((state) => (
                          <option key={state} value={state} className="bg-surface-raised text-text-primary">
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Terms and consent checkboxes */}
                <div className="pt-space-sm flex flex-col gap-space-sm bg-surface-container-low/50 p-space-md rounded-xl border border-border-subtle">
                  <label className="flex items-start gap-space-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termos}
                      onChange={(e) => setTermos(e.target.checked)}
                      required
                      className="w-5 h-5 rounded mt-0.5 bg-surface-overlay accent-[#00b074] cursor-pointer"
                    />
                    <span className="font-body-sm text-body-sm text-text-secondary leading-snug">
                      Declaro que li e concordo expressamente com os{' '}
                      <a className="text-primary hover:underline" href="#" onClick={(e) => e.preventDefault()}>
                        Termos de Serviço
                      </a>{' '}
                      e a{' '}
                      <a className="text-primary hover:underline" href="#" onClick={(e) => e.preventDefault()}>
                        Política de Privacidade
                      </a>{' '}
                      da Deds Academy.
                    </span>
                  </label>

                  <label className="flex items-start gap-space-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={promocoes}
                      onChange={(e) => setPromocoes(e.target.checked)}
                      className="w-5 h-5 rounded mt-0.5 bg-surface-overlay accent-[#00b074] cursor-pointer"
                    />
                    <span className="font-body-sm text-body-sm text-text-secondary leading-snug">
                      Desejo receber cupons promocionais semanais, novidades sobre novas trilhas e lançamentos por e-mail e WhatsApp.
                    </span>
                  </label>
                </div>

                {/* Submit & Secondary link */}
                <div className="flex flex-col gap-space-sm">
                  <button
                    type="submit"
                    className="w-full h-14 bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-label-lg text-label-lg font-bold rounded-xl flex items-center justify-center gap-space-xs shadow-[0_0_25px_-3px_rgba(0,176,116,0.45)] hover:shadow-[0_0_30px_-2px_rgba(0,208,132,0.6)] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-headline-sm">check_circle</span>
                    <span>Finalizar Cadastro e Acessar Plataforma</span>
                  </button>

                  <div className="flex items-center justify-center gap-space-xs pt-space-xs text-center font-body-sm text-body-sm text-text-tertiary">
                    <span>Já possui cadastro ativo?</span>
                    <button
                      type="button"
                      onClick={onOpenLogin}
                      className="font-label-md text-label-md text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                    >
                      Entrar na Conta
                      <span className="material-symbols-outlined text-body-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Bottom 3 Security Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
              <div className="bg-surface-raised rounded-lg p-space-sm flex items-center gap-space-xs shadow-sm border border-border-subtle">
                <span className="material-symbols-outlined text-primary text-headline-sm">shield_lock</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-text-primary font-bold">
                    Conexão Segura
                  </span>
                  <span className="font-body-sm text-body-sm text-text-tertiary">
                    Criptografia Ponta a Ponta
                  </span>
                </div>
              </div>

              <div className="bg-surface-raised rounded-lg p-space-sm flex items-center gap-space-xs shadow-sm border border-border-subtle">
                <span className="material-symbols-outlined text-accent-gold text-headline-sm">
                  workspace_premium
                </span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-text-primary font-bold">
                    Cursos Extracurriculares
                  </span>
                  <span className="font-body-sm text-body-sm text-text-tertiary">
                    Horas Complementares
                  </span>
                </div>
              </div>

              <div className="bg-surface-raised rounded-lg p-space-sm flex items-center gap-space-xs shadow-sm border border-border-subtle">
                <span className="material-symbols-outlined text-secondary text-headline-sm">bolt</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-text-primary font-bold">
                    Liberação Imediata
                  </span>
                  <span className="font-body-sm text-body-sm text-text-tertiary">
                    Sem espera por validação
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
