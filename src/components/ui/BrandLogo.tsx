import React from 'react';

export interface BrandLogoProps {
  className?: string;
  size?: number | string;
  showWordmark?: boolean;
  showTagline?: boolean;
  idPrefix?: string;
}

/**
 * BrandLogo (Option D: "The Neighbor Handshake")
 *
 * Geometric, modern letter 'B' monogram whose inner fold seamlessly forms
 * two hands clasping/handshaking around an isometric rental box.
 * Warm sunset coral (#F05A36), warm amber (#FF8A65, #FFB74D), and trust emerald (#10B981).
 */
export const NeighborHandshakeSymbol: React.FC<{
  size?: number | string;
  className?: string;
  idPrefix?: string;
}> = ({ size = '2.25rem', className = '', idPrefix = 'bb-handshake' }) => {
  const coralGradId = `${idPrefix}-coral`;
  const amberGradId = `${idPrefix}-amber`;
  const boxTopId = `${idPrefix}-box-top`;
  const boxLeftId = `${idPrefix}-box-left`;
  const boxRightId = `${idPrefix}-box-right`;
  const trustGradId = `${idPrefix}-trust`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="BorrowBox Neighbor Handshake Symbol"
    >
      <defs>
        {/* Coral Gradient (Left hand & upper 'B' stem) */}
        <linearGradient
          id={coralGradId}
          x1="12"
          y1="16"
          x2="78"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FF7A50" />
          <stop offset="50%" stopColor="#F05A36" />
          <stop offset="100%" stopColor="#D9381E" />
        </linearGradient>

        {/* Warm Amber / Peach Gradient (Right hand & lower 'B' loop) */}
        <linearGradient
          id={amberGradId}
          x1="30"
          y1="45"
          x2="88"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFB74D" />
          <stop offset="45%" stopColor="#FF8A65" />
          <stop offset="100%" stopColor="#F05A36" />
        </linearGradient>

        {/* Isometric Rental Box - Top Face */}
        <linearGradient
          id={boxTopId}
          x1="40"
          y1="38"
          x2="60"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFE0B2" />
          <stop offset="100%" stopColor="#FFCC80" />
        </linearGradient>

        {/* Isometric Rental Box - Left Face */}
        <linearGradient
          id={boxLeftId}
          x1="38"
          y1="46"
          x2="50"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FF8A65" />
          <stop offset="100%" stopColor="#F05A36" />
        </linearGradient>

        {/* Isometric Rental Box - Right Face */}
        <linearGradient
          id={boxRightId}
          x1="50"
          y1="46"
          x2="62"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#E65100" />
          <stop offset="100%" stopColor="#BF360C" />
        </linearGradient>

        {/* Trust Node Emerald Gradient */}
        <linearGradient
          id={trustGradId}
          x1="45"
          y1="45"
          x2="55"
          y2="55"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Main Letter 'B' Backbone and Upper Loop (Forms hand 1 sweeping down) */}
      <path
        d="M 22 14
           L 54 14
           C 68 14 78 22 78 35
           C 78 44 72 50 63 53
           L 50 53
           L 46 45
           L 54 45
           C 60 45 64 41 64 35
           C 64 29 60 25 54 25
           L 34 25
           L 34 86
           L 22 86
           Z"
        fill={`url(#${coralGradId})`}
      />

      {/* Lower Loop of 'B' (Forms hand 2 sweeping up into the handshake) */}
      <path
        d="M 34 86
           L 60 86
           C 74 86 84 76 84 62
           C 84 52 76 45 66 42
           L 62 50
           C 68 53 72 57 72 62
           C 72 70 66 76 58 76
           L 34 76
           Z"
        fill={`url(#${amberGradId})`}
      />

      {/* Clasping Handshake Grip / Interlocking Fingers (The handshake fold) */}
      {/* Hand 1 Finger Clasp: Slanted cuff reaching right */}
      <path
        d="M 34 45
           L 48 45
           C 51 45 53 47 53 50
           L 53 52
           C 53 54 51 56 48 56
           L 34 56
           Z"
        fill={`url(#${coralGradId})`}
      />

      {/* Hand 2 Finger Clasp: Interlocking fingers reaching left */}
      <path
        d="M 66 52
           L 52 52
           C 49 52 47 54 47 57
           L 47 59
           C 47 62 49 64 52 64
           L 66 64
           Z"
        fill={`url(#${amberGradId})`}
      />

      {/* Isometric Rental Box in the Center of Handshake */}
      {/* Box Top Face */}
      <path
        d="M 50 39
           L 59 44
           L 50 49
           L 41 44
           Z"
        fill={`url(#${boxTopId})`}
      />

      {/* Box Left Face */}
      <path
        d="M 41 44
           L 50 49
           L 50 59
           L 41 54
           Z"
        fill={`url(#${boxLeftId})`}
      />

      {/* Box Right Face */}
      <path
        d="M 50 49
           L 59 44
           L 59 54
           L 50 59
           Z"
        fill={`url(#${boxRightId})`}
      />

      {/* Box Tape / Parcel Ribbon */}
      <path
        d="M 50 39 L 50 49 L 50 59"
        stroke="#FFF8E1"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Peer-to-Peer Trust Node (Emerald verification jewel at clasp point) */}
      <circle
        cx="50"
        cy="50"
        r="2.5"
        fill={`url(#${trustGradId})`}
      />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'inline-flex items-center gap-2.5',
  size = '2.25rem',
  showWordmark = true,
  showTagline = false,
  idPrefix = 'bb-logo',
}) => {
  return (
    <div className={className}>
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Warm Sunset Ambient Glow */}
        <div className="absolute -inset-1 rounded-full bg-[#F05A36]/20 blur-md pointer-events-none" />
        <NeighborHandshakeSymbol
          size={size}
          className="relative transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(240,90,54,0.35)]"
          idPrefix={idPrefix}
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC] font-sans">
            BORROW<span className="text-[#F05A36] ml-0.5">BOX</span>
          </span>
          {showTagline && (
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-[#94A3B8] -mt-1">
              Neighborhood Rentals
            </span>
          )}
        </div>
      )}
    </div>
  );
};

