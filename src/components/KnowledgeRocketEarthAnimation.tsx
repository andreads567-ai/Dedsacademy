import React, { useState } from 'react';

interface KnowledgeRocketEarthAnimationProps {
  className?: string;
  onExploreCourses?: () => void;
}

export const KnowledgeRocketEarthAnimation: React.FC<KnowledgeRocketEarthAnimationProps> = ({
  className = '',
  onExploreCourses,
}) => {
  const [isBoosting, setIsBoosting] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [earthFastSpin, setEarthFastSpin] = useState(false);

  const handleRocketClick = () => {
    setIsBoosting(true);
    setActiveTooltip('🚀 Decolando Carreira! +10.000 alunos impulsionados');
    setTimeout(() => {
      setIsBoosting(false);
    }, 2500);
    setTimeout(() => {
      setActiveTooltip(null);
    }, 4000);
  };

  const handleEarthClick = () => {
    setEarthFastSpin(true);
    setActiveTooltip('🌍 Órbita do Conhecimento • Deds Academy');
    setTimeout(() => {
      setEarthFastSpin(false);
    }, 3000);
    setTimeout(() => {
      setActiveTooltip(null);
    }, 4500);
  };

  return (
    <div
      className={`relative select-none pointer-events-none ${className}`}
      aria-label="Animação interativa: Foguete e Terra do Conhecimento Deds Academy"
    >
      {/* Interactive Tooltip Toast */}
      {activeTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-surface-raised/95 border border-primary/50 text-text-primary text-[11px] font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto z-40">
          <span className="w-2 h-2 rounded-full bg-accent-emerald-bright animate-ping" />
          <span>{activeTooltip}</span>
        </div>
      )}

      {/* SVG Canvas for Trajectory, Particles & Connecting Energy Trail */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        viewBox="0 0 340 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for Rocket Trail */}
          <linearGradient id="rocketTrailGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
            <stop offset="35%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="75%" stopColor="#53DE9E" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#73FBB8" stopOpacity="1" />
          </linearGradient>

          {/* Glow filter for neon trail */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="earthGlowRadial" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Orbit Dust Ring behind Earth */}
        <ellipse
          cx="245"
          cy="85"
          rx="68"
          ry="32"
          transform="rotate(-15 245 85)"
          stroke="#10B981"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          strokeOpacity="0.4"
        />

        {/* Curved Rocket Trajectory Line connecting Text to Earth */}
        <path
          d="M 25 210 C 65 195, 115 165, 175 118"
          stroke="url(#rocketTrailGradient)"
          strokeWidth={isBoosting ? '3.5' : '2.2'}
          strokeDasharray="5 7"
          className="transition-all duration-300"
          style={{
            animation: isBoosting
              ? 'trajectoryFlow 0.5s linear infinite'
              : 'trajectoryFlow 1.2s linear infinite',
          }}
          filter="url(#neonGlow)"
        />

        {/* Soft Secondary Energy Arc */}
        <path
          d="M 35 215 C 80 198, 125 170, 180 125"
          stroke="#53DE9E"
          strokeWidth="1"
          strokeOpacity="0.25"
          strokeDasharray="2 8"
        />

        {/* Stardust Sparkles along trajectory */}
        <circle cx="65" cy="188" r="1.5" fill="#73FBB8" style={{ animation: 'stardustTwinkle 2s ease-in-out infinite' }} />
        <circle cx="110" cy="160" r="2" fill="#F59E0B" style={{ animation: 'stardustTwinkle 2.5s ease-in-out infinite 0.6s' }} />
        <circle cx="150" cy="130" r="1.5" fill="#38BDF8" style={{ animation: 'stardustTwinkle 1.8s ease-in-out infinite 1.2s' }} />
        <circle cx="210" cy="45" r="2" fill="#73FBB8" style={{ animation: 'stardustTwinkle 3s ease-in-out infinite 0.3s' }} />
        <circle cx="285" cy="120" r="1.5" fill="#F59E0B" style={{ animation: 'stardustTwinkle 2.2s ease-in-out infinite 0.9s' }} />
        <circle cx="190" cy="80" r="1.2" fill="#FFFFFF" style={{ animation: 'stardustTwinkle 1.5s ease-in-out infinite 0.4s' }} />
      </svg>

      {/* ========================================================
          1. THE ROCKET (Foguete do Conhecimento)
          ======================================================== */}
      <div
        onClick={handleRocketClick}
        title="Clique para acelerar o foguete do conhecimento!"
        className="absolute left-[135px] top-[75px] w-16 h-16 cursor-pointer pointer-events-auto group z-30 transition-transform duration-300"
        style={{
          transform: isBoosting
            ? 'translate(22px, -18px) rotate(42deg) scale(1.15)'
            : 'translate(0, 0) rotate(38deg)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            animation: isBoosting ? 'none' : 'rocketBobbing 3s ease-in-out infinite',
          }}
        >
          {/* Thruster Fire Flame */}
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3.5 origin-top transition-all"
            style={{
              animation: 'rocketFlamePulse 0.35s ease-in-out infinite alternate',
              height: isBoosting ? '34px' : '20px',
            }}
          >
            <svg viewBox="0 0 20 40" fill="none" className="w-full h-full">
              {/* Outer flame */}
              <path
                d="M 10 0 C 3 10, 0 24, 10 40 C 20 24, 17 10, 10 0 Z"
                fill="url(#outerFlameGrad)"
              />
              {/* Inner core flame */}
              <path
                d="M 10 0 C 6 8, 4 18, 10 28 C 16 18, 14 8, 10 0 Z"
                fill="#FFFFFF"
              />
              <defs>
                <linearGradient id="outerFlameGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="25%" stopColor="#73FBB8" />
                  <stop offset="60%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Rocket SVG Vector Body */}
          <svg
            viewBox="0 0 64 64"
            fill="none"
            className="w-12 h-12 filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.5)] group-hover:drop-shadow-[0_4px_18px_rgba(83,222,158,0.9)] transition-all"
          >
            {/* Thruster Nozzle */}
            <path
              d="M 27 50 L 37 50 L 35 55 L 29 55 Z"
              fill="#334155"
              stroke="#64748B"
              strokeWidth="1"
            />

            {/* Left Fin */}
            <path
              d="M 23 37 L 14 47 C 14 47, 18 49, 23 48 Z"
              fill="#10B981"
              stroke="#059669"
              strokeWidth="1"
            />

            {/* Right Fin */}
            <path
              d="M 41 37 L 50 47 C 50 47, 46 49, 41 48 Z"
              fill="#10B981"
              stroke="#059669"
              strokeWidth="1"
            />

            {/* Rocket Main Hull Capsule */}
            <path
              d="M 32 8 C 24 18, 22 36, 23 48 L 41 48 C 42 36, 40 18, 32 8 Z"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1"
            />

            {/* Emerald Center Racing Stripe */}
            <path
              d="M 30 14 C 29 24, 29 38, 30 48 L 34 48 C 35 38, 35 24, 34 14 Z"
              fill="#10B981"
            />

            {/* Cockpit Visor Window */}
            <circle cx="32" cy="27" r="5" fill="#0B0F17" stroke="#53DE9E" strokeWidth="1.5" />
            <circle cx="30.5" cy="25.5" r="1.5" fill="#73FBB8" />

            {/* Nose Cone Tip */}
            <path
              d="M 32 8 C 29 12, 28 15, 28 17 L 36 17 C 36 15, 35 12, 32 8 Z"
              fill="#059669"
            />
          </svg>
        </div>

        {/* Hover Micro Badge */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-primary text-black whitespace-nowrap shadow-md">
            Decolar
          </span>
        </div>
      </div>

      {/* ========================================================
          2. THE PLANET EARTH (Terra do Conhecimento 3D)
          ======================================================== */}
      <div
        className="absolute right-4 top-2 w-[115px] h-[115px] flex items-center justify-center cursor-pointer pointer-events-auto group z-20"
        onClick={handleEarthClick}
        title="Terra do Conhecimento Deds Academy - Clique para girar mais rápido!"
      >
        {/* Soft Atmosphere Radial Halo */}
        <div
          className="absolute inset-[-14px] rounded-full bg-accent-emerald-bright/15 blur-xl pointer-events-none group-hover:bg-accent-emerald-bright/25 transition-colors"
          style={{ animation: 'pulseHalo 4s ease-in-out infinite' }}
        />

        {/* Earth Sphere Container */}
        <div
          className="relative w-[100px] h-[100px] rounded-full overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-primary/40 group-hover:border-primary transition-all duration-500"
          style={{
            background: 'radial-gradient(circle at 32% 28%, #0f766e 0%, #064e3b 45%, #022c22 80%, #031510 100%)',
          }}
        >
          {/* Animated Scrolling Continents Texture */}
          <div
            className="absolute inset-0 w-[200%] h-full flex"
            style={{
              animation: earthFastSpin
                ? 'earthTextureMove 5s linear infinite'
                : 'earthTextureMove 18s linear infinite',
            }}
          >
            {/* Tile 1 Continents */}
            <svg
              className="w-1/2 h-full shrink-0"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Stylized Continents & Islands */}
              <path
                d="M 12 25 Q 22 18, 32 28 Q 42 22, 38 42 Q 28 48, 20 40 Z"
                fill="#34D399"
                fillOpacity="0.8"
              />
              <path
                d="M 28 52 Q 38 46, 44 60 Q 36 78, 24 72 Q 20 60, 28 52 Z"
                fill="#10B981"
                fillOpacity="0.85"
              />
              <path
                d="M 52 18 Q 72 15, 82 26 Q 78 40, 62 38 Q 50 30, 52 18 Z"
                fill="#53DE9E"
                fillOpacity="0.75"
              />
              <path
                d="M 60 45 Q 75 42, 85 55 Q 80 75, 68 70 Q 56 58, 60 45 Z"
                fill="#34D399"
                fillOpacity="0.8"
              />
              <path
                d="M 75 80 Q 88 78, 92 88 Q 80 95, 72 88 Z"
                fill="#10B981"
                fillOpacity="0.7"
              />
              {/* Tech connection dots on globe */}
              <circle cx="28" cy="34" r="1.5" fill="#FFFFFF" />
              <circle cx="36" cy="62" r="1.5" fill="#F59E0B" />
              <circle cx="68" cy="28" r="1.5" fill="#FFFFFF" />
              <circle cx="72" cy="58" r="1.5" fill="#38BDF8" />
            </svg>

            {/* Tile 2 Continents (Seamless Loop) */}
            <svg
              className="w-1/2 h-full shrink-0"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 12 25 Q 22 18, 32 28 Q 42 22, 38 42 Q 28 48, 20 40 Z"
                fill="#34D399"
                fillOpacity="0.8"
              />
              <path
                d="M 28 52 Q 38 46, 44 60 Q 36 78, 24 72 Q 20 60, 28 52 Z"
                fill="#10B981"
                fillOpacity="0.85"
              />
              <path
                d="M 52 18 Q 72 15, 82 26 Q 78 40, 62 38 Q 50 30, 52 18 Z"
                fill="#53DE9E"
                fillOpacity="0.75"
              />
              <path
                d="M 60 45 Q 75 42, 85 55 Q 80 75, 68 70 Q 56 58, 60 45 Z"
                fill="#34D399"
                fillOpacity="0.8"
              />
              <path
                d="M 75 80 Q 88 78, 92 88 Q 80 95, 72 88 Z"
                fill="#10B981"
                fillOpacity="0.7"
              />
              <circle cx="28" cy="34" r="1.5" fill="#FFFFFF" />
              <circle cx="36" cy="62" r="1.5" fill="#F59E0B" />
              <circle cx="68" cy="28" r="1.5" fill="#FFFFFF" />
              <circle cx="72" cy="58" r="1.5" fill="#38BDF8" />
            </svg>
          </div>

          {/* Latitude & Longitude Digital Grid Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100">
            <ellipse cx="50" cy="50" rx="48" ry="24" fill="none" stroke="#53DE9E" strokeWidth="0.5" strokeDasharray="2 3" />
            <ellipse cx="50" cy="50" rx="48" ry="40" fill="none" stroke="#53DE9E" strokeWidth="0.5" strokeDasharray="2 3" />
            <line x1="50" y1="2" x2="50" y2="98" stroke="#53DE9E" strokeWidth="0.5" strokeDasharray="2 3" />
            <ellipse cx="50" cy="50" rx="24" ry="48" fill="none" stroke="#53DE9E" strokeWidth="0.5" strokeDasharray="2 3" />
          </svg>

          {/* 3D Inner Spherical Shadow & Lighting Mask */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow:
                'inset -16px -16px 30px rgba(0, 0, 0, 0.9), inset 10px 10px 22px rgba(115, 251, 184, 0.45)',
            }}
          />

          {/* Top-Left Specular Reflection */}
          <div className="absolute top-2 left-3 w-7 h-4 rounded-full bg-white/20 blur-[2px] -rotate-30 pointer-events-none" />
        </div>

        {/* Orbit Path 3D Ring */}
        <div
          className="absolute inset-[-18px] rounded-full border border-primary/20 pointer-events-none"
          style={{
            transform: 'rotateX(72deg) rotateY(-16deg)',
          }}
        />

        {/* ========================================================
            3. ORBITING KNOWLEDGE ELEMENTS (Capelo, Dev, Estrela)
            ======================================================== */}

        {/* Orbit Item 1: Capelo de Formatura (Educação / Diploma) */}
        <div
          className="absolute w-7 h-7 flex items-center justify-center pointer-events-auto group/item"
          style={{
            animation: 'orbitKnowledge1 14s linear infinite',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveTooltip('🎓 Certificado Próprio Válido para Horas Complementares (Lei 9.394/96)');
          }}
        >
          <div className="w-7 h-7 rounded-full bg-[#111827] border border-primary/60 text-primary flex items-center justify-center shadow-lg hover:scale-125 transition-transform hover:bg-primary hover:text-black">
            <span className="material-symbols-outlined text-[15px]">school</span>
          </div>
        </div>

        {/* Orbit Item 2: Símbolo Dev / Código ({ }) */}
        <div
          className="absolute w-7 h-7 flex items-center justify-center pointer-events-auto group/item"
          style={{
            animation: 'orbitKnowledge2 14s linear infinite',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveTooltip('💻 Tecnologias & Programação de Ponta');
          }}
        >
          <div className="w-7 h-7 rounded-full bg-[#111827] border border-status-info/60 text-status-info flex items-center justify-center shadow-lg hover:scale-125 transition-transform hover:bg-status-info hover:text-black font-mono font-bold text-xs">
            {'{}'}
          </div>
        </div>

        {/* Orbit Item 3: Estrela de Conquista & Carreira */}
        <div
          className="absolute w-7 h-7 flex items-center justify-center pointer-events-auto group/item"
          style={{
            animation: 'orbitKnowledge3 14s linear infinite',
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveTooltip('⭐ Conquiste Promoções e Novas Oportunidades');
          }}
        >
          <div className="w-7 h-7 rounded-full bg-[#111827] border border-accent-gold/60 text-accent-gold flex items-center justify-center shadow-lg hover:scale-125 transition-transform hover:bg-accent-gold hover:text-black">
            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          </div>
        </div>
      </div>

      {/* Floating Micro Label */}
      <div className="absolute right-6 -bottom-2 pointer-events-none">
        <span className="text-[10px] font-bold text-primary/70 tracking-widest uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald-bright animate-ping" />
          Deds Orbit
        </span>
      </div>
    </div>
  );
};
