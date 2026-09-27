import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickGuide {
  id: string;
  icon: string;
  stickerEmoji: string;
  badge: string;
  title: string;
  shortDesc: string;
  fullTip: string;
  colorClass: string;
  badgeBg: string;
  borderColor: string;
}

const KNOWLEDGE_STICKERS: QuickGuide[] = [
  {
    id: 'certificado',
    icon: 'workspace_premium',
    stickerEmoji: '🎓',
    badge: 'Horas Complementares',
    title: 'Certificado Extracurricular',
    shortDesc: 'Emissão 100% digital com QR Code e autenticidade.',
    fullTip: 'Assim que concluir 100% das aulas e exercícios do seu curso, o certificado oficial com carga horária, nota e QR Code de autenticação para atividades complementares universitárias é liberado imediatamente para download na sua Área do Aluno.',
    colorClass: 'text-accent-gold',
    badgeBg: 'bg-accent-gold/15 text-accent-gold border-accent-gold/30',
    borderColor: 'border-accent-gold/40',
  },
  {
    id: 'sla',
    icon: 'bolt',
    stickerEmoji: '⚡',
    badge: 'Atendimento Ágil',
    title: 'Fila de Resposta Rápida',
    shortDesc: 'Retorno entre 2h e 24h com protocolo auditado.',
    fullTip: 'Os chamados abertos pelo formulário nesta página recebem prioridade máxima na central. Dúvidas críticas e financeiras são respondidas em média em até 2 horas em dias úteis.',
    colorClass: 'text-accent-emerald-bright',
    badgeBg: 'bg-accent-emerald-bright/15 text-accent-emerald-bright border-accent-emerald-bright/30',
    borderColor: 'border-accent-emerald-bright/40',
  },
  {
    id: 'acesso',
    icon: 'devices',
    stickerEmoji: '📱',
    badge: 'Acesso 24/7',
    title: 'Estude Onde e Quando Quiser',
    shortDesc: 'Aulas em Full HD no celular, tablet e computador.',
    fullTip: 'Sua conta não tem limite de dispositivos simultâneos de estudo. O progresso de cada aula é sincronizado em tempo real na nuvem.',
    colorClass: 'text-primary',
    badgeBg: 'bg-primary/15 text-primary border-primary/30',
    borderColor: 'border-primary/40',
  },
  {
    id: 'professores',
    icon: 'psychology',
    stickerEmoji: '💡',
    badge: 'Mentoria Ativa',
    title: 'Instrutores Especialistas',
    shortDesc: 'Fórum exclusivo e tira-dúvidas pedagógico.',
    fullTip: 'Em cada aula há uma aba de comentários e tira-dúvidas. Nossos instrutores respondem detalhadamente orientando sua evolução no código e nas tarefas práticas.',
    colorClass: 'text-accent-cyan',
    badgeBg: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
    borderColor: 'border-accent-cyan/40',
  },
  {
    id: 'garantia',
    icon: 'verified_user',
    stickerEmoji: '🛡️',
    badge: 'Garantia & Transparência',
    title: 'Cancelamento em até 24h',
    shortDesc: 'Estorno processado em até 48 horas úteis.',
    fullTip: 'Se não estiver satisfeito, você pode solicitar cancelamento e reembolso integral em até 24 horas após a matrícula diretamente por esta central de suporte.',
    colorClass: 'text-status-info',
    badgeBg: 'bg-status-info/15 text-status-info border-status-info/30',
    borderColor: 'border-status-info/40',
  },
];

export const FloatingKnowledgeBook: React.FC = () => {
  const [selectedSticker, setSelectedSticker] = useState<QuickGuide | null>(KNOWLEDGE_STICKERS[0]);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  return (
    <div className="bg-surface-raised rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-56 h-56 bg-accent-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header of the Knowledge Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border-subtle mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold shadow-inner">
            <span className="material-symbols-outlined text-2xl">auto_stories</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                Central do Saber & Respostas Rápidas
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                Interativo
              </span>
            </div>
            <p className="text-xs text-text-tertiary mt-0.5">
              Toque nas figurinhas flutuantes para explorar guias imediatos sem precisar esperar a fila.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-text-tertiary">
          <span className="inline-block w-2 h-2 rounded-full bg-accent-emerald-bright animate-ping" />
          <span>Base Atualizada</span>
        </div>
      </div>

      {/* Interactive Visual Stage: The Floating Book with Emerging Stickers & Holographic Rays */}
      <div className="relative min-h-[360px] sm:min-h-[400px] w-full rounded-2xl bg-gradient-to-b from-surface-overlay/90 via-surface-overlay/50 to-surface-container/60 border border-border-subtle/80 p-4 sm:p-6 flex flex-col items-center justify-center overflow-hidden mb-6">
        
        {/* Holographic light beam rising from the book */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-t from-primary/25 via-accent-cyan/15 to-transparent blur-xl pointer-events-none rounded-t-full" />
        
        {/* Light sparkles/particles rising */}
        {[
          { left: '22%', delay: 0, duration: 4, size: 'w-1.5 h-1.5' },
          { left: '38%', delay: 1.2, duration: 3.5, size: 'w-2 h-2' },
          { left: '50%', delay: 0.5, duration: 4.5, size: 'w-1.5 h-1.5' },
          { left: '62%', delay: 2, duration: 3.8, size: 'w-2 h-2' },
          { left: '78%', delay: 0.8, duration: 4.2, size: 'w-1 h-1' },
        ].map((particle, idx) => (
          <motion.div
            key={idx}
            className={`absolute bottom-24 rounded-full bg-accent-emerald-bright ${particle.size} shadow-[0_0_8px_#00B074] pointer-events-none`}
            style={{ left: particle.left }}
            animate={{
              y: [-10, -180],
              opacity: [0, 0.9, 0],
              scale: [0.6, 1.2, 0.4],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* FLOATING STICKERS (FIGURINHAS) COMING OUT OF THE BOOK */}
        <div className="w-full relative z-20 mb-8 sm:mb-12">
          {/* Top Left Sticker: Horas Complementares */}
          <motion.button
            type="button"
            onClick={() => setSelectedSticker(KNOWLEDGE_STICKERS[0])}
            animate={{
              y: [0, -8, 0],
              rotate: [-2, 1, -2],
            }}
            transition={{
              duration: 4.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.08, rotate: 0 }}
            className={`absolute top-0 left-1 sm:left-4 px-3 py-2 rounded-2xl bg-surface-raised/95 border backdrop-blur-md shadow-xl flex items-center gap-2 cursor-pointer transition-colors ${
              selectedSticker?.id === 'certificado'
                ? 'border-accent-gold shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-2 ring-accent-gold/40'
                : 'border-accent-gold/30 hover:border-accent-gold'
            }`}
            title="Clique para ver detalhes do Certificado"
          >
            <span className="text-xl shrink-0 drop-shadow">🎓</span>
            <div className="text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-accent-gold block leading-none">
                Horas Complementares
              </span>
              <span className="text-xs font-bold text-text-primary whitespace-nowrap">
                Válido em Universidades
              </span>
            </div>
            <span className="material-symbols-outlined text-accent-gold text-sm ml-0.5">
              verified
            </span>
          </motion.button>

          {/* Top Right Sticker: Resposta Ágil */}
          <motion.button
            type="button"
            onClick={() => setSelectedSticker(KNOWLEDGE_STICKERS[1])}
            animate={{
              y: [-4, 6, -4],
              rotate: [1, -2, 1],
            }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
            whileHover={{ scale: 1.08, rotate: 0 }}
            className={`absolute top-0 right-1 sm:right-4 px-3 py-2 rounded-2xl bg-surface-raised/95 border backdrop-blur-md shadow-xl flex items-center gap-2 cursor-pointer transition-colors ${
              selectedSticker?.id === 'sla'
                ? 'border-accent-emerald-bright shadow-[0_0_20px_rgba(0,176,116,0.35)] ring-2 ring-accent-emerald-bright/40'
                : 'border-accent-emerald-bright/30 hover:border-accent-emerald-bright'
            }`}
            title="Clique para ver o prazo de resposta"
          >
            <span className="text-xl shrink-0 drop-shadow">⚡</span>
            <div className="text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-accent-emerald-bright block leading-none">
                Resposta Ágil
              </span>
              <span className="text-xs font-bold text-text-primary whitespace-nowrap">
                Em até 2h Úteis
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-accent-emerald-bright animate-pulse ml-0.5" />
          </motion.button>

          {/* Mid Left Sticker: Suporte & Instrutores */}
          <motion.button
            type="button"
            onClick={() => setSelectedSticker(KNOWLEDGE_STICKERS[3])}
            animate={{
              y: [2, -6, 2],
              rotate: [2, -1, 2],
            }}
            transition={{
              duration: 4.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.8,
            }}
            whileHover={{ scale: 1.08, rotate: 0 }}
            className={`absolute top-16 sm:top-20 left-2 sm:left-12 px-3 py-1.5 rounded-xl bg-surface-raised/95 border backdrop-blur-md shadow-lg flex items-center gap-2 cursor-pointer transition-colors ${
              selectedSticker?.id === 'professores'
                ? 'border-accent-cyan shadow-[0_0_18px_rgba(6,182,212,0.3)] ring-2 ring-accent-cyan/40'
                : 'border-accent-cyan/30 hover:border-accent-cyan'
            }`}
            title="Clique para ver suporte com professores"
          >
            <span className="text-lg shrink-0">💡</span>
            <div className="text-left">
              <span className="text-[10px] font-bold text-accent-cyan block leading-none">
                Mentoria Ativa
              </span>
              <span className="text-[11px] font-semibold text-text-primary">
                Tira-Dúvidas nas Aulas
              </span>
            </div>
          </motion.button>

          {/* Mid Right Sticker: Multiplataforma */}
          <motion.button
            type="button"
            onClick={() => setSelectedSticker(KNOWLEDGE_STICKERS[2])}
            animate={{
              y: [-2, 8, -2],
              rotate: [-1, 2, -1],
            }}
            transition={{
              duration: 4.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.1,
            }}
            whileHover={{ scale: 1.08, rotate: 0 }}
            className={`absolute top-16 sm:top-20 right-2 sm:right-12 px-3 py-1.5 rounded-xl bg-surface-raised/95 border backdrop-blur-md shadow-lg flex items-center gap-2 cursor-pointer transition-colors ${
              selectedSticker?.id === 'acesso'
                ? 'border-primary shadow-[0_0_18px_rgba(0,176,116,0.3)] ring-2 ring-primary/40'
                : 'border-primary/30 hover:border-primary'
            }`}
            title="Clique para ver sobre acesso multiplataforma"
          >
            <span className="text-lg shrink-0">📱</span>
            <div className="text-left">
              <span className="text-[10px] font-bold text-primary block leading-none">
                Multiplataforma
              </span>
              <span className="text-[11px] font-semibold text-text-primary">
                Acesso 24/7 Ilimitado
              </span>
            </div>
          </motion.button>

          {/* Center Floating Pill: Garantia 24h */}
          <motion.button
            type="button"
            onClick={() => setSelectedSticker(KNOWLEDGE_STICKERS[4])}
            animate={{
              y: [-4, 4, -4],
              scale: [0.98, 1.02, 0.98],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.06 }}
            className={`absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-surface-raised/95 border backdrop-blur-md shadow-md flex items-center gap-1.5 cursor-pointer transition-colors ${
              selectedSticker?.id === 'garantia'
                ? 'border-status-info shadow-[0_0_15px_rgba(59,130,246,0.35)] ring-2 ring-status-info/40'
                : 'border-status-info/30 hover:border-status-info'
            }`}
            title="Clique para ver política de garantia"
          >
            <span className="text-sm">🛡️</span>
            <span className="text-[10px] font-bold text-status-info whitespace-nowrap">
              Garantia de 24h & Estorno 48h
            </span>
          </motion.button>
        </div>

        {/* ================= 3D FLOATING OPEN BOOK GRAPHIC ================= */}
        <motion.div
          animate={{
            y: [0, -14, 0],
            rotateX: [0, 3, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 flex flex-col items-center mt-20 sm:mt-16 select-none"
        >
          {/* Holographic glowing book SVG with open pages and illuminated spine */}
          <div className="relative w-64 sm:w-80 h-36 sm:h-44 filter drop-shadow-[0_15px_30px_rgba(0,176,116,0.25)]">
            <svg
              viewBox="0 0 320 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              {/* Defs for gradients and glow filters */}
              <defs>
                <linearGradient id="bookCover" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0F382A" />
                  <stop offset="50%" stopColor="#0A281E" />
                  <stop offset="100%" stopColor="#051711" />
                </linearGradient>

                <linearGradient id="bookSpineGlow" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#00E699" />
                  <stop offset="50%" stopColor="#00B074" />
                  <stop offset="100%" stopColor="#006644" />
                </linearGradient>

                <linearGradient id="pageLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E332B" />
                  <stop offset="30%" stopColor="#2A4B3E" />
                  <stop offset="90%" stopColor="#1C382D" />
                  <stop offset="100%" stopColor="#0E211A" />
                </linearGradient>

                <linearGradient id="pageRight" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0E211A" />
                  <stop offset="10%" stopColor="#1C382D" />
                  <stop offset="70%" stopColor="#2A4B3E" />
                  <stop offset="100%" stopColor="#1E332B" />
                </linearGradient>

                <linearGradient id="pageTextGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00B074" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00E699" stopOpacity="0.3" />
                </linearGradient>

                <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Book Hardcover Base (Left & Right Wings) */}
              <path
                d="M 20 135 Q 160 155 160 148 L 160 156 Q 20 144 20 135 Z"
                fill="#051711"
              />
              <path
                d="M 300 135 Q 160 155 160 148 L 160 156 Q 300 144 300 135 Z"
                fill="#051711"
              />

              {/* Book Page Stack Depth - Left and Right Bottom layers */}
              <path
                d="M 25 125 Q 90 136 160 132 L 160 145 Q 90 148 25 137 Z"
                fill="#13241C"
                stroke="#1E3D2F"
                strokeWidth="1"
              />
              <path
                d="M 295 125 Q 230 136 160 132 L 160 145 Q 230 148 295 137 Z"
                fill="#13241C"
                stroke="#1E3D2F"
                strokeWidth="1"
              />

              {/* Top Open Pages (Left Page with Curved Depth) */}
              <path
                d="M 28 85 Q 95 65 160 88 L 160 138 Q 95 115 28 135 Z"
                fill="url(#pageLeft)"
                stroke="#00B074"
                strokeWidth="1.5"
              />

              {/* Top Open Pages (Right Page with Curved Depth) */}
              <path
                d="M 292 85 Q 225 65 160 88 L 160 138 Q 225 115 292 135 Z"
                fill="url(#pageRight)"
                stroke="#00B074"
                strokeWidth="1.5"
              />

              {/* Glowing Book Spine Joint */}
              <path
                d="M 158 87 Q 160 90 162 87 L 162 144 Q 160 146 158 144 Z"
                fill="url(#bookSpineGlow)"
                filter="url(#emeraldGlow)"
              />

              {/* Left Page: Glowing futuristic code and text runes */}
              <g opacity="0.85">
                <line x1="45" y1="92" x2="140" y2="92" stroke="url(#pageTextGlow)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="45" y1="100" x2="125" y2="100" stroke="url(#pageTextGlow)" strokeWidth="2" strokeLinecap="round" />
                <line x1="45" y1="108" x2="135" y2="108" stroke="url(#pageTextGlow)" strokeWidth="2" strokeLinecap="round" />
                <line x1="45" y1="116" x2="110" y2="116" stroke="url(#pageTextGlow)" strokeWidth="2" strokeLinecap="round" />
                <line x1="45" y1="124" x2="130" y2="124" stroke="url(#pageTextGlow)" strokeWidth="2" strokeLinecap="round" />
                
                {/* Left corner mini icon/stamp */}
                <circle cx="52" cy="100" r="1.5" fill="#00E699" />
                <circle cx="52" cy="116" r="1.5" fill="#00E699" />
              </g>

              {/* Right Page: Glowing diagram and knowledge badges */}
              <g opacity="0.85">
                <line x1="180" y1="92" x2="275" y2="92" stroke="url(#pageTextGlow)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="195" y1="100" x2="275" y2="100" stroke="url(#pageTextGlow)" strokeWidth="2" strokeLinecap="round" />
                <line x1="180" y1="108" x2="260" y2="108" stroke="url(#pageTextGlow)" strokeWidth="2" strokeLinecap="round" />
                <line x1="195" y1="116" x2="275" y2="116" stroke="url(#pageTextGlow)" strokeWidth="2" strokeLinecap="round" />
                <line x1="180" y1="124" x2="250" y2="124" stroke="url(#pageTextGlow)" strokeWidth="2" strokeLinecap="round" />

                {/* Right page holographic seal */}
                <circle cx="255" cy="110" r="9" stroke="#F59E0B" strokeWidth="1.5" fill="#F59E0B" fillOpacity="0.15" />
                <path d="M 251 110 L 254 113 L 260 106" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Gold Ribbon Bookmark Hanging Down */}
              <path
                d="M 160 88 Q 166 120 170 155 L 165 152 L 160 155 Z"
                fill="url(#goldRibbon)"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
              />

              {/* Emerging Center Light Rays */}
              <path
                d="M 160 85 L 130 30"
                stroke="#00E699"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <path
                d="M 160 85 L 160 20"
                stroke="#00B074"
                strokeWidth="2"
                strokeDasharray="6 3"
                opacity="0.8"
              />
              <path
                d="M 160 85 L 190 30"
                stroke="#00E699"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* Floating Shadow Under the Book */}
          <motion.div
            animate={{
              scale: [1, 0.85, 1],
              opacity: [0.4, 0.2, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-48 sm:w-60 h-4 rounded-[100%] bg-primary/20 blur-md mt-2"
          />
        </motion.div>

        {/* Prompt to interact */}
        <div className="relative z-10 text-center mt-3">
          <span className="text-[11px] text-text-tertiary font-medium bg-surface-raised/80 px-3 py-1 rounded-full border border-border-subtle">
            ✨ Conhecimento Vivo: Toque em qualquer figurinha para abrir os detalhes
          </span>
        </div>
      </div>

      {/* DETALHE DA FIGURINHA SELECIONADA (CARD EXPANDIDO) */}
      <AnimatePresence mode="wait">
        {selectedSticker && (
          <motion.div
            key={selectedSticker.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-5 rounded-2xl bg-surface-overlay border border-border-subtle shadow-md mb-6 relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-xl bg-surface-raised border border-border-subtle shadow-sm">
                  {selectedSticker.stickerEmoji}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text-primary">
                      {selectedSticker.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${selectedSticker.badgeBg}`}>
                      {selectedSticker.badge}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {selectedSticker.shortDesc}
                  </p>
                </div>
              </div>

              <span className="material-symbols-outlined text-primary text-xl">
                auto_awesome
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed pl-1 sm:pl-14">
              {selectedSticker.fullTip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK FAQ ACCORDION (Perguntas Mais Frequentes dos Alunos) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary">help_outline</span>
            Dúvidas Frequentes Rápidas (FAQ):
          </span>
          <span className="text-[11px] text-text-tertiary">Resolva sem fila</span>
        </div>

        {[
          {
            q: 'Como encontro meus cursos após realizar o pagamento?',
            a: 'Seus cursos são ativados automaticamente na sua "Área do Aluno" no topo da tela. No cartão ou PIX, o acesso ocorre em menos de 1 minuto.',
          },
          {
            q: 'Como emitir e validar o certificado de horas complementares?',
            a: 'Ao atingir 100% de progresso, clique na aba "Certificados" na sua Área do Aluno. Cada certificado possui hash criptográfico e QR Code oficial para validação em faculdades.',
          },
          {
            q: 'Posso baixar as apostilas e código-fonte das aulas?',
            a: 'Sim! Na barra lateral da sala de aula virtual, na aba "Arquivos e Downloads", todos os slides, códigos e exercícios estão disponíveis em PDF e ZIP.',
          },
          {
            q: 'Como solicito alteração de dados cadastrais ou e-mail?',
            a: 'Basta enviar um chamado no formulário acima escolhendo o assunto "Suporte Técnico" e informando o e-mail anterior e o novo e-mail.',
          },
        ].map((item, idx) => {
          const isOpen = activeAccordion === `faq-${idx}`;
          return (
            <div
              key={idx}
              className="rounded-xl bg-surface-overlay border border-border-subtle overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setActiveAccordion(isOpen ? null : `faq-${idx}`)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-semibold text-text-primary hover:text-primary transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base shrink-0">
                    help
                  </span>
                  <span>{item.q}</span>
                </div>
                <span className="material-symbols-outlined text-sm text-text-tertiary shrink-0">
                  {isOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs text-text-secondary border-t border-border-subtle/50 leading-relaxed bg-surface-container-high/30">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
