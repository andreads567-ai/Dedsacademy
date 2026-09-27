import React, { useState, useMemo } from 'react';
import { CourseReview, Course, Category } from '../../types';

interface CourseReviewsTabProps {
  reviews: CourseReview[];
  courses: Course[];
  categories?: Category[];
  onDeleteReview: (reviewId: string) => void;
}

export const CourseReviewsTab: React.FC<CourseReviewsTabProps> = ({
  reviews,
  courses,
  categories = [],
  onDeleteReview,
}) => {
  // Filters state
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('todos');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedRating, setSelectedRating] = useState<number | 'todos'>('todos');

  // Deletion modal state
  const [reviewToDelete, setReviewToDelete] = useState<CourseReview | null>(null);

  // Extract unique categories from courses and reviews
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    courses.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    reviews.forEach((r) => {
      if (r.courseCategory) cats.add(r.courseCategory);
    });
    categories.forEach((c) => {
      if (c.name) cats.add(c.name);
    });
    return Array.from(cats).sort();
  }, [courses, reviews, categories]);

  // Extract unique courses that have reviews or exist in catalog
  const availableCourses = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach((c) => map.set(c.id, c.title));
    reviews.forEach((r) => map.set(r.courseId, r.courseTitle));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [courses, reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      // Filter by Student Name or Code
      if (searchStudent.trim()) {
        const query = searchStudent.toLowerCase().trim();
        const matchesName = rev.studentName.toLowerCase().includes(query);
        const matchesCode = rev.studentCode?.toLowerCase().includes(query);
        const matchesEmail = rev.studentEmail?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesEmail) {
          return false;
        }
      }

      // Filter by Course
      if (selectedCourse !== 'todos') {
        if (rev.courseId !== selectedCourse && rev.courseTitle !== selectedCourse) {
          return false;
        }
      }

      // Filter by Category
      if (selectedCategory !== 'todas') {
        if (rev.courseCategory !== selectedCategory) {
          return false;
        }
      }

      // Filter by Rating
      if (selectedRating !== 'todos') {
        if (rev.rating !== selectedRating) {
          return false;
        }
      }

      return true;
    });
  }, [reviews, searchStudent, selectedCourse, selectedCategory, selectedRating]);

  // Statistics calculation
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fiveStarPercent = totalReviews > 0 ? Math.round((fiveStarCount / totalReviews) * 100) : 0;

  const handleConfirmDelete = () => {
    if (reviewToDelete) {
      onDeleteReview(reviewToDelete.id);
      setReviewToDelete(null);
    }
  };

  const handleResetFilters = () => {
    setSearchStudent('');
    setSelectedCourse('todos');
    setSelectedCategory('todas');
    setSelectedRating('todos');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Botão 11 • Gestão Acadêmica
            </span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-28">reviews</span>
            Avaliação de Cursos
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Monitore a satisfação, leia as opiniões dos alunos com notas em estrelas e gerencie avaliações dos cursos.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">star</span>
          </div>
          <div>
            <span className="text-xs text-text-secondary font-medium block">Média Geral</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-text-primary">{averageRating}</span>
              <span className="text-xs text-text-tertiary">/ 5.0</span>
            </div>
            <div className="flex items-center text-[11px] text-amber-400 mt-0.5">
              {'★'.repeat(Math.round(Number(averageRating)))}
              {'☆'.repeat(5 - Math.round(Number(averageRating)))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">rate_review</span>
          </div>
          <div>
            <span className="text-xs text-text-secondary font-medium block">Total de Opiniões</span>
            <span className="text-2xl font-bold text-text-primary">{totalReviews}</span>
            <span className="text-[11px] text-text-tertiary block mt-0.5">Avaliações públicas</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">thumb_up</span>
          </div>
          <div>
            <span className="text-xs text-text-secondary font-medium block">5 Estrelas (Excelência)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-400">{fiveStarPercent}%</span>
              <span className="text-xs text-text-tertiary">({fiveStarCount} de {totalReviews})</span>
            </div>
            <span className="text-[11px] text-emerald-500 block mt-0.5">Altíssima aprovação</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_stories</span>
          </div>
          <div>
            <span className="text-xs text-text-secondary font-medium block">Cursos Avaliados</span>
            <span className="text-2xl font-bold text-text-primary">
              {new Set(reviews.map((r) => r.courseId)).size}
            </span>
            <span className="text-[11px] text-text-tertiary block mt-0.5">Com feedback ativo</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR: Student Name, Course Name, Category, Star Rating */}
      <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">filter_alt</span>
            Filtros de Pesquisa
          </span>
          {(searchStudent || selectedCourse !== 'todos' || selectedCategory !== 'todas' || selectedRating !== 'todos') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filter 1: Nome do Aluno */}
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
              Filtrar por Nome do Aluno
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-lg">
                person_search
              </span>
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Ex: André Silva, ALU-9842..."
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Filter 2: Nome do Curso */}
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
              Filtrar por Nome do Curso
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-lg">
                school
              </span>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl pl-9 pr-8 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="todos">Todos os cursos</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-base pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Filter 3: Categoria */}
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
              Filtrar por Categoria
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-lg">
                category
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl pl-9 pr-8 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="todas">Todas as categorias</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-base pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Filter 4: Estrelas de Avaliação */}
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
              Estrelas de Avaliação
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 text-lg">
                grade
              </span>
              <select
                value={selectedRating}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedRating(val === 'todos' ? 'todos' : Number(val));
                }}
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl pl-9 pr-8 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="todos">Qualquer nota em estrelas</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Estrelas)</option>
                <option value="4">⭐⭐⭐⭐ (4 Estrelas)</option>
                <option value="3">⭐⭐⭐ (3 Estrelas)</option>
                <option value="2">⭐⭐ (2 Estrelas)</option>
                <option value="1">⭐ (1 Estrela)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary text-base pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-text-secondary px-1">
        <span>
          Exibindo <strong className="text-text-primary">{filteredReviews.length}</strong> de{' '}
          <strong>{reviews.length}</strong> opiniões de alunos
        </span>
      </div>

      {/* REVIEWS LIST */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface-raised border border-border-subtle">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">Nenhuma avaliação encontrada</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto mb-4">
            Não encontramos opiniões com os filtros selecionados (aluno, curso, categoria ou estrelas).
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-surface-overlay border border-border-subtle text-xs font-semibold text-text-primary hover:border-primary transition-colors cursor-pointer"
          >
            Redefinir Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-surface-raised border border-border-subtle hover:border-border-subtle/80 transition-all shadow-sm flex flex-col justify-between group"
            >
              <div>
                {/* Header: Student and Course info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {rev.studentAvatar ? (
                      <img
                        src={rev.studentAvatar}
                        alt={rev.studentName}
                        className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                        {rev.studentName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-text-primary">{rev.studentName}</span>
                        {rev.studentCode && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-overlay border border-border-subtle text-text-secondary">
                            {rev.studentCode}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-tertiary block">{rev.studentEmail}</span>
                    </div>
                  </div>

                  {/* Delete button (Opção de excluir) */}
                  <button
                    onClick={() => setReviewToDelete(rev)}
                    className="p-2 rounded-lg text-text-tertiary hover:text-status-danger hover:bg-status-danger/10 transition-colors cursor-pointer"
                    title="Excluir esta avaliação"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>

                {/* Course Evaluated Details */}
                <div className="p-3 rounded-xl bg-surface-overlay/80 border border-border-subtle/70 mb-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">
                      Curso Avaliado:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                      {rev.courseCategory}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-text-primary line-clamp-1">
                    {rev.courseTitle}
                  </h4>
                  {rev.instructor && (
                    <span className="text-[11px] text-text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-text-tertiary">co_present</span>
                      Instrutor(a): {rev.instructor}
                    </span>
                  )}
                </div>

                {/* Stars and Rating */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400 text-base">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>
                          {i < rev.rating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                      {rev.rating}.0
                    </span>
                  </div>
                  <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    {rev.date}
                  </span>
                </div>

                {/* Student's Opinion / Review comment */}
                <div className="relative pl-3 border-l-2 border-amber-400/40 py-0.5 mt-2">
                  <p className="text-xs text-text-secondary italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-3 border-t border-border-subtle/60 flex items-center justify-between text-[11px] text-text-tertiary">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Aluno Verificado
                </span>
                <button
                  onClick={() => setReviewToDelete(rev)}
                  className="text-status-danger hover:underline font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                  Excluir Opinião
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONFIRMATION MODAL: EXCLUIR AVALIAÇÃO */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setReviewToDelete(null)}
          />
          <div className="relative w-full max-w-md bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-150 p-6">
            <div className="w-12 h-12 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center mx-auto mb-4 border border-status-danger/20">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>

            <h3 className="text-base font-bold text-text-primary text-center mb-1">
              Excluir Avaliação do Aluno?
            </h3>
            <p className="text-xs text-text-secondary text-center mb-4 leading-relaxed">
              Você está prestes a remover permanentemente a avaliação postada por{' '}
              <strong className="text-text-primary">{reviewToDelete.studentName}</strong> para o curso{' '}
              <strong className="text-text-primary">{reviewToDelete.courseTitle}</strong>.
            </p>

            <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle text-xs text-text-secondary italic mb-5">
              "{reviewToDelete.comment}"
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReviewToDelete(null)}
                className="px-4 py-2 rounded-xl bg-surface-overlay text-xs font-semibold text-text-secondary hover:text-text-primary border border-border-subtle cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-status-danger text-white text-xs font-semibold hover:bg-status-danger/90 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Sim, Excluir Avaliação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
