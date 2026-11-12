import React from 'react';
import { NeighborHandshakeSymbol } from './ui/BrandLogo';

interface BorrowBoxSymbolProps {
  className?: string;
  size?: number | string;
  idPrefix?: string;
}

/**
 * BorrowBoxSymbol - Re-exports the new Neighbor Handshake SVG symbol
 * (Option D: The Neighbor Handshake)
 */
export const BorrowBoxSymbol: React.FC<BorrowBoxSymbolProps> = ({
  className = 'w-9 h-9',
  size,
  idPrefix = 'bb-sym',
}) => {
  return (
    <NeighborHandshakeSymbol
      className={className}
      size={size}
      idPrefix={idPrefix}
    />
  );
};

interface BorrowBoxLogoProps {
  className?: string;
  symbolSize?: number | string;
  textSize?: string;
  showTagline?: boolean;
  idPrefix?: string;
}

/**
 * Complete BorrowBox Brand Logo (Symbol + Modern Typography + optional Tagline)
 * Updated with Option D: "The Neighbor Handshake" & Warm Sunset Coral Palette
 */
export const BorrowBoxLogo: React.FC<BorrowBoxLogoProps> = ({
  className = 'inline-flex items-center gap-2.5',
  symbolSize = '2.25rem',
  textSize = 'text-xl font-bold tracking-tight',
  showTagline = false,
  idPrefix = 'bb-logo',
}) => {
  return (
    <div className={className}>
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Warm Sunset Ambient Glow */}
        <div className="absolute -inset-1 rounded-full bg-[#F05A36]/20 blur-md pointer-events-none" />
        <NeighborHandshakeSymbol
          size={symbolSize}
          className="relative transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(240,90,54,0.35)]"
          idPrefix={idPrefix}
        />
      </div>
      <div className="flex flex-col">
        <span className={`${textSize} text-slate-900 dark:text-[#F8FAFC] font-sans`}>
          BORROW<span className="text-[#F05A36] ml-0.5">BOX</span>
        </span>
        {showTagline && (
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-[#94A3B8] -mt-1">
            Neighborhood Rentals
          </span>
        )}
      </div>
    </div>
  );
};
