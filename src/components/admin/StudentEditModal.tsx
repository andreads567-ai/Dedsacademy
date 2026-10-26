import React, { useState, useEffect } from 'react';
import { UserAccount, Course } from '../../types';
import { sendPasswordResetEmail } from '../../services/emailService';

interface StudentEditModalProps {
  isOpen: boolean;
  student: UserAccount | null;
  courses: Course[];
  onClose: () => void;
  onSave: (student: UserAccount) => void;
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  isOpen,
  student,
  courses,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    studentCode: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'pendente',
    password: '',
    address: {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
    enrolledCourseIds: [] as string[],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        cpf: student.cpf || '',
        studentCode: student.studentCode || (student.id ? student.id.replace('user-', '').toUpperCase() : ''),
        status: student.status || 'ativo',
        password: student.password || '',
        address: {
          cep: student.address?.cep || '',
          street: student.address?.street || '',
          number: student.address?.number || '',
          complement: student.address?.complement || '',
          neighborhood: student.address?.neighborhood || '',
          city: student.address?.city || '',
          state: student.address?.state || '',
        },
        enrolledCourseIds: student.enrolledCourseIds ? [...student.enrolledCourseIds] : [],
      });
    } else {
      // Default for new student
      setFormData({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        studentCode: `ALU-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'ativo',
        password: '',
        address: {
          cep: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
        },
        enrolledCourseIds: [],
      });
    }
    setFeedbackMessage(null);
    setCopiedPassword(false);
  }, [student, isOpen]);

  if (!isOpen) return null;

  // Busca de Endereço via CEP (ViaCEP)
  const handleSearchCep = async () => {
    const rawCep = formData.address.cep.replace(/\D/g, '');
    if (rawCep.length !== 8) {
      setCepError('Digite um CEP válido com 8 dígitos.');
      return;
    }
    setCepError(null);
    setIsSearchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
      } else {
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.logradouro || prev.address.street,
            neighborhood: data.bairro || prev.address.neighborhood,
            city: data.localidade || prev.address.city,
            state: data.uf || prev.address.state,
          },
        }));
        setFeedbackMessage({ type: 'info', text: 'Endereço localizado com sucesso pelo CEP!' });
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } catch {
      setCepError('Falha ao consultar CEP. Preencha manualmente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  // Gerador de senha forte aleatória
  const handleGeneratePassword = () => {
    const prefixes = ['Deds', 'Aluno', 'Sucesso', 'Pro', 'Acesso'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(1000 + Math.random() * 9000);
    const symbols = ['!', '@', '#', '$', '%', '&', '*'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const newPass = `${prefix}@${number}${symbol}`;

    setFormData((prev) => ({ ...prev, password: newPass }));
    setShowPassword(true);
    setCopiedPassword(false);
    setFeedbackMessage({
      type: 'success',
      text: `Nova senha gerada: "${newPass}". Você pode copiá-la ou salvá-la diretamente.`,
    });
  };

  // Copiar senha
  const handleCopyPassword = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  // Enviar e-mail de recuperação de senha
  const handleSendResetEmail = async () => {
    if (!formData.email) {
      setFeedbackMessage({ type: 'error', text: 'Informe um e-mail válido para enviar as instruções.' });
      return;
    }
    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(formData.email.trim());
      setFeedbackMessage({
        type: 'success',
        text: `Link de recuperação e código seguro enviados com sucesso para "${formData.email}"!`,
      });
    } catch (e) {
      console.error(e);
      setFeedbackMessage({
        type: 'error',
        text: 'Erro ao despachar e-mail de recuperação. Verifique as configurações de SMTP/API.',
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  // Alternar matrícula de curso
  const toggleCourseEnrollment = (courseId: string) => {
    setFormData((prev) => {
      const exists = prev.enrolledCourseIds.includes(courseId);
      return {
        ...prev,
        enrolledCourseIds: exists
          ? prev.enrolledCourseIds.filter((id) => id !== courseId)
          : [...prev.enrolledCourseIds, courseId],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Nome e E-mail são obrigatórios.' });
      return;
    }

    const updatedUser: UserAccount = {
      id: student ? student.id : `user-aluno-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: 'aluno',
      phone: formData.phone.trim(),
      cpf: formData.cpf.trim(),
      studentCode: formData.studentCode.trim() || undefined,
      password: formData.password || undefined,
      status: formData.status,
      address: {
        cep: formData.address.cep.trim(),
        street: formData.address.street.trim(),
        number: formData.address.number.trim(),
        complement: formData.address.complement.trim(),
        neighborhood: formData.address.neighborhood.trim(),
        city: formData.address.city.trim(),
        state: formData.address.state.trim().toUpperCase(),
      },
      registeredAt: student?.registeredAt || new Date().toLocaleDateString('pt-BR'),
      lastAccess: student?.lastAccess || 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      enrolledCourseIds: formData.enrolledCourseIds,
      completedCourseIds: student?.completedCourseIds || [],
      avatar: student?.avatar,
      certificateData: student?.certificateData,
    };

    onSave(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-xl">person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  {student ? 'Detalhes & Edição do Aluno' : 'Cadastrar Novo Aluno'}
                </h3>
                {formData.studentCode && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                    {formData.studentCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                {student
                  ? `Gerenciando dados cadastrais, endereço, cursos e credenciais de ${student.name}`
                  : 'Preencha os dados completos para cadastrar o aluno na plataforma.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              feedbackMessage.type === 'success'
                ? 'bg-accent-emerald-bright/15 text-accent-emerald-bright border-accent-emerald-bright/30'
                : feedbackMessage.type === 'error'
                ? 'bg-status-danger/15 text-status-danger border-status-danger/30'
                : 'bg-primary/15 text-primary border-primary/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                {feedbackMessage.type === 'success' ? 'check_circle' : feedbackMessage.type === 'error' ? 'error' : 'info'}
              </span>
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-text-tertiary hover:text-text-primary text-xs underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Seção 1: Dados Pessoais & Contato */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold border-b border-border-subtle/70 pb-2">
              <span className="material-symbols-outlined text-primary text-base">badge</span>
              <span className="text-xs uppercase tracking-wider">1. Dados Pessoais &amp; Contato</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-text-secondary mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">E-mail Institucional / Login *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aluno@email.com"
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">CPF (Identificação Oficial)</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-text-secondary mb-1">Status da Matrícula / Conta</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary cursor-pointer"
                >
                  <option value="ativo">Ativo (Acesso Liberado)</option>
                  <option value="pendente">Pendente (Aguardando Confirmação)</option>
                  <option value="inativo">Inativo / Bloqueado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereço Cadastral Completo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-bold border-b border-border-subtle/70 pb-2">
              <span className="material-symbols-outlined text-primary text-base">home_pin</span>
              <span className="text-xs uppercase tracking-wider">2. Endereço Residencial Cadastrado</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* CEP */}
              <div className="sm:col-span-5">
                <label className="block font-bold text-text-secondary mb-1">CEP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.address.cep}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, cep: e.target.value },
                    })}
                    placeholder="00000-000"
                    className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleSearchCep}
                    disabled={isSearchingCep}
                    className="px-3 py-2 bg-surface-overlay hover:bg-surface-container border border-border-subtle rounded-xl text-text-secondary hover:text-text-primary font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                    title="Buscar endereço pelo CEP"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isSearchingCep ? 'sync' : 'search'}
                    </span>
                    <span>Buscar</span>
                  </button>
                </div>
                {cepError && <span className="text-[11px] text-status-danger mt-1 block">{cepError}</span>}
              </div>

              {/* Logradouro */}
              <div className="sm:col-span-7">
                <label className="block font-bold text-text-secondary mb-1">Logradouro / Rua / Avenida</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })}
                  placeholder="Ex: Av. Paulista"
                  className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Número */}
              <div className="sm:col-span-4">
                <label className="block font-bold text-text-secondary mb-1">Número</label>
                <input
                  type="text"
                  value={formData.address.number}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, number: e.target.value },
                  })}
                  placeholder="Ex: 1578"
                  className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Complemento */}
              <div className="sm:col-span-4">
                <label className="block font-bold text-text-secondary mb-1">Complemento</label>
                <input
                  type="text"
                  value={formData.address.complement}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, complement: e.target.value },
                  })}
                  placeholder="Apto 42, Bloco B"
                  className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Bairro */}
              <div className="sm:col-span-4">
                <label className="block font-bold text-text-secondary mb-1">Bairro</label>
                <input
                  type="text"
                  value={formData.address.neighborhood}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, neighborhood: e.target.value },
                  })}
                  placeholder="Bela Vista"
                  className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Cidade */}
              <div className="sm:col-span-8">
                <label className="block font-bold text-text-secondary mb-1">Cidade</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })}
                  placeholder="São Paulo"
                  className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Estado / UF */}
              <div className="sm:col-span-4">
                <label className="block font-bold text-text-secondary mb-1">Estado (UF)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.address.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value.toUpperCase() },
                  })}
                  placeholder="SP"
                  className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-text-primary outline-none focus:border-primary uppercase"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Gestão de Senha & Segurança */}
          <div className="space-y-3 p-4 rounded-2xl bg-surface-overlay border border-border-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">lock_reset</span>
                <span className="text-xs uppercase font-bold text-text-primary">
                  3. Gestão e Segurança de Senha do Aluno
                </span>
              </div>
              <span className="text-[11px] text-text-tertiary">
                Edite diretamente, gere senhas automáticas ou envie instruções por e-mail
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Campo de Senha com Edição Direta */}
              <div>
                <label className="block font-bold text-text-secondary mb-1">
                  Senha do Aluno (Edição Direta pelo Administrador)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Digite uma nova senha para o aluno ou gere automaticamente"
                    className="w-full pl-3.5 pr-24 py-2.5 bg-surface-raised border border-border-subtle rounded-xl text-text-primary font-mono text-xs outline-none focus:border-primary"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {formData.password && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="p-1 rounded text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                        title="Copiar Senha"
                      >
                        <span className="material-symbols-outlined text-base">
                          {copiedPassword ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar Senha' : 'Ver Senha'}
                    >
                      <span className="material-symbols-outlined text-base">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Botões de Ação para Gestão de Senha */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {/* Botão: Gerar Senha Automática */}
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Gera uma senha forte e segura automaticamente"
                >
                  <span className="material-symbols-outlined text-base">key</span>
                  <span>Gerar Senha Automática</span>
                </button>

                {/* Botão: Enviar E-mail de Recuperação de Senha */}
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={isSendingResetEmail || !formData.email}
                  className="px-3.5 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/25 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  title="Envia link seguro e código de redefinição para a caixa de e-mail do aluno"
                >
                  <span className="material-symbols-outlined text-base">
                    {isSendingResetEmail ? 'sync' : 'mark_email_read'}
                  </span>
                  <span>{isSendingResetEmail ? 'Enviando...' : 'Enviar Recuperação por E-mail'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seção 4: Cursos Liberados para Matrícula */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle/70 pb-2">
              <div className="flex items-center gap-2 text-text-primary font-bold">
                <span className="material-symbols-outlined text-primary text-base">school</span>
                <span className="text-xs uppercase tracking-wider">4. Cursos Liberados para Acesso</span>
              </div>
              <span className="text-[11px] font-bold text-primary">
                {formData.enrolledCourseIds.length} {formData.enrolledCourseIds.length === 1 ? 'curso liberado' : 'cursos liberados'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {courses.map((course) => {
                const isSelected = formData.enrolledCourseIds.includes(course.id);
                return (
                  <label
                    key={course.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30 text-text-primary shadow-xs'
                        : 'bg-surface-overlay border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-subtle/80'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCourseEnrollment(course.id)}
                      className="rounded border-border-subtle text-primary focus:ring-primary h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold block truncate text-xs">{course.title}</span>
                      <span className="text-[10px] text-text-tertiary">
                        {course.category} • {course.hours}h
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer de Ações */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface-overlay text-text-secondary hover:text-text-primary font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>{student ? 'Salvar Atualizações' : 'Cadastrar Aluno'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
