import React from 'react';
import { Category } from '../types';

interface CategoriesSectionProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categorias-section" className="w-full py-16 lg:py-20 bg-surface">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider">
              Trilhas de Aprendizado
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-text-primary mt-1">
              Categorias Mais Procuradas
            </h2>
          </div>
          <p className="font-body-md text-body-md text-text-tertiary max-w-md">
            Especialize-se nas áreas que lideram contratações e maiores faixas salariais no mercado nacional e internacional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.name)}
                className={`group p-5 rounded-xl text-left transition-all duration-300 flex flex-col items-start gap-4 border cursor-pointer ${
                  isSelected
                    ? 'bg-surface-overlay border-primary shadow-[0_0_20px_-5px_rgba(0,176,116,0.3)]'
                    : 'bg-surface-raised border-border-subtle hover:bg-surface-overlay hover:border-border-strong'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-overlay group-hover:bg-primary-container group-hover:text-on-primary text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-headline-md">{cat.icon}</span>
                </div>
                <div>
                  <h4
                    className={`font-headline-sm text-headline-sm font-bold transition-colors ${
                      isSelected ? 'text-primary' : 'text-text-primary group-hover:text-primary'
                    }`}
                  >
                    {cat.name}
                  </h4>
                  <span className="font-body-sm text-body-sm text-text-tertiary mt-1 block">
                    {cat.courseCount} cursos disponíveis
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
