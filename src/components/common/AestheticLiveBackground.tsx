import React, { memo } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const AestheticLiveBackground: React.FC = memo(() => {
  const { isDark } = useTheme();

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none transition-colors duration-500"
      style={{
        backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
      }}
    >
      {/* Ambient gradient mesh container with GPU compositing */}
      <div className="absolute inset-0 w-full h-full filter blur-[70px] sm:blur-[90px] opacity-75 dark:opacity-85 transform-gpu">
        {/* Floating Orb 1: Violet / Lilac (Top Left) */}
        <div
          className={`absolute rounded-full will-change-transform bb-fluid-orb-1 ${
            isDark
              ? 'bg-gradient-to-br from-[#7C3AED]/25 via-[#6366F1]/18 to-transparent'
              : 'bg-gradient-to-br from-[#A78BFA]/30 via-[#C4B5FD]/20 to-transparent'
          }`}
          style={{
            top: '-10%',
            left: '-5%',
            width: 'min(75vw, 650px)',
            height: 'min(75vw, 650px)',
          }}
        />

        {/* Floating Orb 2: Cyan / Soft Sky (Top Right) */}
        <div
          className={`absolute rounded-full will-change-transform bb-fluid-orb-2 ${
            isDark
              ? 'bg-gradient-to-bl from-[#06B6D4]/18 via-[#0284C7]/12 to-transparent'
              : 'bg-gradient-to-bl from-[#38BDF8]/25 via-[#7DD3FC]/18 to-transparent'
          }`}
          style={{
            top: '5%',
            right: '-10%',
            width: 'min(70vw, 600px)',
            height: 'min(70vw, 600px)',
          }}
        />

        {/* Floating Orb 3: Amber / Warm Peach (Bottom Left / Center) */}
        <div
          className={`absolute rounded-full will-change-transform bb-fluid-orb-3 ${
            isDark
              ? 'bg-gradient-to-tr from-[#F59E0B]/12 via-[#D97706]/08 to-transparent'
              : 'bg-gradient-to-tr from-[#FDBA74]/25 via-[#FED7AA]/15 to-transparent'
          }`}
          style={{
            bottom: '10%',
            left: '10%',
            width: 'min(65vw, 550px)',
            height: 'min(65vw, 550px)',
          }}
        />

        {/* Floating Orb 4: Midnight Indigo / Mint Emerald (Bottom Right) */}
        <div
          className={`absolute rounded-full will-change-transform bb-fluid-orb-4 ${
            isDark
              ? 'bg-gradient-to-tl from-[#1E1B4B]/40 via-[#312E81]/20 to-transparent'
              : 'bg-gradient-to-tl from-[#6EE7B7]/20 via-[#A7F3D0]/15 to-transparent'
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
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none"
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
