import React, { memo } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const AestheticLiveBackground: React.FC = memo(() => {
  const { isDark } = useTheme();

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none transition-colors duration-500"
      style={{
        backgroundColor: isDark ? '#0B0F17' : '#FAFAFB',
      }}
    >
      {/* Ambient gradient mesh container with GPU compositing */}
      <div className="absolute inset-0 w-full h-full filter blur-[70px] sm:blur-[90px] opacity-70 dark:opacity-80 transform-gpu">
        {/* Floating Orb 1: Warm Sunset Coral (Top Left) */}
        <div
          className={`absolute rounded-full will-change-transform bb-fluid-orb-1 ${
            isDark
              ? 'bg-gradient-to-br from-[#F05A36]/22 via-[#E65100]/16 to-transparent'
              : 'bg-gradient-to-br from-[#FF8A65]/26 via-[#FFB74D]/18 to-transparent'
          }`}
          style={{
            top: '-10%',
            left: '-5%',
            width: 'min(75vw, 650px)',
            height: 'min(75vw, 650px)',
          }}
        />

        {/* Floating Orb 2: Sunset Amber (Top Right) */}
        <div
          className={`absolute rounded-full will-change-transform bb-fluid-orb-2 ${
            isDark
              ? 'bg-gradient-to-bl from-[#FF8A65]/18 via-[#FFB74D]/12 to-transparent'
              : 'bg-gradient-to-bl from-[#FFA726]/20 via-[#FFE082]/16 to-transparent'
          }`}
          style={{
            top: '5%',
            right: '-10%',
            width: 'min(70vw, 600px)',
            height: 'min(70vw, 600px)',
          }}
        />

        {/* Floating Orb 3: Warm Peach / Sand (Bottom Left / Center) */}
        <div
          className={`absolute rounded-full will-change-transform bb-fluid-orb-3 ${
            isDark
              ? 'bg-gradient-to-tr from-[#FFB74D]/12 via-[#E65100]/08 to-transparent'
              : 'bg-gradient-to-tr from-[#FDBA74]/22 via-[#FED7AA]/14 to-transparent'
          }`}
          style={{
            bottom: '10%',
            left: '10%',
            width: 'min(65vw, 550px)',
            height: 'min(65vw, 550px)',
          }}
        />

        {/* Floating Orb 4: Midnight Navy / Trust Emerald Soft Glow (Bottom Right) */}
        <div
          className={`absolute rounded-full will-change-transform bb-fluid-orb-4 ${
            isDark
              ? 'bg-gradient-to-tl from-[#121824]/50 via-[#10B981]/10 to-transparent'
              : 'bg-gradient-to-tl from-[#10B981]/12 via-[#A7F3D0]/10 to-transparent'
          }`}
          style={{
            bottom: '-10%',
            right: '-5%',
            width: 'min(80vw, 700px)',
            height: 'min(80vw, 700px)',
          }}
        />
      </div>

      {/* Subtle geometric dot matrix overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.045] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${
            isDark ? '#FFFFFF' : '#0F172A'
          } 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
});

AestheticLiveBackground.displayName = 'AestheticLiveBackground';
