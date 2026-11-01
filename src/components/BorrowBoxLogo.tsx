import React from 'react';

interface BorrowBoxSymbolProps {
  className?: string;
  size?: number | string;
  idPrefix?: string;
}

/**
 * Pure scalable SVG symbol for BorrowBox:
 * Custom sculpted gradient 'B' monogram interlaced with an orbital swoosh
 * and an isometric parcel box.
 */
export const BorrowBoxSymbol: React.FC<BorrowBoxSymbolProps> = ({
  className = 'w-9 h-9',
  size,
  idPrefix = 'bb-sym',
}) => {
  const upperGradId = `${idPrefix}-b-upper`;
  const lowerGradId = `${idPrefix}-b-lower`;
  const foldGradId = `${idPrefix}-b-fold`;
  const orbitGradId = `${idPrefix}-orbit`;
  const boxTopId = `${idPrefix}-box-top`;
  const boxLeftId = `${idPrefix}-box-left`;
  const boxRightId = `${idPrefix}-box-right`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="BorrowBox Symbol"
    >
      <defs>
        <linearGradient
          id={upperGradId}
          x1="148"
          y1="92"
          x2="340"
          y2="280"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="48%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>

        <linearGradient
          id={lowerGradId}
          x1="148"
          y1="204"
          x2="388"
          y2="408"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="52%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>

        <linearGradient
          id={foldGradId}
          x1="148"
          y1="196"
          x2="320"
          y2="250"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2E1065" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#2E1065" stopOpacity="0" />
        </linearGradient>

        <linearGradient
          id={orbitGradId}
          x1="96"
          y1="382"
          x2="418"
          y2="216"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#EDE9FE" />
          <stop offset="85%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient
          id={boxTopId}
          x1="196"
          y1="252"
          x2="326"
          y2="306"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3E8FF" />
        </linearGradient>

        <linearGradient
          id={boxLeftId}
          x1="196"
          y1="280"
          x2="260"
          y2="388"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#DDD6FE" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>

        <linearGradient
          id={boxRightId}
          x1="262"
          y1="284"
          x2="328"
          y2="388"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="60%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Right Tapered Crescent of Orbital Swoosh */}
      <path
        d="M332 212C388 215 424 242 414 278C407 302 384 322 352 336C374 318 390 298 394 276C400 246 374 222 332 212Z"
        fill={`url(#${orbitGradId})`}
      />

      {/* Upper 'B' Stem & Loop */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M148 96H282C330 96 360 123 360 164C360 192 343 214 316 225V260H148V96ZM210 148H270C292 148 304 159 304 176C304 193 292 204 270 204H194L210 148Z"
        fill={`url(#${upperGradId})`}
      />

      {/* Soft Contour Shadow */}
      <path
        d="M148 242C176 208 222 194 276 194C302 194 326 200 344 212L316 228C298 216 274 210 248 210C204 210 168 226 148 258V242Z"
        fill={`url(#${foldGradId})`}
      />

      {/* Sculpted Lower 'B' Bowl */}
      <path
        d="M148 252C174 214 222 198 278 198C344 198 388 240 388 304C388 366 342 408 274 408H148V382H256C304 382 334 352 334 306C334 264 304 238 258 238C214 238 178 260 162 296L148 252Z"
        fill={`url(#${lowerGradId})`}
      />

      {/* Separation Plate Around Isometric Parcel Box */}
      <path
        d="M262 240L338 272V364L262 400L186 364V272L262 240Z"
        fill="#0B0F19"
        stroke="#0B0F19"
        strokeWidth="10"
        strokeLinejoin="round"
      />

      {/* Isometric Parcel Box: Top Diamond Face */}
      <path
        d="M262 250L326 277L262 304L198 277L262 250Z"
        fill={`url(#${boxTopId})`}
      />

      {/* Isometric Parcel Box: Left Face */}
      <path
        d="M196 285L257 311V386L196 356V285Z"
        fill={`url(#${boxLeftId})`}
      />

      {/* Isometric Parcel Box: Right Face */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M267 311L328 285V356L267 386V311ZM289 302L310 293V333L299 325L289 336V302Z"
        fill={`url(#${boxRightId})`}
      />

      {/* Foreground Tapered Crescent of Orbital Swoosh */}
      <path
        d="M168 294C116 320 96 356 114 380C132 402 184 404 248 390C194 394 148 388 134 368C122 350 136 322 168 294Z"
        fill={`url(#${orbitGradId})`}
      />

      {/* Radiating Spark Ticks */}
      <rect
        x="304"
        y="216"
        width="10"
        height="26"
        rx="5"
        transform="rotate(14 304 216)"
        fill="#FFFFFF"
      />
      <rect
        x="328"
        y="225"
        width="10"
        height="26"
        rx="5"
        transform="rotate(42 328 225)"
        fill="#FFFFFF"
      />
      <rect
        x="344"
        y="246"
        width="10"
        height="26"
        rx="5"
        transform="rotate(68 344 246)"
        fill="#FFFFFF"
      />
    </svg>
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
 * Complete BorrowBox Brand Logo (Symbol + Typography + optional Tagline)
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
        {/* Ambient Glow behind the logo */}
        <div className="absolute -inset-1 rounded-full bg-[#8B5CF6]/20 blur-md pointer-events-none" />
        <BorrowBoxSymbol
          size={symbolSize}
          className="relative transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(139,92,246,0.35)]"
          idPrefix={idPrefix}
        />
      </div>
      <div className="flex flex-col">
        <span className={`${textSize} text-[#F8FAFC]`}>
          Borrow<span className="text-[#8B5CF6]">Box</span>
        </span>
        {showTagline && (
          <span className="text-[10px] uppercase font-semibold tracking-wider text-[#94A3B8] -mt-1">
            Rent &amp; Lend
          </span>
        )}
      </div>
    </div>
  );
};
