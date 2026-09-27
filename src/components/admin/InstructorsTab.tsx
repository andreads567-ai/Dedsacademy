import React, { useState, useRef } from 'react';
import { Instructor, Course } from '../../types';

interface InstructorsTabProps {
  instructors: Instructor[];
  courses: Course[];
  onAddInstructor: (instructor: Instructor) => void;
  onUpdateInstructor: (instructor: Instructor) => void;
  onDeleteInstructor: (instructorId: string) => void;
}

export const InstructorsTab: React.FC<InstructorsTabProps> = ({
  instructors,
  courses,
  onAddInstructor,
  onUpdateInstructor,
  onDeleteInstructor,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    specialty: 'Tecnologia & IA',
    avatar: '',
  });

  const handleOpenCreate = () => {
    setEditingInstructor(null);
    setShowUrlInput(false);
    setForm({
      name: '',
      email: '',
      role: '',
      specialty: 'Tecnologia & IA',
      avatar: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inst: Instructor) => {
    setEditingInstructor(inst);
    setShowUrlInput(Boolean(inst.avatar && inst.avatar.startsWith('http')));
    setForm({
      name: inst.name,
      email: inst.email,
      role: inst.role,
      specialty: inst.specialty,
      avatar: inst.avatar,
    });
    setIsModalOpen(true);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie um arquivo de imagem válido (PNG, JPG, WEBP, etc.).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, avatar: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDropPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingInstructor) {
      onUpdateInstructor({
        ...editingInstructor,
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        specialty: form.specialty,
        avatar: form.avatar,
      });
    } else {
      const newInst: Instructor = {
        id: `inst-${Date.now()}`,
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        specialty: form.specialty,
        avatar: form.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        coursesCount: 1,
        studentsCount: 0,
        rating: 5.0,
        status: 'ativo',
      };
      onAddInstructor(newInst);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (instructorToDelete) {
      onDeleteInstructor(instructorToDelete.id);
      setInstructorToDelete(null);
    }
  };

  const filteredInstructors = instructors.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.specialty.toLowerCase().includes(search.toLowerCase()) ||
      i.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">co_present</span>
              Corpo Docente &amp; Gestão de Instrutores
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary">
              {instructors.length} Instrutores Ativos
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Especialistas e professores responsáveis pelas aulas, materiais e assinaturas dos certificados.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Novo Instrutor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-tertiary text-base">
          search
        </span>
        <input
          type="text"
          placeholder="Buscar instrutor por nome, área ou titulação..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary placeholder:text-text-tertiary"
        />
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInstructors.map((inst) => {
          // Count assigned courses
          const assignedCount =
            courses.filter((c) =>
              c.instructor.toLowerCase().includes(inst.name.toLowerCase())
            ).length || inst.coursesCount;

          return (
            <div
              key={inst.id}
              className="p-5 rounded-2xl bg-surface-raised border border-border-subtle hover:border-border-strong transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group"
            >
              <div>
                {/* Cabeçalho do Card: Informações principais e Ações discretas internas */}
                <div className="flex items-start justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={inst.avatar}
                      alt={inst.name}
                      className="w-12 h-12 rounded-xl object-cover border border-border-subtle bg-surface-overlay shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <h4
                        onClick={() => handleOpenEdit(inst)}
                        className="text-sm font-bold text-text-primary hover:text-primary transition-colors truncate cursor-pointer"
                        title={inst.name}
                      >
                        {inst.name}
                      </h4>
                      <span
                        className="text-[11px] text-text-tertiary block truncate"
                        title={inst.email}
                      >
                        {inst.email}
                      </span>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 truncate max-w-full">
                        {inst.specialty}
                      </span>
                    </div>
                  </div>

                  {/* Ações Discretas dentro dos limites estruturais do card */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(inst);
                      }}
                      className="w-8 h-8 rounded-lg bg-surface-overlay hover:bg-surface-container border border-border-subtle hover:border-primary/40 text-text-secondary hover:text-primary flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                      title="Editar dados do instrutor"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInstructorToDelete(inst);
                      }}
                      className="w-8 h-8 rounded-lg bg-surface-overlay hover:bg-status-danger/15 border border-border-subtle hover:border-status-danger/40 text-text-secondary hover:text-status-danger flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                      title="Excluir instrutor"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                {/* Biografia / Titulação Acadêmica */}
                <p
                  className="text-xs text-text-secondary line-clamp-2 mt-2 leading-relaxed"
                  title={inst.role}
                >
                  {inst.role}
                </p>
              </div>

              {/* Rodapé do Card: Avaliação e Cursos */}
              <div className="mt-4 pt-3 border-t border-border-subtle/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-accent-gold font-bold">
                  <span className="material-symbols-outlined text-sm">star</span>
                  <span>{inst.rating.toFixed(1)}</span>
                </div>

                <div className="text-text-tertiary">
                  <strong className="text-text-primary">{assignedCount}</strong> {assignedCount === 1 ? 'curso ministrado' : 'cursos ministrados'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastrar / Editar Instrutor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">co_present</span>
                <h3 className="text-base font-bold text-text-primary">
                  {editingInstructor ? 'Atualizar Dados do Instrutor' : 'Cadastrar Novo Instrutor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Nome Completo <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Prof. Dr. André Ribeiro"
                  className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    E-mail de Contato <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="instrutor@dedsacademy.com.br"
                    className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Área / Especialidade
                  </label>
                  <input
                    type="text"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    placeholder="Ex: Tecnologia & IA"
                    className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Titulação / Bio Acadêmica
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Ex: Doutor em Engenharia de Software com 12 anos de atuação"
                  className="w-full px-3.5 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>

              {/* Importar Foto de Perfil do Instrutor */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-text-secondary">
                    Foto de Perfil do Instrutor
                  </label>
                  <span className="text-[10px] text-text-tertiary">PNG, JPG ou WEBP (até 5MB)</span>
                </div>

                {/* Input oculto de arquivo */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Caso já exista foto selecionada ou importada */}
                {form.avatar ? (
                  <div className="p-3 bg-surface-overlay border border-border-subtle rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={form.avatar}
                        alt="Pré-visualização do instrutor"
                        className="w-14 h-14 rounded-xl object-cover border border-border-subtle bg-surface-base shrink-0 shadow-xs"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-text-primary block flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                          Foto pronta para o perfil
                        </span>
                        <span className="text-[11px] text-text-tertiary block truncate">
                          {form.avatar.startsWith('data:') ? 'Arquivo de imagem importado' : form.avatar}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-container border border-border-subtle text-xs font-semibold text-text-primary hover:text-primary transition-all cursor-pointer flex items-center gap-1"
                        title="Substituir por outra foto"
                      >
                        <span className="material-symbols-outlined text-sm">cached</span>
                        <span>Trocar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, avatar: '' }))}
                        className="p-1.5 rounded-lg bg-surface-raised hover:bg-status-danger/15 border border-border-subtle hover:border-status-danger/40 text-text-tertiary hover:text-status-danger transition-all cursor-pointer"
                        title="Remover foto"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Campo de Drag-and-Drop & Seleção de Arquivo */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(true);
                    }}
                    onDragLeave={() => setIsDraggingPhoto(false)}
                    onDrop={handleDropPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      isDraggingPhoto
                        ? 'border-primary bg-primary/10 scale-[1.01]'
                        : 'border-border-subtle bg-surface-overlay/50 hover:bg-surface-overlay hover:border-primary/50'
                    }`}
                  >
                    <div className="w-11 h-11 mx-auto mb-2 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                    </div>
                    <p className="text-xs font-bold text-text-primary">
                      Importar Foto de Perfil
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      Clique para escolher o arquivo ou arraste a foto aqui
                    </p>
                  </div>
                )}

                {/* Opção alternativa discreta para colar link de imagem web */}
                <div className="mt-2 text-right">
                  {!showUrlInput ? (
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(true)}
                      className="text-[11px] text-text-tertiary hover:text-primary transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">link</span>
                      <span>Ou colar link da imagem (URL)</span>
                    </button>
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="url"
                        value={form.avatar}
                        onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                        placeholder="Cole aqui a URL da imagem (https://...)"
                        className="flex-1 px-3 py-1.5 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-surface-overlay border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-overlay text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-container hover:bg-accent-emerald-bright text-on-primary text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  {editingInstructor ? 'Salvar Dados' : 'Cadastrar Instrutor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Instrutor */}
      {instructorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setInstructorToDelete(null)}
          />
          <div className="relative w-full max-w-md bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-status-danger/15 text-status-danger flex items-center justify-center mb-4 border border-status-danger/30">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-text-primary">
              Excluir Instrutor?
            </h3>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              Você tem certeza de que deseja excluir o instrutor{' '}
              <strong className="text-text-primary">"{instructorToDelete.name}"</strong>?
              Essa ação é irreversível e removerá o vínculo do perfil com novos cursos.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setInstructorToDelete(null)}
                className="px-4 py-2 rounded-xl bg-surface-overlay hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-bold cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-status-danger hover:bg-red-600 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
