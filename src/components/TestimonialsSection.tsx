import React from 'react';
import { Testimonial } from '../types';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  return (
    <section id="depoimentos-section" className="w-full py-16 lg:py-24 bg-surface-base">
      <div className="max-w-content-max-width mx-auto px-gutter-mobile lg:px-gutter-desktop">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="font-label-md text-label-md font-semibold text-primary uppercase tracking-wider">
              Histórias Reais
            </span>
            <h2 className="font-headline-lg text-headline-lg font-bold text-text-primary mt-1">
              O que nossos alunos dizem
            </h2>
          </div>
          <a
            className="text-primary hover:text-accent-emerald-bright font-label-lg text-label-lg flex items-center gap-1 transition-colors cursor-pointer"
            href="#cursos-section"
          >
            <span>Ver todos os depoimentos</span>
            <span className="material-symbols-outlined text-body-lg">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-surface-raised flex flex-col justify-between gap-6 hover:bg-surface-overlay transition-colors border border-border-subtle"
            >
              <div className="flex flex-col gap-3">
                <span className="material-symbols-outlined text-display-mobile text-primary">
                  format_quote
                </span>
                <p className="font-body-md text-body-md text-text-secondary leading-relaxed">
                  {item.quote}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-border-subtle/40">
                <img
                  className="w-12 h-12 rounded-full object-cover ring-1 ring-border-subtle"
                  alt={item.name}
                  src={item.avatar}
                />
                <div>
                  <h4 className="font-headline-sm text-label-lg font-bold text-text-primary">
                    {item.name}
                  </h4>
                  <span className="font-body-sm text-body-sm text-text-tertiary">
                    {item.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
