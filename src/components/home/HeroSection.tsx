import React from 'react';
import {
  ArrowRight,
  Coins,
  Compass,
  MapPin,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ProductListing } from '../../types/marketplace';
import {
  heroItemVariants,
  heroStaggerContainerVariants,
  heroVisualVariants,
} from '../../utils/motionVariants';
import { PageRoute } from '../Navbar';
import { PRODUCT_IMAGES } from '../../assets/imageRegistry';

export interface HeroSectionProps {
  featuredListing?: ProductListing;
  onNavigate: (route: PageRoute) => void;
  onOpenCitySelector?: () => void;
  selectedCity?: string | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onOpenCitySelector,
  selectedCity,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const handleExplore = () => {
    onNavigate({ page: 'browse' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleListItem = () => {
    onNavigate({ page: 'list-item' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="relative pt-6 pb-8 sm:pt-10 sm:pb-12 lg:pt-14 lg:pb-16 overflow-hidden">
      {/* Lightweight radial gradient ambient lighting in warm coral/amber */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1040px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(240,90,54,0.12)_0%,rgba(255,138,101,0.04)_42%,rgba(11,15,25,0)_72%)]"
        aria-hidden="true"
      />

      <div className="bb-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Subtitle, and Two Primary Action Cards */}
          <motion.div
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            variants={heroStaggerContainerVariants}
            className="lg:col-span-7 space-y-6 min-w-0"
          >
            {/* Location Selector Indicator */}
            <motion.div
              variants={heroItemVariants}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#161E2E] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-[#94A3B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F05A36] shrink-0" />
                <span>100% ID Verified Neighbors · India-Wide Escrow</span>
              </span>

              {onOpenCitySelector && (
                <button
                  type="button"
                  onClick={onOpenCitySelector}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F05A36]/10 border border-[#F05A36]/30 text-xs font-semibold text-[#F05A36] dark:text-[#FF8A65] hover:bg-[#F05A36]/20 transition-colors duration-180 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-[#F05A36]" />
                  <span>{selectedCity || 'Select your city'}</span>
                  <span className="text-[10px] opacity-75">Change</span>
                </button>
              )}
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={heroItemVariants}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-[1.08] sm:leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Access More.{' '}
              <span className="bg-gradient-to-r from-[#FF5733] via-[#F05A36] to-[#FF8A65] bg-clip-text text-transparent">
                Own Less.
              </span>
            </motion.h1>

            {/* Supporting Text with Senior UI/UX Polish */}
            <motion.p
              variants={heroItemVariants}
              className="text-[15px] sm:text-lg text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-xl"
            >
              Handover in your neighborhood. Rent professional cameras, gaming gear,
              power tools, and camping equipment from verified local owners in Indian Rupees (₹).
            </motion.p>

            {/* Two Core Purpose Action Cards (RENT AN ITEM & LIST YOUR ITEM) */}
            <motion.div
              variants={heroItemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
            >
              {/* Pillar 1: RENT AN ITEM */}
              <div className="relative rounded-2xl bg-white/90 dark:bg-[#121824] border border-slate-200/90 dark:border-white/[0.1] hover:border-[#F05A36]/50 p-5 space-y-3.5 bb-card-interactive flex flex-col justify-between group shadow-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F05A36] flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Rent an Item</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>Escrow Protected</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#F05A36] transition-colors duration-180">
                    Find and Rent Gear
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    Borrow items from verified owners right in your city. Save up to
                    90% compared to buying brand new gear retail.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleExplore}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F05A36] hover:bg-[#E65100] text-white text-sm font-semibold bb-glow-button cursor-pointer"
                  >
                    <span>Explore Items</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#64748B]">
                    <span>10% weekly discount</span>
                    <span>Direct neighborhood handovers</span>
                  </div>
                </div>
              </div>

              {/* Pillar 2: LIST YOUR ITEM */}
              <div className="relative rounded-2xl bg-white/90 dark:bg-[#121824] border border-slate-200/90 dark:border-white/[0.1] hover:border-[#F05A36]/50 p-5 space-y-3.5 bb-card-interactive flex flex-col justify-between group shadow-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FF8A65] flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>List Your Item</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
                      0% Listing Fee
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#F05A36] transition-colors duration-180">
                    Earn From Your Gear
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    Turn your idle cameras, tools, or electronics into steady income.
                    You retain 100% control over pricing and deposits.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleListItem}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.12] text-slate-800 dark:text-[#F8FAFC] text-sm font-semibold bb-btn-interactive cursor-pointer"
                  >
                    <span>List Your Item</span>
                    <Coins className="w-4 h-4 text-[#F05A36]" />
                  </button>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#64748B]">
                    <span>Verified KYC borrowers</span>
                    <span>Zero idle belongings</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Marketplace Visual Showcase */}
          <motion.div
            initial={prefersReducedMotion ? false : 'hidden'}
            animate="visible"
            variants={heroVisualVariants}
            className="lg:col-span-5 min-w-0"
          >
            <div className="relative rounded-2xl bg-white/90 dark:bg-[#121824] border border-slate-200/90 dark:border-white/[0.1] p-4 sm:p-5 shadow-xl space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Real Neighborhood Gear
                  </span>
                </div>
                <span className="text-[11px] text-[#F05A36] font-semibold">
                  100% Genuine Items
                </span>
              </div>

              {/* Main Featured Item Visual */}
              <div
                onClick={handleExplore}
                className="group relative rounded-xl overflow-hidden bg-slate-950/80 border border-slate-200 dark:border-white/[0.08] cursor-pointer"
              >
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={PRODUCT_IMAGES.sony_camera}
                    alt="Sony Alpha Mirrorless Camera"
                    width={640}
                    height={360}
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200 ease-out"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-sm text-[11px] font-semibold text-white border border-white/10">
                    Cameras &amp; Photography
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-[#F05A36] text-white text-xs font-bold shadow-lg">
                    ₹1,850 / day
                  </div>
                </div>

                <div className="p-3.5 space-y-1.5 bg-slate-900 text-white">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold group-hover:text-[#FF8A65] transition-colors duration-180">
                      Sony Alpha A7 IV + 24-70mm GM
                    </h4>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Available
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>₹12,000 refundable deposit</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#F05A36]" />
                      <span>{selectedCity || 'Browse All India'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Multi-Product Thumbnails Gallery */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div
                  onClick={handleExplore}
                  className="rounded-xl overflow-hidden bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-white/[0.08] hover:border-[#F05A36]/50 p-2 cursor-pointer transition-colors duration-180 text-center group"
                >
                  <img
                    src={PRODUCT_IMAGES.ps5_console}
                    alt="PS5 Console"
                    width={240}
                    height={140}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-14 object-cover rounded-lg group-hover:scale-[1.03] transition-transform duration-200 ease-out"
                  />
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-white mt-1.5 truncate">
                    PS5 Console
                  </p>
                  <p className="text-[10px] text-[#F05A36] font-bold">
                    ₹650/day
                  </p>
                </div>

                <div
                  onClick={handleExplore}
                  className="rounded-xl overflow-hidden bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-white/[0.08] hover:border-[#F05A36]/50 p-2 cursor-pointer transition-colors duration-180 text-center group"
                >
                  <img
                    src={PRODUCT_IMAGES.bosch_drill}
                    alt="Bosch Drill"
                    width={240}
                    height={140}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-14 object-cover rounded-lg group-hover:scale-[1.03] transition-transform duration-200 ease-out"
                  />
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-white mt-1.5 truncate">
                    Bosch Hammer
                  </p>
                  <p className="text-[10px] text-[#F05A36] font-bold">
                    ₹350/day
                  </p>
                </div>

                <div
                  onClick={handleExplore}
                  className="rounded-xl overflow-hidden bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-white/[0.08] hover:border-[#F05A36]/50 p-2 cursor-pointer transition-colors duration-180 text-center group"
                >
                  <img
                    src={PRODUCT_IMAGES.camping_tent}
                    alt="Camping Tent"
                    width={240}
                    height={140}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-14 object-cover rounded-lg group-hover:scale-[1.03] transition-transform duration-200 ease-out"
                  />
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-white mt-1.5 truncate">
                    4-Person Tent
                  </p>
                  <p className="text-[10px] text-[#F05A36] font-bold">
                    ₹400/day
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
